// ===== 按文明随机命名 =====
(() => {
  const P = (a, r) => a[Math.floor(r() * a.length)];
  const sp = (s) => s.split(' ');
  const zhSyl = (syl, r, min = 2, max = 3) => { const n = min + Math.floor(r() * (max - min + 1)); let s = ''; for (let i = 0; i < n; i++) { let c; do { c = P(syl, r); } while (s.includes(c)); s += c; } return s; };
  const zh2 = (A, B, r) => { let a, b; do { a = P(A, r); b = P(B, r); } while (a === b); return a + b; };
  const latin = (st, en, r, pre) => { let s = P(st, r) + P(en, r); if (pre && r() < 0.25) s = pre + s; return s; };
  const form = (forms, x, r) => P(forms, r).replace('{X}', x);

  const C = {};
  // ---------- 华夏 ----------
  const HZ = { dyn: sp('秦 楚 燕 赵 魏 韩 齐 梁 陈 隋 唐 宋 晋 汉 吴 蜀 越 夏 商 周 辽 金 凉 代 郑 卫 鲁 宁 蔡 曹 许 虞 黔 滇 闽 粤 雍 冀 豫 襄 殷 邺 荆 徐 青'),
    A: sp('长 临 平 安 建 江 广 永 定 武 宁 开 洛 襄 泉 云 白 龙 凤 金 玉 清 咸 太 河 汉 湘 桂 上 高 新 德 怀 兴 昌 隆 荆 雁 晋 合 庐 柳 桐 渭 汾 泾 沧 淮 济 汝 颍 舒 番 苍 赤 丹 青 黄 朔 幽'),
    B: sp('安 阳 州 城 京 宁 平 陵 都 川 原 江 口 沙 门 关 谷 丘 邑 泽 林 山 海 浦 亭 津 庆 德 兴 昌 武 水 中 西 南 东 北 野') };
  C.huaxia = { name: '华夏', script: 'zh',
    nation: (r) => { const d = P(HZ.dyn, r); return P(['大' + d, d + '国', '西' + d, '东' + d, '南' + d, '北' + d, '后' + d, d, '大' + d], r); },
    city: (r) => zh2(HZ.A, HZ.B, r),
    prov: (r) => (r() < 0.5 ? P(HZ.A.concat(HZ.dyn), r) + P(['州', '州', '道', '路'], r) : zh2(HZ.A, HZ.B, r) + P(['郡', '郡', '府', '都护府'], r)),
  };
  // ---------- 草原 ----------
  const ST = sp('突 厥 回 纥 柔 然 鲜 卑 乌 孙 坚 昆 丁 零 阿 史 那 拔 悉 密 薛 延 陀 契 丹 室 韦 黠 戛 斯 沙 葛 逻 禄 铁 勒 仆 骨 浑 奚 可 敦 叶 护 莫 贺 咄 苏 颉 利 斛 律 乞 伏 秃 发 宇 文 慕 容 拓 跋 嚈 哒 兀 术 帖 木 察 合 台 也 速');
  C.steppe = { name: '草原', script: 'zh',
    nation: (r) => { const x = zhSyl(ST, r, 2, 3); return P([x + '汗国', '大' + x + '汗国', x + '部', x + '联盟', x], r); },
    city: (r) => zhSyl(ST, r, 2, 2) + P(['城', '帐', '王庭', '牙帐', '堡', '川', ''], r),
    prov: (r) => zhSyl(ST, r, 2, 3) + P(['部', '翼', '万户', '都督府', '左部', '右部'], r),
  };
  // ---------- 东瀛 ----------
  const WA = { A: sp('大 出 吉 筑 丹 播 近 远 武 相 越 能 加 若 美 伊 尾 三 甲 信 上 下 常 陆 奥 长 周 安 备 肥 萨 日 土 阿 淡 松 高 熊 鹿 冈 广 福 金 和 秋'),
    B: sp('和 云 备 紫 波 磨 江 藏 模 后 登 贺 狭 浓 势 张 河 斐 野 总 羽 门 防 艺 前 摩 向 隅 佐 岐 路 泽 山 岛 田 川 本 井 崎 原 津 宫') };
  C.wa = { name: '东瀛', script: 'zh',
    nation: (r) => { const x = zh2(WA.A, WA.B, r); return P([x + '国', '大' + x, x + '幕府', x], r); },
    city: (r) => zh2(WA.A, WA.B, r) + P(['', '', '京', '城', '津', '宫'], r),
    prov: (r) => zh2(WA.A, WA.B, r) + P(['国', '国', '藩', '郡'], r),
  };
  // ---------- 天竺 ----------
  const TZ = sp('摩 揭 陀 迦 毗 舍 罗 波 吒 俱 尸 那 犍 婆 伽 耶 憍 萨 阿 槃 提 般 遮 羯 陵 乌 荼 跋 僧 诃 室 利 补 难 鸠 钵 达 曷 健 瞿 频');
  C.tianzhu = { name: '天竺', script: 'zh',
    nation: (r) => { const x = zhSyl(TZ, r, 2, 3); return P([x + '国', x + '王朝', '大' + x, x], r); },
    city: (r) => zhSyl(TZ, r, 2, 3) + P(['城', '补罗', '', ''], r),
    prov: (r) => zhSyl(TZ, r, 2, 3) + P(['邦', '州', '国'], r),
  };
  // ---------- 波斯 ----------
  const PS = sp('安 息 帕 提 亚 米 底 苏 萨 珊 阿 尔 沙 达 赫 密 巴 克 特 兰 伊 斯 法 罕 设 拉 兹 呼 罗 木 鹿 泰 西 封 埃 坦 那 卡 曼 德 乌 弋 条 支 居 鲁');
  C.persia = { name: '波斯', script: 'zh',
    nation: (r) => { const x = zhSyl(PS, r, 2, 3); return P([x + '帝国', x + '王国', x + '国', x], r); },
    city: (r) => zhSyl(PS, r, 2, 3) + P(['城', '堡', '巴德', ''], r),
    prov: (r) => zhSyl(PS, r, 2, 3) + P(['行省', '总督区', '州'], r),
  };
  // ---------- 南洋 ----------
  const NY = sp('扶 南 真 腊 林 邑 占 婆 室 利 佛 逝 诃 陵 狼 牙 修 丹 盘 顿 逊 投 和 骠 蒲 甘 爪 哇 三 齐 满 剌 加 吕 宋 麻 逸 渤 泥 苏 禄 马 来');
  C.nanyang = { name: '南洋', script: 'zh',
    nation: (r) => { const x = zhSyl(NY, r, 2, 3); return P([x + '国', x + '王国', x], r); },
    city: (r) => zhSyl(NY, r, 2, 2) + P(['城', '港', '', '埠'], r),
    prov: (r) => zhSyl(NY, r, 2, 2) + P(['州', '部', '岛'], r),
  };
  // ---------- 西方（拉丁字母） ----------
  const L = (name, st, en, nf, pf, pre) => ({ name, script: 'latin', nation: (r) => form(nf, latin(st, en, r, pre), r), city: (r) => latin(st, en, r, pre), prov: (r) => form(pf, latin(st, en, r, pre), r) });
  C.latin = L('罗马(拉丁)', sp('Aqu Val Aur Cast Mar Luc Vin Sab Flav Corn Tar Ven Ost Nov Lav Aem Cal Pomp Aug Ter Rav Tusc Sal Ver Pol'), sp('ium ia um ona ensis anum entum ae inum ilia eria aca ica'), ['Imperium {X}', 'Regnum {X}', 'Res Publica {X}', '{X} Empire'], ['Provincia {X}', '{X}', 'Dioecesis {X}']);
  C.greek = L('希腊', sp('Ath Ther Kor Mak Eph Myk Spar Olymp Del Arg Lyk Thess Pel Kyr Rhod Nax Mil Hal Byz Chal'), sp('os ia ene opolis ikon ae eia is ara one ion'), ['{X} League', 'Kingdom of {X}', '{X} Basileia', '{X} Republic'], ['{X}', 'Theme of {X}', '{X} Satrapy']);
  C.german = L('日耳曼', sp('Ham Brun Ald Wolf Hel Eis Ross Stein Fried Wald Lun Hess Bran Mag Ober Kon Wit Rein Dorn Sach Thur Hag'), sp('burg heim stadt dorf berg au feld hausen ach ingen mark wald enau'), ['{X} Empire', 'Kingdom of {X}', 'Duchy of {X}', '{X} Confederation', 'Electorate of {X}'], ['{X}', 'March of {X}', 'County of {X}']);
  C.slavic = L('斯拉夫', sp('Nov Vol Kras Bel Mir Yar Zel Pol Vlad Rost Smol Pskov Tver Lyub Dob Gor Sver Bog Rad Zor'), sp('grad ograd ov sk insk ava ets nik ovo ice in oslav omir'), ['Tsardom of {X}', 'Principality of {X}', '{X} Rus', 'Grand Duchy of {X}', '{X} Republic'], ['{X} Oblast', '{X}', 'Voivodeship of {X}']);
  C.norse = L('北欧', sp('Thor Sig Ulf Ragn Hel Sval Vik Ask Fros Bjor Grim Hald Sten Ey Trond Jor'), sp('heim vik gard fjord by stad holm sund ness land dal'), ['Kingdom of {X}', '{X} Jarldom', '{X} Realm'], ['{X}', 'Jarldom of {X}']);
  C.celtic = L('凯尔特', sp('Dun Kil Bal Glen Aber Inver Llan Caer Bryn Pen Tre Ard Kin Mor'), sp('more dale wen ach ock ran iel an avon ross lyn'), ['{X} Tribal Alliance', 'High Kingdom of {X}', '{X} Clans', 'Kingdom of {X}'], ['{X}', 'Clan {X}']);
  C.arabic = L('阿拉伯', sp('Qas Zah Dar Med Sham Rab Qal Bas Ham Jaz Sal Nur Kuf Tab Sam Haz Mar Fus'), sp('ra an ah ir iya abad rat im un ar ina'), ['{X} Caliphate', 'Sultanate of {X}', 'Emirate of {X}', '{X} Imamate'], ['{X}', 'Wilayat {X}'], 'Al-');
  C.english = L('英格兰', sp('Ash Brad Ches Dor Glou Hamp Lan Nor Ox Shef Wor Yor Kent Ely Read Win Ux Bed'), sp('ford ton ham shire field bury wick chester ley mouth by stead'), ['Kingdom of {X}', '{X} Commonwealth', '{X} Republic', '{X} Tribal Alliance', '{X} Empire'], ['{X}shire', '{X}', 'County of {X}']);

  App.CULTURES = Object.entries(C).map(([id, c]) => ({ id, name: c.name, script: c.script }));
  App.Names = {
    gen: (cul, kind, r = Math.random) => { const c = C[cul] || C.huaxia; return c[kind](r); },
    nation: (cul, r) => App.Names.gen(cul, 'nation', r),
    city: (cul, r) => App.Names.gen(cul, 'city', r),
    prov: (cul, r) => App.Names.gen(cul, 'prov', r),
    groups: { zh: ['huaxia', 'steppe', 'wa', 'tianzhu', 'persia', 'nanyang'], latin: ['latin', 'greek', 'german', 'slavic', 'norse', 'celtic', 'arabic', 'english'] },
  };
})();

