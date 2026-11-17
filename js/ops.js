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
    const n = { id: App.nid(), name: o.name || App.Names.nation(culture), color: o.color || O.pickColor(), culture, label: null };
    App.S.nations.push(n); return n;
  };
  O.addProvince = (nid, name) => {
    const n = App.nation(nid);
    const p = { id: App.nid(), nation: nid, name: name || App.Names.prov(n ? n.culture : 'huaxia') };
    App.S.provinces.push(p); return p;
  };
  O.deleteNation = (id) => {
    const S = App.S;
    for (let c = 0; c < N; c++) if (S.owner[c] === id) { S.owner[c] = 0; S.prov[c] = 0; }
    S.nations = S.nations.filter((n) => n.id !== id);
    S.provinces = S.provinces.filter((p) => p.nation !== id);
    S.armies = S.armies.filter((a) => a.nation !== id);
    S.arrows = S.arrows.filter((a) => a.nation !== id);
  };
  O.deleteProvince = (id) => {
    const S = App.S;
    for (let c = 0; c < N; c++) if (S.prov[c] === id) S.prov[c] = 0;
    S.provinces = S.provinces.filter((p) => p.id !== id);
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

  // 自动划分行政区
  O.autoProvinces = (nid, k, r = Math.random) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    const cells = []; for (let c = 0; c < N; c++) if (S.owner[c] === nid) cells.push(c);
    S.provinces.filter((p) => p.nation === nid).forEach((p) => O.deleteProvince(p.id));
    if (!cells.length) return;
    k = Math.max(1, Math.min(k, Math.floor(cells.length / 20) || 1));
    const sample = []; const step = Math.max(1, Math.floor(cells.length / 2500));
    for (let i = 0; i < cells.length; i += step) sample.push(cells[i]);
    const seeds = [sample[Math.floor(r() * sample.length)]];
    const md = new Float32Array(sample.length).fill(Infinity);
    while (seeds.length < k) {
      const s = seeds[seeds.length - 1], sx = s % W, sy = (s / W) | 0; let bi = 0, bd = -1;
      sample.forEach((c, i) => { const d = (c % W - sx) ** 2 + (((c / W) | 0) - sy) ** 2; if (d < md[i]) md[i] = d; const v = md[i] * (0.7 + r() * 0.6); if (v > bd) { bd = v; bi = i; } });
      seeds.push(sample[bi]);
    }
    const provs = seeds.map(() => O.addProvince(nid));
    const sd = U.hash(nid, 3, 9) * 1000;
    const who = U.grow(seeds.map((c) => ({ cell: c })), (c) => (S.owner[c] === nid ? 1 + U.noise((c % W) / 9 + sd, ((c / W) | 0) / 9, 3) * 1.6 + (S.terrain[c] === 5 || S.terrain[c] === 6 ? 2 : 0) : Infinity));
    cells.forEach((c) => {
      let i = who[c];
      if (i < 0) { const x = c % W, y = (c / W) | 0; let bd = Infinity; seeds.forEach((s, j) => { const d = (s % W - x) ** 2 + (((s / W) | 0) - y) ** 2; if (d < bd) { bd = d; i = j; } }); }
      S.prov[c] = provs[i].id;
    });
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
    S.provinces.filter((p) => p.nation === nid).forEach((p) => {
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
    S.provinces.filter((p) => p.nation === nid).forEach((p) => (p.name = App.Names.prov(n.culture, r)));
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
