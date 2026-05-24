<script setup lang="ts">
import type { Expansions } from '~/types/game'
import type { RankedPlayer } from '~/utils/scoring'

defineProps<{
  ranked: RankedPlayer[]
  expansions: Expansions
}>()

const expanded = ref<string | null>(null)

function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}

const podiumColors = ['text-star-400', 'text-slate-300', 'text-phase-consume']
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-center text-2xl font-bold text-slate-100">Final Standings</h2>

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
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-space-700 text-sm font-bold">
              {{ player.rank }}
            </span>
            <span class="font-semibold text-slate-100">{{ player.name }}</span>
          </div>
          <span class="text-xl font-bold text-star-400">{{ player.total }}</span>
        </div>

        <div v-if="expanded === player.id" class="mt-3 space-y-1 border-t border-space-600 pt-3 text-sm">
          <div class="flex justify-between text-slate-400">
            <span>VP Chips</span><span class="text-slate-200">{{ player.breakdown.vpChips }}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Card Face Value</span><span class="text-slate-200">{{ player.breakdown.cardFaceValue }}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>6-Cost Dev Bonuses</span><span class="text-slate-200">{{ player.breakdown.devBonuses }}</span>
          </div>
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
