# Rules reference (companion implementation)

This documents **what the app implements**, aligned with RFTG **2nd edition**. The physical rulebook remains authoritative for disputes.

## Action selection

| Players | Action cards per round | Code |
|---------|------------------------|------|
| 3–4 (and 2-player beginner) | 1 | `getPhaseLimit(n) → n === 2 ? 2 : 1` |
| 2-player **experienced** | 2 | same function |

**Note:** `develop-2` and `settle-2` exist in `PHASES` for stacking experienced 2-player double develop/settle; the picker currently exposes them whenever listed in `getAvailablePhases` — filtering to 2-player only is [roadmap](./roadmap.md) work.

## Phase order (reveal)

Explore (+1/+1, viche/+5) → Develop (stacked) → Settle (stacked) → Consume ($ Trade, ×2) → Produce → expansion phases (Search, Repair) if enabled.

Phases with no choosers are skipped in UI (not shown in reveal list).

## Duplicate phase choice

If multiple players choose the same phase, it runs **once**; each chooser gets that phase’s **bonus** (shown as participants on the reveal card).

## Hand size

Not tracked in app. **RulesHint** on select/reveal: discard to **10** cards at round end.

## VP chips

- Initial supply: **12 × player count** (`vpPoolForPlayerCount`).
- Chips moved from supply to player vault on gain; returned on decrease (capped at initial supply).
- **`lastRound`**: set when supply hits **0**; game does **not** end until total vault VP **exceeds** initial supply (not when equal).
- Gains when supply is empty are still allowed on players (final-round Consume may use 10-value chips — reminder in hints only).

## Tableau size

| Constant | Value | Meaning |
|----------|-------|---------|
| `TABLEAU_START_SIZE` | 1 | Set on `START_GAME` (start world) |
| `TABLEAU_END_GAME_SIZE` | 12 | End-game trigger |

Counters are **manual** — players increment when playing worlds/devs face-up. The app does not validate against physical tableau.

## End game

After the round in which **either**:

1. `sum(player.vpChips) > vpPoolInitial`, or  
2. `any(player.tableauSize >= 12)`

…the host (or flow on last reveal step) calls `END_GAME` → **scoring** screen.

`finishRevealRound` in `usePeerGameController` checks `shouldEndGameAfterRound` → `END_GAME` vs `NEXT_ROUND`.

## Final scoring (app)

Score sheet fields:

- VP chips (from tracker)
- Card face value VP on tableau
- Development bonuses (e.g. 6-cost)
- Prestige / Goals (if expansions on)
- Tie-break inputs: goods on worlds, cards in hand

Tie-break order: **most goods**, then **most cards in hand**.

Chip VP in the tracker is **not** the full score until card VP is entered at game end.

## Expansions (lobby toggles)

| Flag | Effect in app |
|------|----------------|
| `gatheringStorm` | Search phase available |
| `rebelVsImperium` | Repair phase available |
| `prestige` | Prestige field in scoring |
| `goals` | Goal points in scoring |

## Open information

Hints state: VP chips and hand sizes are open information at the table. The app does not enforce hand reveals.
