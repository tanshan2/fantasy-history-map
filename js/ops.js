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
  O.splitCells = (cells, k, r, salt = 0, opt = {}) => {
    const S = App.S, L = cells.length, st = opt.style || App.adminStyle(null);
    // opt.fixed：真实历史区划，每项是一组锚点格（该区的治所和下辖府州），前 F 个区从这些锚点一起生长、大小不再调整
    const fixedSets = opt.fixed || [], F = fixedSets.length;
    k = Math.max(1, F, Math.min(k, Math.floor(L / 3) || 1));
    if (k === 1) return { k, idx: new Int32Array(L) };
    if (!LOC) LOC = new Int32Array(N).fill(-1);
    cells.forEach((c, j) => (LOC[c] = j));
    const anchors = fixedSets.map((set) => set.map((c) => LOC[c]).filter((j) => j >= 0));
    const anchorOf = new Int32Array(L); anchors.forEach((a, i) => a.forEach((j) => (anchorOf[j] = i + 1)));
    const rv = riverCached(), sd = salt * 13.7 + 5, wig = st.wiggle, ridge = st.ridge;
    const cost = new Float32Array(L), onRiver = new Uint8Array(L);
    // 「海拔」：平地 0，丘陵 1，山地 2.2，雪山 3；跨越海拔落差的代价高，边界就落在山前、分水岭上，盆地自成一区
    const ELEV = [0, 0, 0, 0.2, 1, 2.2, 3, 0.3, 0, 0.4], elev = new Float32Array(L);
    // 土地丰饶度（0.15～1）：治所设在富庶处，均衡时按「人口」而不是格数
    const fert = new Float32Array(L);
    cells.forEach((c, j) => {
      const t = S.terrain[c], x = c % W, y = (c / W) | 0; elev[j] = ELEV[t] || 0; fert[j] = POPW ? POPW[c] : 1;
      // 两种尺度的噪声：大尺度让区域有凸有凹，小尺度让边界曲折
      const n1 = U.fbm(x / 16 + sd, y / 16, 3, 3), n2 = U.fbm(x / 52 + sd * 0.37 + 31, y / 52 + 11, 2, 2);
      let cc = 1 + (n1 * 0.9 + (n2 - 0.5) * 1.1) * wig;
      cc += ((t === 5 ? 1.6 : t === 6 ? 2.6 : t === 4 ? 0.4 : 0) + (t === 8 ? 0.8 : 0)) * ridge;
      if (st.oasis && fert[j] < 0.3) cc *= 1 - 0.45 * st.oasis;  // 荒漠：很快被最近的绿洲吞下，边界落在戈壁中间
      if (rv[c]) {
        onRiver[j] = 1;
        // 大河作界与否随河段变化（史实中大河时而为界、时而一区跨两岸），各文明倾向不同
        const e = U.clamp(st.river + (n2 - 0.5) * 1.4, -1, 1);
        cc = e > 0 ? cc + 9 * e : Math.max(0.25, cc * (1 + 0.7 * e));
      }
      cost[j] = Math.max(0.2, cc);
    });
    // 八邻域（斜向 ×√2）：边界不再是菱形和蜂窝
    const nbs = (j, f) => { const c = cells[j], x = c % W; if (x > 0 && LOC[c - 1] >= 0) f(LOC[c - 1]); if (x < W - 1 && LOC[c + 1] >= 0) f(LOC[c + 1]); if (c >= W && LOC[c - W] >= 0) f(LOC[c - W]); if (c < N - W && LOC[c + W] >= 0) f(LOC[c + W]); };
    const nbs8 = (j, f) => {
      const c = cells[j], x = c % W, L_ = x > 0, R_ = x < W - 1, U_ = c >= W, D_ = c < N - W;
      if (L_ && LOC[c - 1] >= 0) f(LOC[c - 1], 1); if (R_ && LOC[c + 1] >= 0) f(LOC[c + 1], 1); if (U_ && LOC[c - W] >= 0) f(LOC[c - W], 1); if (D_ && LOC[c + W] >= 0) f(LOC[c + W], 1);
      if (L_ && U_ && LOC[c - W - 1] >= 0) f(LOC[c - W - 1], 1.414); if (R_ && U_ && LOC[c - W + 1] >= 0) f(LOC[c - W + 1], 1.414);
      if (L_ && D_ && LOC[c + W - 1] >= 0) f(LOC[c + W - 1], 1.414); if (R_ && D_ && LOC[c + W + 1] >= 0) f(LOC[c + W + 1], 1.414);
    };
    const xy = (j) => [cells[j] % W, (cells[j] / W) | 0];
    // 种子（局部下标）：治所优先设在城市上（州府、郡治多是大城）
    const ORD = { capital: 0, large: 1, port: 2, medium: 3, small: 4, fortress: 5, pass: 6, village: 7 };
    const riverBar = st.river > 0;
    const cityJ = S.cities.map((ct) => { const c = O.cellAt(ct.x, ct.y); return [c >= 0 ? LOC[c] : -1, ORD[ct.type] ?? 5, c]; }).filter(([j, o, c]) => j >= 0 && o <= 4 && !(riverBar && rv[c])).sort((a, b) => a[1] - b[1]);
    const minSep = Math.sqrt(L / k) * 0.75, seeds = anchors.map((a) => a[0]), pts = anchors.flat();
    const far = (j, d) => { const [x, y] = xy(j); return pts.every((s) => { const [sx, sy] = xy(s); return Math.hypot(sx - x, sy - y) >= d; }); };
    cityJ.forEach(([j]) => { if (seeds.length < k && far(j, minSep)) { seeds.push(j); pts.push(j); } });
    const nCity = seeds.length - F;
    const step = Math.max(1, Math.floor(L / 2500)), sample = []; for (let j = 0; j < L; j += step) sample.push(j);
    if (!seeds.length) { seeds.push(sample[Math.floor(r() * sample.length)]); pts.push(seeds[0]); }
    const md = new Float32Array(sample.length).fill(Infinity);
    const upd = (s) => { const [sx, sy] = xy(s); sample.forEach((j, i) => { const [x, y] = xy(j), d = (x - sx) ** 2 + (y - sy) ** 2; if (d < md[i]) md[i] = d; }); };
    pts.forEach(upd);
    // 其余治所：远离已有治所，且偏向富庶的平原河谷（绿洲文明几乎只设在绿洲）
    const fpow = 1 + 2 * (st.oasis || 0);
    while (seeds.length < k) { let bi = 0, bd = -1; sample.forEach((j, i) => { const v = md[i] * (0.75 + r() * 0.5) * Math.pow(0.25 + fert[j], fpow); if (v > bd) { bd = v; bi = i; } }); seeds.push(sample[bi]); upd(sample[bi]); }
    // 局部多源最短路。大小均衡用「加法」起点偏移（不是乘法速度）：
    // 乘法权重下两区分界是一个圆，小区会被邻区整圈包住（像一个路被另一个路包围），历史上不会有这种区划；
    // 加法权重下分界是开口的曲线，一个区不可能被单独一个邻区包住。
    let meanD = 1;
    const grow = (off) => {
      const best = new Float64Array(L).fill(Infinity), who = new Int32Array(L).fill(-1), h = new U.Heap();
      seeds.forEach((s, i) => { for (const a of i < F ? anchors[i] : [s]) if (off[i] < best[a]) { best[a] = off[i]; who[a] = i; h.push(off[i], a); } });
      while (h.size) { const j = h.pop(), d = h.topK; if (d > best[j]) continue; const si = who[j];
        nbs8(j, (q, dl) => { const nd = d + (cost[q] + Math.abs(elev[q] - elev[j]) * 3.2 * ridge) * dl; if (nd < best[q]) { best[q] = nd; who[q] = si; h.push(nd, q); } }); }
      let s = 0, n = 0; for (let j = 0; j < L; j++) if (who[j] >= 0) { s += best[j] - off[who[j]]; n++; } meanD = n ? s / n : 1;
      return who;
    };
    // 均衡目标按「人口」：富庶地方的区小，草原荒漠的区大；pop 越小越接近按地盘平分
    const wt = new Float32Array(L); let wsum = 0; for (let j = 0; j < L; j++) { wt[j] = Math.pow(fert[j], st.pop); wsum += wt[j]; }
    // 劳埃德松弛：非城市种子移到所辖区域的「人口重心」附近（治所在人多的地方，区域紧凑）
    const fixed = new Set(seeds.slice(0, F + nCity));
    for (let it = 0; it < 2 && k > F; it++) {
      const w0 = grow(seeds.map(() => 1)), sx = new Float64Array(k), sy = new Float64Array(k), sn = new Float64Array(k);
      for (let j = 0; j < L; j++) { const i = w0[j]; if (i < 0) continue; const [x, y] = xy(j); sx[i] += x * wt[j]; sy[i] += y * wt[j]; sn[i] += wt[j]; }
      for (let i = 0; i < k; i++) {
        if (fixed.has(seeds[i]) || !sn[i]) continue;
        const cx = sx[i] / sn[i], cy = sy[i] / sn[i]; let bj = seeds[i], bd = Infinity;
        for (let j = 0; j < L; j++) { if (w0[j] !== i) continue; const [x, y] = xy(j), d = (x - cx) ** 2 + (y - cy) ** 2 + elev[j] * 6 + (riverBar && onRiver[j] ? 4 : 0) - fert[j] * 4; if (d < bd) { bd = d; bj = j; } }
        seeds[i] = bj;
      }
    }
    // 每个区的目标大小：京畿小、边地大（core），再加随机悬殊（spread，对数正态）
    let cap = -1; if (opt.cap != null && LOC[opt.cap] >= 0) cap = LOC[opt.cap];
    const dist = seeds.map((s) => { if (cap < 0) return 0.5; const [x, y] = xy(s), [cx, cy] = xy(cap); return Math.hypot(x - cx, y - cy); });
    const dmax = Math.max(1e-6, ...dist);
    const gauss = () => Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * Math.cos(2 * Math.PI * r());
    const fac = seeds.map((s, i) => { const d = cap < 0 ? 0.5 : dist[i] / dmax; return ((1 - st.core) + st.core * (0.3 + 2.2 * d)) * Math.exp(U.clamp(gauss() * st.spread, -1.2, 1.2)); });
    const fsum = fac.reduce((a, b) => a + b, 0);
    const off = seeds.map(() => 0); let who;
    for (let it = 0; it < 10; it++) {
      who = grow(off);
      const size = new Float64Array(k); for (let j = 0; j < L; j++) if (who[j] >= 0) size[who[j]] += wt[j];
      let worst = 0;
      if (F >= k) break; // 全是真实区划：边界只由地理决定
      for (let i = F; i < k; i++) { const q = Math.max(size[i] / (wsum * fac[i] / fsum), 0.05); worst = Math.max(worst, q, 1 / q); off[i] += meanD * U.clamp(0.6 * Math.log(q), -0.6, 0.6); }
      const mn = Math.min(...off); for (let i = 0; i < k; i++) off[i] -= mn;
      if (worst < 1.35) break;
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
      // 真实区划的碎块里有本区的治所或府州（如狭长的东山道被隔开），保留
      if (p.id < F && p.comp.some((j) => anchorOf[j] === p.id + 1)) return;
      const touch = new Map(); p.comp.forEach((j) => nbs(j, (q) => { if (idx[q] !== p.id) touch.set(idx[q], (touch.get(idx[q]) || 0) + 1); }));
      let to = -1, bt = 0; touch.forEach((v, key) => { if (v > bt) { bt = v; to = key; } });
      if (to < 0) { if (p.comp.length >= (L / k) * 0.3) return; const [x, y] = xy(p.comp[0]); let bd = Infinity; seeds.forEach((s, t) => { const [sx, sy] = xy(s), d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd && t !== p.id) { bd = d; to = t; } }); }
      if (to >= 0) p.comp.forEach((j) => (idx[j] = to));
    });
    // 兜底：被单独一个邻区整圈包住、又不挨上级边界（国界、海岸）的区，并入包住它的区
    for (let pass = 0; pass < 3; pass++) {
      const nb = Array.from({ length: k }, () => new Set()), edge = new Uint8Array(k);
      for (let j = 0; j < L; j++) {
        const c = cells[j], x = c % W, i = idx[j];
        const out = [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c >= W ? c - W : -1, c < N - W ? c + W : -1];
        for (const q of out) { if (q < 0 || LOC[q] < 0) { edge[i] = 1; continue; } const iq = idx[LOC[q]]; if (iq !== i) nb[i].add(iq); }
      }
      let fixedAny = false;
      for (let i = 0; i < k; i++) if (!edge[i] && nb[i].size === 1) { const to = [...nb[i]][0]; for (let j = 0; j < L; j++) if (idx[j] === i) idx[j] = to; fixedAny = true; }
      if (!fixedAny) break;
    }
    cells.forEach((c) => (LOC[c] = -1));
    return { k, idx };
  };

  // 自动划分行政区：数量按「真实面积 ÷ 该制度各级单位的历史典型面积」来定，再受历史上下辖数量范围约束
  // 例如明代一省约 22 万平方公里、一府约 2.5 万、一县约 3500；唐代一道约 40 万、一州约 1.5 万
  // 地图分辨率限制：每级单位至少占的格数（真实地图一格约 400 平方公里，县最少 3 格约 1200 平方公里）
  const MINC = [0, 24, 7, 3];
  // 人口权重：按土地丰饶度（地貌×气候×河流），富庶平原 1，草原约 0.3，荒漠高原约 0.15
  let POPW = null;
  const buildPopW = () => { const rv = riverCached(); POPW = new Float32Array(N); for (let c = 0; c < N; c++) if (App.S.terrain[c] >= 2) POPW[c] = 0.15 + 0.85 * Math.min(1, App.Polity.fertility(c, rv)); };
  // 人口面积 = 面积 × 人口权重
  const areaOf = (cells) => { const ra = App.Polity.rowAreas(); let a = 0; cells.forEach((c) => (a += ra[(c / W) | 0] * (POPW ? POPW[c] : 1))); return a; };
  O.unitArea = (sys, level) => { const a = App.ADMIN_AREA[App.sysKeyOf(sys)] || [0, 200000, 25000, 3500]; return a[level] || a[a.length - 1] / 6; };
  // 应分几个 = 人口面积 ÷ (历史典型面积 × 历史疆域的平均丰饶度)：在历史疆域上正好得到史书中的数量
  const wantCount = (sys, level, cells) => areaOf(cells) / (O.unitArea(sys, level) * ((App.ADMIN_REF && App.ADMIN_REF[App.sysKeyOf(sys)]) || 0.75));
  const kidCount = (sys, level, cells, r) => {
    const [lo, hi] = sys.kids[level] || [3, 8];
    const cap = Math.floor(cells.length / MINC[level]); if (cap < 2) return 1;
    const want = Math.round(wantCount(sys, level, cells) * (0.9 + r() * 0.2));
    return Math.max(Math.min(2, cap), Math.min(cap, U.clamp(want, lo, hi)));
  };
  // ---- 真实历史区划：先看领土覆盖了哪些真实的一级区，有就沿用，没有的土地再新生成 ----
  const HIST_SUF = /(行省|布政使司|省|路|道|州|国|府|郡|尹|牧|卫|军|监|司|翊|风)$/;
  O.histBase = (name) => { const b = name.replace(HIST_SUF, ''); return Array.from(b).length >= 1 ? b : name; };
  // 把一个经纬度落到本国领土内最近的格（3 格以内），不在本国返回 -1
  const anchorCell = (pj, lon, lat, nid) => {
    const [fx, fy] = pj.fwd(lon, lat), x0 = Math.floor(fx), y0 = Math.floor(fy), S = App.S;
    let best = -1, bd = Infinity;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= W || y >= App.H) continue;
      const c = y * W + x; if (S.owner[c] !== nid || S.terrain[c] < 2) continue;
      const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = c; }
    }
    return best;
  };
  O.histPlan = (n) => {
    const S = App.S, key = App.sysKey(n), real = App.ADMIN_REAL && App.ADMIN_REAL[key];
    if (!real || n.histAdmin === false || S.meta.geo !== real.geo || !App.Templates || !App.Templates.PROJ[real.geo]) return null;
    const pj = App.Templates.PROJ[real.geo], units = [];
    real.l1.forEach(([name, kids]) => {
      const inside = kids.map(([kn, lo, la]) => ({ name: kn, cell: anchorCell(pj, lo, la, n.id) })).filter((a) => a.cell >= 0);
      // 治所在本国，或至少三分之一的府州在本国：算作覆盖了这个真实一级区
      const seatIn = inside.length && inside[0].name === kids[0][0];
      if (inside.length && (seatIn || inside.length >= kids.length / 3)) units.push({ name, kids: inside, total: kids.length });
    });
    return units.length ? { key, units } : null;
  };
  O.autoProvinces = (nid, k1, r = Math.random, opts = {}) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    const sys = App.sysOf(n), maxLv = sys.levels, style = App.adminStyle(n);
    const cells = []; for (let c = 0; c < N; c++) if (S.owner[c] === nid && S.terrain[c] >= 2) cells.push(c);
    buildPopW();
    if (!opts.keepL1) O.deleteProvinces(S.provinces.filter((p) => p.nation === nid).map((p) => p.id));
    else O.deleteProvinces(S.provinces.filter((p) => p.nation === nid && (p.level || 1) > 1 && (!opts.only || p.parent === opts.only)).map((p) => p.id)); // only：只重新细分这一个一级区
    if (!cells.length) return;
    // 首都（京畿区划小而密）
    const capCt = S.cities.find((ct) => ct.type === 'capital' && S.owner[O.cellAt(ct.x, ct.y)] === nid);
    const cap = capCt ? O.cellAt(capCt.x, capCt.y) : -1;
    const plan = O.histPlan(n);
    const stat = { hist: 0, gen: 0, names: [] };
    // 同名锚点（一个大国多个补充点）合并为一个区
    const kidsIn = (kids, g) => { const inG = new Set(g), m = new Map(); kids.forEach((a) => { if (!inG.has(a.cell)) return; if (!m.has(a.name)) m.set(a.name, { name: a.name, anchors: [] }); m.get(a.name).anchors.push(a.cell); }); return [...m.values()]; };
    // 史料覆盖不到的部分该新生成几个区：离所有真实治所超过约 3 个典型半径的土地，按面积折算，不足半个区为 0
    const genFor = (g, hist, level) => {
      const ra = App.Polity.rowAreas(), rr = Math.sqrt(O.unitArea(sys, level) / (ra[(App.H / 2) | 0] || 400) / Math.PI), R = Math.max(4, rr * (level === 1 ? 1.6 : 2.2));
      const pts = hist.flatMap((h) => h.anchors.map((c) => [c % W, (c / W) | 0]));
      const unc = g.filter((c) => { const x = c % W, y = (c / W) | 0; return !pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= R * R); });
      return unc.length >= MINC[level] ? Math.round(wantCount(sys, level, unc)) : 0;
    };
    // hist：这一级的真实区划 [{name, anchors:[格], kids:[{name, cell}]}]，排在前面；其余 kk - hist.length 个新生成
    const sub = (parentCells, level, parent, kk, hist = []) => {
      const { k, idx } = O.splitCells(parentCells, Math.max(kk, hist.length), r, (parent ? parent.id : nid) * 7 + level, { style, cap, fixed: hist.map((h) => h.anchors) });
      // 先分组，只为真正有领土的块建立行政区（不会出现空壳县）
      const groups = Array.from({ length: k }, () => []);
      parentCells.forEach((c, j) => groups[idx[j]].push(c));
      groups.forEach((g, gi) => {
        if (!g.length) return;
        const h = hist[gi], pid = parent ? parent.id : 0;
        const p = h ? O.addProvince(nid, h.name, level, pid) : O.addProvince(nid, App.PlaceNames ? { name: "", base: "" } : App.Names.provFor(n, level, r), level, pid);
        if (h) { p.hist = true; p.base = O.histBase(h.name); if (level === 1) { stat.hist++; stat.names.push(h.name); } }
        else if (level === 1) stat.gen++;
        const arr = App.provArr(level); g.forEach((c) => (arr[c] = p.id));
        if (level < maxLv) {
          const kh = h && h.kids ? kidsIn(h.kids, g) : [];
          sub(g, level + 1, p, kh.length ? kh.length + genFor(g, kh, level + 1) : kidCount(sys, level + 1, g, r), kh);
        }
      });
    };
    if (opts.keepL1) {
      cells.forEach((c) => { if (!opts.only || S.prov[c] === opts.only) { S.prov2[c] = 0; S.prov3[c] = 0; } });
      const byName = new Map(plan ? plan.units.map((u) => [u.name, u]) : []);
      S.provinces.filter((p) => p.nation === nid && (p.level || 1) === 1 && (!opts.only || p.id === opts.only)).forEach((p) => {
        const g = cells.filter((c) => S.prov[c] === p.id); if (!g.length || maxLv < 2) return;
        const u = p.hist && byName.get(p.name);
        const kh = u ? kidsIn(u.kids, g) : [];
        sub(g, 2, p, kh.length ? kh.length + genFor(g, kh, 2) : kidCount(sys, 2, g, r), kh);
      });
      return stat;
    }
    if (plan && !k1) {
      // 真实区划覆盖不到的土地（离所有真实府州都很远）：按面积新生成一级区；不足半个区的边角并入相邻真实区
      const hist = plan.units.map((u) => ({ name: u.name, anchors: u.kids.map((a) => a.cell), kids: u.kids }));
      const gen = genFor(cells, hist, 1);
      sub(cells, 1, null, hist.length + gen, hist);
      return stat;
    }
    if (!k1) k1 = U.clamp(Math.round(wantCount(sys, 1, cells)), 1, 40);
    sub(cells, 1, null, Math.min(k1, Math.max(1, Math.floor(cells.length / MINC[1]))));
    return stat;
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

