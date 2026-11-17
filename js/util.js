// ===== 基础常量与工具函数 =====
const App = (window.App = {});
App.W = 640; App.H = 400; App.CELL = 4;
App.WW = App.W * App.CELL; App.HH = App.H * App.CELL;
App.N = App.W * App.H;

App.T = { OCEAN: 0, LAKE: 1, PLAINS: 2, GRASS: 3, HILLS: 4, MOUNTAIN: 5, SNOW: 6, DESERT: 7, MARSH: 8, TUNDRA: 9 };
App.TERRAINS = [
  { id: 2, name: '平原', color: '#e9dcbf' }, { id: 3, name: '草原', color: '#cfd39a' },
  { id: 4, name: '丘陵', color: '#d8c49c' }, { id: 5, name: '山地', color: '#c4ab86' },
  { id: 6, name: '雪山', color: '#f2f1ee' }, { id: 7, name: '沙漠', color: '#ecd29a' },
  { id: 8, name: '沼泽', color: '#a9b38a' }, { id: 9, name: '冻土', color: '#e3e6e2' },
];
App.FORESTS = [
  { id: 1, name: '阔叶林' }, { id: 2, name: '针叶林' }, { id: 3, name: '热带雨林' },
  { id: 4, name: '竹林' }, { id: 5, name: '白桦林' }, { id: 6, name: '疏林灌木' }, { id: 0, name: '清除' },
];
App.CITY_TYPES = [
  { id: 'capital', name: '首都' }, { id: 'large', name: '大城' }, { id: 'medium', name: '中城' },
  { id: 'small', name: '小城' }, { id: 'village', name: '村镇' }, { id: 'fortress', name: '要塞' },
  { id: 'port', name: '港口' }, { id: 'pass', name: '关隘' },
];
App.ARMY_TYPES = [
  { id: 'infantry', name: '步兵' }, { id: 'cavalry', name: '骑兵' }, { id: 'archer', name: '弓弩' },
  { id: 'siege', name: '器械' }, { id: 'navy', name: '水军' },
];
App.LINE_STYLES = [
  { id: 'border', name: '国界线' }, { id: 'admin', name: '行政界' }, { id: 'road', name: '道路' },
  { id: 'sea', name: '航线' }, { id: 'wall', name: '长城' }, { id: 'front', name: '战线' },
];
App.MARKER_TYPES = [
  { id: 'battle', name: '战役' }, { id: 'ruin', name: '遗迹' }, { id: 'temple', name: '寺庙' }, { id: 'mine', name: '矿产' },
];
App.PALETTE = ['#e8735a', '#f0c75e', '#e6a15f', '#8fb39b', '#b9c97a', '#a4c46a', '#d98a8a', '#c4a07f',
  '#9fb0c9', '#d6c27a', '#b48fb3', '#e3b4a0', '#88b4a8', '#c9d48a', '#e7955a', '#a8a0c8', '#cfa36f', '#7fb6d4', '#e2a3c2', '#9cc58f'];

const U = (App.U = {});
U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
U.lerp = (a, b, t) => a + (b - a) * t;
U.hash = (x, y, s = 0) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
U.rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
U.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
U.noise = (x, y, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = U.hash(xi, yi, s), b = U.hash(xi + 1, yi, s), c = U.hash(xi, yi + 1, s), d = U.hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
U.fbm = (x, y, s = 0, oct = 5) => {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * U.noise(x * f, y * f, s + i * 17); norm += amp; amp *= 0.5; f *= 2.03; }
  return sum / norm;
};
U.hexToRgb = (hex) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
U.rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
U.rgba = (hex, a) => { const [r, g, b] = U.hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
U.shade = (hex, f) => {
  const [r, g, b] = U.hexToRgb(hex);
  if (f < 0) return U.rgbToHex(r * (1 + f), g * (1 + f), b * (1 + f));
  return U.rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
};
U.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
U.segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
  t = U.clamp(t, 0, 1);
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
U.polyDist = (px, py, pts) => {
  let m = Infinity;
  for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, U.segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  if (pts.length === 1) m = U.dist(px, py, pts[0][0], pts[0][1]);
  return m;
};
// Ramer–Douglas–Peucker
U.simplify = (pts, eps) => {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = U.segDist(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
      if (d > md) { md = d; mi = i; }
    }
    if (md > eps) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
};
// Catmull-Rom 平滑采样
U.smooth = (pts, seg = 6) => {
  if (pts.length < 3) return pts.slice();
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
};
U.polyLen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += U.dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); return l; };
// 等距重采样，返回 [x,y,angle]
U.resample = (pts, step) => {
  const out = [];
  if (pts.length < 2) return out;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const l = U.dist(ax, ay, bx, by); if (!l) continue;
    const ang = Math.atan2(by - ay, bx - ax);
    let t = (step - acc);
    while (t <= l) { out.push([ax + (bx - ax) * t / l, ay + (by - ay) * t / l, ang]); t += step; }
    acc = (acc + l) % step;
  }
  return out;
};
U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
U.isLand = (t) => t >= 2;

// 二叉堆（用于多源扩张）
U.Heap = class {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, val) {
    const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  }
  pop() {
    const k = this.k, v = this.v, topV = v[0]; this.topK = k[0];
    const lk = k.pop(), lv = v.pop(); const n = k.length;
    if (n) {
      let i = 0;
      while (true) {
        let c = 2 * i + 1; if (c >= n) break;
        if (c + 1 < n && k[c + 1] < k[c]) c++;
        if (k[c] >= lk) break;
        k[i] = k[c]; v[i] = v[c]; i = c;
      }
      k[i] = lk; v[i] = lv;
    }
    return topV;
  }
};

// 多源扩张：seeds [{cell, id, budget, mult}]，cost(c)->number|Infinity，返回 Int32Array 归属(seed下标, -1)
U.grow = (seeds, cost) => {
  const W = App.W, H = App.H, N = App.N;
  const best = new Float64Array(N).fill(Infinity);
  const who = new Int32Array(N).fill(-1);
  const h = new U.Heap();
  seeds.forEach((s, i) => { if (s.cell >= 0) { best[s.cell] = 0; who[s.cell] = i; h.push(0, s.cell); } });
  while (h.size) {
    const c = h.pop(), d = h.topK;
    if (d > best[c]) continue;
    const si = who[c], sd = seeds[si];
    const x = c % W, y = (c / W) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      const cc = cost(n, c);
      if (!isFinite(cc)) continue;
      const nd = d + cc * (sd.mult || 1);
      if (sd.budget && nd > sd.budget) continue;
      if (nd < best[n]) { best[n] = nd; who[n] = si; h.push(nd, n); }
    }
  }
  return who;
};
