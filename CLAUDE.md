# CLAUDE.md

Context for Claude Code (or any AI assistant) working on this project.

## What this is

A single-page nostalgic music player: Windows XP–style window chrome, a Windows
Media Player–style player, and a Notepad window that types out a note for
whatever track is playing. Frutiger Aero–style glossy desktop background.
Static site, no build step, deploys straight to GitHub Pages.

## Files

- `index.html` — the entire site. CSS in `<style>`, JS in `<script>` (one IIFE
  at the bottom of the file).
- `music/` — drop MP3 files here.
- `README.md` — human-facing setup/deploy instructions.

## Splash screen

`#splash-screen` — a full-viewport overlay (`z-index:2000`, above everything
else including the taskbar/start menu) shown on every load: an XP-logon-style
"Welcome Dianna" over a dark blue radial gradient, with `.splash-bubble`
divs rising and fading via the `splashRise` keyframe (reuses the same
radial-gradient "soft bubble" look as the desktop wallpaper's `.bubble`, just
bigger/slower). Auto-dismisses via `setTimeout(dismissSplash, 2600)` near the
end of the script — fades out (`.fade-out`, `opacity` transition, and
`pointer-events:none` so clicks pass through immediately even mid-fade), then
`display:none` (`.hidden`) once the transition's done. Also dismissible early
by clicking anywhere on it. Respects `prefers-reduced-motion`: bubbles/text/
loader-dots skip their entrance animations and the fade transition is
instant, and the whole thing is shorter (900ms) rather than skipped outright,
so reduced-motion users still get the "Welcome" moment without the motion.
The name is a plain hardcoded string in `.splash-name` (same pattern as the
Start Menu's `.start-menu-header` "Matticus") — change it there if needed.

## Where things live in index.html

- `tracks` array (top of the `<script>` block) — one object per song:
  `{ title, artist, file, duration, note }`. `duration` is in seconds and
  only matters as a fallback timer (see below). Add/remove/reorder tracks
  here; playlist rendering, notepad text, and the taskbar label all update
  automatically.
- Optional `segments` field on a track — for long mixes/megamixes made of
  multiple songs. Array of `{ t: "H:MM:SS" or "M:SS", season, title }`, sorted
  ascending. `season` is optional decoration (shown as a `[Bracketed]` line
  above the title) — omit it for mixes with no natural grouping.
  `checkSegments()` compares elapsed playback time (real or
  simulated) against each `seg.sec` (parsed from `t` once at load) to find
  which segment's range the current position falls in, and sets the notepad
  text directly (no typewriter animation) whenever that range changes,
  replacing the track's static `note`. It's a direct set rather than
  `typeNotepad()` on purpose — segment changes can fire in a burst while
  scrubbing/seeking, and restarting a char-by-char animation on every one of
  those made the notepad look stuck mid-type. The `note` still shows as the
  opening message (with the typewriter effect) while the track is loaded/paused.
- Optional `background` field on a track — picks the desktop wallpaper for
  that track: `"bubbles"` (default if omitted) or `"water"`. `loadTrack()`
  calls `setWallpaper(track.background || 'bubbles')`, which toggles an
  `active` class across the `.wallpaper` layers (matched by `data-wallpaper`)
  in `#desktop`. Both layers are always in the DOM, stacked with `z-index:-1`
  and crossfaded via opacity transition — add a new wallpaper by adding
  another `.wallpaper[data-wallpaper="..."]` div plus its CSS, no JS changes
  needed beyond tagging the track.
- Player logic (`loadTrack`, `play`, `pause`, `startSimTimer`) — handles both
  real audio playback AND a simulated playback timer for tracks whose MP3
  file doesn't exist yet or fails to load. Don't remove the simulated-timer
  fallback; it's what keeps the demo functional before real audio files are
  added.
- `makeDraggable` — drag handling for all windows, disabled below a 860px
  viewport width (mobile stacks windows statically instead) and while a
  window is `.maximized`.
- Visualizer bars are randomized, not real frequency analysis (no Web Audio
  API hookup yet). Would be a reasonable future enhancement.

## Window chrome (minimize / maximize / close)

Every `.window` (player, notepad, Sand Art, and any future one) shares the
same chrome logic, driven by `windowTaskbarPairs` — an array of
`{ win, btn }` pairing each window element to its taskbar button:

- **Minimize** (`.min`): adds `.minimized` (`display:none` via CSS). The
  taskbar button stays visible; clicking it restores the window.
- **Maximize** (`.max`): toggles `.maximized` (fills the desktop via
  `position:fixed`, CSS `!important`) and swaps the button glyph between
  `□` and `❐`. `.player-body`/`.sandart-body`, `.playlist`, and
  `.notepad-text` get `flex:1` under `.maximized` so they actually grow to
  fill the extra space rather than leaving it blank. Neutralized on mobile
  (`@media max-width:860px`) since windows are already static/full-width there.
- **Close** (`.close`): checks `data-closable="true"` on the window.
  - Absent (player, notepad) — the X is **decorative only**: shakes the
    window (`.shake`), nothing closes. This is intentional — don't wire up a
    real close for these two; they're the permanent core UI.
  - Present (Sand Art, future minigames) — a real close: adds `.closed`
    (`display:none`) and hides the window's taskbar button until it's
    reopened from the Start Menu.
- **Taskbar click** replicates real XP behavior: closed → open; minimized →
  restore; focused → minimize; unfocused-but-open → just focus. This all
  routes through `bringToFront()` → `updateTaskbarActiveStates()`, which
  keeps `.task-item.active` in sync with whichever window is actually
  focused/visible.
- `openWindow(win, btn)` is the one function that both opens a closed app
  and un-minimizes an already-open one — use it for both taskbar buttons and
  Start Menu items rather than calling `bringToFront` directly, so closed
  apps launch correctly from either place.

## Adding a minigame to the Start Menu

Sand Art (`#sandart-window`) is the template — copy its pattern for the next
one:

1. A `.window.closed` div with `data-closable="true"` (so its X actually
   closes it), placed inside `#desktop` alongside the other windows.
2. A taskbar button (`.task-item`, `style="display:none"` initially) added
   to `.taskbar-items`.
3. A `.start-menu-item` in `#start-menu` whose click handler calls
   `openWindow(theWindowEl, theTaskbarBtn)`.
4. Add the `{ win, btn }` pair to `windowTaskbarPairs` so minimize/maximize/
   taskbar-sync all work automatically — no per-window logic needed beyond that.
5. Because the window starts `display:none` (`.closed`), any `<canvas>`
   inside it should use a **fixed backing resolution** set directly via
   `canvas.width`/`canvas.height` (this works even while hidden) and scale
   visually with CSS `width:100%; height:100%` — don't depend on
   `getBoundingClientRect()` at setup time, only inside pointer-event
   handlers (which can't fire while hidden anyway).

### Sand Art specifics

A from-scratch falling-sand toy (inspired by sandart.app, redrawn rather
than copied — the exact "Din"/"Hybrid Genesis" pattern presets from that
site aren't reproduced, only its Color/Gradient paint-type concept and its
72-swatch color grid, which was captured verbatim for authenticity).

- `SA_COLS`/`SA_ROWS` (176×118) — fixed grid resolution, decoupled from
  display size on purpose (see point 5 above).
- `saGrid` — `Int32Array`, one packed `0xRRGGBB` int per cell, `-1` = empty.
- `saStep()` — classic cellular automaton: each occupied cell falls straight
  down if empty below, else slides diagonally left/right if either is open.
  Scan direction (`flipDir`) alternates every frame to avoid a directional
  drift bias.
- `saRender()` — writes the whole grid into one `ImageData` and
  `putImageData`s it in one call, rather than per-cell `fillRect`, so frame
  cost stays flat regardless of how much sand is on screen.
- `saLoop()` is a standard `requestAnimationFrame` self-scheduling loop,
  gated by `isWindowHidden()` at the top of each frame — it stops
  rescheduling (and `saLoopRunning = false`) the moment the window is
  minimized or closed, and `saStartLoopIfNeeded()` (called from
  `updateTaskbarActiveStates()` whenever the window is visible) restarts it.
  This means the simulation doesn't run while you can't see it.
- Paint modes: `color` (flat hex from the swatch grid) or `gradient`
  (position-based interpolation across a named preset's stops, keyed by the
  grain's spawn X coordinate — creates vertical colored streaks as you draw,
  like a sand-art bottle). Both are plain hand-authored presets in
  `SA_GRADIENTS`, not reverse-engineered from the reference site.
- Undo/redo snapshot the whole `saGrid` (`Int32Array.slice()`) on
  `pointerdown`/Reset — capped at `SA_UNDO_LIMIT` (20) — rather than diffing,
  since the grid is small enough that full snapshots are cheap.

### Falling Sand specifics

A from-scratch multi-element falling-sand toy (`#fallingsand-window`,
`fs`-prefixed functions/vars) — same window/canvas architecture as Sand Art,
but a `Uint8Array` of element-type IDs instead of packed colors, since each
cell needs *behavior* as well as color. Inspired by the general, decades-old
"falling sand game" genre (sand/water/fire/lava/oil are standard tropes
across many implementations of it, not exclusive to any one site) — the
ruleset, probabilities, colors, and all code here are original, not ported
from any reference.

- `FS_COLS`/`FS_ROWS` (176×118), `fsGrid` (`Uint8Array`, element ID per
  cell, `FS_EMPTY`=0) + `fsLife` (`Uint8Array`, spare per-cell counter used
  by Fire's remaining lifespan — otherwise unused).
- `fsStep()` shares Sand Art's bottom-to-top / alternating-scan-direction
  pass, but movement is now density-driven instead of single-material:
  `fsDensity()` ranks Sand(4) > Lava(3) > Water/Acid(2) > Oil(1), and any
  cell falls into a lower-density liquid directly below it (they swap — this
  is what makes sand sink through water, and oil float up through it).
  Fluids (water/oil/lava/acid) that can't fall or slide diagonally also try
  to spread sideways into an empty neighbor — sand doesn't, so it piles
  instead of puddling. Wall and Plant are immovable; Fire is handled
  entirely separately (see below).
- Element-specific reactions, checked after normal movement:
  `fsStepLava` turns itself + an adjacent Water into Wall (solidifies), and
  has a chance to ignite adjacent Oil/Plant into Fire. `fsStepAcid` has a
  chance to dissolve an adjacent Sand/Wall/Plant into Empty — and is
  consumed itself when it does, so it doesn't dissolve forever.
  `fsStepFire` (called instead of the generic movement block) decrements
  `fsLife` each frame until it burns out to Empty, occasionally hops one
  cell up into empty space for a flicker effect, and has a chance to ignite
  adjacent Oil/Plant. `fsStepPlant` (also called instead of generic
  movement, since Plant is static) has a small chance to grow into an empty
  neighbor if touching Water, and catches Fire from a burning neighbor.
- The element toolbar (`FS_ELEMENTS`) is rendered into `#fs-toolbar` by JS,
  not hand-written per button, so adding a new element is just one more
  entry in that array (`{ id, name, color }`) plus its case in
  `fsColorFor()` and any reaction logic it needs.
- Same `requestAnimationFrame` + `isWindowHidden()` gating pattern as Sand
  Art (`fsLoop`/`fsStartLoopIfNeeded`, wired into `updateTaskbarActiveStates()`).
- No undo/redo here (unlike Sand Art) — a continuously-evolving multi-material
  simulation doesn't have a clean single "stroke" boundary to snapshot
  around, so it's just Clear.

### Minesweeper specifics

Classic Beginner-difficulty ruleset (`#minesweeper-window`, `ms`-prefixed):
`MS_COLS`/`MS_ROWS` = 9×9, `MS_MINES` = 10. Unlike Sand Art/Falling Sand,
this is event-driven, not a `requestAnimationFrame` loop — 81 real
`<button>` cells built once by `msNewGame()`, each with its own click/
`contextmenu` listener closed over its index.

- Mines are placed on the **first click**, not at game start (`msPlaceMines`
  excludes the clicked cell and its 8 neighbors), so you can never lose on
  your first move and usually get a decent opening.
- `msReveal()` is a recursive flood fill: a revealed cell with `count === 0`
  reveals all its neighbors too, which is what produces the classic
  cascading-open-area effect. 81 cells max, so recursion depth is a
  non-issue.
- Right-click (`contextmenu`, default prevented) toggles a flag. Since
  right-click doesn't exist on touch, `#ms-flag-mode` is a toggle button
  that makes left-click flag instead of reveal — needed for the game to be
  playable on mobile at all.
- The mine counter and timer are plain styled `<div>`s (`.ms-display`,
  red-on-black monospace), not real 7-segment graphics — `msFormatCounter()`
  handles the sign so a counter that goes negative (over-flagged) still
  reads sensibly, e.g. `-01`.
- Numbers 1–8 use the traditional Minesweeper color-per-number convention
  (`.ms-cell.n1`…`.n8`) — that color mapping is a decades-old genre
  convention across essentially every clone, not any single implementation's
  IP.

### Memory Match specifics

A from-scratch Concentration/pairs game (`#memorymatch-window`,
`mm`-prefixed). 4×4 grid, `MM_SYMBOLS` (8 emoji) each duplicated and
shuffled (`mmShuffle`, Fisher–Yates) into 16 `.mm-card` buttons.

- Each card is a real 3D flip (`.mm-card-inner` with `transform-style:
  preserve-3d`, `rotateY(180deg)` on `.flipped`/`.matched`), not a
  show/hide swap — `.mm-card-front`/`.mm-card-back` use
  `backface-visibility:hidden` so only one face is ever visible at a time.
- `mmFlip()` allows at most 2 cards face-up at once (`mmFlippedIdx`). On the
  2nd flip it increments the move counter and locks input (`mmLocked`) so
  you can't flip a 3rd card mid-check; on a match both cards get `.matched`
  (stay face-up, unclickable) and unlock immediately, on a mismatch both
  flip back after a 700ms `setTimeout` so you have time to actually see
  what you got wrong.
- No `prefers-reduced-motion` special-case needed here — the flip is a
  short, contained transform on a single small element, not the kind of
  large/parallax motion that convention is meant to guard against.

## Design system

- XP title bar blue: gradient from `#5aa6ff` → `#0c4bc0`.
- Player body: dark glossy gradient `#2c3d4f` → `#17222d`, cyan accents
  (`#8ff2e6` / `#2aa9d6`) for the visualizer and slider thumbs.
- Notepad body: plain white, monospace text (`Lucida Console`/`Courier New`),
  matches real old Notepad.
- Desktop background: two wallpapers, swapped per track (see `background`
  field above). `"bubbles"` — blue-to-mint diagonal gradient
  (`#08356e → #0d6cb8 → #26a9db → #4fd3c4 → #a3ecc9`) with soft white radial
  "bubble" highlights floating on top — deliberately not a recreation of the
  Windows "Bliss" wallpaper. `"water"` — deep blue-to-aqua gradient with
  slowly animated diagonal current bands (`waterFlow` keyframes) and drifting
  `.shimmer` highlights, for tracks with water/ambient vibes.
- Font: Tahoma/Verdana stack throughout (period-accurate for the XP era).

## Conventions

- Keep it a single HTML file unless there's a real reason to split it out —
  it's meant to stay simple enough to paste into one prompt for edits.
- No external dependencies, no build step. Keep it that way.
- Respects `prefers-reduced-motion` (visualizer, notepad typewriter effect,
  window shake) — preserve that when adding new animation.
