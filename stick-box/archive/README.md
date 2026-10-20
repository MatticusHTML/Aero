# Stick Box: Stick Fights archive

Archived October 20, 2026 from the public files linked on the
[Stick Fights index](https://www.stickpage.com/stickfights.shtml).

The initial two collections were:

- [Killing Spree](https://www.stickpage.com/killingspreeseries.shtml): Killing Spree,
  2, 3, 4A, 4B, 5, 6. Creator credited on Stickpage: Master Samus.
- [Shock](https://www.stickpage.com/shockseries.shtml): Shock, Shock 2, Shock 3
  by Terkoiz (Philips Lacanlale); Shock More by David "Geo" Borja; Shock Tribute
  by Jcamelo.

The expanded catalog covers all 19 index collections and preserves 266 unique
SWFs totaling 1,694,169,425 bytes. They are stored unchanged alongside
their available original wide JPEG thumbnails (239 saved; 27 unavailable).
`../catalog.json` records each title,
creator, description, original page and download URLs, local paths, byte count,
SHA-256, and SWF dimensions/version/frame rate. Ordering follows the source series
pages, including the separate 4A/4B parts and the two Shock tributes.
`fights-inventory.json` records all 270 distinct source listings. Titles shared
by collections reuse the same file, and the watch URL includes a collection ID
to preserve its episode order.

`stageBackground` records the original SWF's SetBackgroundColor tag (or `null`
when none is present). The player uses `backgroundColor: null` so each movie
renders its own stage colors, including changes during playback. Dark site
styling applies only outside the movie. Do not replace authored backgrounds with
a dark-mode color: black figures in Shock depend on their original light stage.

`sources/*.html.txt` are unexecuted snapshots of the series, title, and playback
pages. They are for provenance, not embedded into Stick Box. Titles/descriptions
are rendered as text. Creator spelling and descriptions follow the source.
`import-errors.json` records the four sources that could not be downloaded:
The Forgotten Legion 2 and ASSAILANT return HTTP 403, SE Montage 3 supplies a
YouTube embed rather than an original SWF, and Nero 1's linked source page
no longer supplies its player/download. The current library retains all four
listings. Cached official playback-page links recovered Stick Dude Killing
Arena and A Nice Day to Die despite their empty current title pages.

`dependency-audit.json` records confirmed SWFs that are only launchers for
YouTube's retired Flash API. Those original files are preserved, but their
catalog records carry `playbackStatus: external-video`. Their watch pages explain
the dependency and link to the original external video. The video itself has
not been downloaded or converted.

## Playback

Open Stick Box through an HTTP(S) server and choose an episode. `watch.html`
loads one file through the repository's pinned Ruffle 0.6.0 bundle. The new
controls suspend/resume the whole Flash runtime, set its master volume, restart
the original, and offer fullscreen. Some SWFs retain their own Start buttons,
credits, loading screens, and episode links. External networking, script access,
and outbound links from the SWFs are disabled; use Stick Box's episode links.

The initial 12 entries were browser-checked for loading and play/pause, followed
by 19 representative loading/play/pause checks spanning all 18 collections
with saved files, including both ZWS originals. Search, collection navigation,
external-launcher messaging, volume/mute, and mobile layout were also checked.
Archive verification
checks every preserved file's hash, size, and authored background color. This is
not a claim that every frame, ending, or optional feature has been watched or
fully verified. No MP4 conversions or content edits were made.

## Reproduce the import

Run `python -B stick-box/tools/expand_fights.py` from the repository root, then
`python -B stick-box/tools/audit_dependencies.py --write`. Use `--inventory` to
inspect listings without media downloads, or `--retry-missing` to retry only
unresolved entries. These tools use Python's standard library and the importer
requires network access. It is limited to the Fights index's collections and
Stickpage's page/file/image hosts, with four download workers. It reuses
saved page snapshots and existing files, checks SWF signatures/decompressed
sizes, and refuses to replace a file whose hash differs from the saved catalog.
Review metadata and file changes before committing a refreshed catalog.
The original `import_series.py` remains available for refreshing Killing Spree
and Shock while retaining unrelated collections. Parsing supports FWS, CWS, and
ZWS (LZMA) originals, including authored stage background metadata.

Run `python stick-box/tools/verify_archive.py` to check all file hashes, byte
counts, thumbnails, and source snapshots without making network requests.
It also verifies recorded stage background colors against the original files.
Run `python -B stick-box/tools/test_swf_metadata.py` for the background parser's
regression tests, including white, black, gray, missing, and truncated color tags.

These works remain attributed to their original creators. Stick Box is an
independent tribute, not the official Stickpage website.
