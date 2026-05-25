<script setup lang="ts">
import type { Player } from '~/types/game'

const props = defineProps<{
  players: Player[]
  myId: string
  vpPool: number
  vpPoolInitial: number
  lastRound: boolean
  gameEnded: boolean
  isHost: boolean
  /** Single-device mode: adjust any player's vault from the player list */
  localMode?: boolean
}>()

const emit = defineEmits<{
  adjustVp: [playerId: string, delta: number]
  endGame: []
}>()

const open = ref(false)

const me = computed(() => props.players.find((p) => p.id === props.myId))
const poolPercent = computed(() =>
  props.vpPoolInitial > 0 ? (props.vpPool / props.vpPoolInitial) * 100 : 0,
)
</script>

<template>
  <div>
    <!-- Floating toggle -->
    <button
      type="button"
      class="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-star-400/30 bg-space-800 px-4 py-2.5 shadow-lg shadow-black/40"
      @click="open = !open"
    >
      <span class="text-star-400">◆</span>
      <span class="text-sm font-semibold">VP: {{ me?.vpChips ?? 0 }}</span>
      <span class="text-xs text-slate-400">Pool: {{ vpPool }}</span>
    </button>

    <!-- Last round alert -->
    <div
      v-if="lastRound && !gameEnded"
      class="fixed top-0 inset-x-0 z-50 animate-pulse-glow bg-star-400 px-4 py-3 text-center font-bold text-space-950"
    >
      ⚠ Last Round! Game ends after this round.
    </div>

    <!-- Drawer -->
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
          <h3 class="text-lg font-bold text-slate-100">VP Chip Tracker</h3>
          <button type="button" class="text-slate-400 hover:text-slate-200" @click="open = false">
            ✕
          </button>
        </div>

        <!-- Global pool -->
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
        </div>

        <!-- Personal vault -->
        <div v-if="!localMode" class="mb-4 rounded-xl border border-nebula-400/30 bg-nebula-400/10 p-4">
          <p class="text-sm text-slate-400">Your VP Vault</p>
          <div class="mt-2 flex items-center justify-center gap-6">
            <button
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-full bg-space-700 text-2xl font-bold hover:bg-space-600"
              :disabled="!me || me.vpChips <= 0"
              @click="emit('adjustVp', myId, -1)"
            >
              −
            </button>
            <span class="text-4xl font-bold text-nebula-300">{{ me?.vpChips ?? 0 }}</span>
            <button
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-full bg-nebula-400 text-2xl font-bold text-space-950 hover:bg-nebula-300"
              :disabled="vpPool <= 0"
              @click="emit('adjustVp', myId, 1)"
            >
              +
            </button>
          </div>
        </div>

        <!-- All players -->
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-wide text-slate-400">All Players</p>
          <div
            v-for="player in players"
            :key="player.id"
            class="flex items-center justify-between rounded-lg bg-space-800/50 px-3 py-2"
          >
            <span :class="player.id === myId ? 'text-nebula-300 font-medium' : 'text-slate-300'">
              {{ player.name }}
            </span>
            <div v-if="localMode" class="flex items-center gap-2">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-space-700 text-lg font-bold hover:bg-space-600 disabled:opacity-40"
                :disabled="player.vpChips <= 0"
                @click="emit('adjustVp', player.id, -1)"
              >
                −
              </button>
              <span class="min-w-[2rem] text-center font-semibold text-star-400">{{ player.vpChips }}</span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-nebula-400 text-lg font-bold text-space-950 hover:bg-nebula-300 disabled:opacity-40"
                :disabled="vpPool <= 0"
                @click="emit('adjustVp', player.id, 1)"
              >
                +
              </button>
            </div>
            <span v-else class="font-semibold text-star-400">{{ player.vpChips }} VP</span>
          </div>
        </div>

        <button
          v-if="isHost && !gameEnded"
          type="button"
          class="mt-4 w-full rounded-xl border border-phase-consume/50 py-3 text-sm font-semibold text-phase-consume hover:bg-phase-consume/10"
          @click="emit('endGame')"
        >
          End Game & Open Score Sheet
        </button>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-black/50"
      @click="open = false"
    />
  </div>
</template>
