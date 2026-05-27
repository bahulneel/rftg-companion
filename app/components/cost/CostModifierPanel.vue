<script setup lang="ts">
import type { CostModifier } from '~/types/game'
import { COST_MODIFIER_PRESETS, newCostModifierId } from '~/utils/cardCost'

const props = defineProps<{
  modifiers: CostModifier[]
  editable: boolean
}>()

const emit = defineEmits<{
  'update:modifiers': [modifiers: CostModifier[]]
}>()

const showPresets = ref(false)

function addPreset(preset: (typeof COST_MODIFIER_PRESETS)[number]) {
  emit('update:modifiers', [
    ...props.modifiers,
    { ...preset, id: newCostModifierId() },
  ])
  showPresets.value = false
}

function removeModifier(id: string) {
  emit('update:modifiers', props.modifiers.filter((mod) => mod.id !== id))
}

function clearAll() {
  emit('update:modifiers', [])
}
</script>

<template>
  <div class="rounded-xl border border-space-600 bg-space-800/40 p-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-sm font-semibold text-slate-200">Your cost modifiers</p>
        <p class="mt-0.5 text-xs text-slate-500">
          Phase bonuses and table effects — used by the calculator below.
        </p>
      </div>
      <button
        v-if="editable && modifiers.length > 0"
        type="button"
        class="shrink-0 text-xs text-slate-500 underline hover:text-slate-300"
        @click="clearAll"
      >
        Clear
      </button>
    </div>

    <ul v-if="modifiers.length > 0" class="mt-3 space-y-1.5">
      <li
        v-for="mod in modifiers"
        :key="mod.id"
        class="flex items-center justify-between gap-2 rounded-lg bg-space-900/60 px-2.5 py-2 text-sm"
      >
        <span class="text-slate-300">{{ mod.label }}</span>
        <span class="shrink-0 text-xs text-slate-500">
          <template v-if="mod.discardDelta !== 0">
            {{ mod.discardDelta > 0 ? '+' : '' }}{{ mod.discardDelta }} discard
          </template>
          <template v-if="mod.discardDelta !== 0 && mod.militaryDelta !== 0"> · </template>
          <template v-if="mod.militaryDelta !== 0">
            {{ mod.militaryDelta > 0 ? '+' : '' }}{{ mod.militaryDelta }} mil
          </template>
        </span>
        <button
          v-if="editable"
          type="button"
          class="shrink-0 text-slate-500 hover:text-slate-200"
          aria-label="Remove modifier"
          @click="removeModifier(mod.id)"
        >
          ✕
        </button>
      </li>
    </ul>
    <p v-else class="mt-3 text-sm text-slate-500">No modifiers yet — add phase bonuses you chose or have in play.</p>

    <div v-if="editable" class="mt-3">
      <button
        type="button"
        class="w-full rounded-lg border border-dashed border-space-500 py-2 text-sm font-medium text-nebula-300 hover:border-nebula-400/50"
        @click="showPresets = !showPresets"
      >
        + Add modifier
      </button>
      <div v-if="showPresets" class="mt-2 space-y-1">
        <button
          v-for="(preset, index) in COST_MODIFIER_PRESETS"
          :key="index"
          type="button"
          class="w-full rounded-lg bg-space-900/80 px-3 py-2 text-left text-sm text-slate-300 hover:bg-space-800"
          @click="addPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
  </div>
</template>
