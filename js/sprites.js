// ===== 手绘风图标精灵（山、丘、各种树） =====
(() => {
  const R = 64; // 精灵分辨率
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x, w, h); return c; };
  const S = (App.Sprites = {});
  const INK = '#4a3a2a';

  const mountain = (x, w, h, v, snow) => {
    const peaks = v === 0 ? [[0.5, 0.08, 0.46]] : v === 1 ? [[0.36, 0.2, 0.32], [0.6, 0.06, 0.4]] : [[0.62, 0.22, 0.3], [0.4, 0.1, 0.4]];
    peaks.forEach(([px, py, hw]) => {
      const L = (px - hw) * w, Rr = (px + hw) * w, top = py * h, base = h * 0.94, mid = px * w;
      x.beginPath(); x.moveTo(L, base); x.lineTo(mid, top); x.lineTo(mid + w * 0.04, base); x.closePath();
      x.fillStyle = snow ? '#f6f3ec' : '#efe4c8'; x.fill();
      x.beginPath(); x.moveTo(mid, top); x.lineTo(Rr, base); x.lineTo(mid + w * 0.04, base); x.closePath();
      x.fillStyle = snow ? '#b9c3cc' : '#b49c78'; x.fill();
      if (snow) {
        x.beginPath(); x.moveTo(mid, top);
        const sy = top + (base - top) * 0.38;
        x.lineTo(mid - (mid - L) * 0.38, sy); x.lineTo(mid - (mid - L) * 0.18, sy - h * 0.04); x.lineTo(mid, sy + h * 0.03);
        x.lineTo(mid + (Rr - mid) * 0.2, sy - h * 0.03); x.lineTo(mid + (Rr - mid) * 0.38, sy); x.closePath();
        x.fillStyle = '#ffffff'; x.fill();
      }
      x.strokeStyle = INK; x.lineWidth = w * 0.045;
      x.beginPath(); x.moveTo(L, base); x.lineTo(mid, top); x.lineTo(Rr, base); x.stroke();
      x.lineWidth = w * 0.025; x.strokeStyle = 'rgba(74,58,42,.55)';
      for (let i = 1; i < 4; i++) { const t = i / 4; x.beginPath(); x.moveTo(mid + (Rr - mid) * t * 0.9, top + (base - top) * t); x.lineTo(mid + (Rr - mid) * t * 0.45, base - (base - top) * 0.05); x.stroke(); }
    });
  };
  ['mtn', 'snow'].forEach((k) => (S[k] = [0, 1, 2].map((v) => mk(R, R * 0.8, (x, w, h) => mountain(x, w, h, v, k === 'snow')))));
  S.hill = [0, 1, 2].map((v) => mk(R, R * 0.5, (x, w, h) => {
    const hump = (cx, hw, top) => {
      x.beginPath(); x.moveTo(cx - hw, h * 0.95); x.quadraticCurveTo(cx, top, cx + hw, h * 0.95);
      x.fillStyle = '#e6d6b2'; x.fill();
      x.beginPath(); x.moveTo(cx, h * 0.95 - (h * 0.95 - top) * 0.5); x.quadraticCurveTo(cx + hw * 0.6, top + h * 0.15, cx + hw, h * 0.95); x.lineTo(cx, h * 0.95); x.closePath();
      x.fillStyle = 'rgba(160,135,100,.55)'; x.fill();
      x.beginPath(); x.moveTo(cx - hw, h * 0.95); x.quadraticCurveTo(cx, top, cx + hw, h * 0.95); x.strokeStyle = INK; x.lineWidth = w * 0.04; x.stroke();
    };
    if (v === 0) hump(w * 0.5, w * 0.44, h * 0.05);
    else if (v === 1) { hump(w * 0.35, w * 0.3, h * 0.2); hump(w * 0.64, w * 0.33, h * 0.05); }
    else { hump(w * 0.6, w * 0.36, h * 0.15); hump(w * 0.36, w * 0.3, h * 0.08); }
  }));
  S.dune = [0, 1, 2].map((v) => mk(R, R * 0.4, (x, w, h) => {
    x.strokeStyle = '#a8864f'; x.lineWidth = w * 0.035;
    for (let i = 0; i < 2 + v % 2; i++) { const ox = w * (0.15 + i * 0.28), oy = h * (0.4 + (i % 2) * 0.3); x.beginPath(); x.moveTo(ox, oy + h * 0.3); x.quadraticCurveTo(ox + w * 0.15, oy - h * 0.25, ox + w * 0.35, oy + h * 0.3); x.stroke(); }
  }));
  S.marsh = [0, 1, 2].map((v) => mk(R, R * 0.6, (x, w, h) => {
    x.strokeStyle = '#4f6a4a'; x.lineWidth = w * 0.035;
    for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(w * 0.5 + i * w * 0.05, h * 0.7); x.lineTo(w * 0.5 + i * w * 0.12, h * 0.15 + Math.abs(i) * h * 0.1); x.stroke(); }
    x.strokeStyle = '#5b86a3'; x.beginPath(); x.moveTo(w * 0.15, h * 0.85); x.lineTo(w * 0.4, h * 0.85); x.moveTo(w * 0.55, h * 0.92); x.lineTo(w * 0.85, h * 0.92); x.stroke();
  }));

  // 树
  const trunk = (x, w, h, col = '#6b4a2e') => { x.fillStyle = col; x.fillRect(w * 0.46, h * 0.62, w * 0.08, h * 0.36); };
  S.tree1 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 阔叶
    trunk(x, w, h);
    const g = ['#7f9f55', '#8aa65a', '#749a4e'][v];
    x.fillStyle = g; x.strokeStyle = '#3f5a2a'; x.lineWidth = w * 0.045;
    x.beginPath(); x.arc(w * 0.5, h * 0.42, w * 0.3, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,220,.3)'; x.beginPath(); x.arc(w * 0.42, h * 0.34, w * 0.1, 0, Math.PI * 2); x.fill();
  }));
  S.tree2 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 针叶
    trunk(x, w, h, '#5a3e26');
    const g = ['#4f7a52', '#557f56', '#47704b'][v];
    x.fillStyle = g; x.strokeStyle = '#2b4a31'; x.lineWidth = w * 0.04;
    [[0.05, 0.42], [0.25, 0.62], [0.45, 0.8]].forEach(([t, b]) => {
      x.beginPath(); x.moveTo(w * 0.5, h * t); x.lineTo(w * (0.5 - 0.12 - b * 0.18), h * b); x.lineTo(w * (0.5 + 0.12 + b * 0.18), h * b); x.closePath(); x.fill(); x.stroke();
    });
  }));
  S.tree3 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 雨林（棕榈）
    x.strokeStyle = '#6b4a2e'; x.lineWidth = w * 0.07;
    x.beginPath(); x.moveTo(w * 0.5, h * 0.98); x.quadraticCurveTo(w * (0.42 + v * 0.06), h * 0.6, w * 0.5, h * 0.3); x.stroke();
    x.strokeStyle = '#2f6b33'; x.lineWidth = w * 0.09;
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55; x.beginPath(); x.moveTo(w * 0.5, h * 0.3); x.quadraticCurveTo(w * 0.5 + Math.cos(a) * w * 0.25, h * 0.3 + Math.sin(a) * h * 0.25 - h * 0.05, w * 0.5 + Math.cos(a) * w * 0.42, h * 0.3 + Math.sin(a) * h * 0.3 + h * 0.15); x.stroke(); }
  }));
  S.tree4 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 竹林
    for (let i = 0; i < 3; i++) {
      const bx = w * (0.32 + i * 0.17), top = h * (0.08 + ((i + v) % 3) * 0.08);
      x.strokeStyle = '#7c9a3f'; x.lineWidth = w * 0.06; x.beginPath(); x.moveTo(bx, h * 0.98); x.lineTo(bx, top); x.stroke();
      x.strokeStyle = '#4e6b29'; x.lineWidth = w * 0.03;
      for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(bx - w * 0.03, top + k * h * 0.2); x.lineTo(bx + w * 0.03, top + k * h * 0.2); x.stroke(); }
      x.fillStyle = '#5f8a35';
      for (let k = 0; k < 3; k++) { const ly = top + h * 0.05 + k * h * 0.18, s = k % 2 ? 1 : -1; x.beginPath(); x.ellipse(bx + s * w * 0.09, ly, w * 0.09, w * 0.03, s * 0.5, 0, Math.PI * 2); x.fill(); }
    }
  }));
  S.tree5 = [0, 1, 2].map((v) => mk(R, R, (x, w, h) => { // 白桦
    x.fillStyle = '#f2efe6'; x.fillRect(w * 0.46, h * 0.45, w * 0.08, h * 0.53);
    x.fillStyle = '#2a2a2a'; for (let k = 0; k < 4; k++) x.fillRect(w * (0.46 + (k % 2) * 0.03), h * (0.52 + k * 0.11), w * 0.05, h * 0.025);
    x.fillStyle = ['#b5b866', '#c2b85a', '#a9b46a'][v]; x.strokeStyle = '#5d6030'; x.lineWidth = w * 0.04;
    x.beginPath(); x.ellipse(w * 0.5, h * 0.33, w * 0.2, h * 0.26, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  }));
  S.tree6 = [0, 1, 2].map((v) => mk(R, R * 0.6, (x, w, h) => { // 灌木
    x.fillStyle = ['#9aa46a', '#a7a66a', '#8f9c62'][v]; x.strokeStyle = '#4f5530'; x.lineWidth = w * 0.04;
    x.beginPath(); x.arc(w * 0.38, h * 0.62, w * 0.17, Math.PI, 0); x.arc(w * 0.62, h * 0.62, w * 0.17, Math.PI, 0); x.closePath(); x.fill(); x.stroke();
  }));

  // 纹理：羊皮纸 & 海洋颗粒
  const tex = (size, fn) => mk(size, size, (x, w, h) => {
    const im = x.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
      const p = (y * w + i) * 4, [r, g, b, a] = fn(i, y);
      im.data[p] = r; im.data[p + 1] = g; im.data[p + 2] = b; im.data[p + 3] = a;
    }
    x.putImageData(im, 0, 0);
  });
  // 可平铺噪声
  const tn = (i, y, sc, s, size) => {
    const u = i / size, v = y / size;
    const a = U.fbm(u * sc, v * sc, s, 4), b = U.fbm((u - 1) * sc, v * sc, s, 4), c = U.fbm(u * sc, (v - 1) * sc, s, 4), d = U.fbm((u - 1) * sc, (v - 1) * sc, s, 4);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
  S.paper = tex(256, (i, y) => {
    const n = tn(i, y, 6, 3, 256), f = U.hash(i, y, 9);
    const k = 0.78 + n * 0.32 + (f - 0.5) * 0.06;
    return [255 * Math.min(1, k + 0.03), 250 * Math.min(1, k), 238 * Math.min(1, k - 0.02), 255];
  });
  S.sea = tex(256, (i, y) => {
    const n = tn(i, y, 8, 7, 256), f = U.hash(i, y, 10);
    const a = (n - 0.5) * 0.9 + (f - 0.5) * 0.25;
    return a > 0 ? [255, 255, 255, a * 70] : [10, 20, 40, -a * 90];
  });
})();
