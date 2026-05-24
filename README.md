# Race for the Galaxy — Digital Companion

A client-only web app that replaces physical phase selection cards and VP chips for [Race for the Galaxy](https://boardgamegeek.com/boardgame/28143/race-galaxy). Players choose actions secretly on their phones, reveal simultaneously, and track scores from start to finish.

Built with **Nuxt 4**, **Tailwind CSS 4**, and **WebRTC** (via [Trystero](https://trystero.dev)) for peer-to-peer sync — no backend required.

## Features

- **Lobby** — Host creates a 4-letter room code with QR code; players join by scan or code entry
- **Secret phase selection** — Tap phases, confirm to lock choices hidden from neighbors
- **Simultaneous reveal** — Active phases shown in strict game order with bonus allocation
- **VP chip tracker** — Personal vault with global pool (12 chips × player count)
- **End-game scoring** — Score sheet with tie-breakers and podium leaderboard

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run generate
npm run preview
```

For GitHub Pages subdirectory deployment:

```bash
NUXT_APP_BASE_URL=/rftg-companion/ npm run generate
```

## Deploy to GitHub Pages

1. Enable GitHub Pages in repo settings (Source: GitHub Actions)
2. Push to `main` — the workflow builds and deploys automatically
3. App will be live at `https://<username>.github.io/rftg-companion/`

## How multiplayer works

Players connect peer-to-peer using WebRTC. Trystero handles signaling over decentralized relays (Nostr by default) — no custom server needed. The host's device acts as the authoritative game state source and broadcasts updates to all connected peers.

> **Note:** WebRTC works best when all players are on the same Wi-Fi network. Cross-network play may require TURN configuration in Trystero for reliability.

## Expansions

The host can toggle expansions in the lobby:

| Expansion | Effect |
|-----------|--------|
| Gathering Storm | Adds Search phase |
| Rebel vs Imperium | Adds Repair phase |
| Prestige | Adds Prestige Points scoring field |
| Goals | Adds Goal tile scoring field |

## License

Apache 2.0 — see [LICENSE](LICENSE).
