// ===== 国力排名、国家档案（背景板）、国体与分封设置 =====
(() => {
  const UI = App.UI, P = App.Polity, esc = U.esc;
  const T = () => App.Tools;
  const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`;
  const opt = (v, cur, label) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(label)}</option>`;
  const cultName = (id) => App.CULTURES.find((c) => c.id === id)?.name || '';
  const CT = { capital: '首都', large: '大城', medium: '中城', small: '小城', town: '村镇', fortress: '要塞', port: '港口', pass: '关隘' };

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
    const o = UI.rankOpt, list = P.ranking(o);
    const bar = (v, col) => `<div class="pbar"><i style="width:${Math.max(2, v).toFixed(1)}%;background:${col}"></i></div>`;
    const rows = list.map((s) => {
      const n = s.n, t = P.title(n), ov = P.overlord(n);
      return `<tr data-prof="${n.id}"><td class="pl">${s.place <= 3 ? ['🥇', '🥈', '🥉'][s.place - 1] : s.place}</td>
        <td><i class="sw" style="background:${n.color}"></i><b>${esc(n.name) || '（未命名）'}</b>${ov ? `<small>　${esc(ov.name)}之${esc(t.name)}</small>` : ''}</td>
        <td>${esc(t.name)}</td><td>${P.areaStr(s.area)}${o.vassals && s.eArea > s.area + 1 ? '<small>（含附庸）</small>' : ''}</td><td>${s.troops ? P.troopStr(s.troops) : '—'}</td>
        <td class="pw">${bar(s.power, n.color)}<b>${s.power.toFixed(1)}</b></td></tr>`;
    }).join('');
    UI.modal(`<h3>国力排名</h3>
      <div class="row wrap">排序：${[['power', '综合国力'], ['area', '领土'], ['mil', '军力']].map(([k, l]) => `<button class="chip ${o.sort === k ? 'on' : ''}" data-sort="${k}">${l}</button>`).join('')}
        <label class="inline" style="margin-left:12px"><input type="checkbox" data-vas ${o.vassals ? 'checked' : ''}> 附庸按一半计入宗主</label></div>
      <p class="muted">综合国力 ＝ 领土 65% ＋ 军力 35%（都以第一名为 100 换算）。军力按兵力 × 兵种系数计算：重骑兵 1.8、战象 2.2、禁军 1.5、骑兵 1.4、民兵 0.5 等；没填兵力的部队按 5000 人算。</p>
      ${list.length ? `<div class="ptable"><table><thead><tr><th>名次</th><th>国家</th><th>国体</th><th>领土</th><th>兵力</th><th>国力</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted">点一行查看该国档案。</p>` : '<p class="muted">还没有拥有领土的国家。</p>'}
      <div class="row end"><button class="btn" data-dyn-all>为所有国家生成统治家族</button><button class="btn pri" data-close>关闭</button></div>`, (m) => {
      m.querySelector('.dlg').classList.add('wide');
      m.querySelectorAll('[data-sort]').forEach((b) => (b.onclick = () => { o.sort = b.dataset.sort; UI.powerDialog(); }));
      const v = m.querySelector('[data-vas]'); if (v) v.onchange = () => { o.vassals = v.checked; UI.powerDialog(); };
      m.querySelectorAll('[data-prof]').forEach((tr) => (tr.onclick = () => UI.profile(+tr.dataset.prof)));
      m.querySelector('[data-dyn-all]').onclick = () => { App.pushUndo(); const k = P.ensureAllDynasties(); App.changed({ ui: true }); UI.toast(k ? `已为 ${k} 个国家生成统治家族` : '所有国家都已有统治家族'); UI.powerDialog(); };
    });
  };

  // ---------- 国家档案（背景板） ----------
  UI.profile = (nid) => {
    const n = App.nation(nid); if (!n) { UI.toast('先选择一个国家（点地图上的领土或列表）'); return; }
    const all = P.ranking({ sort: 'power', vassals: true }), st = all.find((s) => s.n.id === n.id) || P.allStats().get(n.id);
    const t = P.title(n), ov = P.overlord(n), vas = P.vassals(n), fam = P.dynasty(n), F = App.Family, yr = App.S.meta.year || 1;
    const pa = fam && F.get(fam.patriarch), heir = fam && App.S.people.find((q) => q.family === fam.id && q.position === t.heir && !q.death);
    const cap = P.capital(n, st), comps = App.Geo.nationComps(n.id), sys = App.sysOf(n);
    const l1 = App.S.provinces.filter((p) => p.nation === n.id && (p.level || 1) === 1);
    const cityCount = {}; st.cities.forEach((c) => (cityCount[c.type] = (cityCount[c.type] || 0) + 1));
    const age = (p) => (p.death || yr) - p.birth;
    const lore = n.lore != null ? n.lore : '';
    const fams = App.S.families.filter((f) => f.nation === n.id);
    const left = `
      <div class="pcard"><h4>基础信息</h4>
        ${kv('国体', `${esc(t.name)}<small>（${esc(t.cat)}）</small>`)}
        ${kv('君主称号', esc(t.ruler))}
        ${kv('文明', esc(cultName(n.culture)))}
        ${kv('建国', P.yearStr(P.founded(n)) + `<small>（国祚 ${yr - P.founded(n)} 年）</small>`)}
        ${kv('首都', cap ? esc(cap.name) : '—')}
        ${kv('国教', fam ? esc(fam.religion) : '—')}
        ${kv('领土', `${P.areaStr(st.area)}<small>（${st.cells} 格${comps.length > 1 ? ' · ' + (comps.length - 1) + ' 块飞地' : ''}）</small>`)}
        ${kv('国力', st.power != null ? `第 ${st.place} 名 · ${st.power.toFixed(1)} 分` : '—')}
      </div>
      <div class="pcard"><h4>行政区划</h4>
        ${kv('制度', esc(sys.name))}
        ${[1, 2, 3].slice(0, sys.levels).map((lv) => kv(`${lv === 1 ? '一' : lv === 2 ? '二' : '三'}级（${esc(App.levelName(n, lv))}）`, st.prov[lv] + ' 个')).join('')}
        ${l1.length ? `<div class="tags">${l1.slice(0, 40).map((p) => `<span>${esc(p.name)}</span>`).join('')}${l1.length > 40 ? `<span>…</span>` : ''}</div>` : '<p class="muted">还没有划分行政区（在「国家」页一键划分）。</p>'}
        ${kv('城市', st.cities.length + ' 座' + (st.cities.length ? '<small>（' + Object.entries(cityCount).map(([k, v]) => (CT[k] || k) + ' ' + v).join('、') + '）</small>' : ''))}
      </div>
      <div class="pcard"><h4>军队</h4>
        ${kv('总兵力', st.troops ? P.troopStr(st.troops) : '—')}
        ${st.troops ? kv('构成', `步兵 ${P.troopStr(st.inf)} · 骑兵 ${P.troopStr(st.cav)} · 其他 ${P.troopStr(st.other)}`) : ''}
        ${st.armies.length ? `<div class="alist">${st.armies.map((a) => `<div><span>${esc(a.name || '（无名部队）')}</span><span>${esc(App.ARMY_TYPES.find((k) => k.id === a.type)?.name || a.type)} · ${esc(a.strength || '5000')}</span></div>`).join('')}</div>` : '<p class="muted">还没有部队。用左侧「军队」工具（快捷键 J）放置。</p>'}
      </div>`;
    const right = `
      <div class="pcard"><h4>统治家族 · ${esc(t.house || t.cat)}</h4>
        ${fam ? `${kv('家族', `<a data-fam="${fam.id}">${esc(fam.name)}</a>`)}${kv('家族建立', P.yearStr(fam.founded))}
          ${kv('在位君主', pa ? `${esc(t.ruler)} ${esc(pa.name)}<small>（${age(pa)} 岁）</small>` : '—')}
          ${kv('配偶', pa && F.get(pa.spouse) ? esc(F.get(pa.spouse).name) : '—')}
          ${kv('继承人', heir ? `${esc(heir.name)}<small>（${esc(t.heir)} · ${age(heir)} 岁）</small>` : '未定')}
          ${kv('家族成员', App.S.people.filter((q) => q.family === fam.id).length + ' 人')}`
          : '<p class="muted">还没有统治家族。</p>'}
        <div class="row wrap">
          ${fams.length > 1 || (fams.length && !fam) ? `<select data-pick-dyn><option value="0">— 指定本国已有家族 —</option>${fams.map((f) => opt(f.id, fam ? fam.id : 0, f.name)).join('')}</select>` : ''}
          <button class="btn small pri" data-dyn>${fam ? '重新生成统治家族' : '生成统治家族'}</button>${fam ? '<button class="btn small" data-fam-open>打开族谱</button>' : ''}</div>
      </div>
      <div class="pcard"><h4>宗藩关系</h4>
        ${kv('宗主', ov ? `<a data-goto="${ov.id}">${esc(ov.name)}</a>` : '独立')}
        ${kv('附庸 / 封国', vas.length ? vas.map((v) => `<a data-goto="${v.id}">${esc(v.name)}</a><small>（${esc(P.title(v).name)}）</small>`).join('、') : '无')}
        ${vas.length ? `<div class="row wrap"><button class="btn small" data-vcol>封国配色随宗主</button></div>` : ''}
      </div>
      <div class="pcard"><h4>国体与分封</h4>${UI.polityFields(n)}</div>
      <div class="pcard"><h4>国家背景</h4><textarea data-lore rows="6" placeholder="建国经过、重大事件、国策……">${esc(lore)}</textarea>
        <div class="row wrap"><button class="btn small" data-lore-gen>🎲 随机生成背景</button></div></div>`;
    UI.modal(`<div class="phead" style="--c:${n.color}"><i></i><div><h3>${esc(n.name) || '（未命名）'}</h3><small>${esc(t.name)}${ov ? ' · ' + esc(ov.name) + '之' + (t.rank.id === 'fief' ? '封国' : '附庸') : ''}${pa ? ' · ' + esc(t.ruler) + ' ' + esc(pa.name) : ''}</small></div></div>
      <div class="pgrid"><div>${left}</div><div>${right}</div></div>
      <div class="row end"><button class="btn" data-hl>在地图上高亮</button><button class="btn" data-rank>国力排名</button><button class="btn pri" data-close>关闭</button></div>`, (m) => {
      m.querySelector('.dlg').classList.add('wide');
      const again = () => UI.profile(n.id);
      UI.bindPolityFields(m, n, again);
      m.querySelectorAll('[data-goto]').forEach((a) => (a.onclick = () => UI.profile(+a.dataset.goto)));
      m.querySelectorAll('[data-fam],[data-fam-open]').forEach((a) => (a.onclick = () => { m.hidden = true; App.Family.fid = fam.id; App.Family.show(); }));
      m.querySelector('[data-dyn]').onclick = () => {
        if (fam && !confirm(`重新生成「${n.name}」的统治家族？\n原来的「${fam.name}」会保留，但不再是统治家族。`)) return;
        App.pushUndo(); if (fam) fam.ruling = 0; P.makeDynasty(n); App.changed({ ui: true }); again();
      };
      const pd = m.querySelector('[data-pick-dyn]'); if (pd) pd.onchange = () => { const f = App.Family.fam(+pd.value); if (!f) return; App.pushUndo(); if (fam) fam.ruling = 0; n.dynasty = f.id; f.ruling = n.id; f.house = t.house; P.crown(n, f); App.changed({ ui: true }); again(); };
      const vc = m.querySelector('[data-vcol]'); if (vc) vc.onclick = () => { App.pushUndo(); vas.forEach((v, i) => (v.color = U.shade(n.color, (i % 2 ? -0.18 : 0.22) + (i / vas.length) * 0.1))); App.changed({ pol: true, ui: true }); again(); };
      const lt = m.querySelector('[data-lore]'); lt.onfocus = () => App.pushUndo(); lt.oninput = () => { n.lore = lt.value; App.autosave(); };
      m.querySelector('[data-lore-gen]').onclick = () => { App.pushUndo(); n.lore = P.genLore(n); App.autosave(); again(); };
      m.querySelector('[data-hl]').onclick = () => { m.hidden = true; T().highlight(n.id); const c = App.Geo.nationComps(n.id); if (c.length) App.R.zoomToBox(c.reduce((a, q) => [Math.min(a[0], q.box[0]), Math.min(a[1], q.box[1]), Math.max(a[2], q.box[2]), Math.max(a[3], q.box[3])], [1e9, 1e9, -1e9, -1e9])); };
      m.querySelector('[data-rank]').onclick = UI.powerDialog;
    });
  };
  // 当前国家：高亮的 > 正在编辑的
  UI.profileCurrent = () => UI.profile(T().hl || T().activeNation || (App.S.nations[0] && App.S.nations[0].id));
})();
