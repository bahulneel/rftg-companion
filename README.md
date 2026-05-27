# Race for the Galaxy — Digital Companion

A **client-only** web app that replaces physical **action selection cards** and **VP chips** for [Race for the Galaxy](https://boardgamegeek.com/boardgame/28143/race-galaxy) (2nd edition). Players secretly choose phases on their phones, reveal in official order, and track chip VP plus tableau size through end game and final scoring.

Built with **Nuxt 4**, **Vue 3**, **Pinia**, **Tailwind CSS 4**, and **WebRTC** ([Trystero](https://trystero.dev)) for peer-to-peer sync — **no backend**.

**Live demo:** [https://bahulneel.github.io/rftg-companion/](https://bahulneel.github.io/rftg-companion/)

---

## What this app does

| In the box | In the app |
|------------|------------|
| Action cards (1 per player, 2 in experienced 2-player) | Secret phase picker → simultaneous reveal in game order |
| VP chips (12 × player count) | Score tracker with global pool and per-player vaults |
| Empire size (12+ ends game) | Per-player **empire** counter (starts at 1 for the start world) |
| End-game scoring | Score sheet, tie-breakers, podium leaderboard |

The app is a **table companion**, not a full digital implementation: it does **not** hold hands, run the deck, or enforce card costs. Players keep physical cards and use the app for phases, chips, and reminders.

---

## Features

### Lobby & sessions

- **Create game** — Host gets a 4-letter room code and QR invite (`?join=CODE&host=PEER_ID`).
- **Join** — Scan QR, paste invite link, or use legacy `/join/CODE` redirects on GitHub Pages.
- **Play on one device** — Pass-and-play for multiple seats on a single phone (no Wi‑Fi pairing).
- **Game master** — Host can run the room without a player seat (adjust scores, advance reveal).
- **Expansions** — Host toggles Gathering Storm, Rebel vs Imperium, Prestige, and Goals in the lobby.

### Game flow

1. **Select** — Each player picks phase(s), confirms (choices hidden from others).
2. **Reveal** — Phases run in order; develop/settle stack when multiple players chose them.
3. **Track** — Adjust VP chips (pool-aware) and empire size during play.
4. **Score** — Final totals, VP tie-break (goods, then cards in hand), leaderboard.

### Rules reminders

Collapsible **RulesHint** panels on lobby, phase selection, reveal, the score tracker, and scoring — short RFTG 2e reminders (hand limit, phase order, end-game triggers).

### Tutorial mode (phase A)

Per-player **Tutorial** toggle in the lobby. When enabled for whoever is picking phases:

- Collapsible **phase guide** on the picker.
- Context blurb for the last selected phase group.
- Pass-and-play **handoff** hides other players’ status and the score FAB.

See [docs/tutorial-mode.md](docs/tutorial-mode.md) for the full spec and planned phases B–D.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run generate
npm run preview
```

### GitHub Pages (subpath)

```bash
NUXT_APP_BASE_URL=/rftg-companion/ npm run generate
```

Pushes to `main` deploy via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## How multiplayer works

**Host-centric WebRTC star** — no game server.

1. The **host** browser holds authoritative `GameState`.
2. Guests connect with Trystero (NAT traversal only); actions go to the host.
3. The host rebroadcasts state after each authorized action.
4. If the host closes the tab, the session ends.

WebRTC works best on the **same Wi‑Fi**. Use **Play on one device** when networking is awkward.

Details: [docs/architecture.md](docs/architecture.md).

---

## Project layout

```
app/
  components/       UI (screens, tracker, phase picker, lobby)
  composables/      Game session, P2P controller, pass-and-play
  stores/           Pinia game store (reducer-style dispatch)
  types/            GameState, Player, GameAction
  utils/            phases, scoring, permissions, rules hints, tutorial
docs/               Design notes, decisions, roadmap (see docs/README.md)
```

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/README.md](docs/README.md) | Index of all documentation |
| [docs/architecture.md](docs/architecture.md) | State, sync, screens, permissions |
| [docs/product-scope.md](docs/product-scope.md) | In scope / out of scope |
| [docs/rules-reference.md](docs/rules-reference.md) | Rules the companion implements |
| [docs/tutorial-mode.md](docs/tutorial-mode.md) | Tutorial spec and delivery phases |
| [docs/decisions.md](docs/decisions.md) | Design decisions (ADR-style) |
| [docs/roadmap.md](docs/roadmap.md) | Planned work and open questions |
| [docs/session-notes.md](docs/session-notes.md) | Context captured from agent sessions |

---

## End-game conditions (implemented)

The game ends **after the current round** when either:

1. **VP pool** — Total chips in player vaults **exceeds** the initial supply (`12 × players`), or  
2. **Tableau** — Any player has **12+** face-up tableau cards (`TABLEAU_END_GAME_SIZE`).

When the supply is empty but total VP has not exceeded it, play continues (**last round** banner) until one of the above triggers.

---

## Roadmap (summary)

Near-term and future work is tracked in [docs/roadmap.md](docs/roadmap.md). Highlights:

- **Tutorial B** — Host scripts on reveal for session-wide tutorial.
- **Tutorial C** — Optional planning aid (hand count / cost notes, not full hand simulation).
- **Tutorial D** — Scoring walkthrough on the final screen.
- **Phase picker** — Restrict `develop-2` / `settle-2` to experienced 2-player games only.
- **Tests** — Unit tests for scoring, phase stacking, and end-game triggers.
- **CI** — Run build on PRs before merge to `main`.

---

## Contributing

Issues and PRs welcome. When changing game rules behavior, update [docs/rules-reference.md](docs/rules-reference.md) and relevant hints in `app/utils/rulesHints.ts`.

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
