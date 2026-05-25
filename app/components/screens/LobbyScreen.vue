<script setup lang="ts">
import type { Expansions, Player } from '~/types/game'

const props = defineProps<{
  players: Player[]
  pendingPeerIds: string[]
  hostId: string
  peerId: string
  roomCode: string
  isHost: boolean
  isRegistered: boolean
  isSpectator: boolean
  canReorder: boolean
  canStartGame: boolean
  canManageRoster: boolean
  playerCount: number
  expansions: Expansions
  expansionsEditable: boolean
  hint: string
  newPlayerName: string
}>()

const emit = defineEmits<{
  'update:newPlayerName': [value: string]
  reorder: [playerIds: string[]]
  addPlayer: []
  registerAsSpectator: []
  startGame: []
  'update:expansions': [value: Expansions]
}>()

const localName = computed({
  get: () => props.newPlayerName,
  set: (value: string) => emit('update:newPlayerName', value),
})

const showPlayerList = computed(() => {
  if (props.canStartGame) return true
  return props.isRegistered || props.players.some((player) => player.ownerPeerId === props.peerId)
})

const showWaiting = computed(
  () => props.isRegistered && !props.canStartGame && props.playerCount >= 2,
)

const showHint = computed(() => props.hint && !props.isHost)
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="showHint"
      class="rounded-xl border border-space-600 bg-space-800/30 px-4 py-3 text-center text-sm text-slate-400"
    >
      {{ hint }}
    </div>

    <LobbyPlayerList
      v-if="showPlayerList"
      :players="players"
      :pending-peer-ids="pendingPeerIds"
      :host-id="hostId"
      :peer-id="peerId"
      :reorderable="canReorder"
      :show-order="canReorder"
      :show-host-row="isHost && isSpectator"
      @reorder="emit('reorder', $event)"
    />

    <div v-if="canManageRoster" class="space-y-3">
      <label class="text-sm text-slate-400">Add player at your table</label>
      <input
        v-model="localName"
        type="text"
        maxlength="20"
        placeholder="Player name"
        class="w-full rounded-xl border border-space-600 bg-space-800 px-4 py-3 text-slate-100 focus:border-nebula-400 focus:outline-none"
        @keyup.enter="emit('addPlayer')"
      />
      <button
        type="button"
        class="w-full rounded-xl bg-nebula-400 py-3 font-semibold text-space-950"
        :disabled="!localName.trim()"
        @click="emit('addPlayer')"
      >
        Add Player
      </button>
      <button
        v-if="!isRegistered"
        type="button"
        class="w-full rounded-xl border border-space-600 py-3 text-sm text-slate-300 hover:border-nebula-400"
        @click="emit('registerAsSpectator')"
      >
        Continue as spectator
      </button>
    </div>

    <ExpansionToggles
      :model-value="expansions"
      :disabled="!expansionsEditable"
      @update:model-value="emit('update:expansions', $event)"
    />

    <button
      v-if="canStartGame"
      type="button"
      class="w-full rounded-xl bg-phase-settle py-4 text-lg font-bold text-space-950 disabled:opacity-40"
      :disabled="playerCount < 2"
      @click="emit('startGame')"
    >
      Start Game ({{ playerCount }} players)
    </button>
    <p v-else-if="showWaiting" class="text-center text-sm text-slate-400">
      Waiting for host to start the game...
    </p>
  </div>
</template>
