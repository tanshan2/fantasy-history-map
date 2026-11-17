// ===== 气候系统 =====
(() => {
  const W = App.W, H = App.H, N = App.N;
  const CL = (App.Climate = {});
  CL.LIST = [
    null,
    { id: 1, name: '热带雨林', color: '#2f7d4a', desc: '终年高温多雨' },
    { id: 2, name: '热带季风', color: '#6a9f45', desc: '高温，旱雨两季分明' },
    { id: 3, name: '热带草原', color: '#c2b55a', desc: '高温，干湿季交替' },
    { id: 4, name: '沙漠', color: '#e3c27c', desc: '炎热或寒冷，极度干旱' },
    { id: 5, name: '半干旱草原', color: '#d9cb8f', desc: '降水少，草原为主' },
    { id: 6, name: '地中海', color: '#d79a5e', desc: '夏干冬雨' },
    { id: 7, name: '亚热带湿润', color: '#8fbf63', desc: '夏热多雨，冬温和' },
    { id: 8, name: '温带海洋性', color: '#5fa59e', desc: '温和湿润，四季均匀' },
    { id: 9, name: '温带季风', color: '#9ccf86', desc: '夏雨冬干，四季分明' },
    { id: 10, name: '温带大陆性', color: '#aeb77a', desc: '冬冷夏热，降水偏少' },
    { id: 11, name: '亚寒带针叶林', color: '#5d8790', desc: '冬季漫长寒冷' },
    { id: 12, name: '苔原', color: '#b9c3c0', desc: '极寒，地表冻土' },
    { id: 13, name: '冰原', color: '#eef2f4', desc: '终年冰雪' },
    { id: 14, name: '高山', color: '#9a8f99', desc: '随海拔变化' },
  ];

  // 根据温度(°C)、降水(0-1)、海拔(0-1)等分类
  CL.classify = (t, rain, elev, o = {}) => {
    if (elev > 0.8) return t < -6 ? 13 : 14;
    if (t < -10) return 13;
    if (t < -1) return 12;
    if (t < 6) return rain > 0.22 ? 11 : 10;
    if (rain < 0.17) return 4;
    if (t >= 22) { if (rain > 0.72) return 1; if (rain > 0.5) return 2; if (rain > 0.27) return 3; return 5; }
    if (rain < 0.3) return 5;
    if (t >= 14) { if (o.westCoast && rain < 0.58 && o.absLat > 26 && o.absLat < 44) return 6; return rain > 0.48 ? 7 : 6; }
    if (o.coastal && o.westerly && rain > 0.45) return 8;
    if (rain > 0.52) return 9;
    return 10;
  };

  // 按气候设置地貌与森林（不覆盖山地/丘陵）
  CL.applyBiomes = (S, r = Math.random, keepRelief = true) => {
    for (let c = 0; c < N; c++) {
      const t0 = S.terrain[c]; if (t0 < 2) continue;
      const cl = S.climate[c]; if (!cl) continue;
      const x = c % W, y = (c / W) | 0;
      const relief = t0 === 4 || t0 === 5 || t0 === 6;
      let t = 2, f = 0;
      const n = U.noise(x / 9, y / 9, 61), n2 = U.noise(x / 5, y / 5, 62), h = U.hash(x, y, 63);
      switch (cl) {
        case 1: f = n > 0.25 ? 3 : 0; break;
        case 2: f = n > 0.42 ? (n2 > 0.62 ? 4 : h < 0.5 ? 3 : 1) : 0; break;
        case 3: t = 3; f = n > 0.66 ? 6 : 0; break;
        case 4: t = 7; break;
        case 5: t = 3; f = n > 0.8 ? 6 : 0; break;
        case 6: f = n > 0.55 ? 6 : 0; break;
        case 7: f = n > 0.42 ? (n2 > 0.66 ? 4 : 1) : 0; break;
        case 8: f = n > 0.4 ? (h < 0.3 ? 2 : 1) : 0; break;
        case 9: f = n > 0.48 ? (h < 0.35 ? 2 : 1) : 0; break;
        case 10: t = n2 > 0.55 ? 3 : 2; f = n > 0.7 ? 1 : 0; break;
        case 11: f = n > 0.28 ? (h < 0.25 ? 5 : 2) : 0; if (n2 > 0.82) t = 8; break;
        case 12: t = 9; f = 0; break;
        case 13: t = 9; f = 0; break;
        case 14: t = t0 === 6 ? 6 : 5; f = 0; break;
      }
      if (relief && keepRelief) t = t0;
      if ((t === 5 || t === 6) && f) f = h < 0.35 ? (cl === 1 ? 3 : 2) : 0;
      S.terrain[c] = t; S.forest[c] = f;
    }
  };

  CL.at = (c) => CL.LIST[App.S.climate[c]] || null;

  // 气候图层画布
  CL.canvas = document.createElement('canvas'); CL.canvas.width = W; CL.canvas.height = H;
  CL.rebuild = () => {
    const S = App.S, ctx = CL.canvas.getContext('2d'), im = ctx.createImageData(W, H), D = im.data;
    const cols = CL.LIST.map((k) => (k ? U.hexToRgb(k.color) : null));
    for (let c = 0; c < N; c++) {
      const k = S.terrain[c] >= 2 ? cols[S.climate[c]] : null; if (!k) continue;
      D[c * 4] = k[0]; D[c * 4 + 1] = k[1]; D[c * 4 + 2] = k[2]; D[c * 4 + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
  };

  // 亚洲模板的气候（按真实经纬度与地貌推断）
  CL.fromGeo = (S, lonOf, latOf) => {
    for (let c = 0; c < N; c++) {
      const t = S.terrain[c]; if (t < 2) continue;
      const x = c % W, y = (c / W) | 0, f = S.forest[c];
      const lon = lonOf(x) + (U.fbm(x / 22, y / 22, 71, 4) - 0.5) * 9, lat = latOf(y) + (U.fbm(x / 22, y / 22, 72, 4) - 0.5) * 6;
      let k;
      if (t === 6) k = 14;
      else if (t === 5 && (lon > 74 && lon < 102 && lat > 27 && lat < 40)) k = 14;
      else if (t === 7) k = 4;
      else if (t === 9) k = lat > 66 ? 13 : 12;
      else if (lat > 61) k = 12;
      else if (lat > 49 && lon > 56) k = 11;
      else if (lon > 78 && lon < 101 && lat > 29 && lat < 37) k = 14;
      else if (t === 3) k = lat < 20 ? 3 : 5;
      else if (lat < 10) k = f === 3 || lon > 95 ? 1 : 2;
      else if (lat < 23) k = lon > 92 ? (f === 3 ? 1 : 2) : lon > 66 ? (lon < 72 ? 3 : 2) : 3;
      else if (lon < 46 && lat < 42) k = lat < 31 ? 4 : 6;
      else if (lon < 62 && lat < 40) k = lat < 34 ? 4 : 5;
      else if (lon > 102 && lat < 34) k = 7;
      else if (lon > 100 && lat < 50) k = lon > 128 && lat > 33 ? 8 : 9;
      else if (lat < 30 && lon > 66 && lon < 92) k = 2;
      else k = 10;
      if (k === 7 && lon > 128 && lat > 30) k = 8;
      S.climate[c] = k;
    }
  };
})();
