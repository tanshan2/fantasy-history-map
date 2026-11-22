// ===== 外文名 → 中文：政体词意译 + 常见词尾约定译法 + 其余按音节音译（参照新华社译名习惯） =====
(() => {
  const TR = (App.Translit = {});
  // 政体 / 行政级别（意译）
  const FORMS = [
    [/^Kingdom of (.+)$/, '$1王国'], [/^High Kingdom of (.+)$/, '$1至高王国'], [/^(.+) Empire$/, '$1帝国'], [/^Imperium (.+)$/, '$1帝国'], [/^Regnum (.+)$/, '$1王国'],
    [/^Res Publica (.+)$/, '$1共和国'], [/^(.+) Republic$/, '$1共和国'], [/^Grand Duchy of (.+)$/, '$1大公国'], [/^Duchy of (.+)$/, '$1公国'], [/^(.+) Confederation$/, '$1邦联'],
    [/^Electorate of (.+)$/, '$1选侯国'], [/^Tsardom of (.+)$/, '$1沙皇国'], [/^Principality of (.+)$/, '$1公国'], [/^(.+) Rus$/, '$1罗斯'], [/^(.+) Jarldom$/, '$1雅尔领'], [/^Jarldom of (.+)$/, '$1雅尔领'],
    [/^(.+) Realm$/, '$1王国'], [/^(.+) League$/, '$1同盟'], [/^(.+) Basileia$/, '$1王国'], [/^(.+) Tribal Alliance$/, '$1部落联盟'], [/^(.+) Clans$/, '$1诸氏族'], [/^Clan (.+)$/, '$1氏族'],
    [/^(.+) Caliphate$/, '$1哈里发国'], [/^Sultanate of (.+)$/, '$1苏丹国'], [/^Emirate of (.+)$/, '$1埃米尔国'], [/^(.+) Imamate$/, '$1伊玛目国'], [/^(.+) Commonwealth$/, '$1联邦'],
    [/^(.+) Thing$/, '$1议会'], [/^(.+) Satrapy$/, '$1总督区'], [/^Provincia (.+)$/, '$1行省'], [/^Dioecesis (.+)$/, '$1管区'], [/^Praefectura (.+)$/, '$1大区'], [/^Theme of (.+)$/, '$1军区'],
    [/^Tourma of (.+)$/, '$1图尔马'], [/^Droungos of (.+)$/, '$1德隆戈斯'], [/^March of (.+)$/, '$1边区'], [/^County of (.+)$/, '$1伯国'], [/^Margraviate of (.+)$/, '$1边疆伯国'], [/^Earldom of (.+)$/, '$1伯爵领'], [/^(.+) County$/, '$1郡'], [/^Barony of (.+)$/, '$1男爵领'],
    [/^Earldom of (.+)$/, '$1伯爵领'], [/^Shire of (.+)$/, '$1郡'], [/^(.+)shire$/, '$1郡'], [/^(.+) Hundred$/, '$1百户区'], [/^(.+) Oblast$/, '$1州'], [/^Voivodeship of (.+)$/, '$1省'],
    [/^(.+) Governorate$/, '$1省'], [/^(.+) Uyezd$/, '$1县'], [/^(.+) Volost$/, '$1乡'], [/^Wilayat (.+)$/, '$1省'], [/^Kura (.+)$/, '$1区'], [/^Rustaq (.+)$/, '$1乡'],
    [/^Eyalet of (.+)$/, '$1行省'], [/^Sanjak of (.+)$/, '$1桑贾克'], [/^Kaza of (.+)$/, '$1卡扎'], [/^House (.+)$/, '$1家族'],
  ];
  // 常见词尾的约定译法（按长度优先匹配）
  const SUF = Object.entries({
    burg: '堡', heim: '海姆', stadt: '施塔特', dorf: '多夫', berg: '贝格', feld: '费尔德', hausen: '豪森', ingen: '英根', mark: '马克', wald: '瓦尔德', enau: '瑙', ach: '阿赫', au: '奥',
    grad: '格勒', ograd: '格勒', insk: '因斯克', sk: '斯克', ovo: '沃', ov: '夫', ava: '瓦', ets: '涅茨', nik: '尼克', ice: '采', oslav: '斯拉夫', omir: '米尔',
    opolis: '波利斯', polis: '波利斯', ikon: '伊孔', eia: '伊亚', ene: '尼', ion: '翁', one: '奥内', ara: '阿拉',
    ium: '伊乌姆', ensis: '恩西斯', anum: '阿努姆', entum: '恩图姆', inum: '伊努姆', ilia: '利亚', eria: '里亚', aca: '卡', ica: '卡', ona: '纳',
    ford: '福德', ton: '顿', ham: '汉姆', field: '菲尔德', bury: '伯里', wick: '威克', chester: '切斯特', ley: '利', mouth: '茅斯', stead: '斯特德',
    vik: '维克', gard: '加德', fjord: '菲奥德', stad: '斯塔德', holm: '霍尔姆', sund: '松德', ness: '内斯', land: '兰', dal: '达尔', by: '比',
    more: '莫尔', dale: '代尔', wen: '文', ock: '奥克', avon: '埃文', ross: '罗斯', lyn: '林', iel: '伊尔',
    abad: '阿巴德', iya: '耶', rat: '拉特',
    furt: '富特', bruck: '布吕克', bach: '巴赫', stein: '施泰因', hafen: '哈芬', munde: '明德', strand: '施特兰德', hain: '海因',
    bridge: '布里奇', hill: '希尔', crag: '克拉格', fell: '费尔', haven: '黑文', port: '波特', wood: '伍德', hurst: '赫斯特',
    brod: '布罗德', gorsk: '戈尔斯克', gora: '戈拉', morsk: '莫尔斯克', lesk: '列斯克', les: '列斯', pol: '波尔',
    os: '奥斯', fjell: '菲耶尔', havn: '哈文', skog: '斯科格', lund: '隆德', ben: '本',
  }).sort((a, b) => b[0].length - a[0].length);
  // 音节表：声母 → [a, e, i, o, u, 单辅音]
  const SYL = {
    '': ['阿', '埃', '伊', '奥', '乌', ''], b: ['巴', '贝', '比', '博', '布', '布'], p: ['帕', '佩', '皮', '波', '普', '普'], m: ['马', '梅', '米', '莫', '穆', '姆'],
    f: ['法', '费', '菲', '福', '富', '夫'], v: ['瓦', '韦', '维', '沃', '武', '夫'], w: ['瓦', '韦', '维', '沃', '伍', '夫'], d: ['达', '德', '迪', '多', '杜', '德'],
    t: ['塔', '特', '蒂', '托', '图', '特'], n: ['纳', '内', '尼', '诺', '努', '恩'], l: ['拉', '莱', '利', '洛', '卢', '尔'], g: ['加', '格', '吉', '戈', '古', '格'],
    k: ['卡', '克', '基', '科', '库', '克'], h: ['哈', '赫', '希', '霍', '胡', '赫'], j: ['贾', '杰', '吉', '乔', '朱', '日'], ch: ['查', '切', '奇', '乔', '丘', '希'],
    sh: ['沙', '谢', '希', '肖', '舒', '什'], z: ['扎', '泽', '齐', '佐', '祖', '兹'], ts: ['察', '采', '齐', '措', '楚', '茨'], s: ['萨', '塞', '西', '索', '苏', '斯'],
    r: ['拉', '雷', '里', '罗', '鲁', '尔'], y: ['亚', '耶', '伊', '约', '尤', '伊'], kh: ['哈', '赫', '希', '霍', '胡', '赫'], zh: ['扎', '热', '日', '若', '朱', '日'],
  };
  // 带 -n 的音节
  const NAS = {
    '': ['安', '恩', '因', '翁', '温'], b: ['班', '本', '宾', '邦', '本'], p: ['潘', '彭', '平', '蓬', '蓬'], m: ['曼', '门', '明', '蒙', '蒙'], f: ['凡', '芬', '芬', '丰', '丰'],
    v: ['万', '文', '温', '冯', '文'], w: ['万', '文', '温', '翁', '文'], d: ['丹', '登', '丁', '东', '敦'], t: ['坦', '滕', '廷', '通', '通'], n: ['南', '嫩', '宁', '农', '农'],
    l: ['兰', '伦', '林', '隆', '伦'], g: ['甘', '根', '金', '贡', '贡'], k: ['坎', '肯', '金', '孔', '昆'], h: ['汉', '亨', '欣', '洪', '洪'], j: ['詹', '真', '金', '琼', '君'],
    ch: ['钱', '琴', '钦', '琼', '春'], sh: ['尚', '申', '欣', '雄', '顺'], z: ['赞', '曾', '津', '宗', '尊'], ts: ['灿', '岑', '钦', '聪', '村'], s: ['桑', '森', '辛', '松', '孙'],
    r: ['兰', '伦', '林', '龙', '伦'], y: ['扬', '延', '因', '永', '云'], kh: ['汉', '亨', '欣', '洪', '洪'], zh: ['让', '任', '金', '容', '君'],
  };
  const VI = { a: 0, e: 1, i: 2, o: 3, u: 4 };
  const norm = (w) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/rh/g, 'r').replace(/([bdfgkmnprstv])j/g, '$1y').replace(/([bdfgklmnprstvz])y(?=[aeiou])/g, '$1i')
    .replace(/sch/g, 'ʃ').replace(/sh/g, 'ʃ').replace(/zh/g, 'ʒ').replace(/kh/g, 'χ').replace(/ch/g, 'ç').replace(/th/g, 't').replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/qu/g, 'kv')
    .replace(/q/g, 'k').replace(/x/g, 'ks').replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k').replace(/tz/g, 'ʦ').replace(/ts/g, 'ʦ')
    .replace(/(ai|ay|ei|ey)/g, 'e').replace(/au/g, 'o').replace(/(ou|oo)/g, 'u').replace(/(ee|ie|ea)/g, 'i').replace(/y(?![aeiou])/g, 'i')
    .replace(/([bdfgklmnprstvz])\1/g, '$1');
  const ON = { 'ʃ': 'sh', 'ʒ': 'zh', 'χ': 'kh', 'ç': 'ch', 'ʦ': 'ts' };
  const isV = (ch) => 'aeiou'.includes(ch);
  // 一个词干的音节音译
  const syll = (w, joined = false) => {
    const s = norm(w); let out = '', i = 0;
    while (i < s.length) {
      let on = '';
      while (i < s.length && !isV(s[i])) { on += s[i]; i++; }
      if (i >= s.length) { for (const ch of on) { const k = ON[ch] || ch; out += (SYL[k] || SYL[''])[5]; } break; }
      // 声母簇：前面的辅音单独成音，最后一个与元音拼
      const cons = [...on].map((ch) => ON[ch] || ch);
      const head = cons.length ? cons[cons.length - 1] : '';
      cons.slice(0, -1).forEach((k, ci) => { if (k === 'n' && out && /[安恩因翁温]$/.test(out)) return; const nx = cons[ci + 1]; out += (k === 'f' || k === 'v') && (nx === 'r' || nx === 'l') ? '弗' : (SYL[k] || SYL[''])[5]; });
      const v = s[i]; i++;
      const row = SYL[head] ? head : '';
      // 后面是 n 且 n 后不是元音 → 鼻音韵
      if ((s[i] === 'n' && (i + 1 >= s.length || !isV(s[i + 1]))) || (s[i] === 'm' && ((i + 1 < s.length && !isV(s[i + 1]) && s[i + 1] !== 'm') || (joined && i + 1 >= s.length)))) { out += NAS[row][VI[v]]; i++; continue; }
      // 后面是 r/l 且之后不是元音 → 加“尔”
      out += SYL[row][VI[v]];
      if ((s[i] === 'r' || s[i] === 'l') && (i + 1 >= s.length || !isV(s[i + 1]))) { out += '尔'; i++; }
      // 连续元音：后一个单独成音（i 后面的 a 读“亚”）
      while (i < s.length && isV(s[i])) { const v2 = s[i]; out += v2 === 'a' && (v === 'i' || v === 'e') ? '亚' : SYL[''][VI[v2]]; i++; }
    }
    return out;
  };
  // 单个外文词 → 中文
  TR.word = (w) => {
    if (!w) return w;
    if (/^Al-/i.test(w)) return '阿尔' + TR.word(w.slice(3));
    const lw = w.toLowerCase();
    for (const [suf, zh] of SUF) {
      if (!(lw.length > suf.length + 1 && lw.endsWith(suf))) continue;
      const stem = w.slice(0, w.length - suf.length);
      if (isV(suf[0]) && !isV(norm(stem).slice(-1))) continue; // 辅音结尾的词干 + 元音开头的词尾：整词连读
      return syll(stem, true) + zh;
    }
    return syll(w);
  };
  const isLatin = (s) => /[A-Za-z]/.test(s) && !/[一-鿿]/.test(s);
  // 完整名称：先匹配政体格式，再逐词音译
  TR.name = (s, person = false) => {
    if (!s || !isLatin(s)) return s;
    for (const [re, tpl] of FORMS) { const m = s.match(re); if (m) return tpl.replace('$1', TR.name(m[1], person)); }
    const words = s.split(/\s+/).filter(Boolean);
    return words.map(TR.word).join(person ? '·' : '');
  };
  TR.isLatin = isLatin;

  // ---- 让西方文明的所有命名直接输出中文 ----
  const N = App.Names, latin = N.groups.latin, orig = N.gen, origGiven = N.given, origFB = N.familyBase;
  N.genRaw = orig;
  N.gen = (cul, kind, r) => { const s = orig(cul, kind, r); return latin.includes(cul) ? TR.name(s) : s; };
  N.given = (cul, female, r) => { const s = origGiven(cul, female, r); return latin.includes(cul) ? TR.name(s) : s; };
  N.familyBase = (cul, r) => { const s = origFB(cul, r); return latin.includes(cul) ? TR.name(s) : s; };
  N.familyName = (cul, b) => (latin.includes(cul) ? b + '家族' : b + '氏');
  N.fullName = (cul, sur, given) => (latin.includes(cul) ? given + '·' + sur : sur + given);

  // ---- 已有地图：把外文名一次性翻成中文 ----
  TR.migrate = (S) => {
    let k = 0; const f = (o, key, person) => { if (o && isLatin(o[key] || '')) { o[key] = TR.name(o[key], person); k++; } };
    S.nations.forEach((n) => f(n, 'name')); S.provinces.forEach((p) => { f(p, 'name'); if (p.base && isLatin(p.base)) p.base = TR.name(p.base); });
    S.cities.forEach((c) => f(c, 'name')); S.armies.forEach((a) => f(a, 'name')); S.markers.forEach((m) => f(m, 'name'));
    (S.families || []).forEach((fm) => { f(fm, 'name'); if (isLatin(fm.base || '')) fm.base = TR.name(fm.base); });
    (S.people || []).forEach((p) => { f(p, 'name', true); if (isLatin(p.sur || '')) p.sur = TR.name(p.sur); });
    return k;
  };
})();
