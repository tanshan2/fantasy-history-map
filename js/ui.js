// ===== 界面 =====
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const T = () => App.Tools;
  const UI = (App.UI = { tab: 'nations' });
  const opt = (arr, v) => arr.map((a) => `<option value="${a.id}" ${a.id === v ? 'selected' : ''}>${U.esc(a.name)}</option>`).join('');
  const ICON = {
    color: '<path d="M12 3a9 9 0 100 18c1.2 0 1.6-.9 1.3-1.8-.3-.8.2-1.7 1.1-1.7H17a4 4 0 004-4c0-5-4-10.5-9-10.5z"/><circle cx="7.5" cy="11" r="1.6" fill="#c8584a"/><circle cx="10.5" cy="7" r="1.6" fill="#d8b45a"/><circle cx="15" cy="7" r="1.6" fill="#6f9a6a"/><circle cx="17.5" cy="11" r="1.6" fill="#5b7aa6"/>',
    select: '<path d="M5 3l12 8-6 1 3 6-2 1-3-6-4 4z"/>',
    pan: '<path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    land: '<path d="M3 15c2-5 5-8 9-7s4-4 8-2c1 5-2 10-7 11s-9 2-10-2z"/>',
    terrain: '<path d="M2 20l7-12 4 6 3-4 6 10z"/>',
    forest: '<path d="M8 3l5 8h-3l4 6H2l4-6H3zM16 7l4 7h-2l3 5h-5l-1-2"/><rect x="7" y="17" width="2" height="4"/>',
    river: '<path d="M4 3c6 3-4 7 3 10s-3 6 4 8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14 3c4 3-2 6 3 9" fill="none" stroke="currentColor" stroke-width="1.4"/>',
    nation: '<path d="M5 21V3M5 4h12l-3 4 3 4H5" />',
    prov: '<rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 11h8V3M11 11l5 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2"/>',
    line: '<path d="M3 18L9 8l5 7 7-11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="4 2"/>',
    city: '<path d="M3 21V10l4-3 4 3v11zM13 21V5l4-2 4 2v16z"/>',
    army: '<rect x="3" y="6" width="18" height="12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 6l18 12M21 6L3 18" stroke="currentColor" stroke-width="1.6"/>',
    arrow: '<path d="M3 17c4-1 8-5 11-9l-3-1 8-4-1 9-2-3c-3 4-7 8-12 10z"/>',
    marker: '<path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="2.6"/><path d="M4 8l4-4M16 4l4 4" stroke="currentColor" stroke-width="2"/>',
    text: '<path d="M4 5h16v3h-6v12h-4V8H4z"/>',
  };
  const TOOLS = [['color', '彩笔', '1 / B'], ['select', '选择', '2 / V'], ['pan', '平移', 'H'], ['land', '陆海', '3 / L'], ['terrain', '地貌', '4 / T'], ['forest', '森林', '5 / F'], ['river', '河流', '6 / R'],
    ['nation', '国家', '7 / N'], ['prov', '行政区', '8 / P'], ['line', '线条', 'K'], ['city', '城市', '9 / C'], ['army', '军队', '0 / J'], ['arrow', '进军', 'U'], ['marker', '标记', 'M'], ['text', '文字', 'X']];

  UI.init = () => {
    $('#tools').innerHTML = TOOLS.map(([id, n, k]) => `<button class="tool" data-tool="${id}" title="${n}（${k}）"><svg viewBox="0 0 24 24" fill="currentColor">${ICON[id]}</svg><span>${n}</span></button>`).join('');
    $('#tools').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (b) T().set(b.dataset.tool); });
    document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => { UI.tab = b.dataset.tab; UI.refresh(); }));
    $('#btnNew').onclick = UI.newDialog; $('#btnOpen').onclick = () => $('#fileJson').click();
    $('#btnSave').onclick = UI.saveJson; $('#btnPng').onclick = UI.exportDialog;
    $('#btnUndo').onclick = App.undo; $('#btnRedo').onclick = App.redo; $('#btnHelp').onclick = UI.help;
    $('#btnFit').onclick = App.R.fit;
    const zc = (f) => { const r = $('#map').getBoundingClientRect(); T().zoomAt(r.width / 2, r.height / 2, f); };
    $('#zIn').onclick = () => zc(1.4); $('#zOut').onclick = () => zc(1 / 1.4);
    $('#panelToggle').onclick = () => document.body.classList.toggle('panel-open');
    $('#fileJson').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { App.deserialize(JSON.parse(await f.text())); App.afterBigChange(); App.R.fit(); UI.toast('已打开：' + f.name); } catch (err) { UI.toast('打开失败：' + err.message); }
      e.target.value = '';
    };
    $('#fileImg').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { const im = new Image(); im.onload = () => {
        const r = Math.min(App.WW / im.width, App.HH / im.height);
        App.S.meta.ref = { src: rd.result, x: (App.WW - im.width * r) / 2, y: (App.HH - im.height * r) / 2, w: im.width * r, h: im.height * r, ar: im.width / im.height, opacity: 0.5, visible: true };
        UI.tab = 'layers'; UI.refresh(); App.R.request(); App.autosave();
      }; im.src = rd.result; };
      rd.readAsDataURL(f); e.target.value = '';
    };
    $('#mapName').addEventListener('change', (e) => { App.S.meta.name = e.target.value; App.autosave(); });
    $('#btnFamily').onclick = () => App.Family.show();
    $('#btnPower').onclick = () => UI.powerDialog(); $('#btnProfile').onclick = () => UI.profileCurrent();
    UI.refreshTool(); UI.refresh();
  };

  // ---------- 提示 ----------
  let toastT = 0;
  UI.toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); };
  UI.flash = (msg) => { const s = $('#saveState'); s.textContent = msg; clearTimeout(s._t); s._t = setTimeout(() => (s.textContent = ''), 1500); };
  UI.status = (wx, wy) => {
    const v = App.R.view; let s = `缩放 ${Math.round(v.s * 100)}%`;
    if (wx != null) {
      const c = App.Ops.cellAt(wx, wy);
      if (c >= 0) {
        const S = App.S, t = S.terrain[c];
        const tn = t === 0 ? '海洋' : t === 1 ? '湖泊' : App.TERRAINS.find((k) => k.id === t)?.name;
        const n = App.nation(S.owner[c]), p = App.province(S.prov[c]);
        const f = S.forest[c] ? App.FORESTS.find((k) => k.id === S.forest[c])?.name : '';
        const cl = App.Climate.at(c);
        s += ` · ${tn}${cl && t >= 2 ? ' · ' + cl.name + '气候' : ''}${f ? ' · ' + f : ''}${n ? ' · ' + n.name : ''}${p ? ' · ' + p.name : ''}`;
      }
    }
    $('#status').textContent = s;
  };

  // ---------- 工具选项栏 ----------
  const chips = (key, arr) => `<div class="chips">${arr.map((a) => `<button class="chip ${T().opt[key] === a.id ? 'on' : ''}" data-opt="${key}" data-val="${a.id}">${U.esc(a.name)}</button>`).join('')}</div>`;
  const brush = () => `<label class="rng">笔刷 <input type="range" min="0.5" max="40" step="0.5" value="${T().opt.brush}" data-num="brush"><b>${T().opt.brush}</b></label>`;
  const nationPick = () => `<label>国家 <select data-act="activeNation"><option value="0">— 选择国家 —</option>${App.S.nations.map((n) => `<option value="${n.id}" ${n.id === T().activeNation ? "selected" : ""}>${U.esc(n.name) || "（未命名 " + n.color + "）"}</option>`).join('')}</select></label>`;
  UI.refreshTool = () => {
    document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('on', b.dataset.tool === T().cur));
    const o = T().opt; let h = '';
    switch (T().cur) {
      case 'color': h = UI.colorBar() + chips('fill', [{ id: false, name: '笔刷' }, { id: true, name: '油漆桶' }]) + chips('erase', [{ id: false, name: '涂色' }, { id: true, name: '橡皮' }]) + brush() + `<label class="ck"><input type="checkbox" data-mk="1" ${o.makeLand && !App.S.meta.vec ? 'checked' : ''} ${App.S.meta.vec ? 'disabled title="真实地理模板中关闭，以保护精确海岸线；要改海岸请用「陆海」工具"' : ''}> 涂到海里自动变陆地</label><button class="btn small" data-autoall="1" title="给还没有行政区的颜色区域自动划分省、道、府">一键划分行政区</button>`; break;
      case 'select': h ='<span class="hint">点领土＝选中国家并高亮 · 点对象＝选中，拖动移动 · 双击改名 · Delete 删除 · WASD 移动地图 · Q/E 缩放</span>'; break;
      case 'pan': h = '<span class="hint">拖动平移，滚轮/双指缩放</span>'; break;
      case 'land': h = chips('land', [{ id: 'land', name: '画陆地' }, { id: 'ocean', name: '画海洋' }, { id: 'lake', name: '画湖泊' }]) + brush(); break;
      case 'terrain': h = chips('tmode', [{ id: 'terrain', name: '画地貌' }, { id: 'climate', name: '画气候' }]) + (o.tmode === 'climate' ? chips('climate', App.Climate.LIST.filter(Boolean)) + '<button class="btn small" data-rebiome="1" title="按气候重新铺设整张地图的地貌和森林（山地丘陵保留）">按气候重铺地貌</button>' : chips('terrain', App.TERRAINS)) + brush(); break;
      case 'forest': h = chips('forest', App.FORESTS) + brush(); break;
      case 'river': h = `<label class="rng">河宽 <input type="range" min="0.6" max="6" step="0.2" value="${o.riverWidth}" data-num="riverWidth"><b>${o.riverWidth}</b></label><span class="hint">从源头画向入海口（越画越宽）</span>`; break;
      case 'nation': h = nationPick() + chips('fill', [{ id: false, name: '笔刷' }, { id: true, name: '油漆桶' }]) + chips('erase', [{ id: false, name: '涂色' }, { id: true, name: '橡皮' }]) + brush(); break;
      case "prov": h = nationPick() + `<label>行政区 <select data-act="activeProv"><option value="0">— 选择 —</option>${UI.provOptions()}</select></label>` + (o.erase ? chips("provLevel", [{ id: 1, name: "擦省" }, { id: 2, name: "擦道" }, { id: 3, name: "擦府" }]) : "") + chips('fill', [{ id: false, name: '笔刷' }, { id: true, name: '油漆桶' }]) + chips('erase', [{ id: false, name: '涂色' }, { id: true, name: '橡皮' }]) + brush(); break;
      case 'line': h = chips('lineStyle', App.LINE_STYLES) + '<span class="hint">按住拖动绘制</span>'; break;
      case 'city': h = chips('cityType', App.CITY_TYPES) + '<span class="hint">点击放置，名字按所在国文明自动生成</span>'; break;
      case "army": h = nationPick() + ["步兵", "骑兵", "其他"].map((g) => `<span class="grp">${g}</span>` + chips("armyType", App.ARMY_TYPES.filter((a) => a.g === g))).join("") + `<label>兵力 <input type="text" size="5" value="${U.esc(o.strength)}" data-str="strength"></label>`; break;
      case 'arrow': h = nationPick() + `<label class="rng">宽度 <input type="range" min="4" max="40" step="1" value="${o.arrowWidth}" data-num="arrowWidth"><b>${o.arrowWidth}</b></label>`; break;
      case 'marker': h = chips('markerType', App.MARKER_TYPES); break;
      case 'text': h = `<label class="rng">字号 <input type="range" min="8" max="120" step="1" value="${o.textSize}" data-num="textSize"><b>${o.textSize}</b></label><span class="hint">点击地图放置文字（海名、地区名、标题框…）</span>`; break;
    }
    if (['color', 'nation', 'prov'].includes(T().cur)) h += UI.lockBar();
    const bar = $('#optbar'); bar.innerHTML = h;
    bar.querySelectorAll('[data-lock]').forEach((b) => (b.onclick = () => { o[b.dataset.lock] = !o[b.dataset.lock]; UI.refreshTool(); App.R.request(); }));
    bar.querySelectorAll('[data-opt]').forEach((b) => (b.onclick = () => {
      let v = b.dataset.val; if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^\d+$/.test(v)) v = +v;
      o[b.dataset.opt] = v; UI.refreshTool(); App.R.request();
    }));
    bar.querySelectorAll('[data-num]').forEach((i) => (i.oninput = () => { o[i.dataset.num] = +i.value; i.nextElementSibling.textContent = i.value; App.R.request(); }));
    bar.querySelectorAll('[data-rebiome]').forEach((b) => (b.onclick = () => { if (!confirm('按气候重新铺设全图的地貌和森林？（山地、丘陵保留，可撤销）')) return; App.pushUndo(['terrain', 'forest']); App.Climate.applyBiomes(App.S); App.changed({ tint: true }); }));
    if (T().cur === 'terrain' && o.tmode === 'climate' && !App.S.meta.showClimate) { App.S.meta.showClimate = true; App.R.request(); }
    bar.querySelectorAll('[data-autoall]').forEach((b) => (b.onclick = () => { App.pushUndo(['prov', 'prov2', 'prov3']); const k = App.Ops.autoAllProvinces(false); App.changed({ pol: true, ui: true }); UI.toast(k ? '已为 ' + k + ' 个区域划分省、道、府' : '所有区域都已经有行政区了（在「国家」页可以重新划分）'); }));
    bar.querySelectorAll('[data-sw]').forEach((b) => (b.onclick = () => { o.color = b.dataset.sw; o.erase = false; UI.refreshTool(); }));
    bar.querySelectorAll('[data-cpick]').forEach((i) => (i.oninput = () => { o.color = i.value; o.erase = false; }));
    bar.querySelectorAll('[data-mk]').forEach((i) => (i.onchange = () => (o.makeLand = i.checked)));
    bar.querySelectorAll('[data-str]').forEach((i) => (i.oninput = () => (o[i.dataset.str] = i.value)));
    bar.querySelectorAll('[data-act=activeNation]').forEach((s) => (s.onchange = () => { T().activeNation = +s.value; T().activeProv = 0; UI.refresh(); UI.refreshTool(); }));
    bar.querySelectorAll('[data-act=activeProv]').forEach((s) => (s.onchange = () => { T().activeProv = +s.value; UI.refresh(); }));
    $('#stage').dataset.tool = T().cur;
  };

  // ---------- 右侧面板 ----------
  UI.refresh = () => {
    if (UI.syncLv) UI.syncLv();
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === UI.tab));
    $('#mapName').value = App.S.meta.name || '';
    const p = $('#tabBody');
    p.innerHTML = UI['tab_' + UI.tab]();
    bind(p);
    UI.showSelection();
    UI.status();
  };

  const field = (label, html) => `<div class="field"><label>${label}</label>${html}</div>`;
  const cultureSel = (v, act) => `<select data-act="${act}">${App.CULTURES.map((c) => `<option value="${c.id}" ${c.id === v ? 'selected' : ''}>${c.name}</option>`).join('')}</select>`;

  UI.tab_nations = () => {
    const S = App.S, an = App.nation(T().activeNation);
    const counts = new Map(); for (let c = 0; c < App.N; c++) { const o = S.owner[c]; if (o) counts.set(o, (counts.get(o) || 0) + 1); }
    let h = `<div class="row"><button class="btn pri" data-act="addNation">＋ 新建国家</button><select data-act="newCulture" title="新国家的文明">${App.CULTURES.map((c) => `<option value="${c.id}" ${c.id === UI.newCulture ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>`;
    h += '<ul class="list">' + S.nations.map((n) => `<li class="${n.id === T().activeNation ? 'on' : ''}" data-nation="${n.id}"><i style="background:${n.color}"></i><span>${U.esc(n.name) || "（未命名）"}</span><small>${App.Polity.title(n).name}${n.overlord ? '·附庸' : ''} · ${counts.get(n.id) || 0}格</small></li>`).join('') + '</ul>';
    if (!S.nations.length) h += '<p class="muted">还没有国家。新建一个，然后用左侧「国家」工具在地图上涂色。</p>';
    if (an) {
      h += `<div class="card"><h4>编辑：${U.esc(an.name) || "未命名区域"}</h4>
        ${field('国名', `<div class="row"><input type="text" data-n="name" value="${U.esc(an.name)}"><button class="btn" data-act="rndName" title="按文明随机">🎲</button></div>`)}
        ${field('颜色', `<input type="color" data-n="color" value="${an.color}">`)}
        ${field('文明', cultureSel(an.culture, 'nCulture'))}
        ${field("行政区划制度", `<select data-act="adminSys">${UI.sysOptions(an)}</select>`)}<p class="muted">${U.esc(App.sysOf(an).note || "")}</p>
        ${UI.polityFields(an)}
        <div class="row wrap"><button class="btn pri" data-act="profile">📜 国家档案</button><button class="btn" data-act="mkDyn">${App.Polity.dynasty(an) ? '重新生成统治家族' : '生成统治家族'}</button></div>
        <p class="muted">国名自动显示在领土最宽处，不能拖动。</p>
        ${UI.territoryInfo(an)}
        <div class="row wrap"><button class="btn" data-act="rndAll">🎲 全部重新命名（国、各级行政区、城）</button></div>
        <h4 style="margin-top:10px">自动划分行政区（${[1, 2, 3].slice(0, App.maxLevel(an)).map((l) => App.levelName(an, l)).join(" → ")}）</h4>
        <div class="row wrap"><label class="inline">分成 <input type="number" min="1" max="40" value="${UI.provK || ""}" placeholder="自动" data-act="provK" style="width:58px"> 个${App.levelName(an, 1)}，下级按制度比例自动细分</label></div>
        <div class="row wrap"><button class="btn" data-act="autoProv">重新划分全部</button><button class="btn" data-act="autoSub">保留${App.levelName(an, 1)}，只细分下级</button></div>
        <div class="row wrap"><button class="btn" data-act="autoCity">自动生成城市</button><button class="btn danger" data-act="delNation">删除国家</button></div></div>`;
    }
    h += `<div class="row wrap"><button class="btn" data-act="autoAll">一键划分所有国家的行政区</button><button class="btn" data-act="recolor">相邻国家自动配色</button><button class="btn" data-act="family">家族 / 族谱…</button><button class="btn" data-act="power">国力排名</button></div>`;
    return h;
  };
  UI.tab_provs = () => {
    const S = App.S, an = App.nation(T().activeNation);
    if (!an) return '<p class="muted">先在「国家」页选择一个国家。</p>' + `<ul class="list">${S.nations.map((n) => `<li data-nation="${n.id}"><i style="background:${n.color}"></i><span>${U.esc(n.name)}</span></li>`).join('')}</ul>`;
    const ps = S.provinces.filter((p) => p.nation === an.id);
    const kids = (pid, lv) => ps.filter((p) => (p.level || 1) === lv && (lv === 1 || p.parent === pid));
    const row = (p) => {
      const lv = p.level || 1, open = UI.provOpen?.[p.id];
      const sub = lv < 3 ? kids(p.id, lv + 1) : [];
      return `<li class="lv${lv} ${p.id === T().activeProv ? 'on' : ''}" data-prov="${p.id}"><em data-ptog="${p.id}">${sub.length ? (open ? '▾' : '▸') : '·'}</em><span>${U.esc(p.name)}</span><small>${App.levelName(an, lv)}${sub.length ? ' · ' + sub.length : ''}</small></li>` + (open ? sub.map(row).join('') : '');
    };
    let h = `<div class="row"><b style="color:${an.color}">■</b>&nbsp;${U.esc(an.name)} 的行政区</div>
      <div class="row wrap"><button class="btn pri" data-act="addProv">＋ 新建${App.levelName(an, 1)}</button></div><p class="muted">制度：${App.sysOf(an).name}（在「国家」页修改）</p><div></div>`;
    h += '<ul class="list ptree">' + kids(0, 1).map(row).join('') + '</ul>';
    if (!ps.length) h += '<p class="muted">新建省后，可在省下面建道、在道下面建府；选中后用左侧「行政区」工具在本国领土内涂抹。也可以回到「国家」页一键自动划分。</p>';
    const ap = App.province(T().activeProv);
    if (ap && ap.nation === an.id) {
      const lv = ap.level || 1, par = App.province(ap.parent);
      h += `<div class="card"><h4>编辑${App.levelName(an, lv)}（${["", "一", "二", "三"][lv]}级）</h4>${par ? `<p class="muted">隶属：${U.esc(par.name)}</p>` : ''}
      ${field('名称', `<div class="row"><input type="text" data-p="name" value="${U.esc(ap.name)}"><button class="btn" data-act="rndProv">🎲</button></div>`)}
      <div class="row wrap">${lv < App.maxLevel(an) ? `<button class="btn pri" data-act="addSub">＋ 下设${App.levelName(an, lv + 1)}</button>` : ""}<button class="btn danger" data-act="delProv">删除（含下级）</button></div></div>`;
    }
    return h;
  };
  UI.tab_layers = () => {
    const m = App.S.meta, ref = m.ref;
    const ck = (k, n) => `<label class="ck"><input type="checkbox" data-meta="${k}" ${m[k] ? 'checked' : ''}> ${n}</label>`;
    const fonts = ['Noto Serif SC', 'Ma Shan Zheng', 'ZCOOL XiaoWei', 'Long Cang', 'Noto Sans SC'];
    const lfonts = ['Alegreya', 'IM Fell English', 'Cinzel', 'Almendra', 'EB Garamond', 'MedievalSharp'];
    let h = `<div class="card"><h4>画风</h4><div class="chips">${Object.entries(App.R.STYLES).map(([id, s]) => `<button class="chip ${m.style === id ? 'on' : ''}" data-style="${id}">${s.name}</button>`).join('')}</div>
      ${field('城市样式', `<div class="chips"><button class="chip ${m.cityStyle === 'icon' ? 'on' : ''}" data-city="icon">插画图标</button><button class="chip ${m.cityStyle !== 'icon' ? 'on' : ''}" data-city="dot">简洁圆点</button></div>`)}</div>
    <div class="card"><h4>行政区显示</h4>${ck('lv1', '省（一级）')}${ck('lv2', '道（二级）')}${ck('lv3', '府（三级）')}<br>${ck('showProvLabels', '显示行政区名')}</div>
    <div class="card"><h4>显示</h4>${ck('showIcons', '山脉/森林图标')}${ck('showGrid', '网格')}${ck('showCityLabels', '城市名')}${ck('showArmies', '军队与箭头')}${ck("showFamilies", "家族旗帜")}${ck("showVassal", "附庸/封国斜纹")}${ck("showClimate", "气候图")}</div>
    ${m.showClimate ? `<div class="card"><h4>气候图例</h4><div class="legend">${App.Climate.LIST.filter(Boolean).map((k) => `<div><i style="background:${k.color}"></i><b>${k.name}</b><small>${k.desc}</small></div>`).join("")}</div><p class="muted">用「地貌」工具切到「画气候」可以手动修改气候带。</p></div>` : ""}
    <div class="card"><h4>字体与颜色</h4>${field('中文字体', `<select data-meta-s="labelFont">${fonts.map((f) => `<option ${f === m.labelFont ? 'selected' : ''}>${f}</option>`).join('')}</select>`)}
    ${field('西文字体', `<select data-meta-s="latinFont">${lfonts.map((f) => `<option ${f === m.latinFont ? 'selected' : ''}>${f}</option>`).join('')}</select>`)}
    ${field('海洋颜色', `<input type="color" data-meta-s="ocean" value="${m.ocean}">`)}</div>
    <div class="card"><h4>参考图（描图用）</h4><p class="muted">导入你自己的地图截图，半透明叠在上面照着画。</p><div class="row"><button class="btn" data-act="loadRef">导入图片</button>${ref ? '<button class="btn danger" data-act="delRef">移除</button>' : ''}</div>`;
    if (ref) h += `${ck2('visible', '显示', ref.visible)}${field('不透明度', `<input type="range" min="0" max="1" step="0.05" value="${ref.opacity}" data-ref="opacity">`)}
      ${field('缩放', `<input type="range" min="0.2" max="4" step="0.01" value="${(ref.w / App.WW).toFixed(2)}" data-ref="scale">`)}
      ${field('左右', `<input type="range" min="${-App.WW}" max="${App.WW}" value="${ref.x}" data-ref="x">`)}
      ${field('上下', `<input type="range" min="${-App.HH}" max="${App.HH}" value="${ref.y}" data-ref="y">`)}
      <div class="row"><button class="btn" data-act="refFit">铺满地图</button></div>`;
    return h + '</div>';
  };
  const ck2 = (k, n, v) => `<label class="ck"><input type="checkbox" data-refck="${k}" ${v ? 'checked' : ''}> ${n}</label>`;
  UI.tab_map = () => `<div class="card"><h4>新建 / 生成</h4><div class="row wrap"><button class="btn pri" data-act="newMap">新建或随机生成…</button><button class="btn" data-act="asia">载入亚洲模板</button><button class="btn" data-act="europe">载入欧洲模板</button><button class="btn" data-act="preset">载入示例「天汉历626年」</button></div></div>
    <div class="card"><h4>旧存档</h4><p class="muted">之前版本自动保存的地图还在浏览器里，需要时可以找回。</p><button class="btn" data-act="oldSave">载入上一版本的存档</button></div>
    <div class="card"><h4>文件</h4><div class="row wrap"><button class="btn" data-act="save">保存为 JSON</button><button class="btn" data-act="open">打开 JSON</button><button class="btn" data-act="png">导出图片</button></div>
    <p class="muted">地图会自动保存在浏览器里（下次打开自动恢复）。想长期保存或换电脑，请「保存为 JSON」。</p></div>
    <div class="card"><h4>统计</h4><p>${App.S.nations.length} 个国家 · ${App.S.provinces.length} 个行政区 · ${App.S.cities.length} 座城市 · ${App.S.armies.length} 支军队 · ${App.S.rivers.length} 条河流</p></div>`;

  // ---------- 面板事件 ----------
  const bind = (p) => {
    const S = App.S;
    p.querySelectorAll('[data-nation]').forEach((li) => (li.onclick = () => T().highlight(+li.dataset.nation)));
    p.querySelectorAll('[data-zoom]').forEach((b) => (b.onclick = () => { const comps = App.Geo.nationComps(+b.dataset.zoom), k = b.dataset.comp; if (!comps.length) return; if (k === 'all') { const bx = comps.reduce((a, q) => [Math.min(a[0], q.box[0]), Math.min(a[1], q.box[1]), Math.max(a[2], q.box[2]), Math.max(a[3], q.box[3])], [1e9, 1e9, -1e9, -1e9]); App.R.zoomToBox(bx); } else App.R.zoomToBox(comps[+k].box, 0.35); T().highlight(+b.dataset.zoom); }));
    p.querySelectorAll("[data-ptog]").forEach((e) => (e.onclick = (ev) => { ev.stopPropagation(); UI.provOpen = UI.provOpen || {}; UI.provOpen[e.dataset.ptog] = !UI.provOpen[e.dataset.ptog]; UI.refresh(); }));
    p.querySelectorAll("[data-prov]").forEach((li) => (li.onclick = () => { T().activeProv = +li.dataset.prov; if (T().cur !== "prov") T().set("prov"); UI.refresh(); UI.refreshTool(); }));
    p.querySelectorAll("[data-style]").forEach((b) => (b.onclick = () => { const st = App.R.STYLES[b.dataset.style]; S.meta.style = b.dataset.style; S.meta.ocean = st.ocean; App.R.request(); App.autosave(); UI.refresh(); }));
    p.querySelectorAll("[data-city]").forEach((b) => (b.onclick = () => { S.meta.cityStyle = b.dataset.city; App.R.request(); App.autosave(); UI.refresh(); }));
    const an = App.nation(T().activeNation), ap = App.province(T().activeProv);
    p.querySelectorAll('[data-n]').forEach((i) => {
      i.onfocus = () => App.pushUndo();
      i.oninput = () => { an[i.dataset.n] = i.value; if (i.dataset.n === 'color') App.Geo.dirtyPol = true; App.R.request(); };
      i.onchange = () => { App.changed({ ui: true }); UI.refreshTool(); };
    });
    p.querySelectorAll('[data-p]').forEach((i) => { i.onfocus = () => App.pushUndo(); i.oninput = () => { ap[i.dataset.p] = i.value; App.R.request(); }; i.onchange = () => App.changed({ ui: true }); });
    p.querySelectorAll("[data-meta]").forEach((i) => (i.onchange = () => { S.meta[i.dataset.meta] = i.checked; App.R.request(); App.autosave(); UI.syncLv(); if (i.dataset.meta === "showClimate") UI.refresh(); }));
    p.querySelectorAll('[data-meta-s]').forEach((i) => (i.oninput = () => { S.meta[i.dataset.metaS] = i.value; loadFont(i.value); App.R.request(); App.autosave(); }));
    p.querySelectorAll('[data-ref]').forEach((i) => (i.oninput = () => {
      const r = S.meta.ref, k = i.dataset.ref, v = +i.value;
      if (k === 'scale') { const cxm = r.x + r.w / 2, cym = r.y + r.h / 2; r.w = App.WW * v; r.h = r.w / (r.ar || r.w / r.h); r.x = cxm - r.w / 2; r.y = cym - r.h / 2; } else r[k] = v;
      App.R.request(); App.autosave();
    }));
    p.querySelectorAll('[data-refck]').forEach((i) => (i.onchange = () => { S.meta.ref[i.dataset.refck] = i.checked; App.R.request(); }));
    const act = (name, fn) => p.querySelectorAll(`[data-act=${name}]`).forEach((b) => (b.tagName === 'SELECT' || b.tagName === 'INPUT' ? (b.onchange = () => fn(b)) : (b.onclick = () => fn(b))));
    act('newCulture', (b) => (UI.newCulture = b.value));
    act('addNation', () => { App.pushUndo(); const n = App.Ops.addNation({ culture: UI.newCulture || 'huaxia' }); T().activeNation = n.id; T().activeProv = 0; if (!['nation', 'army', 'arrow'].includes(T().cur)) T().set('nation'); App.changed({ ui: true }); UI.refreshTool(); });
    act('rndName', () => { App.pushUndo(); an.name = App.Names.nation(an.culture); App.changed({ ui: true }); UI.refreshTool(); });
    act('nCulture', (b) => { App.pushUndo(); an.culture = b.value; App.changed({ ui: true }); });
    act('rndAll', () => { App.pushUndo(); App.Ops.renameAll(an.id); App.changed({ ui: true }); UI.refreshTool(); });
    act('provK', (b) => (UI.provK = +b.value));
    act("autoSub", () => { App.pushUndo(["prov", "prov2", "prov3"]); App.Ops.autoProvinces(an.id, 0, Math.random, { keepL1: true }); App.changed({ pol: true, ui: true }); });
    act("family", () => App.Family.show());
    act('power', () => UI.powerDialog());
    act('profile', () => UI.profile(an.id));
    act('mkDyn', () => { const f = App.Polity.dynasty(an); if (f && !confirm('重新生成「' + an.name + '」的统治家族？原家族会保留。')) return; App.pushUndo(); if (f) f.ruling = 0; App.Polity.makeDynasty(an); App.changed({ ui: true }); UI.toast('已生成 ' + App.Polity.dynasty(an).name + '（' + App.Polity.title(an).house + '）'); });
    if (an && UI.bindPolityFields) UI.bindPolityFields(p, an, () => UI.refreshTool());
    act('adminSys', (b) => { const ns = App.ADMIN_SYS[b.value], has = S.provinces.some((p) => p.nation === an.id); if (has && !confirm('切换为「' + ns.name + '」？\n已有行政区会保留地名、改成新的级别名称' + (ns.levels < 3 ? '，并删除第三级' : '') + '。')) { UI.refresh(); return; } App.pushUndo(['prov', 'prov2', 'prov3']); App.Ops.setAdminSys(an, b.value); App.changed({ pol: true, ui: true }); UI.refreshTool(); });
    act('autoAll', () => { const redo = App.S.provinces.length && confirm('已有行政区的国家也重新划分吗？\n确定＝全部重新划分，取消＝只划分还没有行政区的'); App.pushUndo(['prov', 'prov2', 'prov3']); const k = App.Ops.autoAllProvinces(redo); App.changed({ pol: true, ui: true }); UI.toast('已划分 ' + k + ' 个国家'); });
    act("autoProv", () => { App.pushUndo(["prov", "prov2", "prov3"]); App.Ops.autoProvinces(an.id, UI.provK || 0); App.changed({ pol: true, ui: true }); });
    act('autoCity', () => { App.pushUndo(); App.Ops.autoCities(an.id); App.changed({ ui: true }); });
    act('delNation', () => { if (!confirm(`删除「${an.name}」？（可撤销）`)) return; App.pushUndo(["owner", "prov", "prov2", "prov3"]); App.Ops.deleteNation(an.id); T().activeNation = 0; App.changed({ pol: true, ui: true }); UI.refreshTool(); });
    act('recolor', () => { App.pushUndo(); App.Ops.recolor(); App.changed({ pol: true, ui: true }); });
    act("addSub", () => { App.pushUndo(); const pr = App.Ops.addProvince(an.id, null, (ap.level || 1) + 1, ap.id); UI.provOpen = UI.provOpen || {}; UI.provOpen[ap.id] = true; T().activeProv = pr.id; T().set("prov"); App.changed({ ui: true }); });
    act("addProv", () => { App.pushUndo(); const pr = App.Ops.addProvince(an.id, null, 1, 0); T().activeProv = pr.id; T().set('prov'); App.changed({ ui: true }); });
    act('rndProv', () => { App.pushUndo(); Object.assign(ap, App.Names.provFor(an, ap.level || 1)); App.changed({ ui: true }); });
    act("delProv", () => { App.pushUndo(["prov", "prov2", "prov3"]); App.Ops.deleteProvince(ap.id); T().activeProv = 0; App.changed({ pol: true, ui: true }); UI.refreshTool(); });
    act('loadRef', () => $('#fileImg').click());
    act('delRef', () => { S.meta.ref = null; App.changed({ ui: true }); });
    act('refFit', () => { const r = S.meta.ref; r.x = 0; r.y = 0; r.w = App.WW; r.h = App.HH; App.changed({ ui: true }); });
    act('oldSave', async () => { const s = await App.DB.get('autosave'); if (!s) { UI.toast('没有找到旧存档'); return; } if (!confirm('用旧存档替换当前地图？（当前地图会被覆盖，建议先保存 JSON）')) return; App.deserialize(JSON.parse(s)); App.afterBigChange(); App.R.fit(); UI.toast('已载入旧存档'); });
    act('newMap', UI.newDialog); act("preset", () => UI.loadPreset("tianhan")); act("asia", () => UI.loadPreset("asia")); act("europe", () => UI.loadPreset("europe")); act('save', UI.saveJson); act('open', () => $('#fileJson').click()); act('png', UI.exportDialog);
  };

  // ---------- 选中对象属性 ----------
  UI.showSelection = () => {
    const box = $('#selBox'), o = T().selObj(), sel = T().sel;
    if (!o) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    const k = sel.kind;
    const inp = (key, label, type = 'text', extra = '') => field(label, `<input type="${type}" data-o="${key}" value="${U.esc(o[key] ?? '')}" ${extra}>`);
    const sel_ = (key, label, arr) => field(label, `<select data-o="${key}">${opt(arr, o[key])}</select>`);
    const nat = (key) => field('所属国家', `<select data-o="${key}" data-numv="1">${App.S.nations.map((n) => `<option value="${n.id}" ${n.id === o[key] ? 'selected' : ''}>${U.esc(n.name)}</option>`).join('')}</select>`);
    const TITLES = { cities: '城市', armies: '军队', markers: '标记', texts: '文字', rivers: '河流', lines: '线条', arrows: '进军箭头', nationLabel: '国名标签', provLabel: '行政区名' };
    let h = `<div class="selhead"><b>${TITLES[k]}</b><span><button class="btn small" data-sact="rnd" title="随机名字">🎲</button><button class="btn small danger" data-sact="del">删除</button></span></div>`;
    if (k === 'cities') h += inp('name', '名称') + sel_('type', '类型', App.CITY_TYPES);
    if (k === 'armies') h += inp('name', '番号') + inp('strength', '兵力') + sel_('type', '兵种', App.ARMY_TYPES) + nat('nation');
    if (k === 'markers') h += inp('name', '名称') + sel_('type', '类型', App.MARKER_TYPES);
    if (k === 'texts') h += field('文字', `<textarea data-o="text" rows="3">${U.esc(o.text)}</textarea>`) + inp('size', '字号', 'range', 'min="6" max="160"') + inp('angle', '角度', 'range', 'min="-90" max="90"') + inp('spacing', '字距', 'range', 'min="0" max="3" step="0.05"') + inp('color', '颜色', 'color') + field('', `<label class="ck"><input type="checkbox" data-ock="box" ${o.box ? 'checked' : ''}> 标题框</label><label class="ck"><input type="checkbox" data-ock="italic" ${o.italic ? 'checked' : ''}> 斜体</label>`);
    if (k === 'rivers') h += inp('name', '名称') + inp('width', '河口宽度', 'range', 'min="0.6" max="8" step="0.2"') + '<p class="muted">拖动黄色节点修改形状，双击线段加节点，双击节点删节点。</p>';
    if (k === 'lines') h += sel_('style', '样式', App.LINE_STYLES) + inp('color', '颜色(可选)', 'color') + '<p class="muted">拖动节点修改，双击增删节点。</p>';
    if (k === 'arrows') h += nat('nation') + inp('width', '宽度', 'range', 'min="4" max="40"');
    if (k === "nationLabel") h += inp("name", "国名") + "<p class=\"muted\">国名固定显示在领土最宽处。</p>";
    if (k === "provLabel") h += inp("name", "名称") + `<p class="muted">${App.levelName(App.nation(o.nation), o.level || 1)}（${["", "一", "二", "三"][o.level || 1]}级），名字固定在区域内。</p>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-o]').forEach((i) => {
      i.onfocus = () => App.pushUndo();
      i.oninput = () => { let v = i.value; if (i.type === 'range' || i.dataset.numv) v = +v; o[i.dataset.o] = v; App.R.request(); };
      i.onchange = () => { App.changed({}); if (k === 'nationLabel') UI.refresh(); };
    });
    box.querySelectorAll('[data-ock]').forEach((i) => (i.onchange = () => { App.pushUndo(); o[i.dataset.ock] = i.checked; App.changed({}); }));
    box.querySelector('[data-sact=del]').onclick = () => {
      if (k === 'provLabel') { App.pushUndo(); o.name = ''; T().select(null); App.changed({}); return; }
      T().deleteSel();
    };
    box.querySelector('[data-sact=rnd]').onclick = () => {
      App.pushUndo();
      const c = App.Ops.cellAt(o.x ?? 0, o.y ?? 0), nn = App.nation(k === 'nationLabel' ? o.id : k === 'provLabel' ? o.nation : c >= 0 ? App.S.owner[c] : 0);
      const cul = nn ? nn.culture : 'huaxia';
      if (k === 'nationLabel') o.name = App.Names.nation(cul); else if (k === "provLabel") Object.assign(o, App.Names.provFor(App.nation(o.nation), o.level || 1)); else if ('name' in o || k === 'cities') o.name = App.Names.city(cul);
      App.changed({ ui: true });
    };
  };
  UI.focusField = (key) => { const i = document.querySelector(`#selBox [data-o=${key}]`); if (i) { i.focus(); i.select && i.select(); } };

  // ---------- 对话框 ----------
  const modal = (html, onBind) => {
    const m = $('#modal'); m.innerHTML = `<div class="dlg">${html}</div>`; m.hidden = false;
    m.onclick = (e) => { if (e.target === m) m.hidden = true; };
    m.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => (m.hidden = true)));
    onBind && onBind(m);
  };
  UI.modal = modal;
  UI.newDialog = () => modal(`<h3>新建地图</h3>
    <div class="opts3">
      <div class="card"><h4>亚洲模板</h4><p class="muted">你那张图的真实亚洲地理：海岸线、山脉、沙漠、森林、河流、湖泊、气候都在，但没有任何国家，直接用「彩笔」涂色。</p><button class="btn pri" id="nAsia">载入亚洲模板</button>
        <h4 style="margin-top:14px">欧洲模板</h4><p class="muted">西欧、东欧、北欧、南欧，加北非地中海沿岸、土耳其与西亚、阿拉伯半岛大部分。真实地理、无国家，直接涂色。</p><button class="btn pri" id="nEurope">载入欧洲模板</button>
        <h4 style="margin-top:14px">天汉历626年</h4><p class="muted">同一张亚洲地图，加上汉、西域盟大汗国、东瀛国等势力、城市和家族的完整示例。</p><button class="btn" id="nPreset">载入示例</button></div>
      <div class="card"><h4>随机大陆</h4>
        <div class="grid2">${field('大陆数量', '<input type="number" id="gK" value="3" min="1" max="7">')}${field('陆地比例', '<input type="range" id="gL" value="0.4" min="0.2" max="0.7" step="0.02">')}</div>
        ${field('海岛 / 群岛', '<select id="gI"><option value="0">没有</option><option value="1">少量</option><option value="2" selected>中等</option><option value="3">很多（群岛）</option></select>')}
        ${field('海岸破碎度（海湾、半岛多少）', '<input type="range" id="gR" value="0.6" min="0" max="1" step="0.05">')}
        ${field('气候范围', `<select id="gB">${Object.entries(App.Gen.BANDS).map(([k, b]) => `<option value="${k}">${b.name}</option>`).join('')}</select>`)}
        <label class="ck"><input type="checkbox" id="gNat"> 同时生成国家、城市和家族</label>
        <div id="gNatOpts" hidden><div class="grid2">${field('国家数量', '<input type="number" id="gN" value="12" min="2" max="60">')}${field('文明', `<select id="gC"><option value="mixed">混合</option><option value="zh">东方诸文明</option><option value="latin">西方诸文明</option>${App.CULTURES.map((c) => `<option value="${c.id}">仅${c.name}</option>`).join('')}</select>`)}</div></div>
        ${field('种子（同一个种子生成同一张图）', '<input type="text" id="gS" placeholder="留空随机">')}
        <button class="btn pri" id="nRand">生成大陆</button></div>
      <div class="card"><h4>空白画布</h4><p class="muted">一整张空白羊皮纸，用「彩笔」直接涂色；需要海洋就用「陆海」工具画。</p><button class="btn" id="nBlank">创建空白地图</button></div>
    </div><div class="row end"><button class="btn" data-close>取消</button></div>`, (m) => {
    $('#gNat', m).onchange = (e) => ($('#gNatOpts', m).hidden = !e.target.checked);
    $('#nBlank', m).onclick = () => { T().sel = null; m.hidden = true; App.Gen.blank(); App.afterBigChange(); App.R.fit(); T().set('color'); };
    $('#nAsia', m).onclick = () => { m.hidden = true; UI.loadPreset('asia'); };
    $("#nEurope", m).onclick = () => { m.hidden = true; UI.loadPreset("europe"); };
    $('#nRand', m).onclick = () => { T().sel = null;
      const s = $('#gS', m).value.trim(); m.hidden = true;
      const o = { continents: +$('#gK', m).value || 3, land: +$('#gL', m).value, islands: +$('#gI', m).value, rough: +$('#gR', m).value, band: $('#gB', m).value,
        nations: $('#gNat', m).checked ? +$('#gN', m).value || 12 : 0, culture: $('#gC', m).value,
        seed: s ? (isNaN(+s) ? [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) : +s) : undefined };
      UI.busy('正在生成大陆与气候…', () => {
        const seed = App.Gen.random(o);
        T().activeNation = 0; T().activeProv = 0; App.afterBigChange(); App.R.fit(); if (!o.nations) T().set('color');
        UI.toast('种子：' + seed + '（记下它可以再次生成同一张图）');
      });
    };
    $('#nPreset', m).onclick = () => { m.hidden = true; UI.loadPreset('tianhan'); };
  });
  UI.loadPreset = (which = 'tianhan') => { T().sel = null;
    UI.busy('正在载入真实地理数据…', async () => {
      try { await App.Preset[which](); T().activeNation = 0; App.afterBigChange(); App.R.fit(); if (which === "asia" || which === "europe") T().set("color"); } catch (e) { console.error(e); UI.toast('载入失败：' + e.message); }
    });
  };
  UI.busy = (msg, fn) => {
    const b = $('#busy'); b.textContent = msg; b.hidden = false;
    setTimeout(async () => { try { await fn(); } finally { b.hidden = true; } }, 40);
  };
  UI.saveJson = () => {
    const blob = new Blob([JSON.stringify(App.serialize(true))], { type: 'application/json' });
    download(blob, (App.S.meta.name || '地图') + '.json');
  };
  UI.exportDialog = () => modal(`<h3>导出图片</h3><p class="muted">导出整张地图为 PNG。</p>
    <div class="row wrap"><button class="btn pri" data-s="1">标准 (2560×1600)</button><button class="btn pri" data-s="2">高清 (5120×3200)</button></div><div class="row end"><button class="btn" data-close>取消</button></div>`, (m) => {
    m.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => {
      m.hidden = true;
      UI.busy('正在渲染…', () => new Promise((res) => App.R.exportPNG(+b.dataset.s).toBlob((bl) => { download(bl, (App.S.meta.name || '地图') + '.png'); res(); App.R.request(); }, 'image/png')));
    }));
  });
  const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  UI.help = () => {
    const K = (s) => s.split(' ').map((x) => `<kbd>${x}</kbd>`).join(' ');
    const row = (k, d) => `<div><span>${d}</span><span>${k}</span></div>`;
    const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
    modal(`<h3>快捷键（按 <kbd>?</kbd> 随时打开）</h3><div class="keys">
      <h4>移动与视图</h4>
      ${row(K('W A S D') + ' / ' + K('↑ ← ↓ →'), '移动地图（按住连续移动）')}
      ${row(K('Shift'), '配合移动 / 缩放：加速')}
      ${row(K('Q') + ' ' + K('E') + ' / ' + K('-') + ' ' + K('='), '缩小 / 放大（以鼠标为中心）')}
      ${row('滚轮', '缩放；触控板双指：移动；双指捏合：缩放')}
      ${row(K('空格') + ' + 拖动 / 右键或中键拖动', '拖动地图')}
      ${row(K('Home'), '回到全图')}
      ${row(K('Tab'), '隐藏 / 显示右侧面板')}
      ${row(K('Alt') + ' + ' + K('1') + K('2') + K('3'), '切换显示 一级 / 二级 / 三级 行政区')}
      <h4>工具</h4>
      ${row(K('1') + ' / ' + K('B'), '彩笔')}${row(K('2') + ' / ' + K('V'), '选择')}
      ${row(K('3') + ' / ' + K('L'), '陆海')}${row(K('4') + ' / ' + K('T'), '地貌 / 气候')}
      ${row(K('5') + ' / ' + K('F'), '森林')}${row(K('6') + ' / ' + K('R'), '河流')}
      ${row(K('7') + ' / ' + K('N'), '国家')}${row(K('8') + ' / ' + K('P'), '行政区')}
      ${row(K('9') + ' / ' + K('C'), '城市')}${row(K('0') + ' / ' + K('J'), '军队')}
      ${row(K('H'), '平移')}${row(K('K'), '线条')}${row(K('U'), '进军箭头')}${row(K('M'), '标记')}${row(K('X'), '文字')}
      <h4>国家</h4>
      ${row(K('I'), '国家档案（当前高亮或选中的国家）')}${row(K('O'), '国力排名')}
      <h4>画笔</h4>
      ${row(K('[') + ' ' + K(']'), '笔刷变小 / 变大（加 Shift 每次 5）')}
      ${row(K('Alt') + ' + 滚轮', '调笔刷大小')}
      ${row(K('Z'), '切换 涂色 / 橡皮')}
      ${row(K('G'), '切换 笔刷 / 油漆桶')}
      ${row('按住 ' + K('Alt') + ' 涂', '临时不受锁定限制')}
      ${row(K('Enter') + ' / ' + K('Esc'), 'AI 修边：修整 / 保留原样')}
      <h4>编辑与文件</h4>
      ${row(K(mod) + ' + ' + K('Z'), '撤销')}${row(K(mod) + ' + ' + K('Shift') + ' + ' + K('Z') + ' / ' + K(mod) + ' + ' + K('Y'), '重做')}
      ${row(K('Delete') + ' / ' + K('Backspace'), '删除选中的对象')}
      ${row(K('Esc'), '取消高亮 → 取消选中 → 回到选择工具')}
      ${row('双击', '改名；折线上双击增删节点')}
      ${row(K(mod) + ' + ' + K('S'), '保存为 JSON')}${row(K(mod) + ' + ' + K('O'), '打开 JSON')}${row(K(mod) + ' + ' + K('E'), '导出图片')}
    </div>
    <div class="help"><p><b>基本流程：</b>选「彩笔」直接涂色，同色区域自动成为一块势力；在「国家」页给它起名、选行政区划制度、一键划分行政区；再放城市、军队、进军箭头和文字。地图会自动保存在浏览器里。</p></div>
    <div class="row end"><button class="btn pri" data-close>好的</button></div>`);
  };

  const loaded = new Set();
  const loadFont = (f) => {
    if (loaded.has(f)) return; loaded.add(f);
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;700;900&display=swap`;
    document.head.appendChild(l);
    setTimeout(() => document.fonts && document.fonts.load(`700 20px "${f}"`, '汉字Ab').then(() => App.R.request()), 300);
  };
  UI.loadFont = loadFont;
})();

// ---- 行政区下拉（按层级缩进）、省/道/府显示切换 ----
(() => {
  const UI = App.UI;
  UI.provOptions = () => {
    const ps = App.S.provinces.filter((p) => p.nation === App.Tools.activeNation), out = [];
    const walk = (pid, lv) => ps.filter((p) => (p.level || 1) === lv && (lv === 1 || p.parent === pid)).forEach((p) => {
      out.push(`<option value="${p.id}" ${p.id === App.Tools.activeProv ? 'selected' : ''}>${'　'.repeat(lv - 1)}${App.levelName(App.nation(App.Tools.activeNation), lv)}·${U.esc(p.name)}</option>`);
      if (lv < 3) walk(p.id, lv + 1);
    });
    walk(0, 1); return out.join('');
  };
  UI.syncLv = () => {
    document.querySelectorAll('#lvBtns [data-lv]').forEach((b) => b.classList.toggle('on', !!App.S.meta['lv' + b.dataset.lv]));
  };
  UI.initLv = () => {
    const box = document.getElementById('lvBtns'); if (!box) return;
    box.innerHTML = '<span>行政区</span>' + [1, 2, 3].map((lv) => `<button class="chip" data-lv="${lv}">${["", "一级", "二级", "三级"][lv]}</button>`).join("");
    box.onclick = (e) => {
      const b = e.target.closest('[data-lv]'); if (!b) return;
      const k = 'lv' + b.dataset.lv;
      if (e.shiftKey || e.metaKey || e.ctrlKey) { [1, 2, 3].forEach((l) => (App.S.meta['lv' + l] = String(l) === b.dataset.lv)); }
      else App.S.meta[k] = !App.S.meta[k];
      UI.syncLv(); App.R.request(); App.autosave(); if (UI.tab === 'layers') UI.refresh();
    };
    UI.syncLv();
  };
})();

// ---- 彩色画笔色板 ----
(() => {
  const UI = App.UI;
  UI.SWATCHES = ['#c8584a', '#d9894f', '#d8b45a', '#b9a46a', '#9fae5c', '#6f9a6a', '#5f8f95', '#5b7aa6', '#7d6aa8', '#a9688a', '#b56f5e', '#a07a5a',
    '#e0a3a0', '#e6c08e', '#c9c98a', '#a9c9a0', '#9cc4c9', '#a8b6d8', '#c7aed8', '#8a8a8a'];
  UI.colorBar = () => {
    const cur = (App.Tools.opt.color || '').toLowerCase();
    const used = new Set(App.S.nations.map((n) => n.color.toLowerCase()));
    return `<div class="swatches">${UI.SWATCHES.map((c) => `<button class="sw ${c === cur ? 'on' : ''} ${used.has(c) ? 'used' : ''}" data-sw="${c}" style="background:${c}" title="${c}"></button>`).join('')}<label class="cpick" title="自定义颜色"><input type="color" data-cpick="1" value="${cur || '#c8584a'}"></label></div>`;
  };
})();

// ---- 行政区划制度下拉：本文明的制度排在前面 ----
App.UI.sysOptions = (n) => {
  const cur = App.sysKey(n), all = Object.entries(App.ADMIN_SYS);
  const mine = all.filter(([, s]) => s.cul === n.culture), other = all.filter(([, s]) => s.cul !== n.culture);
  const o = ([k, s]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${s.name}${s.levels === 2 ? '（两级）' : ''}</option>`;
  return (mine.length ? `<optgroup label="本文明">${mine.map(o).join('')}</optgroup>` : '') + `<optgroup label="其他文明">${other.map(o).join('')}</optgroup>`;
};

