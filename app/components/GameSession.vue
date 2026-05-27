<script setup lang="ts">
import { createLocalTransport, createP2PTransport, LOCAL_HOST_ID } from '~/composables/gameTransport'
import { buildJoinUrl, isValidRoomCode } from '~/utils/room'

const props = defineProps<{
  mode: 'host' | 'guest' | 'local'
  code: string
  hostPeerId?: string
}>()

const router = useRouter()
const config = useRuntimeConfig()
const store = useGameStore()
const isLocal = computed(() => props.mode === 'local')
const isHostMode = computed(() => props.mode === 'host')
const isGuestMode = computed(() => props.mode === 'guest')

const gameRoom = isLocal.value ? null : useGameRoom()
const localSession = isLocal.value ? useLocalGameSession() : null

const connectionPhase = computed(() =>
  isLocal.value ? localSession!.connectionPhase.value : gameRoom!.connectionPhase.value,
)
const pendingLobbyPeers = computed(() =>
  isLocal.value ? localSession!.pendingLobbyPeers.value : gameRoom!.pendingLobbyPeers.value,
)
const hostReady = computed(() =>
  isLocal.value ? localSession!.hostReady.value : gameRoom!.hostReady.value,
)
const signalingWarning = computed(() =>
  isLocal.value ? localSession!.signalingWarning.value : gameRoom!.signalingWarning.value,
)
const selfId = computed(() =>
  isLocal.value ? LOCAL_HOST_ID : gameRoom!.selfId.value,
)

const peerId = computed(() => (isLocal.value ? LOCAL_HOST_ID : store.peerId))
const transport = isLocal.value
  ? createLocalTransport()
  : createP2PTransport((action) => gameRoom!.clientAction(action))

const controller = usePeerGameController({
  transport,
  peerId,
  isLocal: isLocal.value,
})

const {
  screen: gameScreen,
  lobby,
  select,
  reveal,
  scoring,
  newPlayerName,
} = controller

const diag = useConnectionDiagnostics()
const { toast } = useToast()

const connecting = ref(true)
const connectionError = ref('')
const hostLobbyOpen = ref(false)

const joinUrl = computed(() => {
  if (!isHostMode.value) return ''
  const hostPeerId = selfId.value || store.peerId
  if (!hostPeerId) return ''
  return buildJoinUrl(
    props.code,
    hostPeerId,
    config.app.baseURL,
    config.public.siteUrl as string,
  )
})

const hostLobbyBadgeCount = computed(
  () => store.playerCount + pendingLobbyPeers.value.length,
)

const guestAwaitingSession = computed(
  () =>
    isGuestMode.value
    && !connecting.value
    && !connectionError.value
    && (!hostReady.value || !store.state),
)

const showHostLobbyDrawer = computed(
  () => isHostMode.value && !!store.state && !isLocal.value,
)

const sessionPaused = computed(
  () => !isLocal.value && connectionPhase.value === 'reconnecting',
)

const connectionStatusHint = computed(() => {
  if (sessionPaused.value) {
    return store.isHost
      ? 'A player disconnected — waiting for them to rejoin.'
      : 'Host disconnected — keep this page open while reconnecting.'
  }
  if (connectionPhase.value === 'connected' && store.isHost && pendingLobbyPeers.value.length > 0) {
    const pending = pendingLobbyPeers.value.length
    return `${pending} connected device${pending === 1 ? '' : 's'} still joining the lobby.`
  }
  return ''
})

