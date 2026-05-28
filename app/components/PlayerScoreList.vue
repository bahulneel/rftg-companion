<script setup lang="ts">
import type { Player } from '~/types/game'
import { EMPIRE_END_GAME_SIZE } from '~/utils/scoring'

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
  adjustEmpire: [playerId: string, delta: number]
  setEmpire: [playerId: string, value: number]
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

    <div class="hidden items-end justify-between gap-2 sm:flex">
      <span class="min-w-0 flex-1" aria-hidden="true" />
      <div class="flex shrink-0 items-end gap-3">
        <p class="w-[7.5rem] text-center text-[10px] font-medium uppercase tracking-wide text-slate-500">
          VP
        </p>
        <p class="w-[7.5rem] text-center text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Empire
        </p>
      </div>
    </div>

    <div
      v-for="player in players"
      :key="player.id"
      class="gap-2"
      :class="rowClass"
    >
      <div class="sm:hidden">
        <span
          class="block min-w-0 truncate"
          :class="isHighlighted(player.id) ? 'text-nebula-300 font-medium' : 'text-slate-300'"
        >
          {{ player.name }}
        </span>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <div class="rounded-lg border border-space-700/70 bg-space-900/50 px-2 py-1.5 text-center">
            <p class="text-[10px] uppercase tracking-wide text-slate-500">VP</p>
            <div class="mt-1 flex justify-center">
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
          </div>
          <div class="rounded-lg border border-space-700/70 bg-space-900/50 px-2 py-1.5 text-center">
            <p class="text-[10px] uppercase tracking-wide text-slate-500">Empire</p>
            <div class="mt-1 flex justify-center">
              <EditableEmpireScore
                v-if="canEditPlayer(player.id)"
                :value="player.empireSize"
                :editable="true"
                compact
                @adjust="emit('adjustEmpire', player.id, $event)"
                @set="emit('setEmpire', player.id, $event)"
              />
              <span
                v-else
                class="text-lg font-semibold"
                :class="player.empireSize >= EMPIRE_END_GAME_SIZE ? 'text-phase-settle' : 'text-slate-400'"
              >
                {{ player.empireSize }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden items-center justify-between gap-2 sm:flex">
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
            <EditableEmpireScore
              v-if="canEditPlayer(player.id)"
              :value="player.empireSize"
              :editable="true"
              compact
              @adjust="emit('adjustEmpire', player.id, $event)"
              @set="emit('setEmpire', player.id, $event)"
            />
            <span
              v-else
              class="text-lg font-semibold"
              :class="player.empireSize >= EMPIRE_END_GAME_SIZE ? 'text-phase-settle' : 'text-slate-400'"
            >
              {{ player.empireSize }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
