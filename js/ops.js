// ===== 通用操作 =====
(() => {
  const W = App.W, H = App.H, N = App.N, C = App.CELL;
  const O = (App.Ops = {});

  App.afterBigChange = () => {
    if (App.Tools && App.Tools.hl && !App.nation(App.Tools.hl)) App.Tools.hl = 0;
    if (App.Tools && App.Tools.sel && !App.Tools.selObj()) App.Tools.sel = null;
    App.Geo.dirtyLand = App.Geo.dirtyPol = true;
    if (App.UI) App.UI.refresh();
    App.R.request(); App.autosave();
  };
  App.changed = (what = {}) => {
    if (what.land && App.S.meta.vec) { App.S.meta.vec = null; App.Geo.vecCoast = null; App.Geo.vecKey = null; App.Geo.dirtyPol = true; if (App.UI) App.UI.toast('你修改了陆地，海岸线改为可编辑模式'); }
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
    const nm = name || App.Names.provFor(n, level), p = { id: App.nid(), nation: nid, level, parent, name: typeof nm === "object" ? nm.name : nm };
    if (typeof nm === "object") p.base = nm.base;
    App.S.provinces.push(p); return p;
  };
  O.deleteNation = (id) => {
    const S = App.S;
    for (let c = 0; c < N; c++) if (S.owner[c] === id) { S.owner[c] = 0; S.prov[c] = 0; S.prov2[c] = 0; S.prov3[c] = 0; }
    S.nations = S.nations.filter((n) => n.id !== id);
    S.nations.forEach((v) => { if (v.overlord === id) v.overlord = 0; });
    S.provinces = S.provinces.filter((p) => p.nation !== id);
    S.armies = S.armies.filter((a) => a.nation !== id);
    S.arrows = S.arrows.filter((a) => a.nation !== id);
  };
  // 删除行政区（连同其下级）
  O.deleteProvince = (id) => O.deleteProvinces([id]);
  // 批量删除（连同下级），整张图只扫一遍
  O.deleteProvinces = (ids) => {
    if (!ids.length) return;
    const S = App.S, kill = new Set(ids);
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
  // 1) 种子优先放在城市上（州府、郡治多是大城），其余用远点采样；
  // 2) 扩张代价：过河、翻山很贵（边界自然落在河道、山脊上），再加分形噪声让边界自然弯曲；
  // 3) 迭代调整各块的扩张速度，让大小大致均匀；4) 清除飞块碎片，并入相邻的区。
  // 只在这组格子内部做局部计算（不分配整张地图大小的数组），一次划分全国也很快。
  let LOC = null, RVK = '', RVC = null;
  const riverCached = () => {
    const S = App.S, k = S.rivers.length + ':' + S.rivers.reduce((a, r) => a + (r.pts ? r.pts.length : 0), 0);
    if (k !== RVK || !RVC) { RVC = App.Polity ? App.Polity.riverMask() : new Uint8Array(N); RVK = k; }
    return RVC;
  };
  O.splitCells = (cells, k, r, salt = 0) => {
    const S = App.S, L = cells.length;
    k = Math.max(1, Math.min(k, Math.floor(L / 12) || 1));
    if (k === 1) return { k, idx: new Int32Array(L) };
    if (!LOC) LOC = new Int32Array(N).fill(-1);
    cells.forEach((c, j) => (LOC[c] = j));
    const rv = riverCached(), sd = salt * 13.7 + 5;
    const cost = new Float32Array(L);
    // 「海拔」：平地 0，丘陵 1，山地 2.2，雪山 3；跨越海拔落差的代价高，边界就落在山前、分水岭上，盆地自成一区
    const ELEV = [0, 0, 0, 0.2, 1, 2.2, 3, 0.3, 0, 0.4], elev = new Float32Array(L);
    cells.forEach((c, j) => { const t = S.terrain[c], x = c % W, y = (c / W) | 0; elev[j] = ELEV[t] || 0; cost[j] = 1 + U.fbm(x / 16 + sd, y / 16, 3, 3) * 0.9 + (rv[c] ? 7 : 0) + (t === 5 ? 1.6 : t === 6 ? 2.6 : t === 4 ? 0.4 : 0) + (t === 8 ? 0.8 : 0); });
    const nbs = (j, f) => { const c = cells[j], x = c % W; if (x > 0 && LOC[c - 1] >= 0) f(LOC[c - 1]); if (x < W - 1 && LOC[c + 1] >= 0) f(LOC[c + 1]); if (c >= W && LOC[c - W] >= 0) f(LOC[c - W]); if (c < N - W && LOC[c + W] >= 0) f(LOC[c + W]); };
    const xy = (j) => [cells[j] % W, (cells[j] / W) | 0];
    // 种子（局部下标）
    const ORD = { capital: 0, large: 1, port: 2, medium: 3, small: 4, fortress: 5, pass: 6, village: 7 };
    const cityJ = S.cities.map((ct) => { const c = O.cellAt(ct.x, ct.y); return [c >= 0 ? LOC[c] : -1, ORD[ct.type] ?? 5, c]; }).filter(([j, o, c]) => j >= 0 && o <= 4 && !rv[c]).sort((a, b) => a[1] - b[1]);
    const minSep = Math.sqrt(L / k) * 0.75, seeds = [];
    const far = (j, d) => { const [x, y] = xy(j); return seeds.every((s) => { const [sx, sy] = xy(s); return Math.hypot(sx - x, sy - y) >= d; }); };
    cityJ.forEach(([j]) => { if (seeds.length < k && far(j, minSep)) seeds.push(j); });
    const nCity = seeds.length;
    const step = Math.max(1, Math.floor(L / 2500)), sample = []; for (let j = 0; j < L; j += step) sample.push(j);
    if (!seeds.length) seeds.push(sample[Math.floor(r() * sample.length)]);
    const md = new Float32Array(sample.length).fill(Infinity);
    const upd = (s) => { const [sx, sy] = xy(s); sample.forEach((j, i) => { const [x, y] = xy(j), d = (x - sx) ** 2 + (y - sy) ** 2; if (d < md[i]) md[i] = d; }); };
    seeds.forEach(upd);
    while (seeds.length < k) { let bi = 0, bd = -1; sample.forEach((j, i) => { const v = md[i] * (0.75 + r() * 0.5); if (v > bd) { bd = v; bi = i; } }); seeds.push(sample[bi]); upd(sample[bi]); }
    // 局部多源最短路
    const grow = (mult) => {
      const best = new Float64Array(L).fill(Infinity), who = new Int32Array(L).fill(-1), h = new U.Heap();
      seeds.forEach((s, i) => { best[s] = 0; who[s] = i; h.push(0, s); });
      while (h.size) { const j = h.pop(), d = h.topK; if (d > best[j]) continue; const m = mult[who[j]], si = who[j];
        nbs(j, (q) => { const nd = d + (cost[q] + Math.abs(elev[q] - elev[j]) * 3.2) * m; if (nd < best[q]) { best[q] = nd; who[q] = si; h.push(nd, q); } }); }
      return who;
    };
    // 劳埃德松弛：非城市种子移到所辖区域的中心附近（区域更紧凑，不会细长怪异）
    const fixed = new Set(seeds.slice(0, nCity));
    for (let it = 0; it < 2; it++) {
      const w0 = grow(seeds.map(() => 1)), sx = new Float64Array(k), sy = new Float64Array(k), sn = new Float64Array(k);
      for (let j = 0; j < L; j++) { const i = w0[j]; if (i < 0) continue; const [x, y] = xy(j); sx[i] += x; sy[i] += y; sn[i]++; }
      for (let i = 0; i < k; i++) {
        if (fixed.has(seeds[i]) || !sn[i]) continue;
        const cx = sx[i] / sn[i], cy = sy[i] / sn[i]; let bj = seeds[i], bd = Infinity;
        for (let j = 0; j < L; j++) { if (w0[j] !== i) continue; const [x, y] = xy(j), d = (x - cx) ** 2 + (y - cy) ** 2 + elev[j] * 6 + (rv[cells[j]] ? 4 : 0); if (d < bd) { bd = d; bj = j; } }
        seeds[i] = bj;
      }
    }
    // 均衡目标按「人口」而不是格数：富庶地方的区小，草原荒漠的区大
    const wt = new Float32Array(L); let wsum = 0; cells.forEach((c, j) => { wt[j] = POPW ? POPW[c] : 1; wsum += wt[j]; });
    const target = wsum / k, mult = seeds.map(() => 0.85 + r() * 0.3); let who;
    for (let it = 0; it < 5; it++) {
      who = grow(mult);
      const size = new Float64Array(k); for (let j = 0; j < L; j++) if (who[j] >= 0) size[who[j]] += wt[j];
      let worst = 0; for (let i = 0; i < k; i++) { const q = size[i] / target; worst = Math.max(worst, q, 1 / Math.max(q, 0.05)); mult[i] *= U.clamp(Math.pow(Math.max(q, 0.05), 0.55), 0.6, 1.7); }
      if (worst < 1.6) break;
    }
    // 没扩张到的（隔海的岛）：归最近的种子
    const idx = new Int32Array(L);
    for (let j = 0; j < L; j++) {
      let i = who[j];
      if (i < 0) { const [x, y] = xy(j); let bd = Infinity; seeds.forEach((s, t) => { const [sx, sy] = xy(s), d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd) { bd = d; i = t; } }); }
      idx[j] = i;
    }
    // 众数平滑两遍：磨掉锯齿和犬牙交错
    for (let pass = 0; pass < 2; pass++) {
      const nx = idx.slice();
      for (let j = 0; j < L; j++) {
        const c = cells[j], x = c % W, cnt = new Map(); let own = 0, tot = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; if (x + dx < 0 || x + dx >= W) continue; const q = c + dy * W + dx; if (q < 0 || q >= N) continue; const jq = LOC[q]; if (jq < 0) continue;
          tot++; if (idx[jq] === idx[j]) own++; else cnt.set(idx[jq], (cnt.get(idx[jq]) || 0) + 1);
        }
        if (own <= 2 && tot >= 5) { let bk = -1, bv = 0; cnt.forEach((v, kk) => { if (v > bv) { bv = v; bk = kk; } }); if (bv >= 5 && !rv[c]) nx[j] = bk; }
      }
      idx.set(nx);
    }
    // 清碎片：每块只保留最大连通部分（够大的海岛除外），其余并入接壤最多的相邻块
    const seen = new Uint8Array(L), pieces = [];
    for (let s = 0; s < L; s++) {
      if (seen[s]) continue; const id = idx[s], comp = [s]; seen[s] = 1;
      for (let h = 0; h < comp.length; h++) nbs(comp[h], (q) => { if (!seen[q] && idx[q] === id) { seen[q] = 1; comp.push(q); } });
      pieces.push({ id, comp });
    }
    const biggest = new Map(); pieces.forEach((p) => { if (!biggest.has(p.id) || biggest.get(p.id).comp.length < p.comp.length) biggest.set(p.id, p); });
    pieces.sort((a, b) => a.comp.length - b.comp.length).forEach((p) => {
      if (biggest.get(p.id) === p) return;
      const touch = new Map(); p.comp.forEach((j) => nbs(j, (q) => { if (idx[q] !== p.id) touch.set(idx[q], (touch.get(idx[q]) || 0) + 1); }));
      let to = -1, bt = 0; touch.forEach((v, key) => { if (v > bt) { bt = v; to = key; } });
      if (to < 0) { if (p.comp.length >= (L / k) * 0.3) return; const [x, y] = xy(p.comp[0]); let bd = Infinity; seeds.forEach((s, t) => { const [sx, sy] = xy(s), d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd && t !== p.id) { bd = d; to = t; } }); }
      if (to >= 0) p.comp.forEach((j) => (idx[j] = to));
    });
    cells.forEach((c) => (LOC[c] = -1));
    return { k, idx };
  };

  // 自动划分行政区：数量按「真实面积 ÷ 该制度各级单位的历史典型面积」来定，再受历史上下辖数量范围约束
  // 例如明代一省约 22 万平方公里、一府约 2.5 万、一县约 3500；唐代一道约 40 万、一州约 1.5 万
  const MINC = [0, 120, 45, 22]; // 地图分辨率限制：每级单位至少占的格数（太小的县在地图上画不出来）
  // 人口权重：按土地丰饶度（地貌×气候×河流），富庶平原 1，草原约 0.3，荒漠高原约 0.15
  let POPW = null;
  const buildPopW = () => { const rv = riverCached(); POPW = new Float32Array(N); for (let c = 0; c < N; c++) if (App.S.terrain[c] >= 2) POPW[c] = 0.15 + 0.85 * Math.min(1, App.Polity.fertility(c, rv)); };
  // 人口面积 = 面积 × 人口权重（数量按这个算）
  const areaOf = (cells) => { const ra = App.Polity.rowAreas(); let a = 0; cells.forEach((c) => (a += ra[(c / W) | 0] * (POPW ? POPW[c] : 1))); return a; };
  O.unitArea = (sys, level) => { const a = App.ADMIN_AREA[App.sysKeyOf(sys)] || [0, 200000, 25000, 3500]; return a[level] || a[a.length - 1] / 6; };
  const kidCount = (sys, level, cells, r) => {
    const [lo, hi] = sys.kids[level] || [3, 8];
    const cap = Math.floor(cells.length / MINC[level]); if (cap < 2) return 1;
    const want = Math.round((areaOf(cells) / O.unitArea(sys, level)) * (0.88 + r() * 0.24));
    return Math.max(2, Math.min(cap, U.clamp(want, lo, hi)));
  };
  O.autoProvinces = (nid, k1, r = Math.random, opts = {}) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    const sys = App.sysOf(n), maxLv = sys.levels;
    const cells = []; for (let c = 0; c < N; c++) if (S.owner[c] === nid && S.terrain[c] >= 2) cells.push(c);
    buildPopW();
    if (!opts.keepL1) O.deleteProvinces(S.provinces.filter((p) => p.nation === nid).map((p) => p.id));
    else O.deleteProvinces(S.provinces.filter((p) => p.nation === nid && (p.level || 1) > 1).map((p) => p.id));
    if (!cells.length) return;
    const sub = (parentCells, level, parent, kk) => {
      const { k, idx } = O.splitCells(parentCells, kk, r, (parent ? parent.id : nid) * 7 + level);
      // 先分组，只为真正有领土的块建立行政区（不会出现空壳县）
      const groups = Array.from({ length: k }, () => []);
      parentCells.forEach((c, j) => groups[idx[j]].push(c));
      groups.filter((g) => g.length).forEach((g) => {
        const p = O.addProvince(nid, App.Names.provFor(n, level, r), level, parent ? parent.id : 0);
        const arr = App.provArr(level); g.forEach((c) => (arr[c] = p.id));
        if (level < maxLv) sub(g, level + 1, p, kidCount(sys, level + 1, g, r));
      });
    };
    if (opts.keepL1) {
      cells.forEach((c) => { S.prov2[c] = 0; S.prov3[c] = 0; });
      S.provinces.filter((p) => p.nation === nid && (p.level || 1) === 1).forEach((p) => {
        const g = cells.filter((c) => S.prov[c] === p.id); if (!g.length || maxLv < 2) return;
        sub(g, 2, p, kidCount(sys, 2, g, r));
      });
      return;
    }
    if (!k1) k1 = U.clamp(Math.round(areaOf(cells) / O.unitArea(sys, 1)), 1, 40);
    sub(cells, 1, null, Math.min(k1, Math.max(1, Math.floor(cells.length / MINC[1]))));
  };
  // 按地理生成城市（数量看可用土地，大小看城址的地貌、气候、河流、海岸）
  O.autoCities = (nid, r = Math.random, density = 1, opt = {}) => App.Polity.genCities(nid, r, { density, ...opt });

  // 区域内随机重命名
  O.renameAll = (nid, r = Math.random) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    n.name = App.Names.nation(n.culture, r);
    S.provinces.filter((p) => p.nation === nid).forEach((p) => Object.assign(p, App.Names.provFor(n, p.level || 1, r)));
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
      O.autoProvinces(n.id, 0, r); k++;
    });
    return k;
  };
})();
