import type { CostModifier } from '~/types/game'

export type { CostModifier }

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

export const COST_MODIFIER_PRESETS: Omit<CostModifier, 'id'>[] = [
  { label: 'You chose Develop', discardDelta: -1, militaryDelta: 0 },
  { label: 'You chose Settle (pay fewer cards)', discardDelta: -1, militaryDelta: 0 },
  { label: 'You chose Settle (less military)', discardDelta: 0, militaryDelta: -1 },
  { label: 'Levy on a world', discardDelta: -1, militaryDelta: 0 },
  { label: '+1 military from a card', discardDelta: 0, militaryDelta: 1 },
]

/** Short plain-English summary for lists. */
export function formatModifierSummary(mod: CostModifier): string {
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

export function newCostModifierId(): string {
  costTokenCounter += 1
  return `mod-${Date.now()}-${costTokenCounter}`
}

export function defaultCostPlanning(): { modifiers: CostModifier[] } {
  return { modifiers: [] }
}

function applyModifierFloor(value: number): number {
  return Math.max(0, value)
}

export function sumModifierDeltas(modifiers: CostModifier[]): {
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

/** Read a composed icon strip and apply tracked modifiers. */
export function calculateCost(
  tokens: CostIconToken[],
  modifiers: CostModifier[],
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
