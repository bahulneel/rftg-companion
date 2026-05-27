# Roadmap

Planned and discussed work. Not committed to order unless noted.

## Tutorial mode

| Phase | Status | Description |
|-------|--------|-------------|
| **A** | Done (PR #7) | Per-player lobby toggle; phase picker guide + blurbs; pass-and-play handoff privacy |
| **B** | Planned | Session-wide reveal “host scripts” when any player has tutorial on |
| **C** | Stretch | Planning aid on select (manual hand count / cost notes, no hand simulation) |
| **D** | Planned | Scoring screen walkthrough and tie-break coaching |

Details: [tutorial-mode.md](./tutorial-mode.md).

## Rules & phases

- [ ] **Experienced 2-player phase tiles** — Show `develop-2` / `settle-2` only when `playerCount === 2` (and optionally a “beginner 2p” mode with 1 card). Investigated on branch `cursor/fix-phase-pick-limit-7179`.
- [ ] **Beginner vs experienced 2-player** — Lobby toggle or rule hint if 2p should pick 1 vs 2 actions.
- [ ] **Persist `tutorialEnabled` in `localPlayers`** — Survive “Play on one device” restarts for repeat groups.

## Scoring & tracking

- [ ] **Tableau adjust shortcuts** — Optional +N when settling multiple worlds in one phase (table adjudicated).
- [ ] **Scoring pre-fill** — Pull `tableauSize` / chip VP into score sheet hints (not auto-submit card VP).
- [ ] **Goals / Prestige** — Richer copy when expansions enabled.

## Multiplayer & UX

- [ ] **PR CI** — `npm run generate` on pull requests.
- [ ] **Reconnection** — Guest rejoin after refresh (peer id + state snapshot policy).
- [ ] **Connection diagnostics** — Already have drawer; document troubleshooting in README.
- [ ] **Offline local-only** — Clearer messaging when WebRTC fails; nudge toward single-device mode.

## Quality

- [ ] **Unit tests** — `scoring.ts` (VP pool, end-game triggers, tie-break), `buildRevealedPhases`, `getPhaseLimit`, `isAuthorized`.
- [ ] **E2E smoke** — Playwright: create local game, pick phases, reveal, end game (see agent skill `run-smoke-tests`).

## Documentation

- [x] README + `docs/` folder (this effort)
- [ ] Link docs from GitHub wiki or Pages `/docs` if we publish a site section later

## Explicit non-goals (reaffirmed)

- Full card/hand engine
- Online matchmaking or accounts
- Official Rio Grande endorsement or licensed art
