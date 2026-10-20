(function () {
  'use strict';
  var mount = document.getElementById('movie-mount');
  var screen = document.getElementById('player-screen');
  var message = document.getElementById('player-message');
  var messageText = document.getElementById('player-message-text');
  var retry = document.getElementById('player-retry');
  var toggle = document.getElementById('movie-toggle');
  var restart = document.getElementById('movie-restart');
  var mute = document.getElementById('movie-mute');
  var volumeInput = document.getElementById('movie-volume');
  var volumeValue = document.getElementById('volume-value');
  var fullscreen = document.getElementById('movie-fullscreen');
  var hint = document.getElementById('playback-hint');
  var controls = [toggle, restart, mute, volumeInput, fullscreen];
  var player = null;
  var episode = null;
  var generation = 0;
  var ready = false;
  var volume = 0.7;
  var lastAudible = 0.7;
  var stateTimer;
  try {
    var saved = localStorage.getItem('stickbox.volume');
    if (saved !== null && Number.isFinite(Number(saved))) volume = Math.max(0, Math.min(1, Number(saved)));
  } catch (_) { /* Playback also works when browser storage is unavailable. */ }
  if (volume > 0) lastAudible = volume;

  function syncVolume() {
    if (player && ready) player.ruffle().volume = volume;
    volumeInput.value = Math.round(volume * 100);
    volumeValue.textContent = Math.round(volume * 100) + '%';
    mute.textContent = volume === 0 ? 'Unmute' : 'Mute';
    mute.setAttribute('aria-pressed', String(volume === 0));
    try { localStorage.setItem('stickbox.volume', String(volume)); } catch (_) {}
  }

  function syncPlayback() {
    if (!ready || !player) return;
    var paused = player.ruffle().suspended;
    toggle.textContent = paused ? '▶ Play' : 'Ⅱ Pause';
    toggle.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    mount.dataset.state = paused ? 'paused' : 'playing';
  }

  function showError(text) {
    ready = false;
    mount.dataset.state = 'error';
    controls.forEach(function (control) { control.disabled = true; });
    message.hidden = false;
    messageText.textContent = text;
    retry.hidden = !episode;
    hint.textContent = episode ? 'Try again, or choose another episode from the series.' : 'Choose an episode from the collection.';
    document.querySelector('.episode-about').hidden = !episode;
  }

  async function loadEpisode() {
    var request = ++generation;
    ready = false;
    controls.forEach(function (control) { control.disabled = true; });
    mount.dataset.state = 'loading';
    if (player) player.remove(); // Disconnecting destroys the old runtime and its audio.
    player = null;
    message.hidden = false;
    messageText.textContent = 'Loading ' + episode.title + '…';
    retry.hidden = true;
    try {
      if (!window.RufflePlayer || !window.RufflePlayer.newest) throw new Error('Player unavailable');
      var nextPlayer = window.RufflePlayer.newest().createPlayer();
      player = nextPlayer;
      nextPlayer.setAttribute('aria-label', episode.title + ' animation');
      mount.appendChild(nextPlayer);
      var api = nextPlayer.ruffle();
      await api.load({
        url: episode.file,
        autoplay: 'off',
        splashScreen: false,
        backgroundColor: '#080a08',
        letterbox: 'on',
        allowScriptAccess: false,
        allowNetworking: 'none',
        openUrlMode: 'deny'
      });
      if (request !== generation) return;
      ready = true;
      controls.forEach(function (control) { control.disabled = false; });
      fullscreen.disabled = !document.getElementById('movie-player').requestFullscreen;
      syncVolume();
      syncPlayback();
      message.hidden = true;
      hint.textContent = 'Press Play to start. Some originals also have a Start button inside the animation.';
    } catch (error) {
      if (request !== generation) return;
      if (player) player.remove();
      player = null;
      showError('This animation could not load. Try again, or choose another episode.');
      console.error('Stick Box playback failed:', error);
    }
  }

  toggle.addEventListener('click', function () {
    if (!ready) return;
    var api = player.ruffle();
    if (api.suspended) {
      api.resume();
      hint.textContent = 'Playing. Use the original animation’s own menu if one appears.';
    } else {
      api.suspend();
      hint.textContent = 'Paused. Press Play to continue from here.';
    }
    syncPlayback();
  });
  restart.addEventListener('click', loadEpisode);
  retry.addEventListener('click', loadEpisode);
  volumeInput.addEventListener('input', function () {
    volume = Number(volumeInput.value) / 100;
    if (volume > 0) lastAudible = volume;
    syncVolume();
  });
  mute.addEventListener('click', function () {
    if (volume > 0) { lastAudible = volume; volume = 0; }
    else volume = lastAudible;
    syncVolume();
  });
  fullscreen.addEventListener('click', async function () {
    try {
      var container = document.getElementById('movie-player');
      if (document.fullscreenElement) await document.exitFullscreen();
      else await container.requestFullscreen();
    } catch (_) { hint.textContent = 'Fullscreen is unavailable in this browser. You can keep watching here.'; }
  });
  document.addEventListener('fullscreenchange', function () {
    fullscreen.textContent = document.fullscreenElement ? '⛶ Exit fullscreen' : '⛶ Fullscreen';
  });
  function pauseForBackground() {
    if (player && ready && !player.ruffle().suspended) {
      player.ruffle().suspend();
      hint.textContent = 'Paused while you were away. Press Play to continue.';
      syncPlayback();
    }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseForBackground(); });
  window.addEventListener('pagehide', function () { pauseForBackground(); clearInterval(stateTimer); });
  window.addEventListener('pageshow', function () { clearInterval(stateTimer); stateTimer = setInterval(syncPlayback, 500); });
  syncVolume();

  fetch('catalog.json').then(function (response) {
    if (!response.ok) throw new Error('Catalog unavailable');
    return response.json();
  }).then(function (catalog) {
    var id = new URLSearchParams(location.search).get('episode');
    var series = catalog.series.find(function (group) {
      return group.episodes.some(function (item) { return item.id === id; });
    });
    if (!id) series = catalog.series[0];
    if (!series) {
      document.title = 'Episode not found — Stick Box';
      document.getElementById('watch-title').textContent = 'Episode not found';
      showError('This episode isn’t in the collection. Use Back to the collection to choose one.');
      return;
    }
    episode = id ? series.episodes.find(function (item) { return item.id === id; }) : series.episodes[0];
    document.title = episode.title + ' — Stick Box';
    document.getElementById('watch-title').textContent = episode.title;
    document.getElementById('watch-series').textContent = 'Stick Fights / ' + series.title;
    document.getElementById('watch-creator').textContent = 'By ' + episode.creator;
    document.getElementById('episode-description').textContent = episode.description;
    document.getElementById('original-page').href = episode.source;
    document.getElementById('original-download').href = episode.file;
    document.getElementById('episode-list-title').textContent = series.title;
    screen.style.setProperty('--movie-ratio', episode.width + ' / ' + episode.height);
    var list = document.getElementById('episode-list');
    series.episodes.forEach(function (item, index) {
      var li = document.createElement('li');
      var link = document.createElement('a');
      link.href = 'watch.html?episode=' + encodeURIComponent(item.id);
      var number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      var title = document.createElement('span');
      title.textContent = item.title;
      link.append(number, title);
      if (item.id === episode.id) link.setAttribute('aria-current', 'page');
      li.appendChild(link);
      list.appendChild(li);
    });
    var index = series.episodes.indexOf(episode);
    [['previous-episode', index - 1, '← '], ['next-episode', index + 1, 'Next: ']].forEach(function (entry) {
      var target = series.episodes[entry[1]];
      if (!target) return;
      var link = document.getElementById(entry[0]);
      link.href = 'watch.html?episode=' + encodeURIComponent(target.id);
      link.textContent = entry[2] + target.title + (entry[0] === 'next-episode' ? ' →' : '');
      link.hidden = false;
    });
    loadEpisode();
  }).catch(function (error) {
    document.getElementById('watch-title').textContent = 'The box couldn’t open';
    showError('The collection could not load. Refresh the page to try again.');
    console.error('Stick Box catalog failed:', error);
  });
}());
