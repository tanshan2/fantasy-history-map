// ===== 通用操作 =====
(() => {
  const W = App.W, H = App.H, N = App.N, C = App.CELL;
  const O = (App.Ops = {});

  App.afterBigChange = () => {
    if (App.Tools && App.Tools.sel && !App.Tools.selObj()) App.Tools.sel = null;
    App.Geo.dirtyLand = App.Geo.dirtyPol = true;
    if (App.UI) App.UI.refresh();
    App.R.request(); App.autosave();
  };
  App.changed = (what = {}) => {
    if (what.land) App.Geo.dirtyLand = true;
    if (what.tint) App.Geo.dirtyTint = true;
    if (what.pol) App.Geo.dirtyPol = true;
    if (what.ui && App.UI) App.UI.refresh();
    App.R.request(); App.autosave();
  };

  O.pickColor = () => {
    const used = new Set(App.S.nations.map((n) => n.color));
    return App.PALETTE.find((c) => !used.has(c)) || U.rgbToHex(80 + Math.random() * 160, 80 + Math.random() * 160, 80 + Math.random() * 160);
  };
  O.addNation = (o = {}) => {
    const culture = o.culture || 'huaxia';
    const n = { id: App.nid(), name: o.name != null ? o.name : App.Names.nation(culture), color: o.color || O.pickColor(), culture, label: null };
    App.S.nations.push(n); return n;
  };
  O.addProvince = (nid, name, level = 1, parent = 0) => {
    const n = App.nation(nid);
    const p = { id: App.nid(), nation: nid, level, parent, name: name || App.Names.prov(n ? n.culture : 'huaxia', Math.random, level) };
    App.S.provinces.push(p); return p;
  };
  O.deleteNation = (id) => {
    const S = App.S;
    for (let c = 0; c < N; c++) if (S.owner[c] === id) { S.owner[c] = 0; S.prov[c] = 0; S.prov2[c] = 0; S.prov3[c] = 0; }
    S.nations = S.nations.filter((n) => n.id !== id);
    S.provinces = S.provinces.filter((p) => p.nation !== id);
    S.armies = S.armies.filter((a) => a.nation !== id);
    S.arrows = S.arrows.filter((a) => a.nation !== id);
  };
  // 删除行政区（连同其下级）
  O.deleteProvince = (id) => {
    const S = App.S, kill = new Set([id]);
    let grew = true; while (grew) { grew = false; S.provinces.forEach((p) => { if (p.parent && kill.has(p.parent) && !kill.has(p.id)) { kill.add(p.id); grew = true; } }); }
    for (let c = 0; c < N; c++) { if (kill.has(S.prov[c])) S.prov[c] = 0; if (kill.has(S.prov2[c])) S.prov2[c] = 0; if (kill.has(S.prov3[c])) S.prov3[c] = 0; }
    S.provinces = S.provinces.filter((p) => !kill.has(p.id));
  };
  O.cellAt = (wx, wy) => { const x = Math.floor(wx / C), y = Math.floor(wy / C); return x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x; };

  O.flood = (start, same) => {
    const out = [], seen = new Uint8Array(N), q = [start]; seen[start] = 1;
    while (q.length) {
      const c = q.pop(); out.push(c); const x = c % W, y = (c / W) | 0;
      const nb = [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1];
      for (const n of nb) if (n >= 0 && !seen[n] && same(n)) { seen[n] = 1; q.push(n); }
    }
    return out;
  };

  // 把一组格子切成 k 块，返回每格所属块下标
  O.splitCells = (cells, k, r, salt = 0) => {
    const S = App.S;
    k = Math.max(1, Math.min(k, Math.floor(cells.length / 12) || 1));
    if (k === 1) return { k, idx: new Int32Array(cells.length) };
    const inSet = new Uint8Array(N); cells.forEach((c) => (inSet[c] = 1));
    const sample = []; const step = Math.max(1, Math.floor(cells.length / 2500));
    for (let i = 0; i < cells.length; i += step) sample.push(cells[i]);
    const seeds = [sample[Math.floor(r() * sample.length)]];
    const md = new Float32Array(sample.length).fill(Infinity);
    while (seeds.length < k) {
      const s = seeds[seeds.length - 1], sx = s % W, sy = (s / W) | 0; let bi = 0, bd = -1;
      sample.forEach((c, i) => { const d = (c % W - sx) ** 2 + (((c / W) | 0) - sy) ** 2; if (d < md[i]) md[i] = d; const v = md[i] * (0.7 + r() * 0.6); if (v > bd) { bd = v; bi = i; } });
      seeds.push(sample[bi]);
    }
    const sd = salt * 13.7 + 5;
    const who = U.grow(seeds.map((c) => ({ cell: c })), (c) => (inSet[c] ? 1 + U.noise((c % W) / 7 + sd, ((c / W) | 0) / 7, 3) * 1.6 + (S.terrain[c] === 5 || S.terrain[c] === 6 ? 2 : 0) : Infinity));
    const idx = new Int32Array(cells.length);
    cells.forEach((c, j) => {
      let i = who[c];
      if (i < 0) { const x = c % W, y = (c / W) | 0; let bd = Infinity; seeds.forEach((s, t) => { const d = (s % W - x) ** 2 + (((s / W) | 0) - y) ** 2; if (d < bd) { bd = d; i = t; } }); }
      idx[j] = i;
    });
    return { k, idx };
  };

  // 自动划分三级行政区：k1 个省；每省按面积分道；每道按面积分府
  O.autoProvinces = (nid, k1, r = Math.random, opts = {}) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    const cul = n.culture;
    const cells = []; for (let c = 0; c < N; c++) if (S.owner[c] === nid) cells.push(c);
    if (!opts.keepL1) S.provinces.filter((p) => p.nation === nid).forEach((p) => O.deleteProvince(p.id));
    if (!cells.length) return;
    const per2 = opts.per2 || 650, per3 = opts.per3 || 220;
    const sub = (parentCells, level, parent, kk) => {
      const { k, idx } = O.splitCells(parentCells, kk, r, parent ? parent.id : nid);
      const ps = []; for (let i = 0; i < k; i++) ps.push(O.addProvince(nid, App.Names.prov(cul, r, level), level, parent ? parent.id : 0));
      const groups = ps.map(() => []);
      parentCells.forEach((c, j) => { App.provArr(level)[c] = ps[idx[j]].id; groups[idx[j]].push(c); });
      if (level < 3) ps.forEach((p, i) => { const g = groups[i]; if (!g.length) return; const kn = level === 1 ? Math.round(g.length / per2) : Math.round(g.length / per3); sub(g, level + 1, p, U.clamp(kn, 1, level === 1 ? 6 : 5)); });
    };
    if (opts.keepL1) {
      // 已有一级区：只往下细分
      S.provinces.filter((p) => p.nation === nid && (p.level || 1) === 1).forEach((p) => {
        S.provinces.filter((q) => q.parent === p.id).forEach((q) => O.deleteProvince(q.id));
        const g = cells.filter((c) => S.prov[c] === p.id); if (!g.length) return;
        g.forEach((c) => { S.prov2[c] = 0; S.prov3[c] = 0; });
        const fake = { id: p.id };
        const { k, idx } = O.splitCells(g, U.clamp(Math.round(g.length / per2), 1, 6), r, p.id);
        const ps = []; for (let i = 0; i < k; i++) ps.push(O.addProvince(nid, App.Names.prov(cul, r, 2), 2, p.id));
        const groups = ps.map(() => []);
        g.forEach((c, j) => { S.prov2[c] = ps[idx[j]].id; groups[idx[j]].push(c); });
        ps.forEach((q, i) => groups[i].length && sub(groups[i], 3, q, U.clamp(Math.round(groups[i].length / per3), 1, 5)));
        void fake;
      });
      return;
    }
    sub(cells, 1, null, k1);
  };

  // 自动生成城市
  O.autoCities = (nid, r = Math.random, density = 1) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    App.Geo.dirtyPol = true; App.Geo.update();
    const near = (x, y, d) => S.cities.some((c) => U.dist(c.x, c.y, x, y) < d);
    const add = (x, y, type) => { if (near(x, y, 22)) return; S.cities.push({ id: App.nid(), x, y, type, name: App.Names.city(n.culture, r) }); };
    if (!S.cities.some((c) => c.type === 'capital' && S.owner[O.cellAt(c.x, c.y)] === nid)) {
      const info = App.Geo.labels.get(nid); if (info) add(info.x + C * 3, info.y + C * 3, 'capital');
    }
    const lvUse = S.provinces.some((p) => p.nation === nid && p.level === 2) ? 2 : 1;
    S.provinces.filter((p) => p.nation === nid && (p.level || 1) === lvUse).forEach((p) => {
      const info = App.Geo.provLabels.get(p.id); if (!info) return;
      add(info.x + (r() - 0.5) * 30, info.y + (r() - 0.5) * 30 + 14, info.n > 900 ? 'large' : 'medium');
    });
    const cells = []; for (let c = 0; c < N; c++) if (S.owner[c] === nid) cells.push(c);
    const extra = Math.round((cells.length / 700) * density);
    for (let i = 0; i < extra * 2 && extra > 0; i++) {
      const c = cells[Math.floor(r() * cells.length)], x = c % W, y = (c / W) | 0;
      const coast = [c - 1, c + 1, c - W, c + W].some((m) => m >= 0 && m < N && S.terrain[m] < 2);
      const t = S.terrain[c];
      if (t === 6 || (t === 7 && r() < 0.7)) continue;
      add((x + 0.5) * C, (y + 0.5) * C, coast && r() < 0.6 ? 'port' : t === 5 && r() < 0.4 ? 'fortress' : r() < 0.6 ? 'small' : 'village');
    }
  };

  // 区域内随机重命名
  O.renameAll = (nid, r = Math.random) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    n.name = App.Names.nation(n.culture, r);
    S.provinces.filter((p) => p.nation === nid).forEach((p) => (p.name = App.Names.prov(n.culture, r, p.level || 1)));
    S.cities.forEach((ct) => { if (S.owner[O.cellAt(ct.x, ct.y)] === nid) ct.name = App.Names.city(n.culture, r); });
  };

  // 邻接着色，避免相邻国家颜色相近
  O.recolor = (r = Math.random) => {
    const S = App.S, adj = new Map();
    S.nations.forEach((n) => adj.set(n.id, new Set()));
    for (let c = 0; c < N; c++) {
      const a = S.owner[c]; if (!a) continue;
      [c + 1, c + W, c + 3, c + 3 * W].forEach((m) => { if (m < N) { const b = S.owner[m]; if (b && b !== a && adj.has(b)) { adj.get(a).add(b); adj.get(b).add(a); } } });
    }
    const pal = App.PALETTE.slice().sort(() => r() - 0.5); const cnt = new Map();
    S.nations.slice().sort((a, b) => adj.get(b.id).size - adj.get(a.id).size).forEach((n, i) => {
      const used = new Set([...adj.get(n.id)].map((id) => App.nation(id).color));
      const cand = pal.filter((c) => !used.has(c)); const pool = cand.length ? cand : pal;
      let best = pool[0], bc = Infinity; pool.forEach((c) => { const k = cnt.get(c) || 0; if (k < bc) { bc = k; best = c; } });
      n.color = best; cnt.set(best, (cnt.get(best) || 0) + 1);
    });
  };
})();

