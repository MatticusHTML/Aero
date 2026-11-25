// American checkers (English draughts) rules. Pure functions, no imports, so
// the same file runs in a Cloudflare Worker, a browser, or Node.
//
// Board: array of 64 cells, index = row * 8 + col, row 0 at the top.
// Pieces only live on dark squares, where (row + col) is odd.
// A cell is null or { o: 'D' | 'M', k: boolean }  (owner, isKing).
//   D = Dianna: starts at the bottom (rows 5-7) and moves UP the board.
//   M = Matticus: starts at the top (rows 0-2) and moves DOWN.

export const SIDES = { Dianna: 'D', Matticus: 'M' };
export const NAMES = { D: 'Dianna', M: 'Matticus' };

export function other(side) { return side === 'D' ? 'M' : 'D'; }

export function newGame(first) {
  first = first === 'M' ? 'M' : 'D';
  const board = new Array(64).fill(null);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 1) continue;
      if (r < 3) board[r * 8 + c] = { o: 'M', k: false };
      else if (r > 4) board[r * 8 + c] = { o: 'D', k: false };
    }
  }
  return {
    board,
    turn: first,
    first,
    status: 'playing', // 'playing' | 'over'
    winner: null,      // 'D' | 'M' once over
    reason: null,      // short human text once over
    chain: null,       // index of a piece that must keep jumping, else null
    lastPath: []       // squares of the most recent move, for highlighting
  };
}

function directions(piece) {
  if (piece.k) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.o === 'D' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function inside(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function stepsFrom(board, i) {
  const piece = board[i];
  const r = Math.floor(i / 8), c = i % 8;
  const out = [];
  directions(piece).forEach(function(d) {
    const nr = r + d[0], nc = c + d[1];
    if (inside(nr, nc) && !board[nr * 8 + nc]) {
      out.push({ from: i, to: nr * 8 + nc, captured: null });
    }
  });
  return out;
}

function jumpsFrom(board, i) {
  const piece = board[i];
  const r = Math.floor(i / 8), c = i % 8;
  const out = [];
  directions(piece).forEach(function(d) {
    const mr = r + d[0], mc = c + d[1];
    const lr = r + 2 * d[0], lc = c + 2 * d[1];
    if (!inside(lr, lc)) return;
    const mid = board[mr * 8 + mc];
    if (mid && mid.o !== piece.o && !board[lr * 8 + lc]) {
      out.push({ from: i, to: lr * 8 + lc, captured: mr * 8 + mc });
    }
  });
  return out;
}

// Every legal single hop for the player whose turn it is. Captures are
// mandatory: if any jump exists, only jumps are returned. While a piece is
// mid-chain, only that piece's further jumps are legal.
export function legalMoves(state) {
  if (state.status !== 'playing') return [];
  const board = state.board;
  if (state.chain !== null) return jumpsFrom(board, state.chain);
  let jumps = [], steps = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.o !== state.turn) continue;
    jumps = jumps.concat(jumpsFrom(board, i));
    steps = steps.concat(stepsFrom(board, i));
  }
  return jumps.length ? jumps : steps;
}

function clone(state) { return JSON.parse(JSON.stringify(state)); }

// Returns { ok: true, state } or { ok: false, error }. Never mutates `state`.
export function applyMove(state, from, to) {
  const move = legalMoves(state).filter(function(m) { return m.from === from && m.to === to; })[0];
  if (!move) return { ok: false, error: 'That move is not legal.' };

  const next = clone(state);
  const board = next.board;
  const piece = board[from];
  board[to] = piece;
  board[from] = null;
  if (move.captured !== null) board[move.captured] = null;

  // A man reaching the far row is crowned, and that ends the turn even mid-jump.
  let crowned = false;
  const row = Math.floor(to / 8);
  if (!piece.k && ((piece.o === 'D' && row === 0) || (piece.o === 'M' && row === 7))) {
    piece.k = true;
    crowned = true;
  }

  next.lastPath = state.chain !== null ? state.lastPath.concat([to]) : [from, to];

  if (move.captured !== null && !crowned && jumpsFrom(board, to).length) {
    next.chain = to; // same player keeps jumping
    return { ok: true, state: next };
  }

  next.chain = null;
  next.turn = other(state.turn);
  if (legalMoves(next).length === 0) {
    next.status = 'over';
    next.winner = state.turn;
    const left = board.filter(function(p) { return p && p.o === next.turn; }).length;
    next.reason = left === 0 ? 'No pieces left' : 'No moves left';
  }
  return { ok: true, state: next };
}

export function resign(state, side) {
  const next = clone(state);
  next.status = 'over';
  next.winner = other(side);
  next.reason = 'Resigned';
  next.chain = null;
  return next;
}
