import type { EmpireBonus } from '~/types/game'

export type { EmpireBonus }

/** Building blocks that mirror symbols on RFTG card cost strips. */
export type CostIconType = 'discard' | 'military' | 'or'

export interface CostIconToken {
  id: string
  type: CostIconType
  /** Discard count or military strength required (ignored for `or`). */
  value: number
}

export interface CostPaymentOption {
  discardRequired: number | null
  militaryRequired: number | null
  effectiveDiscard: number | null
  effectiveMilitary: number | null
}

export interface CostCalculation {
  options: CostPaymentOption[]
  hasOrChoice: boolean
  modifierNotes: string[]
  /** @deprecated use options — first segment totals for simple display */
  discardRequired: number | null
  militaryRequired: number | null
  effectiveDiscard: number | null
  effectiveMilitary: number | null
}

/** Presets for bonuses from cards already in the player's empire. */
export const EMPIRE_BONUS_PRESETS: Omit<EmpireBonus, 'id'>[] = [
  { label: '−1 cost from a development', discardDelta: -1, militaryDelta: 0 },
  { label: 'Levy on a world (−1 discard)', discardDelta: -1, militaryDelta: 0 },
  { label: '+1 military from a card', discardDelta: 0, militaryDelta: 1 },
  { label: '−1 military from a card', discardDelta: 0, militaryDelta: -1 },
  { label: 'Pay 1 more to play (penalty)', discardDelta: 1, militaryDelta: 0 },
]

/** Phase you might call this round — shown in the calculator only, not stored. */
export interface PhaseCostScenario {
  id: string
  label: string
  discardDelta: number
  militaryDelta: number
  appliesWhen: 'discard' | 'military' | 'any'
}

export const PHASE_COST_SCENARIOS: PhaseCostScenario[] = [
  {
    id: 'develop',
    label: 'If you call Develop',
    discardDelta: -1,
    militaryDelta: 0,
    appliesWhen: 'discard',
  },
  {
    id: 'settle-discard',
    label: 'If you call Settle (pay with cards)',
    discardDelta: -1,
    militaryDelta: 0,
    appliesWhen: 'discard',
  },
  {
    id: 'settle-military',
    label: 'If you call Settle (pay with military)',
    discardDelta: 0,
    militaryDelta: -1,
    appliesWhen: 'military',
  },
]

export interface CostBreakdown {
  printed: CostCalculation
  withEmpire: CostCalculation
  phaseScenarios: Array<{
    scenario: PhaseCostScenario
    result: CostCalculation
  }>
  hasDiscardCost: boolean
  hasMilitaryCost: boolean
}

/** Short plain-English summary for lists. */
export function formatModifierSummary(mod: Pick<EmpireBonus, 'discardDelta' | 'militaryDelta'>): string {
  const parts: string[] = []
  if (mod.discardDelta < 0) {
    const n = Math.abs(mod.discardDelta)
    parts.push(`pay ${n} fewer card${n === 1 ? '' : 's'}`)
  } else if (mod.discardDelta > 0) {
    parts.push(`pay ${mod.discardDelta} more card${mod.discardDelta === 1 ? '' : 's'}`)
  }
  if (mod.militaryDelta < 0) {
    const n = Math.abs(mod.militaryDelta)
    parts.push(`need ${n} less military`)
  } else if (mod.militaryDelta > 0) {
    parts.push(`need ${mod.militaryDelta} more military`)
  }
  return parts.length > 0 ? parts.join(', ') : 'no change'
}

let costTokenCounter = 0

export function newCostTokenId(): string {
  costTokenCounter += 1
  return `cost-${Date.now()}-${costTokenCounter}`
}

export function newEmpireBonusId(): string {
  costTokenCounter += 1
  return `bonus-${Date.now()}-${costTokenCounter}`
}

/** @deprecated use newEmpireBonusId */
export const newCostModifierId = newEmpireBonusId

export function defaultCostPlanning(): PlayerCostPlanningShape {
  return { empireBonuses: [] }
}

interface PlayerCostPlanningShape {
  empireBonuses: EmpireBonus[]
}

export function normalizeCostPlanning(
  planning: { empireBonuses?: EmpireBonus[]; modifiers?: EmpireBonus[] } | undefined,
): PlayerCostPlanningShape {
  if (!planning) return defaultCostPlanning()
  return {
    empireBonuses: planning.empireBonuses ?? planning.modifiers ?? [],
  }
}

