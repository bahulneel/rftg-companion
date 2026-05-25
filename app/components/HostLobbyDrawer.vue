<script setup lang="ts">
import type { Expansions, Player } from '~/types/game'

defineProps<{
  open: boolean
  badgeCount: number
  roomCode: string
  joinUrl: string
  isSpectator: boolean
  pendingPeerIds: string[]
  players: Player[]
  hostId: string
  peerId: string
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
  'update:open': [value: boolean]
  'update:newPlayerName': [value: string]
  reorder: [playerIds: string[]]
  addPlayer: []
  registerAsSpectator: []
  registerAsGameMaster: []
  registerAsPlayerPeer: []
  startGame: []
  'update:expansions': [value: Expansions]
  copyInvite: []
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div>
    <button
      type="button"
      class="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-star-400/40 bg-space-800 shadow-lg shadow-black/40"
      aria-label="Open lobby"
      @click="emit('update:open', !open)"
    >
      <span class="text-lg font-bold text-star-400">☰</span>
      <span
        class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-star-400 px-1 text-xs font-bold text-space-950"
      >
        {{ badgeCount }}
      </span>
    </button>

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
        class="fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-space-600 bg-space-900 p-4 shadow-2xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-100">Lobby</h3>
          <button type="button" class="text-slate-400 hover:text-slate-200" @click="close">
            ✕
          </button>
        </div>

        <div class="mb-6 space-y-3">
          <RoomCodeDisplay
            v-if="joinUrl"
            :code="roomCode"
            :join-url="joinUrl"
          />
          <p v-else class="text-center text-sm text-slate-400 animate-pulse">
            Preparing invite link...
          </p>
          <button
            v-if="joinUrl"
            type="button"
            class="w-full rounded-xl border border-space-600 py-2.5 text-sm text-slate-300 hover:border-nebula-400"
            @click="emit('copyInvite')"
          >
            Copy invite link
          </button>
          <p class="text-center text-xs text-slate-500">
            Share the QR so peers can connect to your room.
          </p>
        </div>

        <LobbyScreen
          :players="players"
          :pending-peer-ids="pendingPeerIds"
          :host-id="hostId"
          :peer-id="peerId"
          :room-code="roomCode"
          :is-host="isHost"
          :is-registered="isRegistered"
          :is-spectator="isSpectator"
          :show-host-join-choice="showHostJoinChoice"
          :show-game-master-status="showGameMasterStatus"
          :can-switch-to-player-peer="canSwitchToPlayerPeer"
          :can-reorder="canReorder"
          :can-start-game="canStartGame"
          :can-manage-roster="canManageRoster"
          :player-count="playerCount"
          :expansions="expansions"
          :expansions-editable="expansionsEditable"
          :hint="hint"
          :new-player-name="newPlayerName"
          @update:new-player-name="emit('update:newPlayerName', $event)"
          @reorder="emit('reorder', $event)"
          @add-player="emit('addPlayer')"
          @register-as-spectator="emit('registerAsSpectator')"
          @register-as-game-master="emit('registerAsGameMaster')"
          @register-as-player-peer="emit('registerAsPlayerPeer')"
          @start-game="emit('startGame')"
          @update:expansions="emit('update:expansions', $event)"
        />
      </div>
    </Transition>

    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-black/50"
      @click="close"
    />
  </div>
</template>
