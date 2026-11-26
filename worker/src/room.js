// One Durable Object = one persistent game room (checkers + its chat).
//
// Everything that matters is saved to Durable Object storage after every
// change, so the board, the chat history and the score survive both players
// closing the site, the Worker being evicted from memory, and redeploys.
//
// Uses the WebSocket Hibernation API: Cloudflare may unload this object while
// the sockets stay open, so no state is kept only in memory. It is loaded from
// storage in the constructor.

import { SIDES, NAMES, newGame, legalMoves, applyMove, resign, other } from './checkers.js';
import { newRecord, recordHop, summaryOf, migrateLegacy } from './history.js';

const CHAT_LIMIT = 200;   // messages kept
const CHAT_MAX_LEN = 300; // characters per message

// Piece looks. Art lives in the site at assets/pieces/<id>.png. Each player
// picks their own, and the server refuses a look the opponent already has, so
// the two sides can never be confused. Dianna starts green, Matticus goth.
export const SKIN_IDS = ['emerald', 'goth', 'aqua', 'bubblegum', 'sunset', 'amethyst', 'dewdrop', 'frost', 'kiss', 'pearl'];
const DEFAULT_SKINS = { D: 'emerald', M: 'goth' };

// Chat looks. Each player has a color (#rrggbb, picked from the site's palette)
// and a font id. The server stamps the player's CURRENT style onto every chat
// message at the moment it is sent, so old messages keep the look they had.
// Font ids must match CK_FONTS in index.html.
export const FONT_IDS = ['bubbly', 'script', 'comic', 'retro', 'spooky', 'fancy', 'hand', 'serif', 'sans', 'mono'];
const HEX_COLOR = /^#[0-9a-f]{6}$/;
const DEFAULT_STYLES = {
  Dianna: { c: '#b41a7c', f: 'sans' },
  Matticus: { c: '#156791', f: 'sans' }
};

