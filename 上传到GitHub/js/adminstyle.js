// ===== 行政区划的历史数据与各文明的划界习惯 =====
// 1) 每级单位的典型面积 = 史料中的疆域面积 ÷ 该级单位数量（不再凭感觉填数字）
// 2) 下辖数量范围取自史料中最少、最多的实例
// 3) ref = 该制度历史疆域的平均土地丰饶度（在本工具的真实亚洲地图上实测：中国本部 0.85、
//    朝鲜 0.85、日本 0.72、北印度 0.74、蒙古高原 0.47、塔里木 0.43、伊朗高原 0.33、青藏 0.34）。
//    划分数量 = Σ(面积 × 丰饶度) ÷ (典型面积 × ref)：同样大的国家，土地比历史疆域更富庶就分得更细，更贫瘠就更粗。
(() => {
  // terr：疆域（平方公里）；n：[一级, 二级, 三级] 数量；kids：[, , 二级/一级, 三级/二级] 下辖范围
  const H = {
    qin: { terr: 3400000, n: [0, 46, 1000], kids: [null, null, [6, 40]], ref: 0.85, src: '秦末约四十六郡、近千县（《史记》《汉书·地理志》追记）' },
    han: { terr: 4000000, n: [0, 14, 103, 1587], kids: [null, null, [4, 13], [5, 30]], ref: 0.85, src: '西汉元始二年：十三刺史部加司隶，郡国一百零三，县道邑侯国一千五百八十七（《汉书·地理志》）' },
    sui: { terr: 3800000, n: [0, 190, 1255], kids: [null, null, [2, 15]], ref: 0.85, src: '隋大业五年：郡一百九十，县一千二百五十五（《隋书·地理志》）' },
    tang: { terr: 4300000, n: [0, 15, 328, 1573], kids: [null, null, [8, 40], [1, 12]], ref: 0.85, src: '唐开元二十八年：十五道，州府三百二十八，县一千五百七十三（《旧唐书·地理志》）' },
    song: { terr: 2800000, n: [0, 23, 297, 1135], kids: [null, null, [5, 25], [1, 10]], ref: 0.85, src: '北宋元丰：二十三路，府州军监约三百，县一千一百三十五（《元丰九域志》）' },
    yuan: { terr: 9000000, n: [0, 11, 218, 1486], kids: [null, null, [3, 40], [1, 16]], ref: 0.7, src: '元：中书省与十行省，路一百八十五、府三十三，州三百五十九、县一千一百二十七（《元史·地理志》）' },
    ming: { terr: 3800000, n: [0, 15, 160, 1310], kids: [null, null, [5, 18], [1, 20]], ref: 0.85, src: '明万历：两京十三布政使司，府一百四十、州一百九十三，县一千一百三十八（《明史·地理志》）' },
    ritsuryo: { terr: 295000, n: [0, 8, 68, 592], kids: [null, null, [5, 15], [2, 24]], ref: 0.72, src: '五畿七道，六十六国二岛，郡五百九十二（《和名类聚抄》）；大国如武藏二十一郡，小国仅二郡' },
    joseon: { terr: 222000, n: [0, 8, 50, 330], kids: [null, null, [4, 10], [3, 10]], ref: 0.85, src: '朝鲜八道，府牧郡县约三百三十邑，以约五十巨镇统领诸邑（《经国大典》）' },
    silla: { terr: 150000, n: [0, 9, 117, 293], kids: [null, null, [8, 18], [1, 5]], ref: 0.85, src: '统一新罗景德王时：九州，郡一百一十七，县二百九十三（《三国史记·地理志》）' },
    decimal: { terr: 2700000, n: [0, 10, 95, 950], kids: [null, null, [5, 12], [5, 12]], ref: 0.47, src: '成吉思汗 1206 年编九十五千户，十千户为万户，十百户为千户（《元朝秘史》）' },
    xiongnu: { terr: 3000000, n: [0, 3, 24, 240], kids: [null, null, [6, 12], [5, 12]], ref: 0.47, src: '单于庭与左右两部，二十四长号万骑，下置千长（《史记·匈奴列传》）' },
    turkwing: { terr: 3000000, n: [0, 2, 10, 120], kids: [null, null, [4, 6], [6, 16]], ref: 0.5, src: '西突厥左厢五咄陆、右厢五弩失毕，合称十箭（《旧唐书·突厥传》）' },
    tubo: { terr: 1200000, n: [0, 5, 61, 300], kids: [null, null, [8, 16], [3, 8]], ref: 0.34, src: '吐蕃本土五茹，共六十一东岱（《贤者喜宴》）' },
    nanzhao: { terr: 500000, n: [0, 8, 40, 200], kids: [null, null, [2, 8], [3, 8]], ref: 0.65, src: '南诏六节度二都督，核心十睑（《蛮书》）' },
    tusi: { terr: 550000, n: [0, 11, 55, 280], kids: [null, null, [2, 8], [2, 8]], ref: 0.6, src: '明代西南宣慰司约十一，下设宣抚、安抚司与长官司（《明史·土司传》）' },
    daiviet: { terr: 150000, n: [0, 13, 52, 228], kids: [null, null, [2, 7], [2, 8]], ref: 0.7, src: '黎圣宗洪德年间：十三承宣，五十二府，一百七十八县、五十州（《大越史记全书》）' },
    gupta: { terr: 3500000, n: [0, 26, 260, 2600], kids: [null, null, [5, 15], [4, 14]], ref: 0.74, src: '笈多碑铭所见：省（布克提）下分县（维沙亚），县下为村社联合' },
    chola: { terr: 400000, n: [0, 9, 63, 380], kids: [null, null, [4, 10], [3, 10]], ref: 0.8, src: '罗阇罗阇一世时九曼达拉姆，下分瓦拉纳杜与纳杜（朱罗碑铭）' },
    muang: { terr: 400000, n: [0, 25, 130, 650], kids: [null, null, [2, 10], [3, 8]], ref: 0.7, src: '阿瑜陀耶分京畿四门与外府，诸勐按等级由王族贵族镇守（《三印法典》）' },
    myo: { terr: 500000, n: [0, 15, 160, 800], kids: [null, null, [4, 16], [3, 8]], ref: 0.7, src: '东吁王朝以省统镇（谬），镇下为村' },
    angkor: { terr: 1000000, n: [0, 23, 230, 1200], kids: [null, null, [5, 15], [3, 8]], ref: 0.7, src: '吴哥碑铭载约二十余省（毕兰），下有区与村社' },
    mandala: { terr: 1200000, n: [0, 40, 300, 1500], kids: [null, null, [3, 12], [3, 8]], ref: 0.6, src: '室利佛逝、满者伯夷以王城为中心，属国朝贡（《爪哇史颂》）' },
    oasis: { terr: 1300000, n: [0, 36, 150, 600], kids: [null, null, [2, 8], [2, 6]], ref: 0.43, src: '西域三十六国，后分五十余国（《汉书·西域传》），多为一城数镇的绿洲城邦' },
    sasanian: { terr: 3500000, n: [0, 4, 100, 1000], kids: [null, null, [10, 40], [4, 15]], ref: 0.38, src: '库思老一世分四方区（库斯特），城区（沙赫尔）约百余（《伊朗诸城志》）' },
    satrapy: { terr: 5500000, n: [0, 20, 100], kids: [null, null, [3, 10]], ref: 0.4, src: '大流士一世二十总督区（希罗多德《历史》）' },
    iqta: { terr: 3900000, n: [0, 20, 200, 2000], kids: [null, null, [5, 15], [5, 15]], ref: 0.4, src: '大塞尔柱约二十行省，伊克塔分授诸将' },
    wilayah: { terr: 11000000, n: [0, 24, 240, 1200], kids: [null, null, [5, 15], [3, 8]], ref: 0.35, src: '阿拔斯王朝约二十四行省（伊本·胡尔达兹贝《道里邦国志》），省下分库拉、鲁斯塔克' },
    liao: { terr: 4890000, n: [0, 5, 156, 209], kids: [null, null, [10, 50], [1, 6]], ref: 0.6, src: '辽五京道，府州军城一百五十六，县二百零九（《辽史·地理志》）；县集中在燕云、辽东' },
    mengan: { terr: 3600000, n: [0, 19, 202, 1878], kids: [null, null, [5, 20], [5, 14]], ref: 0.8, src: '金十九路，世宗时猛安二百零二、谋克一千八百七十八（《金史·兵志》）' },
    lateRome: { terr: 4400000, n: [0, 4, 12, 110], kids: [null, null, [2, 5], [5, 16]], ref: 0.6, src: '戴克里先—君士坦丁：四大区，十二管区，百余行省（《百官志》）' },
    theme: { terr: 600000, n: [0, 25, 75, 225], kids: [null, null, [2, 5], [2, 5]], ref: 0.6, src: '利奥六世时约二十五军区，军区分二至四图尔马（《军区志》）' },
    feudal: { terr: 450000, n: [0, 12, 150, 750], kids: [null, null, [4, 25], [2, 10]], ref: 0.8, src: '公元一千年前后的西法兰克：十余大封国，约一百五十伯爵领，伯爵领下分堡领' },
    shire: { terr: 130000, n: [0, 5, 34, 700], kids: [null, null, [4, 10], [5, 40]], ref: 0.8, src: '1065 年英格兰：五大伯爵领，三十余郡，约七百百户区（《末日审判书》）' },
    guberniya: { terr: 5000000, n: [0, 50, 550, 8000], kids: [null, null, [6, 15], [8, 25]], ref: 0.6, src: '叶卡捷琳娜二世 1775 年改革后欧俄约五十省，每省十余县（《俄罗斯帝国法律全书》）' },
    ottoman: { terr: 5200000, n: [0, 32, 250, 1000], kids: [null, null, [3, 15], [2, 10]], ref: 0.45, src: '1600 年前后三十余埃亚莱特，约二百五十桑贾克' },
  };
  App.ADMIN_HIST = H;
  App.ADMIN_REF = {};
  Object.entries(H).forEach(([k, h]) => {
    App.ADMIN_AREA[k] = h.n.map((c) => (c ? Math.round(h.terr / c) : 0));
    App.ADMIN_REF[k] = h.ref;
    const sys = App.ADMIN_SYS[k];
    if (sys) h.kids.forEach((v, i) => { if (v) sys.kids[i] = v; });
  });
  // 疆域与单位数量的一句话说明（显示在国家档案里）
  App.histNote = (key) => { const h = H[key]; if (!h) return ''; const A = App.ADMIN_AREA[key], f = (a) => (a >= 1e4 ? +(a / 1e4).toFixed(a >= 1e5 ? 0 : 1) + ' 万' : a) + ' km²'; return h.src + '。平均每级约 ' + A.slice(1).filter(Boolean).map(f).join(' / ') + '。'; };

  // ---------- 各文明的划界习惯 ----------
  // pop：人口对大小的影响（1＝严格按户口，富庶处小、贫瘠处大；0.3＝按牧场、地盘，大小差别不大）
  // spread：同级单位大小的悬殊程度；core：京畿小、边地大的程度；
  // river：大河作为边界的倾向（正＝以河为界，负＝一个单位跨河两岸沿河谷伸展）；ridge：以山脊分水岭为界的程度；
  // wiggle：边界的曲折程度；oasis：治所只设在绿洲、河谷，荒漠归附最近的绿洲
  const D = { pop: 1, spread: 0.25, core: 0.25, river: 0.3, ridge: 1, wiggle: 1, oasis: 0 };
  const CHINA = { pop: 1, spread: 0.22, core: 0.3, river: 0.15, ridge: 1.4, wiggle: 0.9, note: '郡县按户口设置：中原州县小而密，边地大而疏；“山川形便”，多以山脊分界，大河时而为界、时而跨河' };
  const STEPPE = { pop: 0.35, spread: 0.45, core: 0.1, river: -0.6, ridge: 0.9, wiggle: 1.3, note: '按牧场与水源分地：各部沿河谷冬夏转场，地盘大小悬殊，以山岭和大漠分隔' };
  const IRAN = { pop: 0.9, spread: 0.35, core: 0.2, river: -0.4, ridge: 1.3, wiggle: 1, oasis: 0.5, note: '城区以绿洲、河谷和坎儿井为核心，荒漠戈壁归附邻近城区' };
  const MANDALA = { pop: 0.9, spread: 0.4, core: 0.85, river: -0.5, ridge: 1.1, wiggle: 1.1, note: '曼陀罗格局：王城周围小而直辖，越远属地越大越松散，多沿河流流域展开' };
  const FEUDAL = { pop: 0.85, spread: 0.6, core: 0, river: 0.35, ridge: 1, wiggle: 1.4, note: '封建领地由继承、联姻、征战拼合而成，大小极为悬殊，边界曲折' };
  App.ADMIN_STYLE = {
    huaxia: CHINA, korea: { ...CHINA, ridge: 1.6, note: '八道以太白、小白等山脉分界，邑治设于河谷平原' },
    annam: { ...CHINA, river: -0.2, core: 0.4, note: '红河三角洲府县小而密、跨河两岸，山区府州大' },
    wa: { pop: 0.85, spread: 0.35, core: 0.35, river: 0.1, ridge: 2.2, wiggle: 0.9, note: '令制国多以一个盆地或平原为单位，以山岭分界；畿内诸国小，东北陆奥、出羽极大' },
    steppe: STEPPE, mongol: STEPPE, xiongnu: STEPPE, turk: STEPPE,
    khitan: { ...STEPPE, pop: 0.65, spread: 0.4, river: -0.2, note: '蕃汉分治：汉地州县密，草原部族地盘大' },
    jurchen: { ...CHINA, pop: 0.8, spread: 0.3, core: 0.2, note: '猛安谋克屯驻于州县之间，按户口编组' },
    tubo: { pop: 0.5, spread: 0.35, core: 0.25, river: -0.6, ridge: 1.8, wiggle: 1.1, note: '东岱沿雅鲁藏布江等河谷分布，以雪山分隔，高原牧区地盘极大' },
    diannan: { pop: 0.7, spread: 0.5, core: 0.4, river: 0, ridge: 1.8, wiggle: 1.3, note: '坝子（山间盆地）各成一区，土司辖地大小悬殊' },
    tarim: { pop: 1, spread: 0.45, core: 0.05, river: -0.8, ridge: 1.2, wiggle: 1, oasis: 1, note: '一城一国：每片绿洲自成一区，戈壁沙漠归附最近的绿洲' },
    sogd: { pop: 1, spread: 0.4, core: 0.1, river: -0.7, ridge: 1.2, wiggle: 1, oasis: 0.8, note: '昭武九姓沿泽拉夫尚河谷分布，城邦相连' },
    persia: IRAN, iranislam: IRAN, kushan: IRAN,
    arabic: { ...IRAN, spread: 0.5, oasis: 0.8 }, dashi: { ...IRAN, spread: 0.5, oasis: 0.8 },
    tianzhu: { pop: 1, spread: 0.35, core: 0.35, river: 0.2, ridge: 1.1, wiggle: 1, note: '王畿直辖、诸省环绕；恒河平原州县密集' },
    tamil: { pop: 1, spread: 0.35, core: 0.35, river: -0.3, ridge: 1.1, wiggle: 1, note: '纳杜以灌溉水系为单位，高韦里河三角洲最密' },
    nanyang: MANDALA, siam: MANDALA, burma: MANDALA, khmer: MANDALA,
    latin: { pop: 0.7, spread: 0.25, core: 0.1, river: 0.8, ridge: 0.8, wiggle: 0.55, note: '罗马行省规整，以莱茵、多瑙等大河和海岸为界' },
    greek: { pop: 0.7, spread: 0.3, core: 0.2, river: 0.5, ridge: 1.3, wiggle: 0.8, note: '军区依山地关隘布防，沿海军区狭长' },
    german: FEUDAL, celtic: { ...FEUDAL, ridge: 1.4, note: '氏族领地以山谷、湖泊为单位，大小悬殊' },
    norse: { ...FEUDAL, pop: 0.7, ridge: 1.7, river: 0, note: '雅尔领沿峡湾与海岸展开，以山岭分隔，内陆地广人稀' },
    english: { pop: 0.9, spread: 0.35, core: 0.1, river: 0.7, ridge: 1, wiggle: 1.1, note: '郡界多沿河流，百户区按户数划分' },
    slavic: { pop: 0.75, spread: 0.3, core: 0.2, river: 0.6, ridge: 0.8, wiggle: 0.9, note: '省县以河流为界，北方林区、东方草原县极大' },
  };
  // 同一文明不同制度的特殊习惯
  App.ADMIN_SYS_STYLE = {
    yuan: { ridge: 0.45, note2: '元代行省有意“犬牙交错”，打破山川天险以防割据（如汉中划归陕西、湖南湖北合为湖广）' },
    tang: { ridge: 1.8, note2: '唐太宗依“山川形便”分天下为十道' },
    qin: { ridge: 1.6 }, sui: { spread: 0.3 },
    lateRome: { wiggle: 0.55 }, satrapy: { spread: 0.5, pop: 0.6 }, ottoman: { spread: 0.4 },
    decimal: { pop: 0.35 }, mengan: { spread: 0.25 },
  };
  App.adminStyle = (n) => {
    const cul = n ? n.culture : 'huaxia', key = App.sysKey(n);
    return { ...D, ...(App.ADMIN_STYLE[cul] || {}), ...(App.ADMIN_SYS_STYLE[key] || {}) };
  };
  App.adminStyleNote = (n) => { const s = App.adminStyle(n); return [s.note, s.note2].filter(Boolean).join('；'); };
})();
