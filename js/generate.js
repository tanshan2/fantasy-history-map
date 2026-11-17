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
      App.Ops.autoProvinces(n.id, U.clamp(Math.round(k / 1100), 1, 9), r);
    });
    App.Geo.dirtyPol = true; App.Geo.update();
    S.nations.forEach((n) => App.Ops.autoCities(n.id, r, 0.45));
    S.nations.forEach((n) => { const cap = S.cities.find((k) => k.type === 'capital' && S.owner[App.Ops.cellAt(k.x, k.y)] === n.id); App.Family.createFamily({ culture: n.culture, nation: n.id, home: cap ? cap.id : 0, color: n.color }, r); });
  };

  App.Gen.random = (opts = {}) => {
    const seed = opts.seed ?? Math.floor(Math.random() * 1e9), r = U.rng(seed);
    const S = App.newState(); App.S = S;
    S.meta.name = '随机世界 #' + (seed % 10000);
    const sx = r() * 1000, sy = r() * 1000, land = opts.land ?? 0.42;
    const elevRaw = new Float32Array(N);
    // 若干大陆中心
    const blobs = []; const nb = 3 + Math.floor(r() * 4);
    for (let i = 0; i < nb; i++) blobs.push({ x: 0.15 + r() * 0.7, y: 0.18 + r() * 0.64, r: 0.16 + r() * 0.2 });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      let b = 0; blobs.forEach((k) => { const d = Math.hypot((u - k.x) * 1.6, v - k.y) / k.r; b = Math.max(b, 1 - d); });
      const n = U.fbm(u * 5 + sx, v * 3.2 + sy, 1, 6), n2 = U.fbm(u * 14 + sx, v * 9 + sy, 2, 4);
      const edge = Math.min(u, 1 - u, v, 1 - v);
      elevRaw[y * W + x] = n * 0.95 + b * 0.55 + n2 * 0.12 - (edge < 0.06 ? (0.06 - edge) * 6 : 0);
    }
    const sorted = Float32Array.from(elevRaw).sort();
    const thr = sorted[Math.floor(N * (1 - land))];
    const elev = new Float32Array(N), temp = new Float32Array(N), moist = new Float32Array(N);
    let maxE = 0; for (let c = 0; c < N; c++) maxE = Math.max(maxE, elevRaw[c] - thr);
    for (let c = 0; c < N; c++) {
      const x = c % W, y = (c / W) | 0, h = elevRaw[c] - thr;
      S.terrain[c] = h > 0 ? 2 : 0;
      const ridge = 1 - Math.abs(U.fbm(x / 60 + sx, y / 60 + sy, 7, 5) * 2 - 1);
      elev[c] = h > 0 ? U.clamp((h / maxE) * 0.9 + Math.pow(ridge, 6) * 0.65 * Math.min(1, h / maxE * 4), 0, 1) : 0;
      temp[c] = U.clamp(y / H * 1.15 - 0.05 + (U.fbm(x / 80, y / 80, 8, 3) - 0.5) * 0.3 - elev[c] * 0.35, 0, 1);
      moist[c] = U.clamp(U.fbm(x / 70 + sy, y / 70 + sx, 9, 5) * 1.3 - 0.15, 0, 1);
    }
    App.Gen.biomes(S, elev, temp, moist, r);
    // 湖泊
    for (let i = 0; i < 6; i++) {
      const c = Math.floor(r() * N); if (S.terrain[c] < 2 || elev[c] > 0.4) continue;
      const x0 = c % W, y0 = (c / W) | 0, rr = 2 + r() * 4;
      for (let y = y0 - 6; y <= y0 + 6; y++) for (let x = x0 - 8; x <= x0 + 8; x++) if (x >= 0 && y >= 0 && x < W && y < H && ((x - x0) / rr) ** 2 + ((y - y0) / (rr * 0.6)) ** 2 + U.noise(x / 2, y / 2, i) * 0.6 < 1) { const k = y * W + x; S.terrain[k] = 1; S.forest[k] = 0; }
    }
    App.Gen.rivers(S, elev, opts.rivers ?? 22, r);
    App.Gen.nations(S, { count: opts.nations ?? 14, culture: opts.culture || 'mixed' }, r);
    S.texts.push({ id: App.nid(), x: App.WW - 260, y: 110, text: opts.title || '新纪元 元年', size: 30, color: '#3b2a1d', angle: 0, spacing: 0.15, box: true });
    App.undoStack.length = 0; App.redoStack.length = 0;
  };

  App.Gen.blank = () => {
    const S = App.newState(); App.S = S; S.meta.name = '空白地图';
    S.terrain.fill(2); // 整张空白羊皮纸
    App.undoStack.length = 0; App.redoStack.length = 0;
  };
})();
