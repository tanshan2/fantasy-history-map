// ===== 边界提取、平滑路径、派生图层 =====
(() => {
  const W = App.W, H = App.H, N = App.N, C = App.CELL, VW = W + 1, VN = (W + 1) * (H + 1);
  const VX = new Float32Array(VN), VY = new Float32Array(VN);
  // 网格顶点抖动：全局一致，让海岸线和边界更自然
  for (let j = 0; j <= H; j++) for (let i = 0; i <= W; i++) {
    const v = j * VW + i;
    const jx = i === 0 || i === W ? 0 : (U.hash(i, j, 11) - 0.5) * 0.4 + (U.noise(i / 6, j / 6, 5) - 0.5) * 0.9;
    const jy = j === 0 || j === H ? 0 : (U.hash(i, j, 12) - 0.5) * 0.4 + (U.noise(i / 6, j / 6, 6) - 0.5) * 0.9;
    VX[v] = (i + jx) * C; VY[v] = (j + jy) * C;
  }
  const deg = new Uint8Array(VN), adj = new Int32Array(VN * 4);

  const G = (App.Geo = { VX, VY, dirtyLand: true, dirtyPol: true, nationPaths: new Map(), labels: new Map(), provLabels: new Map() });

  // 收集 val 区域边界边，返回 Map(区域id -> 边id数组)；val(c) 返回 0 表示无
  G.collect = (val) => {
    const m = new Map();
    const add = (r, e) => { let a = m.get(r); if (!a) m.set(r, (a = [])); a.push(e); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = y * W + x, a = val(c);
      const b = x + 1 < W ? val(c + 1) : 0;
      if (a !== b) { const e = ((y * VW + x + 1) << 1) | 1; if (a) add(a, e); if (b) add(b, e); }
      const d = y + 1 < H ? val(c + W) : 0;
      if (a !== d) { const e = ((y + 1) * VW + x) << 1; if (a) add(a, e); if (d) add(d, e); }
      if (x === 0 && a) add(a, ((y * VW) << 1) | 1);
      if (y === 0 && a) add(a, x << 1);
    }
    return m;
  };

  G.chain = (edges) => {
    const n = edges.length, A = new Int32Array(n), B = new Int32Array(n);
    for (let k = 0; k < n; k++) {
      const id = edges[k], v = id >> 1;
      A[k] = v; B[k] = id & 1 ? v + VW : v + 1;
      adj[A[k] * 4 + deg[A[k]]++] = k; adj[B[k] * 4 + deg[B[k]]++] = k;
    }
    const used = new Uint8Array(n), chains = [];
    const walk = (v, k) => {
      const seq = [v];
      while (k >= 0) {
        used[k] = 1; v = A[k] === v ? B[k] : A[k]; seq.push(v); k = -1;
        const d = deg[v], b = v * 4;
        for (let t = 0; t < d; t++) { const e = adj[b + t]; if (!used[e]) { k = e; break; } }
      }
      return seq;
    };
    for (let k = 0; k < n; k++) if (!used[k]) {
      if (deg[A[k]] & 1) chains.push(walk(A[k], k)); else if (deg[B[k]] & 1) chains.push(walk(B[k], k));
    }
    for (let k = 0; k < n; k++) if (!used[k]) chains.push(walk(A[k], k));
    for (let k = 0; k < n; k++) { deg[A[k]] = 0; deg[B[k]] = 0; }
    return chains;
  };

  G.addChain = (p, seq) => {
    const n = seq.length; if (n < 2) return;
    const mx = (i) => (VX[seq[i]] + VX[seq[i + 1]]) / 2, my = (i) => (VY[seq[i]] + VY[seq[i + 1]]) / 2;
    if (seq[0] === seq[n - 1] && n > 3) {
      p.moveTo(mx(0), my(0));
      for (let i = 1; i < n - 1; i++) p.quadraticCurveTo(VX[seq[i]], VY[seq[i]], mx(i), my(i));
      p.quadraticCurveTo(VX[seq[0]], VY[seq[0]], mx(0), my(0)); p.closePath();
    } else {
      p.moveTo(VX[seq[0]], VY[seq[0]]); p.lineTo(mx(0), my(0));
      for (let i = 1; i < n - 1; i++) p.quadraticCurveTo(VX[seq[i]], VY[seq[i]], mx(i), my(i));
      p.lineTo(VX[seq[n - 1]], VY[seq[n - 1]]);
    }
  };
  G.pathOf = (edges) => { const p = new Path2D(); G.chain(edges).forEach((s) => G.addChain(p, s)); return p; };

  const mkCanvas = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  G.glowCanvas = mkCanvas(); G.tintCanvas = mkCanvas(); G.bandCanvas = mkCanvas();

  // BFS 距离场
  const bfs = (isSeed, passable, maxD) => {
    const d = new Uint8Array(N).fill(255), q = new Int32Array(N); let qh = 0, qt = 0;
    for (let c = 0; c < N; c++) if (isSeed(c)) { d[c] = 0; q[qt++] = c; }
    while (qh < qt) {
      const c = q[qh++], dc = d[c]; if (dc >= maxD) continue;
      const x = c % W, y = (c / W) | 0;
      const nb = [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1];
      for (const n of nb) if (n >= 0 && d[n] === 255 && passable(n)) { d[n] = dc + 1; q[qt++] = n; }
    }
    return d;
  };

  G.rebuildLand = () => {
    const S = App.S, T = S.terrain;
    const m = G.collect((c) => (T[c] >= 2 ? 1 : 0));
    G.coastPath = G.pathOf(m.get(1) || []);
    // 海岸光晕
    const land = (c) => T[c] >= 2;
    const d = bfs(land, (c) => !land(c), 9);
    G.coastDist = d; G.glowKey = null;
    G.rebuildTint(); G.rebuildIcons();
    G.dirtyLand = false;
  };

  const TCOL = {};
  App.TERRAINS.forEach((t) => (TCOL[t.id] = U.hexToRgb(t.color)));
  const FCOL = { 1: [150, 170, 105], 2: [120, 150, 110], 3: [110, 160, 95], 4: [160, 180, 110], 5: [175, 180, 130], 6: [185, 180, 130] };
  G.rebuildTint = () => {
    const S = App.S, ctx = G.tintCanvas.getContext('2d'), im = ctx.createImageData(W, H), D = im.data;
    for (let c = 0; c < N; c++) {
      const t = S.terrain[c]; if (t < 2) continue;
      let [r, g, b] = TCOL[t] || [233, 220, 191];
      const f = S.forest[c];
      if (f && FCOL[f]) { const k = 0.38; r = r * (1 - k) + FCOL[f][0] * k; g = g * (1 - k) + FCOL[f][1] * k; b = b * (1 - k) + FCOL[f][2] * k; }
      D[c * 4] = r; D[c * 4 + 1] = g; D[c * 4 + 2] = b; D[c * 4 + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    if (App.Climate) App.Climate.rebuild();
  };

  G.rebuildIcons = () => {
    const S = App.S, icons = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = y * W + x, t = S.terrain[c]; if (t < 2) continue;
      const r = U.hash(x, y, 1), jx = (U.hash(x, y, 2) - 0.5) * C, jy = (U.hash(x, y, 3) - 0.5) * C, v = (U.hash(x, y, 4) * 3) | 0;
      const px = x * C + C / 2 + jx, py = y * C + C / 2 + jy;
      let placed = false;
      if (t === 5 && r < 0.2) { icons.push({ x: px, y: py, k: 'mtn', v, s: 10 + U.hash(x, y, 5) * 6, r }); placed = true; }
      else if (t === 6 && r < 0.22) { icons.push({ x: px, y: py, k: 'snow', v, s: 13 + U.hash(x, y, 5) * 6, r }); placed = true; }
      else if (t === 4 && r < 0.11) { icons.push({ x: px, y: py, k: 'hill', v, s: 9 + U.hash(x, y, 5) * 4, r }); placed = true; }
      else if (t === 7 && r < 0.025) { icons.push({ x: px, y: py, k: 'dune', v, s: 9, r }); placed = true; }
      else if (t === 8 && r < 0.09) { icons.push({ x: px, y: py, k: 'marsh', v, s: 8, r }); placed = true; }
      const f = S.forest[c];
      if (f && !placed) {
        const rf = U.hash(x, y, 7);
        if (rf < (t === 5 || t === 6 ? 0.06 : 0.15)) icons.push({ x: px, y: py, k: 'tree' + f, v, s: (f === 3 ? 11 : f === 6 ? 10 : 9) + U.hash(x, y, 8) * 2.5, r: rf });
      }
    }
    icons.sort((a, b) => a.y - b.y);
    G.icons = icons;
  };

  G.rebuildPolitical = () => {
    const S = App.S, O = S.owner, P1 = S.prov, P2 = S.prov2, P3 = S.prov3;
    // 国家路径
    const m = G.collect((c) => O[c]);
    G.nationPaths = new Map();
    m.forEach((edges, id) => G.nationPaths.set(id, G.pathOf(edges)));
    // 三级行政区界：上级相同、本级不同
    const lvEdges = (same, A) => {
      const pe = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = y * W + x; if (!O[c]) continue;
        if (x + 1 < W && same(c, c + 1) && A[c + 1] !== A[c]) pe.push(((y * VW + x + 1) << 1) | 1);
        if (y + 1 < H && same(c, c + W) && A[c + W] !== A[c]) pe.push(((y + 1) * VW + x) << 1);
      }
      return G.pathOf(pe);
    };
    G.provPaths = [null,
      lvEdges((a, b) => O[a] === O[b], P1),
      lvEdges((a, b) => O[a] === O[b] && P1[a] === P1[b], P2),
      lvEdges((a, b) => O[a] === O[b] && P2[a] === P2[b], P3)];
    G.provPath = G.provPaths[1];
    // 内侧色带
    const border = (c) => {
      const o = O[c]; if (!o) return false; const x = c % W, y = (c / W) | 0;
      const chk = (n) => S.terrain[n] >= 2 && O[n] !== o;
      return (x > 0 && chk(c - 1)) || (x < W - 1 && chk(c + 1)) || (y > 0 && chk(c - W)) || (y < H - 1 && chk(c + W));
    };
    const d = bfs(border, (c) => O[c] !== 0, 4);
    const ctx = G.bandCanvas.getContext('2d'), im = ctx.createImageData(W, H), D = im.data;
    const cols = new Map(); S.nations.forEach((n) => cols.set(n.id, U.hexToRgb(U.shade(n.color, -0.35))));
    for (let c = 0; c < N; c++) {
      const o = O[c], dd = d[c]; if (!o || dd === 255) continue;
      const col = cols.get(o); if (!col) continue;
      D[c * 4] = col[0]; D[c * 4 + 1] = col[1]; D[c * 4 + 2] = col[2]; D[c * 4 + 3] = (1 - dd / 4.2) * 150;
    }
    ctx.putImageData(im, 0, 0);
    G.labels = labelStats(O);
    G.provLabels = new Map([...labelStats(P1), ...labelStats(P2), ...labelStats(P3)]);
    G.dirtyPol = false;
  };

  // 区域标签：放在离边界最远的位置（区域最“厚”处），并给出主轴方向与可用尺寸
  const labelStats = (A) => {
    // 离区域边界的距离（BFS，8邻域近似）
    const dist = new Uint16Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    for (let c = 0; c < N; c++) {
      const id = A[c]; if (!id) continue;
      const x = c % W, y = (c / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || A[c - 1] !== id || A[c + 1] !== id || A[c - W] !== id || A[c + W] !== id) { dist[c] = 1; q[qt++] = c; }
    }
    while (qh < qt) {
      const c = q[qh++], id = A[c], x = c % W, y = (c / W) | 0, dc = dist[c];
      const nb = [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1];
      for (const n of nb) if (n >= 0 && A[n] === id && !dist[n]) { dist[n] = dc + 1; q[qt++] = n; }
    }
    // 统计：面积、质心、协方差
    const st = new Map();
    for (let c = 0; c < N; c++) {
      const id = A[c]; if (!id) continue;
      let s = st.get(id); if (!s) st.set(id, (s = { n: 0, sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0, best: -1, bd: -1 }));
      const x = c % W, y = (c / W) | 0;
      s.n++; s.sx += x; s.sy += y; s.sxx += x * x; s.syy += y * y; s.sxy += x * y;
    }
    for (let c = 0; c < N; c++) {
      const id = A[c]; if (!id) continue;
      const s = st.get(id), x = c % W, y = (c / W) | 0;
      const cx = s.sx / s.n, cy = s.sy / s.n;
      const score = dist[c] - 0.02 * Math.hypot(x - cx, y - cy);
      if (score > s.bd) { s.bd = score; s.best = c; }
    }
    // 备选位置：区域内其他“宽处”，用于标签避让
    const pool = new Map();
    for (let c = 0; c < N; c++) {
      const id = A[c]; if (!id) continue;
      const s = st.get(id), bd = dist[s.best];
      if (dist[c] >= Math.max(2, bd * 0.5) && (U.hash(c, 7, 91) < 0.25 || dist[c] >= bd * 0.85)) { let p = pool.get(id); if (!p) pool.set(id, (p = [])); p.push(c); }
    }
    const out = new Map();
    st.forEach((s, id) => {
      const p = (pool.get(id) || []).sort((a, b) => dist[b] - dist[a]), bd = dist[s.best], picks = [];
      for (const c of p) {
        if (picks.length >= 6) break;
        const x = c % W, y = (c / W) | 0;
        if (c === s.best || picks.some((q) => Math.hypot(q % W - x, ((q / W) | 0) - y) < bd * 1.4)) continue;
        if (Math.hypot(s.best % W - x, ((s.best / W) | 0) - y) < bd * 1.4) continue;
        picks.push(c);
      }
      s.alts = picks.map((c) => ({ x: ((c % W) + 0.5) * C, y: (((c / W) | 0) + 0.5) * C, r: dist[c] * C }));
      const cx = s.sx / s.n, cy = s.sy / s.n, vxx = s.sxx / s.n - cx * cx, vyy = s.syy / s.n - cy * cy, vxy = s.sxy / s.n - cx * cy;
      const tr = vxx + vyy, det = vxx * vyy - vxy * vxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 + disc, l2 = Math.max(0.01, tr / 2 - disc);
      let ang = Math.abs(vxy) < 1e-6 ? (vxx >= vyy ? 0 : Math.PI / 2) : Math.atan2(l1 - vxx, vxy);
      if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      const b = s.best, r = dist[b];
      out.set(id, { n: s.n, x: ((b % W) + 0.5) * C, y: (((b / W) | 0) + 0.5) * C, ang, r: r * C, L: Math.min(4 * Math.sqrt(l1), r * 5) * C, M: 4 * Math.sqrt(l2) * C, alts: s.alts });
    });
    return out;
  };

  G.update = () => {
    if (G.dirtyLand) G.rebuildLand();
    else if (G.dirtyTint) { G.rebuildTint(); G.rebuildIcons(); }
    G.dirtyTint = false;
    if (G.dirtyPol) G.rebuildPolitical();
  };
})();

// 海岸光晕（随画风变化）
App.Geo.buildGlow = (key, rgb, maxD, alpha, power) => {
  const G = App.Geo; if (G.glowKey === key || !G.coastDist) return;
  const W = App.W, H = App.H, N = App.N, d = G.coastDist;
  const gctx = G.glowCanvas.getContext('2d'), gi = gctx.createImageData(W, H);
  for (let c = 0; c < N; c++) {
    const dd = d[c]; let a = 0;
    if (dd > 0 && dd < 255 && dd <= maxD) a = Math.pow(1 - dd / (maxD + 1), power) * alpha;
    gi.data[c * 4] = rgb[0]; gi.data[c * 4 + 1] = rgb[1]; gi.data[c * 4 + 2] = rgb[2]; gi.data[c * 4 + 3] = a * 255;
  }
  gctx.putImageData(gi, 0, 0); G.glowKey = key;
};
