// ===== 更多文明：朝鲜、西南（滇黔）、吐蕃、安南、暹罗、缅甸、高棉、南天竺 =====
(() => {
  const P = (a, r) => a[Math.floor(r() * a.length)];
  const sp = (s) => s.split(' ');
  const two = (A, B, r) => { let a, b; do { a = P(A, r); b = P(B, r); } while (a === b); return a + b; };
  const syl = (S, r, lo, hi) => { const n = lo + Math.floor(r() * (hi - lo + 1)); let s = ''; for (let i = 0; i < n; i++) { let c; do { c = P(S, r); } while (s.includes(c)); s += c; } return s; };
  const N = App.Names;

  // 每个文明：显示名、国名、城名、行政区名、人名（男/女）、姓氏、各级行政区后缀、默认宗教、默认制度
  const D = {};
  // ---------- 朝鲜 ----------
  const KA = sp('汉 开 平 庆 全 光 罗 公 清 忠 江 原 咸 黄 安 东 金 海 尚 晋 熊 济 春 铁 义 宁 永 丰 洪 礼 顺 南 白 星 达 密 蔚 襄 杨 骊');
  const KB = sp('州 城 山 原 津 浦 川 阳 陵 宁 安 平 海 昌 德 川');
  D.korea = { name: '朝鲜', rel: '儒教', sys: 'joseon',
    nation: (r) => P([P(sp('高句丽 百济 新罗 高丽 渤海 朝鲜 扶余 伽倻 耽罗 马韩 辰韩 弁韩 沃沮 濊貊'), r), P(KA, r) + P(sp('丽 罗 韩 济'), r), '后' + P(sp('高丽 百济 新罗 朝鲜'), r), '大' + P(sp('韩 丽 朝'), r)], r),
    city: (r) => two(KA, KB, r), prov: (r) => two(KA, KB, r).slice(0, 2) + P(sp('道 牧 府 郡'), r),
    given: [sp('成桂 芳远 世宗 元宗 光宗 昌 浚 浩 珉 镐 瑢 弘 燮 祯 哲 植 焕 圭 允 承 秀 载 喆 俊 起'), sp('淑 英 顺 姬 惠 贞 善 玉 恩 敏 智 媛 珠 允 熙 美')],
    surn: sp('金 李 朴 崔 郑 姜 赵 尹 张 林 韩 申 吴 徐 权 黄 宋 安 柳 洪 全 高 文 孙 梁 裴 白 许 南 沈 卢 河 丁'),
    two: true };
  // ---------- 西南（滇黔·南诏大理） ----------
  const XN = sp('苴 咩 阳 和 拓 东 弄 栋 姚 永 昌 腾 冲 澜 沧 洱 苍 罗 甸 夜 郎 牂 牁 邛 笮 僰 濮 句 町 哀 牢 剑 川 蒙 舍 越 析 勃 弄 银 生 丽 水 会 建 宁 威 楚 雄 普 洱 景 曼');
  D.diannan = { name: '西南（滇黔·南诏大理）', rel: '佛教', sys: 'nanzhao',
    nation: (r) => P([P(sp('南诏 大理 夜郎 滇国 句町 哀牢 牂牁 邛都 白国 大长和 大天兴 大义宁 罗甸 自杞 罗殿 播州 水西'), r), syl(XN, r, 2, 2) + '国', '大' + syl(XN, r, 1, 2), syl(XN, r, 2, 2) + '诏'], r),
    city: (r) => syl(XN, r, 2, 2) + P(sp('城 睑 甸 寨 川 赕 城'), r), prov: (r) => syl(XN, r, 2, 2) + P(sp('节度 睑 部 府'), r),
    given: [sp('思平 素英 智升 买嗣 世隆 隆舜 正淳 正明 兴智 智祥 升泰 寿辉 祥明 誉 廉义 阁罗 异牟 寻阁 劝龙'), sp('阿慈 妙香 金莲 玉兰 白姑 兰芝 秀英')],
    surn: sp('段 高 杨 董 赵 李 蒙 郑 王 张 爨 安 奢 普 宋') };
  // ---------- 吐蕃 ----------
  const TB = sp('逻 些 雅 砻 象 雄 苏 毗 拉 萨 日 喀 则 昌 都 林 芝 乃 东 江 孜 琼 结 札 达 冈 底 斯 羊 卓 那 曲 嘉 绒 多 康 安 卫 藏 阿 里 堆 噶 杰 桑 耶');
  D.tubo = { name: '吐蕃（雪域）', rel: '佛教', sys: 'tubo',
    nation: (r) => P([P(sp('吐蕃 象雄 苏毗 古格 拉达克 吐谷浑 多康 安多 卫藏 阿里 雅砻 白兰 党项 附国'), r), syl(TB, r, 2, 2) + '王国', '大' + syl(TB, r, 2, 2)], r),
    city: (r) => syl(TB, r, 2, 2) + P(sp('宗 卡 城 寺 堡 宗'), r), prov: (r) => syl(TB, r, 2, 2) + P(sp('茹 东岱 宗'), r),
    given: [sp('松赞干布 赤松德赞 赤祖德赞 朗达玛 贡松贡赞 芒松芒赞 都松芒波杰 赤德祖赞 禄东赞 钦陵 尚结赞 达扎路恭'), sp('卓玛 央金 德吉 拉姆 次仁 白玛 梅朵 尼玛 达瓦')],
    surn: sp('噶尔 没庐 那囊 琛 韦 蔡邦 属庐 琼波 娘 巴'), whole: true };
  // ---------- 安南（大越） ----------
  const AN = sp('升 龙 华 闾 顺 化 清 化 义 安 乂 安 广 南 平 定 富 安 太 原 谅 山 宣 光 兴 化 海 阳 北 宁 南 定 宁 平 河 静 交 爱 驩 演 长 嘉 定 永');
  D.annam = { name: '安南（大越）', rel: '佛教', sys: 'daiviet',
    nation: (r) => P([P(sp('大越 安南 大瞿越 南越 交趾 万春 文郎 瓯雒 林邑 占城 大虞 南掌'), r), '大' + two(AN, AN, r).slice(0, 1) + '越', two(AN, AN, r) + '国'], r),
    city: (r) => two(AN, sp('州 城 京 府 安 化 平 定 阳 宁 江 海'), r), prov: (r) => two(AN, AN, r) + P(sp('道 承宣 路 府'), r),
    given: [sp('公蕴 佛玛 圣宗 仁宗 太宗 光缵 文惠 惠 利 光 福 德 文 明 英 雄 俊 忠 义 广 兴 道'), sp('氏 兰 梅 秋 春 香 玉 华 月 霞')],
    surn: sp('阮 黎 陈 李 丁 吴 郑 范 武 黄 胡 潘 杜 邓 裴 莫 何 高 杨'), two: true };
  // ---------- 暹罗（泰） ----------
  const SI = sp('素 可 泰 阿 瑜 陀 耶 兰 纳 澜 沧 清 迈 难 帕 府 披 集 洛 坤 那 空 是 贪 玛 叻 素 攀 武 里 呵 叻 彭 世 洛 甘 烹 碧 乌 汶 南 奔 帕 夭');
  D.siam = { name: '暹罗（泰）', rel: '佛教', sys: 'muang',
    nation: (r) => P([P(sp('暹罗 素可泰 阿瑜陀耶 兰纳 澜沧 罗斛 堕罗钵底 哈里奔猜 吞武里 曼谷 帕夭 难国 清盛'), r), syl(SI, r, 2, 3) + '王国', syl(SI, r, 2, 3)], r),
    city: (r) => syl(SI, r, 2, 3) + P(sp('城 府 武里 那空 城'), r), prov: (r) => syl(SI, r, 2, 2) + P(sp('勐 府 州'), r),
    given: [sp('兰甘亨 拉玛铁菩提 波隆摩 纳黎萱 那莱 达信 坤 披耶 昭 坤銮 帕 坤披'), sp('素丽 宛 婉 帕 娜 珀 婷')],
    surn: sp('素可 阿瑜 兰纳 披耶 坤 昭 帕 銮'), whole: true };
  // ---------- 缅甸 ----------
  const BM = sp('蒲 甘 阿 瓦 勃 固 骠 东 吁 实 皆 敏 建 曼 德 勒 卑 谬 丹 那 沙 林 若 开 掸 孟 毛 淡 摩 克 耶 景 栋 木 邦');
  D.burma = { name: '缅甸（骠·蒲甘）', rel: '佛教', sys: 'myo',
    nation: (r) => P([P(sp('蒲甘 骠国 阿瓦 勃固 东吁 若开 实皆 掸邦 孟国 直通 卑谬 阿拉干'), r), syl(BM, r, 2, 2) + '王国', syl(BM, r, 2, 2)], r),
    city: (r) => syl(BM, r, 2, 3) + P(sp('城 镇 寨 城'), r), prov: (r) => syl(BM, r, 2, 2) + P(sp('邦 府 镇'), r),
    given: [sp('阿奴律陀 江喜陀 那罗帕底 莽应龙 莽应里 雍籍牙 孟云 敏东 底哇 都 吴 貌'), sp('玛 杜 钦 丹 妙 敏 素')],
    surn: sp('吴 杜 貌 哥 波 塞 敏 丁 觉 昂'), whole: true };
  // ---------- 高棉 ----------
  const KM = sp('吴 哥 耶 输 陀 罗 补 罗 真 腊 扶 南 磅 湛 暹 粒 马 德 望 金 边 柏 威 夏 洞 里 萨 巴 普 农 毗 湿 奴 因 陀 跋 摩 阇');
  D.khmer = { name: '高棉（真腊·吴哥）', rel: '印度教', sys: 'angkor',
    nation: (r) => P([P(sp('真腊 吴哥 扶南 水真腊 陆真腊 高棉 柬埔寨 文单 堕罗'), r), syl(KM, r, 2, 3) + '王国', syl(KM, r, 2, 3)], r),
    city: (r) => syl(KM, r, 2, 3) + P(sp('补罗 城 城 洞'), r), prov: (r) => syl(KM, r, 2, 2) + P(sp('省 补罗 州'), r),
    given: [sp('阇耶跋摩 苏利耶跋摩 因陀罗跋摩 耶输跋摩 罗贞陀罗跋摩 拔婆跋摩 摩诃陀罗'), sp('因陀罗黛维 阇耶罗阇黛维 苏玛 黛维 嘉娜')],
    surn: sp('跋摩 阇耶 苏利耶 因陀罗 耶输 罗贞'), whole: true };
  // ---------- 南天竺（泰米尔·达罗毗荼） ----------
  const TM = sp('坦 焦 尔 马 杜 赖 甘 吉 普 拉 姆 卡 维 里 帕 拉 瓦 潘 地 亚 哲 罗 朱 维 杰 亚 纳 加 尔 特 里 奇 科 钦 卡 利 库 特 迈 索');
  D.tamil = { name: '南天竺（泰米尔）', rel: '印度教', sys: 'chola',
    nation: (r) => P([P(sp('朱罗 潘地亚 哲罗 帕拉瓦 遮娄其 罗湿陀罗拘陀 毗阇耶那伽罗 曷萨拉 卡卡提亚 雅达瓦 锡兰 僧伽罗'), r), syl(TM, r, 2, 3) + '王国', syl(TM, r, 2, 3) + '王朝'], r),
    city: (r) => syl(TM, r, 2, 3) + P(sp('城 补罗 布尔 城 港'), r), prov: (r) => syl(TM, r, 2, 3) + P(sp('曼达拉姆 纳杜 州'), r),
    given: [sp('罗阇罗阇 罗贞陀罗 库洛同加 维杰雅拉亚 阿迪蒂亚 帕兰塔卡 苏达拉 维拉 克里希纳 马亨德拉 纳拉辛哈'), sp('昆塔维 塞姆比雅 洛卡 玛黛薇 拉克希米 帕尔瓦蒂')],
    surn: sp('朱罗 潘地亚 哲罗 帕拉瓦 那亚卡 皮莱 穆达利'), whole: true };

  // ---------- 接入命名系统 ----------
  Object.entries(D).forEach(([id, d]) => { App.CULTURES.push({ id, name: d.name, script: 'zh' }); N.groups.zh.push(id); });
  App.CULTURES.forEach((c) => { if (c.id === 'tianzhu') c.name = '天竺（北印度）'; if (c.id === 'nanyang') c.name = '南洋（马来·爪哇）'; });
  const gen0 = N.gen;
  N.gen = (cul, kind, r = Math.random) => { const d = D[cul]; return d && d[kind] ? d[kind](r) : gen0(cul, kind, r); };
  const given0 = N.given;
  N.given = (cul, female, r = Math.random) => {
    const d = D[cul]; if (!d) return given0(cul, female, r);
    const L = d.given[female ? 1 : 0]; return d.two && !female && r() < 0.5 ? P(L, r).slice(0, 1) + P(L, r).slice(-1) : P(L, r);
  };
  const fb0 = N.familyBase;
  N.familyBase = (cul, r = Math.random) => (D[cul] ? P(D[cul].surn, r) : fb0(cul, r));
  const fn0 = N.familyName;
  N.familyName = (cul, b) => (D[cul] ? b + (D[cul].whole ? '家族' : '氏') : fn0(cul, b));
  const full0 = N.fullName;
  N.fullName = (cul, sur, given) => (D[cul] ? (D[cul].whole ? given + (cul === 'tubo' || cul === 'tamil' || cul === 'khmer' || cul === 'siam' ? '·' + sur : '') : sur + given) : full0(cul, sur, given));
  App.CULT_RELIGION = Object.assign(App.CULT_RELIGION || {}, Object.fromEntries(Object.entries(D).map(([k, d]) => [k, d.rel])));
  App.CULT_DEFAULT_SYS = Object.fromEntries(Object.entries(D).map(([k, d]) => [k, d.sys]));
})();

