<script setup lang="ts">
import type { CostCalculation } from '~/utils/cardCost'

defineProps<{
  calculation: CostCalculation
  tone?: 'muted' | 'empire' | 'phase'
}>()
</script>

<template>
  <div class="space-y-2 text-sm">
    <p v-if="calculation.hasOrChoice" class="text-slate-400">
      This card offers a choice — pick one way to pay:
    </p>
    <div
      v-for="(option, optionIndex) in calculation.options"
      :key="optionIndex"
      class="space-y-2 rounded-lg px-1 py-1"
      :class="tone === 'empire' ? 'bg-space-900/40' : ''"
    >
      <p v-if="calculation.hasOrChoice" class="text-xs font-medium uppercase text-slate-500">
        Option {{ optionIndex + 1 }}
      </p>
      <div v-if="option.discardRequired !== null" class="flex items-center gap-3">
        <CostIconGlyph
          :token="{ id: `d-${optionIndex}`, type: 'discard', value: option.discardRequired }"
          size="sm"
          :interactive="false"
        />
        <div>
          <p class="font-medium text-slate-200">
            Discard
            <span :class="tone === 'empire' ? 'text-star-400' : 'text-slate-100'">
              {{ option.effectiveDiscard }}
            </span>
            <span
              v-if="option.discardRequired !== option.effectiveDiscard"
              class="text-slate-500"
            >
              (card shows {{ option.discardRequired }})
            </span>
          </p>
          <p class="text-xs text-slate-500">cards from your hand</p>
        </div>
      </div>
      <div v-if="option.militaryRequired !== null" class="flex items-center gap-3">
        <CostIconGlyph
          :token="{ id: `m-${optionIndex}`, type: 'military', value: option.militaryRequired }"
          size="sm"
          :interactive="false"
        />
        <div>
          <p class="font-medium text-slate-200">
            Military
            <span :class="tone === 'empire' ? 'text-star-400' : 'text-slate-100'">
              {{ option.effectiveMilitary }}
            </span>
            <span
              v-if="option.militaryRequired !== option.effectiveMilitary"
              class="text-slate-500"
            >
              (card shows {{ option.militaryRequired }})
            </span>
          </p>
          <p class="text-xs text-slate-500">strength from your empire</p>
        </div>
      </div>
    </div>
  </div>
</template>
