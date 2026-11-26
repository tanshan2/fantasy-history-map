// ===== 人口：按地理分配，用真实历史户口校准 =====
// 1) 每个制度对应一次真实的户口统计（或史家估计）：人口 ÷ 疆域 = 该朝的人口密度；
// 2) 每格人口 = 面积 × 密度 × 土地丰饶度 ÷ 该朝疆域的平均丰饶度（平原河谷多、山地沙漠少）；
//    这样在历史疆域上，全国总数正好回到史书的数字；
// 3) 有省级史料的（明洪武二十六年各布政使司），真实的省直接用史书数字（按领土覆盖比例折算），
//    省内再按地理分给府、县。
(() => {
  // total：人口；terr：统计时的疆域（平方公里，和行政区划用的一致）；est：true＝史家估计，不是当时的户口统计
  const H = {
    qin: { total: 20000000, terr: 3400000, est: true, src: '秦末约二千万（葛剑雄估计，无户口统计传世）' },
    han: { total: 59594978, terr: 4000000, src: '西汉元始二年（公元 2 年）户口：五千九百五十九万四千九百七十八口（《汉书·地理志》）' },
    sui: { total: 46019956, terr: 3800000, src: '隋大业五年（609）：四千六百零一万九千九百五十六口（《隋书·地理志》）' },
    tang: { total: 52919309, terr: 4300000, src: '唐天宝十三载（754）：五千二百九十一万九千三百零九口（《通典·食货》）' },
    song: { total: 104000000, terr: 2800000, est: true, src: '北宋大观四年（1110）约一亿零四百万（吴松弟估计；官方户籍只记男口，崇宁元年记四千五百三十二万口）' },
    yuan: { total: 58834711, terr: 9000000, src: '元至元二十七年（1290）：五千八百八十三万四千七百一十一口（《元史·地理志》）' },
    ming: { total: 60545812, terr: 3800000, src: '明洪武二十六年（1393）：六千零五十四万五千八百一十二口（《明太祖实录》《诸司职掌》）',
      units: { '浙江省': 10487567, '江西省': 8982481, '湖广省': 4702660, '福建省': 3916806, '山东省': 5255876, '山西省': 4072127, '河南省': 1912542,
        '陕西省': 2316569, '四川省': 1466778, '广东省': 3007932, '广西省': 1482671, '云南省': 259270, '北直隶': 1926595, '南直隶': 10755938,
        '贵州省': 500000 },
      // 《明史·地理志》所载洪武二十六年府级口数
      l2: { '苏州府': 2355030, '松江府': 1219937, '常州府': 775513 },
      // 洪武户口只计民户；边地都司卫所是军籍，另按史家估计（不从所属布政司的民户里分）
      sub: { '辽东都司': 400000, '甘州卫': 200000, '宁夏卫': 100000, '西宁卫': 80000, '榆林卫': 50000, '建昌卫': 100000, '施州卫': 80000 },
      subNote: '贵州 1413 年才建省，洪武户口无此项，按约 50 万估计；辽东都司等边地卫所为军籍，另按史家估计；云南、广西等地洪武户口只记编户，土司辖下人口未计入，所以显得很少' },
    mengan: { total: 53532151, terr: 3600000, src: '金泰和七年（1207）：五千三百五十三万二千一百五十一口（《金史·食货志》）' },
    liao: { total: 9000000, terr: 4890000, est: true, src: '辽盛时约九百万（史家估计）' },
    ritsuryo: { total: 4510000, terr: 295000, est: true, src: '奈良时代（725 年前后）约四百五十万（鬼头宏估计）' },
    joseon: { total: 14000000, terr: 222000, est: true, src: '朝鲜十八世纪约一千四百万（户籍记七百余万，史家按漏报推估）' },
    silla: { total: 2500000, terr: 150000, est: true, src: '统一新罗约二百五十万（史家估计）' },
    decimal: { total: 1000000, terr: 2700000, est: true, src: '成吉思汗建国时蒙古诸部约一百万（史家估计）' },
    xiongnu: { total: 1500000, terr: 3000000, est: true, src: '匈奴盛时约一百五十万（史家据「控弦之士三十余万」推估）' },
    turkwing: { total: 2000000, terr: 3000000, est: true, src: '西突厥约二百万（史家估计）' },
    tubo: { total: 3000000, terr: 1200000, est: true, src: '吐蕃本部约三百万（史家估计）' },
    nanzhao: { total: 2500000, terr: 500000, est: true, src: '南诏、大理约二百五十万（史家估计）' },
    daiviet: { total: 3500000, terr: 150000, est: true, src: '黎朝十五世纪约三百五十万（史家估计）' },
    gupta: { total: 40000000, terr: 3500000, est: true, src: '笈多王朝疆域内约四千万（McEvedy 估计）' },
    chola: { total: 10000000, terr: 400000, est: true, src: '朱罗王朝约一千万（史家估计）' },
    muang: { total: 2000000, terr: 400000, est: true, src: '阿瑜陀耶约二百万（史家估计）' },
    myo: { total: 2000000, terr: 500000, est: true, src: '东吁王朝约二百万（史家估计）' },
    angkor: { total: 3000000, terr: 1000000, est: true, src: '吴哥盛时约三百万（史家估计）' },
    mandala: { total: 4000000, terr: 1200000, est: true, src: '满者伯夷约四百万（史家估计）' },
    oasis: { total: 400000, terr: 1300000, est: true, src: '西域诸国合计约四十万口（据《汉书·西域传》各国户口相加）' },
    sasanian: { total: 9000000, terr: 3500000, est: true, src: '萨珊波斯约九百万（史家估计）' },
    satrapy: { total: 17000000, terr: 5500000, est: true, src: '阿契美尼德约一千七百万（McEvedy 估计）' },
    iqta: { total: 10000000, terr: 3900000, est: true, src: '大塞尔柱约一千万（史家估计）' },
    wilayah: { total: 30000000, terr: 11000000, est: true, src: '阿拔斯王朝盛时约三千万（史家估计）' },
    lateRome: { total: 50000000, terr: 4400000, est: true, src: '公元 300 年前后罗马帝国约五千万（史家估计）' },
    theme: { total: 12000000, terr: 600000, est: true, src: '九世纪拜占庭约一千二百万（史家估计）' },
    feudal: { total: 9000000, terr: 450000, est: true, src: '公元一千年前后法兰西约九百万（史家估计）' },
    shire: { total: 1700000, terr: 130000, est: true, src: '1086 年英格兰约一百七十万（据《末日审判书》推估）' },
    guberniya: { total: 35000000, terr: 5000000, est: true, src: '1800 年前后欧俄约三千五百万（第五次人口登记推估）' },
    ottoman: { total: 30000000, terr: 5200000, est: true, src: '1600 年前后奥斯曼帝国约三千万（史家估计）' },
  };
  App.POP_HIST = H;
  const Pop = (App.Pop = { dirty: true });
  Pop.str = (v) => (v >= 1e8 ? (v / 1e8).toFixed(2) + ' 亿' : v >= 1e4 ? (v >= 1e6 ? Math.round(v / 1e4) : (v / 1e4).toFixed(1)) + ' 万' : Math.round(v) + '');
  // 历史依据：每平方公里多少人（在该朝疆域的平均土地上）
  Pop.densityOf = (key) => { const h = H[key] || { total: 30, terr: 1 }; return h.total / h.terr; };
  Pop.note = (key) => { const h = H[key]; if (!h) return '没有该制度的户口史料，按每平方公里约 30 人估算。'; return h.src + (h.subNote ? '；' + h.subNote : '') + '。'; };

  // 计算全部国家、各级行政区的人口（缓存，地图改动后重算）
  Pop.compute = () => {
    const key = App.S.provinces.length + ':' + App.S.nextId + ':' + App.S.nations.map((n) => n.id + (n.adminSys || '')).join(',') + ':' + App.S.meta.geo;
    if (!Pop.dirty && Pop.cache && Pop.key === key) return Pop.cache;
    Pop.key = key;
    const S = App.S, N = App.N, W = App.W, ra = App.Polity.rowAreas(), rv = App.Polity.riverMask();
    const byNation = new Map(), byProv = new Map(), cellW = new Float32Array(N);
    // k：人口向沃土集中的程度。农耕文明人口几乎都挤在平原河谷（k≈2.2），游牧文明分散得多（k≈1.4）
    const info = new Map(S.nations.map((n) => { const key = App.sysKey(n), st = App.adminStyle ? App.adminStyle(n) : { pop: 1 }; return [n.id, { key, d: Pop.densityOf(key), ref: (App.ADMIN_REF && App.ADMIN_REF[key]) || 0.75, k: 1 + 1.2 * st.pop, T: 0, Q: 0 }]; }));
    // 第一遍：全国总数按「面积 × 密度 × 丰饶度」（和史书校准的口径一致），同时累计 面积 × 丰饶度^k
    const wk = new Float32Array(N);
    for (let c = 0; c < N; c++) {
      const o = S.owner[c]; if (!o || S.terrain[c] < 2) continue; const k = info.get(o); if (!k) continue;
      const w = 0.15 + 0.85 * Math.min(1.25, App.Polity.fertility(c, rv)), a = ra[(c / W) | 0];
      k.T += a * k.d * w / k.ref; wk[c] = a * Math.pow(w, k.k); k.Q += wk[c];
    }
    // 第二遍：全国总数不变，按 丰饶度^k 分到每一格（沃土集中得多，山地沙漠很少）
    for (let c = 0; c < N; c++) {
      if (!wk[c]) continue; const o = S.owner[c], k = info.get(o);
      const v = (k.T * wk[c]) / k.Q; cellW[c] = v;
      byNation.set(o, (byNation.get(o) || 0) + v);
      for (const id of [S.prov[c], S.prov2[c], S.prov3[c]]) if (id) byProv.set(id, (byProv.get(id) || 0) + v);
    }
    // 第三遍：有省级史料的真实省份，按史书数字（乘领土覆盖比例）整体缩放，省内比例不变；
    // 另计的单位（边地卫所）按各自的估计数，不从省的民户里分
    const scale = new Map(), scale2 = new Map(), basis = new Map();
    S.nations.forEach((n) => {
      const h = H[info.get(n.id).key]; if (!h || !h.units) return;
      const plan = App.Ops.histPlan ? App.Ops.histPlan(n) : null; if (!plan) return;
      plan.units.forEach((u) => {
        const rec = h.units[u.name]; if (!rec) return;
        const p = S.provinces.find((q) => q.nation === n.id && (q.level || 1) === 1 && q.hist && q.name === u.name); if (!p || !byProv.get(p.id)) return;
        const cover = Math.min(1, u.kids.length / u.total);
        let rest = byProv.get(p.id), restRec = rec * cover;
        S.provinces.filter((q) => q.parent === p.id && q.hist && byProv.get(q.id)).forEach((q) => {
          // 另计的卫所：不占本省民户；有府级史料的府：直接用，从本省数字里扣除
          const sub = h.sub && h.sub[q.name], own = h.l2 && h.l2[q.name];
          if (sub) { scale2.set(q.id, sub / byProv.get(q.id)); basis.set(q.id, { rec: sub, cover: 1, est: true }); rest -= byProv.get(q.id); }
          else if (own && own < restRec) { scale2.set(q.id, own / byProv.get(q.id)); basis.set(q.id, { rec: own, cover: 1 }); rest -= byProv.get(q.id); restRec -= own; }
        });
        if (rest > 0) scale.set(p.id, restRec / rest);
        basis.set(p.id, { rec, cover });
      });
    });
    if (scale.size || scale2.size) {
      byNation.clear(); byProv.clear();
      for (let c = 0; c < N; c++) {
        const v0 = cellW[c]; if (!v0) continue; const f = scale2.get(S.prov2[c]) || scale.get(S.prov[c]) || 1, v = v0 * f, o = S.owner[c];
        byNation.set(o, (byNation.get(o) || 0) + v);
        for (const id of [S.prov[c], S.prov2[c], S.prov3[c]]) if (id) byProv.set(id, (byProv.get(id) || 0) + v);
      }
    }
    Pop.cache = { byNation, byProv, basis }; Pop.dirty = false;
    return Pop.cache;
  };
  Pop.nation = (id) => Pop.compute().byNation.get(id) || 0;
  Pop.prov = (id) => Pop.compute().byProv.get(id) || 0;
  Pop.basis = (id) => Pop.compute().basis.get(id) || null;
  // 鼠标悬停用：先给上次的结果，停手 0.5 秒后再在后台重算（画图时不卡）
  let soonT = 0;
  Pop.provSoft = (id) => { if (Pop.dirty || !Pop.cache) { clearTimeout(soonT); soonT = setTimeout(() => Pop.compute(), 500); } return Pop.cache ? Pop.cache.byProv.get(id) || 0 : 0; };
  // 地图一改就标记重算
  const wrap = (name) => { const f = App[name]; if (typeof f !== 'function') return; App[name] = (...a) => { Pop.dirty = true; return f(...a); }; };
  wrap('changed'); wrap('afterBigChange');
})();
