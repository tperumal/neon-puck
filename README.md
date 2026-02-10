# Neon Puck

A web-based 2-player air hockey game with neon arcade visuals, local and online multiplayer, and touch support for iPad/mobile.

## Features

- **Local 2-player** — Multi-touch on the same device, each player controls one half
- **Online multiplayer** — Create a room, share a 4-letter code, play from anywhere
- **Neon arcade theme** — Glowing paddles and puck, particle effects, screen shake
- **Touch + mouse input** — Works on iPad Safari, mobile browsers, and desktop
- **Synthesized sound** — All sound effects generated via Web Audio API (no audio files)
- **Server-authoritative physics** — Prevents desync in online games

## Tech Stack

- HTML5 Canvas + vanilla JS (no build step)
- Node.js + Express + Socket.io
- Shared physics engine runs on both client and server (UMD module)

## Running Locally

```bash
npm install
npm start
```

Open http://localhost:3000

## How to Play

- **Local**: Tap PLAY > LOCAL 2-PLAYER. Player 1 controls the left paddle, Player 2 the right. First to 7 wins.
- **Online**: One player creates a room and shares the 4-letter code. The other joins with that code.

## Deploy

Configured for Render with `render.yaml`. Connect the repo and it auto-deploys as a free tier web service.
