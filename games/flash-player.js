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
  document.addEventListener('DOMContentLoaded', async function () {
    var status = document.getElementById('status');
    var retry = document.getElementById('retry');
    retry.addEventListener('click', function () { window.location.reload(); });
    try {
      player = window.RufflePlayer.newest().createPlayer();
      document.getElementById('game').appendChild(player);
      await player.ruffle().load({ url: 'game.swf' });
      status.hidden = true;
    } catch (error) {
      document.getElementById('status-text').textContent = 'The game could not load. Please try again.';
      retry.hidden = false;
      console.error('Unable to load Flash game:', error);
    }
  });
}());
