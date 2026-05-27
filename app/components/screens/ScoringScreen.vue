<script setup lang="ts">
import type { Expansions } from '~/types/game'
import type { RankedPlayer } from '~/utils/scoring'

defineProps<{
  needsTiebreak: boolean
  ranked: RankedPlayer[]
  expansions: Expansions
  showHandoff: boolean
  handoffPlayerName: string
  progress: string
  showTiebreakForm: boolean
  tiebreakPlayerName: string
  showSpectatorWait: boolean
  showWaitingForOthers: boolean
}>()

const emit = defineEmits<{
  ready: []
  submitTiebreak: [goodsOnWorlds: number, cardsInHand: number]
}>()
</script>

<template>
  <div class="space-y-6">
    <div v-if="needsTiebreak" class="space-y-4">
      <p class="text-center text-sm font-semibold text-star-400">
        Tie for first place — answer the tie-breaker questions
      </p>

      <PassDevicePrompt
        v-if="showHandoff"
        :player-name="handoffPlayerName"
        subtitle="Pass the device to"
        :progress="progress"
        @ready="emit('ready')"
      />

      <TiebreakerSheet
        v-else-if="showTiebreakForm"
        :player-name="tiebreakPlayerName"
        @submit="(goods, cards) => emit('submitTiebreak', goods, cards)"
      />

      <p v-else-if="showSpectatorWait" class="text-center text-sm text-slate-400">
        Waiting for tied players to submit tie-breakers…
      </p>

      <p v-else-if="showWaitingForOthers" class="text-center text-sm text-slate-400">
        Waiting for tied players to submit tie-breakers…
      </p>
    </div>

    <template v-if="!needsTiebreak">
      <RulesHint :items="scoringHints" />
      <Leaderboard
        :ranked="ranked"
        :expansions="expansions"
      />
    </template>
  </div>
</template>
