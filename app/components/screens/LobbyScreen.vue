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
  showHostJoinChoice?: boolean
  showGameMasterStatus?: boolean
  canSwitchToPlayerPeer?: boolean
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
  registerAsGameMaster: []
  registerAsPlayerPeer: []
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

const showHint = computed(() => props.hint && !props.showHostJoinChoice)
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="showHint"
      class="rounded-xl border border-space-600 bg-space-800/30 px-4 py-3 text-center text-sm text-slate-400"
    >
      {{ hint }}
    </div>

    <div v-if="showHostJoinChoice" class="space-y-3">
      <p class="text-center text-sm font-medium text-slate-200">How are you joining this session?</p>
      <button
        type="button"
        class="w-full rounded-xl border border-star-400/30 bg-star-400/10 py-4 text-left px-4 transition hover:border-star-400/50"
        @click="emit('registerAsGameMaster')"
      >
        <span class="block font-semibold text-star-300">Game master only</span>
        <span class="mt-1 block text-xs text-slate-400">
          Run the room, share the QR code, and adjust scores — no player seat.
        </span>
      </button>
      <button
        type="button"
        class="w-full rounded-xl border border-nebula-400/30 bg-nebula-400/10 py-4 text-left px-4 transition hover:border-nebula-400/50"
        @click="emit('registerAsPlayerPeer')"
      >
        <span class="block font-semibold text-nebula-300">Join as one or more players on this device</span>
        <span class="mt-1 block text-xs text-slate-400">
          One device can cover several seats — pass it around the table to use fewer phones.
        </span>
      </button>
    </div>

    <div
      v-else-if="showGameMasterStatus"
      class="rounded-lg border border-star-400/20 bg-star-400/5 px-4 py-3 text-center text-sm text-star-300/90"
    >
      You're running the session as game master.
      <button
        v-if="canSwitchToPlayerPeer"
        type="button"
        class="mt-2 block w-full text-xs text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-slate-200"
        @click="emit('registerAsPlayerPeer')"
      >
        Join as one or more players on this device instead
      </button>
    </div>

    <LobbyPlayerList
      v-if="showPlayerList"
      :players="players"
      :pending-peer-ids="pendingPeerIds"
      :host-id="hostId"
      :peer-id="peerId"
      :reorderable="canReorder"
      :show-order="canReorder"
      :show-host-row="isHost && isSpectator && !showHostJoinChoice"
      @reorder="emit('reorder', $event)"
    />

    <div v-if="canManageRoster && !showHostJoinChoice" class="space-y-3">
      <label class="text-sm text-slate-400">Add player on this device</label>
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
        v-if="!isHost && !isRegistered"
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
