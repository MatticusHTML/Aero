# Office Kissing

The original Japanese Flash game shown on the supplied CrazyGames and NuMuKi pages:
https://www.crazygames.com/game/office-kissing
https://www.numuki.com/game/office-kissing/

Game file retrieved October 2, 2026 from the SWF URL in CrazyGames' player configuration:
https://files.crazygames.com/officekissing.swf

The SWF is stored unchanged as `game.swf`. This is third-party game content;
its rights remain with its original owners. No open-source license for the
game has been verified. Ruffle's licenses cover the emulator separately.

The game uses Aero's existing official Ruffle 0.6.0 bundle in `../ruffle/`,
with its MIT and Apache license files. Both Flash games share `../flash-player.js`.
The game file and emulator are served locally; no external embed or CDN is needed.
External requests, navigation, and Flash JavaScript access are disabled.

Open **Start → Office Kissing** in Aero, click Play, then start the game.
Hold the left mouse button to kiss; release before the boss notices.
The original interface is in Japanese. Close and Restart reset the game;
minimize keeps it running in the background, and its taskbar button restores
the same session. This player requires an HTTP(S) server, such as GitHub Pages.

The header Mute/Unmute button controls this game independently of the jukebox.
The shared ../audio-control.js bridge applies the saved preference after loading
and restarting the player.
