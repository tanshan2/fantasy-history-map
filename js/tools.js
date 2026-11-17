// ===== 工具与交互 =====
(() => {
  const W = App.W, H = App.H, C = App.CELL;
  const T = (App.Tools = {
    cur: 'select', activeNation: 0, activeProv: 0, sel: null, mouse: null,
    opt: { brush: 5, land: 'land', terrain: 5, forest: 1, fill: false, erase: false, cityType: 'medium', armyType: 'infantry', strength: '1万',
      lineStyle: 'border', provLevel: 1, color: '#c8584a', makeLand: true, tmode: 'terrain', climate: 7, markerType: 'battle', riverWidth: 2.2, arrowWidth: 14, textSize: 28 },
  });
  const BRUSH = ['color', 'land', 'terrain', 'forest', 'nation', 'prov'];
  // 彩色画笔：同一种颜色 = 同一块势力（没有就自动建一个未命名的）
  T.colorNation = () => {
    const col = (T.opt.color || '#c8584a').toLowerCase();
    let n = App.S.nations.find((k) => k.color.toLowerCase() === col);
    if (!n) n = App.Ops.addNation({ name: '', color: col, culture: (App.UI && App.UI.newCulture) || 'huaxia' });
    return n.id;
  };
  const DRAWLINE = ['river', 'line', 'arrow'];
  let canvas, drag = null, spaceDown = false, pointers = new Map(), pinch = null;

  T.init = (cv) => {
    canvas = cv;
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { T.mouse = null; App.R.request(); });
    cv.addEventListener('wheel', wheel, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('dblclick', dbl);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', (e) => { if (e.code === 'Space') spaceDown = false; });
  };
  T.set = (id) => { T.cur = id; drag = null; if (id !== 'select') T.select(null); App.UI.refreshTool(); App.R.request(); };
  T.select = (sel) => { T.sel = sel; App.UI.showSelection(); App.R.request(); };

  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const zoomAt = (sx, sy, f) => {
    const v = App.R.view, ns = U.clamp(v.s * f, 0.15, 12);
    v.ox = sx - ((sx - v.ox) * ns) / v.s; v.oy = sy - ((sy - v.oy) * ns) / v.s; v.s = ns;
    App.R.request(); App.UI.status();
  };
  T.zoomAt = zoomAt;
  const wheel = (e) => {
    e.preventDefault();
    const [sx, sy] = pos(e);
    const v = App.R.view;
    if (e.ctrlKey || e.metaKey) zoomAt(sx, sy, Math.exp(-e.deltaY * 0.01));
    else if (e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50)) { v.ox -= e.deltaX; v.oy -= e.deltaY; App.R.request(); }
    else zoomAt(sx, sy, Math.exp(-Math.sign(e.deltaY) * 0.18));
  };

  // ---------- 命中测试 ----------
  const inBox = (wx, wy, b) => {
    const dx = wx - b.x, dy = wy - b.y, ca = Math.cos(-b.ang), sa = Math.sin(-b.ang);
    const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
    return Math.abs(lx) <= b.halfW && Math.abs(ly) <= b.halfH;
  };
  const pip = (x, y, poly) => { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
  T.hit = (wx, wy) => {
    const S = App.S, s = App.R.view.s, tol = 7 / s, u = (6 * Math.pow(s, 0.5)) / s;
    // 选中折线的顶点
    const so = T.selObj();
    if (so && so.pts) { for (let i = 0; i < so.pts.length; i++) if (U.dist(wx, wy, so.pts[i][0], so.pts[i][1]) < tol) return { ...T.sel, vertex: i }; }
    for (let i = S.texts.length - 1; i >= 0; i--) { const t = S.texts[i]; if (inBox(wx, wy, { x: t.x, y: t.y, ang: ((t.angle || 0) * Math.PI) / 180, halfW: (t._w || 40) / 2 + 6, halfH: (t._h || 20) / 2 + 6 })) return { kind: 'texts', id: t.id }; }
    if (S.meta.showArmies) for (let i = S.armies.length - 1; i >= 0; i--) { const a = S.armies[i]; if (Math.abs(wx - a.x) < u * 2.1 && Math.abs(wy - a.y) < u * 1.6) return { kind: 'armies', id: a.id }; }
    for (let i = App.R.cityBoxes.length - 1; i >= 0; i--) { const b = App.R.cityBoxes[i]; if (U.dist(wx, wy, b.x, b.y) < Math.max(b.r, tol)) return { kind: "cities", id: b.id }; }
    for (let i = S.markers.length - 1; i >= 0; i--) { const m = S.markers[i]; if (U.dist(wx, wy, m.x, m.y) < Math.max(u * 1.3, tol)) return { kind: 'markers', id: m.id }; }
    for (const b of App.R.labelBoxes.slice().reverse()) if (b.kind === 'nation' && inBox(wx, wy, b)) return { kind: 'nationLabel', id: b.id };
    for (const b of App.R.labelBoxes.slice().reverse()) if (b.kind === 'prov' && inBox(wx, wy, b)) return { kind: 'provLabel', id: b.id };
    if (S.meta.showArmies) for (let i = S.arrows.length - 1; i >= 0; i--) { const p = App.R.arrowPoly(S.arrows[i]); if (p && pip(wx, wy, p)) return { kind: 'arrows', id: S.arrows[i].id }; }
    for (const k of ['lines', 'rivers']) for (let i = S[k].length - 1; i >= 0; i--) if (U.polyDist(wx, wy, S[k][i].pts) < tol) return { kind: k, id: S[k][i].id };
    return null;
  };
  T.selObj = () => {
    const sel = T.sel; if (!sel) return null;
    if (sel.kind === 'nationLabel') return App.nation(sel.id);
    if (sel.kind === 'provLabel') return App.province(sel.id);
    return (App.S[sel.kind] || []).find((o) => o.id === sel.id);
  };
  T.deleteSel = () => {
    const sel = T.sel; if (!sel || !App.S[sel.kind]) return;
    App.pushUndo();
    App.S[sel.kind] = App.S[sel.kind].filter((o) => o.id !== sel.id);
    T.select(null); App.changed({ ui: true });
  };

  // ---------- 刷子 ----------
  const paint = (wx, wy) => {
    const S = App.S, o = T.opt, r = o.brush, cx = wx / C, cy = wy / C;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
    const tool = T.cur, nid = T.activeNation, prov = App.province(T.activeProv);
    let ch = false;
    let landCh = false; const cnid = tool === 'color' && !o.erase ? T.colorNation() : 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > r * r) continue;
      const c = y * W + x, t = S.terrain[c];
      if (tool === 'color') {
        if (o.erase) { if (S.owner[c]) { S.owner[c] = 0; App.Ops.clearAllProv(c); ch = true; } continue; }
        if (t < 2) { if (!o.makeLand) continue; S.terrain[c] = 2; landCh = true; }
        if (S.owner[c] !== cnid) { S.owner[c] = cnid; App.Ops.clearAllProv(c); ch = true; }
        continue;
      }
      if (tool === 'land') {
        if (o.land === 'land') { if (t < 2) { S.terrain[c] = 2; ch = true; } }
        else { const nt = o.land === 'lake' ? 1 : 0; if (t !== nt) { S.terrain[c] = nt; S.forest[c] = 0; S.owner[c] = 0; App.Ops.clearAllProv(c); ch = true; } }
      } else if (t < 2) continue;
      else if (tool === 'terrain') { if (o.tmode === 'climate') { if (S.climate[c] !== o.climate) { S.climate[c] = o.climate; ch = true; } } else if (t !== o.terrain) { S.terrain[c] = o.terrain; ch = true; } }
      else if (tool === 'forest') { if (S.forest[c] !== o.forest) { S.forest[c] = o.forest; ch = true; } }
      else if (tool === 'nation') {
        if (o.erase) { if (S.owner[c]) { S.owner[c] = 0; App.Ops.clearAllProv(c); ch = true; } }
        else if (nid && S.owner[c] !== nid) { S.owner[c] = nid; App.Ops.clearAllProv(c); ch = true; }
      } else if (tool === 'prov') {
        const lv = T.opt.provLevel || 1, A = App.provArr(prov ? prov.level || 1 : lv);
        if (o.erase) { if (App.provArr(lv)[c] && S.owner[c] === nid) { App.Ops.clearProvCell(c, lv); ch = true; } }
        else if (prov && S.owner[c] === prov.nation && A[c] !== prov.id) { App.Ops.setProvCell(c, prov); ch = true; }
      }
    }
    if (landCh) App.changed({ land: true, pol: true });
    else if (ch) App.changed(tool === 'land' ? { land: true, pol: true } : tool === 'terrain' || tool === 'forest' ? { tint: true } : { pol: true });
  };
  const fill = (wx, wy) => {
    const S = App.S, c0 = App.Ops.cellAt(wx, wy); if (c0 < 0 || S.terrain[c0] < 2) return;
    const nid = T.activeNation, prov = App.province(T.activeProv);
    if (T.cur === 'nation' || T.cur === 'color') {
      const o0 = S.owner[c0], target = T.opt.erase ? 0 : T.cur === 'color' ? T.colorNation() : nid; if (o0 === target || (!target && !T.opt.erase)) return;
      App.pushUndo(["owner", "prov", "prov2", "prov3"]);
      App.Ops.flood(c0, (n) => S.terrain[n] >= 2 && S.owner[n] === o0).forEach((c) => { S.owner[c] = target; App.Ops.clearAllProv(c); });
      if (target) App.Ops.fillUnassigned();
    } else if (T.cur === 'prov') {
      const lv = T.opt.erase ? T.opt.provLevel || 1 : prov ? prov.level || 1 : 1, A = App.provArr(lv), o0 = S.owner[c0], p0 = A[c0];
      if (!T.opt.erase && !(prov && prov.nation === o0)) return; if (!T.opt.erase && p0 === prov.id) return;
      const P1 = S.prov[c0], P2 = S.prov2[c0], par = lv === 3 ? (n) => S.prov2[n] === P2 : lv === 2 ? (n) => S.prov[n] === P1 : () => true;
      App.pushUndo(["prov", "prov2", "prov3"]);
      App.Ops.flood(c0, (n) => S.owner[n] === o0 && A[n] === p0 && (p0 !== 0 || par(n))).forEach((c) => (T.opt.erase ? App.Ops.clearProvCell(c, lv) : App.Ops.setProvCell(c, prov)));
    }
    App.changed({ pol: true });
  };

  // ---------- 放置对象 ----------
  const place = (wx, wy) => {
    const S = App.S, o = T.opt;
    const c = App.Ops.cellAt(wx, wy), owner = c >= 0 ? S.owner[c] : 0, on = App.nation(owner), cul = on ? on.culture : App.nation(T.activeNation)?.culture || 'huaxia';
    App.pushUndo();
    let obj, kind;
    if (T.cur === 'city') { kind = 'cities'; obj = { id: App.nid(), x: wx, y: wy, type: o.cityType, name: App.Names.city(cul) }; }
    else if (T.cur === 'army') {
      const nid = T.activeNation || owner; if (!nid) { App.undoStack.pop(); App.UI.toast('请先在右侧选择一个国家'); return; }
      kind = 'armies'; obj = { id: App.nid(), x: wx, y: wy, nation: nid, type: o.armyType, strength: o.strength, name: '' };
    } else if (T.cur === 'marker') { kind = 'markers'; obj = { id: App.nid(), x: wx, y: wy, type: o.markerType, name: '' }; }
    else if (T.cur === 'text') { kind = 'texts'; obj = { id: App.nid(), x: wx, y: wy, text: '新文字', size: o.textSize, color: '#2b2116', angle: 0, spacing: 0.3, italic: false, box: false }; }
    S[kind].push(obj);
    App.changed({});
    T.cur = 'select'; App.UI.refreshTool();
    T.select({ kind, id: obj.id });
    if (kind === 'texts') App.UI.focusField('text');
  };

  // ---------- 指针事件 ----------
  const down = (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, pos(e));
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: U.dist(a[0], a[1], b[0], b[1]), s: App.R.view.s }; drag = null; return; }
    const [sx, sy] = pos(e), [wx, wy] = App.R.toWorld(sx, sy);
    if (e.button === 1 || e.button === 2 || spaceDown || T.cur === 'pan') { drag = { type: 'pan', sx, sy, ox: App.R.view.ox, oy: App.R.view.oy }; canvas.style.cursor = 'grabbing'; return; }
    if (T.cur === 'select') {
      const h = T.hit(wx, wy);
      if (h) {
        if (!(T.sel && T.sel.kind === h.kind && T.sel.id === h.id)) T.select({ kind: h.kind, id: h.id });
        drag = { type: 'move', hit: h, wx, wy, pushed: false };
      } else { T.select(null); drag = { type: 'pan', sx, sy, ox: App.R.view.ox, oy: App.R.view.oy }; }
      return;
    }
    if (BRUSH.includes(T.cur)) {
      if ((T.cur === 'nation' || T.cur === 'prov' || T.cur === 'color') && T.opt.fill) { fill(wx, wy); App.UI.refresh(); return; }
      if (T.cur === 'nation' && !T.activeNation && !T.opt.erase) { App.UI.toast('请先在右侧「国家」面板选择或新建一个国家'); return; }
      if (T.cur === 'prov' && !T.activeProv && !T.opt.erase) { App.UI.toast('请先在右侧「行政区」面板选择或新建一个行政区'); return; }
      App.pushUndo(T.cur === "land" || T.cur === "color" ? ["terrain", "forest", "owner", "prov", "prov2", "prov3"] : T.cur === "terrain" ? ["terrain", "climate", "forest"] : T.cur === "forest" ? ["forest"] : ["owner", "prov", "prov2", "prov3"]);
      drag = { type: 'brush', wx, wy }; paint(wx, wy); return;
    }
    if (DRAWLINE.includes(T.cur)) {
      if (T.cur === 'arrow' && !T.activeNation) { App.UI.toast('请先在右侧选择一个国家（箭头颜色）'); return; }
      drag = { type: 'line', pts: [[wx, wy]] }; return;
    }
    if (['city', 'army', 'marker', 'text'].includes(T.cur)) place(wx, wy);
  };
  const move = (e) => {
    const [sx, sy] = pos(e), [wx, wy] = App.R.toWorld(sx, sy);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [sx, sy]);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = U.dist(a[0], a[1], b[0], b[1]);
      zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (pinch.s * (d / pinch.d)) / App.R.view.s); return;
    }
    T.mouse = [wx, wy];
    App.UI.status(wx, wy);
    if (!drag) { if (BRUSH.includes(T.cur) || DRAWLINE.includes(T.cur)) App.R.request(); return; }
    if (drag.type === 'pan') { App.R.view.ox = drag.ox + sx - drag.sx; App.R.view.oy = drag.oy + sy - drag.sy; App.R.request(); return; }
    if (drag.type === 'brush') {
      const d = U.dist(drag.wx, drag.wy, wx, wy), st = Math.max(1, T.opt.brush * C * 0.4), n = Math.ceil(d / st);
      for (let i = 1; i <= n; i++) paint(drag.wx + ((wx - drag.wx) * i) / n, drag.wy + ((wy - drag.wy) * i) / n);
      drag.wx = wx; drag.wy = wy; return;
    }
    if (drag.type === 'line') {
      const l = drag.pts[drag.pts.length - 1];
      if (U.dist(l[0], l[1], wx, wy) > 4 / App.R.view.s) drag.pts.push([wx, wy]);
      App.R.request(); return;
    }
    if (drag.type === 'move') {
      const dx = wx - drag.wx, dy = wy - drag.wy; if (!dx && !dy) return;
      if (drag.hit.kind === "nationLabel" || drag.hit.kind === "provLabel") return;
      if (!drag.pushed) { App.pushUndo(); drag.pushed = true; }
      const h = drag.hit, o = T.selObj(); if (!o) return;
      if (h.kind === "nationLabel" || h.kind === "provLabel") return; // 名字固定，不可拖动
      else if (h.vertex != null) { o.pts[h.vertex][0] += dx; o.pts[h.vertex][1] += dy; }
      else if (o.pts) o.pts.forEach((p) => { p[0] += dx; p[1] += dy; });
      else { o.x += dx; o.y += dy; }
      drag.wx = wx; drag.wy = wy; App.R.request();
    }
  };
  const up = (e) => {
    pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
    canvas.style.cursor = '';
    if (!drag) return;
    const d = drag; drag = null;
    if (d.type === 'brush') { if ((T.cur === 'color' || T.cur === 'nation') && !T.opt.erase) App.Ops.fillUnassigned(); App.Geo.dirtyPol = true; App.R.request(); App.UI.refresh(); if (T.cur === 'color') App.UI.refreshTool(); }
    if (d.type === 'move' && d.pushed) { App.changed({}); App.UI.showSelection(); }
    if (d.type === 'line') {
      const pts = U.simplify(d.pts, 1.2 / App.R.view.s).map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
      if (pts.length < 2 || U.polyLen(pts) < 6 / App.R.view.s) { App.R.request(); return; }
      App.pushUndo();
      const S = App.S;
      if (T.cur === 'river') S.rivers.push({ id: App.nid(), pts, width: T.opt.riverWidth });
      else if (T.cur === 'line') S.lines.push({ id: App.nid(), pts, style: T.opt.lineStyle });
      else if (T.cur === 'arrow') S.arrows.push({ id: App.nid(), pts, nation: T.activeNation, width: T.opt.arrowWidth });
      App.changed({});
    }
  };
  const dbl = (e) => {
    if (T.cur !== 'select') return;
    const [sx, sy] = pos(e), [wx, wy] = App.R.toWorld(sx, sy), h = T.hit(wx, wy);
    const o = T.selObj();
    // 双击折线：删除顶点 / 在线段上添加顶点
    if (h && h.vertex != null && o.pts.length > 2) { App.pushUndo(); o.pts.splice(h.vertex, 1); App.changed({}); return; }
    if (o && o.pts && h && h.id === o.id) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < o.pts.length - 1; i++) { const dd = U.segDist(wx, wy, o.pts[i][0], o.pts[i][1], o.pts[i + 1][0], o.pts[i + 1][1]); if (dd < bd) { bd = dd; bi = i; } }
      App.pushUndo(); o.pts.splice(bi + 1, 0, [wx, wy]); App.changed({}); return;
    }
    if (h && (h.kind === 'cities' || h.kind === 'texts' || h.kind === 'armies' || h.kind === 'nationLabel' || h.kind === 'provLabel')) App.UI.focusField(h.kind === 'texts' ? 'text' : 'name');
  };
  const key = (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? App.redo() : App.undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); App.redo(); return; }
    if (mod) return;
    if (e.code === 'Space') { spaceDown = true; e.preventDefault(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { T.deleteSel(); return; }
    if (e.key === 'Escape') { drag = null; T.set('select'); return; }
    if (e.key === '[') { T.opt.brush = Math.max(0.5, T.opt.brush - 1); App.UI.refreshTool(); App.R.request(); return; }
    if (e.key === ']') { T.opt.brush = Math.min(40, T.opt.brush + 1); App.UI.refreshTool(); App.R.request(); return; }
    const map = { g: 'color', v: 'select', h: 'pan', l: 'land', t: 'terrain', f: 'forest', r: 'river', n: 'nation', p: 'prov', b: 'line', c: 'city', a: 'army', w: 'arrow', m: 'marker', x: 'text' };
    if (map[e.key.toLowerCase()]) T.set(map[e.key.toLowerCase()]);
  };

  // ---------- 覆盖层（光标、预览、选中） ----------
  T.drawOverlay = (c, s) => {
    const m = T.mouse;
    if (m && BRUSH.includes(T.cur) && !((T.cur === 'nation' || T.cur === 'prov' || T.cur === 'color') && T.opt.fill)) {
      c.beginPath(); c.arc(m[0], m[1], T.opt.brush * C, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.5 / s; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 0.75 / s; c.stroke();
    }
    if (drag && drag.type === 'line' && drag.pts.length > 1) {
      const S = App.S;
      if (T.cur === 'river') App.R.drawRiver(c, { pts: drag.pts, width: T.opt.riverWidth }, (px) => (px * Math.pow(s, 0.5)) / s);
      else { c.beginPath(); drag.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.strokeStyle = T.cur === 'arrow' ? (App.nation(T.activeNation)?.color || '#c00') : '#7a2a1a'; c.lineWidth = (T.cur === 'arrow' ? T.opt.arrowWidth * 0.6 : 2 / s); c.globalAlpha = 0.7; c.stroke(); c.globalAlpha = 1; }
    }
    const o = T.selObj(); if (!o) return;
    c.save(); c.setLineDash([4 / s, 3 / s]); c.strokeStyle = '#ffde59'; c.lineWidth = 1.6 / s;
    const k = T.sel.kind;
    if (k === 'nationLabel' || k === 'provLabel') {
      const b = App.R.labelBoxes.find((b) => b.kind === (k === 'nationLabel' ? 'nation' : 'prov') && b.id === o.id);
      if (b) { c.translate(b.x, b.y); c.rotate(b.ang); c.strokeRect(-b.halfW, -b.halfH, b.halfW * 2, b.halfH * 2); }
    } else if (o.pts) {
      c.beginPath(); o.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.setLineDash([]);
      o.pts.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3.5 / s, 0, Math.PI * 2); c.fillStyle = '#ffde59'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1 / s; c.stroke(); });
    } else if (k === 'texts') {
      c.translate(o.x, o.y); c.rotate(((o.angle || 0) * Math.PI) / 180); c.strokeRect(-(o._w || 40) / 2 - 6, -(o._h || 20) / 2 - 6, (o._w || 40) + 12, (o._h || 20) + 12);
    } else { c.beginPath(); c.arc(o.x, o.y, 14 / s, 0, Math.PI * 2); c.stroke(); }
    c.restore();
  };
})();
