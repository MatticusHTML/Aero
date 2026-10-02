(function () {
  'use strict';
  var muted = false;
  var apply = function () {};
  window.AeroGameAudio = {
    bind: function (setMuted) {
      apply = setMuted;
      apply(muted);
      if (window.parent !== window) window.parent.postMessage({ type: 'aero-game-audio-ready' }, window.location.origin);
    }
  };
  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== 'aero-game-audio' || typeof event.data.muted !== 'boolean') return;
    muted = event.data.muted;
    apply(muted);
  });
}());