const connectionBadge = computed(() => {
  if (isLocal.value) {
    return { label: 'Pass & Play', class: 'bg-phase-explore/20 text-phase-explore' }
  }
  if (connectionError.value) {
    return { label: 'Error', class: 'bg-red-500/20 text-red-300' }
  }
  switch (connectionPhase.value) {
    case 'listening':
      return { label: 'Listening', class: 'bg-star-400/20 text-star-300' }
    case 'waiting-for-host':
      return { label: 'Connecting…', class: 'bg-amber-500/20 text-amber-300 animate-pulse' }
    case 'connected':
      if (store.isHost) {
        const pending = pendingLobbyPeers.value.length
        const joined = store.playerCount
        if (pending > 0) {
          return {
            label: joined > 0 ? `${joined} players · ${pending} connecting` : `${pending} connecting`,
            class: 'bg-amber-500/20 text-amber-300',
          }
        }
        return {
          label: store.peerCount > 0 ? `Hosting · ${store.peerCount} peers` : 'Listening',
          class: 'bg-star-400/20 text-star-300',
        }
      }
      return { label: 'Connected', class: 'bg-phase-settle/20 text-phase-settle' }
    case 'reconnecting':
      return { label: 'Reconnecting…', class: 'bg-amber-500/20 text-amber-300 animate-pulse' }
    case 'error':
      return { label: 'Offline', class: 'bg-red-500/20 text-red-300' }
    default:
      return { label: 'Connecting…', class: 'bg-space-600/40 text-slate-400' }
  }
})

if (import.meta.client && isLocal.value) {
  if (!isValidRoomCode(props.code)) {
    router.replace('/')
  } else {
    controller.initLocalSession(props.code)
    connecting.value = false
  }
}

onMounted(async () => {
  if (isLocal.value) return

  if (!isValidRoomCode(props.code)) {
    router.replace('/')
    return
  }

  connecting.value = true
  connectionError.value = ''

  try {
    if (props.mode === 'host') {
      const ok = await gameRoom!.startHost(props.code)
      if (!ok) {
        connectionError.value = 'Failed to start hosting. See connection log.'
        toast(connectionError.value, 'error')
      }
    } else {
      if (!props.hostPeerId) {
        connectionError.value = 'Missing host peer. Scan the host QR code to join.'
        toast(connectionError.value, 'error')
        return
      }
      const ok = await gameRoom!.joinHost(props.code, props.hostPeerId)
      if (!ok) {
        connectionError.value = 'Failed to join host. See connection log.'
        toast(connectionError.value, 'error')
      }
    }
  } catch {
    connectionError.value = 'Failed to establish WebRTC connection.'
    toast(connectionError.value, 'error')
  } finally {
    connecting.value = false
  }
})

watch(joinUrl, (url) => {
  if (url) diag.log('success', 'Host invite link ready', { joinUrl: url })
})

