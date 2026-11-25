// ===== 西域与草原诸文明：西域诸国、粟特、突厥、贵霜、大食、伊斯兰波斯、契丹、女真、蒙古、匈奴 =====
(() => {
  const P = (a, r) => a[Math.floor(r() * a.length)];
  const sp = (s) => s.split(' ');
  const syl = (S, r, lo, hi) => { const n = lo + Math.floor(r() * (hi - lo + 1)); let s = ''; for (let i = 0; i < n; i++) { let c; do { c = P(S, r); } while (s.includes(c)); s += c; } return s; };
  const N = App.Names;
  // 通用生成：历史国名、音节+后缀的新国名、城名、行政区名
  const mk = (o) => ({
    ...o,
    nation: (r) => (r() < 0.55 ? P(o.nations, r) : syl(o.syl, r, 2, 2) + P(o.natSuf, r)),
    city: (r) => (r() < 0.25 && o.cities ? P(o.cities, r) : syl(o.syl, r, 2, o.max || 2) + P(o.citySuf, r)),
    prov: (r) => syl(o.syl, r, 2, 2) + P(o.provSuf || ['州'], r),
  });
  const D = {};
  D.tarim = mk({ name: '西域诸国（绿洲城邦）', rel: '佛教', sys: 'oasis',
    nations: sp('于阗 龟兹 高昌 疏勒 焉耆 鄯善 楼兰 莎车 车师 且末 精绝 尉头 姑墨 温宿 小宛 戎卢 扜弥 皮山 蒲类 危须 尉犁 渠犁 乌孙 大宛'), natSuf: ['国', '国', '王国'],
    syl: sp('于 阗 龟 兹 疏 勒 焉 耆 鄯 善 楼 兰 莎 车 且 末 精 绝 尉 头 姑 墨 温 宿 扜 弥 皮 山 蒲 类 危 须 犁 渠 伊 循 交 河 延 乾 它 拘 戎 卢'),
    cities: sp('它乾城 延城 交河城 扜泥城 西城 伊循城 员渠城 南城 尉犁城 赤谷城 贵山城'), citySuf: sp('城 城 城 镇 戍'), provSuf: sp('城 镇'),
    given: [sp('胜 伏阇雄 伏阇信 苏伐勃駃 苏伐叠 文泰 智盛 突骑支 龙会 诃黎布失毕 白纯 白震 尉迟胜 尉迟曜 裴安定'), sp('阿摩 苏伐 娑罗 迦叶 妙音')],
    surn: sp('尉迟 白 帛 麴 龙 裴 车 安'), two: true });
  D.sogd = mk({ name: '粟特（昭武九姓）', rel: '祆教', sys: 'oasis',
    nations: sp('康国 安国 石国 米国 史国 曹国 何国 火寻 戊地 粟特 飒秣建 捕喝 赭时'), natSuf: ['国'],
    syl: sp('萨 末 建 飒 秣 布 豁 那 赭 时 柘 折 怯 沙 碣 石 劫 呾 弭 贺 拔 汗 片 治 肯 特 撒 马 尔 罕 哈'),
    cities: sp('撒马尔罕 布哈拉 片治肯特 柘折城 碣石城 瓦拉赫沙 那色波 弭秣贺'), citySuf: sp('城 城 堡'), provSuf: sp('城 镇'),
    given: [sp('拂耽延 禄山 思顺 婆陀 般遮 槃陀 突昏 沙钵略 咄曷 莫贺咄 达干 屈底波'), sp('阿了 胡娘 婆罗 那那 萨宝')],
    surn: sp('康 安 石 米 史 曹 何 穆'), two: true });
  D.turk = mk({ name: '突厥（突骑施·回鹘·葛逻禄）', rel: '萨满（腾格里）', sys: 'turkwing',
    nations: sp('突厥 东突厥 西突厥 后突厥 突骑施 葛逻禄 回鹘 黠戛斯 薛延陀 沙陀 拔悉密 处月 处密 铁勒 坚昆'), natSuf: ['汗国', '汗国', '部'],
    syl: sp('碎 叶 怛 逻 斯 弓 月 千 泉 于 都 斤 斡 鲁 朵 别 失 庭 阿 克 苏 喀 什 托 马 骨 咄 禄 毗 伽 阙 特 勤 默 啜 颉 利'),
    cities: sp('碎叶 怛逻斯 弓月城 千泉 于都斤牙帐 斡鲁朵八里 别失八里 喀什噶尔'), citySuf: sp('城 八里 牙帐 城'), provSuf: sp('厢 部 箭'),
    given: [sp('咄苾 骨咄禄 默啜 毗伽 阙特勤 暾欲谷 吐迷度 磨延啜 苏禄 室点密 达头 沙钵略 处罗 颉利 突利 射匮'), sp('可敦 阿史德 婆匐 苏尼 骨咄')],
    surn: sp('阿史那 阿史德 药罗葛 仆固 拔野古 骨咄禄 车鼻'), whole: true });
  D.kushan = mk({ name: '贵霜（大月氏·吐火罗）', rel: '佛教', sys: 'satrapy',
    nations: sp('贵霜 大月氏 吐火罗 大夏 罽宾 犍陀罗 迦毕试 巴克特里亚 康居 休密 双靡'), natSuf: ['国', '王国'],
    syl: sp('蓝 监 氏 富 楼 沙 呾 叉 始 罗 迦 毕 试 缚 喝 巴 尔 赫 犍 陀 罽 宾 呼 揭 弗 那'),
    cities: sp('蓝氏城 监氏城 富楼沙 呾叉始罗 巴尔赫 迦毕试 布色羯逻伐底'), citySuf: sp('城 城 补罗'), provSuf: sp('总督区 城'),
    given: [sp('丘就却 阎膏珍 迦腻色伽 胡维色迦 韦苏提婆 维摩伽德菲塞斯 瓦西色迦'), sp('阿达沙 帕尔瓦蒂 摩耶')],
    surn: sp('贵霜 吐火罗 大月氏'), whole: true });
  D.dashi = mk({ name: '大食（阿拉伯·汉文史书称法）', rel: '伊斯兰教', sys: 'wilayah',
    nations: sp('大食 黑衣大食 白衣大食 绿衣大食 拨拔力 也门 汉志 阿曼'), natSuf: ['国', '哈里发国', '埃米尔国'],
    syl: sp('巴 格 达 马 士 革 麦 加 地 那 库 法 拉 开 罗 亚 丁 哈 里 萨 迈 阿 布 塔 伊 夫 吉 兹'),
    cities: sp('巴格达 大马士革 麦加 麦地那 库法 巴士拉 开罗 亚丁 摩苏尔 阿勒颇'), citySuf: sp('城 城 堡'), provSuf: sp('省 区'),
    given: [sp('哈伦 曼苏尔 马蒙 穆阿维叶 阿卜杜勒 奥斯曼 欧麦尔 阿里 赛义德 哈立德 阿布·伯克尔'), sp('阿伊莎 法蒂玛 宰奈卜 赫蒂彻')],
    surn: sp('阿拔斯 倭马亚 法蒂玛 哈希姆 古莱什'), whole: true });
  D.iranislam = mk({ name: '伊斯兰波斯（呼罗珊·萨曼·塞尔柱）', rel: '伊斯兰教', sys: 'iqta',
    nations: sp('萨曼 塞尔柱 伽色尼 花剌子模 白益 萨法尔 塔希尔 喀喇汗 古尔 呼罗珊'), natSuf: ['王朝', '苏丹国', '国'],
    syl: sp('尼 沙 普 尔 梅 夫 赫 拉 特 伊 斯 法 罕 设 兹 雷 呼 罗 珊 马 赞 德 兰 加 兹 讷 克 尔 曼'),
    cities: sp('尼沙普尔 梅尔夫 赫拉特 伊斯法罕 设拉子 雷伊 加兹尼 克尔曼'), citySuf: sp('城 阿巴德 城'), provSuf: sp('省 伊克塔'),
    given: [sp('马哈茂德 托格里勒 阿尔斯兰 马立克沙 纳斯尔 伊斯玛仪 桑贾尔 摩诃末 阿老丁'), sp('图尔坎 古丽 法里德')],
    surn: sp('萨曼 塞尔柱 伽色尼 白益 花剌子模'), whole: true });
  D.khitan = mk({ name: '契丹（辽）', rel: '佛教', sys: 'liao',
    nations: sp('辽 大辽 契丹 西辽 东丹 北辽 后辽'), natSuf: ['国'],
    syl: sp('临 潢 大 定 辽 阳 析 津 显 庆 祖 怀 永 黄 龙 长 春 泰 宁 饶 乐 松 漠 木 叶'),
    cities: sp('临潢 大定 辽阳 析津 大同 祖州 怀州 黄龙 长春州'), citySuf: sp('府 州 城 州'), provSuf: sp('道 府 州'),
    given: [sp('阿保机 德光 兀欲 述律 隆绪 宗真 洪基 延禧 大石 休哥 斜轸 隆运'), sp('平 绰 观音 撒葛只 菩萨哥')],
    surn: sp('耶律 萧'), two: false });
  D.jurchen = mk({ name: '女真（金）', rel: '萨满', sys: 'mengan',
    nations: sp('金 大金 女真 后金 东夏 完颜部 生女真 渤海'), natSuf: ['国', '部'],
    syl: sp('会 宁 黄 龙 江 肇 咸 平 婆 速 按 出 虎 海 兰 混 同 率 宾 胡 里 改 曷 懒 恤 品'),
    cities: sp('会宁 上京 黄龙府 宁江州 肇州 咸平 按出虎 曷懒甸'), citySuf: sp('府 州 寨 城'), provSuf: sp('路 猛安 谋克'),
    given: [sp('阿骨打 吴乞买 宗翰 宗弼 宗望 合剌 亮 雍 璟 珣 守绪 粘罕 兀术 娄室'), sp('唐括 乌林答 徒单')],
    surn: sp('完颜 纥石烈 徒单 乌古论 蒲察 夹谷 唐括'), two: false });
  D.mongol = mk({ name: '蒙古', rel: '萨满（腾格里）', sys: 'decimal',
    nations: sp('蒙古 大蒙古国 北元 察合台汗国 金帐汗国 伊儿汗国 窝阔台汗国 瓦剌 鞑靼 克烈 乃蛮 蔑儿乞 塔塔儿'), natSuf: ['汗国', '部'],
    syl: sp('哈 拉 和 林 上 都 别 失 八 里 阿 力 麻 萨 莱 斡 难 怯 绿 连 克 鲁 伦 杭 爱 不 儿 罕'),
    cities: sp('哈拉和林 上都 别失八里 阿力麻里 萨莱 斡难河营地 怯绿连'), citySuf: sp('八里 斡耳朵 城 营'), provSuf: sp('万户 千户'),
    given: [sp('铁木真 窝阔台 拖雷 察合台 忽必烈 蒙哥 旭烈兀 拔都 也先 俺答 贵由 海都 别儿哥'), sp('孛儿帖 唆鲁禾帖尼 忽兰 也遂 察必')],
    surn: sp('孛儿只斤 札剌亦儿 弘吉剌 克烈 乃蛮 蔑儿乞 斡亦剌'), whole: true });
  D.xiongnu = mk({ name: '匈奴（鲜卑·柔然）', rel: '萨满', sys: 'xiongnu',
    nations: sp('匈奴 北匈奴 南匈奴 铁弗 屠各 鲜卑 柔然 东胡 乌桓 拓跋 慕容'), natSuf: ['部', '国', '汗国'],
    syl: sp('龙 单 于 庭 蹛 林 赵 信 统 万 姑 衍 狼 居 胥 余 吾 燕 然 涿 邪 稽 落 浚 稽'),
    cities: sp('龙城 单于庭 蹛林 范夫人城 赵信城 统万城 燕然'), citySuf: sp('城 庭 城'), provSuf: sp('部 万骑'),
    given: [sp('冒顿 老上 军臣 伊稚斜 呼韩邪 郅支 勃勃 檀石槐 轲比能 社仑 阿那瓌'), sp('阏氏 须卜 呼衍')],
    surn: sp('挛鞮 呼衍 兰 须卜 丘林 拓跋 慕容 郁久闾'), two: false });

  // ---------- 接入命名系统 ----------
  Object.entries(D).forEach(([id, d]) => { App.CULTURES.push({ id, name: d.name, script: 'zh' }); N.groups.zh.push(id); });
  const gen0 = N.gen; N.gen = (cul, kind, r = Math.random) => { const d = D[cul]; return d && d[kind] ? d[kind](r) : gen0(cul, kind, r); };
  const given0 = N.given; N.given = (cul, female, r = Math.random) => { const d = D[cul]; return d ? P(d.given[female ? 1 : 0], r) : given0(cul, female, r); };
  const fb0 = N.familyBase; N.familyBase = (cul, r = Math.random) => (D[cul] ? P(D[cul].surn, r) : fb0(cul, r));
  const fn0 = N.familyName; N.familyName = (cul, b) => (D[cul] ? b + (D[cul].whole ? '家族' : '氏') : fn0(cul, b));
  const full0 = N.fullName; N.fullName = (cul, sur, given) => (D[cul] ? (D[cul].whole ? given + '·' + sur : sur + given) : full0(cul, sur, given));
  App.CULT_RELIGION = Object.assign(App.CULT_RELIGION || {}, Object.fromEntries(Object.entries(D).map(([k, d]) => [k, d.rel])));

  // ---------- 行政区划制度 ----------
  const S = (lv, extra) => ({ lv, ...extra });
  Object.assign(App.ADMIN_SYS, {
    oasis: S([null, ['城'], ['镇'], ['聚落']], { name: '西域城邦：王城辖区—城镇—聚落', cul: 'tarim', levels: 3, per: 600, kids: [null, null, [2, 5], [2, 6]], note: '西域三十六国多为绿洲城邦，以王城为中心，周围有若干城镇与绿洲聚落；粟特诸国亦然。' }),
    turkwing: S([null, ['厢'], ['部'], ['帐']], { name: '突厥·两厢十箭：厢—部（箭）—帐', cul: 'turk', levels: 3, per: 3000, kids: [null, null, [3, 6], [2, 8]], note: '西突厥分左右两厢，左厢五咄陆、右厢五弩失毕，合称十箭（十部），部下是游牧的帐落。' }),
    iqta: S([null, ['省'], ['伊克塔'], ['村']], { name: '塞尔柱·伊克塔：省—伊克塔—村', cul: 'iranislam', levels: 3, per: 2500, kids: [null, null, [3, 8], [3, 8]], note: '塞尔柱与伽色尼以伊克塔（军事采邑）赏赐将领，将领在采邑内征税养兵。' }),
    liao: S([null, ['道'], ['府', '州', '州'], ['县']], { name: '辽·五京道：道—府/州—县', cul: 'khitan', levels: 3, per: 4000, kids: [null, null, [5, 12], [2, 6]], note: '辽设五京道，蕃汉分治：汉地设州县，草原保留部族，另有皇帝的斡鲁朵。' }),
    mengan: S([null, ['路'], ['猛安'], ['谋克']], { name: '金·路—猛安—谋克', cul: 'jurchen', levels: 3, per: 3000, kids: [null, null, [4, 10], [5, 10]], note: '女真以三百户为一谋克，十谋克为一猛安，既是军队编制也是行政组织；汉地另设路、府、州、县。' }),
    xiongnu: S([null, ['部'], ['万骑'], ['千长']], { name: '匈奴·左右部—万骑—千长', cul: 'xiongnu', levels: 3, per: 3000, kids: [null, null, [3, 8], [3, 8]], note: '单于庭居中，左右贤王、左右谷蠡王分领东西，共二十四长，号称万骑，下设千长、百长。' }),
  });
  Object.assign(App.ADMIN_AREA, { oasis: [0, 40000, 8000, 1500], turkwing: [0, 1500000, 250000, 60000], iqta: [0, 150000, 20000, 4000],
    liao: [0, 400000, 30000, 6000], mengan: [0, 250000, 30000, 5000], xiongnu: [0, 1500000, 250000, 60000] });
  Object.entries(D).forEach(([k, d]) => (App.DEFAULT_SYS[k] = d.sys));
  // 地名后缀
  const s0 = App.Names.stripSuffix, SUF3 = /(斡耳朵|万骑|千长|伊克塔|猛安|谋克|八里|牙帐|阿巴德|总督区|厢|箭|帐|戍|营|聚落)$/;
  App.Names.stripSuffix = (s) => { let t = s0(s); const u = t.replace(SUF3, ''); if (Array.from(u).length >= 2) t = u; return t || s; };
})();
