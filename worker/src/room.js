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

const CHAT_LIMIT = 200;   // messages kept
const CHAT_MAX_LEN = 300; // characters per message

// Piece looks. Art lives in the site at assets/pieces/<id>.png. Each player
// picks their own, and the server refuses a look the opponent already has, so
// the two sides can never be confused. Dianna starts green, Matticus goth.
export const SKIN_IDS = ['emerald', 'goth', 'aqua', 'bubblegum', 'sunset', 'amethyst', 'dewdrop', 'frost', 'kiss', 'pearl'];
const DEFAULT_SKINS = { D: 'emerald', M: 'goth' };

export class GameRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.game = null;
    this.chat = [];
    this.score = { D: 0, M: 0 };
    this.skins = Object.assign({}, DEFAULT_SKINS);
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.game = (await ctx.storage.get('game')) || newGame('D');
      this.chat = (await ctx.storage.get('chat')) || [];
      this.score = (await ctx.storage.get('score')) || { D: 0, M: 0 };
      this.skins = Object.assign({}, DEFAULT_SKINS, await ctx.storage.get('skins'));
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
      const result = applyMove(this.game, msg.from, msg.to);
      if (!result.ok) return this.fail(ws, result.error);
      this.game = result.state;
      if (this.game.status === 'over') {
        this.score[this.game.winner] += 1;
        this.addChat(null, NAMES[this.game.winner] + ' wins! (' + this.game.reason + ')');
      }
      await this.save();
      this.broadcast({ t: 'state', state: this.publicState(), score: this.score });
    } else if (msg.t === 'resign') {
      if (this.game.status !== 'playing') return;
      this.game = resign(this.game, side);
      this.score[this.game.winner] += 1;
      this.addChat(null, user + ' resigned. ' + NAMES[this.game.winner] + ' wins!');
      await this.save();
      this.broadcast({ t: 'state', state: this.publicState(), score: this.score });
    } else if (msg.t === 'rematch') {
      if (this.game.status !== 'over') return;
      // The player who did not go first last time goes first now.
      this.game = newGame(other(this.game.first));
      this.addChat(null, 'New game! ' + NAMES[this.game.turn] + ' goes first.');
      await this.save();
      this.broadcast({ t: 'state', state: this.publicState(), score: this.score });
    } else if (msg.t === 'skin') {
      if (SKIN_IDS.indexOf(msg.skin) === -1) return this.fail(ws, 'Unknown piece style.');
      if (this.skins[other(side)] === msg.skin) {
        return this.fail(ws, NAMES[other(side)] + ' is already using that one. Pick another!');
      }
      this.skins[side] = msg.skin;
      await this.save();
      this.broadcast({ t: 'skins', skins: this.skins });
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
      legal: legalMoves(g).map((m) => ({ from: m.from, to: m.to }))
    };
  }

  addChat(user, text) {
    const last = this.chat[this.chat.length - 1];
    const entry = { id: last ? last.id + 1 : 1, user: user, text: text, ts: Date.now() };
    this.chat.push(entry);
    if (this.chat.length > CHAT_LIMIT) this.chat = this.chat.slice(-CHAT_LIMIT);
    this.broadcast({ t: 'chat', msg: entry });
  }

  async save() {
    await this.ctx.storage.put({ game: this.game, chat: this.chat, score: this.score, skins: this.skins });
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
