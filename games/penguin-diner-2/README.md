# Penguin Diner 2

HTML5 Penguin Diner 2 (runtime version 96), retrieved October 2, 2026 from
https://html5.gamedistribution.com/rvvASMiM/715bfa195dd64b179c9a9f6d36c99534/

The user supplied https://www.1001games.com/skill/penguin-diner-2 and the
GameDistribution player link. The assets in this folder are served from Aero;
no GameDistribution SDK, remote embed or CDN is loaded. The player page restricts
asset and network requests to its own origin with a Content Security Policy.
The official Pixi 5.3.3 CSP compatibility module in compat/ keeps WebGL enabled
without allowing dynamic code evaluation. This restores hover glow and shop
grayscale effects that the Canvas fallback omits. The original 115 downloaded
assets still match their recorded hashes.

The original game code, artwork, levels, fonts and audio are unchanged. Its
copyright notice credits Bigwig Media Ltd. No open-source license for the game
has been verified; the original owners retain their rights. Bundled library
notices remain in the downloaded JavaScript. Original game credits are retained.
See asset-manifest.json for source details and SHA-256 hashes of downloaded files.

Open **Start → Penguin Diner 2**. Click to seat customers, take orders, deliver
food and collect tips. Progress is saved by the original game in browser storage.
Minimize keeps the session running; click its taskbar button to restore it.
Close unloads the player, and Restart reloads it (saved progress remains).

The header's **Mute/Unmute** button controls all game sound separately from the
Aero jukebox. Its preference is stored per game and retained across restart,
close/reopen and page reload. The audio bridge is shared with the Flash games
in ../audio-control.js. Serve over HTTP(S), such as GitHub Pages.

Rendering audit (October 14, 2026): original shader setup fails under the page
policy without the compatibility module; with it, shader validation and uniform
uploads work without dynamic code. WebGL is still required for the original
filters; the browser/GPU must support it. The player exposes data-renderer on
the document element to distinguish WebGL from the reduced Canvas fallback.
