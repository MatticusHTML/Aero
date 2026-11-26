# Chat fonts

Seven open-source fonts for the Checkers chat style picker. They were downloaded
from the official Google Fonts repository (https://github.com/google/fonts, `ofl/`
folder) and are licensed under the **SIL Open Font License 1.1**. Each font's
license text is included here as `OFL-<name>.txt`. The font files are unmodified.

| File | Font | Chat style name |
|---|---|---|
| `fredoka.ttf` | Fredoka (variable) | Bubbly |
| `pacifico.ttf` | Pacifico | Surf Script |
| `bangers.ttf` | Bangers | Comic Book |
| `press-start-2p.ttf` | Press Start 2P | Retro Arcade |
| `creepster.ttf` | Creepster | Spooky |
| `lobster.ttf` | Lobster | Fancy Script |
| `caveat.ttf` | Caveat (variable) | Handwritten |

`index.html` declares them as `CK ...` `@font-face` families. The browser only
downloads a font when a chat message or the style picker actually uses it. The
three classic styles (Georgia, Verdana, Courier New) are system fonts and need no
files. To add a style: drop the font here, add an `@font-face`, then add its id to
`CK_FONTS` in `index.html` and `FONT_IDS` in `worker/src/room.js`.
