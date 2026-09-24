import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { randomBytes, randomInt } from 'crypto';
import { Server, Socket } from 'socket.io';
import { AccessToken } from 'livekit-server-sdk';
import { LOCATIONS } from './locations';

const PORT = Number(process.env.PORT) || 4000;
const ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim());
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 8;
const REVEAL_MS = 8_000;
const DISCUSSION_MS = 5 * 60_000;
const VOTE_MS = 60_000;
const GRACE_MS = 30_000; // how long a dropped player may reconnect

type Phase = 'lobby' | 'reveal' | 'discussion' | 'voting' | 'results';
interface Player { id: string; key: string; name: string; ready: boolean; sid?: string; drop?: NodeJS.Timeout }
interface Result { spyId: string; location: string; winner: 'players' | 'spy'; reason: 'vote' | 'escaped' | 'guess_ok' | 'guess_bad'; guess?: string }
interface Room {
  code: string; hostId: string; phase: Phase; players: Map<string, Player>;
  spyId?: string; location?: string; endsAt?: number; votes: Map<string, string>;
  result?: Result; timer?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();
const app = express();
app.use(cors({ origin: ORIGINS }));
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGINS } });

// ---------- helpers ----------
const newId = () => randomBytes(4).toString('hex');
const cleanName = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 16);
const cleanKey = (v: unknown) => { const s = String(v ?? ''); return /^[\w-]{8,64}$/.test(s) ? s : ''; };

// Each player gets a personalised view: only non-spies ever receive the location.
function view(room: Room, me: Player) {
  const inGame = room.phase !== 'lobby';
  const isSpy = room.spyId === me.id;
  return {
    code: room.code, phase: room.phase, hostId: room.hostId, me: me.id,
    now: Date.now(), endsAt: room.endsAt ?? null, minPlayers: MIN_PLAYERS,
    players: [...room.players.values()].map((p) => ({
      id: p.id, name: p.name, ready: p.id === room.hostId || p.ready, online: !!p.sid, voted: room.votes.has(p.id),
    })),
    locations: inGame ? LOCATIONS : [],
    role: inGame ? (isSpy ? 'spy' : 'player') : null,
    location: inGame && !isSpy ? room.location ?? null : null,
    myVote: room.votes.get(me.id) ?? null,
    votes: room.phase === 'results' ? Object.fromEntries(room.votes) : null,
    result: room.result ?? null,
  };
}
const push = (room: Room) => room.players.forEach((p) => p.sid && io.to(p.sid).emit('room:state', view(room, p)));

// ---------- game state machine ----------
function schedule(room: Room, ms: number, fn: (r: Room) => void) {
  clearTimeout(room.timer);
  room.endsAt = Date.now() + ms;
  room.timer = setTimeout(() => { fn(room); push(room); }, ms);
}
function startGame(r: Room) {
  const ids = [...r.players.keys()];
  r.spyId = ids[randomInt(ids.length)];
  r.location = LOCATIONS[randomInt(LOCATIONS.length)];
  r.votes.clear(); r.result = undefined; r.phase = 'reveal';
  schedule(r, REVEAL_MS, startDiscussion);
}
function startDiscussion(r: Room) { r.phase = 'discussion'; schedule(r, DISCUSSION_MS, startVoting); }
function startVoting(r: Room) { r.phase = 'voting'; r.votes.clear(); schedule(r, VOTE_MS, resolveVote); }
function finish(r: Room, winner: Result['winner'], reason: Result['reason'], guess?: string) {
  clearTimeout(r.timer); r.endsAt = undefined; r.phase = 'results';
  r.result = { spyId: r.spyId!, location: r.location!, winner, reason, guess };
}
function resolveVote(r: Room) {
  const tally = new Map<string, number>();
  for (const t of r.votes.values()) tally.set(t, (tally.get(t) || 0) + 1);
  let top: string | null = null, max = 0, tie = false;
  for (const [id, n] of tally) {
    if (n > max) { max = n; top = id; tie = false; } else if (n === max) tie = true;
  }
  const caught = top === r.spyId && !tie && max > 0;
  finish(r, caught ? 'players' : 'spy', caught ? 'vote' : 'escaped');
}
function maybeResolve(r: Room) {
  if (r.phase !== 'voting') return;
  const online = [...r.players.values()].filter((p) => p.sid);
  if (online.length && online.every((p) => r.votes.has(p.id))) resolveVote(r);
}
function resetLobby(r: Room) {
  clearTimeout(r.timer);
  r.phase = 'lobby'; r.spyId = undefined; r.location = undefined; r.result = undefined; r.endsAt = undefined;
  r.votes.clear(); r.players.forEach((p) => (p.ready = false));
}
function removePlayer(room: Room, id: string) {
  const p = room.players.get(id);
  if (!p) return;
  clearTimeout(p.drop);
  room.players.delete(id); room.votes.delete(id);
  for (const [voter, target] of room.votes) if (target === id) room.votes.delete(voter);
  if (room.players.size === 0) { clearTimeout(room.timer); rooms.delete(room.code); return; }
  if (room.hostId === id) room.hostId = [...room.players.keys()][0];
  const midGame = room.phase !== 'lobby' && room.phase !== 'results';
  if (midGame && (room.players.size < 3 || id === room.spyId)) resetLobby(room);
  else maybeResolve(room);
  push(room);
}

