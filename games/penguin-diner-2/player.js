(function () {
  'use strict';
  // Preserve the original game and its credits, using the local assets only.
  Config.logoURL = 'https://www.2dplay.com/';
  window.addEventListener('load', function () {
    document.documentElement.dataset.renderer = app.pixi.renderer.type === PIXI.RENDERER_TYPE.WEBGL ? 'webgl' : 'canvas';
    window.AeroGameAudio.bind(function (muted) {
      PIXI.sound.volumeAll = muted ? 0 : 1;
    });
  });
}());
