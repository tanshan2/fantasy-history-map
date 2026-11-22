// ===== 随机生成世界 =====
(() => {
  const W = App.W, H = App.H, N = App.N, C = App.CELL;
  App.Gen = {};

  // 公共：根据高度/温度/湿度设置地形与森林
  App.Gen.biomes = (S, elev, temp, moist, r) => {
    for (let c = 0; c < N; c++) {
      if (S.terrain[c] < 2) continue;
      const e = elev[c], t = temp[c], m = moist[c];
      let tt = 2;
      if (e > 0.82) tt = t < 0.75 ? 6 : 5; else if (e > 0.66) tt = 5; else if (e > 0.5) tt = 4;
      else if (t < 0.12) tt = 9; else if (m < 0.3 && t > 0.45) tt = 7; else if (m < 0.43) tt = 3; else if (m > 0.78 && e < 0.12) tt = 8;
      S.terrain[c] = tt;
      let f = 0;
      if (tt !== 7 && tt !== 6 && tt !== 9 && tt !== 3 && m > 0.5 + (U.hash(c, 0, 33) - 0.5) * 0.1) {
        if (t < 0.32) f = r() < 0.25 ? 5 : 2;
        else if (t < 0.62) f = m > 0.7 && t > 0.5 && U.noise((c % W) / 15, c / W / 15, 44) > 0.6 ? 4 : r() < 0.15 ? 2 : 1;
        else f = m > 0.62 ? 3 : U.noise((c % W) / 15, c / W / 15, 45) > 0.62 ? 4 : 1;
        if (tt === 5 && r() < 0.5) f = 0;
      } else if (tt === 3 && m > 0.38 && r() < 0.15) f = 6;
      S.forest[c] = f;
    }
  };

  // 河流：从高处顺坡流向水体
  App.Gen.rivers = (S, elev, count, r) => {
    const used = new Uint8Array(N), rivers = [];
    const cand = []; for (let c = 0; c < N; c++) if (S.terrain[c] >= 4 && S.terrain[c] <= 6) cand.push(c);
    for (let tries = 0; tries < count * 6 && rivers.length < count && cand.length; tries++) {
      let c = cand[Math.floor(r() * cand.length)]; if (used[c]) continue;
      const path = [c], seen = new Set([c]);
      for (let step = 0; step < 600; step++) {
        const x = c % W, y = (c / W) | 0; let best = -1, be = Infinity;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = ny * W + nx; if (seen.has(n)) continue;
          const v = elev[n] + U.hash(n, step, 71) * 0.004; if (v < be) { be = v; best = n; }
        }
        if (best < 0) break;
        if (be > elev[c] + 0.02) { // 小洼地：允许少许爬升，否则终止
          if (step > 40) break;
        }
        c = best; path.push(c); seen.add(c);
        if (S.terrain[c] < 2 || used[c]) break;
      }
      if (path.length < 18 || (S.terrain[c] >= 2 && !used[c])) continue;
      path.forEach((p) => { used[p] = 1; const x = p % W, y = (p / W) | 0; [p - 1, p + 1, p - W, p + W].forEach((q) => q >= 0 && q < N && (used[q] = 1)); });
      const pts = []; for (let i = 0; i < path.length; i += 3) pts.push([(path[i] % W + 0.5) * C, (((path[i] / W) | 0) + 0.5) * C]);
      const last = path[path.length - 1]; pts.push([(last % W + 0.5) * C, (((last / W) | 0) + 0.5) * C]);
      rivers.push({ id: App.nid(), pts: U.simplify(pts, 1.5), width: 1.4 + Math.min(2.2, path.length / 90) });
    }
    S.rivers.push(...rivers);
  };

  // 多国势力划分
  App.Gen.nations = (S, opts, r) => {
    const { count, culture } = opts;
    const land = []; for (let c = 0; c < N; c++) if (S.terrain[c] >= 2) land.push(c);
    if (!land.length) return;
    // 远点采样种子
    const seeds = []; const sample = []; for (let i = 0; i < 3000; i++) sample.push(land[Math.floor(r() * land.length)]);
    const md = new Float32Array(sample.length).fill(Infinity);
    seeds.push(sample[0]);
    while (seeds.length < count) {
      const s = seeds[seeds.length - 1]; let bi = 0, bd = -1;
      sample.forEach((c, i) => { const d = (c % W - s % W) ** 2 + (((c / W) | 0) - ((s / W) | 0)) ** 2; if (d < md[i]) md[i] = d; const v = md[i] * (0.5 + r()); if (v > bd) { bd = v; bi = i; } });
      seeds.push(sample[bi]);
    }
    // 文化分布：几个文化中心
    let pool = culture === 'mixed' ? App.CULTURES.map((c) => c.id) : culture === 'zh' ? App.Names.groups.zh : culture === 'latin' ? App.Names.groups.latin : [culture];
    pool = pool.slice().sort(() => r() - 0.5).slice(0, Math.min(pool.length, Math.max(1, Math.round(count / 3))));
    const cc = pool.map((id) => ({ id, x: r() * W, y: r() * H }));
    const nations = seeds.map((s) => {
      const x = s % W, y = (s / W) | 0; let best = cc[0], bd = Infinity;
      cc.forEach((k) => { const d = (k.x - x) ** 2 + (k.y - y) ** 2; if (d < bd) { bd = d; best = k; } });
      return App.Ops.addNation({ culture: best.id });
    });
    const tc = { 2: 1, 3: 1, 4: 1.8, 5: 4, 6: 7, 7: 2.5, 8: 2.2, 9: 2.5 };
    const who = U.grow(seeds.map((c) => ({ cell: c, mult: 0.75 + r() * 0.6, budget: 260 + r() * 260 })), (n) => {
      const t = S.terrain[n]; if (t < 2) return 9;
      return (tc[t] || 1) * (0.8 + U.noise((n % W) / 10, n / W / 10, 99) * 0.6);
    });
    for (let c = 0; c < N; c++) if (S.terrain[c] >= 2 && who[c] >= 0) S.owner[c] = nations[who[c]].id;
    // 去掉过小的国家
    S.nations.slice().forEach((n) => { let k = 0; for (let c = 0; c < N; c++) if (S.owner[c] === n.id) k++; if (k < 60) App.Ops.deleteNation(n.id); });
    App.Ops.recolor(r);
    S.nations.forEach((n) => {
      let k = 0; for (let c = 0; c < N; c++) if (S.owner[c] === n.id) k++;
      App.Ops.autoProvinces(n.id, 0, r);
    });
    App.Geo.dirtyPol = true; App.Geo.update();
    { const fm = App.Polity.fertMap(); S.nations.forEach((n) => App.Polity.genCities(n.id, r, { fm, density: 0.85 })); }
    // 国体按国名推断，每国生成统治家族
    S.nations.forEach((n) => { n.rank = App.Polity.guessRank(n); n.founded = (S.meta.year || 1) - 30 - Math.floor(r() * 300); });
    // 按面积调整：最大的国家可能称帝；小的西方国家多为公国、侯国、伯国
    const size = new Map(); for (let c = 0; c < N; c++) if (S.owner[c]) size.set(S.owner[c], (size.get(S.owner[c]) || 0) + 1);
    const bySize = S.nations.slice().sort((a, b) => (size.get(b.id) || 0) - (size.get(a.id) || 0)), med = size.get(bySize[bySize.length >> 1]?.id) || 0;
    bySize.forEach((n, i) => {
      const k = size.get(n.id) || 0, latin = App.Names.groups.latin.includes(n.culture);
      if (i === 0 && k > med * 1.8 && n.rank !== 'empire' && r() < 0.7) { n.rank = n.culture === 'steppe' ? 'khanate' : 'empire'; App.Polity.renameByRank(n); }
      else if (latin && i >= bySize.length * 0.55 && ['kingdom', 'republic'].includes(n.rank)) { n.rank = ['county', 'duchy', 'marquisate', 'county', 'margraviate'][Math.floor(r() * 5)]; App.Polity.renameByRank(n); }
    });
    App.Polity.ensureAllDynasties(r);
    S.nations.forEach((n) => App.Polity.genArmies(n, {}, r));
  };

  // ===== 随机大陆：大陆、半岛、海湾、海岛、群岛、山脉、河流、气候 =====
  App.Gen.BANDS = {
    north: { name: '北半球（寒带→亚热带）', top: 72, bot: 18 },
    mid: { name: '中纬度（温带为主）', top: 60, bot: 25 },
    tropic: { name: '热带（赤道两侧）', top: 28, bot: -22 },
    globe: { name: '整个星球（两极到赤道）', top: 78, bot: -78 },
    south: { name: '南半球', top: -12, bot: -68 },
  };
  App.Gen.random = (opts = {}) => {
    const seed = opts.seed ?? Math.floor(Math.random() * 1e9), r = U.rng(seed);
    const S = App.newState(); App.S = S;
    S.meta.name = '随机大陆 #' + (seed % 10000);
    const nCont = opts.continents ?? 3, landR = opts.land ?? 0.4, isl = opts.islands ?? 2, rough = opts.rough ?? 0.6;
    const band = App.Gen.BANDS[opts.band || 'north'];
    const sx = r() * 1000, sy = r() * 1000;
    const AR = W / H; // 用于把归一化坐标变成等比例
    // ---- 形状元素 ----
    const blobs = [], arms = [], bays = [];
    for (let i = 0; i < nCont; i++) {
      const rad = (0.13 + r() * 0.12) * Math.sqrt(3 / Math.max(1, nCont)) * (0.75 + landR);
      const b = { x: 0.14 + r() * 0.72, y: 0.18 + r() * 0.64, rx: rad * (0.8 + r() * 0.7), ry: rad * (0.7 + r() * 0.5), rot: r() * Math.PI };
      blobs.push(b);
      // 次级团块，让大陆不规则
      const k = 2 + Math.floor(r() * 3);
      for (let j = 0; j < k; j++) { const a = r() * Math.PI * 2, d = rad * (0.5 + r() * 0.5); blobs.push({ x: b.x + Math.cos(a) * d / AR, y: b.y + Math.sin(a) * d, rx: rad * (0.35 + r() * 0.35), ry: rad * (0.3 + r() * 0.3), rot: r() * Math.PI }); }
      // 半岛（伸出的长条）
      const na = Math.floor(r() * 3.2) + (rough > 0.5 ? 1 : 0);
      for (let j = 0; j < na; j++) {
        const a = r() * Math.PI * 2, len = rad * (1.1 + r() * 1.0), x0 = b.x + Math.cos(a) * rad * 0.5 / AR, y0 = b.y + Math.sin(a) * rad * 0.5;
        const bend = (r() - 0.5) * 1.2, pts = [];
        for (let t = 0; t <= 1.001; t += 0.25) { const aa = a + bend * t; pts.push([x0 + Math.cos(aa) * len * t / AR, y0 + Math.sin(aa) * len * t]); }
        arms.push({ pts, w0: rad * (0.22 + r() * 0.15), w1: rad * (0.06 + r() * 0.08) });
      }
      // 海湾（咬进大陆的缺口）
      const nb = Math.floor(r() * 3) + (rough > 0.4 ? 1 : 0);
      for (let j = 0; j < nb; j++) { const a = r() * Math.PI * 2, d = rad * (0.75 + r() * 0.3); bays.push({ x: b.x + Math.cos(a) * d / AR, y: b.y + Math.sin(a) * d, rx: rad * (0.18 + r() * 0.2), ry: rad * (0.12 + r() * 0.15), rot: a }); }
    }
    // 海岛 & 群岛
    const islands = [];
    const nIs = [0, 8, 20, 40][isl] || 0;
    for (let i = 0; i < nIs; i++) islands.push({ x: 0.05 + r() * 0.9, y: 0.06 + r() * 0.88, rx: 0.008 + r() * 0.03, ry: 0.008 + r() * 0.025, rot: r() * Math.PI });
    const nArc = [0, 1, 2, 4][isl] || 0;
    for (let i = 0; i < nArc; i++) {
      let x = 0.1 + r() * 0.8, y = 0.1 + r() * 0.8, a = r() * Math.PI * 2; const n = 6 + Math.floor(r() * 9);
      for (let j = 0; j < n; j++) { islands.push({ x, y, rx: 0.006 + r() * 0.016, ry: 0.006 + r() * 0.012, rot: r() * Math.PI }); a += (r() - 0.5) * 0.5; x += Math.cos(a) * 0.028 / AR; y += Math.sin(a) * 0.028; }
    }
    const ell = (u, v, e) => { const dx = (u - e.x) * AR, dy = v - e.y, c = Math.cos(e.rot), s = Math.sin(e.rot); const lx = (dx * c + dy * s) / e.rx, ly = (-dx * s + dy * c) / e.ry; return Math.sqrt(lx * lx + ly * ly); };
    const capsule = (u, v, a) => {
      let best = Infinity;
      for (let i = 0; i < a.pts.length - 1; i++) {
        const [x0, y0] = a.pts[i], [x1, y1] = a.pts[i + 1];
        const px = (u - x0) * AR, py = v - y0, qx = (x1 - x0) * AR, qy = y1 - y0, l = qx * qx + qy * qy;
        const t = U.clamp(l ? (px * qx + py * qy) / l : 0, 0, 1), d = Math.hypot(px - t * qx, py - t * qy);
        const w = U.lerp(a.w0, a.w1, (i + t) / (a.pts.length - 1));
        best = Math.min(best, d / w);
      }
      return best;
    };
    // ---- 高度场 ----
    const field = new Float32Array(N);
    const warp = 0.06 + rough * 0.09;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let u = x / W, v = y / H;
      u += (U.fbm(u * 3 + sx, v * 3 + sy, 11, 4) - 0.5) * warp; v += (U.fbm(u * 3 + sy, v * 3 + sx, 12, 4) - 0.5) * warp;
      let f = -1;
      for (const b of blobs) f = Math.max(f, 1 - ell(u, v, b));
      for (const a of arms) f = Math.max(f, (1 - capsule(u, v, a)) * 0.9);
      for (const b of bays) f -= Math.max(0, 1 - ell(u, v, b)) * 1.3;
      for (const s of islands) f = Math.max(f, (1 - ell(u, v, s)) * 0.8);
      const n1 = U.fbm(u * 6 + sx, v * 4 + sy, 13, 5) - 0.5, n2 = U.fbm(u * 18 + sx, v * 12 + sy, 14, 4) - 0.5;
      f += n1 * (0.35 + rough * 0.5) + n2 * rough * 0.25;
      const edge = Math.min(u, 1 - u, v, 1 - v);
      if (edge < 0.05) f -= (0.05 - edge) * 14;
      field[y * W + x] = f;
    }
    const sorted = Float32Array.from(field).sort();
    const thr = sorted[Math.floor(N * (1 - landR))];
    for (let c = 0; c < N; c++) S.terrain[c] = field[c] > thr ? 2 : 0;
    // 去掉过碎的单格噪点
    for (let c = 0; c < N; c++) { const x = c % W, y = (c / W) | 0; if (x < 1 || y < 1 || x > W - 2 || y > H - 2) continue; const k = (S.terrain[c - 1] >= 2) + (S.terrain[c + 1] >= 2) + (S.terrain[c - W] >= 2) + (S.terrain[c + W] >= 2); if (S.terrain[c] >= 2 && k === 0) S.terrain[c] = 0; if (S.terrain[c] < 2 && k === 4) S.terrain[c] = 2; }
    // 内陆湖：被陆地完全包围的水体保留为湖
    const ocean = new Uint8Array(N), q = [];
    for (let x = 0; x < W; x++) { q.push(x, (H - 1) * W + x); } for (let y = 0; y < H; y++) { q.push(y * W, y * W + W - 1); }
    q.forEach((c) => (ocean[c] = 1));
    while (q.length) { const c = q.pop(), x = c % W, y = (c / W) | 0; [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1].forEach((n) => { if (n >= 0 && !ocean[n] && S.terrain[n] < 2) { ocean[n] = 1; q.push(n); } }); }
    for (let c = 0; c < N; c++) if (S.terrain[c] < 2 && !ocean[c]) S.terrain[c] = 1;
    // 离岸距离
    const dist = new Uint16Array(N).fill(65535); const dq = [];
    for (let c = 0; c < N; c++) if (S.terrain[c] < 2) { dist[c] = 0; dq.push(c); }
    for (let h = 0; h < dq.length; h++) { const c = dq[h], x = c % W, y = (c / W) | 0; [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1].forEach((n) => { if (n >= 0 && dist[n] === 65535) { dist[n] = dist[c] + 1; dq.push(n); } }); }
    // 山脉带：每块大陆 1~2 条
    const belts = [];
    blobs.slice(0, nCont * 4).forEach((b, i) => { if (i % 3 && r() < 0.6) return; const a = r() * Math.PI, L = Math.max(b.rx, b.ry) * 1.6; const pts = []; for (let t = -1; t <= 1.001; t += 0.25) { const aa = a + (r() - 0.5) * 0.4; pts.push([b.x + Math.cos(aa) * L * t * 0.5 / AR + (r() - 0.5) * 0.02, b.y + Math.sin(aa) * L * t * 0.5 + (r() - 0.5) * 0.02]); } belts.push({ pts, w0: 0.016 + r() * 0.014, w1: 0.012 + r() * 0.012 }); });
    const elev = new Float32Array(N);
    for (let c = 0; c < N; c++) {
      if (S.terrain[c] < 2) continue;
      const x = c % W, y = (c / W) | 0, u = x / W, v = y / H;
      let e = 1 - Math.exp(-dist[c] / 22);
      let bm = 0; for (const b of belts) bm = Math.max(bm, Math.max(0, 1 - capsule(u, v, b)));
      const ridge = 1 - Math.abs(U.fbm(u * 9 + sx, v * 6 + sy, 15, 4) * 2 - 1);
      const gap = U.noise(u * 14 + sx, v * 14 + sy, 20); bm *= gap > 0.32 ? 1 : gap / 0.32;
      e = e * 0.42 + bm * (0.5 + ridge * 0.3) + Math.pow(ridge, 4) * 0.18 * e + (U.fbm(u * 8 + sy, v * 6 + sx, 16, 4) - 0.5) * 0.25;
      elev[c] = U.clamp(e, 0.01, 1);
    }
    // ---- 气候：温度、风向、降水（含雨影） ----
    const latOf = (y) => band.top + ((y + 0.5) / H) * (band.bot - band.top);
    const rain = new Float32Array(N), temp = new Float32Array(N);
    for (let y = 0; y < H; y++) {
      const lat = latOf(y), al = Math.abs(lat);
      const base = al < 10 ? 1 : al < 22 ? 1 - (al - 10) / 12 * 0.55 : al < 33 ? 0.45 - (al - 22) / 11 * 0.3 : al < 60 ? 0.35 + Math.min(1, (al - 33) / 12) * 0.45 : 0.75 - (al - 60) / 30 * 0.45;
      const dir = al < 30 || al > 62 ? -1 : 1; // 信风/极地东风向西吹，西风带向东吹
      let m = 1;
      const start = dir > 0 ? 0 : W - 1;
      for (let i = 0; i < W; i++) {
        const x = start + dir * i, c = y * W + x;
        if (S.terrain[c] < 2) { m = Math.min(1, m + 0.06); rain[c] = base; continue; }
        const prev = x - dir >= 0 && x - dir < W ? elev[y * W + x - dir] : 0, rise = Math.max(0, elev[c] - prev);
        const orographic = rise * 6;
        rain[c] = U.clamp(base * (0.35 + 0.65 * m) + orographic * m * 0.6 + (U.fbm(x / 40, y / 40, 17, 3) - 0.5) * 0.18, 0, 1);
        if (al < 12) rain[c] = Math.max(rain[c], 0.78 - al * 0.025 + (U.fbm(x / 30, y / 30, 21, 3) - 0.5) * 0.2);
        m = Math.max(0, m * 0.993 - rise * 2.2);
      }
      // 季风：热带/亚热带大陆东岸增湿
      if (al > 8 && al < 38) for (let x = W - 1, run = 0; x >= 0; x--) { const c = y * W + x; if (S.terrain[c] < 2) { run = 0; continue; } run++; if (run < 70) rain[c] = Math.min(1, rain[c] + 0.25 * (1 - run / 70)); }
      for (let x = 0; x < W; x++) {
        const c = y * W + x;
        temp[c] = 27 - 0.0075 * al * al + (U.fbm(x / 60, y / 60, 18, 3) - 0.5) * 4 - (S.terrain[c] >= 2 ? Math.pow(elev[c], 1.6) * 24 : 0) - (S.terrain[c] >= 2 ? Math.min(8, dist[c] / 12) * (al > 35 ? 0.6 : 0) : 0);
      }
    }
    for (let c = 0; c < N; c++) {
      if (S.terrain[c] < 2) continue;
      const x = c % W, y = (c / W) | 0, lat = latOf(y), al = Math.abs(lat);
      const westerly = al >= 30 && al <= 62;
      let westCoast = false; if (westerly) { for (let k = 1; k <= 18; k++) { if (x - k < 0) break; if (S.terrain[c - k] < 2) { westCoast = true; break; } } }
      S.climate[c] = App.Climate.classify(temp[c], rain[c], elev[c], { absLat: al, coastal: dist[c] < 14, westerly, westCoast });
    }
    // 地形：先山地丘陵，再按气候铺地貌森林
    for (let c = 0; c < N; c++) { if (S.terrain[c] < 2) continue; const e = elev[c]; S.terrain[c] = e > 0.8 ? (temp[c] < 8 ? 6 : 5) : e > 0.62 ? 5 : e > 0.46 ? 4 : 2; }
    App.Climate.applyBiomes(S, r);
    // 沼泽：多雨低地
    for (let c = 0; c < N; c++) if (S.terrain[c] === 2 && rain[c] > 0.8 && elev[c] < 0.12 && U.noise((c % W) / 6, c / W / 6, 19) > 0.68) { S.terrain[c] = 8; S.forest[c] = 0; }
    // 河流：多雨的山地发源
    const relev = new Float32Array(N); for (let c = 0; c < N; c++) relev[c] = S.terrain[c] < 2 ? -1 : dist[c] + elev[c] * 1.2 + U.fbm((c % W) / 14, ((c / W) | 0) / 14, 78, 3) * 2.5 + U.hash(c, 1, 77) * 0.4;
    App.Gen.rivers(S, relev, opts.rivers ?? Math.round(14 + landR * 30), r);
    S.rivers.forEach((rv) => { const p = rv.pts[0], c = App.Ops.cellAt(p[0], p[1]); if (c >= 0 && rain[c] < 0.14) rv._dry = true; });
    S.rivers = S.rivers.filter((rv) => !rv._dry);
    if (opts.nations) App.Gen.nations(S, { count: opts.nations, culture: opts.culture || 'mixed' }, r);
    App.undoStack.length = 0; App.redoStack.length = 0;
    return seed;
  };

  App.Gen.blank = () => {
    const S = App.newState(); App.S = S; S.meta.name = '空白地图';
    S.terrain.fill(2); // 整张空白羊皮纸
    App.undoStack.length = 0; App.redoStack.length = 0;
  };
})();
