# Design decisions

Lightweight ADR-style log. Newest entries first.

---

## 2026-05 — Tableau size on `Player`, not a separate “empire” object

**Context:** End game can trigger at 12+ face-up tableau cards; only VP was tracked.

**Decision:** Add `tableauSize: number` on `Player`, mirror VP with `ADJUST_TABLEAU` / `SET_TABLEAU`, default **1** at `START_GAME`.

**Alternatives considered:** Separate `EmpireState` map — rejected as redundant with per-player counters.

**Consequences:** Score tracker shows VP + tableau; `shouldEndGameAfterRound` uses `getEndGameTriggers()` for VP and tableau.

---

## 2026-05 — End game uses OR of VP pool and tableau triggers

**Context:** RFTG ends after the round when either condition is met.

**Decision:** `getEndGameTriggers` returns `vp_pool` and/or `tableau`; finish current round then `END_GAME`.

**Consequences:** Reveal UI shows combined message when both apply.

---

## 2026-05 — Tutorial phase A is per-acting-player, not session-wide

**Context:** Tutorial spec discussed session-wide host scripts vs individual coaching.

**Decision:** Ship per-player toggle and picker blurbs first; session-wide reveal scripts deferred to phase B.

**Consequences:** `isPlayerTutorialEnabled(players, actingPlayerId)` drives select UI only.

---

## 2026-05 — Pass-and-play hides tracker and status on handoff

**Context:** FAB showed VP/tableau for all players during “pass device” on select.

**Decision:** `v-if="!showHandoff"` on `PlayerStatusList` and `VpTracker` in `SelectScreen`.

**Consequences:** Slightly less convenience for the receiving player until they tap “ready”; better secrecy.

---

## 2026-05 — Rules hints as data, not hardcoded in Vue

**Context:** Users forget hand limit, phase order, end-game conditions.

**Decision:** `getRulesHints(screen, context)` in `app/utils/rulesHints.ts` + shared `RulesHint.vue`.

**Consequences:** Copy updates don’t require touching every screen component.

---

## Earlier — Host-authoritative P2P, no server

**Context:** GitHub Pages static hosting.

**Decision:** Trystero WebRTC star on host; `GameAction` + `SYNC_STATE` protocol.

**Consequences:** Host disconnect ends session; same-Wi‑Fi recommended.

---

## Earlier — `develop` / `settle` stacking in reveal builder

**Context:** Multiple players can choose develop or settle (including `-2` variants in 2p).

**Decision:** `buildStackedGroupPhases` emits N stacked reveal rows.

**Consequences:** Reveal order matches physical game’s multiple develop/settle steps.

---

## Earlier — Phase limit 2 only for two players

**Context:** Experienced 2-player uses two action cards.

**Decision:** `getPhaseLimit(playerCount) => playerCount === 2 ? 2 : 1`.

**Open:** Whether beginner 2-player should use 1 — not distinguished in app yet (see [roadmap.md](./roadmap.md)).

---

## Earlier — Companion scope: phases + chips only

**Context:** Full digital RFTG is a different product.

**Decision:** No hand/deck simulation; manual score entry for card VP at end.

**Consequences:** Clear user expectations in [product-scope.md](./product-scope.md).
