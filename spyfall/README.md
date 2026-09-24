# Шпи (Spyfall) — online multiplayer, Mongolian UI

Next.js 14 + Tailwind (web) · Express + Socket.io (server) · LiveKit (voice) · in-memory state.

## Run
1. `npm install && npm run install:all`
2. `cp server/.env.example server/.env` and `cp web/.env.example web/.env.local`
3. Put your LiveKit URL / API key / secret in `server/.env` (free project at cloud.livekit.io).
4. `npm run dev` → web on :3000, server on :4000.

Testing on a phone over LAN: set `NEXT_PUBLIC_SERVER_URL=http://<your-ip>:4000` and `CLIENT_ORIGIN=http://<your-ip>:3000`. Browsers only allow the microphone on HTTPS or localhost, so use a tunnel (e.g. ngrok) or deploy for real voice tests.

## Rules implemented
4–8 players, 6-digit code, everyone except host must press Бэлэн. Reveal (8 s) → discussion (5 min) → voting (60 s, or when all voted) → results. Most votes on the spy = non-spies win; tie or wrong target = spy escapes. The spy can guess the location any time during discussion/voting: right = spy wins, wrong = spy loses.

## Deploy
Server: any Node host (`npm --prefix server run build && npm --prefix server start`), one instance only (state is in memory). Set `CLIENT_ORIGIN` to the web URL. Web: Vercel or `next start`, with `NEXT_PUBLIC_SERVER_URL` pointing to the server (https/wss).

## Layout
```
server/src/index.ts       rooms, game state machine, Socket.io events, LiveKit tokens
server/src/locations.ts   20 locations
web/app/page.tsx          create / join
web/app/room/[code]/      lobby, role reveal, discussion, voting, results
web/lib/                  socket client, LiveKit hook, Mongolian strings, types
```