async function copyInviteLink() {
  if (!joinUrl.value) return
  await navigator.clipboard.writeText(joinUrl.value)
  toast('Invite link copied', 'success', 2500)
}
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6">
    <div v-if="connecting && isLocal" class="text-center text-slate-400">
      <p class="animate-pulse">Setting up pass-and-play...</p>
    </div>

    <div v-else-if="connecting && !isLocal" class="space-y-4">
      <ConnectionStatusBanner
        :phase="connectionPhase"
        :is-host="mode === 'host'"
        :message="connectionError || signalingWarning"
      />
      <p class="text-center text-sm text-slate-400 animate-pulse">
        {{ mode === 'host' ? 'Starting host peer…' : 'Joining room…' }}
      </p>
    </div>

    <div v-else-if="connectionError" class="space-y-4 text-center">
      <ConnectionStatusBanner
        phase="error"
        :is-host="mode === 'host'"
        :message="connectionError"
      />
      <NuxtLink to="/" class="text-sm text-nebula-300 hover:underline">← Back home</NuxtLink>
    </div>

    <div v-else-if="guestAwaitingSession" class="space-y-4">
      <ConnectionStatusBanner
        :phase="connectionPhase"
        :is-host="false"
        :message="signalingWarning"
      />
      <p class="text-center text-sm text-slate-400 animate-pulse">
        {{ hostReady ? 'Syncing game from host…' : 'Connecting to host…' }}
      </p>
      <p class="text-center text-xs text-slate-500">
        Open <span class="text-slate-400">Connection log</span> below if this takes more than a few seconds.
      </p>
    </div>

    <template v-else-if="store.state && gameScreen">
      <div :class="{ 'pointer-events-none opacity-60': sessionPaused }">
        <header
          class="flex items-center justify-between"
          :class="connectionStatusHint ? 'mb-2' : 'mb-6'"
        >
          <NuxtLink to="/" class="text-sm text-slate-400 hover:text-slate-200">← Home</NuxtLink>
          <span class="font-mono text-sm tracking-widest text-star-400">{{ code }}</span>
          <span class="rounded-full px-2 py-0.5 text-xs" :class="connectionBadge.class">
            {{ connectionBadge.label }}
          </span>
        </header>

        <p
          v-if="connectionStatusHint"
          class="mb-6 text-center text-xs"
          :class="sessionPaused ? 'text-amber-300/90' : 'text-slate-500'"
        >
          {{ connectionStatusHint }}
        </p>

        <div
          v-if="showHostLobbyDrawer && gameScreen !== 'lobby'"
          class="mb-6 rounded-xl border border-space-600 bg-space-800/30 px-4 py-3 text-center text-sm text-slate-400"
        >
          Open the table button to share the QR code, choose how you want to join, or manage players.
        </div>

        <LobbyScreen
          v-if="gameScreen === 'lobby' && !showHostLobbyDrawer"
          v-bind="lobby"
          :room-code="code"
          :pending-peer-ids="pendingLobbyPeers"
          :new-player-name="newPlayerName"
          @update:new-player-name="newPlayerName = $event"
          @reorder="controller.reorderPlayers"
          @add-player="controller.addPlayer()"
          @register-as-spectator="controller.registerAsSpectator()"
          @register-as-game-master="controller.registerAsGameMaster()"
          @register-as-player-peer="controller.registerAsPlayerPeer()"
          @start-game="controller.startGame()"
          @update:expansions="controller.updateExpansions"
          @set-tutorial-enabled="(id, enabled) => controller.setTutorialEnabled(id, enabled)"
        />

        <div
          v-else-if="showHostLobbyDrawer && gameScreen === 'lobby'"
          class="rounded-xl border border-space-600 bg-space-800/30 px-4 py-8 text-center text-sm text-slate-400"
        >
          <p class="font-medium text-slate-300">Host lobby ready</p>
          <p class="mt-2">
            Tap the pulsing table button to share the QR code, choose how you want to join, and start the game.
          </p>
        </div>

        <SelectScreen
          v-else-if="gameScreen === 'select'"
          v-bind="select"
          @ready="controller.handDeviceToPlayer()"
          @update-selections="controller.selectPhases"
          @confirm="controller.confirmSelection()"
          @adjust-vp="controller.adjustVp"
          @set-vp="controller.setVp"
          @adjust-empire="controller.adjustEmpire"
          @set-empire="controller.setEmpire"
          @end-game="controller.endGame()"
        />

        <RevealPhaseScreen
          v-else-if="gameScreen === 'reveal'"
          v-bind="reveal"
          @set-reveal-index="controller.setRevealIndex"
          @adjust-vp="controller.adjustVp"
          @set-vp="controller.setVp"
          @adjust-empire="controller.adjustEmpire"
          @set-empire="controller.setEmpire"
          @finish-round="controller.finishRevealRound()"
        />

        <ScoringScreen
          v-else-if="gameScreen === 'scoring'"
          v-bind="scoring"
          @ready="controller.handDeviceToPlayer()"
          @submit-tiebreak="controller.submitTiebreak"
        />
      </div>

      <HostLobbyDrawer
        v-if="showHostLobbyDrawer"
        v-model:open="hostLobbyOpen"
        :pulse-button="gameScreen === 'lobby' && !hostLobbyOpen"
        :badge-count="hostLobbyBadgeCount"
        :room-code="code"
        :join-url="joinUrl"
        :pending-peer-ids="pendingLobbyPeers"
        v-bind="lobby"
        :new-player-name="newPlayerName"
        @update:new-player-name="newPlayerName = $event"
        @reorder="controller.reorderPlayers"
        @add-player="controller.addPlayer()"
        @register-as-spectator="controller.registerAsSpectator()"
        @register-as-game-master="controller.registerAsGameMaster()"
        @register-as-player-peer="controller.registerAsPlayerPeer()"
        @start-game="controller.startGame()"
        @update:expansions="controller.updateExpansions"
        @set-tutorial-enabled="(id, enabled) => controller.setTutorialEnabled(id, enabled)"
        @copy-invite="copyInviteLink"
      />
    </template>

    <ConnectionDiagnosticsDrawer />
  </div>
</template>