// ---- 这些文明的行政区划制度（admin.js 之后加载） ----
(() => {
  const S = (lv, extra) => ({ lv, ...extra });
  Object.assign(App.ADMIN_SYS, {
    joseon: S([null, ['道'], ['府', '牧', '郡', '郡'], ['县']], { name: '朝鲜·八道制：道—府/牧/郡—县', cul: 'korea', levels: 3, per: 900, kids: [null, null, [6, 14], [3, 7]], note: '朝鲜王朝分八道，道下设府、牧、郡、县，由观察使统辖。' }),
    silla: S([null, ['州'], ['郡'], ['县']], { name: '新罗·九州五小京：州—郡—县', cul: 'korea', levels: 3, per: 900, kids: [null, null, [6, 15], [2, 5]], note: '统一新罗分全国为九州，州下有郡、县，另设五小京。' }),
    nanzhao: S([null, ['节度'], ['睑'], ['部']], { name: '南诏·节度—睑—部', cul: 'diannan', levels: 3, per: 2000, kids: [null, null, [2, 6], [3, 8]], note: '南诏、大理设六节度、二都督，核心地区为十睑（“睑”即州），下统诸部。' }),
    tusi: S([null, ['宣慰司'], ['宣抚司', '安抚司'], ['长官司']], { name: '土司制：宣慰司—宣抚/安抚司—长官司', cul: 'diannan', levels: 3, per: 1200, kids: [null, null, [2, 6], [2, 6]], note: '元明清在西南以当地首领世袭土官，宣慰司下设宣抚、安抚司及长官司。' }),
    tubo: S([null, ['茹'], ['东岱'], ['宗']], { name: '吐蕃·茹—东岱（千户）—宗', cul: 'tubo', levels: 3, per: 5000, kids: [null, null, [8, 14], [3, 8]], note: '吐蕃分本土为五茹（翼），共六十一东岱（千户），军政合一。' }),
    daiviet: S([null, ['承宣', '道'], ['府'], ['县']], { name: '大越·承宣—府—县', cul: 'annam', levels: 3, per: 600, kids: [null, null, [3, 8], [3, 7]], note: '黎圣宗改十三道为承宣，承宣下设府，府下设县、州。' }),
    chola: S([null, ['曼达拉姆'], ['瓦拉纳杜'], ['纳杜']], { name: '朱罗·曼达拉姆—瓦拉纳杜—纳杜', cul: 'tamil', levels: 3, per: 1500, kids: [null, null, [3, 8], [3, 8]], note: '朱罗王朝分国土为若干曼达拉姆（省），下设瓦拉纳杜与纳杜（村社联合体）。' }),
    muang: S([null, ['府'], ['勐', '县'], ['村']], { name: '暹罗·城邑（勐）制：府—勐/县—村', cul: 'siam', levels: 3, per: 1200, kids: [null, null, [3, 8], [3, 8]], note: '阿瑜陀耶以京畿为中心，四周按等级设大小城邑（勐），由王族或贵族镇守。' }),
    myo: S([null, ['省'], ['镇'], ['村']], { name: '缅甸·省—镇（谬）—村', cul: 'burma', levels: 3, per: 1200, kids: [null, null, [3, 8], [3, 8]], note: '蒲甘与东吁王朝以都城为核心，分省设镇（谬），镇下辖村。' }),
    angkor: S([null, ['省'], ['区'], ['村']], { name: '吴哥·省—区—村', cul: 'khmer', levels: 3, per: 1200, kids: [null, null, [3, 8], [3, 8]], note: '吴哥王朝以王城为中心，各省由王族或高僧家族治理，区下有村社与寺田。' }),
  });
  Object.assign(App.ADMIN_AREA, { joseon: [0, 28000, 3000, 700], silla: [0, 25000, 2500, 600], nanzhao: [0, 100000, 12000, 2500], tusi: [0, 50000, 8000, 1500],
    tubo: [0, 300000, 25000, 5000], daiviet: [0, 22000, 4000, 900], chola: [0, 60000, 8000, 1500], muang: [0, 35000, 5000, 900], myo: [0, 40000, 5000, 900], angkor: [0, 30000, 4500, 900] });
  Object.assign(App.DEFAULT_SYS, App.CULT_DEFAULT_SYS);
  // 去掉这些文明地名后缀，得到地名主体
  const s0 = App.Names.stripSuffix;
  const SUF2 = /(曼达拉姆|瓦拉纳杜|帕特南|藏布|东岱|节度|承宣|宣慰司|宣抚司|安抚司|长官司|武里|那空|补罗|布尔|纳杜|睑|甸|寨|赕|宗|寺|勐|镇|牧|茹|城|港|埠|河|冈|曲|坝|措|卡|日|拉)$/;
  App.Names.stripSuffix = (s) => { let t = s0(s); for (let i = 0; i < 2; i++) { const u = t.replace(SUF2, ''); if (Array.from(u).length >= 2) t = u; else break; } return t || s; };
})();
