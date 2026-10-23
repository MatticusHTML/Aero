# Stick Box corner character

`corner-stickman.png` was prepared from the user's supplied leaning stickman
reference using the built-in imagegen tool with `transparent_background: true`.
It is a 970 × 1621 RGBA PNG, approximately 200 KB. The white eyes and cigarette
remain opaque; the background and spaces between limbs are transparent.

The original generated alpha is retained. Aero crops transparent padding in CSS
to the visible bounds `(250, 24)`–`(739, 1596)`, ignoring very faint stray pixels.
The planted foot meets the 40px taskbar top; the raised foot meets the right edge.
The launcher is a desktop background decoration below every app window and is
hidden while the wipeout playlist is selected. It returns with other playlists.
The cigarette smoke is part of the still image, with no extra animation work.

## Final edit prompt

Use case: background-extraction.
Asset type: transparent PNG character cutout for the bottom-right corner of a desktop website.
Input image 1 is the edit target. Remove the plain white background and excess empty margins, retaining the same black stickman, white narrowed eyes, folded arms, cigarette in his mouth with orange filter, tiny wispy smoke, and casual leaning stance. Keep the white eyes and white cigarette opaque, and make all background gaps around and between limbs transparent. Preserve the original simple bold hand-drawn black silhouette and proportions; do not redesign or add outlines, scenery, text, borders, shadows, or a taskbar.
Placement requirement: he stands on the long left leg with a flat left-pointing planted foot on the bottom boundary; his right leg stays bent casually to the right, with its foot braced against an imaginary vertical wall at the right edge. Make that raised foot the rightmost extremity of the cutout (slightly farther right than his head/arms) so it can touch the screen's right edge without clipping his head. Preserve the rest of the original pose. Tight crop around the whole character, fully visible, with only a very small transparent margin. Actual alpha transparency, not a checkerboard drawing.
