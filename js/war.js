// ===== 战争征服：吞并一级 / 二级 / 三级行政区，或自由画笔占领 =====
(() => {
  const W = App.W, N = App.N, C = App.CELL;
  const WR = (App.War = {});
  WR.MODES = [{ id: 'l1', name: '吞并一级行政区' }, { id: 'l2', name: '吞并二级行政区' }, { id: 'l3', name: '吞并三级行政区' }, { id: 'brush', name: '自由画笔占领' }];

  // 鼠标下可被吞并的行政区（别国的）
  WR.target = (wx, wy) => {
    const S = App.S, T = App.Tools, o = T.opt, c = App.Ops.cellAt(wx, wy);
    if (c < 0 || S.terrain[c] < 2) return null;
    const own = S.owner[c], me = T.activeNation;
    if (!own || own === me) return null;
    if (o.warTarget && own !== o.warTarget) return null;
    const lv = +o.warMode.slice(1), pid = App.provArr(lv)[c];
    return { c, lv, pid, own };
  };

  // 删除没有领土的行政区（被吃干净的），没吃干净的保留
  WR.liveIds = () => { const S = App.S, s = new Set(); for (let c = 0; c < N; c++) { if (S.prov[c]) s.add(S.prov[c]); if (S.prov2[c]) s.add(S.prov2[c]); if (S.prov3[c]) s.add(S.prov3[c]); } return s; };
  // only：只清理这些（操作前有领土的）行政区，不会误删你新建还没涂的
  App.Ops.pruneEmptyProvinces = (only) => {
    const S = App.S, has = new Set();
    for (let c = 0; c < N; c++) { if (S.prov[c]) has.add(S.prov[c]); if (S.prov2[c]) has.add(S.prov2[c]); if (S.prov3[c]) has.add(S.prov3[c]); }
    const dead = S.provinces.filter((p) => !has.has(p.id) && (!only || only.has(p.id))).map((p) => p.id);
    // 仍有下级活着的上级不删（避免误删）
    const alive = new Set(S.provinces.filter((p) => has.has(p.id)).map((p) => p.id));
    let grew = true; while (grew) { grew = false; S.provinces.forEach((p) => { if (alive.has(p.id) && p.parent && !alive.has(p.parent)) { alive.add(p.parent); grew = true; } }); }
    const kill = dead.filter((id) => !alive.has(id));
    const ks = new Set(kill); if (kill.length) S.provinces = S.provinces.filter((p) => !ks.has(p.id));
    return kill.length;
  };

  // 吞并一个行政区：领土、名称、下级全部转给进攻方；它在原国的上级如果只剩一部分，就保留剩下的部分
  WR.annex = (wx, wy) => {
    const S = App.S, T = App.Tools, me = T.activeNation, my = App.nation(me);
    if (!my) { App.UI.toast('先在上面选择「进攻方」国家'); return; }
    const t = WR.target(wx, wy);
    if (!t) { App.UI.toast(App.S.owner[App.Ops.cellAt(wx, wy)] === me ? '这里已经是本国领土' : '这里不是可吞并的敌国领土'); return; }
    const victim = App.nation(t.own), A = App.provArr(t.lv), before = WR.liveIds();
    App.pushUndo(['owner', 'prov', 'prov2', 'prov3']);
    let cells = [];
    if (t.pid) { for (let c = 0; c < N; c++) if (A[c] === t.pid && S.owner[c] === t.own) cells.push(c); }
    else {
      // 这一块没有该级行政区：吞掉这块连成一片的无名领土
      cells = App.Ops.flood(t.c, (k) => S.owner[k] === t.own && !A[k] && S.terrain[k] >= 2);
    }
    // 该行政区及其下级改属进攻方；二、三级被单独吞并时，脱离原来的上级（上级保持无名，等你自己重新编排）
    const moved = new Set();
    if (t.pid) {
      moved.add(t.pid);
      let grew = true; while (grew) { grew = false; S.provinces.forEach((p) => { if (p.parent && moved.has(p.parent) && !moved.has(p.id)) { moved.add(p.id); grew = true; } }); }
      S.provinces.forEach((p) => { if (moved.has(p.id)) { p.nation = me; if (p.id === t.pid) p.parent = 0; } });
    }
    cells.forEach((c) => { S.owner[c] = me; for (let l = 1; l < t.lv; l++) App.provArr(l)[c] = 0; });
    App.Ops.pruneEmptyProvinces(before);
    App.changed({ pol: true, ui: true });
    const nm = t.pid ? App.province(t.pid)?.name : '一块无名领土';
    let left = 0; for (let c = 0; c < N; c++) if (S.owner[c] === t.own) { left = 1; break; }
    App.UI.toast(`${my.name} 吞并了 ${victim ? victim.name : ''} 的「${nm}」` + (left ? '' : `，${victim.name} 已全境沦陷`));
    WR.hoverKey = '';
  };
  // 自由画笔结束后：清理被吃干净的行政区，并提示
  WR.startBrush = () => { WR.brushBefore = WR.liveIds(); };
  WR.afterBrush = () => { App.Ops.pruneEmptyProvinces(WR.brushBefore); WR.brushBefore = null; };

  // ---------- 悬停预览：高亮将被吞并的行政区 ----------
  let cacheKey = '', cachePath = null;
  WR.drawPreview = (c, s) => {
    const T = App.Tools, m = T.mouse; if (!m || T.opt.warMode === 'brush') return;
    const t = WR.target(m[0], m[1]); if (!t) return;
    const S = App.S, key = t.lv + ':' + (t.pid || 'c' + t.c) + ':' + App.Geo.polVer;
    if (key !== cacheKey) {
      const A = App.provArr(t.lv), set = new Uint8Array(N);
      if (t.pid) { for (let k = 0; k < N; k++) if (A[k] === t.pid && S.owner[k] === t.own) set[k] = 1; }
      else App.Ops.flood(t.c, (k) => S.owner[k] === t.own && !A[k] && S.terrain[k] >= 2).forEach((k) => (set[k] = 1));
      const m2 = App.Geo.collect((k) => set[k]); cachePath = m2.get(1) ? App.Geo.pathOf(m2.get(1)) : null; cacheKey = key;
    }
    if (!cachePath) return;
    const me = App.nation(T.activeNation), col = me ? me.color : '#c33';
    c.save(); c.globalAlpha = 0.45; c.fillStyle = col; c.fill(cachePath, 'evenodd'); c.globalAlpha = 1;
    c.setLineDash([6 / s, 4 / s]); c.strokeStyle = '#7a1408'; c.lineWidth = 2.2 / s; c.stroke(cachePath); c.restore();
    // 名字提示
    const p = t.pid && App.province(t.pid);
    const label = (p ? p.name : '无名领土') + ' → ' + (me ? me.name : '');
    c.save(); c.font = `700 ${13 / s}px "Noto Sans SC", sans-serif`; c.textAlign = 'left'; c.lineWidth = 3 / s; c.strokeStyle = 'rgba(255,248,230,.9)';
    c.strokeText(label, m[0] + 12 / s, m[1] - 10 / s); c.fillStyle = '#7a1408'; c.fillText(label, m[0] + 12 / s, m[1] - 10 / s); c.restore();
  };
})();
