import type { GameScreen } from '~/types/game'

export interface RulesHintItem {
  text: string
}

export interface RulesHintContext {
  playerCount?: number
  actionPickLimit?: number
}

/** Short reminders for rules players often forget (RFTG 2e). */
export function getRulesHints(
  screen: GameScreen | 'vp',
  context: RulesHintContext = {},
): RulesHintItem[] {
  const pickLimit = context.actionPickLimit
    ?? (context.playerCount === 2 ? 2 : 1)

  switch (screen) {
    case 'lobby':
      return [
        { text: 'Each round, players secretly choose action card(s); only chosen phases happen.' },
        { text: 'At round end, discard down to 10 cards in hand (face-down).' },
        { text: 'Game ends when a player has 12+ cards in their empire or the VP chip supply runs out — finish that round.' },
      ]
    case 'select':
      return [
        ...(pickLimit === 2
          ? [{ text: 'Experienced 2-player: each player chooses 2 action cards this round.' }]
          : [{ text: 'Each player chooses 1 action card; only selected phases are performed.' }]),
        { text: 'If several players pick the same phase, it still runs once — each chooser gets that phase’s bonus.' },
        { text: 'Phases resolve in order: Explore → Develop → Settle → Consume → Produce.' },
        { text: 'After phases end, everyone discards to a 10-card hand limit before the next round.' },
      ]
    case 'reveal':
      return [
        { text: 'Resolve phases in order (Explore through Produce). Skip phases no one chose.' },
        { text: 'Everyone may act in each phase; only the player(s) who chose it get the bonus.' },
        { text: 'Round end: discard to 10 cards in hand, then reclaim your action card(s).' },
        { text: 'Empire limit: 12+ cards in a player’s empire can end the game that round.' },
      ]
    case 'vp':
      return [
        { text: 'VP chips and hand sizes are open information — others may ask to see them.' },
        { text: 'When chips in the supply are gone, finish the round; use 10-value chips if needed in the final Consume.' },
        { text: 'Track empire size here (start world = 1). Game ends at 12+ cards or when total VP chips taken exceed the pool.' },
        { text: 'Chip VP here is separate from VP on cards — add world and development VP at game end.' },
      ]
    case 'scoring':
      return [
        { text: 'Final score: VP on your cards + VP chips + any end-game development bonuses (e.g. 6-cost developments).' },
        { text: 'Tie-breaker: most goods on worlds, then most cards in hand.' },
      ]
    default:
      return []
  }
}
