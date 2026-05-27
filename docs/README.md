# Documentation

Design and implementation notes for the RFTG Digital Companion. These files capture decisions and context that do not belong in code comments alone — especially work discussed in agent sessions that might not appear in git history as a single spec.

## Start here

| If you want to… | Read |
|-----------------|------|
| Understand what the app is *for* | [product-scope.md](./product-scope.md) |
| See how state and multiplayer work | [architecture.md](./architecture.md) |
| Verify rules behavior vs RFTG 2e | [rules-reference.md](./rules-reference.md) |
| Extend tutorial mode | [tutorial-mode.md](./tutorial-mode.md) |
| Pick up the next feature | [roadmap.md](./roadmap.md) |
| Know *why* something was built a certain way | [decisions.md](./decisions.md) |
| Recover session / PR context | [session-notes.md](./session-notes.md) |

## Code map (quick reference)

| Area | Path |
|------|------|
| Game state & actions | `app/types/game.ts` |
| Reducer / dispatch | `app/stores/game.ts` |
| Phase definitions & reveal order | `app/utils/phases.ts` |
| VP pool, tableau, end game, tie-break | `app/utils/scoring.ts` |
| Who may dispatch what | `app/utils/permissions.ts` |
| UI rules copy | `app/utils/rulesHints.ts` |
| Tutorial blurbs | `app/utils/tutorial.ts` |
| Session orchestration | `app/composables/usePeerGameController.ts` |
| Pass-and-play | `app/composables/usePassAndPlay.ts` |

## Keeping docs current

When you merge behavior changes:

1. Update [rules-reference.md](./rules-reference.md) if end-game, phases, or scoring logic changes.
2. Add a short entry to [decisions.md](./decisions.md) for non-obvious choices.
3. Move completed items in [roadmap.md](./roadmap.md) or delete them with a link to the PR.
