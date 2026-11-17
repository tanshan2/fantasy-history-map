// ===== 启动 =====
(async () => {
  const cv = document.getElementById('map');
  App.R.init(cv);
  App.Tools.init(cv);
  window.addEventListener('resize', App.R.resize);
  let restored = false;
  try {
    const saved = await App.DB.get('autosave');
    if (saved) { App.deserialize(JSON.parse(saved)); restored = true; }
  } catch (e) { console.warn('恢复失败', e); }
  App.UI.init(); App.UI.initLv();
  ['Noto Serif SC', 'IM Fell English', App.S.meta.labelFont, App.S.meta.latinFont].forEach((f) => App.UI.loadFont(f));
  if (!restored) {
    App.UI.busy('首次打开：载入「天汉历626年」…', async () => {
      try { await App.Preset.tianhan(); } catch (e) { console.error(e); App.Gen.random({ nations: 12 }); }
      App.afterBigChange(); App.R.fit();
    });
  } else { App.afterBigChange(); App.R.fit(); }
  if (document.fonts) document.fonts.ready.then(() => App.R.request());
})();