export class GameRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.game = null;
    this.chat = [];
    this.score = { D: 0, M: 0 };
    this.skins = Object.assign({}, DEFAULT_SKINS);
    this.styles = JSON.parse(JSON.stringify(DEFAULT_STYLES));
    // History: `history` = summaries of finished games, `cur` = the full record of
    // the game being played now, each finished game's record is its own key `g<n>`.
    this.history = [];
    this.cur = null;
    this.extra = {};
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.game = (await ctx.storage.get('game')) || newGame('D');
      this.chat = (await ctx.storage.get('chat')) || [];
      this.score = (await ctx.storage.get('score')) || { D: 0, M: 0 };
      this.skins = Object.assign({}, DEFAULT_SKINS, await ctx.storage.get('skins'));
      const savedStyles = (await ctx.storage.get('styles')) || {};
      Object.keys(DEFAULT_STYLES).forEach((name) => {
        this.styles[name] = Object.assign({}, DEFAULT_STYLES[name], savedStyles[name]);
      });
      const savedHistory = await ctx.storage.get('history');
      if (savedHistory === undefined) {
        // First load since history was added (or a brand new room): backfill.
        const m = migrateLegacy(this.chat, this.game, this.score);
        this.history = m.history;
        this.cur = m.cur;
        await this.save();
      } else {
        this.history = savedHistory;
        this.cur = (await ctx.storage.get('cur')) || null;
      }
    });
    if (typeof WebSocketRequestResponsePair !== 'undefined' && ctx.setWebSocketAutoResponse) {
      // Answers client keep-alive pings without waking the object.
      ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    }
  }

  // The Worker forwards the upgrade request here. Origin/user checks happen
  // in the Worker entry point; the user is re-checked defensively.
  async fetch(request) {
    await this.ready;
    const user = new URL(request.url).searchParams.get('user');
    if (!SIDES[user]) return new Response('Unknown player', { status: 400 });
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    const pair = new WebSocketPair();
    this.accept(pair[1], user);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  // Split out of fetch() so it can be exercised without a real WebSocketPair.
  accept(ws, user) {
    this.ctx.acceptWebSocket(ws, [user]);
    this.send(ws, {
      t: 'hello',
      you: user,
      state: this.publicState(),
      chat: this.chat,
      score: this.score,
      skins: this.skins,
      styles: this.styles,
      history: this.publicHistory(),
      online: this.online()
    });
    this.broadcast({ t: 'presence', online: this.online() }, ws);
  }

  async webSocketMessage(ws, raw) {
    await this.ready;
    let msg;
    try { msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); }
    catch (e) { return; }
    if (!msg || typeof msg.t !== 'string') return;

    const user = this.userOf(ws);
    if (!user) return;
    const side = SIDES[user];

    if (msg.t === 'move') {
      if (this.game.status !== 'playing') return this.fail(ws, 'The game is over. Start a rematch!');
      if (this.game.turn !== side) return this.fail(ws, 'It is not your turn.');
      if (!Number.isInteger(msg.from) || !Number.isInteger(msg.to)) return this.fail(ws, 'Bad move.');
      const continuing = this.game.chain !== null; // this hop continues a multi-jump
      const result = applyMove(this.game, msg.from, msg.to);
      if (!result.ok) return this.fail(ws, result.error);
      this.game = result.state;
      if (this.cur) recordHop(this.cur, msg.from, msg.to, continuing);
      const ended = this.game.status === 'over';
      if (ended) {
        this.score[this.game.winner] += 1;
        this.finishRecord();
        this.addChat(null, NAMES[this.game.winner] + ' wins! (' + this.game.reason + ')');
      }
      await this.save();
      this.broadcast({ t: 'state', state: this.publicState(), score: this.score });
      if (ended) this.broadcast({ t: 'history', list: this.publicHistory() });
    } else if (msg.t === 'resign') {
      if (this.game.status !== 'playing') return;
      this.game = resign(this.game, side);
      this.score[this.game.winner] += 1;
      this.finishRecord();
      this.addChat(null, user + ' resigned. ' + NAMES[this.game.winner] + ' wins!');
      await this.save();
      this.broadcast({ t: 'state', state: this.publicState(), score: this.score });
      this.broadcast({ t: 'history', list: this.publicHistory() });
    } else if (msg.t === 'rematch') {
      if (this.game.status !== 'over') return;
      // The player who did not go first last time goes first now.
      this.game = newGame(other(this.game.first));
      this.startRecord();
      this.addChat(null, 'New game! ' + NAMES[this.game.turn] + ' goes first.');
      await this.save();
      this.broadcast({ t: 'state', state: this.publicState(), score: this.score });
      this.broadcast({ t: 'history', list: this.publicHistory() });
    } else if (msg.t === 'history') {
      this.send(ws, { t: 'history', list: this.publicHistory() });
    } else if (msg.t === 'game') {
      // Full move record of one game, sent only to whoever asked.
      if (!Number.isInteger(msg.n)) return;
      let rec = null;
      if (this.cur && this.cur.n === msg.n) rec = this.cur;
      else rec = (await this.ctx.storage.get('g' + msg.n)) || null;
      this.send(ws, { t: 'game', n: msg.n, game: rec });
    } else if (msg.t === 'skin') {
      if (SKIN_IDS.indexOf(msg.skin) === -1) return this.fail(ws, 'Unknown piece style.');
      if (this.skins[other(side)] === msg.skin) {
        return this.fail(ws, NAMES[other(side)] + ' is already using that one. Pick another!');
      }
      this.skins[side] = msg.skin;
      await this.save();
      this.broadcast({ t: 'skins', skins: this.skins });
    } else if (msg.t === 'style') {
      if (typeof msg.c !== 'string' || !HEX_COLOR.test(msg.c)) return this.fail(ws, 'Unknown chat color.');
      if (FONT_IDS.indexOf(msg.f) === -1) return this.fail(ws, 'Unknown chat font.');
      this.styles[user] = { c: msg.c, f: msg.f };
      await this.save();
      this.broadcast({ t: 'styles', styles: this.styles });
    } else if (msg.t === 'chat') {
      const text = String(msg.text || '').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX_LEN);
      if (!text) return;
      this.addChat(user, text);
      await this.save();
    }
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch (e) {}
    this.broadcast({ t: 'presence', online: this.online(ws) }, ws);
  }

  async webSocketError(ws) {
    this.broadcast({ t: 'presence', online: this.online(ws) }, ws);
  }

  // ---- helpers ----

  userOf(ws) {
    const tags = this.ctx.getTags(ws);
    return tags && tags.length ? tags[0] : null;
  }

  // Which profiles currently have an open socket. `exclude` is a socket that
  // is in the middle of closing and should not count.
  online(exclude) {
    const result = { Dianna: false, Matticus: false };
    Object.keys(SIDES).forEach((name) => {
      result[name] = this.ctx.getWebSockets(name).some((s) => s !== exclude);
    });
    return result;
  }

  publicState() {
    const g = this.game;
    return {
      board: g.board,
      turn: g.turn,
      first: g.first,
      status: g.status,
      winner: g.winner,
      reason: g.reason,
      chain: g.chain,
      lastPath: g.lastPath,
      // Which recorded game this is and how many turns it has, so the history
      // list can stay current without re-sending the whole list every move.
      rec: this.cur ? this.cur.n : null,
      turns: this.cur ? this.cur.turns.length : 0,
      legal: legalMoves(g).map((m) => ({ from: m.from, to: m.to }))
    };
  }

  addChat(user, text) {
    const last = this.chat[this.chat.length - 1];
    const entry = { id: last ? last.id + 1 : 1, user: user, text: text, ts: Date.now() };
    // Snapshot of the sender's style right now (system messages have none).
    if (user && this.styles[user]) entry.s = { c: this.styles[user].c, f: this.styles[user].f };
    this.chat.push(entry);
    if (this.chat.length > CHAT_LIMIT) this.chat = this.chat.slice(-CHAT_LIMIT);
    this.broadcast({ t: 'chat', msg: entry });
  }

  // ---- history ----

  // Close the record of the game that just ended and file it away.
  finishRecord() {
    const rec = this.cur;
    if (!rec) return; // a game that began before history existed and has no record
    rec.ended = Date.now();
    rec.winner = this.game.winner;
    rec.reason = this.game.reason;
    this.extra['g' + rec.n] = rec; // each finished game is its own storage key
    this.history.push(summaryOf(rec));
    this.cur = null;
  }

  startRecord() {
    const n = this.history.reduce((max, h) => Math.max(max, h.n), 0) + 1;
    this.cur = newRecord(n, this.game.first, Date.now());
  }

  // Finished games plus the one in progress (if any), as list entries.
  publicHistory() {
    return this.history.concat(this.cur ? [summaryOf(this.cur)] : []);
  }

  async save() {
    const batch = {
      game: this.game, chat: this.chat, score: this.score, skins: this.skins, styles: this.styles,
      history: this.history, cur: this.cur
    };
    Object.assign(batch, this.extra);
    this.extra = {};
    await this.ctx.storage.put(batch);
  }

  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (e) {}
  }

  fail(ws, message) {
    this.send(ws, { t: 'error', message: message });
  }

  broadcast(obj, exclude) {
    const text = JSON.stringify(obj);
    this.ctx.getWebSockets().forEach((s) => {
      if (s === exclude && obj.t === 'presence') return;
      try { s.send(text); } catch (e) {}
    });
  }
}
