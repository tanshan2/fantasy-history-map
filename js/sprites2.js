// ===== 精致版图标：树木、城市、墨线山 =====
(() => {
  const S = App.Sprites;
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x, w, h); return c; };
  const rg = (x, cx, cy, r, c0, c1) => { const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.05); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  const lg = (x, x0, y0, x1, y1, stops) => { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const shadow = (x, cx, cy, rx, ry) => { x.fillStyle = 'rgba(40,30,15,.22)'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); };
  const R = 128;

  // ---------- 树 ----------
  const trunk = (x, cx, top, bot, w, col = '#6e4a2c') => {
    x.fillStyle = lg(x, cx - w, 0, cx + w, 0, [[0, '#8a6038'], [0.5, col], [1, '#4a301a']]);
    x.beginPath(); x.moveTo(cx - w, bot); x.lineTo(cx - w * 0.6, top); x.lineTo(cx + w * 0.6, top); x.lineTo(cx + w, bot); x.closePath(); x.fill();
    x.strokeStyle = '#3a2614'; x.lineWidth = 2; x.stroke();
  };
  const blob = (x, pts, light, dark, ink) => {
    // 先画描边层，再画渐变填充，得到统一外轮廓
    x.fillStyle = ink; pts.forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx, cy, r + 2.6, 0, Math.PI * 2); x.fill(); });
    pts.forEach(([cx, cy, r]) => { x.fillStyle = rg(x, cx, cy, r, light, dark); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); });
    // 高光叶簇
    x.fillStyle = 'rgba(255,255,210,.28)';
    pts.forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.4, r * 0.32, 0, Math.PI * 2); x.fill(); });
    // 暗部叶纹
    x.strokeStyle = 'rgba(30,50,20,.35)'; x.lineWidth = 1.6;
    pts.forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx + r * 0.15, cy + r * 0.2, r * 0.55, 0.2, 1.6); x.stroke(); });
  };
  S.tree1 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 阔叶林
    shadow(x, 64, 118, 30, 7);
    trunk(x, 64, 78, 118, 7);
    const L = [['#a8cf6a', '#4d7f2c'], ['#b6d46e', '#5a8a30'], ['#9cc463', '#457628']][v];
    const pts = v === 0 ? [[46, 66, 22], [82, 66, 22], [64, 44, 28]] : v === 1 ? [[50, 58, 24], [80, 64, 21], [62, 36, 22]] : [[64, 50, 33], [44, 70, 17], [86, 72, 16]];
    blob(x, pts, L[0], L[1], '#2c4416');
  }));
  S.tree2 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 针叶林
    shadow(x, 64, 120, 22, 6);
    trunk(x, 64, 96, 120, 5, '#5a3a20');
    const tiers = v === 2 ? 4 : 3, top = 6 + v * 4;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers, yT = top + t * 78, yB = yT + 42, hw = 16 + t * 28;
      x.beginPath(); x.moveTo(64, yT);
      x.quadraticCurveTo(64 - hw * 0.4, yT + 20, 64 - hw, yB);
      for (let k = 0; k <= 4; k++) { const px = 64 - hw + (k * hw * 2) / 4; x.lineTo(px, yB - (k % 2 ? 5 : 0)); }
      x.quadraticCurveTo(64 + hw * 0.4, yT + 20, 64, yT); x.closePath();
      x.fillStyle = lg(x, 64 - hw, 0, 64 + hw, 0, [[0, '#6faa72'], [0.45, '#3f7a4c'], [1, '#24502f']]); x.fill();
      x.strokeStyle = '#173a20'; x.lineWidth = 2.4; x.stroke();
    }
    x.strokeStyle = 'rgba(220,255,210,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(62, top + 8); x.lineTo(50, top + 34); x.stroke();
  }));
  S.tree3 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 热带雨林（棕榈+蕨叶）
    shadow(x, 64, 120, 28, 6);
    const lean = [-10, 8, -4][v];
    x.strokeStyle = '#3a2614'; x.lineWidth = 11; x.beginPath(); x.moveTo(64, 120); x.quadraticCurveTo(60 + lean, 80, 64 + lean, 44); x.stroke();
    x.strokeStyle = '#8a6038'; x.lineWidth = 7; x.stroke();
    x.strokeStyle = '#5a3c20'; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const y = 112 - i * 12; x.beginPath(); x.moveTo(58 + lean * (1 - y / 120), y); x.lineTo(68 + lean * (1 - y / 120), y - 2); x.stroke(); }
    const cx = 64 + lean, cy = 44;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i * Math.PI) / 6, ex = cx + Math.cos(a) * 46, ey = cy + Math.sin(a) * 22 + 20;
      x.beginPath(); x.moveTo(cx, cy);
      x.quadraticCurveTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 30 - 6, ex, ey);
      x.quadraticCurveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 12, cx, cy + 4);
      x.fillStyle = i % 2 ? '#3f8a3a' : '#5aa548'; x.fill(); x.strokeStyle = '#1e4a1c'; x.lineWidth = 2; x.stroke();
    }
    x.fillStyle = '#6b4a22'; [[-5, 4], [4, 6], [0, 10]].forEach(([dx, dy]) => { x.beginPath(); x.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2); x.fill(); });
  }));
  S.tree4 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 竹林
    shadow(x, 64, 120, 30, 6);
    const culms = [[40, 18], [56, 6], [72, 14], [88, 24]].slice(0, 3 + (v === 1 ? 1 : 0));
    culms.forEach(([bx, top], i) => {
      bx += v * 2;
      x.strokeStyle = '#3d5a1c'; x.lineWidth = 8; x.beginPath(); x.moveTo(bx, 120); x.lineTo(bx + 2, top); x.stroke();
      x.strokeStyle = lg(x, bx - 4, 0, bx + 4, 0, [[0, '#c3dc7a'], [1, '#7ea43e']]); x.lineWidth = 5.5; x.stroke();
      x.strokeStyle = '#3d5a1c'; x.lineWidth = 2;
      for (let y = top + 16; y < 118; y += 18) { x.beginPath(); x.moveTo(bx - 4, y); x.lineTo(bx + 5, y); x.stroke(); }
      for (let k = 0; k < 4; k++) {
        const ly = top + 10 + k * 20, s = (k + i) % 2 ? 1 : -1;
        x.save(); x.translate(bx + s * 3, ly); x.rotate(s * (0.5 + k * 0.08));
        x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * 10, -6, s * 22, 0); x.quadraticCurveTo(s * 10, 5, 0, 0);
        x.fillStyle = '#6f9b34'; x.fill(); x.strokeStyle = '#2f4a14'; x.lineWidth = 1.5; x.stroke(); x.restore();
      }
    });
  }));
  S.tree5 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 白桦
    shadow(x, 64, 120, 22, 6);
    x.fillStyle = '#f4f1e8'; x.strokeStyle = '#3a3a34'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(59, 120); x.lineTo(61, 50); x.lineTo(67, 50); x.lineTo(69, 120); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#2b2b2b'; for (let k = 0; k < 6; k++) x.fillRect(59 + (k % 2) * 5, 60 + k * 10, 5, 2.5);
    const col = [['#e4d873', '#9a9a34'], ['#d9e07c', '#8a9a3a'], ['#c9d870', '#7a8e30']][v];
    x.fillStyle = '#4f5420'; x.beginPath(); x.ellipse(64, 44, 26, 38, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rg(x, 64, 44, 34, col[0], col[1]); x.beginPath(); x.ellipse(64, 44, 23.5, 35.5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,250,200,.4)'; for (let k = 0; k < 9; k++) { x.beginPath(); x.arc(52 + U.hash(k, v, 3) * 22, 20 + U.hash(k, v, 4) * 44, 3, 0, Math.PI * 2); x.fill(); }
  }));
  S.tree6 = [0, 1, 2].map((v) => mk(R, R * 0.6, (x, w, h) => { // 疏林灌木
    shadow(x, 64, 70, 36, 6);
    const pts = v === 0 ? [[44, 52, 16], [66, 44, 20], [88, 54, 14]] : v === 1 ? [[52, 50, 18], [78, 52, 16]] : [[40, 56, 12], [60, 48, 16], [82, 50, 15], [100, 58, 10]];
    blob(x, pts, '#c3c776', '#7d8a3c', '#3f4518');
    x.fillStyle = '#b8342a'; pts.forEach(([cx, cy, r], i) => { if (i % 2 === v % 2) { x.beginPath(); x.arc(cx + r * 0.3, cy - r * 0.1, 2.4, 0, Math.PI * 2); x.fill(); } });
  }));

  // ---------- 墨线山（鲜明风格用） ----------
  S.inkMtn = [0, 1, 2].map((v) => mk(R, R * 0.6, (x, w, h) => {
    x.strokeStyle = '#3a3a3a'; x.lineWidth = 6;
    const peaks = v === 0 ? [[64, 8, 34]] : v === 1 ? [[46, 18, 28], [82, 8, 30]] : [[40, 22, 24], [70, 6, 32], [100, 26, 20]];
    peaks.forEach(([px, py, hw]) => { x.beginPath(); x.moveTo(px - hw, h - 6); x.lineTo(px, py); x.lineTo(px + hw, h - 6); x.stroke(); });
  }));
  S.inkSnow = [0, 1, 2].map((v) => mk(R, R * 0.6, (x, w, h) => {
    x.drawImage(S.inkMtn[v], 0, 0);
    x.fillStyle = '#ffffff'; x.strokeStyle = '#3a3a3a'; x.lineWidth = 3;
    const peaks = v === 0 ? [[64, 8, 34]] : v === 1 ? [[46, 18, 28], [82, 8, 30]] : [[40, 22, 24], [70, 6, 32], [100, 26, 20]];
    peaks.forEach(([px, py, hw]) => { const k = 0.35; x.beginPath(); x.moveTo(px, py + 3); x.lineTo(px - hw * k, py + (h - py) * k); x.lineTo(px, py + (h - py) * k * 0.7); x.lineTo(px + hw * k, py + (h - py) * k); x.closePath(); x.fill(); });
  }));
  S.inkHill = [0, 1, 2].map((v) => mk(R, R * 0.4, (x, w, h) => {
    x.strokeStyle = '#4a4a4a'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(14, h - 4); x.quadraticCurveTo(48, 0, 82, h - 4); x.stroke();
    if (v) { x.beginPath(); x.moveTo(64, h - 4); x.quadraticCurveTo(90, 8, 116, h - 4); x.stroke(); }
  }));

  // ---------- 城市图标 ----------
  const STONE = ['#efe3c4', '#c9b58c'], INK = '#33261a', ROOF = ['#c2553e', '#7c2a1e'], TILE = ['#5d6f84', '#2f3b4a'];
  const wall = (x, x0, y0, x1, y1, crenel = true) => {
    x.fillStyle = lg(x, 0, y0, 0, y1, [[0, STONE[0]], [1, STONE[1]]]); x.fillRect(x0, y0, x1 - x0, y1 - y0);
    x.strokeStyle = INK; x.lineWidth = 2.5; x.strokeRect(x0, y0, x1 - x0, y1 - y0);
    x.strokeStyle = 'rgba(80,60,40,.35)'; x.lineWidth = 1.2;
    for (let yy = y0 + 7; yy < y1; yy += 7) { x.beginPath(); x.moveTo(x0, yy); x.lineTo(x1, yy); x.stroke(); }
    if (crenel) { x.fillStyle = STONE[0]; x.strokeStyle = INK; x.lineWidth = 2; for (let xx = x0; xx < x1 - 3; xx += 9) { x.fillRect(xx, y0 - 5, 5, 5); x.strokeRect(xx, y0 - 5, 5, 5); } }
  };
  const house = (x, cx, base, w, hgt, roof = ROOF) => {
    x.fillStyle = lg(x, 0, base - hgt, 0, base, [[0, '#f6ead0'], [1, '#d5c29a']]);
    x.fillRect(cx - w / 2, base - hgt, w, hgt); x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(cx - w / 2, base - hgt, w, hgt);
    x.fillStyle = '#5a3a20'; x.fillRect(cx - w * 0.12, base - hgt * 0.55, w * 0.24, hgt * 0.55);
    x.beginPath(); x.moveTo(cx - w / 2 - 5, base - hgt); x.lineTo(cx, base - hgt - w * 0.55); x.lineTo(cx + w / 2 + 5, base - hgt); x.closePath();
    x.fillStyle = lg(x, cx - w, 0, cx + w, 0, [[0, roof[0]], [1, roof[1]]]); x.fill(); x.strokeStyle = INK; x.stroke();
  };
  const hall = (x, cx, base, w, hgt, roof = TILE, eaves = 2) => { // 歇山式殿宇
    x.fillStyle = '#9c2b20'; x.fillRect(cx - w / 2 + 4, base - hgt, w - 8, hgt);
    x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(cx - w / 2 + 4, base - hgt, w - 8, hgt);
    x.fillStyle = '#e8c56a'; for (let i = 0; i < 4; i++) x.fillRect(cx - w / 2 + 8 + (i * (w - 18)) / 3, base - hgt + 3, 3, hgt - 3);
    for (let e = 0; e < eaves; e++) {
      const yb = base - hgt - e * 14, ww = w + 14 - e * 14;
      x.beginPath(); x.moveTo(cx - ww / 2 - 6, yb - 4); x.quadraticCurveTo(cx - ww / 2 + 6, yb, cx - ww / 2 + 10, yb - 2);
      x.lineTo(cx - ww / 2 + 18, yb - 14); x.lineTo(cx + ww / 2 - 18, yb - 14); x.lineTo(cx + ww / 2 - 10, yb - 2);
      x.quadraticCurveTo(cx + ww / 2 - 6, yb, cx + ww / 2 + 6, yb - 4); x.lineTo(cx + ww / 2 - 4, yb + 2); x.lineTo(cx - ww / 2 + 4, yb + 2); x.closePath();
      x.fillStyle = lg(x, 0, yb - 14, 0, yb, [[0, roof[0]], [1, roof[1]]]); x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke();
    }
  };
  const tower = (x, cx, base, w, hgt) => { wall(x, cx - w / 2, base - hgt, cx + w / 2, base, false); x.beginPath(); x.moveTo(cx - w / 2 - 4, base - hgt); x.lineTo(cx, base - hgt - w * 0.9); x.lineTo(cx + w / 2 + 4, base - hgt); x.closePath(); x.fillStyle = lg(x, cx - w, 0, cx + w, 0, [[0, ROOF[0]], [1, ROOF[1]]]); x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); };
  const gate = (x, cx, base, w, hgt) => { x.fillStyle = '#3a2614'; x.beginPath(); x.moveTo(cx - w / 2, base); x.lineTo(cx - w / 2, base - hgt + w / 2); x.arc(cx, base - hgt + w / 2, w / 2, Math.PI, 0); x.lineTo(cx + w / 2, base); x.fill(); };
  const flag = (x, px, py, col = '#c8281c') => { x.strokeStyle = INK; x.lineWidth = 2.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - 30); x.stroke(); x.fillStyle = col; x.beginPath(); x.moveTo(px, py - 30); x.quadraticCurveTo(px + 10, py - 33, px + 20, py - 26); x.quadraticCurveTo(px + 10, py - 22, px, py - 19); x.fill(); x.strokeStyle = '#5a140d'; x.lineWidth = 1.5; x.stroke(); };
  const ground = (x, cx, cy, rx) => { x.fillStyle = 'rgba(60,40,20,.25)'; x.beginPath(); x.ellipse(cx, cy, rx, rx * 0.22, 0, 0, Math.PI * 2); x.fill(); };

  S.city = {
    capital: mk(R, R, (x) => { ground(x, 64, 118, 58); wall(x, 10, 84, 118, 118); tower(x, 16, 118, 16, 44); tower(x, 112, 118, 16, 44); gate(x, 64, 118, 16, 22); x.fillStyle = '#d8c79c'; x.fillRect(30, 72, 68, 12); x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(30, 72, 68, 12); hall(x, 64, 72, 54, 18, TILE, 2); flag(x, 64, 32, '#d4af37'); }),
    large: mk(R, R, (x) => { ground(x, 64, 118, 56); house(x, 40, 84, 22, 16); house(x, 86, 82, 24, 18, TILE); house(x, 63, 78, 22, 20); wall(x, 14, 90, 114, 118); tower(x, 18, 118, 16, 40); tower(x, 110, 118, 16, 40); gate(x, 64, 118, 15, 20); }),
    medium: mk(R, R, (x) => { ground(x, 64, 118, 48); wall(x, 18, 100, 110, 118); house(x, 40, 100, 24, 18); house(x, 88, 100, 22, 16, TILE); house(x, 64, 96, 26, 22); }),
    small: mk(R, R, (x) => { ground(x, 64, 118, 40); house(x, 48, 116, 28, 22); house(x, 82, 116, 24, 18, TILE); }),
    village: mk(R, R, (x) => {
      ground(x, 64, 118, 30);
      x.fillStyle = lg(x, 0, 92, 0, 116, [[0, '#ead9b2'], [1, '#c8b083']]); x.fillRect(46, 92, 36, 24); x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(46, 92, 36, 24);
      x.fillStyle = '#5a3a20'; x.fillRect(60, 102, 8, 14);
      x.beginPath(); x.moveTo(40, 94); x.quadraticCurveTo(64, 56, 88, 94); x.closePath(); x.fillStyle = lg(x, 40, 0, 88, 0, [[0, '#e3c36a'], [1, '#a8822e']]); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(90,60,20,.5)'; x.lineWidth = 1.2; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(50 + i * 7, 92); x.lineTo(58 + i * 3, 74); x.stroke(); }
    }),
    fortress: mk(R, R, (x) => { ground(x, 64, 118, 52); wall(x, 22, 80, 106, 118); tower(x, 22, 118, 20, 56); tower(x, 106, 118, 20, 56); tower(x, 64, 96, 24, 40); gate(x, 64, 118, 14, 18); flag(x, 64, 46); }),
    port: mk(R, R, (x) => {
      ground(x, 64, 118, 52); house(x, 36, 106, 26, 20); house(x, 62, 106, 20, 16, TILE);
      x.fillStyle = '#8a6038'; x.fillRect(72, 104, 50, 6); x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(72, 104, 50, 6);
      x.fillStyle = '#5a6e9a'; x.beginPath(); x.moveTo(78, 100); x.lineTo(118, 100); x.lineTo(110, 112); x.lineTo(84, 112); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = INK; x.beginPath(); x.moveTo(98, 100); x.lineTo(98, 52); x.stroke();
      x.fillStyle = '#f6efdc'; x.beginPath(); x.moveTo(100, 56); x.quadraticCurveTo(122, 74, 102, 96); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(96, 60); x.quadraticCurveTo(80, 76, 94, 94); x.closePath(); x.fill(); x.stroke();
    }),
    pass: mk(R, R, (x) => { ground(x, 64, 118, 56); wall(x, 4, 96, 124, 118); wall(x, 38, 74, 90, 118, false); gate(x, 64, 118, 16, 26); hall(x, 64, 74, 48, 12, TILE, 1); }),
  };
  S.cityAspect = 1;
})();
