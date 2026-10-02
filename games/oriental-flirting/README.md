# Oriental Flirting Game

This is the Flash game served by the Blipzi page supplied for this project:
https://www.blipzi.com/oriental-flirting-game.html

Game file retrieved October 2, 2026 from:
https://swf.gamenora.com/Oriental%20Flirting%20Game%202/1.244_content.swf

The SWF is stored unchanged as `game.swf`. It is third-party game content;
no open-source license for the game has been verified. Its rights remain
with its original owners. Ruffle's licenses cover the emulator separately.

The player uses the official Ruffle 0.6.0 self-hosted release, stored in
`../ruffle/` with its MIT and Apache license files:
https://github.com/ruffle-rs/ruffle/releases/tag/v0.6.0

All runtime files are served locally. No CDN or Gamenora embed is required.
External requests, navigation and Flash JavaScript access are disabled.
The obsolete Shockwave online high-score service is consequently unavailable.

Serve Aero over HTTP(S), such as GitHub Pages; opening `index.html` directly
as a `file://` URL cannot load the WebAssembly player reliably.

The game loads when opened from Start, pauses when minimized or when the
browser tab is hidden, and resets when closed or restarted.
