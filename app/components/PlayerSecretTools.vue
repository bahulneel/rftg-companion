<script setup lang="ts">
import type { CostModifier } from '~/types/game'

defineProps<{
  modifiers: CostModifier[]
  editable: boolean
}>()

const emit = defineEmits<{
  'update:modifiers': [modifiers: CostModifier[]]
}>()

const calculatorOpen = ref(false)

function openCalculator() {
  calculatorOpen.value = true
}

function closeCalculator() {
  calculatorOpen.value = false
}
</script>

<template>
  <div class="space-y-3">
    <CostModifierPanel
      :modifiers="modifiers"
      :editable="editable"
      @update:modifiers="emit('update:modifiers', $event)"
    />

    <CardCostCalculatorDrawer
      :open="calculatorOpen"
      :modifiers="modifiers"
      @close="closeCalculator"
    />

    <!-- Fixed trigger: stays visible above scroll; left side avoids the VP tracker on the right -->
    <button
      type="button"
      class="fixed bottom-4 left-4 z-40 flex max-w-[min(100vw-2rem,14rem)] flex-col items-start rounded-full border border-phase-develop/40 bg-space-800 px-4 py-2.5 text-left shadow-lg shadow-black/40 transition hover:border-phase-develop/60 hover:bg-space-700"
      :class="calculatorOpen ? 'ring-2 ring-phase-develop/50' : ''"
      aria-haspopup="dialog"
      :aria-expanded="calculatorOpen"
      @click="calculatorOpen ? closeCalculator() : openCalculator()"
    >
      <span class="text-sm font-semibold text-phase-develop">Card cost helper</span>
      <span class="text-xs text-slate-400">Tap symbols, see what you pay</span>
    </button>
  </div>
</template>
