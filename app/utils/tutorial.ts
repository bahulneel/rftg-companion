import type { Player } from '~/types/game'
import type { PhaseDefinition } from '~/utils/phases'

/** Plain-language reminders shown when tutorial mode is on. */
export const TUTORIAL_CORE_CONCEPT =
  'Everything in the game is a card.'

export const TUTORIAL_CARD_BASICS: { term: string; detail: string }[] = [
  { term: 'Planets', detail: 'Cards with a circular cost icon.' },
  { term: 'Developments', detail: 'Cards with a diamond-shaped cost icon.' },
  { term: 'Payment', detail: 'Cards you discard from your hand to pay a cost.' },
  { term: 'Cargo (goods)', detail: 'A card placed face-down under a planet card.' },
]

export const TUTORIAL_PHASE_TITLES: Record<PhaseDefinition['group'], string> = {
  explore: 'Explore',
  develop: 'Develop',
  settle: 'Settle',
  consume: 'Consume',
  produce: 'Produce',
  expansion: 'Expansion',
}

/** One-line phase reminders (tutorial picker + selection hint). */
export const TUTORIAL_GROUP_BLURBS: Record<PhaseDefinition['group'], string> = {
  explore:
    'Draw cards from the deck to find new planets and developments.',
  develop:
    'Play a development by discarding hand cards as payment.',
  settle:
    'Play a world — pay with discarded hand cards, or use your empire’s military strength.',
  consume:
    'Consume or trade cargo from your planets for cards/VP. See Trade quick reference for cargo rates.',
  produce:
    'Place a card face-down as cargo under an empty production planet.',
  expansion:
    'Expansion-specific phase — check your expansion rules for Search or Repair.',
}

export function isSessionTutorialEnabled(players: Player[]): boolean {
  return players.some((player) => player.tutorialEnabled)
}

export function isPlayerTutorialEnabled(
  players: Player[],
  playerId: string | null,
): boolean {
  if (!playerId) return isSessionTutorialEnabled(players)
  const player = players.find((entry) => entry.id === playerId)
  return player?.tutorialEnabled ?? false
}