// ---- 三级行政区工具函数 ----
(() => {
  const O = App.Ops;
  O.ancestors = (p) => { const a = []; let q = p, g = 0; while (q && g++ < 5) { a.push(q); q = q.parent ? App.province(q.parent) : null; } return a; };
  O.setProvCell = (c, p) => {
    O.ancestors(p).forEach((q) => (App.provArr(q.level || 1)[c] = q.id));
    for (let lv = (p.level || 1) + 1; lv <= 3; lv++) {
      const A = App.provArr(lv), cur = App.province(A[c]);
      if (cur && !O.ancestors(cur).some((q) => q.id === p.id)) A[c] = 0;
    }
  };
  O.clearProvCell = (c, lv = 1) => { for (let l = lv; l <= 3; l++) App.provArr(l)[c] = 0; };
  O.clearAllProv = (c) => O.clearProvCell(c, 1);
})();

// ---- 行政区：补全新涂的地块、一键划分全部 ----
(() => {
  const O = App.Ops, W = App.W, H = App.H, N = App.N;
  // 已有行政区的国家：把新扩张、还没归属的地块并入最近的省/道/府
  O.fillUnassigned = () => {
    const S = App.S, P1 = S.prov, P2 = S.prov2, P3 = S.prov3, O_ = S.owner;
    const has = new Set(S.provinces.map((p) => p.nation));
    const q = []; let changed = false;
    for (let c = 0; c < N; c++) if (O_[c] && P1[c] && has.has(O_[c])) q.push(c);
    for (let h = 0; h < q.length; h++) {
      const c = q[h], x = c % W, y = (c / W) | 0;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
        if (n < 0 || P1[n] || O_[n] !== O_[c]) continue;
        P1[n] = P1[c]; P2[n] = P2[c]; P3[n] = P3[c]; q.push(n); changed = true;
      }
    }
    // 道、府层级里的空洞也补上（同一上级内）
    for (const [A, Up] of [[P2, P1], [P3, P2]]) {
      const qq = []; for (let c = 0; c < N; c++) if (A[c]) qq.push(c);
      for (let h = 0; h < qq.length; h++) {
        const c = qq[h], x = c % W, y = (c / W) | 0;
        for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
          if (n < 0 || A[n] || Up[n] !== Up[c] || O_[n] !== O_[c]) continue;
          A[n] = A[c]; if (A === P2) P3[n] = P3[c]; qq.push(n); changed = true;
        }
      }
    }
    return changed;
  };
  // 一键：给所有还没有行政区的国家自动划分三级
  O.autoAllProvinces = (all = false, r = Math.random) => {
    const S = App.S, cnt = new Map();
    for (let c = 0; c < N; c++) if (S.owner[c]) cnt.set(S.owner[c], (cnt.get(S.owner[c]) || 0) + 1);
    let k = 0;
    S.nations.forEach((n) => {
      if (!all && S.provinces.some((p) => p.nation === n.id)) return;
      const m = cnt.get(n.id) || 0; if (!m) return;
      O.autoProvinces(n.id, U.clamp(Math.round(m / 1300), 1, 10), r); k++;
    });
    return k;
  };
})();
