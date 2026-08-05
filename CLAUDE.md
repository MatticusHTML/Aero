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

## Where things live in index.html

- `tracks` array (top of the `<script>` block) — one object per song:
  `{ title, artist, file, duration, note }`. `duration` is in seconds and
  only matters as a fallback timer (see below). Add/remove/reorder tracks
  here; playlist rendering, notepad text, and the taskbar label all update
  automatically.
- Optional `segments` field on a track — for long mixes/megamixes made of
  multiple songs. Array of `{ t: "H:MM:SS" or "M:SS", season, title }`, sorted
  ascending. `checkSegments()` compares elapsed playback time (real or
  simulated) against each `seg.sec` (parsed from `t` once at load) and
  retypes the notepad with the current segment once its timestamp is
  crossed, replacing the track's static `note`. The `note` still shows as
  the opening message while the track is loaded/paused.
- Player logic (`loadTrack`, `play`, `pause`, `startSimTimer`) — handles both
  real audio playback AND a simulated playback timer for tracks whose MP3
  file doesn't exist yet or fails to load. Don't remove the simulated-timer
  fallback; it's what keeps the demo functional before real audio files are
  added.
- `makeDraggable` — drag handling for both windows, disabled below a 860px
  viewport width (mobile stacks windows statically instead).
- Visualizer bars are randomized, not real frequency analysis (no Web Audio
  API hookup yet). Would be a reasonable future enhancement.

## Design system

- XP title bar blue: gradient from `#5aa6ff` → `#0c4bc0`.
- Player body: dark glossy gradient `#2c3d4f` → `#17222d`, cyan accents
  (`#8ff2e6` / `#2aa9d6`) for the visualizer and slider thumbs.
- Notepad body: plain white, monospace text (`Lucida Console`/`Courier New`),
  matches real old Notepad.
- Desktop background: blue-to-mint diagonal gradient
  (`#08356e → #0d6cb8 → #26a9db → #4fd3c4 → #a3ecc9`), soft white radial
  "bubble" highlights layered on top — deliberately not a recreation of the
  Windows "Bliss" wallpaper.
- Font: Tahoma/Verdana stack throughout (period-accurate for the XP era).

## Conventions

- Keep it a single HTML file unless there's a real reason to split it out —
  it's meant to stay simple enough to paste into one prompt for edits.
- No external dependencies, no build step. Keep it that way.
- Respects `prefers-reduced-motion` (visualizer, notepad typewriter effect,
  window shake) — preserve that when adding new animation.
