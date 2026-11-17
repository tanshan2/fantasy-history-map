// ===== 启动 =====
(async () => {
  const cv = document.getElementById('map');
  App.R.init(cv);
  App.Tools.init(cv);
  window.addEventListener('resize', App.R.resize);
  let restored = false;
  try {
    const saved = await App.DB.get('autosave2');
    if (saved) { App.deserialize(JSON.parse(saved)); restored = true; }
  } catch (e) { console.warn('恢复失败', e); }
  App.UI.init(); App.UI.initLv();
  ['Noto Serif SC', 'IM Fell English', App.S.meta.labelFont, App.S.meta.latinFont].forEach((f) => App.UI.loadFont(f));
  if (!restored) {
    App.UI.busy('正在载入亚洲模板…', async () => {
      try { await App.Preset.asia(); } catch (e) { console.error(e); App.Gen.blank(); }
      App.afterBigChange(); App.R.fit(); App.Tools.set('color');
    });
  } else { App.afterBigChange(); App.R.fit(); }
  if (document.fonts) document.fonts.ready.then(() => App.R.request());
})();
