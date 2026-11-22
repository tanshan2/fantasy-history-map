// ===== 渲染 =====
(() => {
  const C = App.CELL, WW = App.WW, HH = App.HH;
  const R = (App.R = { view: { s: 0.5, ox: 0, oy: 0 }, labelBoxes: [], cityBoxes: [], refImg: null, refSrc: null });
  let canvas, ctx, dpr = 1, pats = {}, raf = 0;

  // 两种画风
  R.STYLES = {
    parchment: { name: '羊皮纸（偏暗做旧）', ocean: '#304a66', seaAlpha: 1, vignette: 'rgba(5,10,20,0.45)', grid: 'rgba(200,215,225,0.12)', aged: true,
      glow: [150, 186, 200], glowD: 8, glowA: 0.85, glowP: 1.6, nationA: 0.78, band: 0.9, paper: 1, tintA: 1,
      prov: ['rgba(60,22,12,.9)', 'rgba(35,20,10,.7)', 'rgba(35,20,10,.55)'], provW: [2.4, 1.15, 0.8], provDash: [null, [4, 2.5], [1.2, 2]], provHalo: 'rgba(245,230,200,.55)',
      borderShade: -0.55, borderW: 1.3, coast: '#1b2f45', coastW: 1.7, river: '#3f6f8a',
      label: (n) => U.rgba(U.shade(n.color, -0.8), 0.9), labelHalo: 'rgba(240,228,200,0.35)', provLabel: null, city: '#2e2218', cityHalo: 'rgba(236,222,190,.85)', ink: false },
    vivid: { name: '鲜明（游戏地图风）', ocean: '#3a86e0', seaAlpha: 0.75, vignette: 'rgba(10,40,110,0.25)', grid: 'rgba(255,255,255,0.13)',
      glow: [126, 186, 245], glowD: 4, glowA: 0.95, glowP: 0.7, nationA: 0.9, band: 0.35, paper: 0.55, tintA: 0.55,
      prov: ['rgba(120,120,120,.9)', 'rgba(140,140,140,.8)', 'rgba(150,150,150,.6)'], provW: [1.3, 0.95, 0.65], provDash: [null, null, [2, 2.2]],
      borderShade: -0.38, borderW: 2.3, coast: '#454f5c', coastW: 2.8, river: '#1f8c9a',
      label: (n) => '#2c2c2c', labelHalo: null, provLabel: 'rgba(45,45,45,.72)', city: '#2b2b2b', cityHalo: 'rgba(255,255,255,.75)', ink: true },
  };
  const ST = () => R.STYLES[App.S.meta.style] || R.STYLES.parchment;
  let REC = null; R.fontVer = 0;
  if (document.fonts) document.fonts.addEventListener("loadingdone", () => { R.fontVer++; R.request(); });
  const cityHitBox = (ct, u) => { if (App.S.meta.cityStyle === "icon") { const sz = R.cityIconSize(ct, u); return { x: ct.x, y: ct.y - sz * 0.45, r: sz * 0.5 }; } return { x: ct.x, y: ct.y, r: u * 0.9 }; };
  const labelKey = (s) => {
    // 只做数字运算，不拼接字符串（避免每帧产生大量垃圾导致卡顿）
    const S = App.S, m = S.meta, sh = (t) => { let h = 0; if (t) for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; };
    let ck = S.cities.length, ak = 0, pk = S.provinces.length, nk = S.nations.length;
    for (const k of S.cities) ck = (ck * 7 + k.x * 3 + k.y * 5 + sh(k.name) + k.type.length) % 1e9;
    if (m.showArmies) for (const a of S.armies) ak = (ak * 7 + a.x + a.y * 3) % 1e9;
    for (const n of S.nations) nk = (nk * 31 + sh(n.name) + sh(n.color)) | 0;
    for (const p of S.provinces) pk = (pk * 31 + sh(p.name) + p.id) | 0;
    const f = ({ pol: 128, phys: 256 }[R.mode()] || 0) + (m.showProvLabels ? 1 : 0) + (m.lv1 ? 2 : 0) + (m.lv2 ? 4 : 0) + (m.lv3 ? 8 : 0) + (m.cityStyle === "icon" ? 16 : 0) + (m.showCityLabels ? 32 : 0) + (m.showArmies ? 64 : 0);
    return [App.Geo.polVer, Math.round(Math.log(s) * 30), f, R.fontVer, ck, ak, nk, pk, sh(m.style), sh(m.labelFont), sh(m.latinFont)];
  };

  R.init = (cv) => { canvas = cv; ctx = cv.getContext('2d'); R.resize(); };
  R.resize = () => {
    dpr = window.devicePixelRatio || 1;
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
    R.request();
  };
  R.fit = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    const s = Math.min(r.width / WW, r.height / HH) * 0.96;
    R.view = { s, ox: (r.width - WW * s) / 2, oy: (r.height - HH * s) / 2 };
    R.request();
  };
  R.toWorld = (sx, sy) => [(sx - R.view.ox) / R.view.s, (sy - R.view.oy) / R.view.s];
  // 当前地图模式；画地形、森林、河流、陆海时自动看到地形
  R.mode = () => { const m = App.S.nations.length ? App.S.meta.mapView || 'all' : 'all', t = App.Tools && App.Tools.cur; return m === 'pol' && ['terrain', 'forest', 'river', 'land'].includes(t) ? 'all' : m; };
  R.request = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; R.draw(); }); };

  const isLatin = (t) => /^[\x00-\x7FÀ-ɏ\s'’-]+$/.test(t);
  const fontFor = (txt, size, weight = 700, fam) => {
    const f = fam || (isLatin(txt) ? App.S.meta.latinFont : App.S.meta.labelFont);
    return `${weight} ${size}px "${f}", "Noto Serif SC", serif`;
  };
  R.fontFor = fontFor;

  // 主绘制（也用于导出：传入 ctx/view）
  R.draw = (opt = {}) => {
    const S = App.S, G = App.Geo, st = ST();
    G.update();
    G.buildGlow(S.meta.style, st.glow, st.glowD, st.glowA, st.glowP);
    const c = opt.ctx || ctx, view = opt.view || R.view, s = view.s, k = opt.scale || dpr, exp = !!opt.ctx;
    const sw = (px) => (px * Math.pow(s, 0.5)) / s;
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (!exp) { c.fillStyle = '#151b26'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); }
    c.setTransform(k * s, 0, 0, k * s, k * view.ox, k * view.oy);
    const vx0 = -view.ox / s, vy0 = -view.oy / s, vx1 = vx0 + c.canvas.width / k / s, vy1 = vy0 + c.canvas.height / k / s;
    const inView = (x, y, m = 40) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;
    c.save();
    c.beginPath(); c.rect(0, 0, WW, HH); c.clip();
    if (!pats.sea || exp) pats = { sea: c.createPattern(App.Sprites.sea, 'repeat'), paper: c.createPattern(App.Sprites.paper, 'repeat') };
    // 海洋
    c.fillStyle = S.meta.ocean || st.ocean; c.fillRect(0, 0, WW, HH);
    const vg = c.createRadialGradient(WW / 2, HH / 2, HH * 0.2, WW / 2, HH / 2, WW * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0.06)'); vg.addColorStop(1, st.vignette);
    c.fillStyle = vg; c.fillRect(0, 0, WW, HH);
    c.globalAlpha = st.seaAlpha; c.fillStyle = pats.sea; c.fillRect(0, 0, WW, HH); c.globalAlpha = 1;
    if (S.meta.showGrid) {
      c.strokeStyle = st.grid; c.lineWidth = sw(0.8); c.beginPath();
      for (let x = 0; x <= WW; x += 80) { c.moveTo(x, 0); c.lineTo(x, HH); }
      for (let y = 0; y <= HH; y += 80) { c.moveTo(0, y); c.lineTo(WW, y); }
      c.stroke();
    }
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(G.glowCanvas, 0, 0, WW, HH);
    // 陆地
    // 有高精度矢量海岸（真实地理模板）时用它，否则用格子推算的海岸
    if (S.meta.vec && G.vecKey !== S.meta.vec && App.Templates) App.Templates.ensureVec(S.meta.vec);
    const vec = S.meta.vec && G.vecKey === S.meta.vec ? G.vecCoast : null;
    const coast = vec || G.coastPath;
    c.save(); c.clip(coast, 'evenodd');
    c.fillStyle = '#f1e9d6'; c.fillRect(0, 0, WW, HH);
    // 地图模式：政区（不画山、林、河）/ 地形（不画国家填色和行政区）/ 综合
    const MODE = R.mode(), POL = MODE !== 'phys', PHY = MODE !== 'pol';
    c.globalAlpha = st.tintA * (PHY ? 1 : 0.3); c.drawImage(G.tintCanvas, 0, 0, WW, HH); c.globalAlpha = 1;
    // 地形 & 森林图标
    if (PHY && S.meta.showIcons && G.icons) {
      c.globalAlpha = POL ? 0.78 : 1;
      const dens = U.clamp(s * 1.6, 0.35, 1);
      const inkMap = { mtn: 'inkMtn', snow: 'inkSnow', hill: 'inkHill' };
      for (const ic of G.icons) {
        if (!inView(ic.x, ic.y)) continue;
        if (ic.k.startsWith('tree') && ic.r > 0.15 * dens) continue;
        const key = st.ink && inkMap[ic.k] ? inkMap[ic.k] : ic.k;
        const spr = App.Sprites[key]; if (!spr) continue;
        const im = spr[ic.v], w = ic.s * (key === 'inkHill' ? 0.9 : 1), h = (w * im.height) / im.width;
        c.drawImage(im, ic.x - w / 2, ic.y - h + w * 0.08, w, h);
      }
      c.globalAlpha = 1;
    }
    // 河流嵌在地面里：画在国家颜色之下
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (PHY) S.rivers.forEach((r) => drawRiver(c, r, sw, st));
    if (POL) { c.globalCompositeOperation = 'multiply'; S.nations.forEach((n) => { const p = G.nationPaths.get(n.id); if (!p) return; c.fillStyle = U.rgba(U.shade(n.color, 0.12), st.nationA * 0.8); c.fill(p, 'evenodd'); }); c.globalCompositeOperation = 'source-over'; }
    // 附庸 / 封国：叠一层宗主颜色的斜纹
    if (POL && S.meta.showVassal !== false) S.nations.forEach((n) => { const ov = n.overlord && App.nation(n.overlord), p = G.nationPaths.get(n.id); if (!ov || !p) return; c.fillStyle = vassalPat(c, ov.color); c.globalAlpha = Math.min(0.5, st.nationA * 0.7); c.fill(p, 'evenodd'); c.globalAlpha = 1; });
    c.globalAlpha = POL ? st.band : 0; c.drawImage(G.bandCanvas, 0, 0, WW, HH); c.globalAlpha = 1;
    if (S.meta.showClimate) { c.globalAlpha = 0.62; c.drawImage(App.Climate.canvas, 0, 0, WW, HH); c.globalAlpha = 1; }
    c.globalAlpha = st.paper; c.globalCompositeOperation = 'multiply'; c.fillStyle = pats.paper; c.fillRect(0, 0, WW, HH); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    if (st.aged) { c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgb(222,200,158)'; c.fillRect(0, 0, WW, HH); c.globalCompositeOperation = 'source-over'; }
    // 行政区界（三级，从细到粗）
    if (POL && G.provPaths) for (let lv = 3; lv >= 1; lv--) {
      if (!S.meta['lv' + lv] || !G.provPaths[lv]) continue;
      if (lv === 1 && st.provHalo) { c.setLineDash([]); c.strokeStyle = st.provHalo; c.lineWidth = sw(st.provW[0] + 1.6); c.stroke(G.provPaths[1]); }
      const d = st.provDash[lv - 1]; c.setLineDash(d ? d.map(sw) : []);
      c.strokeStyle = st.prov[lv - 1]; c.lineWidth = sw(st.provW[lv - 1]); c.stroke(G.provPaths[lv]);
    }
    c.setLineDash([]);
    if (!POL) c.setLineDash([sw(5), sw(3)]);
    S.nations.forEach((n) => { const p = G.nationPaths.get(n.id); if (!p) return; c.strokeStyle = POL ? U.shade(n.color, st.borderShade) : 'rgba(90,30,20,.6)'; c.lineWidth = sw(POL ? st.borderW : 1.3); c.stroke(p); });
    c.setLineDash([]);
    c.restore();
    if (!exp && App.Tools && App.Tools.wetOn) { App.Tools.flushWet(); c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = Math.min(0.85, st.nationA + 0.05); c.drawImage(App.Tools.wet, 0, 0, WW, HH); c.restore(); c.imageSmoothingEnabled = true; }
    // 海岸线
    if (vec && G.lakePath) { c.fillStyle = S.meta.ocean || st.ocean; c.fill(G.lakePath, "evenodd"); c.globalAlpha = st.seaAlpha; c.fillStyle = pats.sea; c.fill(G.lakePath, "evenodd"); c.globalAlpha = 1; c.strokeStyle = st.coast; c.lineWidth = sw(st.coastW * 0.8); c.stroke(G.lakePath); }
    c.strokeStyle = st.coast; c.lineWidth = sw(st.coastW); c.lineJoin = 'round'; c.stroke(coast);
    c.lineCap = 'round'; c.lineJoin = 'round';
    S.lines.forEach((l) => drawLine(c, l, sw));
    if (S.meta.showArmies) S.arrows.forEach((a) => drawArrow(c, a, sw));
    S.markers.forEach((m) => drawMarker(c, m, s, sw));
    if (st.aged) {
      const ag = c.createRadialGradient(WW / 2, HH / 2, HH * 0.35, WW / 2, HH / 2, WW * 0.62);
      ag.addColorStop(0, 'rgba(255,255,255,0)'); ag.addColorStop(1, 'rgba(120,85,40,0.55)');
      c.globalCompositeOperation = 'multiply'; c.fillStyle = ag; c.fillRect(0, 0, WW, HH);
      c.fillStyle = pats.paper; c.globalAlpha = 0.35; c.fillRect(0, 0, WW, HH); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    if (!exp && App.Tools && App.Tools.hl) drawHighlight(c, App.Tools.hl, s, sw, coast, vec);
    // 多选的国家：提亮 + 金色虚线描边
    if (!exp && App.Tools && App.Tools.multi && App.Tools.multi.size) {
      c.save(); if (vec) c.clip(coast, 'evenodd');
      App.Tools.multi.forEach((id) => { const p = G.nationPaths.get(id), n = App.nation(id); if (!p || !n) return; c.save(); c.clip(p, 'evenodd'); c.globalCompositeOperation = 'screen'; c.fillStyle = U.rgba(U.shade(n.color, 0.55), 0.3); c.fillRect(0, 0, WW, HH); c.restore(); });
      c.lineJoin = 'round'; c.setLineDash([sw(6), sw(4)]);
      App.Tools.multi.forEach((id) => { const p = G.nationPaths.get(id); if (!p) return; c.strokeStyle = 'rgba(40,24,8,.7)'; c.lineWidth = sw(4); c.stroke(p); c.strokeStyle = '#ffd76e'; c.lineWidth = sw(2.2); c.stroke(p); });
      c.setLineDash([]); c.restore();
    }
    // 城市
    const u = 6 * Math.pow(s, 0.5) / s;
    R.cityBoxes = [];
    const cities = S.cities.filter((ct) => inView(ct.x, ct.y)).sort((a, b) => a.y - b.y);
    cities.forEach((ct) => drawCity(c, ct, u, s, st));
    if (S.meta.showArmies) S.armies.forEach((a) => { if (inView(a.x, a.y)) drawArmy(c, a, u); });
    // 标签
    // 标签：排布结果缓存（内容和缩放级别不变时直接重用，拖动地图不再重算）
    const lk = labelKey(s);
    let LC = opt.ctx ? null : R._lc;
    if (!LC || LC.key.length !== lk.length || LC.key.some((v, i) => v !== lk[i])) {
      const allC = S.cities.slice().sort((a, b) => a.y - b.y);
      R.labelBoxes = [];
      const cl = S.meta.showCityLabels ? R.layoutCityLabels(c, allC, u, s) : { list: [], boxes: [] };
      const soft = cl.boxes.concat(allC.map((ct) => cityHitBox(ct, u)).map((b) => [b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r]));
      if (S.meta.showArmies) S.armies.forEach((a) => soft.push([a.x - u * 2.2, a.y - u * 2.6, a.x + u * 2.2, a.y + u * 2.6]));
      const rec = []; REC = rec; drawRegionLabels(c, s, st, soft); REC = null;
      LC = { key: lk, rec, boxes: R.labelBoxes.slice(), cities: cl.list };
      if (!opt.ctx) R._lc = LC;
    }
    R.labelBoxes = LC.boxes;
    LC.rec.forEach((r) => { if (inView(r.g.x, r.g.y, r.g.size * 12)) drawLabel(c, r.g, r.fill, r.halo, r.weight); });
    LC.cities.forEach((ct) => { if (inView(ct.x, ct.y, 200)) drawCityLabel(c, ct, u, s, st); });
    if (S.meta.showFamilies) (S.families || []).forEach((f) => {
      const ct = S.cities.find((k) => k.id === f.home); if (!ct || !inView(ct.x, ct.y)) return;
      const sz = u * 1.15, x = ct.x + u * 1.2, y = ct.y - R.cityIconSize(ct, u) * 0.9;
      c.font = fontFor(f.name, sz, 700); const tw = c.measureText(f.name).width + sz * 0.8;
      c.strokeStyle = "#2b2b2b"; c.lineWidth = u * 0.15; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + sz * 2.6); c.stroke();
      c.fillStyle = f.color; c.beginPath(); c.moveTo(x, y); c.lineTo(x + tw, y); c.lineTo(x + tw - sz * 0.35, y + sz * 0.7); c.lineTo(x + tw, y + sz * 1.4); c.lineTo(x, y + sz * 1.4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#1e1e1e"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(f.name, x + sz * 0.3, y + sz * 0.72);
    });
    S.texts.forEach((t) => drawText(c, t));
    const ref = S.meta.ref;
    if (ref && ref.visible && ref.src) {
      if (R.refSrc !== ref.src) { R.refImg = new Image(); R.refImg.onload = R.request; R.refImg.src = ref.src; R.refSrc = ref.src; }
      if (R.refImg.complete && R.refImg.naturalWidth) { c.globalAlpha = ref.opacity; c.drawImage(R.refImg, ref.x, ref.y, ref.w, ref.h); c.globalAlpha = 1; }
    }
    c.restore();
    c.strokeStyle = '#0d1420'; c.lineWidth = 3 / s; c.strokeRect(0, 0, WW, HH);
    c.strokeStyle = 'rgba(214,196,150,.8)'; c.lineWidth = 1 / s; c.strokeRect(-4 / s, -4 / s, WW + 8 / s, HH + 8 / s);
    if (!exp && App.Tools) App.Tools.drawOverlay(c, s);
  };

  // ---- 选中国家高亮：聚光、光晕、飞地标注 ----
  const VPAT = new Map();
  const vassalPat = (c, col) => {
    if (VPAT.has(col)) return VPAT.get(col);
    const k = 26, cv = document.createElement('canvas'); cv.width = cv.height = k; const g = cv.getContext('2d');
    g.strokeStyle = U.shade(col, -0.12); g.lineWidth = 3.2; g.lineCap = 'square';
    for (const o of [-k, 0, k]) { g.beginPath(); g.moveTo(o, k); g.lineTo(o + k, 0); g.stroke(); }
    const p = c.createPattern(cv, 'repeat'); VPAT.set(col, p); return p;
  };
  const drawHighlight = (c, id, s, sw, coast, vec) => {
    const G = App.Geo, p = G.nationPaths.get(id), n = App.nation(id); if (!p || !n) return;
    c.save();
    const out = new Path2D(); out.rect(-WW, -HH, WW * 3, HH * 3); out.addPath(p);
    // 1) 压暗其他地方（领土之外）
    c.fillStyle = "rgba(12,9,6,0.34)"; c.fill(out, "evenodd");
    c.restore(); c.save();
    if (vec) c.clip(coast, "evenodd");
    // 2) 领土提亮
    c.save(); c.clip(p, "evenodd"); c.globalCompositeOperation = "screen"; c.fillStyle = U.rgba(U.shade(n.color, 0.55), 0.32); c.fillRect(-WW, -HH, WW * 3, HH * 3); c.restore();
    // 3) 金色光晕描边
    c.lineJoin = "round";
    [[9, 0.16], [5.5, 0.3], [3, 0.55]].forEach(([w, a]) => { c.strokeStyle = `rgba(255,214,110,${a})`; c.lineWidth = sw(w); c.stroke(p); });
    c.strokeStyle = "#fff3c4"; c.lineWidth = sw(1.3); c.stroke(p);
    c.restore();
    // 4) 飞地：虚线圈 + 标注
    const comps = G.nationComps(id);
    comps.slice(1).forEach((k) => {
      const r = Math.max(k.box[2] - k.box[0], k.box[3] - k.box[1]) / 2 + 9 / s;
      c.save(); c.setLineDash([5 / s, 4 / s]); c.strokeStyle = "#ffd66e"; c.lineWidth = 2 / s;
      c.beginPath(); c.arc((k.box[0] + k.box[2]) / 2, (k.box[1] + k.box[3]) / 2, r, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      const fz = 11 / s; c.font = `700 px "Noto Serif SC", serif`; c.textAlign = "center"; c.textBaseline = "bottom";
      c.lineWidth = fz * 0.3; c.strokeStyle = "rgba(30,20,10,.85)"; c.strokeText("飞地", (k.box[0] + k.box[2]) / 2, (k.box[1] + k.box[3]) / 2 - r - 2 / s);
      c.fillStyle = "#ffe9a8"; c.fillText("飞地", (k.box[0] + k.box[2]) / 2, (k.box[1] + k.box[3]) / 2 - r - 2 / s);
      c.restore();
    });
    c.restore();
  };

  // ---- 河流 ----
  const drawRiver = (c, r, sw, st = ST()) => {
    const pts = U.smooth(r.pts, 5); if (pts.length < 2) return;
    const n = pts.length, w1 = r.width || 2.2;
    c.strokeStyle = st.river;
    for (let i = 1; i < n; i++) {
      const t = i / n; c.lineWidth = sw(0.45) + (w1 * Math.pow(t, 0.8)) * 0.9;
      c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    }
  };
  R.drawRiver = drawRiver;

  // ---- 线条 ----
  const drawLine = (c, l, sw) => {
    const pts = U.smooth(l.pts, 4); if (pts.length < 2) return;
    const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
    c.save();
    const col = l.color;
    switch (l.style) {
      case 'border': path(); c.strokeStyle = 'rgba(245,235,210,.5)'; c.lineWidth = sw(3.2); c.stroke(); c.strokeStyle = col || '#5a2418'; c.lineWidth = sw(1.6); c.stroke(); break;
      case 'admin': path(); c.setLineDash([sw(4), sw(3)]); c.strokeStyle = col || 'rgba(70,45,30,.75)'; c.lineWidth = sw(1); c.stroke(); break;
      case 'road': path(); c.setLineDash([sw(2.5), sw(2)]); c.strokeStyle = col || '#7a4f2c'; c.lineWidth = sw(1.1); c.stroke(); break;
      case 'sea': path(); c.setLineDash([sw(7), sw(5)]); c.strokeStyle = col || 'rgba(225,225,225,.85)'; c.lineWidth = sw(2.2); c.stroke(); break;
      case 'wall': { c.restore(); App.Walls.draw(c, l, sw, 1 / (sw(1) * sw(1))); return; }
      case 'front': {
        path(); c.strokeStyle = col || '#9c1f16'; c.lineWidth = sw(1.8); c.stroke();
        c.fillStyle = col || '#9c1f16'; const st = sw(7);
        U.resample(pts, st).forEach(([x, y, a]) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-sw(2.5), 0); c.lineTo(sw(2.5), 0); c.lineTo(0, -sw(4)); c.closePath(); c.fill(); c.restore(); });
        break;
      }
    }
    c.restore();
  };

  // ---- 进军箭头 ----
  const arrowPoly = (a) => {
    const pts = U.smooth(a.pts, 6); if (pts.length < 2) return null;
    const total = U.polyLen(pts), w = a.width || 14, head = Math.min(w * 2.2, total * 0.5);
    const L = [], Rr = []; let acc = 0, cut = pts.length - 1;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) acc += U.dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      if (acc > total - head) { cut = i; break; }
      const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
      const ang = Math.atan2(q[1] - o[1], q[0] - o[0]), hw = (w / 2) * (0.45 + 0.55 * (acc / total));
      L.push([p[0] + Math.sin(ang) * hw, p[1] - Math.cos(ang) * hw]); Rr.push([p[0] - Math.sin(ang) * hw, p[1] + Math.cos(ang) * hw]);
    }
    const end = pts[pts.length - 1], b = pts[Math.max(0, cut - 1)];
    const ang = Math.atan2(end[1] - b[1], end[0] - b[0]), hw = w * 1.05;
    const bx = end[0] - Math.cos(ang) * head, by = end[1] - Math.sin(ang) * head;
    return [...L, [bx + Math.sin(ang) * hw, by - Math.cos(ang) * hw], end, [bx - Math.sin(ang) * hw, by + Math.cos(ang) * hw], ...Rr.reverse()];
  };
  const drawArrow = (c, a, sw) => {
    const poly = arrowPoly(a); if (!poly) return;
    const n = App.nation(a.nation), col = n ? n.color : '#c0392b';
    c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.fillStyle = U.rgba(U.shade(col, 0.12), 0.92); c.fill();
    c.strokeStyle = '#2a2a2a'; c.lineWidth = sw(1.1); c.stroke();
  };

  // ---- 标记 ----
  const drawMarker = (c, m, s, sw) => {
    const u = 7 * Math.pow(s, 0.5) / s;
    c.save(); c.translate(m.x, m.y); c.lineCap = 'round';
    if (m.type === 'battle') {
      c.strokeStyle = '#f3e7cc'; c.lineWidth = u * 0.55;
      const sword = () => { c.beginPath(); c.moveTo(-u, -u); c.lineTo(u, u); c.moveTo(-u * 0.95, -u * 0.35); c.lineTo(-u * 0.35, -u * 0.95); c.stroke(); };
      c.save(); sword(); c.scale(-1, 1); sword(); c.restore();
      c.strokeStyle = '#2a2a2a'; c.lineWidth = u * 0.25; c.save(); sword(); c.scale(-1, 1); sword(); c.restore();
    } else if (m.type === 'ruin') {
      c.fillStyle = '#5a4632'; [-0.6, 0, 0.6].forEach((x, i) => c.fillRect(x * u - u * 0.15, -u * (0.4 + (i % 2) * 0.4), u * 0.3, u * (0.8 + (i % 2) * 0.4))); c.fillRect(-u, u * 0.4, u * 2, u * 0.25);
    } else if (m.type === 'temple') {
      c.fillStyle = '#7a2e1f'; c.beginPath(); c.moveTo(-u * 1.1, -u * 0.2); c.quadraticCurveTo(0, -u * 0.9, u * 1.1, -u * 0.2); c.closePath(); c.fill();
      c.fillRect(-u * 0.7, -u * 0.2, u * 0.2, u); c.fillRect(u * 0.5, -u * 0.2, u * 0.2, u); c.fillRect(-u * 0.9, u * 0.75, u * 1.8, u * 0.2);
    } else if (m.type === 'mine') {
      c.strokeStyle = '#3b2a1d'; c.lineWidth = u * 0.25; c.beginPath(); c.moveTo(-u * 0.8, u * 0.8); c.lineTo(u * 0.6, -u * 0.6); c.stroke();
      c.beginPath(); c.arc(u * 0.6, -u * 0.6, u * 0.7, Math.PI * 0.6, Math.PI * 1.9); c.stroke();
    }
    if (m.name) {
      c.font = fontFor(m.name, u * 1.3, 700); c.textAlign = 'center'; c.textBaseline = 'top';
      c.lineWidth = u * 0.35; c.strokeStyle = 'rgba(245,235,210,.85)'; c.strokeText(m.name, 0, u * 1.2); c.fillStyle = '#6b1a12'; c.fillText(m.name, 0, u * 1.2);
    }
    c.restore();
  };

  // ---- 城市 ----
  const ICON_K = { capital: 4.6, large: 3.9, medium: 3.3, small: 2.8, village: 2.4, fortress: 3.6, port: 3.4, pass: 3.2 };
  const CITY_FONT = { capital: 1.9, large: 1.6, medium: 1.45, small: 1.25, village: 1.1, fortress: 1.35, port: 1.35, pass: 1.25 };
  const CITY_MIN = { capital: 0, large: 0.3, medium: 0.45, small: 0.75, village: 1.0, fortress: 0.45, port: 0.6, pass: 0.6 };
  R.cityIconSize = (ct, u) => u * (ICON_K[ct.type] || 3);
  const drawCity = (c, ct, u, s, st) => {
    if (s < (CITY_MIN[ct.type] ?? 0.5) * 0.7 && ct.type !== 'capital' && ct.type !== 'large') return;
    if (App.S.meta.cityStyle === 'icon') {
      const im = App.Sprites.city[ct.type] || App.Sprites.city.medium, sz = R.cityIconSize(ct, u);
      c.drawImage(im, ct.x - sz / 2, ct.y - sz * 0.92, sz, sz);
      R.cityBoxes.push({ id: ct.id, x: ct.x, y: ct.y - sz * 0.45, r: sz * 0.5 });
      return;
    }
    // 简洁样式：空心圆 / 小旗
    c.save(); c.translate(ct.x, ct.y);
    const own = App.nation(App.S.owner[App.Ops.cellAt(ct.x, ct.y)] || 0);
    if (ct.type === 'village') {
      const col = own ? U.shade(own.color, -0.35) : '#c0603a';
      c.strokeStyle = '#3a3a3a'; c.lineWidth = u * 0.14; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -u * 1.3); c.stroke();
      c.fillStyle = col; c.fillRect(0, -u * 1.3, u * 0.75, u * 0.55); c.strokeRect(0, -u * 1.3, u * 0.75, u * 0.55);
    } else {
      const r = { capital: 0.75, large: 0.62, medium: 0.52, small: 0.42 }[ct.type] || 0.5;
      c.beginPath(); c.arc(0, 0, u * r, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#2b2b2b'; c.lineWidth = u * 0.22; c.stroke();
      if (ct.type === 'capital') { c.beginPath(); c.arc(0, 0, u * 0.32, 0, Math.PI * 2); c.fillStyle = '#c0281c'; c.fill(); }
      if (ct.type === 'fortress' || ct.type === 'pass') { c.fillStyle = '#2b2b2b'; c.fillRect(-u * 0.5, -u * 0.5, u, u); }
      if (ct.type === 'port') { c.beginPath(); c.arc(0, 0, u * 0.25, 0, Math.PI * 2); c.fillStyle = '#2e6bd0'; c.fill(); }
    }
    c.restore();
    R.cityBoxes.push({ id: ct.id, x: ct.x, y: ct.y, r: u * 0.9 });
  };
  const drawCityLabel = (c, ct, u, s, st) => {
    if (!ct.name || s < (CITY_MIN[ct.type] ?? 0.5)) return;
    const size = u * (CITY_FONT[ct.type] || 1.3);
    c.font = fontFor(ct.name, size, ct.type === 'capital' ? 800 : 600);
    c.textAlign = 'center'; c.lineJoin = 'round';
    let x = ct.x, y;
    if (App.S.meta.cityStyle === 'icon') { c.textBaseline = 'top'; y = ct.y + u * 0.25; }
    else { c.textBaseline = 'bottom'; y = ct.y - u * (ct.type === 'village' ? 1.5 : 0.8); }
    c.lineWidth = size * 0.3; c.strokeStyle = st.cityHalo; c.strokeText(ct.name, x, y);
    c.fillStyle = ct.type === 'capital' ? '#5a140d' : st.city; c.fillText(ct.name, x, y);
  };

  // ---- 军队（细分兵种符号） ----
  const drawArmy = (c, a, u) => {
    const n = App.nation(a.nation), col = n ? n.color : '#999', ink = U.shade(col, -0.7);
    u *= 1.35; const w = u * 2.8, h = u * 1.8, x0 = -w / 2, y0 = -h / 2;
    c.save(); c.translate(a.x, a.y);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x0 + u * 0.15, y0 + u * 0.15, w, h);
    c.fillStyle = col; c.fillRect(x0, y0, w, h);
    c.strokeStyle = ink; c.lineWidth = u * 0.18; c.strokeRect(x0, y0, w, h);
    c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = u * 0.16; c.lineCap = 'round';
    const L = (...p) => { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke(); };
    const X = () => { L(x0, y0, -x0, -y0); L(-x0, y0, x0, -y0); };
    const SL = () => L(x0, -y0, -x0, y0);
    const bow = (cx, cy, r) => { c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); c.stroke(); L(cx, cy - r, cx, cy + r); };
    const t = a.type;
    switch (t) {
      case 'infantry': X(); break;
      case 'heavyInf': X(); c.fillRect(x0, -y0 - h * 0.22, w, h * 0.22); break;
      case 'spear': X(); L(0, y0 - u * 0.5, 0, -y0); c.beginPath(); c.moveTo(-u * 0.25, y0 - u * 0.2); c.lineTo(0, y0 - u * 0.7); c.lineTo(u * 0.25, y0 - u * 0.2); c.fill(); break;
      case 'shield': X(); c.beginPath(); c.moveTo(-u * 0.45, -u * 0.4); c.lineTo(u * 0.45, -u * 0.4); c.lineTo(u * 0.45, u * 0.1); c.quadraticCurveTo(0, u * 0.6, -u * 0.45, u * 0.1); c.closePath(); c.fillStyle = col; c.fill(); c.stroke(); break;
      case 'archer': bow(-w * 0.12, 0, h * 0.34); L(-w * 0.3, 0, w * 0.3, 0); break;
      case 'crossbow': c.beginPath(); c.arc(0, h * 0.15, w * 0.3, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); L(0, -h * 0.35, 0, h * 0.38); L(-w * 0.12, h * 0.25, w * 0.12, h * 0.25); break;
      case 'guard': X(); c.fillStyle = '#ffd34d'; c.strokeStyle = ink; c.lineWidth = u * 0.1; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? u * 0.22 : u * 0.5, an = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.stroke(); break;
      case 'militia': c.setLineDash([u * 0.3, u * 0.25]); X(); c.setLineDash([]); break;
      case 'cavalry': SL(); break;
      case 'heavyCav': SL(); c.fillRect(x0, -y0 - h * 0.22, w, h * 0.22); L(x0, y0, -x0 * 0.2, -y0); break;
      case 'horseArcher': SL(); c.lineWidth = u * 0.12; bow(w * 0.18, -h * 0.12, h * 0.22); break;
      case 'lancer': SL(); L(0, y0 - u * 0.5, 0, -y0); c.beginPath(); c.moveTo(-u * 0.25, y0 - u * 0.2); c.lineTo(0, y0 - u * 0.7); c.lineTo(u * 0.25, y0 - u * 0.2); c.fill(); break;
      case 'camel': SL(); c.beginPath(); c.moveTo(-w * 0.3, h * 0.2); c.quadraticCurveTo(-w * 0.15, -h * 0.35, 0, h * 0.05); c.quadraticCurveTo(w * 0.15, -h * 0.35, w * 0.3, h * 0.2); c.stroke(); break;
      case 'elephant': c.beginPath(); c.ellipse(-w * 0.05, 0, w * 0.26, h * 0.26, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(w * 0.18, -h * 0.05); c.quadraticCurveTo(w * 0.36, h * 0.05, w * 0.3, h * 0.36); c.stroke(); L(-w * 0.18, h * 0.2, -w * 0.18, h * 0.4); L(w * 0.05, h * 0.2, w * 0.05, h * 0.4); break;
      case 'chariot': SL(); [-w * 0.2, w * 0.2].forEach((cx) => { c.beginPath(); c.arc(cx, h * 0.18, h * 0.16, 0, Math.PI * 2); c.stroke(); }); break;
      case 'siege': c.beginPath(); c.arc(0, 0, h * 0.25, 0, Math.PI * 2); c.fill(); L(-w * 0.35, h * 0.3, w * 0.35, h * 0.3); break;
      case 'navy': c.beginPath(); c.moveTo(-w * 0.32, 0); c.quadraticCurveTo(0, h * 0.45, w * 0.32, 0); c.closePath(); c.stroke(); L(0, 0, 0, -h * 0.38, w * 0.2, -h * 0.1, 0, -h * 0.1); break;
      default: X();
    }
    const fz = u * 1.1;
    const tx = (txt, y, base) => { c.font = fontFor(txt, fz, 800); c.textAlign = 'center'; c.textBaseline = base; c.lineWidth = fz * 0.3; c.strokeStyle = 'rgba(255,255,255,.9)'; c.strokeText(txt, 0, y); c.fillStyle = '#222'; c.fillText(txt, 0, y); };
    if (a.strength) tx(a.strength, y0 - u * 0.15, 'bottom');
    if (a.name) tx(a.name, -y0 + u * 0.2, 'top');
    c.restore();
  };

  // ---- 国名 / 行政区名（固定在区域内，自动摆放） ----
  const splitName = (name) => {
    if (/[一-鿿]/.test(name) || name.length <= 13 || !name.includes(' ')) return [name];
    const words = name.split(' '); let best = [name], bd = Infinity;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), d = Math.abs(a.length - b.length); if (d < bd) { bd = d; best = [a, b]; } }
    return best;
  };
  // 返回标签几何：x,y,ang,size,lines,cjk
  const geomFor = (name, info, maxSize, minSize, scaleK = 1) => {
    const lines = splitName(name), cjk = /[一-鿿]/.test(name);
    const longest = Math.max(...lines.map((l) => Array.from(l).length), 1);
    let ang = U.clamp(info.ang, -0.55, 0.55);
    if (info.L < info.r * 2.6) ang = 0; // 近似圆形区域保持水平
    const along = Math.max(info.L * 0.78, info.r * 1.8);
    let size = Math.min(along / (longest * (cjk ? 1.45 : 0.62)), (info.r * 1.5) / lines.length) * scaleK;
    size = U.clamp(size, minSize, maxSize);
    return { x: info.x, y: info.y, ang, size, lines, cjk, longest };
  };
  const labelLayout = (c, g, weight, fam) => {
    c.save(); c.font = fontFor(g.lines[0], g.size, weight, fam);
    const lh = g.size * 1.12; let maxW = 0;
    g.lines.forEach((line) => {
      if (g.cjk) { const n = Array.from(line).length, step = g.size * (n > 2 ? 1.25 : 1.45); maxW = Math.max(maxW, step * (n - 1) + g.size); }
      else { if ('letterSpacing' in c) c.letterSpacing = g.size * 0.04 + 'px'; maxW = Math.max(maxW, c.measureText(line).width); if ('letterSpacing' in c) c.letterSpacing = '0px'; }
    });
    c.restore();
    return { halfW: maxW / 2 + g.size * 0.15, halfH: (g.lines.length * lh) / 2 };
  };
  const drawLabel = (c, g, fill, halo, weight, fam) => {
    c.save(); c.translate(g.x, g.y); c.rotate(g.ang); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.font = fontFor(g.lines[0], g.size, weight, fam);
    const lh = g.size * 1.12;
    g.lines.forEach((line, li) => {
      const ly = (li - (g.lines.length - 1) / 2) * lh;
      if (g.cjk) {
        const chars = Array.from(line), step = g.size * (chars.length > 2 ? 1.25 : 1.45), tot = step * (chars.length - 1);
        chars.forEach((ch, i) => { const cx = -tot / 2 + i * step; if (halo) { c.lineWidth = g.size * 0.07; c.strokeStyle = halo; c.strokeText(ch, cx, ly); } c.fillStyle = fill; c.fillText(ch, cx, ly); });
      } else {
        if ('letterSpacing' in c) c.letterSpacing = g.size * 0.04 + 'px';
        if (halo) { c.lineWidth = g.size * 0.07; c.strokeStyle = halo; c.strokeText(line, 0, ly); }
        c.fillStyle = fill; c.fillText(line, 0, ly);
        if ('letterSpacing' in c) c.letterSpacing = '0px';
      }
    });
    c.restore();
  };
  // 旋转矩形的外接框 & 碰撞
  const aabb = (x, y, ang, hw, hh, pad = 0) => { const cs = Math.abs(Math.cos(ang)), sn = Math.abs(Math.sin(ang)); const w = hw * cs + hh * sn + pad, h = hw * sn + hh * cs + pad; return [x - w, y - h, x + w, y + h]; };
  const hits = (a, list) => list.some((b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]);
  R.nationLabelGeom = (n) => { const info = App.Geo.labels.get(n.id); return info ? geomFor(n.name || '', info, 130, 7) : null; };

  // 标签排布：每个名字只放在自己的区域内，依次尝试多个候选位置与缩小字号，避免压住其他名字和城市
  const drawRegionLabels = (c, s, st, soft) => {
    const S = App.S, G = App.Geo, placed = [];
    // 名字的采样点是否落在自己的区域里
    const inside = (arr, id, g, m) => {
      if (!arr) return true;
      const cs = Math.cos(g.ang), sn = Math.sin(g.ang); let ok = 0, tot = 0;
      for (const fx of [-0.9, -0.45, 0, 0.45, 0.9]) for (const fy of [-0.7, 0, 0.7]) {
        const lx = fx * m.halfW, ly = fy * m.halfH, cell = App.Ops.cellAt(g.x + lx * cs - ly * sn, g.y + lx * sn + ly * cs);
        tot++; if (cell >= 0 && arr[cell] === id) ok++;
      }
      return ok / tot >= 0.8;
    };
    const place = (o) => {
      const { name, info, kind, id, weight, fill, halo, maxW, k, maxScr, minScr, arr, must } = o;
      const cands = [{ x: info.x, y: info.y, r: info.r }, ...(info.alts || [])];
      const put = (g, m, box) => { if (REC) REC.push({ g, fill, halo, weight }); else drawLabel(c, g, fill, halo, weight); placed.push(box); R.labelBoxes.push({ kind, id, x: g.x, y: g.y, ang: g.ang, ...m, size: g.size }); return true; };
      const tryAt = (cd, scale, avoidSoft, needInside, minS) => {
        const g = geomFor(name, { ...info, x: cd.x, y: cd.y, r: Math.min(cd.r, info.r) }, maxW, 2, k * scale);
        g.size = Math.min(g.size, maxScr / s); if (g.size * s < minS) return false;
        const m = labelLayout(c, g, weight), pad = g.size * 0.12, box = aabb(g.x, g.y, g.ang, m.halfW, m.halfH, pad);
        if (hits(box, placed) || (avoidSoft && hits(box, soft))) return false;
        if (needInside && !inside(arr, id, g, m)) return false;
        return put(g, m, box);
      };
      for (const scale of [1, 0.82, 0.66, 0.52]) for (const cd of cands) if (tryAt(cd, scale, true, true, minScr)) return;
      for (const scale of [0.82, 0.6, 0.45]) for (const cd of cands) if (tryAt(cd, scale, false, true, minScr * 0.85)) return;
      for (const scale of [0.6, 0.45]) for (const cd of cands) if (tryAt(cd, scale, false, false, minScr * 0.85)) return;
      if (!must) return;
      // 国名保底：一定显示，用最小可读字号放在区域中心
      const g = geomFor(name, info, maxW, 2, k); g.size = Math.max(Math.min(g.size, maxScr / s), 11 / s); g.ang = 0;
      const m = labelLayout(c, g, weight); put(g, m, aabb(g.x, g.y, 0, m.halfW, m.halfH, g.size * 0.12));
    };
    S.nations.slice().sort((a, b) => (G.labels.get(a.id)?.n || 0) - (G.labels.get(b.id)?.n || 0)).forEach((n) => {
      const info = G.labels.get(n.id); if (!info || !n.name) return;
      place({ name: n.name, info, kind: 'nation', id: n.id, weight: /[一-鿿]/.test(n.name) ? 900 : 800, fill: st.label(n), halo: st.labelHalo, maxW: 130, k: 1, maxScr: 72, minScr: 11, arr: S.owner, must: true });
    });
    if (!S.meta.showProvLabels || R.mode() === 'phys') return;
    const PSZ = { 1: [30, 0.62, 34, 8], 2: [20, 0.48, 24, 7], 3: [13, 0.36, 17, 6.5] };
    [1, 2, 3].forEach((lv) => {
      if (!S.meta['lv' + lv]) return;
      S.provinces.filter((p) => (p.level || 1) === lv && p.name).map((p) => [p, G.provLabels.get(p.id)]).filter(([, i]) => i).sort((a, b) => b[1].n - a[1].n).forEach(([p, info]) => {
        const n = App.nation(p.nation); if (!n) return;
        place({ name: p.name, info, kind: 'prov', id: p.id, weight: lv === 1 ? 700 : 500, fill: lv === 1 ? 'rgba(70,24,12,.88)' : st.provLabel || U.rgba(U.shade(n.color, -0.7), 0.72), halo: lv === 1 ? 'rgba(245,232,205,.6)' : null, maxW: PSZ[lv][0], k: PSZ[lv][1], maxScr: PSZ[lv][2], minScr: PSZ[lv][3], arr: App.provArr(lv) });
      });
    });
  };
  // 城市名：先算好位置，互相避让（重要的城市优先）
  const CITY_PRI = { capital: 0, large: 1, fortress: 2, port: 3, medium: 4, pass: 5, small: 6, village: 7 };
  R.layoutCityLabels = (c, cities, u, s) => {
    const out = [], boxes = [];
    cities.slice().sort((a, b) => (CITY_PRI[a.type] ?? 9) - (CITY_PRI[b.type] ?? 9)).forEach((ct) => {
      if (!ct.name || s < (CITY_MIN[ct.type] ?? 0.5)) return;
      const size = u * (CITY_FONT[ct.type] || 1.3);
      c.font = fontFor(ct.name, size, ct.type === 'capital' ? 800 : 600);
      const w = c.measureText(ct.name).width / 2, icon = App.S.meta.cityStyle === 'icon';
      const y = icon ? ct.y + u * 0.25 : ct.y - u * (ct.type === 'village' ? 1.5 : 0.8);
      const box = icon ? [ct.x - w, y, ct.x + w, y + size * 1.1] : [ct.x - w, y - size * 1.1, ct.x + w, y];
      if (hits(box, boxes)) return;
      boxes.push(box); out.push(ct);
    });
    return { list: out, boxes };
  };

  // ---- 自由文字 ----
  const drawText = (c, t) => {
    const lines = String(t.text || '').split('\n'); if (!lines.join('')) return;
    const size = t.size || 24, step = size * (1 + (t.spacing || 0));
    c.save(); c.translate(t.x, t.y); c.rotate(((t.angle || 0) * Math.PI) / 180);
    c.font = (t.italic ? 'italic ' : '') + fontFor(lines[0], size, t.weight || 700, t.font || undefined);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const lh = size * 1.3;
    const widths = lines.map((l) => (Array.from(l).length > 1 && t.spacing ? step * (Array.from(l).length - 1) + size : c.measureText(l).width));
    const bw = Math.max(...widths), bh = lh * lines.length;
    if (t.box) {
      const pw = bw / 2 + size * 0.9, ph = bh / 2 + size * 0.6;
      c.fillStyle = 'rgba(244,238,222,.95)'; c.fillRect(-pw, -ph, pw * 2, ph * 2);
      c.strokeStyle = '#3a3a3a'; c.lineWidth = size * 0.08; c.strokeRect(-pw, -ph, pw * 2, ph * 2);
      c.lineWidth = size * 0.04; c.strokeRect(-pw + size * 0.25, -ph + size * 0.25, pw * 2 - size * 0.5, ph * 2 - size * 0.5);
    }
    lines.forEach((l, i) => {
      const y = (i - (lines.length - 1) / 2) * lh;
      const chars = Array.from(l);
      const draw = (fn) => { if (t.spacing && chars.length > 1) { const tot = step * (chars.length - 1); chars.forEach((ch, k) => fn(ch, -tot / 2 + k * step, y)); } else fn(l, 0, y); };
      if (!t.box) { c.lineWidth = size * 0.14; c.strokeStyle = t.halo || 'rgba(240,232,210,.35)'; c.lineJoin = 'round'; draw((s2, x, y2) => c.strokeText(s2, x, y2)); }
      c.fillStyle = t.color || '#2b2116'; draw((s2, x, y2) => c.fillText(s2, x, y2));
    });
    c.restore();
    t._w = bw; t._h = bh;
  };

  R.arrowPoly = arrowPoly;

  R.exportPNG = (scale = 1) => {
    const cv = document.createElement('canvas'); cv.width = WW * scale; cv.height = HH * scale;
    const c = cv.getContext('2d');
    R.draw({ ctx: c, view: { s: 1, ox: 0, oy: 0 }, scale });
    pats = {};
    return cv;
  };
})();

// 缩放到某个范围（世界坐标 [x0,y0,x1,y1]）
App.R.zoomToBox = (b, minFrac = 0.6) => {
  const R = App.R, cv = document.getElementById('map').getBoundingClientRect();
  const w = Math.max(b[2] - b[0], 40), h = Math.max(b[3] - b[1], 40);
  const s = U.clamp(Math.min(cv.width / w, cv.height / h) * minFrac, 0.15, 12);
  R.view = { s, ox: cv.width / 2 - ((b[0] + b[2]) / 2) * s, oy: cv.height / 2 - ((b[1] + b[3]) / 2) * s };
  R.request(); if (App.UI) App.UI.status();
};
