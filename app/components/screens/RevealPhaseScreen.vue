<script setup lang="ts">
import type { Player, RevealedPhase } from '~/types/game'

defineProps<{
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
  finishRound: []
}>()
</script>

<template>
  <RevealScreen
    :phases="phases"
    :round="round"
    :current-index="currentIndex"
    :players="players"
    :vp-pool="vpPool"
    :vp-pool-initial="vpPoolInitial"
    :last-round="lastRound"
    :highlight-player-id="highlightPlayerId"
    :can-navigate="canNavigate"
    :can-edit-player="canEditPlayer"
    @set-reveal-index="emit('setRevealIndex', $event)"
    @adjust-vp="(playerId, delta) => emit('adjustVp', playerId, delta)"
    @set-vp="(playerId, value) => emit('setVp', playerId, value)"
    @finish-round="emit('finishRound')"
  />
</template>