// ---- 笔刷锁定开关 ----
App.UI.lockBar = () => {
  const o = App.Tools.opt, prov = App.Tools.cur === 'prov';
  const L = [['lockOther', prov ? '锁定他区' : '锁定他国', prov ? '不覆盖本国其他同级行政区' : '只涂无主之地，不覆盖别国'], ['lockRiver', '以河为界', '笔刷碰到河流就停'], ['lockMtn', '以山为界', '不涂山地、雪山，沿山脉成界'], ['lockSea', '以海为界', '只涂与笔刷中心相连的陆地，不跨海峡']];
  return `<span class="lockbar"><span class="grp">🔒 锁定</span>${L.map(([k, n, t]) => `<button class="chip lock ${o[k] ? 'on' : ''}" data-lock="${k}" title="${t}">${n}</button>`).join('')}<button class="chip lock ${o.askRefine !== false ? "on" : ""}" data-lock="askRefine" title="每画完一笔，询问是否用 AI 修整成更像真实疆界的线">✨ 画完询问 AI 修边</button><span class="hint">按住 Alt 临时不受限制</span></span>`;
};

// ---- 领土信息：面积、块数、飞地定位 ----
App.UI.territoryInfo = (n) => {
  const comps = App.Geo.nationComps(n.id); if (!comps.length) return '<p class="muted">还没有领土。</p>';
  const total = comps.reduce((a, k) => a + k.n, 0), ex = comps.slice(1);
  let h = `<div class="terr"><div class="row"><b>领土</b>&nbsp;${total} 格 · ${comps.length} 块${ex.length ? `（本土 + ${ex.length} 块飞地）` : '（连成一片）'}<button class="btn small" data-zoom="${n.id}" data-comp="all">全国</button></div>`;
  if (ex.length) h += `<div class="exl">${ex.slice(0, 12).map((k, i) => `<button class="chip" data-zoom="${n.id}" data-comp="${i + 1}">飞地 ${i + 1} · ${k.n}格 ⌖</button>`).join('')}${ex.length > 12 ? `<span class="hint">…另有 ${ex.length - 12} 块</span>` : ''}</div>`;
  return h + '</div>';
};
