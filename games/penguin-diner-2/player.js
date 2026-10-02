(function () {
  'use strict';
  // Preserve the original game and its credits, using the local assets only.
  Config.logoURL = 'https://www.2dplay.com/';
  window.addEventListener('load', function () {
    window.AeroGameAudio.bind(function (muted) {
      PIXI.sound.volumeAll = muted ? 0 : 1;
    });
  });
}());
