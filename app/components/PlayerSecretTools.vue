<script setup lang="ts">
import type { EmpireBonus } from '~/types/game'

defineProps<{
  empireBonuses: EmpireBonus[]
  editable: boolean
}>()

const emit = defineEmits<{
  'update:empireBonuses': [bonuses: EmpireBonus[]]
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
  <div>
    <EmpireBonusPanel
      :bonuses="empireBonuses"
      :editable="editable"
      @update:bonuses="emit('update:empireBonuses', $event)"
    />

    <CardCostCalculatorDrawer
      :open="calculatorOpen"
      :empire-bonuses="empireBonuses"
      @close="closeCalculator"
    />

    <!-- Teleported so VP sheet / scroll layout cannot block taps -->
    <Teleport to="body">
      <button
        type="button"
        class="fixed bottom-20 left-4 z-[100] flex max-w-[min(100vw-2rem,14rem)] flex-col items-start rounded-full border border-phase-develop/40 bg-space-800 px-4 py-2.5 text-left shadow-lg shadow-black/40 transition hover:border-phase-develop/60 hover:bg-space-700"
        :class="calculatorOpen ? 'ring-2 ring-phase-develop/50' : ''"
        aria-haspopup="dialog"
        :aria-expanded="calculatorOpen"
        @click="calculatorOpen ? closeCalculator() : openCalculator()"
      >
        <span class="text-sm font-semibold text-phase-develop">Card cost calculator</span>
        <span class="text-xs text-slate-400">Quick check before you pick phases</span>
      </button>
    </Teleport>
  </div>
</template>
