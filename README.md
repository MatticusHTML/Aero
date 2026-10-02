# Frutiger Aero Jukebox 🎧💧

A tiny nostalgic music player skinned like Windows XP, for jamming out to Frutiger Aero–style music. Draggable, minimizable, maximizable windows — a Windows Media Player–style player, a Notepad that scribbles a little note about whatever's currently playing, and four minigames (Sand Art, Falling Sand, Minesweeper, Memory Match) tucked in the Start Menu.

No build step. The desktop and original minigames live in `index.html`;
Oriental Flirting Game runs from `games/` with a bundled Ruffle Flash player.

## Oriental Flirting Game

Open **Start → Oriental Flirting Game** to play inside an XP-style window.
The game file and Ruffle 0.6.0 are hosted alongside Aero, with no external
game embed or CDN. Click the play button to start, then use the mouse to
move and hold the mouse button to flirt. Click repeatedly to compete with
a rival. The game itself retains its original Japanese interface.

Minimize pauses the game; restore resumes it. Close unloads it, so reopening
starts fresh. **Restart** also resets the game. Maximize enlarges the player.
The old online high-score service is unavailable; normal local play works.

This addition needs an HTTP(S) server, such as GitHub Pages, rather than
opening the file directly. Publish the entire `games/` folder with the site.
See [game provenance and player details](games/oriental-flirting/README.md)
for the source of the unchanged SWF and the emulator's license information.

There's also a `CLAUDE.md` with project structure and design-system notes, if you're using Claude Code (or another AI tool) to make edits.

## Adding your own tracks

1. Drop your MP3 files into the `music/` folder.
2. Open `index.html` and find the `tracks` array near the top of the `<script>` section.
3. Update each entry:

```js
{
  title: "Song Name",
  artist: "Artist Name",
  file: "music/song-name.mp3",
  duration: 210,   // seconds — used as a fallback timer if playback can't start
  note: "whatever you want the Notepad to say for this track"
}
```

If a file is missing or fails to load, the player still "plays" using a simulated timer so the whole thing stays functional — swap in real files whenever you're ready and it'll pick up real playback automatically.

### Long mixes / megamixes

For a track that's actually a stitched-together mix of many songs, add a `segments` array with a timestamp list and the notepad will auto-update to show whatever's currently playing, instead of a single static note:

```js
segments: [
  { t: "0:00", season: "Spring", title: "Song Name" },
  { t: "1:44", season: "Spring", title: "Next Song" },
  { t: "1:02:08", season: "Autumn", title: "Some Other Song" }
]
```

`t` accepts `M:SS` or `H:MM:SS`, and entries must stay in ascending order. The track's `note` still shows as the opening message until playback crosses the first timestamp.

### Desktop wallpaper per track

Add a `background` field to switch the desktop wallpaper while that track plays:

```js
background: "water"   // or "bubbles" (the default if you leave this out)
```

The two wallpapers crossfade when you change tracks. To add a third, add a new `.wallpaper[data-wallpaper="..."]` layer + CSS in `index.html` (see `CLAUDE.md`) and reference its name here.

Where to find actual royalty-free tracks that fit the vibe: Free Music Archive, Pixabay Music, and the YouTube Audio Library all have decent chillwave/downtempo/ambient stuff.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo.
2. Go to **Settings → Pages**.
3. Set Source to your main branch, root folder (or move everything into a `/docs` folder and point there instead).
4. Live at `https://<username>.github.io/<repo-name>/`.

## Notes

- A short "Welcome Dianna" splash screen plays on every load (XP-logon-style, with rising Aero bubbles), then fades into the desktop after ~2.6s — click anywhere on it to skip ahead. Change the name in `.splash-name` in `index.html`.
- Windows are draggable (click + drag the title bar) on desktop; they stack normally on mobile.
- Every window can minimize (taskbar keeps a button for it — click to restore) and maximize (fills the desktop). The player and Notepad's close (✕) button is decorative — it just shakes the window, it won't actually close; that's intentional, they're the permanent UI. The minigames' ✕ really closes them — reopen from the Start Menu.
- The Start button has a tiny menu — try "Shut Down..." — and now also launches four minigames: **Sand Art**, a colorful falling-sand drawing toy; **Falling Sand**, a multi-element physics sandbox (sand, water, fire, oil, lava, plant, acid, wall — watch them interact); **Minesweeper**, the classic Beginner-difficulty (9×9, 10 mines) grid — right-click to flag, or use the Flag Mode button on touch; and **Memory Match**, a 4×4 flip-the-pairs card game. Adding more minigames later just means copying their window/taskbar/Start-Menu pattern; see `CLAUDE.md`.
- Keep MP3 file sizes reasonable. GitHub isn't great for large audio libraries — if it grows a lot, look at Git LFS or hosting the audio files elsewhere and just pointing `file` at the URL.
