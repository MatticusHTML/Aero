# Stick Box: first preserved series

Archived October 20, 2026 from the public files linked on these series pages:

- [Killing Spree](https://www.stickpage.com/killingspreeseries.shtml): Killing Spree,
  2, 3, 4A, 4B, 5, 6. Creator credited on Stickpage: Master Samus.
- [Shock](https://www.stickpage.com/shockseries.shtml): Shock, Shock 2, Shock 3
  by Terkoiz (Philips Lacanlale); Shock More by David "Geo" Borja; Shock Tribute
  by Jcamelo.

The 12 original SWFs total 60,539,573 bytes. They are stored unchanged alongside
their original wide JPEG thumbnails. `../catalog.json` records each title,
creator, description, original page and download URLs, local paths, byte count,
SHA-256, and SWF dimensions/version/frame rate. Ordering follows the source series
pages, including the separate 4A/4B parts and the two Shock tributes.

`stageBackground` records the original SWF's SetBackgroundColor tag (or `null`
when none is present). The player uses `backgroundColor: null` so each movie
renders its own stage colors, including changes during playback. Dark site
styling applies only outside the movie. Do not replace authored backgrounds with
a dark-mode color: black figures in Shock depend on their original light stage.

`sources/*.html.txt` are unexecuted snapshots of the series, title, and playback
pages. They are for provenance, not embedded into Stick Box. Titles/descriptions
are rendered as text. Creator spelling and descriptions follow the source.
`import-errors.json` records download failures (currently empty).

## Playback

Open Stick Box through an HTTP(S) server and choose an episode. `watch.html`
loads one file through the repository's pinned Ruffle 0.6.0 bundle. The new
controls suspend/resume the whole Flash runtime, set its master volume, restart
the original, and offer fullscreen. Some SWFs retain their own Start buttons,
credits, loading screens, and episode links. External networking, script access,
and outbound links from the SWFs are disabled; use Stick Box's episode links.

All 12 entries were browser-checked for successful loading and play/pause
control. This is not a claim that every frame, ending, or optional feature has
been watched or fully verified. No MP4 conversions or content edits were made.

## Reproduce the import

Run `python stick-box/tools/import_series.py` from the repository root. This
uses only Python's standard library and requires network access. The importer
is limited to these two series and Stickpage's page/file/image hosts. It reuses
saved page snapshots and existing files, checks SWF signatures/decompressed
sizes, and refuses to replace a file whose hash differs from the saved catalog.
Review metadata and file changes before committing a refreshed catalog.

Run `python stick-box/tools/verify_archive.py` to check all file hashes, byte
counts, thumbnails, and source snapshots without making network requests.
It also verifies recorded stage background colors against the original files.
Run `python -B stick-box/tools/test_swf_metadata.py` for the background parser's
regression tests, including white, black, gray, missing, and truncated color tags.

These works remain attributed to their original creators. Stick Box is an
independent tribute, not the official Stickpage website.
