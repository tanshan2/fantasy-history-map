// ===== 长城：绘制样式、沿山脊吸附、穿河过路自动设关 =====
(() => {
  const W = App.W, H = App.H, C = App.CELL;
  const WL = (App.Walls = {});
  // 三种样式：明代砖石长城（垛口 + 敌楼）、秦汉夯土长城（土墙 + 烽燧）、石墙（哈德良长城式，城堡）
  WL.TYPES = [
    { id: 'ming', name: '砖石长城（明）', body: '#9b8a6c', top: '#c9b894', edge: '#3d2f20', w: 4, crenel: true, tower: 'square', towerStep: 24 },
    { id: 'qin', name: '夯土长城（秦汉）', body: '#a9824f', top: '#c8a26c', edge: '#4a3219', w: 3.6, crenel: false, tower: 'beacon', towerStep: 34 },
    { id: 'stone', name: '石墙（罗马式）', body: '#85837c', top: '#b2b0a6', edge: '#33322d', w: 3.4, crenel: true, tower: 'fort', towerStep: 44 },
  ];
  WL.type = (id) => WL.TYPES.find((t) => t.id === id) || WL.TYPES[0];

  // ---------- 绘制 ----------
  WL.draw = (c, l, sw, s) => {
    const raw = U.smooth(l.pts, 4); if (raw.length < 2) return;
    const t = WL.type(l.wall), col = l.color;
    const w = sw(t.w), detail = Math.sqrt(s) > 0.55; // 缩得很小时只画墙体
    const path = () => { c.beginPath(); c.moveTo(raw[0][0], raw[0][1]); for (let i = 1; i < raw.length; i++) c.lineTo(raw[i][0], raw[i][1]); };
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // 阴影、外缘、墙体、墙顶
    c.save(); c.translate(sw(0.6), sw(0.8)); path(); c.strokeStyle = 'rgba(20,12,4,.25)'; c.lineWidth = w + sw(2.6); c.stroke(); c.restore();
    path(); c.strokeStyle = t.edge; c.lineWidth = w + sw(1.3); c.stroke();
    path(); c.strokeStyle = col || t.body; c.lineWidth = w; c.stroke();
    if (detail) { path(); c.strokeStyle = t.top; c.lineWidth = w * 0.32; c.stroke(); }
    // 垛口：沿墙外侧一排小方块
    if (t.crenel && detail) {
      c.fillStyle = col || t.body; c.strokeStyle = t.edge; c.lineWidth = sw(0.45);
      U.resample(raw, sw(2.4)).forEach(([x, y, a], i) => {
        if (i % 2) return; c.save(); c.translate(x, y); c.rotate(a);
        c.fillRect(-sw(0.7), -w / 2 - sw(1.3), sw(1.4), sw(1.5)); c.strokeRect(-sw(0.7), -w / 2 - sw(1.3), sw(1.4), sw(1.5)); c.restore();
      });
    }
    // 敌楼 / 烽燧 / 城堡
    if (l.towers !== false) {
      const pts = U.resample(raw, sw(t.towerStep));
      pts.forEach(([x, y, a], i) => {
        if (i === 0) return; c.save(); c.translate(x, y); c.rotate(a);
        if (t.tower === 'square') {
          const k = w * 1.05 + sw(1.2);
          c.fillStyle = t.edge; c.fillRect(-k - sw(0.5), -k - sw(0.5), 2 * k + sw(1), 2 * k + sw(1));
          c.fillStyle = col || t.body; c.fillRect(-k, -k, 2 * k, 2 * k);
          if (detail) { c.fillStyle = t.top; c.fillRect(-k * 0.55, -k * 0.55, k * 1.1, k * 1.1); c.fillStyle = t.edge; c.fillRect(-k * 0.18, -k * 0.18, k * 0.36, k * 0.36); }
        } else if (t.tower === 'beacon') {
          // 烽燧：在墙内侧的小土台，冒一缕烟
          c.translate(0, w * 1.25); const k = w * 0.8 + sw(0.8);
          c.beginPath(); c.moveTo(-k, k); c.lineTo(-k * 0.6, -k); c.lineTo(k * 0.6, -k); c.lineTo(k, k); c.closePath();
          c.fillStyle = col || t.body; c.fill(); c.strokeStyle = t.edge; c.lineWidth = sw(0.6); c.stroke();
          if (detail) { c.rotate(-a); c.strokeStyle = 'rgba(70,60,50,.45)'; c.lineWidth = sw(0.8); c.beginPath(); c.moveTo(0, -k); c.bezierCurveTo(sw(2), -k - sw(3), -sw(2), -k - sw(5), sw(1), -k - sw(8)); c.stroke(); }
        } else {
          const k = w * 1.4 + sw(1.2);
          c.fillStyle = t.edge; c.fillRect(-k - sw(0.5), -k * 1.6 - sw(0.5), 2 * k + sw(1), k * 1.6 + sw(1) + w / 2);
          c.fillStyle = col || t.body; c.fillRect(-k, -k * 1.6, 2 * k, k * 1.6 + w / 2);
          if (detail) { c.fillStyle = t.top; c.fillRect(-k * 0.6, -k * 1.25, k * 1.2, k * 0.9); }
        }
        c.restore();
      });
    }
    // 名称（沿墙中段）
    if (l.name && detail) {
      const pts = U.resample(raw, sw(6)), m = pts[Math.floor(pts.length / 2)];
      if (m) {
        let a = m[2]; if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;
        c.save(); c.translate(m[0], m[1]); c.rotate(a);
        c.font = App.R.fontFor(l.name, sw(11), '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.lineWidth = sw(3); c.strokeStyle = 'rgba(245,235,210,.85)'; c.strokeText(l.name, 0, -w - sw(2.5));
        c.fillStyle = '#3d2410'; c.fillText(l.name, 0, -w - sw(2.5)); c.restore();
      }
    }
    c.restore();
  };

  // ---------- 沿山脊吸附：把手画的线拉到附近的山岭、丘陵上 ----------
  const RIDGE = { 5: 3, 6: 2.4, 4: 2 };
  WL.snapRidge = (pts, R = 3) => {
    const S = App.S, step = C * 2.5;
    let p = U.resample(pts, step).map(([x, y]) => [x, y]);
    if (p.length < 2) return pts;
    p.push(pts[pts.length - 1].slice());
    p = p.map(([x, y], i) => {
      if (i === 0 || i === p.length - 1) return [x, y];
      const gx = Math.floor(x / C), gy = Math.floor(y / C);
      let best = null, bs = 0.4;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const xx = gx + dx, yy = gy + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const c = yy * W + xx, t = S.terrain[c]; if (t < 2) continue;
        const sc = (RIDGE[t] || 0) - Math.hypot(dx, dy) * 0.45;
        if (sc > bs) { bs = sc; best = [(xx + 0.5) * C, (yy + 0.5) * C]; }
      }
      return best || [x, y];
    });
    // 平滑两遍，去掉锯齿
    for (let k = 0; k < 2; k++) p = p.map((q, i) => (i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + q[0] * 2 + p[i + 1][0]) / 4, (p[i - 1][1] + q[1] * 2 + p[i + 1][1]) / 4]));
    return U.simplify(p, 1.2).map((q) => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]);
  };

  // ---------- 穿河、过路的地方自动设关 ----------
  const segX = (a, b, c2, d) => {
    const r = [b[0] - a[0], b[1] - a[1]], s2 = [d[0] - c2[0], d[1] - c2[1]], den = r[0] * s2[1] - r[1] * s2[0];
    if (Math.abs(den) < 1e-9) return null;
    const t = ((c2[0] - a[0]) * s2[1] - (c2[1] - a[1]) * s2[0]) / den, u = ((c2[0] - a[0]) * r[1] - (c2[1] - a[1]) * r[0]) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + t * r[0], a[1] + t * r[1]] : null;
  };
  const crossings = (pts, others) => {
    const out = [];
    others.forEach((o) => { const q = o.pts || []; for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < q.length - 1; j++) { const x = segX(pts[i], pts[i + 1], q[j], q[j + 1]); if (x) out.push({ p: x, kind: o.kind }); } });
    return out;
  };
  WL.autoPasses = (pts) => {
    const S = App.S, made = [];
    const list = crossings(pts, S.rivers.map((r) => ({ pts: r.pts, kind: 'river' })).concat(S.lines.filter((l) => l.style === 'road').map((l) => ({ pts: l.pts, kind: 'road' }))));
    // 再加上「山口」：墙经过的一小段平地，两头都是山
    const along = U.resample(pts, C * 2), kind = along.map(([x, y]) => { const c = App.Ops.cellAt(x, y), t = c >= 0 ? S.terrain[c] : 0; return t === 5 || t === 6 ? 'm' : t >= 2 ? 'l' : 's'; });
    for (let i = 1; i < kind.length; i++) {
      if (kind[i] !== 'l' || kind[i - 1] !== 'm') continue;
      let j = i; while (j < kind.length && kind[j] === 'l') j++;
      if (j < kind.length && kind[j] === 'm' && j - i <= 5) list.push({ p: along[(i + j - 1) >> 1].slice(0, 2), kind: 'gap' });
      i = j;
    }
    list.forEach(({ p: [x, y], kind }) => {
      const c = App.Ops.cellAt(x, y); if (c < 0 || App.S.terrain[c] < 2) return;
      if (S.cities.some((k) => Math.hypot(k.x - x, k.y - y) < 22)) return;
      const n = App.nation(S.owner[c]), cul = n ? n.culture : 'huaxia';
      let nm = App.Names.city(cul, Math.random, x, y);
      if (!App.Names.groups.latin.includes(cul)) { const b = Array.from(App.Names.stripSuffix(nm) || nm); nm = b.slice(0, 2).join('') + '关'; if (S.cities.some((k) => k.name === nm)) nm = b.slice(0, 1).join('') + (kind === 'river' ? '津关' : kind === 'road' ? '口关' : '门关'); }
      const ct = { id: App.nid(), x, y, type: 'pass', name: nm }; S.cities.push(ct); made.push(ct);
    });
    return made;
  };
})();
