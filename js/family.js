// ===== 家族系统：家族、成员、族谱、人物 =====
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const F = (App.Family = { fid: 0, pid: 0, open: {} });
  const S = () => App.S;
  const esc = U.esc;
  const year = () => S().meta.year || 1;
  const age = (p) => (p.death ? p.death : year()) - (p.birth ?? year());
  const isLatin = (cul) => App.Names.groups.latin.includes(cul);
  const ri = (r, a, b) => Math.floor(a + r() * (b - a + 1));
  const members = (fid) => S().people.filter((p) => p.family === fid);
  const children = (p) => S().people.filter((q) => q.father === p.id || q.mother === p.id);
  const RELS = ['同盟', '友好', '中立', '猜忌', '敌对', '宿敌', '姻亲', '附庸', '宗主'];

  // ---------- 生成 ----------
  const mkPerson = (fam, gender, birth, r, extra = {}) => {
    const cul = extra.culture || fam.culture;
    const given = App.Names.given(cul, gender === 'f', r);
    const sur = extra.surname || fam.base;
    const p = {
      id: App.nid(), family: fam.id, gender, birth, death: null, father: 0, mother: 0, spouse: 0, inlaw: false,
      name: App.Names.fullName(cul, sur, given), position: '无', nation: fam.nation || 0, culture: cul, religion: fam.religion,
      stats: { cha: ri(r, 5, 95), mil: ri(r, 5, 95), dip: ri(r, 5, 95), adm: ri(r, 5, 95) }, traits: [], notes: '', ...extra,
    };
    const tr = App.Names.TRAITS.slice().sort(() => r() - 0.5).slice(0, ri(r, 1, 3)); p.traits = tr;
    delete p.surname; p.sur = sur;
    S().people.push(p); return p;
  };
  const outsiderSurname = (cul, r) => App.Names.familyBase(cul, r);
  const marry = (fam, p, r) => {
    const g = p.gender === 'm' ? 'f' : 'm';
    const sp = mkPerson(fam, g, p.birth + ri(r, -6, 8), r, { surname: outsiderSurname(fam.culture, r), inlaw: true });
    p.spouse = sp.id; sp.spouse = p.id; return sp;
  };
  F.createFamily = (o = {}, r = Math.random) => {
    const st = S(), cul = o.culture || 'huaxia';
    const b = o.base || App.Names.familyBase(cul, r);
    const fam = {
      id: App.nid(), base: b, name: o.name || App.Names.familyName(cul, b), culture: cul, religion: o.religion || (isLatin(cul) ? '天主教' : cul === 'huaxia' ? '儒教' : cul === 'wa' ? '神道' : cul === 'tianzhu' ? '印度教' : cul === 'persia' ? '祆教' : '萨满'),
      color: o.color || App.PALETTE[ri(r, 0, App.PALETTE.length - 1)], nation: o.nation || 0, home: o.home || 0,
      founded: o.founded ?? year() - ri(r, 20, 200), influence: ri(r, 30, 200), merit: ri(r, 0, 160), conquered: ri(r, 0, 6),
      patriarch: 0, relations: [], history: '',
    };
    st.families.push(fam);
    if (o.empty) return fam;
    // 三代
    const pa = mkPerson(fam, 'm', year() - ri(r, 42, 62), r, { position: '家主' });
    fam.patriarch = pa.id; marry(fam, pa, r);
    const wife = F.get(pa.spouse);
    const nk = ri(r, 2, 4);
    for (let i = 0; i < nk; i++) {
      const ch = mkPerson(fam, r() < 0.55 ? 'm' : 'f', pa.birth + ri(r, 18, 30) + i * 2, r, { father: pa.id, mother: wife.id });
      if (age(ch) > 17 && r() < 0.8) {
        const sp = marry(fam, ch, r);
        if (age(ch) > 22 && r() < 0.7) {
          const ng = ri(r, 1, 2);
          for (let k = 0; k < ng; k++) {
            const by = Math.max(ch.birth, sp.birth) + ri(r, 18, 28) + k * 2; if (by > year()) break;
            const isM = ch.gender === 'm';
            mkPerson(fam, r() < 0.5 ? 'm' : 'f', by, r, { father: isM ? ch.id : sp.id, mother: isM ? sp.id : ch.id, ...(isM ? {} : { surname: sp.sur }) });
          }
        }
      }
    }
    return fam;
  };
  F.get = (id) => S().people.find((p) => p.id === id);
  F.fam = (id) => S().families.find((f) => f.id === id);

  // ---------- 族谱布局 ----------
  const NW = 132, NH = 46, GX = 14, GY = 58;
  const layout = (fam) => {
    const mem = members(fam.id), set = new Set(mem.map((p) => p.id));
    const isChild = (p) => (p.father && set.has(p.father)) || (p.mother && set.has(p.mother));
    let roots = mem.filter((p) => !p.inlaw && !isChild(p));
    if (!roots.length) roots = mem.filter((p) => !isChild(p) && !(p.spouse && set.has(p.spouse) && !F.get(p.spouse).inlaw && p.inlaw));
    const nodes = [], links = [], seen = new Set();
    const kids = (p) => mem.filter((q) => (q.father === p.id || q.mother === p.id || (p.spouse && (q.father === p.spouse || q.mother === p.spouse))) && !seen.has(q.id)).sort((a, b) => a.birth - b.birth);
    const width = (p) => {
      seen.add(p.id); const sp = p.spouse && set.has(p.spouse) ? F.get(p.spouse) : null; if (sp) seen.add(sp.id);
      const ks = kids(p); ks.forEach((k) => seen.add(k.id));
      p._ks = ks; p._sp = sp;
      const self = sp ? NW * 2 + GX : NW;
      const kw = ks.reduce((a, k) => a + width(k) + GX, -GX);
      p._w = Math.max(self, kw); return p._w;
    };
    const place = (p, x, y) => {
      const self = p._sp ? NW * 2 + GX : NW, sx = x + (p._w - self) / 2;
      nodes.push({ p, x: sx, y }); if (p._sp) nodes.push({ p: p._sp, x: sx + NW + GX, y });
      const mid = p._sp ? sx + NW + GX / 2 : sx + NW / 2;
      let kx = x + (p._w - p._ks.reduce((a, k) => a + k._w + GX, -GX)) / 2;
      p._ks.forEach((k) => {
        const kself = k._sp ? NW * 2 + GX : NW, kcx = kx + (k._w - kself) / 2 + NW / 2;
        links.push([mid, y + NH / (p._sp ? 2 : 1), kcx, y + NH + GY]);
        place(k, kx, y + NH + GY); kx += k._w + GX;
      });
    };
    let x = 0; const tops = [];
    roots.forEach((r0) => { if (seen.has(r0.id)) return; width(r0); tops.push([r0, x]); x += r0._w + GX * 3; });
    tops.forEach(([r0, x0]) => place(r0, x0, 0));
    mem.filter((p) => !seen.has(p.id)).forEach((p) => { nodes.push({ p, x, y: 0 }); x += NW + GX; });
    const w = Math.max(...nodes.map((n) => n.x + NW), 0), h = Math.max(...nodes.map((n) => n.y + NH), 0);
    return { nodes, links, w, h };
  };

  // ---------- 界面 ----------
  F.show = () => {
    const st = S();
    if (!F.fid || !F.fam(F.fid)) F.fid = st.families[0]?.id || 0;
    let m = $('#famModal');
    if (!m) { m = document.createElement('div'); m.id = 'famModal'; document.body.appendChild(m); bindOnce(m); }
    m.hidden = false; F.render();
  };
  F.hide = () => { const m = $('#famModal'); if (m) m.hidden = true; App.autosave(); App.R.request(); };

  const sec = (key, title, body, def = true) => {
    const open = F.open[key] ?? def;
    return `<div class="fsec"><div class="fsec-h" data-tog="${key}"><b>${title}</b><span>${open ? '▴' : '▾'}</span></div>${open ? `<div class="fsec-b">${body}</div>` : ''}</div>`;
  };
  const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`;
  const inp = (key, v, type = 'text', extra = '') => `<input type="${type}" data-f="${key}" value="${esc(v ?? '')}" ${extra}>`;
  const pinp = (key, v, type = 'text', extra = '') => `<input type="${type}" data-p="${key}" value="${esc(v ?? '')}" ${extra}>`;
  const opts = (arr, v) => arr.map((a) => (typeof a === 'string' ? `<option ${a === v ? 'selected' : ''}>${esc(a)}</option>` : `<option value="${a.id}" ${a.id === v ? 'selected' : ''}>${esc(a.name)}</option>`)).join('');

  F.render = () => {
    const m = $('#famModal'); if (!m || m.hidden) return;
    const st = S(), fam = F.fam(F.fid), sc = m.querySelector('.ftree-wrap')?.scrollLeft;
    const relList = fam ? (fam.relations || []).map((r, i) => `<div class="rel"><select data-rel="${i}" data-k="fam">${opts(st.families.filter((f) => f.id !== fam.id), r.fam)}</select><select data-rel="${i}" data-k="type">${opts(RELS, r.type)}</select><button class="x" data-relx="${i}">×</button></div>`).join('') : '';
    const pat = fam && F.get(fam.patriarch);
    const left = fam ? `
      <div class="fhead">${inp('name', fam.name)}</div><div class="fbar" style="background:${fam.color}"></div>
      ${sec('ov', '概况', `
        <label>宗教</label>${inp('religion', fam.religion, 'text', 'list="relList"')}
        <label>文化</label><select data-f="culture">${opts(App.CULTURES, fam.culture)}</select>
        <label>所属国家</label><select data-f="nation" data-num="1"><option value="0">—</option>${opts(st.nations, fam.nation)}</select>
        <label>居城</label><select data-f="home" data-num="1"><option value="0">—</option>${opts(st.cities.slice().sort((a, b) => (a.name > b.name ? 1 : -1)), fam.home)}</select>
        <div class="grid2"><div><label>家族颜色</label>${inp('color', fam.color, 'color')}</div><div><label>建立年份</label>${inp('founded', fam.founded, 'number')}</div></div>
        ${kv('家族存续', (year() - fam.founded) + ' 年')}
        ${kv('家主', pat ? esc(pat.name) : '—')}
        <div class="grid2"><div><label>影响力</label>${inp('influence', fam.influence, 'number')}</div><div><label>战功</label>${inp('merit', fam.merit, 'number')}</div></div>
        <label>征服省份</label>${inp('conquered', fam.conquered, 'number')}`)}
      ${sec('act', '家族操作', `<button class="fbtn pink" data-act="rebel">发动叛乱（记入历史）</button><button class="fbtn blue" data-act="addRoot">添加始祖成员</button><button class="fbtn" data-act="delFam">删除家族</button>`)}
      ${sec('mem', '成员（' + members(fam.id).length + '）', members(fam.id).sort((a, b) => a.birth - b.birth).map((p) => `<div class="mrow ${p.id === F.pid ? 'on' : ''}" data-pick="${p.id}"><i class="${p.gender}"></i>${esc(p.name)}<small>${p.death ? '卒' : age(p) + '岁'}</small></div>`).join(''), false)}
      ${sec('rel', '关系', relList + '<button class="fbtn" data-act="addRel">＋ 添加关系</button>', false)}
      ${sec('his', '历史', `<textarea data-f="history" rows="6" placeholder="记录家族大事…">${esc(fam.history || '')}</textarea>`, false)}
    ` : '<p class="muted">还没有家族。点「新建家族」或「随机生成」。</p>';

    const list = st.families.map((f) => `<div class="fcard ${f.id === F.fid ? 'on' : ''}" data-fam="${f.id}" style="--c:${f.color}"><b>${esc(f.name)}</b><small>${year() - f.founded}年 · ${members(f.id).length}人</small></div>`).join('');

    let tree = '', mlist = '';
    if (fam) {
      const L = layout(fam), pad = 30;
      const svg = `<svg width="${L.w + pad * 2}" height="${L.h + pad * 2}" class="flinks">${L.links.map(([x1, y1, x2, y2]) => { const my = y2 - GY / 2; return `<path d="M${x1 + pad} ${y1 + pad} V${my + pad} H${x2 + pad} V${y2 + pad}"/>`; }).join('')}${L.nodes.filter((n) => n.p.spouse && L.nodes.some((k) => k.p.id === n.p.spouse && k.x > n.x && k.y === n.y)).map((n) => `<path d="M${n.x + NW + pad} ${n.y + NH / 2 + pad} h${GX}"/>`).join('')}</svg>`;
      tree = `<div class="ftree" style="width:${L.w + pad * 2}px;height:${L.h + pad * 2}px">${svg}${L.nodes.map((n) => `<div class="fnode ${n.p.gender} ${n.p.id === F.pid ? 'on' : ''} ${n.p.death ? 'dead' : ''}" data-pick="${n.p.id}" style="left:${n.x + pad}px;top:${n.y + pad}px"><b>${esc(n.p.name)}</b><span>${n.p.death ? '卒年' + n.p.death : age(n.p) + '岁'}${n.p.id === fam.patriarch ? ' · 家主' : n.p.position && n.p.position !== '无' ? ' · ' + esc(n.p.position) : ''}</span></div>`).join('')}</div>`;
      const couples = members(fam.id).filter((p) => !p.inlaw && p.spouse);
      mlist = couples.map((p) => { const sp = F.get(p.spouse); const kc = children(p).length + (sp ? children(sp).filter((k) => k.father !== p.id && k.mother !== p.id).length : 0); return `<div class="couple" data-pick="${p.id}">${p.id === fam.patriarch ? '[主家]<br>' : ''}${esc(p.name)} &amp; ${esc(sp ? sp.name : '?')}${kc ? '' : '<br><small>无子女</small>'}</div>`; }).join('');
    }

    const p = F.get(F.pid);
    let right = '<p class="muted">点击族谱中的人物查看与编辑。</p>';
    if (p && p.family === F.fid) {
      const fa = F.get(p.father), mo = F.get(p.mother), sp = F.get(p.spouse), ks = children(p);
      const stat = (k, n) => `<div class="stat"><span>${n}</span><input type="range" min="0" max="100" data-stat="${k}" value="${p.stats[k]}"><b>${p.stats[k]}</b></div>`;
      right = `<div class="fhead">${pinp('name', p.name)}</div>
        ${sec('pb', '基本', `
          <div class="grid2"><div><label>性别</label><select data-p="gender">${opts([{ id: 'm', name: '男' }, { id: 'f', name: '女' }], p.gender)}</select></div><div><label>出生年</label>${pinp('birth', p.birth, 'number')}</div></div>
          <div class="grid2"><div><label>卒年（空=在世）</label>${pinp('death', p.death || '', 'number')}</div><div><label>年龄</label><div class="ro">${age(p)} 岁</div></div></div>
          <label>效忠国家</label><select data-p="nation" data-num="1"><option value="0">—</option>${opts(S().nations, p.nation)}</select>
          <div class="grid2"><div><label>文化</label><select data-p="culture">${opts(App.CULTURES, p.culture)}</select></div><div><label>宗教</label>${pinp('religion', p.religion, 'text', 'list="relList"')}</div></div>
          <label>官职/身份</label>${pinp('position', p.position, 'text', 'list="posList"')}
          ${kv('能力合计', p.stats.cha + p.stats.mil + p.stats.dip + p.stats.adm)}`)}
        ${sec('pa', '属性', stat('cha', '魅力') + stat('mil', '军事') + stat('dip', '外交') + stat('adm', '治理') + '<button class="fbtn" data-act="rndStats">🎲 随机属性</button>')}
        ${sec('pt', '特质', `<select data-act="addTrait"><option value="">＋ 选择特质</option>${App.Names.TRAITS.filter((t) => !p.traits.includes(t)).map((t) => `<option>${t}</option>`).join('')}</select><div class="traits">${p.traits.map((t, i) => `<span class="trait">${esc(t)}<button data-trx="${i}">×</button></span>`).join('')}</div>`)}
        ${sec('pf', '亲属', `${kv('父亲', fa ? `<a data-pick="${fa.id}">${esc(fa.name)}</a>` : '—')}${kv('母亲', mo ? `<a data-pick="${mo.id}">${esc(mo.name)}</a>` : '—')}${kv('配偶', sp ? `<a data-pick="${sp.id}">${esc(sp.name)}</a>` : '—')}${kv('子女', ks.length ? ks.map((k) => `<a data-pick="${k.id}">${esc(k.name)}</a>`).join('、') : '—')}
          <div class="btnrow"><button class="fbtn blue" data-act="addChild">＋ 子女</button>${sp ? '' : '<button class="fbtn pink" data-act="addSpouse">＋ 配偶</button>'}<button class="fbtn" data-act="setHead">设为家主</button><button class="fbtn danger" data-act="delPerson">删除</button></div>`)}
        ${sec('pn', '传记', `<textarea data-p="notes" rows="4" placeholder="生平事迹…">${esc(p.notes || '')}</textarea>`, false)}`;
    }

    m.innerHTML = `<datalist id="relList">${App.Names.RELIGIONS.map((x) => `<option>${x}</option>`).join('')}</datalist><datalist id="posList">${App.Names.POSITIONS.map((x) => `<option>${x}</option>`).join('')}</datalist>
      <div class="fcol fleft"><h2>家族</h2><div class="fscroll">${left}</div><button class="fclose" data-act="close">关闭</button></div>
      <div class="fcol fmid"><div class="fmid-h"><span>家族列表</span><h2>族谱</h2><label class="yr">当前年份 <input type="number" data-year value="${year()}"></label></div>
        <div class="fmid-b"><div class="flist"><div class="fnew"><select data-act="newCul">${opts(App.CULTURES, F.newCul || 'huaxia')}</select><button class="fbtn blue" data-act="newFam">＋ 新建家族</button><button class="fbtn" data-act="rndFam">🎲 随机生成</button></div>${list}</div>
        <div class="ftree-wrap">${tree}</div><div class="fmembers"><h4>家庭</h4>${mlist}</div></div>
        <button class="fclose" data-act="close">关闭</button></div>
      <div class="fcol fright"><h2>人物</h2><div class="fscroll">${right}</div><button class="fclose" data-act="close">关闭</button></div>`;
    if (sc) m.querySelector('.ftree-wrap').scrollLeft = sc;
  };

  // ---------- 事件 ----------
  const bindOnce = (m) => {
    let snap = false;
    const undo = () => { if (!snap) { App.pushUndo(); snap = true; setTimeout(() => (snap = false), 800); } };
    m.addEventListener('click', (e) => {
      const undo = () => App.pushUndo();
      const t = e.target, st = S(), fam = F.fam(F.fid), p = F.get(F.pid);
      const tog = t.closest('[data-tog]'); if (tog) { const k = tog.dataset.tog; F.open[k] = !(F.open[k] ?? !['mem', 'rel', 'his', 'pn'].includes(k)); F.render(); return; }
      const fc = t.closest('[data-fam]'); if (fc) { F.fid = +fc.dataset.fam; F.pid = F.fam(F.fid)?.patriarch || 0; F.render(); return; }
      const pk = t.closest('[data-pick]'); if (pk) { F.pid = +pk.dataset.pick; F.render(); return; }
      if (t.dataset.trx != null) { undo(); p.traits.splice(+t.dataset.trx, 1); F.render(); return; }
      if (t.dataset.relx != null) { undo(); fam.relations.splice(+t.dataset.relx, 1); F.render(); return; }
      const a = t.dataset.act; if (!a || t.tagName === 'SELECT') return;
      const r = Math.random;
      switch (a) {
        case 'close': F.hide(); return;
        case 'newFam': { undo(); const f = F.createFamily({ culture: F.newCul || 'huaxia', empty: true }); const pa = mkPerson(f, 'm', year() - 45, r, { position: '家主' }); f.patriarch = pa.id; F.fid = f.id; F.pid = pa.id; break; }
        case 'rndFam': { undo(); const cul = F.newCul || App.CULTURES[ri(r, 0, App.CULTURES.length - 1)].id; const f = F.createFamily({ culture: cul }); F.fid = f.id; F.pid = f.patriarch; break; }
        case 'delFam': if (!confirm(`删除「${fam.name}」及全部成员？（可撤销）`)) return; undo(); st.people = st.people.filter((q) => q.family !== fam.id); st.families = st.families.filter((f) => f.id !== fam.id); F.fid = st.families[0]?.id || 0; F.pid = 0; break;
        case 'rebel': undo(); fam.history = (fam.history ? fam.history + '\n' : '') + `${year()}年：${fam.name}举兵叛乱。`; fam.merit += 10; F.open.his = true; break;
        case 'addRoot': { undo(); const q = mkPerson(fam, 'm', year() - 40, r); F.pid = q.id; break; }
        case 'addRel': undo(); fam.relations = fam.relations || []; fam.relations.push({ fam: st.families.find((f) => f.id !== fam.id)?.id || 0, type: '中立' }); break;
        case 'rndStats': undo(); ['cha', 'mil', 'dip', 'adm'].forEach((k) => (p.stats[k] = ri(r, 5, 95))); break;
        case 'addChild': {
          undo(); const sp = F.get(p.spouse), isM = p.gender === 'm';
          const k = mkPerson(fam, r() < 0.5 ? 'm' : 'f', Math.min(year(), Math.max(p.birth, sp?.birth || p.birth) + ri(r, 18, 30)), r, { father: isM ? p.id : sp?.id || 0, mother: isM ? sp?.id || 0 : p.id });
          if (p.inlaw && sp) { k.name = App.Names.fullName(fam.culture, fam.base, App.Names.given(fam.culture, k.gender === 'f', r)); }
          F.pid = k.id; break;
        }
        case 'addSpouse': undo(); F.pid = marry(fam, p, r).id; break;
        case 'setHead': { undo(); const old = F.get(fam.patriarch); if (old && old.position === '家主') old.position = '无'; fam.patriarch = p.id; if (!p.position || p.position === '无') p.position = '家主'; break; }
        case 'delPerson': {
          if (!confirm(`删除「${p.name}」？`)) return; undo();
          st.people.forEach((q) => { if (q.spouse === p.id) q.spouse = 0; if (q.father === p.id) q.father = 0; if (q.mother === p.id) q.mother = 0; });
          st.people = st.people.filter((q) => q.id !== p.id); if (fam.patriarch === p.id) fam.patriarch = 0; F.pid = 0; break;
        }
      }
      F.render(); App.autosave(); App.R.request();
    });
    const onInput = (e, commit) => {
      const t = e.target, fam = F.fam(F.fid), p = F.get(F.pid);
      if (t.dataset.year != null) { if (commit) { undo(); S().meta.year = +t.value || 1; F.render(); } return; }
      if (t.dataset.act === 'newCul') { F.newCul = t.value; return; }
      if (t.dataset.act === 'addTrait' && commit) { if (t.value) { undo(); p.traits.push(t.value); F.render(); } return; }
      if (t.dataset.rel != null && commit) { undo(); const rr = fam.relations[+t.dataset.rel]; rr[t.dataset.k] = t.dataset.k === 'fam' ? +t.value : t.value; return; }
      if (t.dataset.stat) { undo(); p.stats[t.dataset.stat] = +t.value; t.nextElementSibling.textContent = t.value; if (commit) F.render(); return; }
      const fk = t.dataset.f, pk = t.dataset.p;
      if (fk && fam) { undo(); let v = t.value; if (t.type === 'number' || t.dataset.num) v = +v; fam[fk] = v; if (fk === 'color' || fk === 'name') { const card = document.querySelector(`.fcard[data-fam="${fam.id}"]`); if (card) { card.style.setProperty('--c', fam.color); card.querySelector('b').textContent = fam.name; } document.querySelector('.fbar').style.background = fam.color; } if (commit) F.render(); App.R.request(); }
      if (pk && p) { undo(); let v = t.value; if (pk === 'birth' || pk === 'nation') v = +v; if (pk === 'death') v = v ? +v : null; p[pk] = v; if (commit && pk !== 'notes') F.render(); }
      App.autosave();
    };
    m.addEventListener('input', (e) => onInput(e, false));
    m.addEventListener('change', (e) => onInput(e, true));
  };
})();
