<script setup lang="ts">
import type { Expansions } from '~/types/game'

const expansions = defineModel<Expansions>({ required: true })
const { disabled = false } = defineProps<{ disabled?: boolean }>()

const toggles = [
  { key: 'gatheringStorm' as const, label: 'Gathering Storm', desc: 'Adds Search phase' },
  { key: 'rebelVsImperium' as const, label: 'Rebel vs Imperium', desc: 'Adds Repair phase' },
  { key: 'prestige' as const, label: 'Prestige', desc: 'Prestige Points scoring' },
  { key: 'goals' as const, label: 'Goals', desc: 'Goal tile scoring' },
]
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
      Expansions
    </h3>
    <label
      v-for="toggle in toggles"
      :key="toggle.key"
      class="flex items-center justify-between rounded-xl border border-space-600 bg-space-800/50 px-4 py-3"
      :class="{ 'opacity-50': disabled }"
    >
      <div>
        <p class="font-medium text-slate-100">{{ toggle.label }}</p>
        <p class="text-xs text-slate-400">{{ toggle.desc }}</p>
      </div>
      <input
        v-model="expansions[toggle.key]"
        type="checkbox"
        :disabled="disabled"
        class="h-5 w-5 rounded border-space-600 bg-space-700 text-nebula-400 focus:ring-nebula-400"
      />
    </label>
  </div>
</template>
