import type { Expansions, PhaseId, RevealedPhase, RevealedPhaseParticipant } from '~/types/game'

export interface PhaseDefinition {
  id: PhaseId
  label: string
  shortLabel: string
  description: string
  group: 'explore' | 'develop' | 'settle' | 'consume' | 'produce' | 'expansion'
  colorClass: string
  requiresExpansion?: keyof Expansions
}

export const PHASES: PhaseDefinition[] = [
  {
    id: 'explore-11',
    label: 'Explore (+1/+1)',
    shortLabel: '+1/+1',
    description: 'Draw 3 cards, keep 2',
    group: 'explore',
    colorClass: 'bg-phase-explore/20 border-phase-explore text-phase-explore',
  },
  {
    id: 'explore-vp5',
    label: 'Explore (viche/+5)',
    shortLabel: 'viche/+5',
    description: 'Draw 7 cards, keep 1',
    group: 'explore',
    colorClass: 'bg-phase-explore/20 border-phase-explore text-phase-explore',
  },
  {
    id: 'develop',
    label: 'Develop',
    shortLabel: 'Develop',
    description: 'Play a diamond development card (−1 cost bonus)',
    group: 'develop',
    colorClass: 'bg-phase-develop/20 border-phase-develop text-phase-develop',
  },
  {
    id: 'develop-2',
    label: 'Develop',
    shortLabel: 'Develop',
    description: 'Play a diamond development card (−1 cost bonus)',
    group: 'develop',
    colorClass: 'bg-phase-develop/20 border-phase-develop text-phase-develop',
  },
  {
    id: 'settle',
    label: 'Settle',
    shortLabel: 'Settle',
    description: 'Play a circle world card (−1 cost if military, or draw after if non-military)',
    group: 'settle',
    colorClass: 'bg-phase-settle/20 border-phase-settle text-phase-settle',
  },
  {
    id: 'settle-2',
    label: 'Settle',
    shortLabel: 'Settle',
    description: 'Play a circle world card (−1 cost if military, or draw after if non-military)',
    group: 'settle',
    colorClass: 'bg-phase-settle/20 border-phase-settle text-phase-settle',
  },
  {
    id: 'consume-trade',
    label: 'Consume ($ Trade)',
    shortLabel: '$ Trade',
    description: 'Sell 1 good for card draw before consuming',
    group: 'consume',
    colorClass: 'bg-phase-consume/20 border-phase-consume text-phase-consume',
  },
  {
    id: 'consume-x2',
    label: 'Consume (×2 VPs)',
    shortLabel: '×2 VPs',
    description: 'Double all VP chips gained this phase',
    group: 'consume',
    colorClass: 'bg-phase-consume/20 border-phase-consume text-phase-consume',
  },
  {
    id: 'produce',
    label: 'Produce',
    shortLabel: 'Produce',
    description: 'Place goods on all empty production worlds',
    group: 'produce',
    colorClass: 'bg-phase-produce/20 border-phase-produce text-phase-produce',
  },
  {
    id: 'search',
    label: 'Search / Repair',
    shortLabel: 'Search',
    description: 'Search for cards (Gathering Storm)',
    group: 'expansion',
    colorClass: 'bg-phase-expansion/20 border-phase-expansion text-phase-expansion',
    requiresExpansion: 'gatheringStorm',
  },
  {
    id: 'repair',
    label: 'Repair',
    shortLabel: 'Repair',
    description: 'Repair a damaged world (Rebel vs Imperium)',
    group: 'expansion',
    colorClass: 'bg-phase-expansion/20 border-phase-expansion text-phase-expansion',
    requiresExpansion: 'rebelVsImperium',
  },
]

/** Strict game order for reveal screen */
export const PHASE_ORDER: PhaseId[] = [
  'explore-11',
  'explore-vp5',
  'develop',
  'settle',
  'consume-trade',
  'consume-x2',
  'produce',
  'search',
  'repair',
]

export function getAvailablePhases(expansions: Expansions): PhaseDefinition[] {
  return PHASES.filter((p) => !p.requiresExpansion || expansions[p.requiresExpansion])
}

export function getPhaseLimit(playerCount: number): number {
  return playerCount === 2 ? 2 : 1
}

export function getPhaseById(id: PhaseId): PhaseDefinition {
  const phase = PHASES.find((p) => p.id === id)
  if (!phase) throw new Error(`Unknown phase: ${id}`)
  return phase
}

const DEVELOP_PHASE_IDS: PhaseId[] = ['develop', 'develop-2']
const SETTLE_PHASE_IDS: PhaseId[] = ['settle', 'settle-2']

function countPhasesInGroup(phases: PhaseId[], groupIds: PhaseId[]): number {
  return phases.filter((id) => groupIds.includes(id)).length
}

/** Develop/settle stacks: N entries where N = max selections in that group across players. */
function buildStackedGroupPhases(
  groupIds: PhaseId[],
  selections: Record<string, PhaseId[]>,
  playerNames: Record<string, string>,
): RevealedPhase[] {
  const counts = Object.entries(selections).map(([playerId, phases]) => ({
    id: playerId,
    name: playerNames[playerId] ?? 'Unknown',
    count: countPhasesInGroup(phases, groupIds),
  }))
  const maxCount = Math.max(0, ...counts.map((entry) => entry.count))
  if (maxCount === 0) return []

  return groupIds.slice(0, maxCount).map((id, index) => ({
    id,
    players: counts
      .filter((entry) => entry.count >= index + 1)
      .map((entry): RevealedPhaseParticipant => ({ id: entry.id, name: entry.name })),
  }))
}

export function buildRevealedPhases(
  selections: Record<string, PhaseId[]>,
  playerNames: Record<string, string>,
): RevealedPhase[] {
  const phaseToPlayers = new Map<PhaseId, RevealedPhaseParticipant[]>()

  for (const [playerId, phases] of Object.entries(selections)) {
    for (const phaseId of phases) {
      if (DEVELOP_PHASE_IDS.includes(phaseId) || SETTLE_PHASE_IDS.includes(phaseId)) continue
      const existing = phaseToPlayers.get(phaseId) ?? []
      existing.push({ id: playerId, name: playerNames[playerId] ?? 'Unknown' })
      phaseToPlayers.set(phaseId, existing)
    }
  }

  const revealed: RevealedPhase[] = []

  for (const id of PHASE_ORDER) {
    if (id === 'develop') {
      revealed.push(...buildStackedGroupPhases(DEVELOP_PHASE_IDS, selections, playerNames))
    } else if (id === 'settle') {
      revealed.push(...buildStackedGroupPhases(SETTLE_PHASE_IDS, selections, playerNames))
    } else if (phaseToPlayers.has(id)) {
      revealed.push({ id, players: phaseToPlayers.get(id)! })
    }
  }

  return revealed
}