// ---- 改了一级区的范围后：新划进来的地沿用同一级区里相邻的二、三级；被吃干净的二、三级删除 ----
(() => {
  const W = App.W, H = App.H, N = App.N;
  App.Ops.fillLower = (before) => {
    const S = App.S, P1 = S.prov, P2 = S.prov2, P3 = S.prov3, q = [];
    for (let c = 0; c < N; c++) if (P1[c] && P2[c]) q.push(c);
    for (let h = 0; h < q.length; h++) {
      const c = q[h], x = c % W, y = (c / W) | 0;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
        if (n < 0 || P1[n] !== P1[c] || P2[n]) continue;
        P2[n] = P2[c]; if (!P3[n]) P3[n] = P3[c]; q.push(n);
      }
    }
    // 三级：同一二级区里没有三级的格子，沿用相邻的三级
    const q3 = []; for (let c = 0; c < N; c++) if (P2[c] && P3[c]) q3.push(c);
    for (let h = 0; h < q3.length; h++) {
      const c = q3[h], x = c % W, y = (c / W) | 0;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
        if (n < 0 || P2[n] !== P2[c] || P3[n]) continue;
        P3[n] = P3[c]; q3.push(n);
      }
    }
    if (App.Ops.pruneEmptyProvinces && before) App.Ops.pruneEmptyProvinces(before);
  };
})();