// ---- 三级行政区命名、人名、家族名 ----
(() => {
  const P = (a, r) => a[Math.floor(r() * a.length)];
  const sp = (s) => s.split(' ');
  const N = App.Names, base = N.gen;
  const LV = {
    huaxia: [null, sp('州 州 省'), sp('道 路 路'), sp('府 州 郡 军')], steppe: [null, sp('部 汗庭'), sp('翼 万户'), sp('千户 百户')],
    wa: [null, sp('道'), sp('国'), sp('郡')], tianzhu: [null, sp('邦 国'), sp('州'), sp('县 城区')],
    persia: [null, sp('行省'), sp('总督区 州'), sp('城区 县')], nanyang: [null, sp('州'), sp('部'), sp('岛 村落')],
  };
  const LATIN = [null, null, ['County of {X}', '{X} County', 'Duchy of {X}'], ['Barony of {X}', '{X}', '{X} Hundred']];
  const strip = (s) => s.replace(/(都护府|总督区|行省|万户|千户|百户|汗庭|城区|村落|左部|右部|布政司|州|省|道|路|府|郡|军|部|翼|国|藩|邦|县|岛)$/, "");
  N.stripSuffix = strip;
  N.prov = (cul, r = Math.random, level = 1, sys) => {
    const lv = cul === "huaxia" && sys && App.ADMIN_SYS[sys] ? App.ADMIN_SYS[sys].lv : LV[cul];
    if (lv) {
      let b = strip(base(cul, 'city', r)); if (!b) b = strip(base(cul, 'city', r));
      if (cul === 'huaxia' && level === 1 && r() < 0.6) b = Array.from(b)[0];
      return b + P(lv[level], r);
    }
    if (level === 1) return base(cul, 'prov', r);
    return P(LATIN[level], r).replace('{X}', base(cul, 'city', r));
  };
  // 人名
  const GIVEN = {
    huaxia: [sp('昂 和 宏 嵩 霆 毅 翊 骞 璋 恪 衡 瑾 渊 玄 彦 晟 歆 允 承 安 德 武 广 秀 谌 禹 弘 琮 曜 朗 祐 恂 慎 维 尚 敬'), sp('婉 昭 蓁 莹 若 兰 芷 嫣 韵 瑶 姝 婧 菀 宁 微 娥 媛 华 柔 婵 绮 漪 蘅 琬 黛 琳')],
    wa: [sp('正 义 信 长 光 秀 家 康 景 胜 宗 政 隆 元 清 重 忠 利 直 盛'), sp('千 代 花 春 雪 菊 松 竹 梅 绫 熏 静 澄 雅')],
  };
  const LGIVEN = {
    german: [sp('Manfred Friedrich Leopold Leonard Tillmann Otto Konrad Heinrich Albrecht Ludwig Siegfried Wilhelm'), sp('Kristina Emily Joanna Mathilde Adelheid Gisela Hedwig Irmgard Sophia Agnes')],
    latin: [sp('Marcus Lucius Gaius Titus Quintus Aulus Decimus Sextus Flavius Septimus'), sp('Julia Livia Octavia Claudia Aurelia Cornelia Valeria Flavia')],
    greek: [sp('Alexios Nikephoros Theodoros Leon Basileios Konstantinos Andronikos'), sp('Theodora Irene Zoe Helena Anna Eudokia Sophia')],
    slavic: [sp('Vladimir Yaroslav Svyatoslav Mstislav Boris Gleb Igor Oleg Dmitri'), sp('Olga Lyudmila Yaroslava Zlata Milena Vesna Rogneda')],
    norse: [sp('Ragnar Sigurd Bjorn Ivar Harald Olaf Erik Leif Gunnar'), sp('Astrid Ingrid Sigrid Freydis Gudrun Thyra Ragnhild')],
    celtic: [sp('Brian Conall Aedan Cormac Fergus Niall Domnall Ewan'), sp('Brigid Aine Deirdre Niamh Morag Eithne Siobhan')],
    arabic: [sp('Harun Yusuf Umar Hamza Khalid Tariq Idris Salim Rashid'), sp('Aisha Fatima Zainab Layla Maryam Salma Khadija')],
    english: [sp('Edmund Harold Alfred Edward Richard William Henry Geoffrey Robert'), sp('Edith Matilda Eleanor Margaret Alice Isabel Joan Emma')],
  };
  N.given = (cul, female, r = Math.random) => {
    const g = GIVEN[cul];
    if (g) { const L = g[female ? 1 : 0]; return cul === 'wa' && female ? P(L, r) + '子' : r() < 0.3 ? P(L, r) : P(L, r) + P(L, r); }
    const lg = LGIVEN[cul];
    if (lg) return P(lg[female ? 1 : 0], r);
    // 其他东方文明：音译式
    return base(cul, 'city', r).replace(/(城|帐|王庭|牙帐|堡|川|港|埠|补罗|巴德|京|津|宫)$/, '').slice(0, 3);
  };
  const SURN = sp('刘 李 王 张 陈 赵 杨 司马 诸葛 慕容 宇文 崔 卢 郑 谢 萧 裴 韦 杜 薛 柳 高 曹 孙 周 吴 袁 独孤 长孙 上官 欧阳 公孙');
  N.familyBase = (cul, r = Math.random) => {
    if (cul === 'huaxia') return P(SURN, r);
    if (App.Names.groups.latin.includes(cul)) return base(cul, 'city', r).replace(/^Al-/, '');
    return base(cul, 'city', r).replace(/(城|帐|王庭|牙帐|堡|川|港|埠|补罗|巴德|京|津|宫)$/, '').slice(0, 2);
  };
  N.familyName = (cul, b) => (App.Names.groups.latin.includes(cul) ? 'House ' + b : b + '氏');
  N.fullName = (cul, surname, given) => (App.Names.groups.latin.includes(cul) ? given + ' ' + surname : surname + given);
  N.TRAITS = sp('勇敢 怯懦 暴怒 冷静 仁慈 残忍 贪婪 慷慨 多疑 轻信 野心勃勃 知足 勤奋 懒惰 虔诚 愤世嫉俗 聪慧 愚钝 美貌 丑陋 强壮 体弱 好色 贞洁 狡诈 诚实 口拙 雄辩 傲慢 谦逊 公正 专断 果决 优柔寡断 善战 好学');
  N.POSITIONS = sp('无 家主 皇帝 国王 太子 宰相 丞相 大将军 将军 都护 刺史 太守 尚书 学士 祭司 商人');
  N.RELIGIONS = sp('儒教 道教 佛教 祆教 景教 摩尼教 萨满 神道 印度教 伊斯兰教 天主教 东正教 古希腊多神教');
})();

