# Architecture

## Runtime model

- **Nuxt 4** SPA (`ssr: false`) — static export to GitHub Pages.
- **Pinia** store (`useGameStore`) holds a single `GameState | null`.
- All mutations go through **`dispatch(action: GameAction)`** — a client-side reducer returning the new state (or `null` if no state).

## Screens (`GameScreen`)

```
lobby → select → reveal → scoring
         ↑___________|      (NEXT_ROUND)
                    END_GAME (from reveal when end condition met)
```

`GameSession.vue` switches on `screen` and binds props from `usePeerGameController` (`lobby`, `select`, `reveal`, `scoring` computed objects).

## Multiplayer transport

```
Guest                    Host
  |                        |
  |-- GameAction --------->|  isAuthorized(peerId, action, state)
  |                        |  dispatch(action) → new state
  |<----- SYNC_STATE ------|  broadcast to all peers
```

- **Trystero** establishes WebRTC data channels; the library is not the source of truth.
- **Host** runs `dispatch`; guests use `createP2PTransport` to forward actions.
- **Local mode** uses `createLocalTransport()` — dispatch runs in-process only.

### Invite URLs

Query-param based for static hosting:

- Host: `/?room=ABCD`
- Guest: `/?join=ABCD&host=<peerId>`

`nuxt.config.ts` injects a script into `404.html` to redirect legacy `/host/CODE` and `/join/CODE` paths.

## Player model

```ts
interface Player {
  id: string
  ownerPeerId: string   // which peer may act for this seat
  name: string
  vpChips: number
  tableauSize: number   // face-up tableau; 1 at START_GAME
  tutorialEnabled: boolean
  status: 'thinking' | 'ready'
}
```

`ownerPeerId` allows one phone to control multiple seats (pass-and-play or family device).

## Permissions (`app/utils/permissions.ts`)

| Action types | Who |
|--------------|-----|
| `START_GAME`, `NEXT_ROUND`, `END_GAME`, `SET_REVEAL_INDEX`, `SET_EXPANSIONS` | Host (or local mode equivalent) |
| `SELECT_PHASES`, `CONFIRM`, `SUBMIT_SCORE`, `SUBMIT_TIEBREAK` | Owner of `playerId` |
| `ADJUST_VP`, `SET_VP`, `ADJUST_TABLEAU`, `SET_TABLEAU` | Host **or** owner of seat |
| `SET_TUTORIAL_ENABLED` | Host **or** owner; **lobby only** |
| `SYNC_STATE` | Never from clients (host push only) |

## Phase reveal algorithm

`buildRevealedPhases(selections, playerNames)` in `app/utils/phases.ts`:

1. Non-develop/settle phases: one reveal row per `PhaseId` with chooser list.
2. **Develop** and **settle**: stack `N` rows where `N = max` count of that group among all players (`develop` + `develop-2`, `settle` + `settle-2`).
3. Order follows `PHASE_ORDER` (Explore → … → Produce → expansion phases).

## Scoring pipeline

- During play: `vpChips` on `Player` synced to `scores[id].vpChips` when adjusted.
- `END_GAME`: copies chip VP into score sheet, sets `submitted: true`, moves to `scoring` screen.
- Final total: `totalScore(ScoreInput, expansions)` — chips + card face VP + dev bonuses + optional prestige/goals.
- Tie-break among tied leaders: goods on worlds, then cards in hand (`compareTiebreak`).

## UI components (high level)

| Component | Role |
|-----------|------|
| `PhasePicker` | Secret selection grid |
| `RevealScreen` | Phase carousel + live VP/tableau |
| `VpTracker` | FAB + bottom sheet (VP pool + all players) |
| `EditableVpScore` / `EditableTableauScore` | ±1 and tap-to-edit counters |
| `PassDevicePrompt` | Pass-and-play handoff |
| `HostLobbyDrawer` | Host table button: QR, lobby, start |
| `RulesHint` | Collapsible hints from `rulesHints.ts` |

## State migration

`applyState` normalizes older synced payloads:

- `tableauSize ?? (lobby ? 0 : 1)`
- `tutorialEnabled ?? false`
- `tiebreakSubmitted` on scores

Peers on different app versions should converge after host updates.
