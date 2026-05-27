# Tutorial mode

## Goal

Help new or rusty players without turning the app into a full digital RFTG client. Tutorial content is **copy and light UI**, layered on existing screens.

## Scopes (from product discussion)

| Scope | Behavior |
|-------|----------|
| **Per-player** (implemented in phase A) | Only the acting player’s `tutorialEnabled` flag affects their picker hints. |
| **Session-wide** (planned, phase B+) | If any player enables tutorial, optional host-facing scripts on reveal/scoring for the table. |

Phase A intentionally avoids session-wide reveal scripts to keep scope small.

## Phase A — implemented

### Lobby

- Checkbox **Tutorial** per player row (editable by host or seat owner).
- `SET_TUTORIAL_ENABLED` — lobby only, synced via P2P.
- `Player.tutorialEnabled` persisted in game state (not in `localPlayers` cache yet).

### Phase selection (`select`)

When `isPlayerTutorialEnabled(players, actingPlayerId)`:

1. **Phase guide** — `<details>` listing `TUTORIAL_GROUP_BLURBS` for each non-expansion group present in the picker.
2. **Selection blurb** — one line for the group of the **last** selected phase.
3. Copy lives in `app/utils/tutorial.ts` (not on every `PhaseDefinition` yet).

### Pass-and-play privacy

On `showHandoff`:

- Hide `PlayerStatusList` (others’ ready state).
- Hide `VpTracker` FAB/sheet.

Reduces leaking VP/tableau while the device is passed.

### Not in phase A

- Reveal “host script” paragraphs
- Consume/produce static cheat sheet beyond group blurbs
- Hand-size planning aid
- Scoring field explanations beyond existing `RulesHint`

## Phase B — reveal host scripts (planned)

For **session-wide** tutorial (`any(player.tutorialEnabled)`):

- On `reveal`, show a short scroll-capped script per **phase group** (explore, develop, …).
- Audience: everyone; tone: “table coach”, not private hand advice.
- Content model: extend `tutorial.ts` with `hostScriptByGroup` or per-phase `hostScript` strings.

## Phase C — planning aid (planned, stretch)

Optional helper on **select** only:

- Manual numeric inputs: cards in hand, rough cost reminder.
- **No** hidden hand UI, no deck integration.
- Clear label: “planning only — your hand stays physical”.

## Phase D — scoring walkthrough (planned)

On `scoring`:

- Step-through or expandable sections for chip VP vs card VP vs 6-cost bonuses.
- Tie-break reminder when `needsTiebreakInput`.

## Content guidelines

- Short sentences; mobile-first; avoid duplicating full rulebook text.
- Prefer group-level blurbs over per-card-id content.
- Do not imply the app validates legal plays.

## Related code

| File | Role |
|------|------|
| `app/utils/tutorial.ts` | Blurbs + `isPlayerTutorialEnabled` |
| `app/components/PhasePicker.vue` | Guide UI |
| `app/components/screens/SelectScreen.vue` | Wires `showTutorialBlurbs` |
| `app/stores/game.ts` | `SET_TUTORIAL_ENABLED` |
