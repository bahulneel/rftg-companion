import type { Expansions, Player, ScoreInput } from '~/types/game'

export interface RankedPlayer {
  id: string
  name: string
  total: number
  breakdown: ScoreInput
  rank: number
}

export function totalScore(score: ScoreInput, expansions: Expansions): number {
  let total = score.vpChips + score.cardFaceValue + score.devBonuses
  if (expansions.prestige) total += score.prestigePoints
  if (expansions.goals) total += score.goalPoints
  return total
}

export function defaultScoreInput(vpChips = 0): ScoreInput {
  return {
    vpChips,
    cardFaceValue: 0,
    devBonuses: 0,
    prestigePoints: 0,
    goalPoints: 0,
    cardsInHand: 0,
    goodsOnWorlds: 0,
    submitted: false,
  }
}

/** RFTG tiebreaker: most goods, then most cards in hand */
function compareTiebreak(a: ScoreInput, b: ScoreInput): number {
  if (b.goodsOnWorlds !== a.goodsOnWorlds) return b.goodsOnWorlds - a.goodsOnWorlds
  return b.cardsInHand - a.cardsInHand
}

export function rankPlayers(
  players: Player[],
  scores: Record<string, ScoreInput>,
  expansions: Expansions,
): RankedPlayer[] {
  const ranked = players
    .map((p) => ({
      id: p.id,
      name: p.name,
      breakdown: scores[p.id] ?? defaultScoreInput(p.vpChips),
      total: totalScore(scores[p.id] ?? defaultScoreInput(p.vpChips), expansions),
      rank: 0,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      return compareTiebreak(a.breakdown, b.breakdown)
    })

  let rank = 1
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0) {
      const prev = ranked[i - 1]!
      const curr = ranked[i]!
      const tied =
        curr.total === prev.total &&
        compareTiebreak(curr.breakdown, prev.breakdown) === 0
      if (!tied) rank = i + 1
    }
    ranked[i]!.rank = rank
  }

  return ranked
}

export function vpPoolForPlayerCount(count: number): number {
  return count * 12
}
