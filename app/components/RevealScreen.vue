<script setup lang="ts">
import type { Player, RevealedPhase } from '~/types/game'
import { getPhaseById } from '~/utils/phases'
import {
  getEndGameTriggers,
  shouldEndGameAfterRound,
  TABLEAU_END_GAME_SIZE,
  totalPlayerVp,
} from '~/utils/scoring'

const props = defineProps<{
  phases: RevealedPhase[]
  round: number
  currentIndex: number
  players: Player[]
  vpPool: number
  vpPoolInitial: number
  lastRound: boolean
  highlightPlayerId: string
  canNavigate: boolean
  canEditPlayer: (playerId: string) => boolean
}>()

const emit = defineEmits<{
  setRevealIndex: [index: number]
  adjustVp: [playerId: string, delta: number]
  setVp: [playerId: string, value: number]
  adjustTableau: [playerId: string, delta: number]
  setTableau: [playerId: string, value: number]
  finishRound: []
}>()

const currentPhase = computed(() => props.phases[props.currentIndex] ?? null)
const isLastPhase = computed(() => props.currentIndex >= props.phases.length - 1)
const poolPercent = computed(() =>
  props.vpPoolInitial > 0 ? (Math.max(0, props.vpPool) / props.vpPoolInitial) * 100 : 0,
)
const totalVp = computed(() => totalPlayerVp(props.players))
const gameEndsAfterRound = computed(() =>
  shouldEndGameAfterRound(props.players, props.vpPoolInitial),
)
const endGameTriggers = computed(() =>
  getEndGameTriggers(props.players, props.vpPoolInitial),
)
const endGameMessage = computed(() => {
  const triggers = endGameTriggers.value
  if (triggers.length === 0) return null
  const parts: string[] = []
  if (triggers.includes('vp_pool')) {
    parts.push('total VP exceeds the pool')
  }
  if (triggers.includes('tableau')) {
    parts.push(`a player has ${TABLEAU_END_GAME_SIZE}+ tableau cards`)
  }
  return `${parts.join(' and ')} — finish this round for final standings`
})
const tableauEndTriggered = computed(() => endGameTriggers.value.includes('tableau'))

function goNext() {
  if (isLastPhase.value) {
    emit('finishRound')
  } else {
    emit('setRevealIndex', props.currentIndex + 1)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <p class="text-sm uppercase tracking-widest text-slate-400">Round {{ round }}</p>
      <h2 class="mt-1 text-2xl font-bold text-slate-100">Phase Reveal</h2>
      <p
        v-if="lastRound && !gameEndsAfterRound && !tableauEndTriggered"
        class="mt-2 text-sm font-semibold text-star-400"
      >
        Pool empty — play continues until total VP exceeds {{ vpPoolInitial }}
      </p>
      <p v-else-if="endGameMessage" class="mt-2 text-sm font-semibold text-star-400">
        {{ endGameMessage }}
      </p>
    </div>

    <RulesHint screen="reveal" class="mb-2" />

    <div class="rounded-xl border border-space-600 bg-space-800/50 p-4">
      <div class="flex justify-between text-sm">
        <span class="text-slate-400">Global VP Pool</span>
        <span class="font-semibold text-star-400">{{ vpPool }} / {{ vpPoolInitial }}</span>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-space-700">
        <div
          class="h-full rounded-full bg-star-400 transition-all"
          :style="{ width: `${poolPercent}%` }"
        />
      </div>
      <p class="mt-2 text-xs text-slate-500">
        Chips in player vaults: {{ totalVp }} / {{ vpPoolInitial }} VP
        <span v-if="gameEndsAfterRound"> · finish this round to score</span>
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Tableau:
        <template v-for="(player, index) in players" :key="player.id">
          <span v-if="index > 0"> · </span>
          <span
            :class="player.tableauSize >= TABLEAU_END_GAME_SIZE ? 'text-phase-settle font-medium' : ''"
          >
            {{ player.name }} {{ player.tableauSize }}
          </span>
        </template>
      </p>
    </div>

    <div v-if="phases.length === 0" class="text-center text-slate-400">
      No phases selected this round.
    </div>

    <template v-else>
      <div class="space-y-2">
        <p class="text-xs uppercase tracking-wide text-slate-400">All phases</p>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="(phase, index) in phases"
            :key="`${phase.id}-${index}`"
            type="button"
            class="shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition"
            :class="[
              getPhaseById(phase.id).colorClass,
              index === currentIndex ? 'ring-2 ring-white/50' : 'opacity-60 hover:opacity-90',
            ]"
            :disabled="!canNavigate"
            @click="canNavigate && emit('setRevealIndex', index)"
          >
            <span class="font-semibold">{{ index + 1 }}. {{ getPhaseById(phase.id).shortLabel }}</span>
          </button>
        </div>
      </div>

      <div
        v-if="currentPhase"
        class="rounded-xl border-2 p-4"
        :class="getPhaseById(currentPhase.id).colorClass"
      >
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
          <div>
            <p class="text-xs uppercase tracking-wide opacity-70">
              Phase {{ currentIndex + 1 }} of {{ phases.length }}
            </p>
            <p class="mt-1 text-xl font-bold">{{ getPhaseById(currentPhase.id).label }}</p>
            <p class="mt-1 text-sm opacity-80">{{ getPhaseById(currentPhase.id).description }}</p>
          </div>
          <div
            v-if="currentPhase.players.length"
            class="inline-grid grid-cols-1 justify-self-end gap-1.5"
          >
            <span
              v-for="participant in currentPhase.players"
              :key="participant.id"
              class="rounded-full bg-white/15 px-2.5 py-1 text-center text-xs font-semibold whitespace-nowrap"
            >
              {{ participant.name }}
            </span>
          </div>
        </div>
      </div>

      <div class="space-y-2 rounded-xl border border-space-600 bg-space-800/30 p-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Current scores</p>
        <div
          v-for="player in players"
          :key="player.id"
          class="flex items-center justify-between"
        >
          <span
            :class="player.id === highlightPlayerId ? 'text-nebula-300 font-medium' : 'text-slate-300'"
          >
            {{ player.name }}
          </span>
          <div class="flex items-center gap-3">
            <EditableVpScore
              :value="player.vpChips"
              :vp-pool="vpPool"
              :vp-pool-initial="vpPoolInitial"
              :editable="canEditPlayer(player.id)"
              compact
              @adjust="emit('adjustVp', player.id, $event)"
              @set="emit('setVp', player.id, $event)"
            />
            <EditableTableauScore
              :value="player.tableauSize"
              :editable="canEditPlayer(player.id)"
              compact
              @adjust="emit('adjustTableau', player.id, $event)"
              @set="emit('setTableau', player.id, $event)"
            />
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 rounded-xl border border-space-600 py-3 font-semibold text-slate-300 disabled:opacity-40"
          :disabled="!canNavigate || currentIndex === 0"
          @click="emit('setRevealIndex', currentIndex - 1)"
        >
          Previous
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl bg-nebula-400 py-3 font-semibold text-space-950 transition hover:bg-nebula-300 disabled:opacity-40"
          :disabled="!canNavigate"
          @click="goNext"
        >
          {{
            isLastPhase
              ? (gameEndsAfterRound ? 'Finish Round → Final Standings' : 'Next Round →')
              : 'Next Phase →'
          }}
        </button>
      </div>
    </template>
  </div>
</template>
