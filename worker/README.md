# Aero games relay (Cloudflare Worker)

A tiny Worker that lets Dianna and Matticus play checkers (with chat) against
each other from their own browsers. The site itself stays a static GitHub Pages
page; this is the one small server-side piece it needs.

## How it works

- Each browser opens a WebSocket to `/ws/checkers?user=Dianna` (or `Matticus`).
- One **Durable Object** (`GameRoom`, `src/room.js`) is the single source of
  truth: it enforces the rules (`src/checkers.js`), whose turn it is, chat, and
  the win tally, then broadcasts every change to both players.
- After every change it saves the board, chat history (last 200 messages) and
  score to Durable Object storage. Closing the site, going offline, or the
  Worker being unloaded loses nothing. The game is exactly where you left it.
- Every game is recorded turn by turn as plain numbers (`src/history.js`), about
  650 bytes a game, each finished game under its own storage key, so the site's
  History window can replay any of them. Games from before this existed are listed
  winner-only.
- It also remembers each player's piece skin and chat style (color + font), and
  stamps the sender's style onto every chat message when it is sent, so chat
  history keeps the look each message had. Sound settings are NOT stored here;
  they live in each player's own browser.
- Only requests from `https://matticushtml.github.io` (and `localhost` /
  `127.0.0.1` for testing) are accepted. This is a courtesy lock, not real
  security: the profile screen on the site is cosmetic.

## Deploy (one time)

1. Install Node.js (the LTS version) from https://nodejs.org.
2. In a terminal:

   ```powershell
   cd worker
   npm install
   npx wrangler login      # opens a browser to sign in to Cloudflare
   npx wrangler deploy
   ```

3. Wrangler prints the Worker's address, like
   `https://aero-games.<your-subdomain>.workers.dev`. Open `index.html`, find
   `CK_WS_BASE`, and set it to the same address with `wss://` instead of
   `https://`:

   ```js
   var CK_WS_BASE = 'wss://aero-games.<your-subdomain>.workers.dev';
   ```

4. Commit and push. Both players open Start Menu -> Checkers.

Sanity check: visiting the Worker's address in a browser should say
"Aero games relay is up."

## Local testing

`npx wrangler dev` runs the Worker (with a real local Durable Object) on
`http://localhost:8787`. Point the site at it without editing code by running
this in the browser console on a locally served copy of the site:

```js
localStorage.setItem('aero-games-url', 'ws://localhost:8787')
```

Remove it with `localStorage.removeItem('aero-games-url')`.

## Notes

- Durable Objects on the free plan must be SQLite-backed, hence
  `new_sqlite_classes` in `wrangler.toml`.
- To start a totally fresh game and chat, change the room name in
  `src/index.js` (`idFromName('checkers')`) or delete the object via a new
  migration. Normally just use Rematch in the game.
- `src/checkers.js` has no imports and no Cloudflare APIs, so it can be unit
  tested anywhere.
