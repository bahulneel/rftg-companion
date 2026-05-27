import type { Player } from '~/types/game'
import type { PhaseDefinition } from '~/utils/phases'

export const TUTORIAL_GROUP_BLURBS: Record<PhaseDefinition['group'], string> = {
  explore:
    'Draw from the deck and keep cards. Use this to find worlds to settle or developments to build.',
  develop:
    'Pay the cost to play a development from your hand. The bonus discounts one diamond development by 1 card.',
  settle:
    'Play a world from your hand into your empire. Military worlds cost less; non-military may let you draw after.',
  consume:
    'Trade a good for cards, then run consume powers for VP chips. ×2 doubles chip gains this phase.',
  produce:
    'Place goods on worlds that produce and have no good yet.',
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