function applyModifierFloor(value: number): number {
  return Math.max(0, value)
}

export function sumModifierDeltas(modifiers: EmpireBonus[]): {
  discardDelta: number
  militaryDelta: number
  notes: string[]
} {
  let discardDelta = 0
  let militaryDelta = 0
  const notes: string[] = []
  for (const mod of modifiers) {
    discardDelta += mod.discardDelta
    militaryDelta += mod.militaryDelta
    if (mod.discardDelta !== 0 || mod.militaryDelta !== 0) {
      notes.push(`${mod.label} — ${formatModifierSummary(mod)}`)
    }
  }
  return { discardDelta, militaryDelta, notes }
}

function splitCostSegments(tokens: CostIconToken[]): CostIconToken[][] {
  const segments: CostIconToken[][] = [[]]
  for (const token of tokens) {
    if (token.type === 'or') {
      segments.push([])
    } else {
      segments[segments.length - 1]!.push(token)
    }
  }
  return segments.filter((segment) => segment.length > 0)
}

function segmentTotals(segment: CostIconToken[]): {
  discardRequired: number | null
  militaryRequired: number | null
} {
  let discardRequired: number | null = null
  let militaryRequired: number | null = null
  for (const token of segment) {
    if (token.type === 'discard') {
      discardRequired = (discardRequired ?? 0) + token.value
    }
    if (token.type === 'military') {
      militaryRequired = (militaryRequired ?? 0) + token.value
    }
  }
  return { discardRequired, militaryRequired }
}

function tokensHaveCostKind(tokens: CostIconToken[], kind: 'discard' | 'military'): boolean {
  return tokens.some((token) => token.type === kind)
}

function scenarioApplies(
  scenario: PhaseCostScenario,
  hasDiscardCost: boolean,
  hasMilitaryCost: boolean,
): boolean {
  if (scenario.appliesWhen === 'any') return hasDiscardCost || hasMilitaryCost
  if (scenario.appliesWhen === 'discard') return hasDiscardCost
  return hasMilitaryCost
}

/** Read a composed icon strip and apply modifier deltas. */
export function calculateCost(
  tokens: CostIconToken[],
  modifiers: EmpireBonus[] = [],
): CostCalculation {
  const { discardDelta, militaryDelta, notes } = sumModifierDeltas(modifiers)
  const segments = splitCostSegments(tokens)
  const hasOrChoice = segments.length > 1

  const options: CostPaymentOption[] = segments.map((segment) => {
    const { discardRequired, militaryRequired } = segmentTotals(segment)
    return {
      discardRequired,
      militaryRequired,
      effectiveDiscard:
        discardRequired === null
          ? null
          : applyModifierFloor(discardRequired + discardDelta),
      effectiveMilitary:
        militaryRequired === null
          ? null
          : applyModifierFloor(militaryRequired + militaryDelta),
    }
  })

  const first = options[0]
  return {
    options,
    hasOrChoice,
    discardRequired: first?.discardRequired ?? null,
    militaryRequired: first?.militaryRequired ?? null,
    effectiveDiscard: first?.effectiveDiscard ?? null,
    effectiveMilitary: first?.effectiveMilitary ?? null,
    modifierNotes: notes,
  }
}

/** Printed cost, empire-adjusted cost, and optional phase scenarios for planning. */
export function calculateCostBreakdown(
  tokens: CostIconToken[],
  empireBonuses: EmpireBonus[],
): CostBreakdown {
  const printed = calculateCost(tokens, [])
  const withEmpire = calculateCost(tokens, empireBonuses)
  const hasDiscardCost = tokensHaveCostKind(tokens, 'discard')
  const hasMilitaryCost = tokensHaveCostKind(tokens, 'military')

  const phaseScenarios = PHASE_COST_SCENARIOS.filter((scenario) =>
    scenarioApplies(scenario, hasDiscardCost, hasMilitaryCost),
  ).map((scenario) => ({
    scenario,
    result: calculateCost(tokens, [
      ...empireBonuses,
      {
        id: scenario.id,
        label: scenario.label,
        discardDelta: scenario.discardDelta,
        militaryDelta: scenario.militaryDelta,
      },
    ]),
  }))

  return {
    printed,
    withEmpire,
    phaseScenarios,
    hasDiscardCost,
    hasMilitaryCost,
  }
}
