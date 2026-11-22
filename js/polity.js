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
    zhou: { name: '西周·五等爵分封', note: '周天子分封同姓与功臣为诸侯，爵分公、侯、伯、子、男五等。诸侯世袭，须朝觐纳贡、出兵勤王。', tiers: [
      T('gong', '公国', '公', '公室', { pre: '公' }), T('hou', '侯国', '侯', '公室', { pre: '侯' }), T('bo', '伯国', '伯', '公室', { pre: '伯' }),
      T('zi', '子国', '子', '公室', { pre: '子' }), T('nan', '男国', '男', '公室', { pre: '男' })] },
    han: { name: '汉·郡国并行', note: '汉初在郡县之外分封同姓诸侯王（王国）与功臣列侯（侯国）。七国之乱后，诸侯王不得治民，由朝廷派相治理。', tiers: [
      T('wang', '诸侯王国', '诸侯王', '宗室', { same: true, pre: '王', heir: '王太子', consort: '王后' }), T('liehou', '列侯国', '列侯', '列侯家族', { pre: '侯' })] },
    jin: { name: '西晋·宗王出镇', note: '晋武帝大封宗室为王，按户数分大国（二万户）、次国（一万户）、小国（五千户），可自置军队，后来酿成八王之乱。', tiers: [
      T('da', '大国', '王', '宗室', { same: true, pre: '王', heir: '世子', consort: '王妃' }), T('ci', '次国', '王', '宗室', { same: true, pre: '王', consort: '王妃' }),
      T('xiao', '小国', '王', '宗室', { same: true, pre: '王', consort: '王妃' }), T('jungong', '郡公国', '郡公', '勋贵家族', { pre: '公' }), T('xianhou', '县侯国', '县侯', '勋贵家族', { pre: '侯' })] },
    tang: { name: '唐·藩镇与羁縻府州', note: '安史之乱后节度使拥兵自重，河朔三镇父子相承，名为唐臣、实为割据。边疆设羁縻府州，由部族首领世袭都督、刺史。', tiers: [
      T('fanzhen', '藩镇', '节度使', '藩帅家族', { suf: '镇', heir: '留后' }), T('jimi', '羁縻都督府', '都督（世袭）', '部族首领家族', { suf: '都督府' })] },
    yuan: { name: '元·宗王兀鲁思与投下', note: '蒙古以黄金家族宗王分领兀鲁思（封民与封地），功臣贵族另有投下封地，各自统治其民。', tiers: [
      T('ulus', '宗王兀鲁思', '宗王', '黄金家族', { same: true, pre: '王', suf: '兀鲁思', consort: '王妃' }), T('touxia', '投下封地', '投下领主', '勋贵家族', { suf: '投下' })] },
    ming: { name: '明·藩王与土司', note: '明太祖分封诸子为亲王，镇守边塞；亲王嫡长子袭亲王，诸子封郡王。西南设土司，由当地首领世袭宣慰使等职。', tiers: [
      T('qinwang', '亲王藩国', '亲王', '宗室', { same: true, pre: '王', heir: '世子', consort: '王妃' }), T('junwang', '郡王封国', '郡王', '宗室', { same: true, pre: '郡王', consort: '郡王妃' }),
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
    return { rank: r, name: t.name, sys, tier: t, ruler: t.ruler, house: t.house, cat: t.house === '王室' ? '王室' : '贵族', heir: t.heir, consort: t.consort, suf: t.suf, same: t.same, pre: t.pre };
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
    if (r.id === 'empire' && n.culture === 'huaxia') n.name = (Array.from(b).length <= 2 ? '大' : '') + b;
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
      if (!pj) { rowArea[y] = 400; continue; }
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

  // ---------- 统计（一次遍历全部国家） ----------
  P.allStats = () => {
    const S = App.S, ra = P.rowAreas(), m = new Map();
    S.nations.forEach((n) => m.set(n.id, { n, cells: 0, area: 0, troops: 0, mil: 0, inf: 0, cav: 0, other: 0, armies: [], cities: [], prov: [0, 0, 0, 0] }));
    for (let c = 0; c < N; c++) { const o = S.owner[c]; if (!o || S.terrain[c] < 2) continue; const st = m.get(o); if (st) { st.cells++; st.area += ra[(c / W) | 0]; } }
    S.armies.forEach((a) => {
      const st = m.get(a.nation); if (!st) return;
      const t = P.troops(a.strength), ty = App.ARMY_TYPES.find((k) => k.id === a.type);
      st.troops += t; st.mil += t * (P.WEIGHT[a.type] || 1); st.armies.push(a);
      if (ty && ty.g === '步兵') st.inf += t; else if (ty && ty.g === '骑兵') st.cav += t; else st.other += t;
    });
    S.cities.forEach((ct) => { const c = App.Ops.cellAt(ct.x, ct.y); const st = c >= 0 && m.get(S.owner[c]); if (st) st.cities.push(ct); });
    S.provinces.forEach((p) => { const st = m.get(p.nation); if (st) st.prov[p.level || 1]++; });
    return m;
  };
  // 国力：领土为主（65%），军力为辅（35%）；附庸可按一半计入宗主
  P.ranking = (opt = {}) => {
    const m = P.allStats(), list = [...m.values()].filter((s) => s.cells > 0 || s.troops > 0);
    list.forEach((s) => { s.eArea = s.area; s.eMil = s.mil; s.eTroops = s.troops; });
    if (opt.vassals) list.forEach((s) => { const ov = s.n.overlord && m.get(s.n.overlord); if (ov && ov !== s) { ov.eArea += s.area * 0.5; ov.eMil += s.mil * 0.5; ov.eTroops += s.troops * 0.5; } });
    const mA = Math.max(1, ...list.map((s) => s.eArea)), mM = Math.max(1, ...list.map((s) => s.eMil));
    list.forEach((s) => { s.aScore = (s.eArea / mA) * 100; s.mScore = (s.eMil / mM) * 100; s.power = s.aScore * 0.65 + s.mScore * 0.35; });
    const key = opt.sort === 'area' ? 'eArea' : opt.sort === 'mil' ? 'eMil' : 'power';
    list.sort((a, b) => b[key] - a[key] || b.power - a.power);
    list.forEach((s, i) => (s.place = i + 1));
    return list;
  };
  P.capital = (n, st) => {
    const cs = st ? st.cities : App.S.cities.filter((ct) => { const c = App.Ops.cellAt(ct.x, ct.y); return c >= 0 && App.S.owner[c] === n.id; });
    const ORD = ['capital', 'large', 'port', 'medium', 'fortress', 'small', 'pass', 'town'];
    return cs.slice().sort((a, b) => ORD.indexOf(a.type) - ORD.indexOf(b.type))[0] || null;
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
