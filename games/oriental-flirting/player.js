(function () {
  'use strict';
  window.RufflePlayer = window.RufflePlayer || {};
  window.RufflePlayer.config = {
    publicPath: '../ruffle/',
    autoplay: 'off',
    backgroundColor: '#000000',
    letterbox: 'on',
    allowScriptAccess: false,
    allowNetworking: 'none',
    openUrlMode: 'deny'
  };

  var player;
  var loaded = false;
  var windowHidden = false;
  var resumeOnShow = false;
  function syncPlayback() {
    if (!loaded) return;
    var api = player.ruffle();
    var hidden = windowHidden || document.hidden;
    if (hidden) {
      if (api.isPlaying) { resumeOnShow = true; api.suspend(); }
    } else if (resumeOnShow) {
      resumeOnShow = false;
      api.resume();
    }
  }
  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== 'aero-game-visibility' || typeof event.data.hidden !== 'boolean') return;
    windowHidden = event.data.hidden;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  document.addEventListener('DOMContentLoaded', async function () {
    var status = document.getElementById('status');
    var retry = document.getElementById('retry');
    retry.addEventListener('click', function () { window.location.reload(); });
    try {
      player = window.RufflePlayer.newest().createPlayer();
      document.getElementById('game').appendChild(player);
      await player.ruffle().load({ url: 'game.swf' });
      loaded = true;
      status.hidden = true;
      syncPlayback();
    } catch (error) {
      document.getElementById('status-text').textContent = 'The game could not load. Please try again.';
      retry.hidden = false;
      console.error('Unable to load Oriental Flirting Game:', error);
    }
  });
}());
