// ===== 地图数据、撤销、存档 =====
App.OBJ_KEYS = ['nations', 'provinces', 'cities', 'armies', 'rivers', 'lines', 'arrows', 'markers', 'texts', 'families', 'people'];
App.ARR_KEYS = ['terrain', 'forest', 'owner', 'prov', 'prov2', 'prov3', 'climate'];

App.newState = () => ({
  terrain: new Uint8Array(App.N), forest: new Uint8Array(App.N),
  owner: new Uint32Array(App.N), prov: new Uint32Array(App.N), prov2: new Uint32Array(App.N), prov3: new Uint32Array(App.N), climate: new Uint8Array(App.N),
  nations: [], provinces: [], cities: [], armies: [], rivers: [], lines: [], arrows: [], markers: [], texts: [], families: [], people: [],
  meta: {
    name: '未命名地图', labelFont: 'Noto Serif SC', latinFont: 'IM Fell English', style: 'parchment', styleV: 2, zhNames: true, cityStyle: 'icon', year: 1, lv1: true, lv2: true, lv3: false,
    showIcons: true, mapView: 'all', showVassal: true, showGrid: true, showProvLabels: true, showCityLabels: true, showArmies: true,
    ocean: '#304a66', ref: null,
  },
  nextId: 1,
});
App.S = App.newState();
App.nid = () => App.S.nextId++;
App.nation = (id) => App.S.nations.find((n) => n.id === id);
App.province = (id) => App.S.provinces.find((p) => p.id === id);

// ---- 撤销 / 重做 ----
App.undoStack = []; App.redoStack = [];
App.snapshot = (arrs = []) => {
  const s = App.S, snap = { objs: JSON.stringify(App.OBJ_KEYS.reduce((o, k) => ((o[k] = s[k]), o), { meta: { ...s.meta, ref: undefined }, nextId: s.nextId })), arrs: {} };
  arrs.forEach((k) => (snap.arrs[k] = s[k].slice()));
  return snap;
};
App.pushUndo = (arrs = []) => {
  App.undoStack.push(App.snapshot(arrs));
  if (App.undoStack.length > 40) App.undoStack.shift();
  App.redoStack.length = 0;
};
App.restore = (snap) => {
  const o = JSON.parse(snap.objs), s = App.S;
  App.OBJ_KEYS.forEach((k) => (s[k] = o[k]));
  s.nextId = o.nextId; const ref = s.meta.ref; s.meta = o.meta; s.meta.ref = ref;
  Object.entries(snap.arrs).forEach(([k, a]) => (s[k] = a));
};
App.undo = () => {
  const snap = App.undoStack.pop(); if (!snap) return;
  App.redoStack.push(App.snapshot(Object.keys(snap.arrs)));
  App.restore(snap); App.afterBigChange();
};
App.redo = () => {
  const snap = App.redoStack.pop(); if (!snap) return;
  App.undoStack.push(App.snapshot(Object.keys(snap.arrs)));
  App.restore(snap); App.afterBigChange();
};

// ---- 序列化（游程编码） ----
const rle = (arr) => {
  const out = []; let v = arr[0], n = 0;
  for (let i = 0; i < arr.length; i++) { if (arr[i] === v) n++; else { out.push(v, n); v = arr[i]; n = 1; } }
  out.push(v, n); return out;
};
const unrle = (data, Type) => {
  const a = new Type(App.N); let p = 0;
  for (let i = 0; i < data.length; i += 2) { a.fill(data[i], p, p + data[i + 1]); p += data[i + 1]; }
  return a;
};
App.serialize = (withRef = true) => {
  const s = App.S, o = { format: 'fantasy-history-map', version: 1, W: App.W, H: App.H, nextId: s.nextId, meta: { ...s.meta } };
  if (!withRef) o.meta.ref = null;
  App.OBJ_KEYS.forEach((k) => (o[k] = s[k]));
  App.ARR_KEYS.forEach((k) => (o[k] = rle(s[k])));
  return o;
};
App.deserialize = (o) => {
  if (!o || o.format !== 'fantasy-history-map') throw new Error('不是本工具的地图文件');
  const s = App.newState();
  s.nextId = o.nextId; Object.assign(s.meta, o.meta || {}); if (!(o.meta || {}).styleV) { s.meta.style = 'parchment'; s.meta.styleV = 2; s.meta.ocean = '#304a66'; s.meta.latinFont = 'IM Fell English'; }
  App.OBJ_KEYS.forEach((k) => (s[k] = o[k] || []));
  s.terrain = unrle(o.terrain, Uint8Array); s.forest = unrle(o.forest, Uint8Array);
  s.owner = unrle(o.owner, Uint32Array); s.prov = unrle(o.prov, Uint32Array);
  if (o.prov2) s.prov2 = unrle(o.prov2, Uint32Array); if (o.climate) s.climate = unrle(o.climate, Uint8Array); if (o.prov3) s.prov3 = unrle(o.prov3, Uint32Array);
  s.provinces.forEach((p) => (p.level = p.level || 1));
  App.repairIds(s);
  if (!s.meta.zhNames && App.Translit) { App.Translit.migrate(s); s.meta.zhNames = true; }
  App.S = s; App.undoStack.length = 0; App.redoStack.length = 0;
  // 旧版留下的空名行政区：补上名字
  if (App.PlaceNames && s.provinces.some((p) => !p.name)) {
    s.nations.forEach((n) => { try { App.PlaceNames.fitProvinces(n.id, (p) => !p.name); } catch (e) { console.warn(e); } });
    const live = new Set(); for (let c = 0; c < s.prov.length; c++) { live.add(s.prov[c]); live.add(s.prov2[c]); live.add(s.prov3[c]); }
    s.provinces = s.provinces.filter((p) => p.name || live.has(p.id));
  }
};

