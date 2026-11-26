# Checkers sounds

Supplied by the project owner ("Aero Checkers" sound set). Renamed from the
original download names; the audio is unchanged.

| File | Original name | Used for |
|---|---|---|
| `new-match-primary.mp3` | Aero Checkers - New Match Primary (4.5 s) | New match, 90% of the time |
| `new-match-alt.mp3` | Aero Checkers - New Match (25 s) | New match, 10% of the time |
| `win-1.mp3` | Aero Checkers - Winner (12 s) | You win |
| `lose-1.mp3` | Aero Checkers - Loser (22 s) | You lose (random pick) |
| `lose-2.mp3` | Aero Checkers - Loser 2 (3.6 s) | You lose (random pick) |
| `notify-1.mp3` ... `notify-4.mp3` | Aero Checkers - Notification 1-4 | "Your turn" and "new chat message" (player picks, per event) |

All sounds play at the player's own volume (default 25%), which is stored in that
player's browser only. The result sounds (new match, win, lose) are cut off if a
new game starts.

To add more variety, put the file here and add it to `CK_RESULT_CLIPS` (random
mix, with a weight) or `CK_NOTIFY` (notification choices) in `index.html`.
