<script setup lang="ts">
import type { Expansions } from '~/types/game'
import { buildTiebreakSummary, type RankedPlayer } from '~/utils/scoring'

const props = defineProps<{
  ranked: RankedPlayer[]
  expansions: Expansions
}>()

const expanded = ref<string | null>(null)

const tiebreakSummary = computed(() => buildTiebreakSummary(props.ranked))

function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}

function playerTiebreakNote(playerId: string): string | null {
  return tiebreakSummary.value?.playerNotes[playerId] ?? null
}

const podiumColors = ['text-star-400', 'text-slate-300', 'text-phase-consume']
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-center text-2xl font-bold text-slate-100">Final Standings</h2>

    <div
      v-if="tiebreakSummary"
      class="rounded-xl border border-star-400/30 bg-star-400/10 p-4"
    >
      <p class="font-semibold text-star-300">{{ tiebreakSummary.headline }}</p>
      <p class="mt-1 text-sm text-slate-400">{{ tiebreakSummary.detail }}</p>
    </div>

    <!-- Podium top 3 -->
    <div class="flex items-end justify-center gap-3 py-4">
      <template v-for="(player, idx) in ranked.slice(0, 3)" :key="player.id">
        <div
          class="flex flex-col items-center"
          :class="idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'"
        >
          <div
            class="flex w-20 flex-col items-center justify-end rounded-t-xl border border-space-600 bg-space-800/80 px-2 pb-2"
            :style="{ height: idx === 0 ? '120px' : idx === 1 ? '90px' : '70px' }"
          >
            <span class="text-2xl">{{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉' }}</span>
            <p class="mt-1 truncate text-center text-xs font-semibold" :class="podiumColors[idx]">
              {{ player.name }}
            </p>
            <p class="text-lg font-bold text-slate-100">{{ player.total }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Full list -->
    <div class="space-y-2">
      <button
        v-for="player in ranked"
        :key="player.id"
        type="button"
        class="w-full rounded-xl border border-space-600 bg-space-800/50 p-4 text-left"
        @click="toggle(player.id)"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-space-700 text-sm font-bold">
              {{ player.rank }}
            </span>
            <div class="min-w-0">
              <span class="font-semibold text-slate-100">{{ player.name }}</span>
              <p
                v-if="playerTiebreakNote(player.id)"
                class="mt-0.5 text-xs leading-snug"
                :class="playerTiebreakNote(player.id)?.startsWith('Won')
                  ? 'text-phase-settle'
                  : playerTiebreakNote(player.id)?.startsWith('Shared')
                    ? 'text-star-400'
                    : 'text-slate-500'"
              >
                {{ playerTiebreakNote(player.id) }}
              </p>
            </div>
          </div>
          <span class="shrink-0 text-xl font-bold text-star-400">{{ player.total }}</span>
        </div>

        <div v-if="expanded === player.id" class="mt-3 space-y-1 border-t border-space-600 pt-3 text-sm">
          <div class="flex justify-between text-slate-400">
            <span>VP Chips</span><span class="text-slate-200">{{ player.breakdown.vpChips }}</span>
          </div>
          <template v-if="player.breakdown.tiebreakSubmitted">
            <p class="pt-1 text-xs uppercase tracking-wide text-slate-500">Tie-break counts</p>
            <div class="flex justify-between text-slate-400">
              <span>Cargo on planets</span><span class="text-slate-200">{{ player.breakdown.goodsOnWorlds }}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Cards in Hand</span><span class="text-slate-200">{{ player.breakdown.cardsInHand }}</span>
            </div>
          </template>
          <div v-if="expansions.prestige" class="flex justify-between text-slate-400">
            <span>Prestige</span><span class="text-slate-200">{{ player.breakdown.prestigePoints }}</span>
          </div>
          <div v-if="expansions.goals" class="flex justify-between text-slate-400">
            <span>Goals</span><span class="text-slate-200">{{ player.breakdown.goalPoints }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
