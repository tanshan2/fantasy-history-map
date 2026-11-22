// ===== 行政区划制度：不同时期、不同文化 =====
// lv[级] = 该级的名称（中文后缀，或含 {X} 的西文格式）；kids[级] = 每个上级下辖数量范围；per = 每个一级区约占格数
(() => {
  const S = (lv, extra) => ({ lv, ...extra });
  App.ADMIN_SYS = {
    qin: S([null, ['郡'], ['县']], { name: '秦·郡县制：郡—县', cul: 'huaxia', levels: 2, per: 700, kids: [null, null, [5, 14]], note: '秦始皇废分封、设三十六郡，郡下辖县。' }),
    han: S([null, ['州'], ['郡', '郡', '郡', '国'], ['县', '县', '县', '侯国']], { name: '汉·州郡县：州—郡/国—县', cul: 'huaxia', levels: 3, per: 1600, kids: [null, null, [4, 9], [4, 10]], note: '汉武帝置十三州刺史部，下辖百余郡国，郡辖县。' }),
    sui: S([null, ['州'], ['县']], { name: '隋·州县制：州—县', cul: 'huaxia', levels: 2, per: 500, kids: [null, null, [3, 8]], note: '隋文帝罢郡，以州统县。' }),
    tang: S([null, ['道'], ['州', '州', '州', '府'], ['县']], { name: '唐·道州县：道—州/府—县', cul: 'huaxia', levels: 3, per: 2600, kids: [null, null, [6, 14], [3, 7]], note: '唐太宗分天下为十道（后十五道），统三百余州府。' }),
    song: S([null, ['路'], ['州', '州', '府', '军'], ['县']], { name: '宋·路州县：路—府/州/军—县', cul: 'huaxia', levels: 3, per: 1800, kids: [null, null, [5, 12], [3, 8]], note: '宋设二十余路，路下有府、州、军、监。' }),
    yuan: S([null, ['行省'], ['路', '路', '府'], ['州', '县', '县']], { name: '元·行省制：行省—路/府—州/县', cul: 'huaxia', levels: 3, per: 4200, kids: [null, null, [5, 12], [3, 8]], note: '元设中书省与十一行省，下辖路、府、州、县。' }),
    ming: S([null, ['省'], ['府', '府', '府', '直隶州'], ['县', '县', '县', '州']], { name: '明清·省府县：省—府/直隶州—县/州', cul: 'huaxia', levels: 3, per: 3200, kids: [null, null, [6, 13], [4, 10]], note: '明设两京十三布政使司（省），下辖府与直隶州，府辖州县。' }),
    ritsuryo: S([null, ['道'], ['国'], ['郡']], { name: '日本·律令制：道—国—郡', cul: 'wa', levels: 3, per: 2400, kids: [null, null, [4, 10], [3, 8]], note: '五畿七道，下设六十余令制国，国下分郡。' }),
    decimal: S([null, ['万户'], ['千户'], ['百户']], { name: '草原·千户制：万户—千户—百户', cul: 'steppe', levels: 3, per: 1500, kids: [null, null, [6, 10], [4, 10]], note: '蒙古以十进制编组：万户下辖约十个千户，千户下辖百户。' }),
    gupta: S([null, ['部'], ['区'], ['村社']], { name: '笈多·布克提—维沙亚—村社', cul: 'tianzhu', levels: 3, per: 2200, kids: [null, null, [3, 8], [4, 10]], note: '笈多王朝分省（布克提），省下设区（维沙亚）。' }),
    sasanian: S([null, ['方区'], ['州'], ['乡']], { name: '萨珊·库斯特—沙赫尔—鲁斯塔克', cul: 'persia', levels: 3, per: 3500, kids: [null, null, [4, 10], [3, 7]], note: '萨珊波斯分四方区（库斯特），下辖沙赫尔（州），州下有鲁斯塔克（乡）。' }),
    satrapy: S([null, ['总督区'], ['行政区']], { name: '阿契美尼德·总督区—行政区', cul: 'persia', levels: 2, per: 1500, kids: [null, null, [3, 8]], note: '大流士一世设二十余总督区（萨特拉普）。' }),
    mandala: S([null, ['属国'], ['州'], ['村落']], { name: '南洋·曼陀罗：属国—州—村落', cul: 'nanyang', levels: 3, per: 1500, kids: [null, null, [3, 7], [3, 8]], note: '东南亚古国以王城为中心，四周属国朝贡。' }),
    lateRome: S([null, ['大区'], ['管区'], ['行省']], { name: '晚期罗马：大区—管区—行省', cul: 'latin', levels: 3, per: 5000, kids: [null, null, [2, 5], [4, 10]], note: '戴克里先改革：四大区、十余管区、百余行省。' }),
    theme: S([null, ['军区'], ['图尔马'], ['德隆戈斯']], { name: '拜占庭军区制：军区—图尔马—德隆戈斯', cul: 'greek', levels: 3, per: 1800, kids: [null, null, [2, 4], [3, 6]], note: '军区（Thema）既是军事单位也是行政区。' }),
    feudal: S([null, ['公国'], ['伯国'], ['男爵领']], { name: '封建制：公国—伯国—男爵领', cul: 'german', levels: 3, per: 1600, kids: [null, null, [3, 7], [2, 6]], note: '中世纪欧洲分封：公爵领下有伯爵领，伯爵领下有男爵领。' }),
    shire: S([null, ['伯爵领'], ['郡'], ['百户区']], { name: '英格兰：伯爵领—郡—百户区', cul: 'english', levels: 3, per: 1600, kids: [null, null, [3, 6], [4, 10]], note: '盎格鲁-撒克逊时期以郡（shire）为基本单位，郡下分百户区。' }),
    guberniya: S([null, ['省'], ['县'], ['乡']], { name: '帝俄：省—县—乡', cul: 'slavic', levels: 3, per: 2500, kids: [null, null, [6, 12], [5, 12]], note: '彼得大帝设省（губерния），省下有县（уезд）、乡（волость）。' }),
    wilayah: S([null, ['省'], ['区'], ['乡']], { name: '哈里发：维拉亚—库拉—鲁斯塔克', cul: 'arabic', levels: 3, per: 2800, kids: [null, null, [3, 8], [3, 7]], note: '阿拔斯王朝的行省（维拉亚）下分区（库拉）与乡（鲁斯塔克）。' }),
    ottoman: S([null, ['行省'], ['桑贾克'], ['卡扎']], { name: '奥斯曼：埃亚莱特—桑贾克—卡扎', cul: 'any', levels: 3, per: 3000, kids: [null, null, [4, 10], [3, 8]], note: '奥斯曼帝国的行省（埃亚莱特）下辖桑贾克，桑贾克下辖卡扎。' }),
  };
  App.DEFAULT_SYS = { huaxia: 'ming', steppe: 'decimal', wa: 'ritsuryo', tianzhu: 'gupta', persia: 'sasanian', nanyang: 'mandala', latin: 'lateRome', greek: 'theme', german: 'feudal', norse: 'feudal', celtic: 'feudal', english: 'shire', slavic: 'guberniya', arabic: 'wilayah' };
  App.sysOf = (n) => App.ADMIN_SYS[(n && n.adminSys) || App.DEFAULT_SYS[n ? n.culture : 'huaxia'] || 'ming'] || App.ADMIN_SYS.ming;
  App.sysKey = (n) => (n && n.adminSys && App.ADMIN_SYS[n.adminSys] ? n.adminSys : App.DEFAULT_SYS[n ? n.culture : 'huaxia'] || 'ming');
  App.maxLevel = (n) => App.sysOf(n).levels;
  const ZH = { Praefectura: '大区', Dioecesis: '管区', Provincia: '行省', 'Theme of': '军区', 'Tourma of': '图尔马', 'Droungos of': '德隆戈斯', 'Duchy of': '公国', 'County of': '伯国',
    'Barony of': '男爵领', 'Earldom of': '伯爵领', shire: '郡', 'Shire of': '郡', Hundred: '百户区', Governorate: '省', Uyezd: '县', Volost: '乡', Wilayat: '维拉亚', Kura: '库拉', Rustaq: '鲁斯塔克',
    'Eyalet of': '埃亚莱特', 'Sanjak of': '桑贾克', 'Kaza of': '卡扎' };
  App.levelName = (n, lv) => {
    const L = App.sysOf(n).lv[lv]; if (!L) return '—';
    return [...new Set(L.map((s) => { const k = s.replace('{X}', '').trim(); return ZH[k] || k; }))].join('/');
  };
  const LATIN_WORDS = /^(Praefectura|Dioecesis|Provincia|Wilayat|Kura|Rustaq) |^(Theme|Tourma|Droungos|Duchy|County|Barony|Earldom|Shire|Eyalet|Sanjak|Kaza|March|Jarldom|Clan|Theme) of | (Governorate|Uyezd|Volost|County|Hundred|Oblast|Satrapy|Provincia)$|shire$/g;
  App.Names.baseOf = (p) => p.base || App.Names.stripSuffix(p.name.replace(LATIN_WORDS, '')) || p.name;
  // 命名：同一国家三级名称来自同一制度
  App.Names.provFor = (n, level, r = Math.random) => {
    const cul = n ? n.culture : 'huaxia', sys = App.sysOf(n), forms = sys.lv[Math.min(level, sys.levels)];
    const form = forms[Math.floor(r() * forms.length)];
    let base = App.Names.stripSuffix(App.Names.gen(cul, 'city', r)) || App.Names.gen(cul, 'city', r);
    if (form.includes('{X}')) return { name: form.replace('{X}', base.replace(/^Al-/, '')), base };
    if (cul === 'huaxia' && level === 1 && form.length === 1 && r() < 0.55) base = Array.from(base)[0];
    return { name: base + form, base };
  };
  App.Names.provName = (n, level, r) => App.Names.provFor(n, level, r).name;
  // 切换制度：保留地名主体，只换级别名称；两级制度会去掉第三级
  App.Ops.setAdminSys = (n, key) => {
    n.adminSys = key; const sys = App.ADMIN_SYS[key];
    const S = App.S;
    if (sys.levels < 3) App.Ops.deleteProvinces(S.provinces.filter((p) => p.nation === n.id && p.level === 3).map((p) => p.id));
    S.provinces.filter((p) => p.nation === n.id).forEach((p) => {
      const forms = sys.lv[p.level || 1], form = forms[Math.floor(U.hash(p.id, 3, 5) * forms.length)];
      const base = App.Names.baseOf(p);
      p.base = base;
      p.name = form.includes('{X}') ? form.replace('{X}', base) : base + form;
    });
  };
})();

// 各制度每级单位的历史典型面积（平方公里）：[ , 一级, 二级, 三级 ]
App.ADMIN_AREA = {
  qin: [0, 90000, 3500], han: [0, 320000, 40000, 3500], sui: [0, 15000, 3000], tang: [0, 400000, 15000, 3000], song: [0, 200000, 14000, 3000],
  yuan: [0, 700000, 60000, 6000], ming: [0, 220000, 25000, 3500], ritsuryo: [0, 60000, 6000, 900], decimal: [0, 500000, 75000, 16000],
  gupta: [0, 120000, 15000, 2500], sasanian: [0, 500000, 50000, 6000], satrapy: [0, 250000, 30000], mandala: [0, 60000, 8000, 1500],
  lateRome: [0, 800000, 150000, 25000], theme: [0, 60000, 20000, 5000], feudal: [0, 40000, 6000, 1200], shire: [0, 25000, 2500, 400],
  guberniya: [0, 80000, 8000, 1500], wilayah: [0, 150000, 20000, 4000], ottoman: [0, 100000, 15000, 3000],
};
App.sysKeyOf = (sys) => Object.keys(App.ADMIN_SYS).find((k) => App.ADMIN_SYS[k] === sys) || 'ming';
