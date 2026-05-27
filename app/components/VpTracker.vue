<script setup lang="ts">
import type { Player } from '~/types/game'
import { TABLEAU_END_GAME_SIZE } from '~/utils/scoring'

const props = defineProps<{
  players: Player[]
  primaryVaultPlayerId: string
  vpPool: number
  vpPoolInitial: number
  lastRound: boolean
  gameEnded: boolean
  showEndGame: boolean
  canEditPlayer: (playerId: string) => boolean
}>()

const emit = defineEmits<{
  adjustVp: [playerId: string, delta: number]
  setVp: [playerId: string, value: number]
  adjustTableau: [playerId: string, delta: number]
  setTableau: [playerId: string, value: number]
  endGame: []
}>()

const open = ref(false)

const primaryPlayer = computed(() =>
  props.players.find((player) => player.id === props.primaryVaultPlayerId),
)
const poolPercent = computed(() =>
  props.vpPoolInitial > 0 ? (props.vpPool / props.vpPoolInitial) * 100 : 0,
)
const tableauEndTriggered = computed(() =>
  props.players.some((player) => player.tableauSize >= TABLEAU_END_GAME_SIZE),
)
</script>

<template>
  <div>
    <button
      type="button"
      class="fixed bottom-4 right-4 z-40 flex max-w-[min(100vw-2rem,20rem)] flex-col items-end gap-0.5 rounded-full border border-star-400/30 bg-space-800 px-4 py-2.5 shadow-lg shadow-black/40 text-left"
      @click="open = !open"
    >
      <span class="flex items-center gap-2">
        <span class="text-star-400">◆</span>
        <span class="text-sm font-semibold">VP: {{ primaryPlayer?.vpChips ?? 0 }}</span>
        <span class="text-xs text-slate-400">Pool: {{ vpPool }}</span>
      </span>
      <span class="pr-1 text-xs text-phase-settle">
        Tableau: {{ primaryPlayer?.tableauSize ?? 0 }}
      </span>
    </button>

    <div
      v-if="lastRound && !gameEnded && !tableauEndTriggered"
      class="fixed top-0 inset-x-0 z-50 animate-pulse-glow bg-star-400 px-4 py-3 text-center font-bold text-space-950"
    >
      ⚠ Pool empty — game ends after a round where total VP exceeds the pool.
    </div>
    <div
      v-else-if="tableauEndTriggered && !gameEnded"
      class="fixed top-0 inset-x-0 z-50 animate-pulse-glow bg-phase-settle px-4 py-3 text-center font-bold text-space-950"
    >
      ⚠ A player has {{ TABLEAU_END_GAME_SIZE }}+ tableau cards — finish this round to score.
    </div>

    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-40 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-space-600 bg-space-900 p-4 shadow-2xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-100">Score Tracker</h3>
          <button type="button" class="text-slate-400 hover:text-slate-200" @click="open = false">
            ✕
          </button>
        </div>

        <RulesHint screen="vp" class="mb-4" />

        <div class="mb-4 rounded-xl border border-space-600 bg-space-800/50 p-4">
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
            Tableau end game at {{ TABLEAU_END_GAME_SIZE }}+ face-up cards (start world counts as 1).
          </p>
        </div>

        <div
          v-if="primaryPlayer && canEditPlayer(primaryPlayer.id)"
          class="mb-4 space-y-4 rounded-xl border border-nebula-400/30 bg-nebula-400/10 p-4"
        >
          <div>
            <p class="text-sm text-slate-400">Active VP Vault</p>
            <div class="mt-2 flex justify-center">
              <EditableVpScore
                :value="primaryPlayer.vpChips"
                :vp-pool="vpPool"
                :vp-pool-initial="vpPoolInitial"
                :editable="true"
                @adjust="emit('adjustVp', primaryPlayer.id, $event)"
                @set="emit('setVp', primaryPlayer.id, $event)"
              />
            </div>
          </div>
          <div>
            <p class="text-sm text-slate-400">Tableau size (face-up cards)</p>
            <div class="mt-2 flex justify-center">
              <EditableTableauScore
                :value="primaryPlayer.tableauSize"
                :editable="true"
                @adjust="emit('adjustTableau', primaryPlayer.id, $event)"
                @set="emit('setTableau', primaryPlayer.id, $event)"
              />
            </div>
          </div>
        </div>

        <PlayerScoreList
          title="All Players"
          :players="players"
          :highlight-player-id="primaryVaultPlayerId"
          :vp-pool="vpPool"
          :vp-pool-initial="vpPoolInitial"
          :can-edit-player="canEditPlayer"
          row-class="rounded-lg bg-space-800/50 px-3 py-2"
          @adjust-vp="(id, delta) => emit('adjustVp', id, delta)"
          @set-vp="(id, value) => emit('setVp', id, value)"
          @adjust-tableau="(id, delta) => emit('adjustTableau', id, delta)"
          @set-tableau="(id, value) => emit('setTableau', id, value)"
        />

        <button
          v-if="showEndGame && !gameEnded"
          type="button"
          class="mt-4 w-full rounded-xl border border-phase-consume/50 py-3 text-sm font-semibold text-phase-consume hover:bg-phase-consume/10"
          @click="emit('endGame')"
        >
          End Game & Show Standings
        </button>
      </div>
    </Transition>

    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-black/50"
      @click="open = false"
    />
  </div>
</template>
