// ===== 多选国家：一次性设附庸、改国体、改文明等 =====
(() => {
  const UI = App.UI, P = App.Polity, esc = U.esc, T = () => App.Tools;
  App.Tools.multi = new Set();
  const M = () => App.Tools.multi;
  const sel = () => [...M()].map((id) => App.nation(id)).filter(Boolean);
  const opt = (v, label, cur) => `<option value="${esc(v)}" ${cur != null && String(v) === String(cur) ? 'selected' : ''}>${esc(label)}</option>`;
  const KEEP = '<option value="">— 不改 —</option>';

  UI.toggleMulti = (id) => {
    if (!id) return; const m = M();
    if (m.has(id)) m.delete(id); else m.add(id);
    if (m.size && UI.tab !== 'nations') UI.tab = 'nations';
    // 刷新后让点中的那一行停在屏幕原位置（上方插入批量面板也不会跳）
    const panel = document.getElementById('panel'), q = () => document.querySelector(`#tabBody .list li[data-nation="${id}"]`);
    const a0 = q(), y0 = a0 ? a0.getBoundingClientRect().top : null;
    App.R.request(); UI.refresh();
    const a1 = q(); if (y0 != null && a1) panel.scrollTop += a1.getBoundingClientRect().top - y0;
    if (m.size === 1) UI.toast('已多选 1 个国家：继续 Shift/Ctrl + 点击添加更多，右侧面板可批量修改');
  };
  UI.clearMulti = () => { M().clear(); App.R.request(); UI.refresh(); };
  // 某国是否是 a 的（间接）附庸
  const subjectOf = (n, a) => { let k = n, g = 0; while (k && k.overlord && g++ < 50) { if (k.overlord === a) return true; k = App.nation(k.overlord); } return false; };

  UI.multiCard = () => {
    const ns = sel(); if (!ns.length) return '';
    const ids = new Set(ns.map((n) => n.id));
    const rk = P.ranking({}), pos = new Map(rk.map((s) => [s.n.id, s]));
    const ovList = App.S.nations.filter((k) => !ids.has(k.id) && !ns.some((n) => subjectOf(k, n.id)))
      .sort((a, b) => (pos.get(b.id)?.power ?? -1) - (pos.get(a.id)?.power ?? -1))
      .map((k) => { const s = pos.get(k.id); return opt(k.id, (s ? '第' + s.place + '名 · ' : '') + (k.name || '（未命名）')); }).join('');
    const fiefOpts = Object.entries(App.FIEF_SYS).map(([k, s]) => `<optgroup label="${esc(s.name)}">${s.tiers.map((t) => opt(k + ':' + t.id, t.name + '（' + t.ruler + '）')).join('')}</optgroup>`).join('');
    const sysOpts = Object.entries(App.ADMIN_SYS).map(([k, s]) => opt(k, s.name)).join('');
    return `<div class="card multi"><h4>已选 ${ns.length} 个国家 <small>Shift / Ctrl + 点击地图或列表可加减</small></h4>
      <div class="mchips">${ns.map((n) => `<span class="chip" style="--c:${n.color}"><i></i>${esc(n.name) || '（未命名）'}<b data-munsel="${n.id}" title="移出">×</b></span>`).join('')}</div>
      <div class="row wrap"><button class="btn small" data-mall>全选</button><button class="btn small" data-mclear>清空选择</button></div>
      <div class="field"><label>设为附庸 / 封国 → 宗主国</label><select data-mset="overlord">${KEEP}<option value="0">— 全部独立 —</option>${ovList}</select></div>
      <div class="field"><label>附庸身份（对宗主的封号，如诸侯侯国、汉诸侯王国）</label><select data-mset="fief">${KEEP}${UI.vassalOpts('')}</select></div>
      <div class="field"><label>国体 / 爵位</label><select data-mset="rank">${KEEP}<optgroup label="中国诸侯国（周制）">${App.FIEF_SYS.zhou.tiers.map((t) => opt('zhou:' + t.id, '诸侯' + t.name + ' · ' + t.short)).join('')}</optgroup><optgroup label="其他国体">${App.RANKS.filter((r) => r.id !== 'fief').map((r) => opt(r.id, r.name + ' · ' + r.ruler)).join('')}</optgroup></select></div>
      <div class="field"><label>文明</label><select data-mset="culture">${KEEP}${App.CULTURES.map((c) => opt(c.id, c.name)).join('')}</select></div>
      <div class="field"><label>行政区划制度</label><select data-mset="adminSys">${KEEP}${sysOpts}</select></div>
      <div class="row wrap"><label class="inline">建国年份 <input type="number" data-mfounded style="width:80px"></label><button class="btn small" data-mact="founded">应用</button>
        <label class="inline">颜色 <input type="color" data-mcolor value="${ns[0].color}"></label><button class="btn small" data-mact="color">统一颜色</button></div>
      <div class="row wrap">
        <button class="btn small" data-mact="vcol">配色随宗主</button><button class="btn small" data-mact="rename">按国体改名</button><button class="btn small" data-mact="rnd">全部重新命名</button>
        <button class="btn small" data-mact="dyn">生成统治家族</button><button class="btn small" data-mact="city">按地理补充城市</button><button class="btn small" data-mact="army">按国力生成军队</button>
        <button class="btn small" data-mact="prov">重新划分行政区</button><button class="btn small danger" data-mact="del">删除所选国家</button></div></div>`;
  };

  UI.bindMulti = (p) => {
    const ns = sel(); if (!ns.length) { p.querySelectorAll('[data-mall]').forEach((b) => (b.onclick = () => { App.S.nations.forEach((n) => M().add(n.id)); App.R.request(); UI.refresh(); })); return; }
    const done = (msg, pol = true) => { App.changed({ pol, ui: true }); UI.refreshTool && UI.refreshTool(); if (msg) UI.toast(msg); };
    p.querySelectorAll('[data-munsel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); M().delete(+b.dataset.munsel); App.R.request(); UI.refresh(); }));
    p.querySelectorAll('[data-mall]').forEach((b) => (b.onclick = () => { App.S.nations.forEach((n) => M().add(n.id)); App.R.request(); UI.refresh(); }));
    p.querySelectorAll('[data-mclear]').forEach((b) => (b.onclick = UI.clearMulti));
    p.querySelectorAll('[data-mset]').forEach((el) => (el.onchange = () => {
      const k = el.dataset.mset, v = el.value; if (v === '') return;
      if (k === 'adminSys') { const s = App.ADMIN_SYS[v]; if (!confirm(`把 ${ns.length} 个国家都改成「${s.name}」？已有行政区保留地名、改级别名称。`)) { UI.refresh(); return; } App.pushUndo(['prov', 'prov2', 'prov3']); ns.forEach((n) => App.Ops.setAdminSys(n, v)); return done(`已改为${s.name}`); }
      App.pushUndo();
      if (k === 'overlord') {
        const ov = +v, o = App.nation(ov);
        ns.forEach((n) => { n.overlord = ov; });
        return done(ov ? `${ns.length} 个国家成为「${o.name}」的附庸` : `${ns.length} 个国家改为独立`);
      }
      if (k === 'rank') { ns.forEach((n) => { if (v.includes(':')) { const [s, ti] = v.split(':'); n.rank = 'fief'; n.fiefSys = s; n.fiefTitle = ti; } else n.rank = v; const f = P.dynasty(n); if (f) { f.house = P.title(n).house; P.crown(n, f); } }); return done('已修改国体'); }
      if (k === 'fief') {
        if (v === 'keep') { ns.forEach((n) => { if (n.rank === 'fief') n.rank = P.guessRank(n); }); return done('已改为普通附庸'); }
        const [sys, tier] = v.split(':'); ns.forEach((n) => { n.rank = 'fief'; n.fiefSys = sys; n.fiefTitle = tier; const f = P.dynasty(n); if (f) { f.house = P.title(n).house; P.crown(n, f); } });
        const noOv = ns.filter((n) => !n.overlord).length;
        return done(`已设为${App.FIEF_SYS[sys].tiers.find((t) => t.id === tier).name}` + (noOv ? `，还有 ${noOv} 个没有宗主，请在上面选宗主国` : ''));
      }
      if (k === 'culture') { ns.forEach((n) => (n.culture = v)); return done('已修改文明', false); }
    }));
    p.querySelectorAll('[data-mact]').forEach((b) => (b.onclick = () => {
      const a = b.dataset.mact;
      if (a === 'del') { if (!confirm(`删除所选的 ${ns.length} 个国家？（可撤销）`)) return; App.pushUndo(['owner', 'prov', 'prov2', 'prov3']); ns.forEach((n) => App.Ops.deleteNation(n.id)); M().clear(); if (!App.nation(T().activeNation)) T().activeNation = 0; return done('已删除'); }
      if (a === 'prov') { App.pushUndo(['prov', 'prov2', 'prov3']); ns.forEach((n) => App.Ops.autoProvinces(n.id, 0)); return done(`已为 ${ns.length} 个国家重新划分行政区`); }
      App.pushUndo();
      if (a === 'founded') { const y = Math.round(+p.querySelector('[data-mfounded]').value); if (!p.querySelector('[data-mfounded]').value) { UI.toast('先填年份'); return; } ns.forEach((n) => (n.founded = y)); return done('已修改建国年份', false); }
      if (a === 'color') { const c = p.querySelector('[data-mcolor]').value; ns.forEach((n) => (n.color = c)); return done('已统一颜色'); }
      if (a === 'vcol') {
        const groups = new Map(); ns.forEach((n) => { if (n.overlord) { if (!groups.has(n.overlord)) groups.set(n.overlord, []); groups.get(n.overlord).push(n); } });
        if (!groups.size) { UI.toast('所选国家都没有宗主'); return; }
        groups.forEach((vs, ov) => { const oc = App.nation(ov).color; vs.forEach((v, i) => (v.color = U.shade(oc, (i % 2 ? -0.18 : 0.22) + (i / vs.length) * 0.1))); });
        return done('已按宗主配色');
      }
      if (a === 'rename') { ns.forEach((n) => P.renameByRank(n)); return done('已按国体改名', false); }
      if (a === 'rnd') { ns.forEach((n) => App.Ops.renameAll(n.id)); return done('已重新命名'); }
      if (a === 'dyn') { const before = ns.filter((n) => !P.dynasty(n)); P.ensureAllDynasties(); ns.forEach((n) => { const f = P.dynasty(n); if (f) { f.house = P.title(n).house; P.crown(n, f); } }); return done(before.length ? `为 ${before.length} 个国家生成了统治家族` : '所选国家都已有统治家族', false); }
      if (a === 'city') { const fm = P.fertMap(); let k = 0; ns.forEach((n) => (k += P.genCities(n.id, Math.random, { fm }).length)); return done(`新增 ${k} 座城市`, false); }
      if (a === 'army') { let k = 0; ns.forEach((n) => (k += P.genArmies(n).length)); return done(k ? `生成 ${k} 支部队` : '兵力已足够', false); }
    }));
  };
})();
// 换地图时清空多选
(() => { const orig = App.afterBigChange; App.afterBigChange = (...a) => { if (App.Tools.multi) [...App.Tools.multi].forEach((id) => { if (!App.nation(id)) App.Tools.multi.delete(id); }); return orig(...a); }; })();
