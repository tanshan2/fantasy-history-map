// ===== 一键把空白地区生成国家（按地区文化）+ 按主国调整各国建国年 =====
(() => {
  const W = App.W, H = App.H, N = App.N;
  const FB = (App.Fill = {});
  const inBox = (lo, la, x0, x1, y0, y1) => lo >= x0 && lo <= x1 && la >= y0 && la <= y1;

  // ---------- 真实地理：按经纬度和年代定文化（先匹配先用） ----------
  FB.regionCulture = (lon, lat, y, geo) => {
    if (geo === 'europe' || (lon < 40 && lat > 35 && geo !== 'asia')) {
      if (lat < 37.5 && lon < 32) return y >= 650 ? 'dashi' : 'latin';            // 北非
      if (inBox(lon, lat, 24, 36, 21, 32)) return y >= 640 ? 'dashi' : 'greek';     // 埃及
      if (inBox(lon, lat, 34, 60, 12, 33)) return y >= 630 ? 'dashi' : 'arabic';    // 阿拉伯、黎凡特
      if (inBox(lon, lat, 26, 45, 35.5, 42.5)) return y >= 1071 ? 'turk' : 'greek'; // 安纳托利亚
      if (inBox(lon, lat, 38, 50, 40, 44.5)) return 'persia';                       // 高加索
      if (inBox(lon, lat, 44, 62, 25, 40)) return y >= 650 ? 'iranislam' : 'persia';
      if (lon < -5 && lat > 51) return 'celtic';                                     // 爱尔兰、苏格兰
      if (lon < 2 && lat > 50) return 'english';                                     // 不列颠
      if (lat > 55 && lon < 32) return 'norse';                                      // 北欧
      if (inBox(lon, lat, -10, 3.5, 35, 44)) return y >= 720 && y < 1250 && lat < 41 ? 'dashi' : 'latin'; // 伊比利亚
      if (inBox(lon, lat, 6, 19, 36, 46.5)) return 'latin';                          // 意大利
      if (inBox(lon, lat, 19, 30, 34, 42.5)) return 'greek';                         // 巴尔干南部、希腊
      if (inBox(lon, lat, -5, 8, 42, 52)) return 'latin';                            // 法兰西
      if (inBox(lon, lat, 6, 16.5, 45, 56)) return 'german';                         // 日耳曼
      if (lon > 50 && lat > 44) return y >= 550 ? 'turk' : 'steppe';                 // 里海以北草原
      return 'slavic';                                                               // 东欧
    }
    // ---- 亚洲 ----
    if (lon < 52 && lat < 12.5) return y >= 900 ? 'dashi' : 'arabic';                // 东非、非洲之角
    if (lon < 60 && lat > 48) return y >= 600 ? 'slavic' : 'steppe';                 // 东欧平原
    if (lat > 53) return 'steppe';                                                   // 西伯利亚
    if (inBox(lon, lat, 75, 95, 36, 43.5)) return y < 900 ? 'tarim' : 'turk';        // 塔里木（先于蒙古高原）
    if (inBox(lon, lat, 129, 147, 30, 46) && !(lon < 131 && lat > 41)) return 'wa';  // 日本列岛
    if (inBox(lon, lat, 124.3, 130.5, 33, 42.5)) return 'korea';                     // 朝鲜半岛
    if (inBox(lon, lat, 116, 136, 40.5, 53)) return lon < 123.5 ? (y >= 900 ? 'khitan' : 'xiongnu') : 'jurchen'; // 辽西、东北
    if (inBox(lon, lat, 87, 123, 41, 53)) return y < 400 ? 'xiongnu' : y < 900 ? 'turk' : y < 1150 ? 'khitan' : 'mongol'; // 蒙古高原
    if (inBox(lon, lat, 75, 95, 36, 43.5)) return y < 900 ? 'tarim' : 'turk';        // 塔里木
    if (inBox(lon, lat, 50, 87, 43.5, 53)) return y < 550 ? 'steppe' : 'turk';       // 中亚草原
    if (inBox(lon, lat, 59, 75, 36.5, 43.5)) return y < 750 ? 'sogd' : 'iranislam';  // 河中
    if (inBox(lon, lat, 60, 72, 29, 36.5)) return y < 500 ? 'kushan' : y < 900 ? 'persia' : 'iranislam'; // 巴克特里亚
    if (inBox(lon, lat, 44, 62, 24, 40)) return y < 650 ? 'persia' : 'iranislam';   // 伊朗高原
    if (inBox(lon, lat, 26, 45, 35.5, 42.5)) return y >= 1071 ? 'turk' : 'greek';   // 安纳托利亚
    if (inBox(lon, lat, 30, 60, 10, 36)) return y >= 630 ? 'dashi' : lat > 29 && lon > 38 ? 'persia' : 'arabic'; // 阿拉伯、两河
    if (inBox(lon, lat, 78, 100, 27, 37.5)) return 'tubo';                            // 青藏
    if (inBox(lon, lat, 97, 106.5, 21, 29.5)) return 'diannan';                      // 滇黔
    if (inBox(lon, lat, 92, 98.6, 9.5, 28.5)) return 'burma';                        // 缅甸
    if (inBox(lon, lat, 102, 108, 8.5, 15)) return 'khmer';                           // 柬埔寨
    if (inBox(lon, lat, 104.5, 110, 15, 23.5)) return 'annam';                        // 越南北部
    if (inBox(lon, lat, 98.6, 106, 5.5, 22)) return 'siam';                           // 泰、老挝
    if (lat < 9 && lon > 95 || inBox(lon, lat, 116, 128, 4, 21)) return 'nanyang';    // 马来、印尼、菲律宾
    if (inBox(lon, lat, 72, 89, 5, 20)) return 'tamil';                               // 南印度、锡兰
    if (inBox(lon, lat, 60, 92, 20, 36)) return 'tianzhu';                            // 北印度
    if (inBox(lon, lat, 97, 126, 18, 42)) return 'huaxia';                            // 中原、江南、岭南
    return null;
  };

  // 这一块地适合什么文明：真实模板按经纬度；架空地图看周围邻国（接壤最多的）
  const nearCulture = (cells) => {
    const S = App.S, seen = new Uint8Array(N), q = cells.slice(), dist = new Uint16Array(N), cnt = new Map();
    cells.forEach((c) => (seen[c] = 1));
    for (let h = 0; h < q.length; h++) {
      const c = q[h], x = c % W, y = (c / W) | 0; if (dist[c] > 40) continue;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
        if (n < 0 || seen[n]) continue; seen[n] = 1; dist[n] = dist[c] + 1;
        const o = S.owner[n];
        if (o) { const nat = App.nation(o); if (nat) cnt.set(nat.culture, (cnt.get(nat.culture) || 0) + 1 / dist[n]); }
        else q.push(n);
      }
    }
    let best = null, bv = 0; cnt.forEach((v, k) => { if (v > bv) { bv = v; best = k; } });
    return best;
  };
  FB.cultureFor = (cells, year) => {
    const S = App.S, geo = S.meta.geo || S.meta.vec, pj = geo && App.Templates && App.Templates.PROJ[geo];
    if (pj) {
      const vote = new Map(), step = Math.max(1, Math.floor(cells.length / 60));
      for (let i = 0; i < cells.length; i += step) { const c = cells[i], [lo, la] = pj.inv((c % W) + 0.5, ((c / W) | 0) + 0.5); const k = FB.regionCulture(lo, la, year, geo); if (k) vote.set(k, (vote.get(k) || 0) + 1); }
      let best = null, bv = 0; vote.forEach((v, k) => { if (v > bv) { bv = v; best = k; } });
      if (best) return best;
    }
    return nearCulture(cells) || App.CULTURES[Math.floor(Math.random() * App.CULTURES.length)].id;
  };

  // ---------- 建国年：以主国为准，相差不超过 300 年 ----------
  FB.SPAN = 300;
  FB.baseYear = () => { const S = App.S, m = App.nation(S.meta.mainNation); return m ? App.Polity.founded(m) : (S.meta.year || 1) - 150; };
  FB.yearNear = (r = Math.random) => {
    const S = App.S, base = FB.baseYear(), now = S.meta.year || 1;
    const hi = Math.min(base + FB.SPAN, Math.max(now, base)), lo = base - FB.SPAN;
    return Math.round(lo + r() * (hi - lo));
  };
  // 设主国并调整：已经在范围内的保留，超出的改到范围内；附庸不早于宗主
  App.Polity.alignFounding = (mainId, r = Math.random) => {
    const S = App.S, m = App.nation(mainId); if (!m) return 0;
    S.meta.mainNation = m.id;
    const base = App.Polity.founded(m), now = S.meta.year || 1, hi = Math.min(base + FB.SPAN, Math.max(now, base)), lo = base - FB.SPAN;
    let k = 0;
    S.nations.forEach((n) => {
      if (n.id === m.id) return;
      const y = App.Polity.founded(n);
      if (y < lo || y > hi || n.founded == null) { n.founded = Math.round(lo + r() * (hi - lo)); k++; }
    });
    S.nations.forEach((n) => { const ov = n.overlord && App.nation(n.overlord); if (ov && n.founded < App.Polity.founded(ov)) { n.founded = Math.min(hi, App.Polity.founded(ov) + Math.round(r() * 80)); } });
    return k;
  };

  // ---------- 一键生成：把所有无主陆地分成若干国家 ----------
  const hueOf = (hex) => { const [r, g, b] = U.hexToRgb(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; const d = mx - mn; let h = mx === r ? (g - b) / d : mx === g ? 2 + (b - r) / d : 4 + (r - g) / d; return (h * 60 + 360) % 360; };
  const colorAway = (cells) => {
    // 选一个和周围国家颜色差得最远的
    const S = App.S, near = new Set();
    cells.forEach((c) => { const x = c % W; for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) if (n >= 0 && n < N && S.owner[n]) near.add(S.owner[n]); });
    const hs = [...near].map((id) => App.nation(id)).filter(Boolean).map((n) => hueOf(n.color));
    const used = new Set(S.nations.map((n) => n.color));
    let best = App.PALETTE[0], bd = -1;
    App.PALETTE.forEach((p) => { const h = hueOf(p); const d = hs.length ? Math.min(...hs.map((x) => { const dd = Math.abs(x - h); return Math.min(dd, 360 - dd); })) : 180; const v = d + (used.has(p) ? -40 : 0) + Math.random() * 8; if (v > bd) { bd = v; best = p; } });
    return best;
  };
  FB.fillBlank = (opt = {}) => {
    const S = App.S, P = App.Polity, r = Math.random, year = FB.baseYear();
    const seen = new Uint8Array(N), comps = [];
    for (let s = 0; s < N; s++) {
      if (seen[s] || S.owner[s] || S.terrain[s] < 2) continue;
      const comp = App.Ops.flood(s, (k) => !S.owner[k] && S.terrain[k] >= 2); comp.forEach((c) => (seen[c] = 1));
      comps.push(comp);
    }
    const ra = P.rowAreas(), target = opt.size || 900000; // 每国约 90 万平方公里（大块土地会分成几国）
    const made = [], fm = P.fertMap();
    comps.forEach((comp) => {
      if (comp.length < (opt.min || 25)) return; // 太小的礁岛不单独成国
      let area = 0; comp.forEach((c) => (area += ra[(c / W) | 0]));
      const k = Math.max(1, Math.min(Math.round(area / target), Math.floor(comp.length / 120) || 1));
      const { idx } = App.Ops.splitCells(comp, k, r, comps.length * 31 + comp.length);
      const groups = []; comp.forEach((c, j) => (groups[idx[j]] = groups[idx[j]] || []).push(c));
      groups.filter((g) => g && g.length).forEach((g) => {
        const cul = FB.cultureFor(g, year);
        const n = App.Ops.addNation({ culture: cul, color: colorAway(g) });
        g.forEach((c) => (S.owner[c] = n.id));
        made.push(n);
      });
    });
    if (!made.length) return [];
    App.Geo.dirtyPol = true; App.Geo.update();
    made.forEach((n) => {
      n.name = ''; n.name = App.Names.nationFor ? App.Names.nationFor(n) : App.Names.nation(n.culture);
      n.rank = P.guessRank(n); n.founded = FB.yearNear(r);
      App.Ops.autoProvinces(n.id, 0, r);
      P.genCities(n.id, r, { fm });
      P.genArmies(n, {}, r);
      P.makeDynasty(n, r);
    });
    return made;
  };
})();
