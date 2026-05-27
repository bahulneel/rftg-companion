<script setup lang="ts">
import type { Expansions, Player } from '~/types/game'

defineProps<{
  open: boolean
  pulseButton?: boolean
  badgeCount: number
  roomCode: string
  joinUrl: string
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
  canSetTutorialForPlayer?: (playerId: string) => boolean
  canRemovePlayer?: (playerId: string) => boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:newPlayerName': [value: string]
  reorder: [playerIds: string[]]
  removePlayer: [playerId: string]
  addPlayer: []
  registerAsSpectator: []
  registerAsGameMaster: []
  registerAsPlayerPeer: []
  startGame: []
  'update:expansions': [value: Expansions]
  copyInvite: []
  setTutorialEnabled: [playerId: string, enabled: boolean]
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div>
    <button
      type="button"
      class="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border bg-space-800 shadow-lg shadow-black/40 transition"
      :class="pulseButton && !open
        ? 'border-star-400 lobby-fab-attention'
        : 'border-star-400/40'"
      aria-label="Open lobby"
      @click="emit('update:open', !open)"
    >
      <span
        v-if="pulseButton && !open"
        class="absolute inset-0 rounded-full bg-star-400/20 animate-ping"
        aria-hidden="true"
      />
      <svg
        class="relative h-6 w-6 text-star-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <rect x="5" y="9" width="14" height="7" rx="1.5" />
        <circle cx="7.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
        <circle cx="12" cy="5.5" r="1.25" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
        <circle cx="7.5" cy="18.5" r="1.25" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19.5" r="1.25" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="18.5" r="1.25" fill="currentColor" stroke="none" />
      </svg>
      <span
        class="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-star-400 px-1 text-xs font-bold text-space-950"
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
            Share the QR so others can connect their devices to the room.
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
          :can-set-tutorial-for-player="canSetTutorialForPlayer"
          :can-remove-player="canRemovePlayer"
          @update:new-player-name="emit('update:newPlayerName', $event)"
          @reorder="emit('reorder', $event)"
          @remove-player="emit('removePlayer', $event)"
          @add-player="emit('addPlayer')"
          @register-as-spectator="emit('registerAsSpectator')"
          @register-as-game-master="emit('registerAsGameMaster')"
          @register-as-player-peer="emit('registerAsPlayerPeer')"
          @start-game="emit('startGame')"
          @update:expansions="emit('update:expansions', $event)"
          @set-tutorial-enabled="(playerId, enabled) => emit('setTutorialEnabled', playerId, enabled)"
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

<style scoped>
.lobby-fab-attention {
  box-shadow:
    0 0 0 0 rgb(250 204 21 / 0.45),
    0 10px 15px -3px rgb(0 0 0 / 0.4);
  animation: lobby-fab-glow 2s ease-in-out infinite;
}

@keyframes lobby-fab-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 0 rgb(250 204 21 / 0.45),
      0 10px 15px -3px rgb(0 0 0 / 0.4);
  }

  50% {
    box-shadow:
      0 0 0 10px rgb(250 204 21 / 0),
      0 10px 15px -3px rgb(0 0 0 / 0.4);
  }
}
</style>
