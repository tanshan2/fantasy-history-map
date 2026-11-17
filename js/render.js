// ===== 渲染 =====
(() => {
  const C = App.CELL, WW = App.WW, HH = App.HH;
  const R = (App.R = { view: { s: 0.5, ox: 0, oy: 0 }, labelBoxes: [], refImg: null, refSrc: null });
  let canvas, ctx, dpr = 1, pats = {}, raf = 0;

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
  R.request = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; R.draw(); }); };

  const fontFor = (txt, size, weight = 700, fam) => {
    const latin = /^[\x00-\x7FÀ-ɏ\s'’-]+$/.test(txt);
    const f = fam || (latin ? App.S.meta.latinFont : App.S.meta.labelFont);
    return `${weight} ${size}px "${f}", "Noto Serif SC", serif`;
  };
  R.fontFor = fontFor;

  // 主绘制（也用于导出：传入 ctx/view）
  R.draw = (opt = {}) => {
    const S = App.S, G = App.Geo;
    G.update();
    const c = opt.ctx || ctx, view = opt.view || R.view, s = view.s, k = opt.scale || dpr, exp = !!opt.ctx;
    const sw = (px) => (px * Math.pow(s, 0.5)) / s; // 随缩放缓慢变化的线宽
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (!exp) { c.fillStyle = '#151b26'; c.fillRect(0, 0, c.canvas.width, c.canvas.height); }
    c.setTransform(k * s, 0, 0, k * s, k * view.ox, k * view.oy);
    // 视口（世界坐标）
    const vx0 = -view.ox / s, vy0 = -view.oy / s, vx1 = vx0 + c.canvas.width / k / s, vy1 = vy0 + c.canvas.height / k / s;
    const inView = (x, y, m = 40) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;
    c.save();
    c.beginPath(); c.rect(0, 0, WW, HH); c.clip();
    if (!pats.sea || exp) { pats = { sea: c.createPattern(App.Sprites.sea, "repeat"), paper: c.createPattern(App.Sprites.paper, "repeat") }; }
    // 海洋
    c.fillStyle = S.meta.ocean; c.fillRect(0, 0, WW, HH);
    const vg = c.createRadialGradient(WW / 2, HH / 2, HH * 0.2, WW / 2, HH / 2, WW * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0.06)'); vg.addColorStop(1, 'rgba(0,10,30,0.35)');
    c.fillStyle = vg; c.fillRect(0, 0, WW, HH);
    c.fillStyle = pats.sea; c.fillRect(0, 0, WW, HH);
    // 网格
    if (S.meta.showGrid) {
      c.strokeStyle = 'rgba(200,220,240,0.16)'; c.lineWidth = sw(0.8); c.beginPath();
      for (let x = 0; x <= WW; x += 80) { c.moveTo(x, 0); c.lineTo(x, HH); }
      for (let y = 0; y <= HH; y += 80) { c.moveTo(0, y); c.lineTo(WW, y); }
      c.stroke();
    }
    // 海岸光晕
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(G.glowCanvas, 0, 0, WW, HH);
    // 陆地
    const coast = G.coastPath;
    c.save(); c.clip(coast, 'evenodd');
    c.drawImage(G.tintCanvas, 0, 0, WW, HH);
    // 国家填色
    S.nations.forEach((n) => { const p = G.nationPaths.get(n.id); if (!p) return; c.fillStyle = U.rgba(n.color, 0.72); c.fill(p, 'evenodd'); });
    c.globalAlpha = 0.9; c.drawImage(G.bandCanvas, 0, 0, WW, HH); c.globalAlpha = 1;
    // 纸纹
    c.globalCompositeOperation = 'multiply'; c.fillStyle = pats.paper; c.fillRect(0, 0, WW, HH); c.globalCompositeOperation = 'source-over';
    // 行政区界
    if (G.provPath) { c.setLineDash([sw(3.5), sw(2.5)]); c.strokeStyle = 'rgba(70,45,30,0.55)'; c.lineWidth = sw(0.9); c.stroke(G.provPath); c.setLineDash([]); }
    // 国界
    S.nations.forEach((n) => { const p = G.nationPaths.get(n.id); if (!p) return; c.strokeStyle = U.shade(n.color, -0.55); c.lineWidth = sw(1.3); c.stroke(p); });
    c.restore();
    // 海岸线
    c.strokeStyle = '#1d3a63'; c.lineWidth = sw(1.6); c.stroke(coast);
    // 地形 & 森林图标
    if (S.meta.showIcons && G.icons) {
      const dens = U.clamp(s * 1.6, 0.35, 1);
      for (const ic of G.icons) {
        if (!inView(ic.x, ic.y)) continue;
        if (ic.k.startsWith('tree') && ic.r > 0.3 * dens) continue;
        const spr = App.Sprites[ic.k]; if (!spr) continue;
        const im = spr[ic.v], w = ic.s, h = (w * im.height) / im.width;
        c.drawImage(im, ic.x - w / 2, ic.y - h + w * 0.08, w, h);
      }
    }
    // 河流
    c.lineCap = 'round'; c.lineJoin = 'round';
    S.rivers.forEach((r) => drawRiver(c, r, sw));
    // 自定义线条
    S.lines.forEach((l) => drawLine(c, l, sw));
    // 箭头
    if (S.meta.showArmies) S.arrows.forEach((a) => drawArrow(c, a, sw));
    // 标记
    S.markers.forEach((m) => drawMarker(c, m, s, sw));
    // 城市
    const u = 6 * Math.pow(s, 0.5) / s;
    S.cities.forEach((ct) => { if (inView(ct.x, ct.y)) drawCity(c, ct, u); });
    // 军队
    if (S.meta.showArmies) S.armies.forEach((a) => { if (inView(a.x, a.y)) drawArmy(c, a, u); });
    // 文字标签
    R.labelBoxes = [];
    drawNationLabels(c, s);
    if (S.meta.showCityLabels) S.cities.forEach((ct) => { if (inView(ct.x, ct.y, 200)) drawCityLabel(c, ct, u, s); });
    S.texts.forEach((t) => drawText(c, t));
    // 参考图
    const ref = S.meta.ref;
    if (ref && ref.visible && ref.src) {
      if (R.refSrc !== ref.src) { R.refImg = new Image(); R.refImg.onload = R.request; R.refImg.src = ref.src; R.refSrc = ref.src; }
      if (R.refImg.complete && R.refImg.naturalWidth) { c.globalAlpha = ref.opacity; c.drawImage(R.refImg, ref.x, ref.y, ref.w, ref.h); c.globalAlpha = 1; }
    }
    c.restore();
    // 外框
    c.strokeStyle = '#0d1420'; c.lineWidth = 3 / s; c.strokeRect(0, 0, WW, HH);
    c.strokeStyle = 'rgba(214,196,150,.8)'; c.lineWidth = 1 / s; c.strokeRect(-4 / s, -4 / s, WW + 8 / s, HH + 8 / s);
    if (!exp && App.Tools) App.Tools.drawOverlay(c, s);
  };

  // ---- 河流 ----
  const drawRiver = (c, r, sw) => {
    const pts = U.smooth(r.pts, 5); if (pts.length < 2) return;
    const n = pts.length, w1 = r.width || 2.2;
    c.strokeStyle = '#4c87ad';
    for (let i = 1; i < n; i++) {
      const t = i / n; c.lineWidth = sw(0.35) + (w1 * Math.pow(t, 0.8)) * 0.9;
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
      case 'sea': path(); c.setLineDash([sw(6), sw(5)]); c.strokeStyle = col || 'rgba(232,218,180,.85)'; c.lineWidth = sw(1.4); c.stroke(); break;
      case 'wall': {
        path(); c.strokeStyle = col || '#5b3f25'; c.lineWidth = sw(2); c.stroke();
        c.fillStyle = col || '#5b3f25'; const st = sw(4);
        U.resample(pts, st).forEach(([x, y, a], i) => { if (i % 2) return; c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-sw(1), -sw(3.2), sw(2), sw(2.4)); c.restore(); });
        break;
      }
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
    const poly = [...L, [bx + Math.sin(ang) * hw, by - Math.cos(ang) * hw], end, [bx - Math.sin(ang) * hw, by + Math.cos(ang) * hw], ...Rr.reverse()];
    return poly;
  };
  const drawArrow = (c, a, sw) => {
    const poly = arrowPoly(a); if (!poly) return;
    const n = App.nation(a.nation), col = n ? n.color : '#c0392b';
    c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.fillStyle = U.rgba(U.shade(col, -0.1), 0.85); c.fill();
    c.strokeStyle = U.shade(col, -0.6); c.lineWidth = sw(1); c.stroke();
  };

  // ---- 标记 ----
  const drawMarker = (c, m, s, sw) => {
    const u = 7 * Math.pow(s, 0.5) / s;
    c.save(); c.translate(m.x, m.y); c.lineCap = 'round';
    if (m.type === 'battle') {
      c.strokeStyle = '#f3e7cc'; c.lineWidth = u * 0.55;
      const sword = () => { c.beginPath(); c.moveTo(-u, -u); c.lineTo(u, u); c.moveTo(-u * 0.95, -u * 0.35); c.lineTo(-u * 0.35, -u * 0.95); c.stroke(); };
      c.save(); sword(); c.scale(-1, 1); sword(); c.restore();
      c.strokeStyle = '#7d1610'; c.lineWidth = u * 0.25; c.save(); sword(); c.scale(-1, 1); sword(); c.restore();
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
  const INK = '#33251a';
  const drawCity = (c, ct, u) => {
    c.save(); c.translate(ct.x, ct.y); c.lineWidth = u * 0.22;
    const halo = (fn) => { c.strokeStyle = 'rgba(250,242,222,.9)'; c.lineWidth = u * 0.5; fn(); c.stroke(); c.lineWidth = u * 0.22; };
    switch (ct.type) {
      case 'capital': {
        c.beginPath(); c.arc(0, 0, u * 1.15, 0, Math.PI * 2); c.fillStyle = '#fbf3df'; c.fill(); c.strokeStyle = '#6b1d12'; c.lineWidth = u * 0.28; c.stroke();
        c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? u * 0.38 : u * 0.9, a = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#b8231a'; c.fill();
        break;
      }
      case 'large': {
        const w = u * 1.0;
        const shape = () => { c.beginPath(); c.moveTo(-w, w * 0.8); c.lineTo(-w, -w * 0.5); c.lineTo(-w * 0.6, -w * 0.5); c.lineTo(-w * 0.6, -w * 0.15); c.lineTo(-w * 0.2, -w * 0.15); c.lineTo(-w * 0.2, -w * 0.5); c.lineTo(w * 0.2, -w * 0.5); c.lineTo(w * 0.2, -w * 0.15); c.lineTo(w * 0.6, -w * 0.15); c.lineTo(w * 0.6, -w * 0.5); c.lineTo(w, -w * 0.5); c.lineTo(w, w * 0.8); c.closePath(); };
        halo(shape); shape(); c.fillStyle = INK; c.fill();
        break;
      }
      case 'medium': halo(() => { c.beginPath(); c.arc(0, 0, u * 0.62, 0, Math.PI * 2); }); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(0, 0, u * 0.25, 0, Math.PI * 2); c.fillStyle = '#f5ebd2'; c.fill(); break;
      case 'small': halo(() => { c.beginPath(); c.arc(0, 0, u * 0.42, 0, Math.PI * 2); }); c.fillStyle = INK; c.fill(); break;
      case 'village': c.beginPath(); c.arc(0, 0, u * 0.32, 0, Math.PI * 2); c.fillStyle = '#f5ebd2'; c.fill(); c.strokeStyle = INK; c.lineWidth = u * 0.16; c.stroke(); break;
      case 'fortress': {
        const shape = () => { c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? u * 0.55 : u * 1.05, a = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); };
        halo(shape); shape(); c.fillStyle = '#5a4632'; c.fill(); c.strokeStyle = INK; c.stroke();
        c.beginPath(); c.arc(0, 0, u * 0.28, 0, Math.PI * 2); c.fillStyle = '#f5ebd2'; c.fill();
        break;
      }
      case 'port': {
        halo(() => { c.beginPath(); c.arc(0, 0, u * 0.75, 0, Math.PI * 2); }); c.fillStyle = '#2e5b8a'; c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = u * 0.14; c.beginPath(); c.moveTo(0, -u * 0.45); c.lineTo(0, u * 0.45); c.moveTo(-u * 0.25, -u * 0.2); c.lineTo(u * 0.25, -u * 0.2); c.moveTo(-u * 0.4, u * 0.15); c.quadraticCurveTo(0, u * 0.65, u * 0.4, u * 0.15); c.stroke();
        break;
      }
      case 'pass': {
        c.fillStyle = INK; c.strokeStyle = 'rgba(250,242,222,.9)'; c.lineWidth = u * 0.3;
        [-0.35, 0.35].forEach((x) => { c.strokeRect(x * u - u * 0.13, -u * 0.8, u * 0.26, u * 1.6); c.fillRect(x * u - u * 0.13, -u * 0.8, u * 0.26, u * 1.6); });
        break;
      }
    }
    c.restore();
  };
  const CITY_FONT = { capital: 1.95, large: 1.65, medium: 1.45, small: 1.25, village: 1.1, fortress: 1.35, port: 1.35, pass: 1.25 };
  const CITY_MIN = { capital: 0, large: 0.3, medium: 0.45, small: 0.75, village: 1.1, fortress: 0.45, port: 0.6, pass: 0.6 };
  const drawCityLabel = (c, ct, u, s) => {
    if (!ct.name || s < (CITY_MIN[ct.type] ?? 0.5)) return;
    const size = u * (CITY_FONT[ct.type] || 1.3);
    c.font = fontFor(ct.name, size, ct.type === 'capital' ? 900 : 600);
    c.textAlign = 'left'; c.textBaseline = 'middle';
    const x = ct.x + u * (ct.type === 'capital' ? 1.5 : 1.1), y = ct.y;
    c.lineWidth = size * 0.28; c.strokeStyle = 'rgba(248,240,218,.85)'; c.lineJoin = 'round'; c.strokeText(ct.name, x, y);
    c.fillStyle = ct.type === 'capital' ? '#5a140d' : '#2e2218'; c.fillText(ct.name, x, y);
  };

  // ---- 军队 ----
  const drawArmy = (c, a, u) => {
    const n = App.nation(a.nation), col = n ? n.color : '#999';
    u *= 1.35; const w = u * 2.8, h = u * 1.8;
    c.save(); c.translate(a.x, a.y);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-w / 2 + u * 0.15, -h / 2 + u * 0.15, w, h);
    c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = U.shade(col, -0.65); c.lineWidth = u * 0.18; c.strokeRect(-w / 2, -h / 2, w, h);
    c.beginPath(); c.lineWidth = u * 0.16;
    const x0 = -w / 2, y0 = -h / 2;
    switch (a.type) {
      case 'infantry': c.moveTo(x0, y0); c.lineTo(-x0, -y0); c.moveTo(-x0, y0); c.lineTo(x0, -y0); break;
      case 'cavalry': c.moveTo(x0, -y0); c.lineTo(-x0, y0); break;
      case 'archer': c.moveTo(-w * 0.2, -h * 0.35); c.quadraticCurveTo(w * 0.25, 0, -w * 0.2, h * 0.35); c.lineTo(-w * 0.2, -h * 0.35); c.moveTo(-w * 0.3, 0); c.lineTo(w * 0.3, 0); break;
      case 'siege': c.arc(0, 0, h * 0.25, 0, Math.PI * 2); c.fillStyle = U.shade(col, -0.65); c.fill(); c.beginPath(); c.moveTo(-w * 0.35, h * 0.3); c.lineTo(w * 0.35, h * 0.3); break;
      case 'navy': c.moveTo(-w * 0.32, 0); c.quadraticCurveTo(0, h * 0.45, w * 0.32, 0); c.closePath(); c.moveTo(0, 0); c.lineTo(0, -h * 0.38); c.lineTo(w * 0.2, -h * 0.1); c.lineTo(0, -h * 0.1); break;
    }
    c.stroke();
    const fz = u * 1.1;
    if (a.strength) {
      c.font = fontFor(a.strength, fz, 800); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.lineWidth = fz * 0.3; c.strokeStyle = 'rgba(248,240,218,.9)'; c.strokeText(a.strength, 0, -h / 2 - u * 0.15); c.fillStyle = '#2a1b10'; c.fillText(a.strength, 0, -h / 2 - u * 0.15);
    }
    if (a.name) {
      c.font = fontFor(a.name, fz, 700); c.textAlign = 'center'; c.textBaseline = 'top';
      c.lineWidth = fz * 0.3; c.strokeStyle = 'rgba(248,240,218,.9)'; c.strokeText(a.name, 0, h / 2 + u * 0.2); c.fillStyle = '#2a1b10'; c.fillText(a.name, 0, h / 2 + u * 0.2);
    }
    c.restore();
  };

  // ---- 国名 / 行政区名 ----
  const spaced = (c, lines, x, y, ang, size, step, fill, halo) => {
    c.save(); c.translate(x, y); c.rotate(ang); c.textAlign = 'center'; c.textBaseline = 'middle';
    const lh = size * 1.15;
    lines.forEach((line, li) => {
      const chars = Array.from(line), ly = (li - (lines.length - 1) / 2) * lh;
      const tot = step * (chars.length - 1);
      chars.forEach((ch, i) => {
        const cx = -tot / 2 + i * step;
        if (halo) { c.lineWidth = size * 0.16; c.strokeStyle = halo; c.lineJoin = 'round'; c.strokeText(ch, cx, ly); }
        c.fillStyle = fill; c.fillText(ch, cx, ly);
      });
    });
    c.restore();
  };
  const splitName = (name) => {
    if (/[一-鿿]/.test(name) || name.length <= 13 || !name.includes(' ')) return [name];
    const words = name.split(' '); let best = [name], bd = Infinity;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), d = Math.abs(a.length - b.length); if (d < bd) { bd = d; best = [a, b]; } }
    return best;
  };
  R.nationLabelGeom = (n) => {
    const info = App.Geo.labels.get(n.id); if (!info && !n.label) return null;
    const lines = splitName(n.name || ''); const longest = Math.max(...lines.map((l) => Array.from(l).length), 1);
    const cjk = /[一-鿿]/.test(n.name);
    let x, y, ang, size;
    if (info) {
      ang = U.clamp(info.ang, -0.6, 0.6);
      const L = info.L, M = info.M;
      size = U.clamp(Math.min((L * 0.62) / (longest * (cjk ? 1.5 : 0.75)), (M * 0.5) / lines.length), 7, 110);
      x = info.x; y = info.y;
    }
    if (n.label) { x = n.label.x ?? x; y = n.label.y ?? y; ang = n.label.angle ?? ang; size = n.label.size ?? size; }
    const step = size * (cjk ? 1.55 : 0.78);
    return { x, y, ang, size, step, lines, cjk, halfW: (step * (longest - 1)) / 2 + size * 0.6, halfH: (lines.length * size * 1.15) / 2 };
  };
  const drawNationLabels = (c, s) => {
    const S = App.S, G = App.Geo;
    // 行政区名
    if (S.meta.showProvLabels) S.provinces.forEach((p) => {
      const info = G.provLabels.get(p.id); if (!info || !p.name) return;
      const n = App.nation(p.nation); if (!n) return;
      const chars = Array.from(p.name).length, cjk = /[一-鿿]/.test(p.name);
      let size = U.clamp(Math.min((info.L * 0.4) / (chars * (cjk ? 1.4 : 0.7)), info.M * 0.35), 4, 24);
      if (p.label && p.label.size) size = p.label.size;
      if (size * s < 7) return;
      const x = p.label?.x ?? info.x, y = p.label?.y ?? info.y, ang = p.label?.angle ?? U.clamp(info.ang, -0.5, 0.5);
      c.font = fontFor(p.name, size, 600);
      spaced(c, [p.name], x, y, ang, size, size * (cjk ? 1.35 : 0.72), U.rgba(U.shade(n.color, -0.7), 0.75), null);
      R.labelBoxes.push({ kind: 'prov', id: p.id, x, y, ang, halfW: (size * (cjk ? 1.35 : 0.72) * (chars - 1)) / 2 + size * 0.5, halfH: size * 0.6, size });
    });
    S.nations.forEach((n) => {
      const g = R.nationLabelGeom(n); if (!g || !n.name || g.x == null) return;
      c.font = fontFor(n.name, g.size, 700, g.cjk ? undefined : S.meta.latinFont);
      spaced(c, g.lines, g.x, g.y, g.ang, g.size, g.step, U.rgba(U.shade(n.color, -0.78), 0.92), 'rgba(250,240,215,0.55)');
      R.labelBoxes.push({ kind: 'nation', id: n.id, x: g.x, y: g.y, ang: g.ang, halfW: g.halfW, halfH: g.halfH, size: g.size });
    });
  };

  // ---- 自由文字 ----
  const drawText = (c, t) => {
    const lines = String(t.text || '').split('\n'); if (!lines.join('')) return;
    const size = t.size || 24, step = size * (1 + (t.spacing || 0));
    c.save(); c.translate(t.x, t.y); c.rotate(((t.angle || 0) * Math.PI) / 180);
    c.font = (t.italic ? 'italic ' : '') + fontFor(lines[0], size, t.weight || 700, t.font || undefined).replace(/^/, '');
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const lh = size * 1.3;
    const widths = lines.map((l) => (Array.from(l).length > 1 && t.spacing ? step * (Array.from(l).length - 1) + size : c.measureText(l).width));
    const bw = Math.max(...widths), bh = lh * lines.length;
    if (t.box) {
      const pw = bw / 2 + size * 0.9, ph = bh / 2 + size * 0.6;
      c.fillStyle = 'rgba(244,234,208,.94)'; c.fillRect(-pw, -ph, pw * 2, ph * 2);
      c.strokeStyle = '#5a3e26'; c.lineWidth = size * 0.08; c.strokeRect(-pw, -ph, pw * 2, ph * 2);
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

  // 导出 PNG
  R.exportPNG = (scale = 1) => {
    const cv = document.createElement('canvas'); cv.width = WW * scale; cv.height = HH * scale;
    const c = cv.getContext('2d');
    R.draw({ ctx: c, view: { s: 1, ox: 0, oy: 0 }, scale });
    pats = {};
    return cv;
  };
})();
