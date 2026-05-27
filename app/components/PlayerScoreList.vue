<script setup lang="ts">
import type { Player } from '~/types/game'
import { TABLEAU_END_GAME_SIZE } from '~/utils/scoring'

const props = defineProps<{
  players: Player[]
  highlightPlayerId?: string
  vpPool: number
  vpPoolInitial: number
  canEditPlayer: (playerId: string) => boolean
  title?: string
  bordered?: boolean
  rowClass?: string
}>()

const emit = defineEmits<{
  adjustVp: [playerId: string, delta: number]
  setVp: [playerId: string, value: number]
  adjustTableau: [playerId: string, delta: number]
  setTableau: [playerId: string, value: number]
}>()

function isHighlighted(playerId: string) {
  return !!props.highlightPlayerId && props.highlightPlayerId === playerId
}
</script>

<template>
  <div
    class="space-y-2"
    :class="bordered ? 'rounded-xl border border-space-600 bg-space-800/30 p-4' : undefined"
  >
    <p v-if="title" class="text-xs uppercase tracking-wide text-slate-400">
      {{ title }}
    </p>

    <div class="flex items-end justify-between gap-2">
      <span class="min-w-0 flex-1" aria-hidden="true" />
      <div class="flex shrink-0 items-end gap-3">
        <p class="w-[7.5rem] text-center text-[10px] font-medium uppercase tracking-wide text-slate-500">
          VP
        </p>
        <p class="w-[7.5rem] text-center text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Tableau
        </p>
      </div>
    </div>

    <div
      v-for="player in players"
      :key="player.id"
      class="flex items-center justify-between gap-2"
      :class="rowClass"
    >
      <span
        class="min-w-0 flex-1 truncate"
        :class="isHighlighted(player.id) ? 'text-nebula-300 font-medium' : 'text-slate-300'"
      >
        {{ player.name }}
      </span>
      <div class="flex shrink-0 items-center gap-3">
        <div class="flex w-[7.5rem] justify-center">
          <EditableVpScore
            v-if="canEditPlayer(player.id)"
            :value="player.vpChips"
            :vp-pool="vpPool"
            :vp-pool-initial="vpPoolInitial"
            :editable="true"
            compact
            @adjust="emit('adjustVp', player.id, $event)"
            @set="emit('setVp', player.id, $event)"
          />
          <span v-else class="text-lg font-semibold text-star-400">{{ player.vpChips }}</span>
        </div>
        <div class="flex w-[7.5rem] justify-center">
          <EditableTableauScore
            v-if="canEditPlayer(player.id)"
            :value="player.tableauSize"
            :editable="true"
            compact
            @adjust="emit('adjustTableau', player.id, $event)"
            @set="emit('setTableau', player.id, $event)"
          />
          <span
            v-else
            class="text-lg font-semibold"
            :class="player.tableauSize >= TABLEAU_END_GAME_SIZE ? 'text-phase-settle' : 'text-slate-400'"
          >
            {{ player.tableauSize }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
