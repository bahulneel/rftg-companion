<script setup lang="ts">
import type { Player } from '~/types/game'

defineProps<{
  players: Player[]
  myId: string
}>()
</script>

<template>
  <div class="rounded-xl border border-space-600 bg-space-800/50 p-4">
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
      Ready Check
    </h3>
    <ul class="space-y-2">
      <li
        v-for="player in players"
        :key="player.id"
        class="flex items-center justify-between rounded-lg px-3 py-2"
        :class="player.id === myId ? 'bg-nebula-400/10' : 'bg-space-700/30'"
      >
        <span class="font-medium" :class="player.id === myId ? 'text-nebula-300' : 'text-slate-200'">
          {{ player.name }}
          <span v-if="player.id === myId" class="text-xs text-slate-400">(you)</span>
        </span>
        <span
          class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          :class="player.status === 'ready'
            ? 'bg-phase-settle/20 text-phase-settle'
            : 'bg-star-400/20 text-star-300'"
        >
          {{ player.status === 'ready' ? 'Ready' : 'Thinking' }}
        </span>
      </li>
    </ul>
  </div>
</template>
