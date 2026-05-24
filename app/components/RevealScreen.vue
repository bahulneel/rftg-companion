<script setup lang="ts">
import type { RevealedPhase } from '~/types/game'
import { getPhaseById } from '~/utils/phases'

defineProps<{
  phases: RevealedPhase[]
  round: number
}>()

const emit = defineEmits<{ nextRound: [] }>()
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <p class="text-sm uppercase tracking-widest text-slate-400">Round {{ round }}</p>
      <h2 class="mt-1 text-2xl font-bold text-slate-100">Phase Reveal</h2>
    </div>

    <div class="space-y-3">
      <div
        v-for="phase in phases"
        :key="phase.id"
        class="rounded-xl border-2 p-4"
        :class="getPhaseById(phase.id).colorClass"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-lg font-bold">{{ getPhaseById(phase.id).label }}</p>
            <p class="mt-0.5 text-sm opacity-80">{{ getPhaseById(phase.id).description }}</p>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="name in phase.players"
            :key="name"
            class="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"
          >
            ★ {{ name }}
          </span>
        </div>
      </div>

      <p v-if="phases.length === 0" class="text-center text-slate-400">
        No phases selected this round.
      </p>
    </div>

    <button
      type="button"
      class="w-full rounded-xl bg-nebula-400 py-3.5 font-semibold text-space-950 transition hover:bg-nebula-300"
      @click="emit('nextRound')"
    >
      Next Round →
    </button>
  </div>
</template>
