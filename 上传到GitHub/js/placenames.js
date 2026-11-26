// ===== 地名：不重复，并且贴合地理（南北、河流、山地、海岸、沙漠、森林） =====
(() => {
  const W = App.W, H = App.H, N = App.N, C = App.CELL;
  const NM = App.Names, PN = (App.PlaceNames = {});
  const sp = (s) => s.split(' ');
  const P = (a, r) => a[Math.floor(r() * a.length)];
  const latin = NM.groups.latin;

  // ---------- 华夏：按南北分区的用字（避免「幽州在南方」） ----------
  const REG = {
    north: sp('幽 燕 蓟 涿 檀 妫 代 朔 云 雁 恒 定 冀 并 汾 晋 潞 泽 沁 绛 邢 洺 赵 魏 博 德 沧 棣 胜 丰 夏 灵 盐 银 绥 延 鄜 坊 营 辽 渤 易 莫 瀛 深 祁 忻 岚 石 隰 慈'),
    mid: sp('荆 襄 鄂 岳 洪 饶 信 徐 泗 寿 庐 舒 滁 宣 歙 杭 越 明 婺 衢 苏 湖 常 润 扬 楚 豫 许 颍 陈 汝 蔡 唐 邓 均 房 商 洛 陕 虢 华 同 岐 陇 秦 梁 洋 利 益 彭 绵 剑 巴 渝 夔 忠 沔 随 郢 黄 蕲 光 申 亳 宿 濠 海 兖 郓 青 齐 淄 密 沂 登 莱 曹 濮 汴 郑 怀 卫 相'),
    south: sp('交 广 桂 邕 容 琼 崖 儋 潮 循 韶 端 康 封 闽 泉 漳 汀 建 福 湘 潭 衡 永 郴 柳 象 梧 昭 贺 播 黔 叙 泸 戎 滇 姚 雅 辰 沅 澧 朗 虔 吉 袁 抚 处 温 台 睦'),
    west: sp('凉 甘 肃 沙 瓜 伊 庭 鄯 龟 疏 焉 兰 廓 岷 叠 宕 洮 渭 原 会'),
  };
  const DYN = {
    north: sp('燕 赵 代 晋 魏 齐 辽 金 冀 幽 云 朔 夏 并'),
    mid: sp('秦 韩 郑 卫 鲁 宋 陈 蔡 曹 许 梁 周 汉 隋 唐 雍 豫 襄 荆 徐 殷 邺 吴'),
    south: sp('楚 越 闽 粤 滇 黔 蜀 南 湘 桂 番 吴'),
    west: sp('凉 秦 陇 西 河'),
  };
  const NEUT_A = sp('长 临 平 安 建 永 定 武 宁 开 新 德 怀 兴 昌 隆 太 高 清 咸 嘉 崇 庆 和 乐 宜 文 泰 广 丰 延 寿 景');
  const BAD = new Set(sp('太阳 太中 中国 平安 安全 和平 长江 黄河 江山 山河 海洋 太平洋 广东 广西 东方 西方 南方 北方 中央 和田'));
  const NEUT_B = sp('安 阳 城 宁 平 陵 都 邑 亭 庆 德 兴 昌 武 中 丰 定 远 康 乐 春 化');
  const FEAT_ZH = {
    riverN: sp('河 阳 津 渡 川 水 源 口 汭'), riverS: sp('江 浦 口 津 渡 川 阳 滨 溪'),
    coast: sp('海 浦 港 湾 澳 门 洲 岸 屿'), mountain: sp('山 岭 峰 岩 关 谷 峡 屏 阜 崖'),
    desert: sp('泉 沙 碛 堡 塞 漠'), forest: sp('林 松 桐 柏 桑'), cold: sp('寒 雪 冰 原'), plain: sp('原 平 野 田 阳 丰 都 陵'),
  };
  // 其他东方文明：按地形换后缀
  const FEAT_EAST = {
    wa: { river: sp('川 津 瀬'), coast: sp('浜 浦 崎 津'), mountain: sp('山 岳'), plain: sp('野 原 田'), forest: sp('森 木'), cold: sp('雪') },
    steppe: { river: sp('川 水'), desert: sp('泉 沙'), mountain: sp('山 岭'), plain: sp('原'), cold: sp('寒'), coast: sp('海') },
    nanyang: { coast: sp('港 埠 湾'), river: sp('河'), mountain: sp('山') },
    tianzhu: { coast: sp('港') }, persia: { coast: sp('港') },
    tarim: { desert: sp('泉 碛'), river: sp('河'), mountain: sp('山') }, sogd: { river: sp('河'), desert: sp('泉') }, turk: { river: sp('水 泉'), mountain: sp('山'), desert: sp('泉') },
    khitan: { river: sp('河 水'), mountain: sp('山') }, jurchen: { river: sp('江 河 水'), mountain: sp('山 岭') }, mongol: { river: sp('河'), mountain: sp('山') }, xiongnu: { river: sp('水'), mountain: sp('山') },
    korea: { river: sp('川 津 江'), coast: sp('浦 津 海'), mountain: sp('山 岭'), plain: sp('原 平') },
    diannan: { river: sp('川 江'), mountain: sp('山 岭 关'), plain: sp('甸 坝') },
    tubo: { river: sp('曲 藏布'), mountain: sp('冈 拉 日'), coast: sp('措'), cold: sp('冈') },
    annam: { river: sp('江 津'), coast: sp('海 门 港'), mountain: sp('山 关') },
    siam: { river: sp('河'), coast: sp('港') }, burma: { river: sp('河'), coast: sp('港') }, khmer: { river: sp('河'), coast: sp('港') }, tamil: { coast: sp('港 帕特南') },
  };
  const EAST_SUF = /(城|帐|王庭|牙帐|堡|川|港|埠|补罗|巴德|京|津|宫)$/;
  // 西方文明：按地形换词尾（再统一音译成中文）
  const FEAT_LAT = {
    german: { end: /(burg|heim|stadt|dorf|berg|au|feld|hausen|ach|ingen|mark|wald|enau)$/, river: sp('furt bruck au bach'), mountain: sp('berg stein burg'), coast: sp('hafen munde strand'), forest: sp('wald hain'), plain: sp('feld dorf heim') },
    english: { end: /(ford|ton|ham|shire|field|bury|wick|chester|ley|mouth|by|stead)$/, river: sp('ford bridge mouth'), mountain: sp('hill crag fell'), coast: sp('haven port mouth'), forest: sp('wood hurst'), plain: sp('field ton ham') },
    slavic: { end: /(grad|ograd|ov|sk|insk|ava|ets|nik|ovo|ice|in|oslav|omir)$/, river: sp('brod grad'), mountain: sp('gorsk gora'), coast: sp('morsk port'), forest: sp('les lesk'), plain: sp('pol grad') },
    norse: { end: /(heim|vik|gard|fjord|by|stad|holm|sund|ness|land|dal)$/, river: sp('os dal'), mountain: sp('berg fjell'), coast: sp('vik havn sund fjord'), forest: sp('skog lund'), plain: sp('by stad') },
    celtic: { end: /(more|dale|wen|ach|ock|ran|iel|an|avon|ross|lyn)$/, river: sp('avon ford'), mountain: sp('more ben'), coast: sp('port haven') },
  };

  // ---------- 地理位置 ----------
  let rvKey = '', rvMask = null;
  const river = () => { const S = App.S, k = S.rivers.length + ':' + S.rivers.reduce((a, r) => a + (r.pts ? r.pts.length : 0), 0); if (k !== rvKey || !rvMask) { rvMask = App.Polity.riverMask(); rvKey = k; } return rvMask; };
  PN.latlon = (cx, cy) => {
    const g = App.S.meta.geo || App.S.meta.vec, pj = g && App.Templates && App.Templates.PROJ[g];
    if (pj) { const [lon, lat] = pj.inv(cx, cy); return { lat, lon, geo: g }; }
    return { lat: 55 - (cy / H) * 40, lon: null, geo: null }; // 非真实地图：上北下南
  };
  // cx, cy：格子坐标
  const region = (ll) => {
    if (ll.geo === 'asia' && ll.lon < 100 && ll.lat > 34) return 'west';
    return ll.lat >= 37 ? 'north' : ll.lat >= 29 ? 'mid' : 'south';
  };
  // 一个点周围（半径 2～3 格）的地形
  PN.ctxAt = (x, y) => {
    const S = App.S, rv = river(), gx = Math.floor(x / C), gy = Math.floor(y / C), k = { n: 0, river: 0, mount: 0, coast: 0, desert: 0, forest: 0, cold: 0, plain: 0 };
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = gx + dx, yy = gy + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const c = yy * W + xx, t = S.terrain[c];
      if (t === 0) { k.coast++; continue; } if (t < 2) continue;
      if (dx * dx + dy * dy <= 5) { k.n++; if (rv[c]) k.river++; if (t >= 4 && t <= 6) k.mount++; if (t === 7 || S.climate[c] === 4) k.desert++; if (S.forest[c]) k.forest++; if (t === 9 || S.climate[c] >= 12) k.cold++; if (t === 2) k.plain++; }
    }
    return PN.flags(k, gx, gy, 0.15);
  };
  PN.flags = (k, gx, gy, coastMin) => {
    const n = Math.max(1, k.n), ll = PN.latlon(gx, gy);
    return { ll, reg: region(ll), river: k.river / n > 0.12, mountain: k.mount / n > 0.4, coast: k.coast > 0 && k.coast / Math.max(1, k.n) >= coastMin * 0.1, desert: k.desert / n > 0.45, forest: k.forest / n > 0.5, cold: k.cold / n > 0.5, plain: k.plain / n > 0.5, gx, gy };
  };
  const featureOf = (ctx, r) => {
    if (!ctx) return null;
    const opts = [];
    if (ctx.river) opts.push(['river', 3]); if (ctx.coast) opts.push(['coast', 2.5]); if (ctx.mountain) opts.push(['mountain', 2]);
    if (ctx.desert) opts.push(['desert', 2]); if (ctx.cold) opts.push(['cold', 1.2]); if (ctx.forest) opts.push(['forest', 1]); if (ctx.plain) opts.push(['plain', 1]);
    opts.push([null, 1.4]);
    const tot = opts.reduce((a, o) => a + o[1], 0); let t = r() * tot; for (const [k, w] of opts) { t -= w; if (t <= 0) return k; } return null;
  };
  const zhFeat = (f, ctx) => (f === 'river' ? (ctx.ll.lat >= 33 ? FEAT_ZH.riverN : FEAT_ZH.riverS) : FEAT_ZH[f]);

  // ---------- 已用名字 ----------
  PN.used = (kind) => {
    const S = App.S, s = new Set();
    if (kind === 'city') S.cities.forEach((c) => s.add(c.name));
    if (kind === 'prov') S.provinces.forEach((p) => s.add(p.name));
    if (kind === 'nation') S.nations.forEach((n) => { s.add(n.name); s.add(App.Polity.baseName(n)); });
    return s;
  };
  // 实在重名时加「新、上、下、东…」区分（新约克式）
  const PRE = sp('新 上 下 东 西 南 北 大 小 前 后 中');
  const uniq = (gen, used, tries = 60) => {
    let v; for (let i = 0; i < tries; i++) { v = gen(i); if (v && !used.has(typeof v === 'object' ? v.name : v)) return v; }
    if (!v) return v;
    for (const p of PRE) { const w = typeof v === 'object' ? { name: p + v.name, base: p + (v.base || '') } : p + v; if (!used.has(typeof w === 'object' ? w.name : w)) return w; }
    return v;
  };

  // ---------- 城市 ----------
  const cityZh = (ctx, r) => {
    const f = featureOf(ctx, r), reg = ctx ? ctx.reg : null;
    let a = reg && r() < 0.65 ? P(REG[reg], r) : P(NEUT_A, r);
    let b = f ? P(zhFeat(f, ctx), r) : P(NEUT_B, r);
    if (a === b || BAD.has(a + b)) b = P(sp('城 邑 陵 亭'), r);
    return a + b;
  };
  const cityOf = (cul, ctx, r) => {
    if (cul === 'huaxia') return cityZh(ctx, r);
    const f = featureOf(ctx, r);
    if (latin.includes(cul) && NM.genRaw) {
      const t = FEAT_LAT[cul], raw = NM.genRaw(cul, 'city', r);
      if (t && f && t[f] && r() < 0.8) return App.Translit.name(raw.replace(t.end, '') + P(t[f], r));
      return App.Translit.name(raw);
    }
    const base = NM.gen(cul, 'city', r), t = FEAT_EAST[cul];
    if (t && f && t[f] && r() < 0.7) return (NM.stripSuffix(base.replace(EAST_SUF, '')) || base) + P(t[f], r);
    return base;
  };
  // 新签名：city(文明, 随机数, 世界坐标 x, y)
  NM.city = (cul, r = Math.random, x, y, used) => {
    const ctx = x != null ? PN.ctxAt(x, y) : null, u = used || PN.used('city');
    return uniq(() => cityOf(cul, ctx, r), u);
  };

  // ---------- 国名 ----------
  const origNation = NM.nation;
  NM.nation = (cul, r = Math.random, ctx) => {
    const u = PN.used('nation');
    return uniq(() => {
      if (cul === 'huaxia' && ctx) {
        const d = P(DYN[ctx.reg] || DYN.mid, r), dir = ctx.dir;
        return P(['大' + d, d + '国', d, '大' + d, dir ? dir + d : '后' + d], r);
      }
      return origNation(cul, r);
    }, { has: (v) => u.has(v) || u.has(App.Polity.baseName({ name: v, culture: cul })) });
  };
  // 按国家领土位置起国名
  PN.nationCtx = (n) => {
    const S = App.S; let sx = 0, sy = 0, k = 0;
    for (let c = 0; c < N; c += 3) if (S.owner[c] === n.id) { sx += c % W; sy += (c / W) | 0; k++; }
    if (!k) return null;
    const gx = sx / k, gy = sy / k, ll = PN.latlon(gx, gy);
    const dx = gx / W - 0.5, dy = gy / H - 0.5;
    const dir = Math.abs(dx) > Math.abs(dy) ? (Math.abs(dx) > 0.15 ? (dx < 0 ? '西' : '东') : null) : Math.abs(dy) > 0.15 ? (dy < 0 ? '北' : '南') : null;
    return { ll, reg: region(ll), dir };
  };
  NM.nationFor = (n, r = Math.random) => NM.nation(n.culture, r, PN.nationCtx(n));

  // ---------- 行政区 ----------
  const origProvFor = NM.provFor;
  const DIRS = (ctx, nc) => { if (!nc) return P(sp('东 西 南 北'), Math.random); const dx = ctx.gx - nc[0], dy = ctx.gy - nc[1]; return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? '西' : '东') : dy < 0 ? '北' : '南'; };
  const provZh = (n, level, ctx, r, nc) => {
    const sys = App.sysOf(n), forms = sys.lv[Math.min(level, sys.levels)], form = P(forms, r);
    if (form.includes('{X}')) return null;
    let base;
    if (/^(道|路|省|行省)$/.test(form) && ctx) {
      // 唐道、宋路、明省：「河北」「江南」「山东」「岭南」式
      const lm = ctx.river ? (ctx.ll.lat >= 33 ? '河' : '江') : ctx.mountain ? P(sp('山 岭 剑 关'), r) : ctx.coast ? '海' : ctx.desert ? '沙' : P(REG[ctx.reg], r);
      base = r() < 0.75 ? lm + DIRS(ctx, nc) : P(REG[ctx.reg], r) + P(REG[ctx.reg], r);
      if (Array.from(base)[0] === Array.from(base)[1]) base = P(REG[ctx.reg], r) + DIRS(ctx, nc);
    } else if (level === 1 && form.length === 1 && ctx) base = P(REG[ctx.reg], r);
    else base = cityZh(ctx, r);
    return { name: base + form, base };
  };
  NM.provFor = (n, level, r = Math.random, ctx, used, nc) => {
    const u = used || PN.used('prov');
    return uniq(() => (n && n.culture === 'huaxia' && ctx ? provZh(n, level, ctx, r, nc) : null) || (ctx ? provOther(n, level, ctx, r) : origProvFor(n, level, r)), u);
  };
  const provOther = (n, level, ctx, r) => {
    const sys = App.sysOf(n), forms = sys.lv[Math.min(level, sys.levels)], form = P(forms, r);
    const nm = cityOf(n ? n.culture : 'huaxia', ctx, r), base = NM.stripSuffix(nm) || nm;
    return form.includes('{X}') ? { name: form.replace('{X}', base), base } : { name: base + form, base };
  };
  // 按每个行政区的实际范围（地形占比、重心位置）重新起名
  PN.fitProvinces = (nid, filter = () => true, r = Math.random) => {
    const S = App.S, n = App.nation(nid); if (!n) return 0;
    const list = S.provinces.filter((p) => p.nation === nid && filter(p)); if (!list.length) return 0;
    const acc = new Map(); list.forEach((p) => acc.set(p.id, { n: 0, sx: 0, sy: 0, river: 0, mount: 0, coast: 0, desert: 0, forest: 0, cold: 0, plain: 0 }));
    const rv = river(); let nx = 0, ny = 0, nn = 0;
    for (let c = 0; c < N; c++) {
      if (S.owner[c] !== nid || S.terrain[c] < 2) continue;
      const x = c % W, y = (c / W) | 0; nx += x; ny += y; nn++;
      const t = S.terrain[c], co = (x > 0 && S.terrain[c - 1] === 0) || (x < W - 1 && S.terrain[c + 1] === 0) || (y > 0 && S.terrain[c - W] === 0) || (y < H - 1 && S.terrain[c + W] === 0);
      for (const id of [S.prov[c], S.prov2[c], S.prov3[c]]) {
        const k = id && acc.get(id); if (!k) continue;
        k.n++; k.sx += x; k.sy += y; if (rv[c]) k.river++; if (t >= 4 && t <= 6) k.mount++; if (co) k.coast++;
        if (t === 7 || S.climate[c] === 4) k.desert++; if (S.forest[c]) k.forest++; if (t === 9 || S.climate[c] >= 12) k.cold++; if (t === 2) k.plain++;
      }
    }
    const nc = nn ? [nx / nn, ny / nn] : null;
    const used = PN.used('prov'); list.forEach((p) => used.delete(p.name));
    let k = 0;
    list.sort((a, b) => (a.level || 1) - (b.level || 1)).forEach((p) => {
      const a = acc.get(p.id); if (!a.n) { used.add(p.name); return; }
      const gx = a.sx / a.n, gy = a.sy / a.n;
      const ctx = PN.flags({ ...a, coast: a.coast }, gx, gy, 0);
      ctx.coast = a.coast / a.n > 0.04; ctx.river = a.river / a.n > 0.08; ctx.mountain = a.mount / a.n > 0.35;
      // 下级沿用上级的大区（避免同一州下出现南北矛盾）
      const v = NM.provFor(n, p.level || 1, r, ctx, used, nc);
      p.name = v.name; p.base = v.base; used.add(v.name); k++;
    });
    return k;
  };
  PN.fitProvince = (p, r) => PN.fitProvinces(p.nation, (q) => q.id === p.id, r);

  // ---------- 接入：自动划分、全部重命名 ----------
  const O = App.Ops, origAuto = O.autoProvinces;
  O.autoProvinces = (nid, ...a) => { const before = App.S.nextId; const res = origAuto(nid, ...a); PN.fitProvinces(nid, (p) => p.id >= before && !p.hist); return res; };
  O.renameAll = (nid, r = Math.random) => {
    const S = App.S, n = App.nation(nid); if (!n) return;
    const keep = n.name; n.name = ''; n.name = NM.nationFor(n, r) || keep;
    if (App.Polity && n.rank) App.Polity.renameByRank(n);
    PN.fitProvinces(nid, () => true, r);
    const mine = S.cities.filter((ct) => S.owner[O.cellAt(ct.x, ct.y)] === nid), used = PN.used('city');
    mine.forEach((ct) => used.delete(ct.name));
    mine.forEach((ct) => { ct.name = NM.city(n.culture, r, ct.x, ct.y, used); used.add(ct.name); });
  };
})();
