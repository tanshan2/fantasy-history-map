// ===== 国力排名、国家档案（背景板）、国体与分封设置 =====
(() => {
  const UI = App.UI, P = App.Polity, esc = U.esc;
  const T = () => App.Tools;
  const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`;
  const opt = (v, cur, label) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(label)}</option>`;
  const cultName = (id) => App.CULTURES.find((c) => c.id === id)?.name || '';
  const CT = { capital: '首都', large: '大城', medium: '中城', small: '小城', village: '村镇', fortress: '要塞', port: '港口', pass: '关隘' };

  // ---------- 国体 / 分封 / 宗主 选择控件（国家页与档案共用） ----------
  UI.polityFields = (n) => {
    const r = P.rankOf(n), t = P.title(n), S = App.S;
    const isSub = (id) => { let k = App.nation(id), g = 0; while (k && g++ < 50) { if (k.overlord === n.id) return true; k = App.nation(k.overlord); } return false; };
    let h = `<div class="field"><label>国体 / 爵位</label><select data-pol="rank">${App.RANKS.map((k) => opt(k.id, r.id, k.name + (k.id !== 'fief' ? ' · ' + k.ruler + ' · ' + k.cat : ''))).join('')}</select></div>`;
    if (r.id === 'fief') {
      const sys = App.FIEF_SYS[n.fiefSys || 'zhou'] || App.FIEF_SYS.zhou;
      h += `<div class="field"><label>分封制度</label><select data-pol="fiefSys">${Object.entries(App.FIEF_SYS).map(([k, s]) => opt(k, n.fiefSys || 'zhou', s.name)).join('')}</select></div>
        <div class="field"><label>封号等级</label><select data-pol="fiefTitle">${sys.tiers.map((k) => opt(k.id, t.tier.id, k.name + '（' + k.ruler + '）')).join('')}</select></div>
        <p class="muted">${esc(sys.note)}</p>`;
    } else if (r.note) h += `<p class="muted">${esc(r.note)}</p>`;
    h += `<div class="field"><label>宗主国${r.id === 'fief' ? '（封国须有宗主）' : '（附庸时选择）'}</label><select data-pol="overlord"><option value="0">— 独立 —</option>${S.nations.filter((k) => k.id !== n.id && !isSub(k.id)).map((k) => opt(k.id, n.overlord || 0, k.name || '（未命名）')).join('')}</select></div>
      <div class="field"><label>建国年份</label><input type="number" data-pol="founded" value="${P.founded(n)}"></div>
      <div class="row wrap"><button class="btn small" data-pol-act="rename" title="保留国名主体，换成「${esc(t.suf)}」等称号">按国体改名</button></div>`;
    return h;
  };
  // 绑定上面的控件；after() 在改动后刷新所在界面
  UI.bindPolityFields = (root, n, after) => {
    root.querySelectorAll('[data-pol]').forEach((el) => (el.onchange = () => {
      App.pushUndo(); const k = el.dataset.pol;
      if (k === 'founded') n.founded = Math.round(+el.value || 0);
      else if (k === 'overlord') n.overlord = +el.value || 0;
      else if (k === 'fiefSys') { n.fiefSys = el.value; n.fiefTitle = App.FIEF_SYS[el.value].tiers[0].id; }
      else n[k] = el.value;
      if (k === 'rank' && el.value === 'fief' && !n.fiefSys) n.fiefSys = n.culture === 'wa' ? 'edo' : 'zhou';
      if (k === 'overlord' && n.overlord && P.rankOf(n).id === 'fief') { /* 宗室封国的家族沿用宗主姓氏：在重新生成统治家族时体现 */ }
      // 称号变化时，现任统治家族的头衔随之更新
      if (['rank', 'fiefSys', 'fiefTitle'].includes(k)) { const f = P.dynasty(n); if (f) { f.house = P.title(n).house; P.crown(n, f); } }
      App.changed({ pol: k === 'overlord', ui: true }); after && after();
    }));
    root.querySelectorAll('[data-pol-act=rename]').forEach((b) => (b.onclick = () => { App.pushUndo(); P.renameByRank(n); App.changed({ ui: true }); UI.refreshTool && UI.refreshTool(); after && after(); }));
  };

  // ---------- 国力排名 ----------
  UI.rankOpt = UI.rankOpt || { sort: 'power', vassals: true };
  UI.powerDialog = () => {
    const o = UI.rankOpt, list = P.ranking(o), w = P.WEIGHTS;
    const bar = (v, col) => `<div class="pbar"><i style="width:${Math.max(2, v).toFixed(1)}%;background:${col}"></i></div>`;
    const rows = list.map((s) => {
      const n = s.n, t = P.title(n), ov = P.overlord(n), q = s.area ? Math.round((s.good / s.area) * 100) : 0;
      return `<tr data-prof="${n.id}"><td class="pl">${s.place <= 3 ? ['🥇', '🥈', '🥉'][s.place - 1] : s.place}</td>
        <td><i class="sw" style="background:${n.color}"></i><b>${esc(n.name) || '（未命名）'}</b>${ov ? `<small>　${esc(ov.name)}之${esc(t.name)}</small>` : ''}</td>
        <td>${esc(t.name)}</td><td>${P.areaStr(s.area)}</td><td>${P.areaStr(s.good)}<small>（${q}%）</small></td>
        <td>${s.cities.length} 座<small>（${s.cityPts.toFixed(0)} 分）</small></td><td>${s.troops ? P.troopStr(s.troops) : '—'}</td>
        <td class="pw">${bar(s.power, n.color)}<b>${s.power.toFixed(1)}</b></td></tr>`;
    }).join('');
    UI.modal(`<h3>国力排名</h3>
      <div class="row wrap">排序：${[['power', '综合国力'], ['good', '有效领土'], ['area', '总面积'], ['city', '城市'], ['mil', '军力']].map(([k, l]) => `<button class="chip ${o.sort === k ? 'on' : ''}" data-sort="${k}">${l}</button>`).join('')}
        <label class="inline" style="margin-left:12px"><input type="checkbox" data-vas ${o.vassals ? 'checked' : ''}> 附庸按一半计入宗主</label></div>
      <p class="muted">综合国力 ＝ 有效领土 ${w.good * 100}% ＋ 城市 ${w.city * 100}% ＋ 军力 ${w.mil * 100}%（各项以第一名为 100 换算）。<br>
      有效领土＝每块土地按「地貌 × 气候 × 森林」折算：平原 1、丘陵 0.6、草原 0.55、山地 0.18、沙漠 0.05；温带季风、亚热带湿润 1，沙漠气候 0.08，苔原 0.05；沿河 ×1.4、沿海 ×1.1。括号里是良田率。<br>
      城市按规模计分：首都 10、大城 6、港口 4、中城 3、要塞 2、小城 1.5、关隘 1.2、村镇 0.6。军力＝兵力 × 兵种系数（重骑兵 1.8、战象 2.2、禁军 1.5、骑兵 1.4、民兵 0.5…）。</p>
      ${list.length ? `<div class="ptable"><table><thead><tr><th>名次</th><th>国家</th><th>国体</th><th>总面积</th><th>有效领土</th><th>城市</th><th>兵力</th><th>国力</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted">点一行打开该国档案（可直接修改）。</p>` : '<p class="muted">还没有拥有领土的国家。</p>'}
      <div class="row end"><button class="btn" data-dyn-all>为所有国家生成统治家族</button><button class="btn" data-army-all>为没有军队的国家生成军队</button><button class="btn pri" data-close>关闭</button></div>`, (m) => {
      m.querySelector('.dlg').classList.add('wide');
      m.querySelectorAll('[data-sort]').forEach((b) => (b.onclick = () => { o.sort = b.dataset.sort; UI.powerDialog(); }));
      const v = m.querySelector('[data-vas]'); if (v) v.onchange = () => { o.vassals = v.checked; UI.powerDialog(); };
      m.querySelectorAll('[data-prof]').forEach((tr) => (tr.onclick = () => UI.profile(+tr.dataset.prof)));
      m.querySelector('[data-dyn-all]').onclick = () => { App.pushUndo(); const k = P.ensureAllDynasties(); App.changed({ ui: true }); UI.toast(k ? `已为 ${k} 个国家生成统治家族` : '所有国家都已有统治家族'); UI.powerDialog(); };
      m.querySelector('[data-army-all]').onclick = () => { App.pushUndo(); let k = 0; App.S.nations.forEach((n) => { if (!App.S.armies.some((a) => a.nation === n.id) && P.genArmies(n).length) k++; }); App.changed({ ui: true }); UI.toast(k ? `已为 ${k} 个国家生成军队` : '所有国家都已有军队'); UI.powerDialog(); };
    });
  };

  // ---------- 国家档案（背景板，全部可编辑） ----------
  UI.profOpen = UI.profOpen || {};
  const armyOpts = (cur) => ['步兵', '骑兵', '其他'].map((g) => `<optgroup label="${g}">${App.ARMY_TYPES.filter((a) => a.g === g).map((a) => opt(a.id, cur, a.name)).join('')}</optgroup>`).join('');
  const cityOpts = (cur) => App.CITY_TYPES.map((c) => opt(c.id, cur, c.name)).join('');
  const ORDC = ["capital", "large", "port", "medium", "fortress", "pass", "small", "village"];
  const lvCn = ['', '一', '二', '三'];
  UI.profile = (nid, keepScroll) => {
    const n = App.nation(nid); if (!n) { UI.toast('先选择一个国家（点地图上的领土或列表）'); return; }
    const S = App.S, all = P.ranking({ sort: 'power', vassals: true }), st = all.find((s) => s.n.id === n.id) || P.allStats().get(n.id);
    const t = P.title(n), ov = P.overlord(n), vas = P.vassals(n), fam = P.dynasty(n), F = App.Family, yr = S.meta.year || 1;
    const pa = fam && F.get(fam.patriarch), sp = pa && F.get(pa.spouse);
    const heir = fam && S.people.find((q) => q.family === fam.id && q.position === t.heir && !q.death);
    const cap = P.capital(n, st), comps = App.Geo.nationComps(n.id), sys = App.sysOf(n);
    const provs = S.provinces.filter((p) => p.nation === n.id), kids = (id) => provs.filter((p) => p.parent === id);
    const l1 = provs.filter((p) => (p.level || 1) === 1);
    const age = (p) => (p.death || yr) - p.birth;
    const fams = S.families.filter((f) => f.nation === n.id);
    const q = st.area ? Math.round((st.good / st.area) * 100) : 0;
    const terr = Object.entries(st.terr || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => (App.TERRAINS.find((x) => x.id === +k)?.name || k) + ' ' + Math.round((v / st.area) * 100) + '%').join('、');
    const E = (kind, id, key, v, type = 'text', extra = '') => `<input type="${type}" data-e="${kind}:${id}:${key}" value="${esc(v ?? '')}" ${extra}>`;
    const provRow = (p) => {
      const ks = kids(p.id), open = UI.profOpen[p.id];
      return `<div class="erow lv${p.level || 1}">${ks.length ? `<button class="x tog" data-ptog="${p.id}">${open ? '▾' : '▸'}</button>` : '<span class="x"></span>'}
        ${E('prov', p.id, 'name', p.name)}<small>${ks.length ? ks.length + ' 个' + esc(App.levelName(n, (p.level || 1) + 1)) : ''}</small>
        <button class="x" data-prnd="${p.id}" title="随机改名">🎲</button>${(p.level || 1) < sys.levels ? `<button class="x" data-padd="${p.id}" title="下设${esc(App.levelName(n, (p.level || 1) + 1))}">＋</button>` : ''}<button class="x" data-ppaint="${p.id}" title="到地图上涂这个区">✎</button><button class="x del" data-pdel="${p.id}" title="删除（含下级）">×</button></div>
        ${open ? `<div class="esub">${ks.map(provRow).join('')}</div>` : ''}`;
    };
    const left = `
      <div class="pcard"><h4>基础信息</h4>
        <div class="egrid">
          <label>国名</label><div class="row">${E('n', n.id, 'name', n.name)}<button class="btn small" data-nrnd title="按文明随机">🎲</button></div>
          <label>颜色</label><div class="row">${E('n', n.id, 'color', n.color, 'color')}</div>
          <label>文明</label><select data-e="n:${n.id}:culture">${App.CULTURES.map((c) => opt(c.id, n.culture, c.name)).join('')}</select>
          <label>首都</label><select data-cap><option value="0">— 无 —</option>${st.cities.map((c) => opt(c.id, cap && cap.type === 'capital' ? cap.id : 0, c.name + '（' + (CT[c.type] || c.type) + '）')).join('')}</select>
          <label>国教</label>${fam ? E('fam', fam.id, 'religion', fam.religion, 'text', 'list="relListP"') : '<span class="muted">先生成统治家族</span>'}
        </div>
        <datalist id="relListP">${App.Names.RELIGIONS.map((r) => `<option>${esc(r)}</option>`).join('')}</datalist>
        ${kv('总面积', `${P.areaStr(st.area)}<small>（${st.cells} 格${comps.length > 1 ? ' · ' + (comps.length - 1) + ' 块飞地' : ''}）</small>`)}
        ${kv('有效领土', `${P.areaStr(st.good)}<small>（良田率 ${q}%${st.river ? ' · 沿河 ' + P.areaStr(st.river) : ''}）</small>`)}
        ${terr ? kv('地貌', `<small>${terr}</small>`) : ''}
        ${kv('国力', st.power != null ? `第 ${st.place} 名 · ${st.power.toFixed(1)} 分<small>（土地 ${st.gScore.toFixed(0)} · 城市 ${st.cScore.toFixed(0)} · 军力 ${st.mScore.toFixed(0)}）</small>` : '—')}
      </div>
      <div class="pcard"><h4>行政区划</h4>
        <div class="field"><label>制度</label><select data-sys>${UI.sysOptions(n)}</select></div>
        <p class="muted">${[1, 2, 3].slice(0, sys.levels).map((lv) => `${lvCn[lv]}级${esc(App.levelName(n, lv))} ${st.prov[lv]} 个`).join(' · ')}</p>
        <div class="elist">${l1.length ? l1.map(provRow).join('') : '<p class="muted">还没有行政区。</p>'}</div>
        <div class="row wrap"><button class="btn small" data-padd="0">＋ 新增${esc(App.levelName(n, 1))}</button>
          <label class="inline">分成 <input type="number" min="1" max="40" data-pk style="width:52px" placeholder="自动"> 个</label><button class="btn small" data-pauto>重新划分全部</button><button class="btn small" data-psub>保留${esc(App.levelName(n, 1))}，只细分下级</button></div>
      </div>
      <div class="pcard"><h4>城市 · ${st.cities.length} 座</h4>
        <div class="elist">${st.cities.slice().sort((a, b) => ORDC.indexOf(a.type) - ORDC.indexOf(b.type)).map((c) => `<div class="erow">${E('city', c.id, 'name', c.name)}<select data-e="city:${c.id}:type" data-re>${cityOpts(c.type)}</select><button class="x" data-cgo="${c.id}" title="在地图上定位">⌖</button><button class="x del" data-cdel="${c.id}">×</button></div>`).join('') || '<p class="muted">还没有城市。</p>'}</div>
        <div class="row wrap"><button class="btn small" data-cgen="add">按地理补充城市</button><button class="btn small" data-cgen="replace">重新生成本国城市</button></div>
        <p class="muted">城市数量看可用土地（平原、河谷、沿海多；沙漠、山地、冻土少），大小看城址周围的丰饶度。游牧、部落国家城市少。</p>
      </div>`;
    const right = `
      <div class="pcard"><h4>统治家族 · ${esc(t.house || t.cat)}</h4>
        ${fam ? `<div class="egrid">
          <label>家族</label><div class="row">${E('fam', fam.id, 'name', fam.name)}<button class="btn small" data-fam-open>族谱</button></div>
          <label>${esc(t.ruler)}</label><div class="row">${pa ? E('person', pa.id, 'name', pa.name) + E('person', pa.id, 'birth', pa.birth, 'number', 'title="出生年" style="width:76px;flex:none"') + `<small>${age(pa)}岁</small>` : '—'}</div>
          <label>${esc(t.consort)}</label><div class="row">${sp ? E('person', sp.id, 'name', sp.name) : '—'}</div>
          <label>${esc(t.heir)}</label><select data-heir><option value="0">— 未定 —</option>${S.people.filter((q2) => q2.family === fam.id && !q2.death && (!pa || q2.id !== pa.id) && !q2.inlaw).map((q2) => opt(q2.id, heir ? heir.id : 0, q2.name + '（' + age(q2) + '岁）')).join('')}</select>
          <label>家族建立</label>${E('fam', fam.id, 'founded', fam.founded, 'number')}
        </div>` : '<p class="muted">还没有统治家族。</p>'}
        <div class="row wrap">
          ${fams.length > 1 || (fams.length && !fam) ? `<select data-pick-dyn><option value="0">— 指定本国已有家族 —</option>${fams.map((f) => opt(f.id, fam ? fam.id : 0, f.name)).join('')}</select>` : ''}
          <button class="btn small pri" data-dyn>${fam ? '重新生成统治家族' : '生成统治家族'}</button></div>
      </div>
      <div class="pcard"><h4>军队 · ${st.troops ? P.troopStr(st.troops) : '无'}</h4>
        ${st.troops ? `<p class="muted">步兵 ${P.troopStr(st.inf)} · 骑兵 ${P.troopStr(st.cav)} · 其他 ${P.troopStr(st.other)}</p>` : ''}
        <div class="elist">${st.armies.map((a) => `<div class="erow">${E('army', a.id, 'name', a.name, 'text', 'placeholder="部队名"')}<select data-e="army:${a.id}:type" data-re>${armyOpts(a.type)}</select>${E('army', a.id, 'strength', a.strength, 'text', 'placeholder="兵力" style="width:64px;flex:none"')}<button class="x" data-ago="${a.id}" title="在地图上定位">⌖</button><button class="x del" data-adel="${a.id}">×</button></div>`).join('') || '<p class="muted">还没有部队。</p>'}</div>
        <div class="row wrap"><button class="btn small" data-aadd>＋ 新建部队</button><button class="btn small" data-agen="add">按国力生成军队</button><button class="btn small" data-agen="replace">重新生成全部军队</button></div>
        <p class="muted">兵力可写「3万」「8000」「1.5万」。新部队放在首都附近，可在地图上拖动。生成时兵力按有效领土和城市估算，兵种按文明（草原多骑射、天竺有战象、沿海有水军…）。</p>
      </div>
      <div class="pcard"><h4>宗藩关系</h4>
        ${kv('宗主', ov ? `<a data-goto="${ov.id}">${esc(ov.name)}</a>` : '独立')}
        ${kv('附庸 / 封国', vas.length ? vas.map((v) => `<a data-goto="${v.id}">${esc(v.name)}</a><small>（${esc(P.title(v).name)}）</small>`).join('、') : '无')}
        ${vas.length ? `<div class="row wrap"><button class="btn small" data-vcol>封国配色随宗主</button></div>` : ''}
      </div>
      <div class="pcard"><h4>国体与分封</h4>${UI.polityFields(n)}</div>
      <div class="pcard"><h4>国家背景</h4><textarea data-lore rows="6" placeholder="建国经过、重大事件、国策……">${esc(n.lore || '')}</textarea>
        <div class="row wrap"><button class="btn small" data-lore-gen>🎲 随机生成背景</button></div></div>`;
    const prevScroll = keepScroll ? document.querySelector('#modal .dlg')?.scrollTop || 0 : 0;
    UI.modal(`<div class="phead" style="--c:${n.color}"><i></i><div><h3>${esc(n.name) || '（未命名）'}</h3><small>${esc(t.name)}${ov ? ' · ' + esc(ov.name) + '之' + (t.rank.id === 'fief' ? '封国' : '附庸') : ''}${pa ? ' · ' + esc(t.ruler) + ' ' + esc(pa.name) : ''}</small></div></div>
      <div class="pgrid"><div>${left}</div><div>${right}</div></div>
      <div class="row end"><button class="btn" data-hl>在地图上高亮</button><button class="btn" data-rank>国力排名</button><button class="btn pri" data-close>关闭</button></div>`, (m) => {
      const dlg = m.querySelector('.dlg'); dlg.classList.add('wide', 'prof'); dlg.scrollTop = prevScroll;
      const again = () => UI.profile(n.id, true);
      const done = (what = {}) => { App.changed({ ui: true, ...what }); UI.refreshTool && UI.refreshTool(); again(); };
      const zoomTo = (x, y) => { m.hidden = true; App.R.zoomToBox([x - 110, y - 80, x + 110, y + 80], 1); };
      UI.bindPolityFields(m, n, again);
      // 通用字段：data-e="类型:id:字段"
      const getObj = (kind, id) => kind === 'n' ? n : kind === 'prov' ? App.province(id) : kind === 'city' ? S.cities.find((c) => c.id === id) : kind === 'army' ? S.armies.find((a) => a.id === id) : kind === 'fam' ? F.fam(id) : kind === 'person' ? F.get(id) : null;
      m.querySelectorAll('[data-e]').forEach((el) => {
        const [kind, id, key] = el.dataset.e.split(':'), o = getObj(kind, +id); if (!o) return;
        el.onfocus = () => App.pushUndo();
        el.oninput = () => { if (el.tagName === 'SELECT') return; o[key] = el.type === 'number' ? Math.round(+el.value || 0) : el.value; if (kind === 'n' && key === 'color') App.Geo.dirtyPol = true; App.R.request(); };
        el.onchange = () => {
          if (el.tagName === 'SELECT') { App.pushUndo(); o[key] = el.value; }
          if (kind === 'n' && key === 'culture' && fam) { /* 文明改变不影响已有家族 */ }
          if (el.dataset.re !== undefined || kind === 'n' || (kind === 'person' && key === 'birth')) done({ pol: kind === 'n' && key === 'color' }); else { App.changed({ ui: true }); UI.refreshTool && UI.refreshTool(); }
        };
      });
      m.querySelector('[data-nrnd]').onclick = () => { App.pushUndo(); n.name = App.Names.nation(n.culture); P.renameByRank(n); done(); };
      m.querySelector('[data-cap]').onchange = (e) => { App.pushUndo(); st.cities.forEach((c) => { if (c.type === 'capital') c.type = 'large'; }); const c = S.cities.find((k) => k.id === +e.target.value); if (c) { c.type = 'capital'; if (fam) fam.home = c.id; } done(); };
      // 行政区
      m.querySelector('[data-sys]').onchange = (e) => { const ns = App.ADMIN_SYS[e.target.value]; if (provs.length && !confirm('切换为「' + ns.name + '」？\n已有行政区会保留地名、改成新的级别名称' + (ns.levels < 3 ? '，并删除第三级' : '') + '。')) { again(); return; } App.pushUndo(['prov', 'prov2', 'prov3']); App.Ops.setAdminSys(n, e.target.value); done({ pol: true }); };
      m.querySelectorAll('[data-ptog]').forEach((b) => (b.onclick = () => { UI.profOpen[b.dataset.ptog] = !UI.profOpen[b.dataset.ptog]; again(); }));
      m.querySelectorAll('[data-prnd]').forEach((b) => (b.onclick = () => { const p = App.province(+b.dataset.prnd); App.pushUndo(); Object.assign(p, App.Names.provFor(n, p.level || 1)); done(); }));
      m.querySelectorAll('[data-pdel]').forEach((b) => (b.onclick = () => { const p = App.province(+b.dataset.pdel); if (kids(p.id).length && !confirm(`删除「${p.name}」及其全部下级？`)) return; App.pushUndo(['prov', 'prov2', 'prov3']); App.Ops.deleteProvince(p.id); done({ pol: true }); }));
      m.querySelectorAll('[data-padd]').forEach((b) => (b.onclick = () => { const par = App.province(+b.dataset.padd); App.pushUndo(); const p = App.Ops.addProvince(n.id, null, par ? (par.level || 1) + 1 : 1, par ? par.id : 0); if (par) UI.profOpen[par.id] = true; T().activeNation = n.id; T().activeProv = p.id; UI.toast(`已新增「${p.name}」，点 ✎ 到地图上涂出它的范围`); done(); }));
      m.querySelectorAll('[data-ppaint]').forEach((b) => (b.onclick = () => { m.hidden = true; T().activeNation = n.id; T().activeProv = +b.dataset.ppaint; T().set('prov'); UI.refresh(); UI.refreshTool(); UI.toast('用行政区画笔在地图上涂色，完成后按 I 回到国家档案'); }));
      m.querySelector('[data-pauto]').onclick = () => { const k = +m.querySelector('[data-pk]').value || 0; App.pushUndo(['prov', 'prov2', 'prov3']); App.Ops.autoProvinces(n.id, k); done({ pol: true }); };
      m.querySelector('[data-psub]').onclick = () => { App.pushUndo(['prov', 'prov2', 'prov3']); App.Ops.autoProvinces(n.id, 0, Math.random, { keepL1: true }); done({ pol: true }); };
      // 城市
      m.querySelectorAll('[data-cdel]').forEach((b) => (b.onclick = () => { App.pushUndo(); S.cities = S.cities.filter((c) => c.id !== +b.dataset.cdel); done(); }));
      m.querySelectorAll('[data-cgo]').forEach((b) => (b.onclick = () => { const c = S.cities.find((k) => k.id === +b.dataset.cgo); T().set('select'); T().select({ kind: 'cities', id: c.id }); zoomTo(c.x, c.y); }));
      m.querySelectorAll('[data-cgen]').forEach((b) => (b.onclick = () => { const rep = b.dataset.cgen === 'replace'; if (rep && st.cities.length && !confirm(`删除「${n.name}」现有的 ${st.cities.length} 座城市，按地理重新生成？（可撤销）`)) return; App.pushUndo(); const out = P.genCities(n.id, Math.random, { replace: rep }); UI.toast(out.length ? `新增 ${out.length} 座城市` : '可用土地有限，没有合适的新城址'); done(); }));
      // 军队
      m.querySelectorAll('[data-adel]').forEach((b) => (b.onclick = () => { App.pushUndo(); S.armies = S.armies.filter((a) => a.id !== +b.dataset.adel); done(); }));
      m.querySelectorAll('[data-ago]').forEach((b) => (b.onclick = () => { const a = S.armies.find((k) => k.id === +b.dataset.ago); T().set('select'); T().select({ kind: 'armies', id: a.id }); zoomTo(a.x, a.y); }));
      m.querySelector('[data-aadd]').onclick = () => { App.pushUndo(); const [x, y] = P.armySpot(n, S.armies.filter((a) => a.nation === n.id).length); S.armies.push({ id: App.nid(), x, y, nation: n.id, type: 'infantry', strength: '1万', name: '' }); done(); };
      m.querySelectorAll('[data-agen]').forEach((b) => (b.onclick = () => { const rep = b.dataset.agen === 'replace'; if (rep && st.armies.length && !confirm(`删除「${n.name}」现有的 ${st.armies.length} 支部队，重新生成？（可撤销）`)) return; App.pushUndo(); const out = P.genArmies(n, { replace: rep }); UI.toast(`生成 ${out.length} 支部队，共 ${P.troopStr(out.reduce((s2, a) => s2 + P.troops(a.strength), 0))}`); done(); }));
      // 家族
      m.querySelectorAll('[data-fam-open]').forEach((a) => (a.onclick = () => { m.hidden = true; App.Family.fid = fam.id; App.Family.show(); }));
      m.querySelector('[data-dyn]').onclick = () => {
        if (fam && !confirm(`重新生成「${n.name}」的统治家族？\n原来的「${fam.name}」会保留，但不再是统治家族。`)) return;
        App.pushUndo(); if (fam) fam.ruling = 0; P.makeDynasty(n); done();
      };
      const hs = m.querySelector('[data-heir]'); if (hs) hs.onchange = () => { App.pushUndo(); S.people.forEach((q2) => { if (q2.family === fam.id && q2.position === t.heir) q2.position = '无'; }); const h = F.get(+hs.value); if (h) h.position = t.heir; done(); };
      const pd = m.querySelector('[data-pick-dyn]'); if (pd) pd.onchange = () => { const f = F.fam(+pd.value); if (!f) return; App.pushUndo(); if (fam) fam.ruling = 0; n.dynasty = f.id; f.ruling = n.id; f.house = t.house; P.crown(n, f); done(); };
      const vc = m.querySelector('[data-vcol]'); if (vc) vc.onclick = () => { App.pushUndo(); vas.forEach((v, i) => (v.color = U.shade(n.color, (i % 2 ? -0.18 : 0.22) + (i / vas.length) * 0.1))); done({ pol: true }); };
      m.querySelectorAll('[data-goto]').forEach((a) => (a.onclick = () => UI.profile(+a.dataset.goto)));
      const lt = m.querySelector('[data-lore]'); lt.onfocus = () => App.pushUndo(); lt.oninput = () => { n.lore = lt.value; App.autosave(); };
      m.querySelector('[data-lore-gen]').onclick = () => { App.pushUndo(); n.lore = P.genLore(n); App.autosave(); again(); };
      m.querySelector('[data-hl]').onclick = () => { m.hidden = true; T().highlight(n.id); const c = App.Geo.nationComps(n.id); if (c.length) App.R.zoomToBox(c.reduce((a, q2) => [Math.min(a[0], q2.box[0]), Math.min(a[1], q2.box[1]), Math.max(a[2], q2.box[2]), Math.max(a[3], q2.box[3])], [1e9, 1e9, -1e9, -1e9])); };
      m.querySelector('[data-rank]').onclick = UI.powerDialog;
    });
  };
  // 当前国家：高亮的 > 正在编辑的
  UI.profileCurrent = () => UI.profile(T().hl || T().activeNation || (App.S.nations[0] && App.S.nations[0].id));
})();
