// ===== 国体、爵位、分封、国力 =====
(() => {
  const W = App.W, H = App.H, N = App.N;
  const P = (App.Polity = {});
  const pick = (a, r = Math.random) => a[Math.floor(r() * a.length)];

  // ---------- 国体（爵位） ----------
  // cat：皇室 / 王室 / 贵族 / 其他；tier 越小地位越高
  const R = (id, name, tier, cat, house, ruler, heir, consort, suffix, note) => ({ id, name, tier, cat, house, ruler, heir, consort, suffix, note });
  App.RANKS = [
    R('empire', '帝国', 1, '皇室', '皇室', '皇帝', '太子', '皇后', '帝国', '万王之王，统辖诸国与诸侯。'),
    R('caliphate', '哈里发国', 1, '皇室', '皇室', '哈里发', '王储', '王后', '哈里发国', '先知的继承者，政教合一。'),
    R('tsardom', '沙皇国', 1, '皇室', '皇室', '沙皇', '皇储', '皇后', '沙皇国', ''),
    R('kingdom', '王国', 2, '王室', '王室', '国王', '王储', '王后', '王国', ''),
    R('khanate', '汗国', 2, '王室', '汗室', '可汗', '特勤', '可敦', '汗国', '草原诸部共推的君主。'),
    R('sultanate', '苏丹国', 2, '王室', '王室', '苏丹', '王储', '王后', '苏丹国', ''),
    R('shogunate', '幕府', 2, '贵族', '将军家', '征夷大将军', '世子', '御台所', '幕府', '名义上奉天皇，实际掌国政的武家政权。'),
    R('grandDuchy', '大公国', 3, '贵族', '大公家族', '大公', '世子', '大公夫人', '大公国', ''),
    R('electorate', '选侯国', 3, '贵族', '选帝侯家族', '选帝侯', '世子', '选侯夫人', '选侯国', '有权选举皇帝的诸侯。'),
    R('duchy', '公国', 3, '贵族', '公爵家族', '公爵', '世子', '公爵夫人', '公国', ''),
    R('margraviate', '边疆伯国', 4, '贵族', '边疆伯爵家族', '边疆伯爵', '世子', '伯爵夫人', '边疆伯国', '镇守边境的伯爵，兵权较重。'),
    R('marquisate', '侯国', 4, '贵族', '侯爵家族', '侯爵', '世子', '侯爵夫人', '侯国', ''),
    R('county', '伯国（伯爵领）', 5, '贵族', '伯爵家族', '伯爵', '世子', '伯爵夫人', '伯国', '独立的伯爵领，自成一国。'),
    R('jarldom', '雅尔领', 5, '贵族', '雅尔家族', '雅尔', '世子', '雅尔夫人', '雅尔领', '北欧的伯爵级领主。'),
    R('barony', '男爵领', 6, '贵族', '男爵家族', '男爵', '继承人', '男爵夫人', '男爵领', ''),
    R('republic', '共和国', 3, '其他', '执政家族', '执政官', '继承人', '夫人', '共和国', '由元老或公民选出执政者。'),
    R('merchant', '商业共和国', 3, '其他', '商人世家', '总督', '继承人', '夫人', '共和国', '由商人寡头统治的海上城邦。'),
    R('theocracy', '神权国', 3, '其他', '祭司世家', '大祭司', '继承人', '夫人', '神权国', ''),
    R('tribe', '部落', 6, '其他', '酋长家族', '酋长', '继承人', '酋长夫人', '部', ''),
    R('fief', '封国（中国分封）', 4, '贵族', '', '', '', '', '国', '受中原王朝分封的诸侯国、封国、藩镇、土司或藩属。'),
  ];
  P.rankById = (id) => App.RANKS.find((r) => r.id === id);

  // ---------- 中国历代分封 ----------
  // same：同姓宗室（与宗主同一家族姓氏）；pre：家族名前缀，如「齐王刘氏」；suf：按国体改名时的后缀
  const T = (id, name, ruler, house, extra = {}) => ({ id, name, ruler, house, heir: '世子', consort: '夫人', suf: '国', ...extra });
  App.FIEF_SYS = {
    zhou: { name: '周·诸侯国（王、公、侯、伯、子、男）', note: '周天子分封同姓与功臣为诸侯，爵分公、侯、伯、子、男五等，诸侯世袭，须朝觐纳贡、出兵勤王。春秋以后王室衰微，诸侯各自为政，战国时大国纷纷称王。宗主可选周天子，也可独立。', tiers: [
      T('wang', '王国（称王诸侯）', '王', '王室', { pre: '王', short: '王', heir: '太子', consort: '王后' }),
      T('gong', '公国', '公', '公室', { pre: '公', short: '公', heir: '太子', consort: '夫人' }), T('hou', '侯国', '侯', '公室', { pre: '侯', short: '侯', heir: '太子', consort: '夫人' }),
      T('bo', '伯国', '伯', '公室', { pre: '伯', short: '伯' }), T('zi', '子国', '子', '公室', { pre: '子', short: '子' }), T('nan', '男国', '男', '公室', { pre: '男', short: '男' })] },
    han: { name: '汉·郡国并行', note: '汉初在郡县之外分封同姓诸侯王（王国）与功臣列侯（侯国）。七国之乱后，诸侯王不得治民，由朝廷派相治理。', tiers: [
      T('wang', '诸侯王国', '诸侯王', '宗室', { same: true, pre: '王', short: '王', heir: '王太子', consort: '王后' }), T('liehou', '列侯国', '列侯', '列侯家族', { pre: '侯', short: '侯' })] },
    jin: { name: '西晋·宗王出镇', note: '晋武帝大封宗室为王，按户数分大国（二万户）、次国（一万户）、小国（五千户），可自置军队，后来酿成八王之乱。', tiers: [
      T('da', '大国', '王', '宗室', { same: true, pre: '王', short: '王', heir: '世子', consort: '王妃' }), T('ci', '次国', '王', '宗室', { same: true, pre: '王', short: '王', consort: '王妃' }),
      T('xiao', '小国', '王', '宗室', { same: true, pre: '王', consort: '王妃' }), T('jungong', '郡公国', '郡公', '勋贵家族', { pre: '公' }), T('xianhou', '县侯国', '县侯', '勋贵家族', { pre: '侯' })] },
    tang: { name: '唐·藩镇与羁縻府州', note: '安史之乱后节度使拥兵自重，河朔三镇父子相承，名为唐臣、实为割据。边疆设羁縻府州，由部族首领世袭都督、刺史。', tiers: [
      T('fanzhen', '藩镇', '节度使', '藩帅家族', { suf: '镇', heir: '留后' }), T('jimi', '羁縻都督府', '都督（世袭）', '部族首领家族', { suf: '都督府' })] },
    yuan: { name: '元·宗王兀鲁思与投下', note: '蒙古以黄金家族宗王分领兀鲁思（封民与封地），功臣贵族另有投下封地，各自统治其民。', tiers: [
      T('ulus', '宗王兀鲁思', '宗王', '黄金家族', { same: true, pre: '王', suf: '兀鲁思', consort: '王妃' }), T('touxia', '投下封地', '投下领主', '勋贵家族', { suf: '投下' })] },
    ming: { name: '明·藩王与土司', note: '明太祖分封诸子为亲王，镇守边塞；亲王嫡长子袭亲王，诸子封郡王。西南设土司，由当地首领世袭宣慰使等职。', tiers: [
      T('qinwang', '亲王藩国', '亲王', '宗室', { same: true, pre: '王', short: '王', heir: '世子', consort: '王妃' }), T('junwang', '郡王封国', '郡王', '宗室', { same: true, pre: '郡王', short: '郡王', consort: '郡王妃' }),
      T('tusi', '土司（宣慰司）', '宣慰使', '土司家族', { suf: '宣慰司', heir: '承袭人' })] },
    qing: { name: '清·三藩与外藩札萨克', note: '清初封吴三桂等为藩王镇守南方（三藩）；漠南、漠北蒙古编为札萨克旗，王公世袭、自治其旗。', tiers: [
      T('fanwang', '藩王', '藩王', '藩王家族', { suf: '藩', consort: '王妃' }), T('jasak', '札萨克旗', '札萨克', '蒙古王公', { suf: '旗', heir: '协理台吉' })] },
    edo: { name: '日本·幕藩体制', note: '德川幕府之下分两百余藩，大名世袭统治其藩，须参勤交代、效忠将军。', tiers: [
      T('han', '藩', '大名', '大名家', { suf: '藩', heir: '世子', consort: '正室' })] },
    tributary: { name: '朝贡·册封藩属', note: '周边国家奉中原王朝正朔，新王即位须受册封、定期朝贡，内政自主。', tiers: [
      T('fanshu', '藩属国', '国王（受册封）', '王室', { heir: '世子', consort: '王妃' })] },
  };
  P.fiefTier = (n) => { const s = App.FIEF_SYS[n.fiefSys || 'zhou'] || App.FIEF_SYS.zhou; return s.tiers.find((t) => t.id === n.fiefTitle) || s.tiers[0]; };

  // 从国名猜国体
  const GUESS = [[/哈里发国$/, 'caliphate'], [/苏丹国$/, 'sultanate'], [/大公国$/, 'grandDuchy'], [/选侯国$/, 'electorate'], [/边疆伯国$|边区$/, 'margraviate'],
    [/伯国$|伯爵领$/, 'county'], [/侯国$/, 'marquisate'], [/公国$/, 'duchy'], [/男爵领$/, 'barony'], [/雅尔领$/, 'jarldom'], [/沙皇国$/, 'tsardom'],
    [/汗国$/, 'khanate'], [/帝国$/, 'empire'], [/幕府$/, 'shogunate'], [/王国$|王朝$|罗斯$/, 'kingdom'], [/共和国$/, 'republic'], [/部落联盟$|诸氏族$|部$|联盟$/, 'tribe']];
  P.guessRank = (n) => {
    const nm = n.name || '';
    for (const [re, id] of GUESS) if (re.test(nm)) return id;
    if (/^大/.test(nm)) return 'empire';
    return 'kingdom';
  };
  P.rankOf = (n) => P.rankById(n.rank) || P.rankById(P.guessRank(n));
  // 当前国家的完整称号信息
  P.title = (n) => {
    const r = P.rankOf(n);
    if (r.id !== 'fief') return { rank: r, name: r.name, ruler: r.ruler, house: r.house, cat: r.cat, heir: r.heir, consort: r.consort, suf: r.suffix };
    const sys = App.FIEF_SYS[n.fiefSys || 'zhou'] || App.FIEF_SYS.zhou, t = P.fiefTier(n);
    // 诸侯称号：齐侯、秦公、楚王（国名主体 + 爵）
    const b = Array.from(P.baseName(n)), ruler = t.short && b.length ? (b.length <= 2 ? b.join('') : b[0]) + t.short : t.ruler;
    return { rank: r, name: t.name, sys, tier: t, ruler, house: t.house, cat: t.house === '王室' ? '王室' : '贵族', heir: t.heir, consort: t.consort, suf: t.suf, same: t.same, pre: t.pre };
  };
  P.founded = (n) => (n.founded != null ? n.founded : (App.S.meta.year || 1) - 40 - Math.floor(U.hash(n.id, 7, 3) * 320));
  P.yearStr = (y) => (y < 0 ? '前' + -y : y) + ' 年';
  P.overlord = (n) => (n.overlord ? App.nation(n.overlord) : null);
  P.vassals = (n) => App.S.nations.filter((v) => v.overlord === n.id);
  P.dynasty = (n) => { const f = n.dynasty && App.Family.fam(n.dynasty); return f || null; };

  // 按国体改名：保留国名主体，换成对应称号
  const STRIP = /(商业共和国|哈里发国|苏丹国|大公国|选侯国|边疆伯国|伯爵领|沙皇国|雅尔领|男爵领|共和国|神权国|部落联盟|诸氏族|宣慰司|都督府|兀鲁思|帝国|王国|王朝|汗国|公国|侯国|伯国|子国|男国|幕府|投下|联盟|邦联|罗斯|同盟|部落|国|藩|镇|旗|部)$/;
  P.baseName = (n) => {
    let s = (n.name || '').replace(/（.*?）|\(.*?\)/g, '').trim();
    for (let i = 0; i < 2; i++) s = s.replace(STRIP, '');
    if (n.culture === 'huaxia' || n.culture === 'steppe') s = s.replace(/^大(?=.)/, '');
    return s || n.name || '';
  };
  P.renameByRank = (n) => {
    const b = P.baseName(n), t = P.title(n), r = t.rank;
    if (r.id === 'empire' && n.culture === 'huaxia') n.name = (Array.from(b).length <= 1 ? '大' : '') + b;
    else n.name = b + t.suf;
  };

  // ---------- 面积 ----------
  let rowKey = null, rowArea = null;
  const geoOf = () => App.S.meta.geo || App.S.meta.vec || null;
  P.rowAreas = () => {
    const g = geoOf();
    if (rowKey === g && rowArea) return rowArea;
    rowArea = new Float64Array(H); rowKey = g;
    const pj = g && App.Templates && App.Templates.PROJ[g];
    const km = (a, b) => { const la = ((a[1] + b[1]) / 2) * Math.PI / 180; return Math.hypot((b[0] - a[0]) * Math.cos(la), b[1] - a[1]) * 111.32; };
    for (let y = 0; y < H; y++) {
      if (!pj) { rowArea[y] = 150; continue; } // 非真实地图：每格约 12 公里见方
      const x = W / 2, p0 = pj.inv(x, y + 0.5), p1 = pj.inv(x + 1, y + 0.5), p2 = pj.inv(x, y + 1.5);
      rowArea[y] = km(p0, p1) * km(p0, p2);
    }
    return rowArea;
  };
  P.areaStr = (km2) => (km2 >= 1e4 ? (km2 / 1e4).toFixed(km2 >= 1e5 ? 0 : 1) + ' 万平方公里' : Math.round(km2) + ' 平方公里');

  // ---------- 军力 ----------
  P.troops = (s) => {
    if (s == null || s === '') return 5000;
    const m = String(s).replace(/[,，\s]/g, '').match(/([\d.]+)\s*(万|千|k|K)?/);
    if (!m) return 5000;
    return Math.round(parseFloat(m[1]) * (m[2] === '万' ? 1e4 : m[2] ? 1e3 : 1));
  };
  // 不同兵种的战力系数
  P.WEIGHT = { infantry: 1, heavyInf: 1.3, spear: 1.1, shield: 1.1, archer: 1.1, crossbow: 1.2, guard: 1.5, militia: 0.5, cavalry: 1.4, heavyCav: 1.8,
    horseArcher: 1.6, lancer: 1.6, camel: 1.3, elephant: 2.2, chariot: 1.4, siege: 1.2, navy: 1.0 };
  P.troopStr = (t) => (t >= 1e4 ? +(t / 1e4).toFixed(1) + ' 万' : t + ' 人');

  // ---------- 土地丰饶度：地貌 × 气候 × 森林，河流与海岸加成 ----------
  const TERR_F = { 2: 1, 3: 0.55, 4: 0.6, 5: 0.18, 6: 0.02, 7: 0.05, 8: 0.3, 9: 0.05 };
  const CLIM_F = [0.8, 0.5, 0.95, 0.6, 0.08, 0.4, 0.85, 1, 0.95, 1, 0.6, 0.3, 0.05, 0, 0.25];
  const FOR_F = [1, 0.85, 0.7, 0.6, 0.85, 0.75, 0.9];
  P.TERR_F = TERR_F; P.CLIM_F = CLIM_F;
  // 河流两侧约 2.5 格
  P.riverMask = () => {
    const S = App.S, C = App.CELL, m = new Uint8Array(N), R = 2.5;
    S.rivers.forEach((rv) => {
      const pts = rv.pts || []; for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[i + 1] || a, steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / C));
        for (let s = 0; s <= steps; s++) {
          const x = (a[0] + ((b[0] - a[0]) * s) / steps) / C, y = (a[1] + ((b[1] - a[1]) * s) / steps) / C;
          for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { if (dx * dx + dy * dy > R * R) continue; const cx = Math.floor(x + dx), cy = Math.floor(y + dy); if (cx >= 0 && cy >= 0 && cx < W && cy < H) m[cy * W + cx] = 1; }
        }
      }
    });
    return m;
  };
  const isCoast = (S, c) => { const x = c % W; return (x > 0 && S.terrain[c - 1] === 0) || (x < W - 1 && S.terrain[c + 1] === 0) || (c >= W && S.terrain[c - W] === 0) || (c < N - W && S.terrain[c + W] === 0); };
  P.fertility = (c, rv) => {
    const S = App.S, t = S.terrain[c]; if (t < 2) return 0;
    let f = (TERR_F[t] ?? 0.5) * (CLIM_F[S.climate[c]] ?? 0.8) * (FOR_F[S.forest[c]] ?? 0.85);
    if (rv && rv[c]) f = Math.min(1.25, f * 1.4 + 0.15);   // 大河冲积平原、绿洲
    if (isCoast(S, c)) f = Math.min(1.25, f * 1.1 + 0.03);
    return f;
  };
  // 整张图的丰饶度 + 邻近平均（半径约 4 格），用于选城址
  P.fertMap = () => {
    const rv = P.riverMask(), f = new Float32Array(N);
    for (let c = 0; c < N; c++) f[c] = P.fertility(c, rv);
    const tmp = new Float32Array(N), bl = new Float32Array(N), R = 4;
    for (let y = 0; y < H; y++) { let s = 0; for (let x = -R; x < W; x++) { if (x + R < W) s += f[y * W + x + R]; if (x - R - 1 >= 0) s -= f[y * W + x - R - 1]; if (x >= 0) tmp[y * W + x] = s; } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -R; y < H; y++) { if (y + R < H) s += tmp[(y + R) * W + x]; if (y - R - 1 >= 0) s -= tmp[(y - R - 1) * W + x]; if (y >= 0) bl[y * W + x] = s / ((2 * R + 1) * (2 * R + 1)); } }
    return { f, rv, bl };
  };
  P.CITY_PTS = { capital: 10, large: 6, port: 4, medium: 3, fortress: 2, small: 1.5, pass: 1.2, village: 0.6 };

  // ---------- 统计（一次遍历全部国家） ----------
  P.allStats = () => {
    const S = App.S, ra = P.rowAreas(), m = new Map(), rv = P.riverMask();
    S.nations.forEach((n) => m.set(n.id, { n, cells: 0, area: 0, good: 0, river: 0, troops: 0, mil: 0, inf: 0, cav: 0, other: 0, armies: [], cities: [], cityPts: 0, prov: [0, 0, 0, 0], terr: {} }));
    for (let c = 0; c < N; c++) {
      const o = S.owner[c]; if (!o || S.terrain[c] < 2) continue; const st = m.get(o); if (!st) continue;
      const a = ra[(c / W) | 0]; st.cells++; st.area += a; st.good += a * P.fertility(c, rv); if (rv[c]) st.river += a;
      const t = S.terrain[c]; st.terr[t] = (st.terr[t] || 0) + a;
    }
    S.armies.forEach((a) => {
      const st = m.get(a.nation); if (!st) return;
      const t = P.troops(a.strength), ty = App.ARMY_TYPES.find((k) => k.id === a.type);
      st.troops += t; st.mil += t * (P.WEIGHT[a.type] || 1); st.armies.push(a);
      if (ty && ty.g === '步兵') st.inf += t; else if (ty && ty.g === '骑兵') st.cav += t; else st.other += t;
    });
    S.cities.forEach((ct) => { const c = App.Ops.cellAt(ct.x, ct.y); const st = c >= 0 && m.get(S.owner[c]); if (st) { st.cities.push(ct); st.cityPts += P.CITY_PTS[ct.type] || 1; } });
    S.provinces.forEach((p) => { const st = m.get(p.nation); if (st) st.prov[p.level || 1]++; });
    return m;
  };
  // 国力 = 有效领土（按地貌、气候、河流折算的可用土地）45% ＋ 城市 20% ＋ 军力 35%；附庸可按一半计入宗主
  P.WEIGHTS = { good: 0.45, city: 0.2, mil: 0.35 };
  P.ranking = (opt = {}) => {
    const m = P.allStats(), list = [...m.values()].filter((s) => s.cells > 0 || s.troops > 0);
    list.forEach((s) => { s.eArea = s.area; s.eGood = s.good; s.eCity = s.cityPts; s.eMil = s.mil; s.eTroops = s.troops; });
    if (opt.vassals) list.forEach((s) => { const ov = s.n.overlord && m.get(s.n.overlord); if (ov && ov !== s) { ov.eArea += s.area * 0.5; ov.eGood += s.good * 0.5; ov.eCity += s.cityPts * 0.5; ov.eMil += s.mil * 0.5; ov.eTroops += s.troops * 0.5; } });
    const mx = (k) => Math.max(1e-9, ...list.map((s) => s[k])), mG = mx('eGood'), mC = mx('eCity'), mM = mx('eMil'), w = P.WEIGHTS;
    list.forEach((s) => { s.gScore = (s.eGood / mG) * 100; s.cScore = (s.eCity / mC) * 100; s.mScore = (s.eMil / mM) * 100; s.power = s.gScore * w.good + s.cScore * w.city + s.mScore * w.mil; });
    const key = { area: 'eArea', good: 'eGood', city: 'eCity', mil: 'eMil' }[opt.sort] || 'power';
    list.sort((a, b) => b[key] - a[key] || b.power - a.power);
    list.forEach((s, i) => (s.place = i + 1));
    return list;
  };
  P.capital = (n, st) => {
    const cs = st ? st.cities : App.S.cities.filter((ct) => { const c = App.Ops.cellAt(ct.x, ct.y); return c >= 0 && App.S.owner[c] === n.id; });
    const ORD = ['capital', 'large', 'port', 'medium', 'fortress', 'small', 'pass', 'village'];
    return cs.slice().sort((a, b) => ORD.indexOf(a.type) - ORD.indexOf(b.type))[0] || null;
  };
  // 文明与国体对城市化的影响（游牧、部落城市少；华夏、波斯、罗马城市多）
  P.URBAN = { korea: 1.1, diannan: 0.75, tubo: 0.45, annam: 1.05, siam: 0.9, burma: 0.85, khmer: 0.95, tamil: 1.1, huaxia: 1.25, persia: 1.15, latin: 1.2, greek: 1.15, arabic: 1.05, tianzhu: 1.1, wa: 0.95, german: 0.9, english: 0.85, slavic: 0.75, norse: 0.6, celtic: 0.55, nanyang: 0.8, steppe: 0.35 };

  // ---------- 按地理生成城市 ----------
  // 大中小城：先沿河，再平原；规模看周围土地和气候。关隘：山口、峡谷；要塞：山地、丘陵和边境。村镇：随意分布。
  // 所有城址都在本国陆地内部（离海、离他国至少一两格），港口内缩一格贴着海岸
  const MOUNT = (t) => t === 5 || t === 6;
  P.genCities = (nid, r = Math.random, opt = {}) => {
    const S = App.S, n = App.nation(nid); if (!n) return [];
    const C = App.CELL, FM = opt.fm || P.fertMap(), { f, rv, bl } = FM;
    if (opt.replace) S.cities = S.cities.filter((ct) => { const c = App.Ops.cellAt(ct.x, ct.y); return !(c >= 0 && S.owner[c] === nid); });
    const cells = []; let mass = 0, sx = 0, sy = 0, rough = 0;
    for (let c = 0; c < N; c++) if (S.owner[c] === nid && S.terrain[c] >= 2) { cells.push(c); mass += f[c]; sx += c % W; sy += (c / W) | 0; if (S.terrain[c] === 4 || MOUNT(S.terrain[c])) rough++; }
    if (!cells.length) return [];
    const cx = sx / cells.length, cy = sy / cells.length, avgF = mass / cells.length;
    const rk = P.rankOf(n).id, urban = (P.URBAN[n.culture] ?? 1) * (rk === 'tribe' ? 0.45 : rk === 'merchant' ? 1.4 : rk === 'khanate' ? 0.7 : 1) * (opt.density ?? 1);
    const target = Math.max(1, Math.round(Math.pow(mass / 120, 0.75) * urban));
    // 半径 R 内全是本国陆地（allowSea 时海也可以）
    const ok = (c, R, allowSea) => {
      const x = c % W, y = (c / W) | 0;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dy * dy > R * R + 1) continue;
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false;
        const k = yy * W + xx, t = S.terrain[k];
        if (t < 2) { if (!(allowSea && t === 0)) return false; } else if (S.owner[k] !== nid) return false;
      }
      return true;
    };
    const seaNear = (c, R) => { const x = c % W, y = (c / W) | 0; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && S.terrain[yy * W + xx] === 0) return true; } return false; };
    const otherNear = (c, R) => { const x = c % W, y = (c / W) | 0; for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) { const k = yy * W + xx; if (S.terrain[k] >= 2 && S.owner[k] && S.owner[k] !== nid) return true; } } return false; };
    const mountCount = (c, R) => { const x = c % W, y = (c / W) | 0; let k = 0; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && MOUNT(S.terrain[yy * W + xx])) k++; } return k; };
    // 山口：自身可通行，两侧（左右或上下）都是山
    const gap = (c) => {
      const x = c % W, y = (c / W) | 0, m = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && MOUNT(S.terrain[yy * W + xx]);
      const side = (dx, dy) => { for (let i = 1; i <= 4; i++) if (m(x + dx * i, y + dy * i)) return true; return false; };
      return (side(-1, 0) && side(1, 0)) || (side(0, -1) && side(0, 1));
    };
    // 本国内部（离边界、海岸足够远）的格子；小国放宽
    const sample = []; const step = Math.max(1, Math.floor(cells.length / 5000));
    for (let i = 0; i < cells.length; i += step) sample.push(cells[i]);
    let RIN = 2, inner = sample.filter((c) => ok(c, 2, false));
    if (inner.length < 3) { RIN = 1; inner = sample.filter((c) => ok(c, 1, false)); }
    if (!inner.length) { RIN = 0; inner = sample.slice(); }
    const have = S.cities.filter((ct) => { const c = App.Ops.cellAt(ct.x, ct.y); return c >= 0 && S.owner[c] === nid; });
    const placed = []; const out = [];
    const xy = (c) => [((c % W) + 0.5) * C, (((c / W) | 0) + 0.5) * C];
    const free = (c, d) => { const [x, y] = xy(c); return placed.every((p) => Math.hypot(p[0] - x, p[1] - y) >= d) && S.cities.every((k) => Math.hypot(k.x - x, k.y - y) >= Math.min(d, 16)); };
    const usedC = App.PlaceNames ? App.PlaceNames.used('city') : null;
    const add = (c, type) => { const [x, y] = xy(c), ct = { id: App.nid(), x, y, type, name: App.Names.city(n.culture, r, x, y, usedC) }; if (usedC) usedC.add(ct.name); S.cities.push(ct); placed.push([x, y]); out.push(ct); return ct; };
    const pickW = (arr, w) => { const tot = arr.reduce((a, k) => a + w(k), 0); let t = r() * tot; for (const k of arr) { t -= w(k); if (t <= 0) return k; } return arr[arr.length - 1]; };
    // 城址分数：沿河最优先，其次平原，再看周围丰饶度
    const T = (c) => S.terrain[c];
    const score = (c) => (rv[c] ? 0.65 : 0) + (T(c) === 2 ? 0.28 : T(c) === 3 ? 0.1 : T(c) === 4 ? 0.04 : 0) + bl[c] * 0.5 + f[c] * 0.15;
    const sizeScore = (c) => bl[c] * 0.7 + f[c] * 0.3 + (rv[c] ? 0.15 : 0);
    const mainCand = inner.filter((c) => !MOUNT(T(c)) && T(c) !== 9 && f[c] > 0.03).map((c) => [c, score(c)]);
    if (!mainCand.length) inner.forEach((c) => mainCand.push([c, 0.05]));
    // 港口候选：内缩一格、两格内有海
    const portCand = sample.filter((c) => ok(c, 1, false) && ok(c, 2, true) && seaNear(c, 2) && !MOUNT(T(c)) && f[c] > 0.05);
    const minD = 20 + 14 / Math.max(0.4, avgF + 0.3);
    // 1) 都城：丰饶、近河、靠近国土中心
    if (!have.some((k) => k.type === 'capital')) {
      let best = mainCand[0][0], bs = -1;
      mainCand.forEach(([c, s]) => { const d = Math.hypot((c % W) - cx, ((c / W) | 0) - cy) / Math.sqrt(cells.length); const v = s * (1.15 - Math.min(0.8, d)); if (v > bs) { bs = v; best = c; } });
      add(best, 'capital');
    }
    // 2) 大中小城
    const need = target - have.length - out.length, sites = []; let tries = 0;
    while (sites.length < need && tries++ < need * 50 + 150) {
      const [c] = pickW(mainCand, (k) => k[1] * k[1]); if (!free(c, minD)) continue;
      placed.push(xy(c)); sites.push([c, sizeScore(c) + (r() - 0.5) * 0.1]);
    }
    placed.length -= sites.length;
    sites.sort((a, b) => b[1] - a[1]);
    sites.forEach(([c, s], i) => {
      const p = sites.length > 1 ? i / (sites.length - 1) : 0.5;
      add(c, p < 0.1 && s > 0.62 ? 'large' : p < 0.38 && s > 0.38 ? 'medium' : 'small');
    });
    // 3) 港口：沿海国家按海岸长度设 1～若干个
    if (portCand.length) {
      const k = Math.min(6, Math.max(1, Math.round(Math.sqrt(portCand.length / 30) * urban)));
      for (let i = 0, t = 0; i < k && t < 200; t++) { const c = pickW(portCand, (q) => 0.05 + f[q] + (rv[q] ? 0.6 : 0)); if (!free(c, minD * 0.8)) continue; add(c, f[c] > 0.5 && r() < 0.25 ? 'large' : 'port'); i++; }
    }
    // 4) 关隘：山口、峡谷（两侧是山的通道）
    const passCand = inner.filter((c) => !MOUNT(T(c)) && gap(c));
    const nPass = Math.min(4, Math.round(passCand.length / 60 + (passCand.length ? 0.6 : 0)));
    for (let i = 0, t = 0; i < nPass && t < 150; t++) { const c = pickW(passCand, (q) => 1 + mountCount(q, 3) + (otherNear(q, 10) ? 8 : 0)); if (!free(c, 18)) continue; add(c, 'pass'); i++; }
    // 5) 要塞：山地、丘陵，优先靠近边境
    const fortCand = inner.filter((c) => (T(c) === 4 || T(c) === 5) && ok(c, 1, false));
    const nFort = Math.min(4, Math.round(rough / 900 + (fortCand.length ? 0.5 : 0)));
    for (let i = 0, t = 0; i < nFort && t < 150; t++) { const c = pickW(fortCand, (q) => 1 + (otherNear(q, 9) ? 10 : 0) + (T(q) === 5 ? 1 : 0)); if (!free(c, 18)) continue; add(c, 'fortress'); i++; }
    // 6) 村镇：随意撒在可住人的地方
    const villCand = inner.filter((c) => T(c) !== 6 && f[c] > 0.02);
    const nVill = Math.round(target * 0.5 * (rk === 'tribe' ? 1.5 : 1));
    for (let i = 0, t = 0; i < nVill && villCand.length && t < nVill * 30; t++) { const c = villCand[Math.floor(r() * villCand.length)]; if (!free(c, 14)) continue; add(c, 'village'); i++; }
    return out;
  };

  // ---------- 按国力生成军队 ----------
  const MIX = {
    huaxia: [['infantry', 3], ['crossbow', 2], ['spear', 2], ['cavalry', 2], ['heavyCav', 1], ['shield', 1]],
    steppe: [['horseArcher', 5], ['cavalry', 3], ['heavyCav', 1.5], ['infantry', 0.5]],
    wa: [['spear', 3], ['archer', 2], ['infantry', 2], ['cavalry', 1]],
    tianzhu: [['infantry', 3], ['archer', 2], ['elephant', 1.5], ['cavalry', 1], ['chariot', 0.5]],
    persia: [['heavyCav', 2.5], ['archer', 2], ['infantry', 2], ['horseArcher', 1], ['elephant', 0.6]],
    nanyang: [['infantry', 3], ['elephant', 1.2], ['archer', 1.5], ['spear', 1]],
    korea: [['archer', 3], ['spear', 2], ['infantry', 2], ['cavalry', 1.5], ['navy', 0.5]],
    diannan: [['infantry', 3], ['archer', 2], ['crossbow', 1], ['elephant', 0.6], ['militia', 1]],
    tubo: [['heavyCav', 2.5], ['cavalry', 2], ['infantry', 2], ['archer', 1]],
    annam: [['infantry', 3], ['crossbow', 2], ['elephant', 1], ['navy', 1]],
    siam: [['elephant', 2], ['infantry', 3], ['archer', 1.5], ['spear', 1]],
    burma: [['elephant', 2], ['infantry', 3], ['archer', 1.5], ['cavalry', 0.8]],
    khmer: [['elephant', 2.2], ['infantry', 3], ['archer', 1.5], ['navy', 0.5]],
    tamil: [['infantry', 3], ['elephant', 1.5], ['archer', 1.5], ['cavalry', 1], ['navy', 0.8]],
    latin: [['heavyInf', 4], ['archer', 1], ['cavalry', 1], ['siege', 0.5]],
    greek: [['heavyInf', 2.5], ['spear', 2], ['heavyCav', 1.5], ['archer', 1]],
    german: [['heavyCav', 2], ['spear', 2.5], ['infantry', 2], ['crossbow', 1]],
    english: [['archer', 2.5], ['heavyInf', 2], ['spear', 1.5], ['heavyCav', 1]],
    slavic: [['infantry', 2.5], ['cavalry', 2], ['spear', 1.5], ['archer', 1]],
    norse: [['infantry', 3], ['shield', 2], ['archer', 1]],
    celtic: [['infantry', 3], ['spear', 1.5], ['chariot', 1], ['militia', 1]],
    arabic: [['cavalry', 2.5], ['camel', 2], ['infantry', 2], ['archer', 1]],
  };
  const MARTIAL = { tubo: 1.35, korea: 1.0, diannan: 0.9, steppe: 1.7, norse: 1.3, german: 1.1, latin: 1.1, persia: 1.05, celtic: 1.1, nanyang: 0.85, tianzhu: 0.9 };
  const fmtTroops = (t) => (t >= 1e4 ? (Math.round(t / 5e3) / 2) + '万' : String(Math.max(500, Math.round(t / 100) * 100)));
  const nationCities = (n) => App.S.cities.filter((ct) => { const c = App.Ops.cellAt(ct.x, ct.y); return c >= 0 && App.S.owner[c] === n.id; });
  const ORD2 = ['capital', 'large', 'port', 'fortress', 'medium', 'pass', 'small', 'village'];
  // 部队放在城旁，但必须落在本国陆地上（不进海、不进他国）
  P.safeSpot = (nid, x, y, i = 0) => {
    const S = App.S, own = (px, py) => { const c = App.Ops.cellAt(px, py); return c >= 0 && S.terrain[c] >= 2 && S.owner[c] === nid; };
    const okAll = (px, py) => own(px, py) && own(px - 8, py) && own(px + 8, py) && own(px, py - 8) && own(px, py + 8);
    for (let k = 0; k < 16; k++) { const a = i * 2.4 + k * 0.785, d = 22 - (k >> 3) * 8; const px = x + Math.cos(a) * d, py = y + 14 + Math.sin(a) * d * 0.6; if (okAll(px, py)) return [px, py]; }
    for (let k = 0; k < 16; k++) { const a = k * 0.785, d = 10 + (k >> 3) * 8; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (own(px, py)) return [px, py]; }
    return [x, y];
  };
  P.armySpot = (n, i) => {
    const cs = nationCities(n).sort((a, b) => ORD2.indexOf(a.type) - ORD2.indexOf(b.type));
    const ang = i * 2.4;
    if (cs.length) { const c = cs[i % cs.length]; return P.safeSpot(n.id, c.x, c.y, i); }
    const L = App.Geo.labels && App.Geo.labels.get(n.id); return L ? P.safeSpot(n.id, L.x, L.y, i) : [App.WW / 2, App.HH / 2];
  };
  P.genArmies = (n, opt = {}, r = Math.random) => {
    const S = App.S, st = P.allStats().get(n.id); if (!st || !st.cells) return [];
    if (opt.replace) S.armies = S.armies.filter((a) => a.nation !== n.id);
    const rk = P.rankOf(n).id;
    let total = (st.good * 0.05 + st.cityPts * 1500) * (MARTIAL[n.culture] || 1) * (rk === 'tribe' ? 0.6 : 1);
    total = Math.max(1500, total);
    if (!opt.replace) total -= st.troops;
    if (total < 800) return [];
    const k = U.clamp(Math.round(Math.sqrt(total / 9000)), 1, 7);
    const mix = MIX[n.culture] || MIX.huaxia, wsum = mix.reduce((a, x) => a + x[1], 0);
    const pickT = () => { let t = r() * wsum; for (const [id, w] of mix) { t -= w; if (t <= 0) return id; } return mix[0][0]; };
    const cs = nationCities(n).sort((a, b) => ORD2.indexOf(a.type) - ORD2.indexOf(b.type));
    const hasPort = cs.find((c) => c.type === 'port');
    const shares = Array.from({ length: k }, () => 0.6 + r()), ss = shares.reduce((a, b) => a + b, 0);
    const zh = !App.Names.groups.latin.includes(n.culture), out = [];
    const base0 = st.armies.length;
    for (let i = 0; i < k; i++) {
      let type = pickT(), near = cs[i % Math.max(1, cs.length)];
      if (i === 0 && k >= 3 && rk !== 'tribe') type = 'guard';
      if (i === k - 1 && hasPort && k >= 2 && r() < 0.8) { type = 'navy'; near = hasPort; }
      const cname = near ? near.name.replace(/(城|港|京|堡)$/, '') : P.baseName(n);
      const name = type === 'guard' ? (n.culture === 'steppe' ? '牙帐亲军' : n.culture === 'wa' ? '旗本' : zh ? '禁军' : '近卫军') : type === 'navy' ? cname + (zh ? '水师' : '舰队') : n.culture === 'steppe' ? ['左翼', '右翼', '中军', '前锋', '后军'][i % 5] : n.culture === 'latin' ? cname + '军团' : cname + '军';
      const [x, y] = near ? P.safeSpot(n.id, near.x, near.y, base0 + i) : P.armySpot(n, base0 + i);
      const a = { id: App.nid(), x, y, nation: n.id, type, strength: fmtTroops((total * shares[i]) / ss), name };
      S.armies.push(a); out.push(a);
    }
    return out;
  };

  // ---------- 统治家族 ----------
  P.makeDynasty = (n, r = Math.random) => {
    const t = P.title(n), cap = P.capital(n), ov = P.overlord(n), ovFam = ov && P.dynasty(ov);
    const o = { culture: n.culture, nation: n.id, home: cap ? cap.id : 0, color: n.color, founded: P.founded(n) - Math.floor(r() * 30) };
    if (t.same && ovFam) { o.base = ovFam.base; o.culture = ovFam.culture; o.religion = ovFam.religion; }
    const fam = App.Family.createFamily(o, r);
    if (t.same && ovFam) { const b = Array.from(P.baseName(n)); fam.name = (b.length <= 2 ? b.join('') : b[0]) + (t.pre || '') + fam.name; }
    fam.house = t.house; fam.ruling = n.id;
    P.crown(n, fam);
    n.dynasty = fam.id;
    return fam;
  };
  // 按国体给家主、配偶、长子授予称号
  P.crown = (n, fam) => {
    const t = P.title(n), F = App.Family, pa = F.get(fam.patriarch); if (!pa) return;
    pa.position = t.ruler; pa.nation = n.id;
    const sp = F.get(pa.spouse); if (sp) sp.position = t.consort;
    const kids = App.S.people.filter((q) => (q.father === pa.id || q.mother === pa.id) && !q.death).sort((a, b) => a.birth - b.birth);
    const heir = kids.find((k) => k.gender === 'm') || kids[0];
    kids.forEach((k) => { if (k.position === '太子' || k.position === '王储' || k.position === '世子') k.position = '无'; });
    if (heir) heir.position = t.heir;
  };
  P.ensureAllDynasties = (r = Math.random) => {
    let k = 0;
    // 先把宗主处理完，宗室封国才能沿用宗主的姓氏
    const ord = App.S.nations.slice().sort((a, b) => (a.overlord ? 1 : 0) - (b.overlord ? 1 : 0));
    ord.forEach((n) => {
      if (P.dynasty(n)) return;
      const ex = App.S.families.find((f) => f.nation === n.id && (f.ruling === n.id || !App.S.nations.some((m) => m.dynasty === f.id)));
      if (ex) { n.dynasty = ex.id; ex.ruling = n.id; ex.house = P.title(n).house; P.crown(n, ex); } else P.makeDynasty(n, r);
      k++;
    });
    return k;
  };

  // ---------- 国家背景（随机文本） ----------
  P.genLore = (n, r = Math.random) => {
    const t = P.title(n), fam = P.dynasty(n), F = App.Family, pa = fam && F.get(fam.patriarch), cap = P.capital(n), ov = P.overlord(n);
    const fy = P.yearStr(P.founded(n)), cn = cap ? cap.name : '旧都', founder = fam ? fam.name : '先祖';
    const open = ov
      ? pick([`${fy}，${ov.name}${pick(['分封', '册封', '敕封'])}${founder}于${cn}，立为${t.name}，世守其土。`, `${fy}，${founder}以${pick(['战功', '宗亲', '拥立之功', '归附'])}受${ov.name}之封，建${n.name}，都${cn}。`], r)
      : pick([`${fy}，${founder}${pick(['起兵', '崛起', '统一诸部', '受众拥立', '篡夺旧主'])}，定都${cn}，建立${n.name}。`, `${n.name}始于${fy}，${founder}据${cn}而立国，号称${t.name}。`], r);
    const mid = pick([`国中以${fam ? fam.religion : '旧俗'}为尊，`, `其地${pick(['沃野千里', '山川险固', '商路辐辏', '牧草丰美', '濒临大海'])}，`, `历代${pick(['君主勤政', '多有内乱', '屡兴征伐', '与邻国联姻'])}，`], r)
      + pick(['国势渐盛。', '然近年国势有所衰退。', '至今仍为一方强国。', '与周边诸国时战时和。'], r);
    const now = pa ? `今${t.ruler}${pa.name}在位${pick(['', '已久，', '未久，'], r)}${pick(['，储君未定。', '，朝中诸臣各怀心思。', '，励精图治。', '，正谋扩张。'], r)}`.replace('，，', '，') : '';
    return open + mid + now;
  };
})();
