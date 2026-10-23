# Frutiger Aero Jukebox 🎧💧

A tiny nostalgic music player skinned like Windows XP, for jamming out to Frutiger Aero–style music. Draggable, minimizable, maximizable windows — a Windows Media Player–style player, a Notepad that scribbles a little note about whatever's currently playing, and four minigames (Sand Art, Falling Sand, Minesweeper, Memory Match) tucked in the Start Menu.

No build step. The desktop and original minigames live in `index.html`;
Oriental Flirting Game and Office Kissing run from `games/` with a shared,
bundled Ruffle Flash player. Penguin Diner 2 uses its locally bundled HTML5 runtime.

## Project Aero logo

The selected glossy glass **A** is used for browser tabs, bookmarks, mobile
home-screen icons, and link-preview metadata. Root `favicon.ico` contains
multiple small sizes; PNG exports live in `assets/branding/`. The 512px
`project-aero.png` is the sharing/logo asset. Generation notes and the original
prompt are in `assets/branding/README.md`. Update the absolute preview-image
URLs in the page head if the website moves to another address.

## Stick Box entrance

Stick Box is now a separate website project. Its full site and preservation
archive were moved out of Aero into the user's **Stickbox Prep** folder for a
new repository. Aero retains only the corner character, invitation and
external link; its own games and Ruffle runtime remain here.

The character assets live in `assets/stickbox/`. Windows cover him normally,
and he hides while wipeout! is selected, including when paused. Clicking him
opens an invitation; Escape, Stay, and the backdrop dismiss it.

`STICKBOX_URL` in `index.html` points to <https://matticushtml.github.io/Stickbox/>.
The invitation's Enter Stick Box link opens that independent site in the same tab.
Stick Box already links back to <https://matticushtml.github.io/Aero/>.

Moving working files does not remove archive copies from older Git commits.
Git history was preserved; any history-size cleanup is separate work.

## wipeout!

Select **wipeout!** in the music player to shuffle ten songs by The Neighbourhood
streamed from Cloudflare R2. Each cycle plays every song once, with no immediate
repeat between cycles. Next/Previous navigate songs within the mix; select either
other playlist entry to switch mixes. The current song appears beneath the mix
title and in Notepad. Seeking and duration apply to the current song.

The mix uses `wallpapers/palm-sunset.png` with two subtle CSS smoke layers that
animate only transforms and opacity. Smoke pauses when another wallpaper is
selected or the tab is hidden, and stays still with reduced motion enabled.

The song manifest is the `tracks.push` block in `index.html`. R2's public endpoint
does not list files, so add each future upload's exact filename and display title
there. The current `r2.dev` base URL is for development and is rate-limited;
replace it with an R2 custom domain for production. Failed streams show an error
in Notepad instead of simulating music playback.

## Penguin Diner 2

Open **Start → Penguin Diner 2**. Seat customers, take orders, serve food and
collect tips. The HTML5 game and all its assets are hosted directly on Aero.
Progress is saved in your browser. See [source and asset details](games/penguin-diner-2/README.md).

All three games with audio have **Mute/Unmute** buttons beside their controls.
Each setting is remembered independently and leaves the jukebox music untouched.
Minimize keeps games running; their taskbar buttons restore the same session.

## Office Kissing

Open **Start → Office Kissing**, click Play, then start the game. Hold the
left mouse button to kiss, and release before the boss notices. The original
Japanese Flash game is downloaded from the file used by CrazyGames and
hosted directly on Aero. It shares the local Ruffle 0.6.0 player with Oriental
Flirting Game, so it needs no external game embed or CDN.

Minimize keeps it running in the background; click its taskbar button to restore.
Close and **Restart** start a fresh game. Maximize enlarges the player. See the [game's source details](games/office-kissing/README.md).

### Office Kissing English — WIP (paused)

The [English duplicate](games/office-kissing-english/README.md) is unfinished
and paused until further notice. Its assets are preserved, and its page shows
a WIP notice. The original Office Kissing remains playable from the Start Menu.

## Oriental Flirting Game

Open **Start → Oriental Flirting Game** to play inside an XP-style window.
The game file and Ruffle 0.6.0 are hosted alongside Aero, with no external
game embed or CDN. Click the play button to start, then use the mouse to
move and hold the mouse button to flirt. Click repeatedly to compete with
a rival. The game itself retains its original Japanese interface.

Minimize keeps the game running; its taskbar button restores the same session.
Close unloads it, so reopening starts fresh. **Restart** also resets the game. Maximize enlarges the player.
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
background: "water"   // zen garden; "bubbles" is the default, or use "wipeout"
```

The three wallpapers crossfade when you change tracks. The relaxing water mix
uses a mossy zen garden with a small waterfall and clear stream. Its optimized
`wallpapers/zen-garden.webp` artwork is about 553 KB; lightweight SVG/CSS adds
flowing highlights, ripples and soft mist. The animation pauses when another mix
is selected or the page is hidden, and becomes still with reduced motion enabled.
The artwork and effects crop together to keep the waterfall visible on phones.

To add another wallpaper, add a `.wallpaper[data-wallpaper="..."]` layer + CSS
in `index.html` (see `CLAUDE.md`) and reference its name here.

Where to find actual royalty-free tracks that fit the vibe: Free Music Archive, Pixabay Music, and the YouTube Audio Library all have decent chillwave/downtempo/ambient stuff.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo.
2. Go to **Settings → Pages**.
3. Set Source to your main branch, root folder (or move everything into a `/docs` folder and point there instead).
4. Live at `https://<username>.github.io/<repo-name>/`.

## Notes

- A short "Welcome Dianna" splash screen plays on every load (XP-logon-style, with rising Aero bubbles), then fades into the desktop after ~2.6s — click anywhere on it to skip ahead. Change the name in `.splash-name` in `index.html`.
- After the splash, a little CSS stickman jogs along the top of the taskbar, stops to wave with "Have fun Dianna!", then runs off left. It plays once per page load; reduced-motion settings show a still greeting instead.
- Windows are draggable (click + drag the title bar) on desktop; they stack normally on mobile.
- Every window can minimize (taskbar keeps a button for it — click to restore) and maximize (fills the desktop). The player and Notepad's close (✕) button is decorative — it just shakes the window, it won't actually close; that's intentional, they're the permanent UI. The minigames' ✕ really closes them — reopen from the Start Menu.
- The Start button has a tiny menu — try "Shut Down..." — and now also launches four minigames: **Sand Art**, a colorful falling-sand drawing toy; **Falling Sand**, a multi-element physics sandbox (sand, water, fire, oil, lava, plant, acid, wall — watch them interact); **Minesweeper**, the classic Beginner-difficulty (9×9, 10 mines) grid — right-click to flag, or use the Flag Mode button on touch; and **Memory Match**, a 4×4 flip-the-pairs card game. Adding more minigames later just means copying their window/taskbar/Start-Menu pattern; see `CLAUDE.md`.
- Keep MP3 file sizes reasonable. GitHub isn't great for large audio libraries — if it grows a lot, look at Git LFS or hosting the audio files elsewhere and just pointing `file` at the URL.
