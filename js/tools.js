// ===== 工具与交互 =====
(() => {
  const W = App.W, H = App.H, C = App.CELL;
  const T = (App.Tools = {
    cur: 'select', activeNation: 0, activeProv: 0, sel: null, mouse: null, hl: 0,
    opt: { brush: 5, land: 'land', terrain: 5, forest: 1, fill: false, erase: false, cityType: 'medium', armyType: 'infantry', strength: '1万',
      lineStyle: 'border', provLevel: 1, color: '#c8584a', makeLand: true, lockOther: false, lockRiver: false, lockMtn: false, lockSea: false, askRefine: true, tmode: 'terrain', climate: 7, markerType: 'battle', riverWidth: 2.2, arrowWidth: 14, textSize: 28 },
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
    window.addEventListener('keydown', (e) => { if (e.key === 'Alt') { T.altDown = true; App.R.request(); } });
    window.addEventListener('keyup', (e) => { if (e.key === 'Alt') { T.altDown = false; App.R.request(); } });
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
    if (e.altKey && BRUSH.includes(T.cur)) { T.opt.brush = U.clamp(T.opt.brush - Math.sign(e.deltaY) * (e.shiftKey ? 3 : 1), 0.5, 40); App.UI.refreshTool(); App.R.request(); return; }
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

  // ---------- 智能笔刷：锁定他国 / 以河为界 / 以山为界 / 以海为界 ----------
  const POL = ['color', 'nation', 'prov'];
  T.altDown = false;
  // 湿颜料层 & 节流重算：涂色过程中只即时显示，重计算延后
  T.wet = document.createElement('canvas'); T.wet.width = W; T.wet.height = H; T.wetCtx = T.wet.getContext('2d'); T.wetImg = T.wetCtx.createImageData(W, H); T.wetOn = false;
  T.pending = {}; let flushT = 0;
  const flushNow = (final) => {
    const p = T.pending; T.pending = {};
    if (final) { App.changed({ land: !!p.land, tint: !!p.tint, pol: !!(p.pol || p.land), ui: !!(p.pol || p.land) }); return; }
    if (p.land || p.tint) App.changed({ land: !!p.land, tint: !!p.tint });
    if (p.pol) T.pending.pol = true; if (p.land) T.pending.pol = true;
  };
  T.flushSoon = () => { App.R.request(); if (flushT) return; flushT = setTimeout(() => { flushT = 0; flushNow(false); }, 280); };
  T.flushWet = () => { const b = T.wetBox; if (!b) return; T.wetBox = null; T.wetCtx.putImageData(T.wetImg, 0, 0, b[0], b[1], b[2] - b[0] + 1, b[3] - b[1] + 1); };
  T.startStroke = () => { T.wetBox = null; T.wetImg = T.wetCtx.createImageData(W, H); T.wetCtx.clearRect(0, 0, W, H); T.wetOn = false; T.pending = {}; };
  T.endStroke = () => {
    clearTimeout(flushT); flushT = 0;
    if ((T.cur === 'color' || T.cur === 'nation') && !T.opt.erase && T.pending.pol) App.Ops.fillUnassigned();
    const hadPol = !!T.pending.pol;
    flushNow(true); T.wetOn = false; T.wetCtx.clearRect(0, 0, W, H);
    if (hadPol && POL.includes(T.cur) && !T.opt.erase && T.opt.askRefine !== false && App.Refine && T.strokeSnap) {
      const S = App.S, prov = App.province(T.activeProv), lv = prov ? prov.level || 1 : 1;
      const before = T.cur === 'prov' ? T.strokeSnap.arrs[App.provKey(lv)] : T.strokeSnap.arrs.owner, now = T.cur === 'prov' ? App.provArr(lv) : S.owner;
      let k = 0; if (before) for (let c = 0; c < App.N && k < 15; c++) if (before[c] !== now[c]) k++;
      if (k >= 15 && (T.cur !== 'prov' || prov)) App.Refine.ask({ tool: T.cur, snap: T.strokeSnap, prov, brush: T.opt.brush });
    }
    if (T.cur === 'color') App.UI.refreshTool();
  };
  T.locksOn = () => { const o = T.opt; return POL.includes(T.cur) && !T.altDown && !!(o.lockOther || o.lockRiver || o.lockMtn || o.lockSea); };
  let rMask = null, rKey = '';
  T.riverMask = () => {
    const S = App.S, key = S.rivers.length + ':' + S.rivers.reduce((a, r) => a + r.pts.length * 7 + (r.pts[0] ? r.pts[0][0] + r.pts[r.pts.length - 1][1] : 0), 0);
    if (rMask && key === rKey) return rMask;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.strokeStyle = '#000'; x.lineWidth = 1.15; x.lineCap = 'round'; x.lineJoin = 'round';
    S.rivers.forEach((r) => { const p = U.smooth(r.pts, 4); x.beginPath(); p.forEach(([px, py], i) => (i ? x.lineTo(px / C, py / C) : x.moveTo(px / C, py / C))); x.stroke(); });
    const d = x.getImageData(0, 0, W, H).data; rMask = new Uint8Array(App.N);
    for (let i = 0; i < App.N; i++) rMask[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    rKey = key; return rMask;
  };
  // 当前笔刷的“目标”（彩笔颜色对应的国家、选中的国家或行政区）
  const brushCtx = (create) => {
    const o = T.opt, prov = App.province(T.activeProv);
    if (T.cur === 'prov') return { target: prov ? prov.id : 0, lv: prov ? prov.level || 1 : o.provLevel || 1, prov };
    if (T.cur === 'color') {
      if (o.erase) return { target: 0 };
      if (create) return { target: T.colorNation() };
      const n = App.S.nations.find((k) => k.color.toLowerCase() === (o.color || '').toLowerCase());
      return { target: n ? n.id : -1 };
    }
    return { target: o.erase ? 0 : T.activeNation };
  };
  const allowCell = (c, ctx, locks) => {
    const S = App.S, o = T.opt, t = S.terrain[c];
    if (t < 2) return T.cur === 'color' && o.makeLand && !App.S.meta.vec && !o.erase && !(locks && o.lockSea);
    if (!locks) return true;
    if (o.lockMtn && (t === 5 || t === 6)) return false;
    if (o.lockOther && !o.erase) {
      if (T.cur === 'prov') { const A = App.provArr(ctx.lv); if (A[c] && A[c] !== ctx.target) return false; }
      else if (S.owner[c] && S.owner[c] !== ctx.target) return false;
    }
    return true;
  };
  // 笔刷范围内实际会被涂到的格子
  T.brushCells = (wx, wy, ctx) => {
    const r = T.opt.brush, cx = wx / C, cy = wy / C, out = [];
    const inC = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r;
    const locks = T.locksOn();
    if (!locks) {
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) if (inC(x, y)) out.push(y * W + x);
      return out;
    }
    const x0 = Math.floor(cx), y0 = Math.floor(cy); if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return out;
    const c0 = y0 * W + x0; if (!allowCell(c0, ctx, true)) return out;
    const riv = T.opt.lockRiver ? T.riverMask() : null, seen = new Set([c0]), q = [c0];
    while (q.length) {
      const c = q.pop(); out.push(c);
      if (riv && riv[c] && c !== c0) continue; // 河道格涂上，但不越过河
      const x = c % W, y = (c / W) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (!inC(nx, ny)) continue; const n = ny * W + nx;
        if (seen.has(n)) continue; seen.add(n);
        if (allowCell(n, ctx, true)) q.push(n);
      }
    }
    return out;
  };

  // ---------- 刷子 ----------
  const paint = (wx, wy) => {
    const S = App.S, o = T.opt, tool = T.cur, nid = T.activeNation, prov = App.province(T.activeProv);
    const ctx = POL.includes(tool) ? brushCtx(true) : {};
    const cells = T.brushCells(wx, wy, ctx);
    let ch = false, landCh = false; const cnid = tool === 'color' && !o.erase ? ctx.target : 0;
    for (const c of cells) {
      const t = S.terrain[c];
      if (tool === 'color') {
        if (o.erase) { if (S.owner[c]) { S.owner[c] = 0; App.Ops.clearAllProv(c); ch = true; } continue; }
        if (t < 2) { if (!o.makeLand || S.meta.vec) continue; S.terrain[c] = 2; landCh = true; }
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
    if (!ch && !landCh) return;
    const P = T.pending;
    if (landCh || tool === 'land') { P.land = true; P.pol = true; }
    if (tool === 'terrain' || tool === 'forest') P.tint = true;
    if (POL.includes(tool)) {
      P.pol = true;
      // 即时显示：先把涂到的格子画到“湿颜料”层，松开鼠标再重算边界
      const col = U.hexToRgb(tool === 'color' ? (o.erase ? '#e6d6b0' : o.color) : tool === 'nation' ? (o.erase ? '#e6d6b0' : App.nation(nid)?.color || '#888888') : U.shade(App.nation(prov ? prov.nation : nid)?.color || '#888888', 0.45));
      const wc = T.wetCtx; wc.fillStyle = U.rgbToHex(col[0], col[1], col[2]);
      for (const c of cells) {
        const ok = tool === 'prov' ? (o.erase ? !App.provArr(o.provLevel || 1)[c] : prov && App.provArr(prov.level || 1)[c] === prov.id) : o.erase ? !S.owner[c] : S.owner[c] === (tool === 'color' ? cnid : nid);
        if (ok) wc.fillRect(c % W, (c / W) | 0, 1, 1);
      }
      T.wetOn = true;
    }
    T.flushSoon();
  };
  // 油漆桶：同样遵守锁定（可一键填满被河流、山脉围起来的区域）
  const floodLocked = (c0, same, ctx) => {
    const locks = T.locksOn(), riv = locks && T.opt.lockRiver ? T.riverMask() : null;
    const out = [], seen = new Uint8Array(App.N), q = [c0]; seen[c0] = 1;
    while (q.length) {
      const c = q.pop(); out.push(c);
      if (riv && riv[c] && c !== c0) continue;
      const x = c % W, y = (c / W) | 0;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
        if (n < 0 || seen[n]) continue; seen[n] = 1;
        if (same(n) && (!locks || allowCell(n, ctx, true))) q.push(n);
      }
    }
    return out;
  };
  const fill = (wx, wy) => {
    const S = App.S, c0 = App.Ops.cellAt(wx, wy); if (c0 < 0 || S.terrain[c0] < 2) return;
    const nid = T.activeNation, prov = App.province(T.activeProv);
    if (T.cur === 'nation' || T.cur === 'color') {
      const o0 = S.owner[c0], ctx = brushCtx(true), target = T.opt.erase ? 0 : ctx.target; if (o0 === target || (!target && !T.opt.erase)) return;
      if (T.locksOn() && T.opt.lockMtn && (S.terrain[c0] === 5 || S.terrain[c0] === 6)) return;
      App.pushUndo(["owner", "prov", "prov2", "prov3"]);
      floodLocked(c0, (n) => S.terrain[n] >= 2 && S.owner[n] === o0, ctx).forEach((c) => { S.owner[c] = target; App.Ops.clearAllProv(c); });
      if (target) App.Ops.fillUnassigned();
    } else if (T.cur === 'prov') {
      const lv = T.opt.erase ? T.opt.provLevel || 1 : prov ? prov.level || 1 : 1, A = App.provArr(lv), o0 = S.owner[c0], p0 = A[c0];
      if (!T.opt.erase && !(prov && prov.nation === o0)) return; if (!T.opt.erase && p0 === prov.id) return;
      const P1 = S.prov[c0], P2 = S.prov2[c0], par = lv === 3 ? (n) => S.prov2[n] === P2 : lv === 2 ? (n) => S.prov[n] === P1 : () => true;
      App.pushUndo(["prov", "prov2", "prov3"]);
      floodLocked(c0, (n) => S.owner[n] === o0 && A[n] === p0 && (p0 !== 0 || par(n)), brushCtx(false)).forEach((c) => (T.opt.erase ? App.Ops.clearProvCell(c, lv) : App.Ops.setProvCell(c, prov)));
    }
    App.changed({ pol: true });
  };
  // 预览：开着锁定时，显示这一笔实际会涂到的格子
  T.drawBrushPreview = (c, s) => {
    const m = T.mouse; if (!m || !T.locksOn() || T.opt.fill) return;
    const ctx = brushCtx(false), cells = T.brushCells(m[0], m[1], ctx);
    let col = '#ffffff';
    if (T.cur === 'color') col = T.opt.erase ? '#ffffff' : T.opt.color; else if (T.cur === 'nation') col = App.nation(T.activeNation)?.color || '#fff';
    else if (ctx.prov) col = U.shade(App.nation(ctx.prov.nation)?.color || '#ffffff', 0.4);
    c.save(); c.globalAlpha = 0.45; c.fillStyle = col;
    cells.forEach((k) => c.fillRect((k % W) * C, ((k / W) | 0) * C, C, C));
    c.restore();
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
    T.altDown = e.altKey;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, pos(e));
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: U.dist(a[0], a[1], b[0], b[1]), s: App.R.view.s }; drag = null; return; }
    const [sx, sy] = pos(e), [wx, wy] = App.R.toWorld(sx, sy);
    if (e.button === 1 || e.button === 2 || spaceDown || T.cur === 'pan') { drag = { type: 'pan', sx, sy, ox: App.R.view.ox, oy: App.R.view.oy }; canvas.style.cursor = 'grabbing'; return; }
    if (T.cur === 'select') {
      const h = T.hit(wx, wy);
      if (h) {
        if (!(T.sel && T.sel.kind === h.kind && T.sel.id === h.id)) T.select({ kind: h.kind, id: h.id });
        if (h.kind === 'nationLabel') T.highlight(h.id);
        drag = { type: 'move', hit: h, wx, wy, pushed: false };
      } else { T.select(null); drag = { type: 'pan', sx, sy, ox: App.R.view.ox, oy: App.R.view.oy, click: true, wx, wy }; }
      return;
    }
    if (BRUSH.includes(T.cur)) {
      if ((T.cur === 'nation' || T.cur === 'prov' || T.cur === 'color') && T.opt.fill) { fill(wx, wy); App.UI.refresh(); return; }
      if (T.cur === 'nation' && !T.activeNation && !T.opt.erase) { App.UI.toast('请先在右侧「国家」面板选择或新建一个国家'); return; }
      if (T.cur === 'prov' && !T.activeProv && !T.opt.erase) { App.UI.toast('请先在右侧「行政区」面板选择或新建一个行政区'); return; }
      App.pushUndo(T.cur === "land" || T.cur === "color" ? ["terrain", "forest", "owner", "prov", "prov2", "prov3"] : T.cur === "terrain" ? ["terrain", "climate", "forest"] : T.cur === "forest" ? ["forest"] : ["owner", "prov", "prov2", "prov3"]);
      if (App.Refine) App.Refine.dismiss();
      T.startStroke(); T.strokeSnap = App.undoStack[App.undoStack.length - 1]; drag = { type: 'brush', wx, wy }; paint(wx, wy); return;
    }
    if (DRAWLINE.includes(T.cur)) {
      if (T.cur === 'arrow' && !T.activeNation) { App.UI.toast('请先在右侧选择一个国家（箭头颜色）'); return; }
      drag = { type: 'line', pts: [[wx, wy]] }; return;
    }
    if (['city', 'army', 'marker', 'text'].includes(T.cur)) place(wx, wy);
  };
  const move = (e) => {
    T.mouseScreen = pos(e);
    if (T.altDown !== e.altKey) { T.altDown = e.altKey; App.R.request(); }
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
    if (d.type === 'brush') T.endStroke();
    // 选择工具：在地图上轻点（没拖动）= 选中这块领土的国家并高亮
    if (d.type === 'pan' && d.click && T.cur === 'select') {
      const [ux, uy] = pos(e); if (Math.hypot(ux - d.sx, uy - d.sy) < 5) { const c = App.Ops.cellAt(d.wx, d.wy), o = c >= 0 ? App.S.owner[c] : 0; T.highlight(o, true); }
    }
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
  // ---------- 键盘：电脑操作 ----------
  // 按住 WASD / 方向键 连续平移，Q/E 连续缩放（以鼠标为中心），Shift 加速
  const held = new Set(); let panRaf = 0, lastT = 0;
  const DIRS = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [1, 0], ArrowLeft: [1, 0], KeyD: [-1, 0], ArrowRight: [-1, 0] };
  const ZOOMK = { KeyQ: -1, KeyE: 1, Minus: -1, Equal: 1, NumpadSubtract: -1, NumpadAdd: 1 };
  const tick = (t) => {
    if (!held.size) { panRaf = 0; lastT = 0; return; }
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60; lastT = t;
    let dx = 0, dy = 0, dz = 0;
    held.forEach((k) => { if (DIRS[k]) { dx += DIRS[k][0]; dy += DIRS[k][1]; } if (ZOOMK[k]) dz += ZOOMK[k]; });
    const fast = T.shiftDown ? 2.6 : 1, v = App.R.view;
    if (dx || dy) { const sp = 760 * fast * dt, n = Math.hypot(dx, dy); v.ox += (dx / n) * sp; v.oy += (dy / n) * sp; }
    if (dz) {
      const r = canvas.getBoundingClientRect(), ms = T.mouseScreen;
      const [zx, zy] = ms && ms[0] >= 0 && ms[1] >= 0 && ms[0] <= r.width && ms[1] <= r.height ? ms : [r.width / 2, r.height / 2];
      zoomAt(zx, zy, Math.exp(dz * 1.7 * fast * dt));
    }
    App.R.request(); App.UI.status();
    panRaf = requestAnimationFrame(tick);
  };
  const startMove = () => { if (!panRaf) panRaf = requestAnimationFrame(tick); };
  window.addEventListener('blur', () => { held.clear(); T.shiftDown = false; spaceDown = false; });
  window.addEventListener('keyup', (e) => { held.delete(e.code); if (e.key === 'Shift') T.shiftDown = false; });

  // 数字键选工具
  T.NUM_TOOLS = ['color', 'select', 'land', 'terrain', 'forest', 'river', 'nation', 'prov', 'city', 'army'];
  // 字母选工具（避开 WASD / Q / E）
  T.KEY_TOOLS = { b: 'color', v: 'select', h: 'pan', l: 'land', t: 'terrain', f: 'forest', r: 'river', n: 'nation', p: 'prov', k: 'line', c: 'city', j: 'army', u: 'arrow', m: 'marker', x: 'text' };
  const key = (e) => {
    if (e.key === 'Shift') T.shiftDown = true;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (App.Refine && App.Refine.isPending() && (e.key === 'Escape' || e.key === 'Enter')) return;
    const famOpen = document.getElementById('famModal') && !document.getElementById('famModal').hidden;
    const modalOpen = !document.getElementById('modal').hidden;
    if (modalOpen || famOpen) { if (e.key === 'Escape') { if (famOpen) App.Family.hide(); else document.getElementById('modal').hidden = true; } return; }
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    // —— 带 Ctrl/⌘ 的组合键 ——
    if (mod) {
      if (k === 'z') { e.preventDefault(); e.shiftKey ? App.redo() : App.undo(); }
      else if (k === 'y') { e.preventDefault(); App.redo(); }
      else if (k === 's') { e.preventDefault(); App.UI.saveJson(); App.UI.toast('已保存为 JSON 文件'); }
      else if (k === 'o') { e.preventDefault(); document.getElementById('fileJson').click(); }
      else if (k === 'e') { e.preventDefault(); App.UI.exportDialog(); }
      return;
    }
    // —— 移动 / 缩放（按住连续） ——
    if ((DIRS[e.code] || ZOOMK[e.code]) && !e.altKey) { e.preventDefault(); held.add(e.code); startMove(); return; }
    // —— Alt + 1/2/3：切换省/道/府显示 ——
    if (e.altKey && /^Digit[123]$/.test(e.code)) {
      e.preventDefault(); const lv = 'lv' + e.code.slice(5); App.S.meta[lv] = !App.S.meta[lv];
      App.UI.syncLv(); App.R.request(); App.autosave(); App.UI.toast(App.LEVELS[+e.code.slice(5)].full + (App.S.meta[lv] ? ' 显示' : ' 隐藏')); return;
    }
    if (e.code === 'Space') { spaceDown = true; e.preventDefault(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); T.deleteSel(); return; }
    if (e.key === 'Escape') { drag = null; if (T.hl) { T.highlight(0); return; } if (T.sel) { T.select(null); return; } T.set('select'); return; }
    if (e.key === 'Home') { e.preventDefault(); App.R.fit(); return; }
    if (e.key === 'Tab') { e.preventDefault(); document.body.classList.toggle('hide-panel'); setTimeout(App.R.resize, 30); return; }
    if (e.key === '?' || e.key === 'F1') { e.preventDefault(); App.UI.help(); return; }
    // —— 笔刷 ——
    const step = e.shiftKey ? 5 : 1;
    if (e.key === '[' || e.key === '{') { T.opt.brush = Math.max(0.5, T.opt.brush - step); App.UI.refreshTool(); App.R.request(); return; }
    if (e.key === ']' || e.key === '}') { T.opt.brush = Math.min(40, T.opt.brush + step); App.UI.refreshTool(); App.R.request(); return; }
    if (k === 'z' && ['color', 'nation', 'prov'].includes(T.cur)) { T.opt.erase = !T.opt.erase; App.UI.refreshTool(); App.UI.toast(T.opt.erase ? '橡皮' : '涂色'); return; }
    if (k === 'g' && ['color', 'nation', 'prov'].includes(T.cur)) { T.opt.fill = !T.opt.fill; App.UI.refreshTool(); App.R.request(); App.UI.toast(T.opt.fill ? '油漆桶' : '笔刷'); return; }
    if (k === 'i') { App.UI.profileCurrent(); return; }
    if (k === 'o') { App.UI.powerDialog(); return; }
    // —— 选工具 ——
    if (/^Digit[0-9]$/.test(e.code)) { const i = (+e.code.slice(5) + 9) % 10; if (T.NUM_TOOLS[i]) T.set(T.NUM_TOOLS[i]); return; }
    if (T.KEY_TOOLS[k]) T.set(T.KEY_TOOLS[k]);
  };

  // ---------- 覆盖层（光标、预览、选中） ----------
  T.drawOverlay = (c, s) => {
    const m = T.mouse;
    T.drawBrushPreview(c, s);
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

// ---- 选中国家高亮 ----
App.Tools.highlight = (id, openPanel = false) => {
  const T = App.Tools; T.hl = id || 0;
  if (id) { T.activeNation = id; T.activeProv = 0; if (openPanel && App.UI) { App.UI.tab = 'nations'; document.body.classList.add('panel-open'); } }
  if (App.UI) { App.UI.refresh(); App.UI.refreshTool(); }
  App.R.request();
};
