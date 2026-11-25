// Aero games relay: a tiny Cloudflare Worker that hands WebSocket connections
// to one persistent Durable Object per game. Today there is one game, checkers.

import { GameRoom } from './room.js';
export { GameRoom };

const PLAYERS = ['Dianna', 'Matticus'];

// Browsers always send an Origin header on WebSocket connections, so only the
// real site (and local testing) can open one. This is a courtesy lock, not
// real security: the profile screen on the site is cosmetic too.
function originAllowed(origin) {
  if (!origin) return false;
  if (origin === 'https://matticushtml.github.io') return true;
  try {
    const u = new URL(origin);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch (e) {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response('Aero games relay is up.', { headers: { 'content-type': 'text/plain' } });
    }

    if (url.pathname === '/ws/checkers') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected a WebSocket upgrade', { status: 426 });
      }
      if (!originAllowed(request.headers.get('Origin'))) {
        return new Response('Forbidden', { status: 403 });
      }
      if (PLAYERS.indexOf(url.searchParams.get('user')) === -1) {
        return new Response('Unknown player', { status: 400 });
      }
      const id = env.GAME_ROOM.idFromName('checkers');
      return env.GAME_ROOM.get(id).fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
