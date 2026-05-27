<script setup lang="ts">
import type { Expansions, PhaseId } from '~/types/game'
import { getAvailablePhases, getPhaseById } from '~/utils/phases'

const props = defineProps<{
  expansions: Expansions
  playerCount: number
  actionPickLimit: number
  selected: PhaseId[]
  locked: boolean
}>()

const emit = defineEmits<{
  update: [phases: PhaseId[]]
  confirm: []
}>()

const limit = computed(() => props.actionPickLimit)
const available = computed(() => getAvailablePhases(props.expansions, props.playerCount))

function togglePhase(id: PhaseId) {
  if (props.locked) return

  const current = [...props.selected]
  const idx = current.indexOf(id)

  if (idx >= 0) {
    current.splice(idx, 1)
  } else if (current.length < limit.value) {
    current.push(id)
  }

  emit('update', current)
}

const canConfirm = computed(() => props.selected.length === limit.value && !props.locked)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-100">Choose Phases</h2>
        <p v-if="limit === 2" class="mt-0.5 text-xs text-slate-400">
          Experienced 2-player: pick 2 action cards
        </p>
      </div>
      <span class="shrink-0 text-sm text-slate-400">
        {{ selected.length }} / {{ limit }} selected
      </span>
    </div>

    <div v-if="locked" class="rounded-xl border border-nebula-400/30 bg-nebula-400/10 p-6 text-center">
      <div class="mb-2 text-3xl">🔒</div>
      <p class="font-semibold text-nebula-300">Choices Locked</p>
      <p class="mt-1 text-sm text-slate-400">Your selections are hidden from neighbors</p>
      <div class="mt-4 flex flex-wrap justify-center gap-2">
        <span
          v-for="(id, index) in selected"
          :key="`${id}-${index}`"
          class="rounded-lg border px-3 py-1.5 text-sm font-medium"
          :class="getPhaseById(id).colorClass"
        >
          {{ getPhaseById(id).shortLabel }}
        </span>
      </div>
    </div>

    <div v-else class="grid grid-cols-2 gap-2">
      <button
        v-for="phase in available"
        :key="phase.id"
        type="button"
        class="rounded-xl border-2 px-3 py-3 text-left transition-all active:scale-95"
        :class="[
          phase.colorClass,
          selected.includes(phase.id)
            ? 'ring-2 ring-white/50 scale-[1.02]'
            : 'opacity-80 hover:opacity-100',
        ]"
        @click="togglePhase(phase.id)"
      >
        <p class="font-semibold leading-tight">{{ phase.label }}</p>
        <p class="mt-1 text-xs opacity-80">{{ phase.description }}</p>
      </button>
    </div>

    <button
      v-if="!locked"
      type="button"
      class="w-full rounded-xl py-3.5 font-semibold transition-all"
      :class="canConfirm
        ? 'bg-nebula-400 text-space-950 hover:bg-nebula-300'
        : 'bg-space-700 text-slate-500 cursor-not-allowed'"
      :disabled="!canConfirm"
      @click="emit('confirm')"
    >
      Confirm Selection
    </button>
  </div>
</template>
