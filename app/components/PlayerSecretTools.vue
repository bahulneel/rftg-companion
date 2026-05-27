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
</script>

<template>
  <div class="space-y-3">
    <CostModifierPanel
      :modifiers="modifiers"
      :editable="editable"
      @update:modifiers="emit('update:modifiers', $event)"
    />

    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-phase-develop/40 bg-phase-develop/10 py-3 text-sm font-semibold text-phase-develop transition hover:bg-phase-develop/20"
      @click="calculatorOpen = true"
    >
      <span aria-hidden="true" class="text-base">◇</span>
      Card cost calculator
    </button>

    <CardCostCalculatorDrawer
      :open="calculatorOpen"
      :modifiers="modifiers"
      @close="calculatorOpen = false"
    />
  </div>
</template>
