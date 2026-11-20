// ===== 智能修边（AI）：把手画的边界修成更像真实疆界的线 =====
// 思路：只在你刚画的边界两侧一条窄带内重新划分。
// 带外的格子保持原主不变，作为“种子”向带内竞争扩张；
// 越过河流代价很高（边界会贴河走），翻越山地代价高（边界落在山脊），
// 再叠加分形噪声让线条自然曲折；最后去掉零碎小斑块。
(() => {
  const W = App.W, H = App.H, N = App.N;
  const RF = (App.Refine = {});

  // before: 画之前的归属数组；arr: 当前归属数组（会被修改）；allowed(c)：可参与的格子
  RF.refine = ({ before, arr, allowed, band = 6, seed = 1, assign }) => {
    const S = App.S;
    // 1) 本次被改动的格子 & 涉及的归属
    const involved = new Set(); let changed = 0;
    for (let c = 0; c < N; c++) if (before[c] !== arr[c] && allowed(c)) { involved.add(arr[c]); involved.add(before[c]); changed++; }
    if (changed < 8) return 0;
    const inv = (c) => allowed(c) && involved.has(arr[c]);
    // 只处理改动区域附近（外扩一圈 band），避免动到别处已有的边界
    const near = new Uint8Array(N), q0 = [];
    for (let c = 0; c < N; c++) if (before[c] !== arr[c] && allowed(c)) { near[c] = 1; q0.push(c); }
    const nd = new Uint8Array(N);
    for (let h = 0; h < q0.length; h++) {
      const c = q0[h], x = c % W, y = (c / W) | 0; if (nd[c] >= band + 2) continue;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) if (n >= 0 && !near[n] && inv(n)) { near[n] = 1; nd[n] = nd[c] + 1; q0.push(n); }
    }
    // 2) 边界格：与另一种（涉及的）归属相邻
    const dist = new Uint8Array(N).fill(255), q = [];
    for (let c = 0; c < N; c++) {
      if (!near[c] || !inv(c)) continue;
      const x = c % W, y = (c / W) | 0, a = arr[c];
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) if (n >= 0 && inv(n) && arr[n] !== a) { dist[c] = 0; q.push(c); break; }
    }
    if (!q.length) return 0;
    for (let h = 0; h < q.length; h++) {
      const c = q[h], dc = dist[c]; if (dc > band) continue;
      const x = c % W, y = (c / W) | 0;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) if (n >= 0 && dist[n] === 255 && near[n] && inv(n)) { dist[n] = dc + 1; q.push(n); }
    }
    // 3) 种子：带外一圈保持原主；带内格子由种子竞争
    const riv = App.Tools.riverMask ? App.Tools.riverMask() : null;
    const best = new Float64Array(N).fill(Infinity), who = new Int32Array(N).fill(-1), heap = new U.Heap();
    const inBand = (c) => dist[c] <= band;
    for (let c = 0; c < N; c++) if (dist[c] === band + 1) { best[c] = 0; who[c] = arr[c]; heap.push(0, c); }
    // 带内若某种归属没有种子（整块都在带内），用它离边界最远的格子当种子
    const seeded = new Set(); for (let c = 0; c < N; c++) if (dist[c] === band + 1) seeded.add(arr[c]);
    const far = new Map();
    for (let c = 0; c < N; c++) if (inBand(c) && !seeded.has(arr[c])) { const f = far.get(arr[c]); if (!f || dist[c] > dist[f]) far.set(arr[c], c); }
    far.forEach((c) => { best[c] = 0; who[c] = arr[c]; heap.push(0, c); });
    const T = S.terrain, sd = (seed % 997) * 3.7;
    // 本次画的目标（改动后最多的归属）：用来给边界加上大尺度的自然弯曲
    const tc = new Map(); for (let c = 0; c < N; c++) if (before[c] !== arr[c] && allowed(c)) tc.set(arr[c], (tc.get(arr[c]) || 0) + 1);
    let target = null, tk = 0; tc.forEach((k, v) => { if (k > tk) { tk = k; target = v; } });
    const A = 1.3 + band * 0.08;
    const stepCost = (from, to, owner) => {
      const x = to % W, y = (to / W) | 0;
      const wx2 = x + (U.fbm(x / 16 + sd, y / 16, 43, 3) - 0.5) * 10, wy2 = y + (U.fbm(x / 16, y / 16 - sd, 44, 3) - 0.5) * 10;
      let k = 1 + (U.fbm(wx2 / 10 + sd, wy2 / 10 - sd, 41, 4) - 0.5) * 4.4 + (U.noise(x / 3.5 + sd, y / 3.5, 42) - 0.5) * 1.3;
      const bias = (U.fbm(x / 22 + sd * 2, y / 22 - sd, 45, 3) - 0.5) * 2 * A; k += owner === target ? bias : -bias;
      const t = T[to]; if (t === 5) k += 2.2; else if (t === 6) k += 3.5; else if (t === 4) k += 0.6;
      if (riv && riv[from] && !riv[to]) k += 9; // 过河很难：边界贴河
      return Math.max(0.15, k);
    };
    while (heap.size) {
      const c = heap.pop(), d = heap.topK; if (d > best[c]) continue;
      const x = c % W, y = (c / W) | 0;
      for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
        if (n < 0 || !inBand(n)) continue;
        const nd2 = d + stepCost(c, n, who[c]);
        if (nd2 < best[n]) { best[n] = nd2; who[n] = who[c]; heap.push(nd2, n); }
      }
    }
    // 4) 写回
    const out = new Map(); let moved = 0;
    for (let c = 0; c < N; c++) if (inBand(c) && who[c] >= 0 && who[c] !== arr[c]) { out.set(c, who[c]); }
    out.forEach((v, c) => { assign(c, v); moved++; });
    // 5) 去碎块：带内被三面以上包围的孤立格翻转（两轮）
    for (let it = 0; it < 2; it++) {
      const flips = [];
      for (let c = 0; c < N; c++) {
        if (!inBand(c)) continue; const x = c % W, y = (c / W) | 0, a = arr[c], cnt = new Map();
        for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) if (n >= 0 && inv(n) && arr[n] !== a) cnt.set(arr[n], (cnt.get(arr[n]) || 0) + 1);
        cnt.forEach((k, v) => { if (k >= 3) flips.push([c, v]); });
      }
      flips.forEach(([c, v]) => assign(c, v)); moved += flips.length;
    }
    // 6) 去掉带内面积很小的飞地
    const seen = new Uint8Array(N);
    for (let s = 0; s < N; s++) {
      if (seen[s] || !inBand(s)) continue;
      const a = arr[s], comp = [s], qq = [s]; seen[s] = 1; let touchesOut = false;
      while (qq.length) {
        const c = qq.pop(), x = c % W, y = (c / W) | 0;
        for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
          if (n < 0 || !inv(n) || arr[n] !== a) continue;
          if (!inBand(n)) { touchesOut = true; continue; }
          if (!seen[n]) { seen[n] = 1; comp.push(n); qq.push(n); }
        }
      }
      if (!touchesOut && comp.length < Math.max(6, band * 2)) {
        // 并入周围最多的归属
        const cnt = new Map();
        comp.forEach((c) => { const x = c % W, y = (c / W) | 0; for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) if (n >= 0 && inv(n) && arr[n] !== a) cnt.set(arr[n], (cnt.get(arr[n]) || 0) + 1); });
        let bv = null, bk = 0; cnt.forEach((k, v) => { if (k > bk) { bk = k; bv = v; } });
        if (bv !== null) { comp.forEach((c) => assign(c, bv)); moved += comp.length; }
      }
    }
    return moved;
  };

  // 对“刚画完的一笔”做修边：tool = color / nation / prov
  RF.refineStroke = (stroke) => {
    const S = App.S, { tool, snap, prov, brush } = stroke;
    const band = U.clamp(Math.round(brush * 1.0), 4, 12), seed = (Date.now() / 1000) | 0;
    if (tool === 'prov') {
      const lv = prov.level || 1, A = App.provArr(lv), before = snap.arrs[App.provKey(lv)]; if (!before) return 0;
      const nation = prov.nation, parent = prov.parent, up = lv > 1 ? App.provArr(lv - 1) : null;
      return RF.refine({ before, arr: A, band, seed, allowed: (c) => S.owner[c] === nation && (!up || up[c] === parent),
        assign: (c, v) => { const p = App.province(v); if (p) App.Ops.setProvCell(c, p); else App.Ops.clearProvCell(c, lv); } });
    }
    const before = snap.arrs.owner; if (!before) return 0;
    const n = RF.refine({ before, arr: S.owner, band, seed, allowed: (c) => S.terrain[c] >= 2, assign: (c, v) => { if (S.owner[c] !== v) { S.owner[c] = v; App.Ops.clearAllProv(c); } } });
    App.Ops.fillUnassigned();
    return n;
  };

  // ---- 画完询问 ----
  let pending = null;
  const box = () => {
    let b = document.getElementById('refineAsk');
    if (!b) {
      b = document.createElement('div'); b.id = 'refineAsk'; b.hidden = true;
      b.innerHTML = '<span>✨ 要用 AI 把这次画的边界修整得更像真实疆界吗？</span><button class="btn pri" data-r="yes">修整</button><button class="btn" data-r="no">保留原样</button><label class="ck" title="关闭后可在画笔工具栏重新打开"><input type="checkbox" data-r="never"> 不再询问</label>';
      document.getElementById('stage').appendChild(b);
      b.addEventListener('click', (e) => {
        const r = e.target.dataset.r; if (r === 'yes') RF.answer(true); else if (r === 'no') RF.answer(false);
      });
      b.querySelector('[data-r=never]').onchange = (e) => { App.Tools.opt.askRefine = !e.target.checked; if (App.UI) App.UI.refreshTool(); };
    }
    return b;
  };
  RF.ask = (stroke) => {
    pending = stroke;
    const b = box(); b.querySelector('[data-r=never]').checked = false; b.hidden = false;
  };
  RF.dismiss = () => { pending = null; const b = document.getElementById('refineAsk'); if (b) b.hidden = true; };
  RF.answer = (yes) => {
    const s = pending; RF.dismiss(); if (!s || !yes) return;
    if (!s.snap || !s.snap.arrs) { App.UI.toast('找不到这一笔的记录，无法修整'); return; }
    App.UI.busy('AI 正在修整边界…', () => {
      App.pushUndo(s.tool === 'prov' ? ['prov', 'prov2', 'prov3'] : ['owner', 'prov', 'prov2', 'prov3']);
      const n = RF.refineStroke(s);
      App.changed({ pol: true, ui: true });
      App.UI.toast(n ? '已修整边界（按 Ctrl/⌘+Z 可撤回到你画的样子）' : '这一笔附近没有可修整的边界');
    });
  };
  RF.isPending = () => !!pending;
  window.addEventListener('keydown', (e) => {
    if (!pending) return; const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'Enter') { e.preventDefault(); RF.answer(true); } else if (e.key === 'Escape') { e.preventDefault(); RF.answer(false); }
  });
})();
