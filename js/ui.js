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
    war: '<path d="M4 20l5-5M3 21l2-2M14.5 3.5L20 3l-.5 5.5L9 19l-4-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 12l6 6" stroke="currentColor" stroke-width="1.8"/>',
    wall: '<path d="M2 17h20v4H2zM3 13h3v4H3zM8 13h3v4H8zM13 13h3v4h-3zM18 13h3v4h-3zM9 6h6v11H9z"/><path d="M9 4h1.5v2H9zM11.25 4h1.5v2h-1.5zM13.5 4H15v2h-1.5z"/>',
    city: '<path d="M3 21V10l4-3 4 3v11zM13 21V5l4-2 4 2v16z"/>',
    army: '<rect x="3" y="6" width="18" height="12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 6l18 12M21 6L3 18" stroke="currentColor" stroke-width="1.6"/>',
    arrow: '<path d="M3 17c4-1 8-5 11-9l-3-1 8-4-1 9-2-3c-3 4-7 8-12 10z"/>',
    marker: '<path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="2.6"/><path d="M4 8l4-4M16 4l4 4" stroke="currentColor" stroke-width="2"/>',
    text: '<path d="M4 5h16v3h-6v12h-4V8H4z"/>',
  };
  const TOOLS = [['color', '彩笔', '1 / B'], ['select', '选择', '2 / V'], ['pan', '平移', 'H'], ['land', '陆海', '3 / L'], ['terrain', '地貌', '4 / T'], ['forest', '森林', '5 / F'], ['river', '河流', '6 / R'],
    ['nation', '国家', '7 / N'], ['prov', '行政区', '8 / P'], ['war', '征服', 'G'], ['line', '线条', 'K'], ['wall', '长城', 'Y'], ['city', '城市', '9 / C'], ['army', '军队', '0 / J'], ['arrow', '进军', 'U'], ['marker', '标记', 'M'], ['text', '文字', 'X']];

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
      try { App.deserialize(JSON.parse(await f.text())); App.afterBigChange(); App.R.fit(); UI.toast('已打开：' + f.name); setTimeout(() => UI.histCheck && UI.histCheck(), 600); } catch (err) { UI.toast('打开失败：' + err.message); }
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
    // 现在年份：改了以后自动检查各国建国年
    $('#mapYear').addEventListener('change', (e) => {
      const y = Math.round(+e.target.value); if (!isFinite(y)) return;
      App.pushUndo(); App.S.meta.year = y;
      const k = App.Polity.yearChanged ? App.Polity.yearChanged() : 0;
      const main = App.nation(App.S.meta.mainNation);
      App.changed({ ui: true });
      UI.toast('现在是 ' + (y < 0 ? '公元前 ' + -y : y) + ' 年' + (k ? '，已调整 ' + k + ' 个国家的建国年' : '') + (main && App.Polity.founded(main) > y ? '（注意：主国「' + main.name + '」的建国年晚于现在）' : ''));
    });
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
        s += ` · ${tn}${cl && t >= 2 ? ' · ' + cl.name + '气候' : ''}${f ? ' · ' + f : ''}${n ? ' · ' + n.name : ''}${p ? ' · ' + p.name : ''}${App.Pop && p && App.Pop.provSoft(p.id) ? '（人口约 ' + App.Pop.str(App.Pop.provSoft(p.id)) + '）' : ''}${App.Pop && S.prov2[c] && App.province(S.prov2[c]) && App.Pop.provSoft(S.prov2[c]) ? ' · ' + App.province(S.prov2[c]).name + '（' + App.Pop.str(App.Pop.provSoft(S.prov2[c])) + '）' : ''}`;
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
      case 'war': {
        const nopt = (cur) => App.S.nations.map((n) => `<option value="${n.id}" ${n.id === cur ? 'selected' : ''}>${U.esc(n.name) || '（未命名）'}</option>`).join('');
        h = `<label>进攻方 <select data-act="activeNation"><option value="0">— 选择国家 —</option>${nopt(T().activeNation)}</select></label>` + chips('warMode', App.War.MODES)
          + `<label>只打 <select data-act="warTarget"><option value="0">任意敌国</option>${nopt(o.warTarget)}</select></label>`;
        if (o.warMode === 'brush') h += brush() + `<button class="chip lock ${o.lockRiver ? 'on' : ''}" data-lock="lockRiver" title="笔刷碰到河流就停">以河为界</button><button class="chip lock ${o.lockMtn ? 'on' : ''}" data-lock="lockMtn" title="不越过山地">以山为界</button><button class="chip lock ${o.warWild ? 'on' : ''}" data-lock="warWild" title="连无主之地一起占">也占无主地</button><span class="hint">涂过的敌国领土归进攻方，变成无名空白区；没被吃干净的行政区保留剩下部分</span>`;
        else h += `<span class="hint">把鼠标移到敌国领土上会高亮整块${['', '一级', '二级', '三级'][+o.warMode.slice(1)]}行政区，点一下就整块吞并（名称和下级都保留）</span>`;
        break;
      }
      case 'nation': h = nationPick() + chips('fill', [{ id: false, name: '笔刷' }, { id: true, name: '油漆桶' }]) + chips('erase', [{ id: false, name: '涂色' }, { id: true, name: '橡皮' }]) + brush(); break;
      case "prov": h = nationPick() + UI.provPicker() +"" + chips('fill', [{ id: false, name: '笔刷' }, { id: true, name: '油漆桶' }]) + chips('erase', [{ id: false, name: '涂色' }, { id: true, name: '橡皮' }]) + brush(); break;
      case 'line': h = chips('lineStyle', App.LINE_STYLES) + '<span class="hint">按住拖动绘制</span>'; break;
      case 'wall': h = chips('wallType', App.Walls.TYPES) + `<button class="chip lock ${o.wallTowers ? 'on' : ''}" data-lock="wallTowers">敌楼 / 烽燧</button><button class="chip lock ${o.wallRidge ? 'on' : ''}" data-lock="wallRidge">画完询问沿山脊修整</button><button class="chip lock ${o.wallPass ? 'on' : ''}" data-lock="wallPass">穿河过路自动设关</button>` + '<span class="hint">按住拖动画长城，松开后可在「选择」工具里改样式、起名</span>'; break;
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
    bar.querySelectorAll('[data-act=activeProv]').forEach((s) => (s.onchange = () => { T().activeProv = +s.value; UI.refresh(); UI.refreshTool(); }));
    // 搜索：输入名字（可只输一部分）回车或选中提示即可定位
    bar.querySelectorAll('[data-act=provSearch]').forEach((i) => (i.onchange = () => {
      const q = i.value.trim().replace(/（.*$/, ''); if (!q) return;
      const ps = App.S.provinces.filter((p) => p.nation === T().activeNation && (p.level || 1) === 1);
      const hit = ps.find((p) => p.name === q) || ps.find((p) => p.name.includes(q));
      if (!hit) { UI.toast('没有找到「' + q + '」'); return; }
      T().activeProv = hit.id; UI.refresh(); UI.refreshTool(); UI.toast('已选中 ' + hit.name);
    }));
    bar.querySelectorAll('[data-act=provRedivide]').forEach((b) => (b.onclick = () => { let p = App.province(T().activeProv); if (p && (p.level || 1) > 1) p = App.Ops.ancestors(p).find((q) => (q.level || 1) === 1); if (!p) return; App.pushUndo(['prov', 'prov2', 'prov3']); App.Ops.autoProvinces(p.nation, 0, Math.random, { keepL1: true, only: p.id }); App.changed({ pol: true, ui: true }); UI.refreshTool(); UI.toast('已重新划分「' + p.name + '」里的下级'); }));
    bar.querySelectorAll('[data-act=provPick]').forEach((b) => (b.onclick = () => { T().provPick = !T().provPick; UI.refreshTool(); if (T().provPick) UI.toast('在地图上点一下要选的行政区（选最细一级，可再用下拉框往上选）'); }));
    bar.querySelectorAll('[data-act=warTarget]').forEach((s) => (s.onchange = () => { o.warTarget = +s.value; App.R.request(); }));
    $('#stage').dataset.tool = T().cur;
  };

  // ---------- 右侧面板 ----------
  UI.refresh = () => {
    if (UI.syncLv) UI.syncLv();
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === UI.tab));
    $('#mapName').value = App.S.meta.name || '';
    if ($('#mapYear') && document.activeElement !== $('#mapYear')) $('#mapYear').value = App.S.meta.year ?? 1;
    const p = $('#tabBody');
    // 重绘面板时保留滚动位置（同一页内操作不跳回顶部）
    const panel = $('#panel'), sameTab = UI._lastTab === UI.tab;
    const keepTop = sameTab ? panel.scrollTop : 0, keepLists = sameTab ? [...p.querySelectorAll('.list,.elist')].map((l) => l.scrollTop) : [];
    p.innerHTML = UI['tab_' + UI.tab]();
    UI._lastTab = UI.tab;
    if (sameTab) { p.querySelectorAll('.list,.elist').forEach((l, i) => { if (keepLists[i]) l.scrollTop = keepLists[i]; }); panel.scrollTop = keepTop; }
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
    const MS = T().multi || new Set();
    if (S.nations.length > 1) h += '<p class="muted" style="margin:4px 0">' + (MS.size ? '已选 ' + MS.size + ' 个国家，批量修改面板在列表下方 ↓（Esc 清空）' : '勾选方框或 Shift / Ctrl + 点击可多选国家，批量设附庸、改国体等。') + '</p>';
    h += '<ul class="list">' + S.nations.map((n) => `<li class="${n.id === T().activeNation ? 'on' : ''} ${MS.has(n.id) ? 'msel' : ''}" data-nation="${n.id}"><input type="checkbox" class="mck" data-mck="${n.id}" ${MS.has(n.id) ? 'checked' : ''} title="多选"><i style="background:${n.color}"></i><span>${U.esc(n.name) || "（未命名）"}</span><small>${App.Polity.title(n).name}${n.overlord ? '·附庸' : ''} · ${counts.get(n.id) || 0}格</small></li>`).join('') + '</ul>';
    if (!S.nations.length) h += '<p class="muted">还没有国家。新建一个，然后用左侧「国家」工具在地图上涂色。</p>';
    if (UI.multiCard) h += UI.multiCard();
    if (an && !MS.size) {  // 多选时不显示单个国家的编辑卡片
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
        ${UI.adminBasis(an, 'data-act="histAdmin"')}
        <div class="row wrap"><button class="btn" data-act="autoProv">重新划分全部</button><button class="btn" data-act="autoSub">保留${App.levelName(an, 1)}，只细分下级</button></div>
        <div class="row wrap"><button class="btn" data-act="autoCity" title="数量看可用土地，大小看地貌、气候、河流、海岸">按地理补充城市</button><button class="btn" data-act="autoArmy">按国力生成军队</button><button class="btn danger" data-act="delNation">删除国家</button></div></div>`;
    }
    h += `<div class="row wrap"><button class="btn pri" data-act="fillBlank" title="把地图上所有无主的陆地按地区文化生成国家（行政区、城市、军队、统治家族一起生成）">一键生成空白地区的国家</button><button class="btn" data-act="autoAll">一键划分所有国家的行政区</button><button class="btn" data-act="recolor">相邻国家自动配色</button><button class="btn" data-act="family">家族 / 族谱…</button><button class="btn" data-act="power">国力排名</button></div>`;
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
      return `<li class="lv${lv} ${p.id === T().activeProv ? 'on' : ''}" data-prov="${p.id}"><em data-ptog="${p.id}">${sub.length ? (open ? '▾' : '▸') : '·'}</em><span>${U.esc(p.name)}</span><small>${App.levelName(an, lv)}${sub.length ? ' · ' + sub.length : ''}${App.Pop ? ' · ' + App.Pop.str(App.Pop.prov(p.id)) + '人' : ''}</small></li>` + (open ? sub.map(row).join('') : '');
    };
    let h = `<div class="row"><b style="color:${an.color}">■</b>&nbsp;${U.esc(an.name)} 的行政区</div>
      <div class="row wrap"><button class="btn pri" data-act="addProv">＋ 新建${App.levelName(an, 1)}</button></div><p class="muted">制度：${App.sysOf(an).name}（在「国家」页修改）</p><div></div>`;
    const orphans = ps.filter((p) => (p.level || 1) > 1 && !ps.some((q) => q.id === p.parent));
    h += '<ul class="list ptree">' + kids(0, 1).map(row).join('') + (orphans.length ? '<li class="muted" style="cursor:default">— 新占领 / 未编入上级 —</li>' + orphans.map(row).join('') : '') + '</ul>';
    if (!ps.length) h += '<p class="muted">新建省后，可在省下面建道、在道下面建府；选中后用左侧「行政区」工具在本国领土内涂抹。也可以回到「国家」页一键自动划分。</p>';
    const ap = App.province(T().activeProv);
    if (ap && ap.nation === an.id) {
      const lv = ap.level || 1, par = App.province(ap.parent);
      h += `<div class="card"><h4>编辑${App.levelName(an, lv)}（${["", "一", "二", "三"][lv]}级）</h4>${par ? `<p class="muted">隶属：${U.esc(par.name)}</p>` : ''}
      ${field('名称', `<div class="row"><input type="text" data-p="name" value="${U.esc(ap.name)}"><button class="btn" data-act="rndProv">🎲</button></div>`)}
      ${App.Pop ? `<p class="muted">人口约 ${App.Pop.str(App.Pop.prov(ap.id))}${App.Pop.basis(ap.id) ? `（史载 ${App.Pop.str(App.Pop.basis(ap.id).rec)}${App.Pop.basis(ap.id).cover < 1 ? '，本国占其中 ' + Math.round(App.Pop.basis(ap.id).cover * 100) + '%' : ''}）` : '（按地理推算）'}</p>` : ''}
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
    p.querySelectorAll('[data-nation]').forEach((li) => (li.onclick = (ev) => {
      if (ev.target.classList && ev.target.classList.contains('mck')) return;
      if (li.closest('.list') && (ev.shiftKey || ev.ctrlKey || ev.metaKey) && UI.toggleMulti) { UI.toggleMulti(+li.dataset.nation); return; }
      T().highlight(+li.dataset.nation);
    }));
    p.querySelectorAll('[data-mck]').forEach((c) => (c.onchange = () => UI.toggleMulti(+c.dataset.mck)));
    if (UI.bindMulti) UI.bindMulti(p);
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
    act('rndName', () => { App.pushUndo(); an.name = App.Names.nationFor(an); App.changed({ ui: true }); UI.refreshTool(); });
    act('nCulture', (b) => { App.pushUndo(); an.culture = b.value; App.changed({ ui: true }); });
    act('rndAll', () => { App.pushUndo(); App.Ops.renameAll(an.id); App.changed({ ui: true }); UI.refreshTool(); });
    act('provK', (b) => (UI.provK = +b.value));
    act("autoSub", () => { App.pushUndo(["prov", "prov2", "prov3"]); App.Ops.autoProvinces(an.id, 0, Math.random, { keepL1: true }); App.changed({ pol: true, ui: true }); });
    act("family", () => App.Family.show());
    act('power', () => UI.powerDialog());
    act('fillBlank', () => {
      App.pushUndo(['owner', 'prov', 'prov2', 'prov3']);
      UI.busy ? UI.busy('正在按地区文化生成国家…', run) : run();
      function run() {
        const made = App.Fill.fillBlank();
        App.changed({ pol: true, ui: true });
        if (!made.length) { UI.toast('地图上没有空白的陆地了'); return; }
        const cs = {}; made.forEach((n) => { const nm = App.CULTURES.find((c) => c.id === n.culture)?.name || n.culture; cs[nm] = (cs[nm] || 0) + 1; });
        const main = App.nation(App.S.meta.mainNation);
        UI.toast('生成 ' + made.length + ' 个国家：' + Object.entries(cs).map(([k, v]) => k.replace(/（.*）/, '') + v).join('、') + (main ? '；建国年按主国「' + main.name + '」前后 300 年' : ''));
      }
    });
    act('profile', () => UI.profile(an.id));
    act('mkDyn', () => { const f = App.Polity.dynasty(an); if (f && !confirm('重新生成「' + an.name + '」的统治家族？原家族会保留。')) return; App.pushUndo(); if (f) f.ruling = 0; App.Polity.makeDynasty(an); App.changed({ ui: true }); UI.toast('已生成 ' + App.Polity.dynasty(an).name + '（' + App.Polity.title(an).house + '）'); });
    if (an && UI.bindPolityFields) UI.bindPolityFields(p, an, () => UI.refreshTool());
    act('adminSys', (b) => { const ns = App.ADMIN_SYS[b.value], has = S.provinces.some((p) => p.nation === an.id); if (has && !confirm('切换为「' + ns.name + '」？\n已有行政区会保留地名、改成新的级别名称' + (ns.levels < 3 ? '，并删除第三级' : '') + '。')) { UI.refresh(); return; } App.pushUndo(['prov', 'prov2', 'prov3']); App.Ops.setAdminSys(an, b.value); App.changed({ pol: true, ui: true }); UI.refreshTool(); });
    act('autoAll', () => { const redo = App.S.provinces.length && confirm('已有行政区的国家也重新划分吗？\n确定＝全部重新划分，取消＝只划分还没有行政区的'); App.pushUndo(['prov', 'prov2', 'prov3']); const k = App.Ops.autoAllProvinces(redo); App.changed({ pol: true, ui: true }); UI.toast('已划分 ' + k + ' 个国家'); });
    act("autoProv", () => { App.pushUndo(["prov", "prov2", "prov3"]); UI.histToast(App.Ops.autoProvinces(an.id, UI.provK || 0)); App.changed({ pol: true, ui: true }); });
    act('histAdmin', (b) => { an.histAdmin = b.checked; App.autosave(); UI.refresh(); });
    if (an && UI.bindHistGo) UI.bindHistGo(p, an);
    act('autoCity', () => { App.pushUndo(); const k = App.Ops.autoCities(an.id).length; App.changed({ ui: true }); UI.toast(k ? '新增 ' + k + ' 座城市' : '可用土地有限，没有合适的新城址'); });
    act('autoArmy', () => { App.pushUndo(); const k = App.Polity.genArmies(an).length; App.changed({ ui: true }); UI.toast(k ? '生成 ' + k + ' 支部队' : '兵力已足够'); });
    act('delNation', () => { if (!confirm(`删除「${an.name}」？（可撤销）`)) return; App.pushUndo(["owner", "prov", "prov2", "prov3"]); App.Ops.deleteNation(an.id); T().activeNation = 0; App.changed({ pol: true, ui: true }); UI.refreshTool(); });
    act('recolor', () => { App.pushUndo(); App.Ops.recolor(); App.changed({ pol: true, ui: true }); });
    act("addSub", () => { App.pushUndo(); const pr = App.Ops.addProvince(an.id, null, (ap.level || 1) + 1, ap.id); UI.provOpen = UI.provOpen || {}; UI.provOpen[ap.id] = true; T().activeProv = pr.id; T().set("prov"); App.changed({ ui: true }); });
    act("addProv", () => { App.pushUndo(); const pr = App.Ops.addProvince(an.id, null, 1, 0); T().activeProv = pr.id; T().set('prov'); App.changed({ ui: true }); });
    act('rndProv', () => { App.pushUndo(); App.PlaceNames.fitProvince(ap); App.changed({ ui: true }); });
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
    if (k === 'lines') h += sel_('style', '样式', App.LINE_STYLES) + (o.style === 'wall' ? inp('name', '名称（可选，如「秦长城」）') + sel_('wall', '长城样式', App.Walls.TYPES) + field('敌楼 / 烽燧', `<select data-o="towers" data-bool="1"><option value="true" ${o.towers !== false ? 'selected' : ''}>显示</option><option value="false" ${o.towers === false ? 'selected' : ''}>不显示</option></select>`) : '') + inp('color', '颜色(可选)', 'color') + '<p class="muted">拖动节点修改，双击增删节点。</p>';
    if (k === 'arrows') h += nat('nation') + inp('width', '宽度', 'range', 'min="4" max="40"');
    if (k === "nationLabel") h += inp("name", "国名") + "<p class=\"muted\">国名固定显示在领土最宽处。</p>";
    if (k === "provLabel") h += inp("name", "名称") + `<p class="muted">${App.levelName(App.nation(o.nation), o.level || 1)}（${["", "一", "二", "三"][o.level || 1]}级），名字固定在区域内。</p>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-o]').forEach((i) => {
      i.onfocus = () => App.pushUndo();
      i.oninput = () => { let v = i.value; if (i.type === 'range' || i.dataset.numv) v = +v; if (i.dataset.bool) v = v === 'true'; o[i.dataset.o] = v; App.R.request(); };
      i.onchange = () => { App.changed({}); if (k === 'nationLabel') UI.refresh(); if (i.dataset.o === 'style') UI.showSelection(); };
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
      if (k === 'nationLabel') o.name = App.Names.nationFor(o); else if (k === "provLabel") App.PlaceNames.fitProvince(o); else if (k === 'cities') o.name = App.Names.city(cul, undefined, o.x, o.y); else if ('name' in o) o.name = App.Names.city(cul);
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
      ${row(K('Alt') + ' + ' + K('1') + K('2') + K('3'), '切换显示 一级 / 二级 / 三级 行政区')}${row('左下角 地图：政区 / 地形 / 综合', '政区图不画山林河流；地形图不画国家填色')}
      <h4>工具</h4>
      ${row(K('1') + ' / ' + K('B'), '彩笔')}${row(K('2') + ' / ' + K('V'), '选择')}
      ${row(K('3') + ' / ' + K('L'), '陆海')}${row(K('4') + ' / ' + K('T'), '地貌 / 气候')}
      ${row(K('5') + ' / ' + K('F'), '森林')}${row(K('6') + ' / ' + K('R'), '河流')}
      ${row(K('7') + ' / ' + K('N'), '国家')}${row(K('8') + ' / ' + K('P'), '行政区')}
      ${row(K('9') + ' / ' + K('C'), '城市')}${row(K('0') + ' / ' + K('J'), '军队')}
      ${row(K('H'), '平移')}${row(K('K'), '线条')}${row(K('G'), '征服（吞并行政区 / 画笔占领）')}${row(K('Y'), '长城')}${row(K('U'), '进军箭头')}${row(K('M'), '标记')}${row(K('X'), '文字')}
      <h4>国家</h4>
      ${row(K('I'), '国家档案（当前高亮或选中的国家）')}${row(K('O'), '国力排名')}${row(K('Shift') + ' / ' + K('Ctrl') + ' + 点击', '多选国家（地图或列表），批量设附庸、改国体等')}${row(K('Esc'), '清空多选')}
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
  // 行政区工具只编辑一级：下拉框只列一级（外加新占领、未编入上级的），也可以直接在地图上点；
  // 选中一级后，只针对它里面的二、三级给出操作（二三级跟着一级自动调整，不能手动涂）
  UI.provPicker = () => {
    const T = App.Tools, n = App.nation(T.activeNation);
    if (!n) return '<span class="hint">先选择国家</span>';
    const esc = U.esc, ps = App.S.provinces.filter((p) => p.nation === n.id);
    let cur = App.province(T.activeProv);
    if (cur && (cur.level || 1) > 1) cur = App.Ops.ancestors(cur).find((q) => (q.level || 1) === 1) || cur;
    const tops = ps.filter((p) => (p.level || 1) === 1 || !ps.some((q) => q.id === p.parent));
    let h = `<label>${esc(App.levelName(n, 1))}</label><select data-act="activeProv" title="共 ${tops.length} 个"><option value="0">— 在地图上点一下选取 —</option>${tops.map((p) => `<option value="${p.id}" ${cur && p.id === cur.id ? 'selected' : ''}>${esc(p.name)}${(p.level || 1) > 1 ? '（新占领）' : ''}</option>`).join('')}</select>`
      + `<input type="text" list="provSearchList" data-act="provSearch" placeholder="🔍 搜名字" size="7"><datalist id="provSearchList">${tops.map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>`
      + `<button class="chip lock ${T.provPick ? 'on' : ''}" data-act="provPick" title="在地图上点一下直接选中那里的${esc(App.levelName(n, 1))}">🎯 从地图选</button>`;
    if (cur) {
      const kids = ps.filter((p) => p.parent === cur.id), k3 = ps.filter((p) => kids.some((k) => k.id === p.parent)).length;
      h += `<span class="hint">「${esc(cur.name)}」含 ${kids.length} 个${esc(App.levelName(n, 2))}${App.maxLevel(n) > 2 ? '、' + k3 + ' 个' + esc(App.levelName(n, 3)) : ''}，会跟着它的范围自动调整</span><button class="btn small" data-act="provRedivide">重新划分其中的${esc(App.levelName(n, 2))}${App.maxLevel(n) > 2 ? '、' + esc(App.levelName(n, 3)) : ''}</button>`;
    } else h += '<span class="hint">在地图上点一个' + esc(App.levelName(n, 1)) + '就能直接选中并修改它的范围</span>';
    return h;
  };
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
    document.querySelectorAll('#lvBtns [data-mode]').forEach((b) => b.classList.toggle('on', (App.S.meta.mapView || 'all') === b.dataset.mode));
  };
  UI.initLv = () => {
    const box = document.getElementById('lvBtns'); if (!box) return;
    box.innerHTML = '<span>地图</span>' + [['pol', '政区'], ['phys', '地形'], ['all', '综合']].map(([k, nm]) => `<button class="chip" data-mode="${k}" title="${{ pol: '只看国家和行政区，不画山、森林、河流', phys: '只看山、森林、河流，国家只画虚线边界', all: '全部叠在一起' }[k]}">${nm}</button>`).join('') + '<span class="sep"></span><span>行政区</span>' + [1, 2, 3].map((lv) => `<button class="chip" data-lv="${lv}">${["", "一级", "二级", "三级"][lv]}</button>`).join("");
    box.onclick = (e) => {
      const md = e.target.closest('[data-mode]'); if (md) { App.S.meta.mapView = md.dataset.mode; App.Geo.dirtyPol = true; UI.syncLv(); App.R.request(); App.autosave(); UI.toast({ pol: '政区图：不画山、森林、河流', phys: '地形图：只看山川河流森林', all: '综合：全部显示' }[md.dataset.mode]); return; }
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
