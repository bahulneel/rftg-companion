# Session notes (agent / design context)

Captured from Cursor cloud-agent sessions so context survives if chat history is lost. Dates approximate (May 2026).

---

## Session: Phase pick limit investigation

**Question:** “Phases collapsed from 2 to 1” — verify against official RFTG rules.

**Findings:**

- RFTG 2e: **1 action card** per player in standard 3–4 player games.
- **2 action cards** each in **experienced 2-player** games.
- Code already had `getPhaseLimit(playerCount) => playerCount === 2 ? 2 : 1` in `app/utils/phases.ts`.

**Branch:** `cursor/fix-phase-pick-limit-7179` (PR #5) — additional work discussed: expose limit in UI, hide `develop-2`/`settle-2` for non-2p, `actionPickLimit` on state. Merge status should be verified against `main`.

---

## Session: Rules reminders

**Request:** Instruction hints for forgettable rules (hand size, etc.).

**Delivered:** `app/utils/rulesHints.ts`, `RulesHint.vue`, wired to lobby, select, reveal, VP tracker, scoring.

**Branch:** `cursor/rules-hints-7179` (commit `5d595d5`, PR #6).

---

## Session: Tutorial mode spec (no code)

**Request:** Adapt a Tutorial Mode functional spec to mobile UX and this app.

**Key adaptations agreed:**

| Original spec idea | Adaptation |
|--------------------|------------|
| Session-wide + per-player scopes | Keep both; ship per-player picker first |
| “Phase action” private hand screen | **Out of scope** — no hand simulation |
| Planning aid | Optional stretch: manual hand count only |
| Pass-and-play | Strengthen existing `PassDevicePrompt`; hide leaky widgets on handoff |

**Phased delivery:** A → B → C → D (documented in [tutorial-mode.md](./tutorial-mode.md)).

---

## Session: Tableau / empire size + begin implementation

**Problem:** VP pool end-game worked; **12+ tableau** end-game could not trigger — no counter.

**Implementation (PR #7, `cursor/empire-tutorial-7179`):**

- `Player.tableauSize`, actions `ADJUST_TABLEAU` / `SET_TABLEAU`
- `TABLEAU_START_SIZE = 1`, `TABLEAU_END_GAME_SIZE = 12`
- `getEndGameTriggers` / updated `shouldEndGameAfterRound`
- Score tracker + reveal UI
- Tutorial phase A rolled into same PR

**User intent:** “Roll this into the above work” — combined with rules hints branch lineage (branch created from `cursor/rules-hints-7179`).

---

## Open PRs / branches (snapshot)

| Branch | PR | Topic |
|--------|-----|--------|
| `cursor/fix-phase-pick-limit-7179` | #5 | Phase limit UI / 2p phase tiles |
| `cursor/rules-hints-7179` | #6 | RulesHint panels |
| `cursor/empire-tutorial-7179` | #7 | Tableau tracking + tutorial A |

Reconcile with `main` before treating this table as current.

---

## Product copy decisions

- **“Tableau”** in UI vs user term **“empire size”** — code uses `tableauSize`; UI strings say “Tableau” with hint that start world = 1.
- **“Score tracker”** renamed from VP-only tracker when tableau added.
- App tagline on home: one table, multi-device or pass-and-play.

---

## Technical debt spotted

- `rulesHints.ts` `vp` case strings should stay valid TS (watch for broken quotes after manual edits).
- `getAvailablePhases(expansions)` does not take `playerCount` — duplicate develop/settle tiles may show in 3–4p until roadmap fix.
- No automated tests for scoring end-game logic yet.

---

## If you continue as an agent

1. Read [docs/README.md](./README.md) and [architecture.md](./architecture.md).
2. Run `npm run generate` before claiming done.
3. For tutorial work, start from [tutorial-mode.md](./tutorial-mode.md) phase B.
4. Cloud agent: branch prefix `cursor/<name>-7179`, PR against `main`, push before summary.
