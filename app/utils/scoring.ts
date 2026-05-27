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
    tiebreakSubmitted: false,
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

export function totalPlayerVp(players: Player[]): number {
  return players.reduce((sum, player) => sum + player.vpChips, 0)
}

export function clampVpChips(value: number): number {
  return Math.max(0, Math.floor(value))
}

/** RFTG: each player starts with one face-up start world in tableau. */
export const TABLEAU_START_SIZE = 1

/** Game ends after the round in which any player has this many+ face-up tableau cards. */
export const TABLEAU_END_GAME_SIZE = 12

export function clampTableauSize(value: number): number {
  return Math.max(0, Math.floor(value))
}

export function canAdjustTableau(current: number, delta: number): boolean {
  return current + delta >= 0
}

export function hasTableauEndGameTrigger(players: Player[]): boolean {
  return players.some((player) => player.tableauSize >= TABLEAU_END_GAME_SIZE)
}

export type EndGameTrigger = 'vp_pool' | 'tableau'

export function getEndGameTriggers(
  players: Player[],
  vpPoolInitial: number,
): EndGameTrigger[] {
  const triggers: EndGameTrigger[] = []
  if (totalPlayerVp(players) > vpPoolInitial) triggers.push('vp_pool')
  if (hasTableauEndGameTrigger(players)) triggers.push('tableau')
  return triggers
}

/** Whether a ±1 VP change is allowed for this player. */
export function canAdjustVp(current: number, delta: number): boolean {
  return current + delta >= 0
}

export interface ApplyVpResult {
  vpChips: number
  vpPool: number
  lastRound: boolean
}

/**
 * Apply a target VP chip count.
 * Gains are never blocked by an empty pool (RFTG adds reserve chips in the final round).
 * The pool tracks chips still in supply; lastRound is set when it hits zero.
 */
export function applyVpTarget(
  currentVp: number,
  targetVp: number,
  vpPool: number,
  vpPoolInitial: number,
  lastRound: boolean,
): ApplyVpResult {
  const clamped = clampVpChips(targetVp)
  const delta = clamped - currentVp
  if (delta === 0) {
    return { vpChips: currentVp, vpPool, lastRound }
  }

  if (delta > 0) {
    const fromPool = Math.min(delta, Math.max(0, vpPool))
    const nextPool = vpPool - fromPool
    return {
      vpChips: clamped,
      vpPool: nextPool,
      lastRound: lastRound || nextPool === 0,
    }
  }

  return {
    vpChips: clamped,
    vpPool: Math.min(vpPoolInitial, vpPool - delta),
    lastRound,
  }
}

/** Game ends after the round in which total VP scored exceeds the pool (not when equal). */
export function shouldEndGameAfterRound(
  players: Player[],
  vpPoolInitial: number,
): boolean {
  return totalPlayerVp(players) > vpPoolInitial
}

/** Players tied for the highest score (VP total only — before tie-breakers resolve). */
export function getVpTiedPlayerIds(
  players: Player[],
  scores: Record<string, ScoreInput>,
  expansions: Expansions,
): string[] {
  if (players.length < 2) return []

  const totals = players.map((player) => ({
    id: player.id,
    total: totalScore(scores[player.id] ?? defaultScoreInput(player.vpChips), expansions),
  }))
  const maxTotal = Math.max(...totals.map((entry) => entry.total))
  const tied = totals.filter((entry) => entry.total === maxTotal).map((entry) => entry.id)
  return tied.length >= 2 ? tied : []
}

export function needsTiebreakInput(
  players: Player[],
  scores: Record<string, ScoreInput>,
  expansions: Expansions,
): boolean {
  const tiedIds = getVpTiedPlayerIds(players, scores, expansions)
  if (tiedIds.length < 2) return false
  return tiedIds.some((id) => !scores[id]?.tiebreakSubmitted)
}

export interface TiebreakSummary {
  headline: string
  detail: string
  playerNotes: Record<string, string>
}

function winnerOverLoserReason(winner: ScoreInput, loser: ScoreInput): string {
  if (winner.goodsOnWorlds !== loser.goodsOnWorlds) {
    return `more goods on worlds (${winner.goodsOnWorlds} vs ${loser.goodsOnWorlds})`
  }
  return `more cards in hand (${winner.cardsInHand} vs ${loser.cardsInHand})`
}

function loserVsWinnerReason(loser: ScoreInput, winner: ScoreInput): string {
  if (loser.goodsOnWorlds !== winner.goodsOnWorlds) {
    return `fewer goods on worlds (${loser.goodsOnWorlds} vs ${winner.goodsOnWorlds})`
  }
  return `fewer cards in hand (${loser.cardsInHand} vs ${winner.cardsInHand})`
}

/** Human-readable explanation of how a VP tie was resolved. */
export function buildTiebreakSummary(ranked: RankedPlayer[]): TiebreakSummary | null {
  if (ranked.length < 2) return null

  const topTotal = ranked[0]!.total
  const leaders = ranked.filter((player) => player.total === topTotal)
  if (leaders.length < 2) return null
  if (!leaders.some((player) => player.breakdown.tiebreakSubmitted)) return null

  const byTiebreak = [...leaders].sort((a, b) => compareTiebreak(a.breakdown, b.breakdown))
  const best = byTiebreak[0]!.breakdown
  const winners = byTiebreak.filter((player) => compareTiebreak(player.breakdown, best) === 0)
  const playerNotes: Record<string, string> = {}

  if (winners.length === leaders.length) {
    return {
      headline: 'Tie-break did not separate the leaders',
      detail: `All leaders had ${best.goodsOnWorlds} goods on worlds and ${best.cardsInHand} cards in hand, so they share the win.`,
      playerNotes: Object.fromEntries(
        leaders.map((player) => [player.id, 'Shared win — tie-break was identical']),
      ),
    }
  }

  const topWinner = winners[0]!
  const firstLoser = byTiebreak.find((player) => compareTiebreak(player.breakdown, best) !== 0)!
  const decidingReason = winnerOverLoserReason(topWinner.breakdown, firstLoser.breakdown)

  for (const player of leaders) {
    if (compareTiebreak(player.breakdown, best) === 0) {
      playerNotes[player.id] = `Won tie-break — ${decidingReason}`
    } else {
      playerNotes[player.id] = `Lost tie-break — ${loserVsWinnerReason(player.breakdown, topWinner.breakdown)}`
    }
  }

  const headline = winners.length > 1
    ? `${winners.map((player) => player.name).join(' & ')} win the tie-break`
    : `${topWinner.name} wins the tie-break`

  return {
    headline,
    detail: `Leaders were tied on ${topTotal} VP. Official tie-break is most goods on worlds, then most cards in hand — decided by ${decidingReason}.`,
    playerNotes,
  }
}