// ---------- sockets ----------
io.on('connection', (socket: Socket) => {
  const ctx = () => {
    const room = rooms.get(socket.data.code);
    const me = room?.players.get(socket.data.pid);
    return room && me ? { room, me } : null;
  };
  const leave = () => { const c = ctx(); socket.data = {}; if (c) removePlayer(c.room, c.me.id); };
  const attach = (room: Room, p: Player) => {
    clearTimeout(p.drop); p.sid = socket.id; socket.data = { code: room.code, pid: p.id }; push(room);
  };

  socket.on('room:create', (d, ack) => {
    const name = cleanName(d?.name), key = cleanKey(d?.key);
    if (!name || !key) return ack?.({ ok: false, error: 'name' });
    leave();
    let code = '';
    do { code = String(randomInt(100000, 1000000)); } while (rooms.has(code));
    const p: Player = { id: newId(), key, name, ready: false };
    const room: Room = { code, hostId: p.id, phase: 'lobby', players: new Map([[p.id, p]]), votes: new Map() };
    rooms.set(code, room);
    attach(room, p);
    ack?.({ ok: true, code });
  });

  socket.on('room:join', (d, ack) => {
    const code = String(d?.code ?? ''), name = cleanName(d?.name), key = cleanKey(d?.key);
    if (!/^\d{6}$/.test(code)) return ack?.({ ok: false, error: 'not_found' });
    if (!name || !key) return ack?.({ ok: false, error: 'name' });
    const room = rooms.get(code);
    if (!room) return ack?.({ ok: false, error: 'not_found' });
    if (socket.data.code && socket.data.code !== code) leave();
    let p = [...room.players.values()].find((x) => x.key === key); // reconnect
    if (!p) {
      if (room.phase !== 'lobby') return ack?.({ ok: false, error: 'started' });
      if (room.players.size >= MAX_PLAYERS) return ack?.({ ok: false, error: 'full' });
      p = { id: newId(), key, name, ready: false };
      room.players.set(p.id, p);
    }
    attach(room, p);
    ack?.({ ok: true });
  });

  socket.on('room:leave', leave);

  socket.on('player:ready', () => {
    const c = ctx(); if (!c || c.room.phase !== 'lobby') return;
    c.me.ready = !c.me.ready; push(c.room);
  });

  socket.on('game:start', () => {
    const c = ctx(); if (!c || c.room.hostId !== c.me.id || c.room.phase !== 'lobby') return;
    const ps = [...c.room.players.values()];
    if (ps.length < MIN_PLAYERS || !ps.every((p) => p.id === c.room.hostId || p.ready)) return;
    startGame(c.room); push(c.room);
  });

  socket.on('game:vote_now', () => {
    const c = ctx(); if (!c || c.room.hostId !== c.me.id || c.room.phase !== 'discussion') return;
    startVoting(c.room); push(c.room);
  });

  socket.on('vote:cast', (targetId) => {
    const c = ctx();
    if (!c || c.room.phase !== 'voting' || typeof targetId !== 'string') return;
    if (targetId === c.me.id || !c.room.players.has(targetId)) return;
    c.room.votes.set(c.me.id, targetId); maybeResolve(c.room); push(c.room);
  });

  socket.on('spy:guess', (loc) => {
    const c = ctx();
    if (!c || c.me.id !== c.room.spyId || !['discussion', 'voting'].includes(c.room.phase)) return;
    if (typeof loc !== 'string' || !LOCATIONS.includes(loc)) return;
    const ok = loc === c.room.location;
    finish(c.room, ok ? 'spy' : 'players', ok ? 'guess_ok' : 'guess_bad', loc); push(c.room);
  });

  socket.on('game:again', () => {
    const c = ctx(); if (!c || c.room.hostId !== c.me.id || c.room.phase !== 'results') return;
    resetLobby(c.room); push(c.room);
  });

  // LiveKit token is issued per authenticated socket, so identities can't be spoofed.
  socket.on('voice:token', async (ack) => {
    const c = ctx();
    const { LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret, LIVEKIT_URL: url } = process.env;
    if (!c || !key || !secret || !url) return ack?.({ ok: false });
    const at = new AccessToken(key, secret, { identity: c.me.id, name: c.me.name, ttl: '2h' });
    at.addGrant({ room: `spyfall-${c.room.code}`, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: false });
    ack?.({ ok: true, token: await at.toJwt(), url });
  });

  socket.on('disconnect', () => {
    const c = ctx();
    if (!c || c.me.sid !== socket.id) return;
    c.me.sid = undefined;
    c.me.drop = setTimeout(() => removePlayer(c.room, c.me.id), GRACE_MS);
    maybeResolve(c.room); push(c.room);
  });
});

server.listen(PORT, () => console.log(`Spyfall server on :${PORT}`));