// ---- IndexedDB 自动保存（浏览器内，不占你的硬盘多少空间） ----
App.DB = {
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('fantasy-map', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  },
  async get(k) { const db = await this.open(); return new Promise((res) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); },
  async set(k, v) { const db = await this.open(); return new Promise((res) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(true); t.onerror = () => res(false); }); },
};
let saveTimer = 0;
App.autosave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { App.DB.set('autosave2', JSON.stringify(App.serialize(true))).then(() => App.UI && App.UI.flash('已自动保存')); } catch (e) { console.warn(e); }
  }, 1500);
};

// ---- 三级行政区 ----
App.LEVELS = [null, { name: '省', full: '一级（省/州）' }, { name: '道', full: '二级（道/路）' }, { name: '府', full: '三级（府/州）' }];
App.provArr = (lv) => (lv === 3 ? App.S.prov3 : lv === 2 ? App.S.prov2 : App.S.prov);
App.provKey = (lv) => (lv === 3 ? 'prov3' : lv === 2 ? 'prov2' : 'prov');
App.family = (id) => App.S.families.find((f) => f.id === id);
App.person = (id) => App.S.people.find((p) => p.id === id);

// ---- 修复旧存档：旧版每格只能存 0～65535 的编号，编号超过后被截断（边界还在、名字查不到）----
// 截断后的值 = 真编号 % 65536。按「同一国家、同一级」把它对回现存的国家 / 行政区。
App.repairIds = (s) => {
  const big = s.nations.some((n) => n.id > 65535) || s.provinces.some((p) => p.id > 65535);
  if (!big) return 0;
  const N = s.owner.length, nat = new Map(), nIds = new Set(s.nations.map((n) => n.id));
  s.nations.forEach((n) => { const k = n.id % 65536; if (!nat.has(k)) nat.set(k, n.id); });
  const pk = new Map(); s.provinces.forEach((p) => pk.set((p.id % 65536) + ':' + p.nation + ':' + (p.level || 1), p.id));
  const pIds = new Set(s.provinces.map((p) => p.id));
  let fixed = 0;
  for (let c = 0; c < N; c++) {
    let o = s.owner[c];
    if (o && !nIds.has(o) && nat.has(o)) { o = s.owner[c] = nat.get(o); fixed++; }
    [s.prov, s.prov2, s.prov3].forEach((A, i) => {
      const v = A[c]; if (!v || pIds.has(v) && App.repairOk(s, v, o, i + 1)) return;
      const id = pk.get((v % 65536) + ':' + o + ':' + (i + 1));
      A[c] = id || 0; fixed++;
    });
  }
  s.meta.idsRepaired = (s.meta.idsRepaired || 0) + fixed;
  return fixed;
};
// 这个编号确实是本国、这一级的行政区吗（截断后可能恰好撞上别的区的小编号）
App.repairOk = (s, id, owner, level) => {
  if (!App._rp || App._rp.s !== s) App._rp = { s, m: new Map(s.provinces.map((p) => [p.id, p])) };
  const p = App._rp.m.get(id); return !!p && p.nation === owner && (p.level || 1) === level;
};
