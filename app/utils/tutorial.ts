import type { Player } from '~/types/game'
import type { PhaseDefinition } from '~/utils/phases'

/** Plain-language reminders shown when tutorial mode is on. */
export const TUTORIAL_CORE_CONCEPT =
  'Everything in the game is a card.'

export const TUTORIAL_CARD_BASICS: { term: string; detail: string }[] = [
  { term: 'Planets', detail: 'Circle cards.' },
  { term: 'Developments', detail: 'Diamond cards.' },
  { term: 'Money', detail: 'Any card you discard from your hand to pay for something.' },
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
    'Draw cards from the deck to find new planets (circles) and developments (diamonds).',
  develop:
    'Play a diamond from your hand by discarding other hand cards as money.',
  settle:
    'Play a circle from your hand — pay with discarded cards as money, or use your empire’s military strength.',
  consume:
    'Discard face-down cargo from your planets to gain new cards or victory points.',
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
