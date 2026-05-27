<script setup lang="ts">
import type { CostModifier, Expansions, Player, PhaseId } from '~/types/game'
import { getRulesHints } from '~/utils/rulesHints'

const props = defineProps<{
  round: number
  allPlayers: Player[]
  actingPlayer: Player | null
  showHandoff: boolean
  handoffPlayerName: string
  progress: string
  showSpectatorWait: boolean
  showPhasePicker: boolean
  selections: PhaseId[]
  confirmed: boolean
  expansions: Expansions
  playerCount: number
  actionPickLimit: number
  highlightPlayerId: string
  vp: {
    pool: number
    poolInitial: number
    lastRound: boolean
    gameEnded: boolean
  }
  showVpTracker: boolean
  showEndGame: boolean
  showTutorialBlurbs: boolean
  canEditPlayer: (playerId: string) => boolean
  primaryVaultPlayerId: string
  costModifiers: CostModifier[]
  canEditCostPlanning: boolean
}>()

const selectHints = computed(() =>
  getRulesHints('select', {
    playerCount: props.playerCount,
    actionPickLimit: props.actionPickLimit,
  }),
)

const emit = defineEmits<{
  ready: []
  updateSelections: [phases: PhaseId[]]
  confirm: []
  adjustVp: [playerId: string, delta: number]
  setVp: [playerId: string, value: number]
  adjustTableau: [playerId: string, delta: number]
  setTableau: [playerId: string, value: number]
  updateCostModifiers: [modifiers: CostModifier[]]
  endGame: []
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <p class="text-sm text-slate-400">Round {{ round }}</p>
      <h2 class="text-xl font-bold">Phase Selection</h2>
    </div>

    <PassDevicePrompt
      v-if="showHandoff"
      :player-name="handoffPlayerName"
      subtitle="Pass the device to"
      :progress="progress"
      @ready="emit('ready')"
    />

    <div
      v-else-if="showSpectatorWait"
      class="rounded-xl border border-star-400/20 bg-star-400/5 px-4 py-6 text-center"
    >
      <p class="text-sm font-medium text-star-300">Spectator view</p>
      <p class="mt-2 text-sm text-slate-400">
        Waiting for players to lock in their phase selections…
      </p>
    </div>

    <template v-else-if="showPhasePicker">
      <RulesHint :items="selectHints" class="mb-2" />

      <PlayerSecretTools
        v-if="actingPlayer && canEditCostPlanning"
        :modifiers="costModifiers"
        :editable="!confirmed"
        class="mb-1"
        @update:modifiers="emit('updateCostModifiers', $event)"
      />

      <PhasePicker
        :expansions="expansions"
        :player-count="playerCount"
        :action-pick-limit="actionPickLimit"
        :selected="selections"
        :locked="confirmed"
        :show-tutorial-blurbs="showTutorialBlurbs"
        @update="emit('updateSelections', $event)"
        @confirm="emit('confirm')"
      />
    </template>

    <PlayerStatusList
      v-if="!showHandoff"
      :players="allPlayers"
      :my-id="highlightPlayerId"
    />

    <VpTracker
      v-if="showVpTracker && !showHandoff"
      :players="allPlayers"
      :primary-vault-player-id="primaryVaultPlayerId"
      :vp-pool="vp.pool"
      :vp-pool-initial="vp.poolInitial"
      :last-round="vp.lastRound"
      :game-ended="vp.gameEnded"
      :show-end-game="showEndGame"
      :can-edit-player="canEditPlayer"
      @adjust-vp="(playerId, delta) => emit('adjustVp', playerId, delta)"
      @set-vp="(playerId, value) => emit('setVp', playerId, value)"
      @adjust-tableau="(playerId, delta) => emit('adjustTableau', playerId, delta)"
      @set-tableau="(playerId, value) => emit('setTableau', playerId, value)"
      @end-game="emit('endGame')"
    />
  </div>
</template>
