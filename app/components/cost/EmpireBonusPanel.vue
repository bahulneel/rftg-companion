<script setup lang="ts">
import type { EmpireBonus } from '~/types/game'
import { EMPIRE_BONUS_PRESETS, formatModifierSummary, newEmpireBonusId } from '~/utils/cardCost'

const props = defineProps<{
  bonuses: EmpireBonus[]
  editable: boolean
}>()

const emit = defineEmits<{
  'update:bonuses': [bonuses: EmpireBonus[]]
}>()

const showPresets = ref(false)

function addPreset(preset: (typeof EMPIRE_BONUS_PRESETS)[number]) {
  emit('update:bonuses', [
    ...props.bonuses,
    { ...preset, id: newEmpireBonusId() },
  ])
  showPresets.value = false
}

function removeBonus(id: string) {
  emit('update:bonuses', props.bonuses.filter((bonus) => bonus.id !== id))
}

function clearAll() {
  emit('update:bonuses', [])
}
</script>

<template>
  <div class="rounded-xl border border-space-600 bg-space-800/40 p-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-sm font-semibold text-slate-200">Empire bonuses</p>
        <p class="mt-0.5 text-xs text-slate-500">
          Cards in your empire that change costs or military. Saved for the whole game.
        </p>
      </div>
      <button
        v-if="editable && bonuses.length > 0"
        type="button"
        class="shrink-0 text-xs text-slate-500 underline hover:text-slate-300"
        @click="clearAll"
      >
        Clear all
      </button>
    </div>

    <ul v-if="bonuses.length > 0" class="mt-3 space-y-1.5">
      <li
        v-for="bonus in bonuses"
        :key="bonus.id"
        class="flex items-center justify-between gap-2 rounded-lg bg-space-900/60 px-2.5 py-2 text-sm"
      >
        <div class="min-w-0">
          <span class="text-slate-300">{{ bonus.label }}</span>
          <p class="text-xs text-slate-500">{{ formatModifierSummary(bonus) }}</p>
        </div>
        <button
          v-if="editable"
          type="button"
          class="shrink-0 text-slate-500 hover:text-slate-200"
          aria-label="Remove"
          @click="removeBonus(bonus.id)"
        >
          ✕
        </button>
      </li>
    </ul>
    <p v-else class="mt-3 text-sm text-slate-500">
      None yet — add bonuses from developments and worlds already in your empire.
    </p>

    <div v-if="editable" class="mt-3 space-y-2">
      <button
        type="button"
        class="w-full rounded-lg border border-dashed border-space-500 py-2 text-sm font-medium text-nebula-300 hover:border-nebula-400/50"
        @click="showPresets = !showPresets"
      >
        + Add empire bonus
      </button>
      <div v-if="showPresets" class="space-y-1">
        <button
          v-for="(preset, index) in EMPIRE_BONUS_PRESETS"
          :key="index"
          type="button"
          class="w-full rounded-lg bg-space-900/80 px-3 py-2 text-left text-sm hover:bg-space-800"
          @click="addPreset(preset)"
        >
          <span class="text-slate-300">{{ preset.label }}</span>
          <span class="mt-0.5 block text-xs text-slate-500">{{ formatModifierSummary(preset) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
