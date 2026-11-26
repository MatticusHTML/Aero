// Game history, stored as plain numbers.
//
// A game record is its starting position (only when it is not the standard one)
// plus a list of TURNS. A turn is a list of HOPS (a multi-jump is several hops),
// and a hop is a single integer: from * 64 + to. A 60-turn game is a few hundred
// bytes. Nobody stores boards: the page rebuilds the position after every turn by
// replaying these numbers (move the piece, remove the jumped piece, crown on the
// far row), so history costs almost no memory.
//
// Record:  { n, first, started, turns: [[hop, ...], ...], init?, partial?,
//            ended?, winner?, reason? }
// Summary: { n, first, started, ended, winner, reason, turns, moves, partial }
//          (what the list shows; `moves` says whether a full record exists)
//
// No imports except the rules, so it runs anywhere.

import { newGame } from './checkers.js';

const SIDE_OF = { Dianna: 'D', Matticus: 'M' };

// 64 characters: '.' empty, d/D = Dianna man/king, m/M = Matticus man/king.
export function encodeBoard(board) {
  return board.map(function(p) {
    if (!p) return '.';
    return p.o === 'D' ? (p.k ? 'D' : 'd') : (p.k ? 'M' : 'm');
  }).join('');
}

function isStandardStart(board, first) {
  return encodeBoard(board) === encodeBoard(newGame(first).board);
}

// Start a record. Pass `board` only for a game already under way (see migrate).
export function newRecord(n, first, startedAt, board) {
  const rec = { n: n, first: first, started: startedAt, turns: [] };
  if (board && !isStandardStart(board, first)) { rec.init = encodeBoard(board); rec.partial = true; }
  return rec;
}

// `continuing` is true when this hop continues a multi-jump started earlier in
// the same turn.
export function recordHop(rec, from, to, continuing) {
  const hop = from * 64 + to;
  if (continuing && rec.turns.length) rec.turns[rec.turns.length - 1].push(hop);
  else rec.turns.push([hop]);
}

export function summaryOf(rec) {
  return {
    n: rec.n,
    first: rec.first,
    started: rec.started === undefined ? null : rec.started,
    ended: rec.ended === undefined ? null : rec.ended,
    winner: rec.winner === undefined ? null : rec.winner,
    reason: rec.reason === undefined ? null : rec.reason,
    turns: rec.turns.length,
    moves: true,
    partial: !!rec.partial
  };
}

// One-time backfill for a room that played games before history existed. Those
// games have no move record, so they are listed winner-only. What we can know:
//   - every finished game bumped the score, and
//   - the chat kept "X wins!" / "New game!" system messages (newest 200 only),
//     which give winners and dates.
// A game in progress at that moment becomes a partial record that starts from
// the current board.
export function migrateLegacy(chat, game, score) {
  const found = [];
  let pending = null;
  (chat || []).forEach(function(m) {
    if (m.user) return;
    let r;
    if ((r = /^New game! (Dianna|Matticus) goes first\.$/.exec(m.text))) {
      pending = { ts: m.ts, first: SIDE_OF[r[1]] };
    } else if ((r = /^(Dianna|Matticus) wins! \((.*)\)$/.exec(m.text))) {
      found.push({ started: pending ? pending.ts : null, ended: m.ts, first: pending ? pending.first : null, winner: SIDE_OF[r[1]], reason: r[2] });
      pending = null;
    } else if ((r = /^(Dianna|Matticus) resigned\. (Dianna|Matticus) wins!$/.exec(m.text))) {
      found.push({ started: pending ? pending.ts : null, ended: m.ts, first: pending ? pending.first : null, winner: SIDE_OF[r[2]], reason: 'Resigned' });
      pending = null;
    }
  });

  // The chat only keeps recent messages. If the tally says more games were played,
  // list the older ones too: winner known from the score, date and order unknown.
  const wins = { D: (score && score.D) || 0, M: (score && score.M) || 0 };
  const seen = { D: 0, M: 0 };
  found.forEach(function(g) { seen[g.winner] += 1; });
  const older = [];
  ['D', 'M'].forEach(function(side) {
    for (let i = 0; i < wins[side] - seen[side]; i++) {
      older.push({ started: null, ended: null, first: null, winner: side, reason: null });
    }
  });
  const all = older.concat(found);

  const history = all.map(function(g, i) {
    return { n: i + 1, first: g.first, started: g.started, ended: g.ended, winner: g.winner, reason: g.reason, turns: 0, moves: false, partial: false };
  });

  let cur = null;
  if (game && game.status === 'playing') {
    cur = newRecord(history.length + 1, game.first, pending ? pending.ts : Date.now(), game.board);
  }
  return { history: history, cur: cur };
}
