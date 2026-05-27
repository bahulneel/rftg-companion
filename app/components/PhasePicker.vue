<script setup lang="ts">
import type { Expansions, PhaseId } from '~/types/game'
import { getAvailablePhases, getPhaseById, type PhaseDefinition } from '~/utils/phases'
import {
  TUTORIAL_CARD_BASICS,
  TUTORIAL_CORE_CONCEPT,
  TUTORIAL_GROUP_BLURBS,
  TUTORIAL_PHASE_TITLES,
} from '~/utils/tutorial'

const props = defineProps<{
  expansions: Expansions
  playerCount: number
  actionPickLimit: number
  selected: PhaseId[]
  locked: boolean
  showTutorialBlurbs?: boolean
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

const tutorialGroups = computed(() => {
  const groups = new Set<PhaseDefinition['group']>()
  for (const phase of available.value) {
    if (phase.group !== 'expansion') groups.add(phase.group)
  }
  return [...groups]
})

const selectedTutorialBlurb = computed(() => {
  if (!props.showTutorialBlurbs || props.selected.length === 0) return null
  const lastId = props.selected[props.selected.length - 1]!
  const group = getPhaseById(lastId).group
  return TUTORIAL_GROUP_BLURBS[group] ?? null
})
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

    <template v-else>
      <details
        v-if="showTutorialBlurbs"
        class="rounded-xl border border-nebula-400/20 bg-nebula-400/5 px-3 py-2 text-sm"
      >
        <summary class="cursor-pointer font-medium text-nebula-300">Tutorial: cards &amp; phases</summary>
        <p class="mt-2 text-slate-300">{{ TUTORIAL_CORE_CONCEPT }}</p>
        <ul class="mt-3 space-y-1.5 text-slate-400">
          <li v-for="item in TUTORIAL_CARD_BASICS" :key="item.term">
            <span class="font-medium text-slate-300">{{ item.term }}</span>
            — {{ item.detail }}
          </li>
        </ul>
        <p class="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Phases</p>
        <ul class="mt-2 space-y-2 text-slate-400">
          <li v-for="group in tutorialGroups" :key="group">
            <span class="font-medium text-slate-300">{{ TUTORIAL_PHASE_TITLES[group] }}</span>
            — {{ TUTORIAL_GROUP_BLURBS[group] }}
          </li>
        </ul>
      </details>

      <p
        v-if="selectedTutorialBlurb"
        class="rounded-lg border border-nebula-400/20 bg-nebula-400/5 px-3 py-2 text-sm text-slate-300"
      >
        {{ selectedTutorialBlurb }}
      </p>

      <div class="grid grid-cols-2 gap-2">
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
    </template>

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
