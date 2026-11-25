# Checkers piece art

Ten Frutiger Aero–style piece skins for the Checkers window. Generated with
OpenAI's `gpt-image-1.5` image model (transparent background, 1024px, medium
quality) from a shared base prompt plus one material line per piece, then
trimmed to a clean circle and shrunk to 128×128 PNG with Pillow. Each is ~25 KB.

Base prompt: a single round checkers piece seen from directly above, a perfectly
circular glossy glass disc in the Frutiger Aero / Windows Vista style, with a
bright curved specular highlight, soft inner glow and a slightly beveled rim;
centered, crisp edge, transparent background, no text, no cast shadow.

| File | Look |
|---|---|
| `emerald.png` | Translucent emerald-green glass (Dianna's default) |
| `goth.png` | Jet-black obsidian with a silver gothic filigree ring and bat-wing cross (Matticus's default) |
| `aqua.png` | Aqua-cyan water bubble |
| `bubblegum.png` | Hot-pink candy glass |
| `sunset.png` | Orange-to-gold sun orb |
| `amethyst.png` | Purple crystal glass |
| `dewdrop.png` | Near-clear water droplet |
| `frost.png` | Icy blue with an etched snowflake |
| `kiss.png` | Glossy red disc with a classic kiss-mark lips icon |
| `pearl.png` | Iridescent pearl |

The ids must match `SKIN_IDS` in `worker/src/room.js` and `CK_SKINS` in
`index.html`. Kings are drawn by the page as a gold ♛ on top of whichever skin
is in use, so no separate king art is needed. To add a skin: drop a 128×128
transparent PNG here and add its id/name to both lists.
