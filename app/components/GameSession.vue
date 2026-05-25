<script setup lang="ts">
import type { Expansions, GameAction, PhaseId } from '~/types/game'
import { getVpTiedPlayerIds, needsTiebreakInput, rankPlayers, shouldEndGameAfterRound } from '~/utils/scoring'
import { buildJoinUrl, isValidRoomCode } from '~/utils/room'
import { loadSavedLocalPlayers, maxLocalPlayerCounter, saveLocalPlayers } from '~/utils/localPlayers'

const LOCAL_HOST_ID = 'local-host'

const props = defineProps<{
  mode: 'host' | 'guest' | 'local'
  code: string
  hostPeerId?: string
}>()

const router = useRouter()
const config = useRuntimeConfig()
const store = useGameStore()
const { startHost, joinHost, clientAction, hostReady, connectionPhase, signalingWarning, selfId } =
  props.mode === 'local' ? useLocalGameSession() : useGameRoom()
const diag = useConnectionDiagnostics()
const { toast } = useToast()
const {
  passStep,
  activePlayerId,
  resetForPlayers,
  handDeviceToPlayer,
  finishPlayerTurn,
} = usePassAndPlay()

const isLocal = computed(() => props.mode === 'local')

const playerName = ref('')
const newPlayerName = ref('')
let localPlayerCounter = 0
let restoringLocalPlayers = false
const localSelections = ref<PhaseId[]>([])
const localExpansions = ref<Expansions>({
  gatheringStorm: false,
  rebelVsImperium: false,
  prestige: false,
  goals: false,
})
const connecting = ref(true)
const connectionError = ref('')

function expansionsEqual(a: Expansions, b: Expansions): boolean {
  return (
    a.gatheringStorm === b.gatheringStorm
    && a.rebelVsImperium === b.rebelVsImperium
    && a.prestige === b.prestige
    && a.goals === b.goals
  )
}

let syncingExpansionsFromStore = false

const joinUrl = computed(() => {
  if (props.mode !== 'host' || !selfId.value) return ''
  return buildJoinUrl(
    props.code,
    selfId.value,
    config.app.baseURL,
    config.public.siteUrl as string,
  )
})

const activePlayer = computed(() =>
  store.state?.players.find((p) => p.id === activePlayerId.value),
)

const passProgress = computed(() => {
  if (!store.state) return ''
  const total = store.state.players.length
  if (store.state.screen === 'select') {
    const done = store.state.players.filter((p) => store.state!.confirmed[p.id]).length
    return `${done} of ${total} players locked in`
  }
  if (store.state.screen === 'scoring') {
    const tiedIds = getVpTiedPlayerIds(
      store.state.players,
      store.state.scores,
      store.state.expansions,
    )
    const done = tiedIds.filter((id) => store.state!.scores[id]?.tiebreakSubmitted).length
    return `${done} of ${tiedIds.length} tie-breakers collected`
  }
  return ''
})

function dispatchAction(action: GameAction) {
  if (isLocal.value) {
    store.dispatch(action)
  } else {
    clientAction(action)
  }
}

function nextLocalPlayerId() {
  localPlayerCounter += 1
  return `local-player-${localPlayerCounter}`
}

function addLocalPlayer() {
  const name = newPlayerName.value.trim()
  if (!name) return
  dispatchAction({ type: 'JOIN', playerId: nextLocalPlayerId(), name })
  newPlayerName.value = ''
}

function reorderPlayers(playerIds: string[]) {
  dispatchAction({ type: 'REORDER_PLAYERS', playerIds })
}

function syncPassAndPlay() {
  if (!isLocal.value || !store.state) return

  if (store.state.screen === 'select') {
    resetForPlayers(store.state.players, (id) => store.state!.confirmed[id])
    localSelections.value = []
  } else if (store.state.screen === 'scoring') {
    if (needsTiebreakInput(store.state.players, store.state.scores, store.state.expansions)) {
      const tiedIds = getVpTiedPlayerIds(
        store.state.players,
        store.state.scores,
        store.state.expansions,
      )
      resetForPlayers(
        store.state.players.filter((player) => tiedIds.includes(player.id)),
        (id) => store.state!.scores[id]?.tiebreakSubmitted ?? false,
      )
    }
  }
}

function persistLocalPlayers() {
  if (!isLocal.value || !store.state || restoringLocalPlayers) return
  const players = store.state.players
  if (players.length === 0) return
  saveLocalPlayers(players.map((player) => ({ id: player.id, name: player.name })))
}

function restoreLocalPlayersFromStorage() {
  const saved = loadSavedLocalPlayers()
  if (saved.length === 0) return

  restoringLocalPlayers = true
  try {
    for (const player of saved) {
      store.dispatch({ type: 'JOIN', playerId: player.id, name: player.name })
    }
    localPlayerCounter = maxLocalPlayerCounter(saved)
  } finally {
    restoringLocalPlayers = false
  }
}

function initLocalSession() {
  if (!isValidRoomCode(props.code)) {
    diag.log('error', 'Invalid room code — redirecting home', { code: props.code })
    router.replace('/')
    return
  }

  store.initAsHost(props.code, LOCAL_HOST_ID)
  store.connected = true
  connecting.value = false
  restoreLocalPlayersFromStorage()
  diag.log('success', 'Local pass-and-play session started', { code: props.code })
}

if (import.meta.client && props.mode === 'local') {
  initLocalSession()
}

onMounted(async () => {
  diag.log('info', 'GameSession mounted', {
    mode: props.mode,
    code: props.code,
    hostPeerId: props.hostPeerId,
    userAgent: import.meta.client ? navigator.userAgent : 'server',
    online: import.meta.client ? navigator.onLine : undefined,
  })

  if (props.mode === 'local') {
    diag.log('info', 'Initial connection attempt finished', {
      connectionError: null,
      hostReady: hostReady.value,
      hasState: !!store.state,
    })
    return
  }

  if (!isValidRoomCode(props.code)) {
    diag.log('error', 'Invalid room code — redirecting home', { code: props.code })
    router.replace('/')
    return
  }

  connecting.value = true
  connectionError.value = ''

  try {
    if (props.mode === 'host') {
      const ok = await startHost(props.code)
      if (!ok) {
        connectionError.value = 'Failed to start hosting. See connection log.'
        toast(connectionError.value, 'error')
      }
    } else {
      if (!props.hostPeerId) {
        connectionError.value = 'Missing host peer. Scan the host QR code to join.'
        toast(connectionError.value, 'error')
        diag.log('error', connectionError.value)
        return
      }
      const ok = await joinHost(props.code, props.hostPeerId)
      if (!ok) {
        connectionError.value = 'Failed to join host. See connection log.'
        toast(connectionError.value, 'error')
      }
    }
  } catch (err) {
    connectionError.value = 'Failed to establish WebRTC connection.'
    toast(connectionError.value, 'error')
    diag.log('error', connectionError.value, err)
  } finally {
    connecting.value = false
    diag.log('info', 'Initial connection attempt finished', {
      connectionError: connectionError.value || null,
      hostReady: hostReady.value,
      hasState: !!store.state,
    })
  }
})

watch(
  () => (store.state ? `${store.state.screen}:${store.state.round}` : null),
  () => syncPassAndPlay(),
)

watch(
  () => (isLocal.value ? store.state?.players : null),
  () => persistLocalPlayers(),
  { deep: true },
)

watch(
  () => store.state?.expansions,
  (exp) => {
    if (!exp || expansionsEqual(localExpansions.value, exp)) return
    syncingExpansionsFromStore = true
    localExpansions.value = { ...exp }
    syncingExpansionsFromStore = false
  },
  { deep: true },
)

watch(
  () => (isLocal.value ? activePlayerId.value : store.peerId),
  (id) => {
    if (!id) {
      localSelections.value = []
      return
    }
    const sel = store.state?.selections[id]
    localSelections.value = sel ? [...sel] : []
  },
)

function handleSetName() {
  if (!playerName.value.trim()) return
  dispatchAction({ type: 'SET_NAME', playerId: store.peerId, name: playerName.value.trim() })
  if (!store.state?.players.some((p) => p.id === store.peerId)) {
    dispatchAction({ type: 'JOIN', playerId: store.peerId, name: playerName.value.trim() })
  }
}

function handleExpansionsUpdate() {
  if (syncingExpansionsFromStore || !store.state) return
  if (!(store.isHost || isLocal.value)) return
  if (expansionsEqual(localExpansions.value, store.state.expansions)) return
  dispatchAction({ type: 'SET_EXPANSIONS', expansions: { ...localExpansions.value } })
}

watch(localExpansions, handleExpansionsUpdate, { deep: true })

function startGame() {
  dispatchAction({ type: 'START_GAME' })
}

function updateSelections(phases: PhaseId[]) {
  localSelections.value = phases
  const playerId = isLocal.value ? activePlayerId.value : store.peerId
  if (!playerId) return
  dispatchAction({ type: 'SELECT_PHASES', playerId, phases })
}

function confirmSelection() {
  const playerId = isLocal.value ? activePlayerId.value : store.peerId
  if (!playerId) return
  dispatchAction({ type: 'CONFIRM', playerId })
  if (isLocal.value && store.state?.screen === 'select') {
    finishPlayerTurn(store.state.players, (id) => store.state!.confirmed[id])
    localSelections.value = []
  }
}

function nextRound() {
  dispatchAction({ type: 'NEXT_ROUND' })
}

function setRevealIndex(index: number) {
  dispatchAction({ type: 'SET_REVEAL_INDEX', index })
}

function adjustVp(playerId: string, delta: number) {
  dispatchAction({ type: 'ADJUST_VP', playerId, delta })
}

function setVp(playerId: string, value: number) {
  dispatchAction({ type: 'SET_VP', playerId, vpChips: value })
}

function finishRevealRound() {
  if (!store.state) return
  if (shouldEndGameAfterRound(store.state.players, store.state.vpPoolInitial)) {
    endGame()
  } else {
    nextRound()
  }
}

function endGame() {
  dispatchAction({ type: 'END_GAME' })
}

function submitTiebreak(goodsOnWorlds: number, cardsInHand: number) {
  const playerId = isLocal.value ? activePlayerId.value : store.peerId
  if (!playerId || !store.state) return
  dispatchAction({ type: 'SUBMIT_TIEBREAK', playerId, goodsOnWorlds, cardsInHand })
  if (isLocal.value) {
    const tiedIds = getVpTiedPlayerIds(
      store.state.players,
      store.state.scores,
      store.state.expansions,
    )
    finishPlayerTurn(
      store.state.players.filter((player) => tiedIds.includes(player.id)),
      (id) => store.state!.scores[id]?.tiebreakSubmitted ?? false,
    )
  }
}

const mySelections = computed(() => {
  if (isLocal.value && passStep.value === 'handoff') return []
  const id = isLocal.value ? activePlayerId.value : store.peerId
  if (!id) return localSelections.value
  return store.state?.selections[id] ?? localSelections.value
})

const isConfirmed = computed(() => {
  const id = isLocal.value ? activePlayerId.value : store.peerId
  if (!id) return false
  return store.state?.confirmed[id] ?? false
})

const showNameForm = computed(() => !isLocal.value && !store.me?.name)

const ranked = computed(() => {
  if (!store.state) return []
  return rankPlayers(store.state.players, store.state.scores, store.state.expansions)
})

const needsTiebreak = computed(() => {
  if (!store.state) return false
  return needsTiebreakInput(store.state.players, store.state.scores, store.state.expansions)
})

const showConnectionBanner = computed(() => {
  if (isLocal.value) return false
  const phase = connectionPhase.value
  return (
    phase === 'connecting'
    || phase === 'listening'
    || phase === 'waiting-for-host'
    || phase === 'reconnecting'
    || phase === 'error'
  )
})

const guestWaitingForHost = computed(
  () =>
    props.mode === 'guest'
    && !hostReady.value
    && !store.state
    && connectionPhase.value === 'waiting-for-host',
)

const sessionPaused = computed(
  () => !isLocal.value && connectionPhase.value === 'reconnecting',
)

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
        const count = store.peerCount
        return {
          label: count > 0 ? `Hosting · ${count}` : 'Listening',
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

const activeTiebreakPlayer = computed(() => {
  if (!isLocal.value || !activePlayerId.value || !store.state) return null
  const tiedIds = getVpTiedPlayerIds(
    store.state.players,
    store.state.scores,
    store.state.expansions,
  )
  if (!tiedIds.includes(activePlayerId.value)) return null
  if (store.state.scores[activePlayerId.value]?.tiebreakSubmitted) return null
  return store.state.players.find((player) => player.id === activePlayerId.value) ?? null
})

const showMyTiebreakForm = computed(() => {
  if (!store.state || !needsTiebreak.value || isLocal.value) return false
  const tiedIds = getVpTiedPlayerIds(
    store.state.players,
    store.state.scores,
    store.state.expansions,
  )
  return tiedIds.includes(store.peerId) && !store.state.scores[store.peerId]?.tiebreakSubmitted
})

watch(joinUrl, (url) => {
  if (url) diag.log('success', 'Host invite link ready', { joinUrl: url })
})

watch(signalingWarning, (warning) => {
  if (warning) diag.log('warn', 'Signaling warning shown to user', { warning })
})

async function copyInviteLink() {
  if (!joinUrl.value) return
  await navigator.clipboard.writeText(joinUrl.value)
  toast('Invite link copied', 'success', 2500)
}
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-lg px-4 py-6">
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

    <div v-else-if="guestWaitingForHost" class="space-y-4">
      <ConnectionStatusBanner
        :phase="connectionPhase"
        :is-host="false"
        :message="signalingWarning"
      />
      <p class="text-center text-xs text-slate-500">
        Open <span class="text-slate-400">Connection log</span> below to copy diagnostics.
      </p>
    </div>

    <template v-else-if="store.state">
      <ConnectionStatusBanner
        v-if="showConnectionBanner"
        :phase="connectionPhase"
        :is-host="store.isHost"
        :guest-count="store.peerCount"
        :message="signalingWarning || connectionError"
      />

      <div :class="{ 'pointer-events-none opacity-60': sessionPaused }">
      <header class="mb-6 flex items-center justify-between">
        <NuxtLink to="/" class="text-sm text-slate-400 hover:text-slate-200">← Home</NuxtLink>
        <span class="font-mono text-sm tracking-widest text-star-400">{{ code }}</span>
        <span
          class="rounded-full px-2 py-0.5 text-xs"
          :class="connectionBadge.class"
        >
          {{ connectionBadge.label }}
        </span>
      </header>

      <!-- LOBBY -->
      <div v-if="store.state.screen === 'lobby'" class="space-y-6">
        <div v-if="isLocal" class="rounded-xl border border-space-600 bg-space-800/30 px-4 py-3 text-center text-sm text-slate-400">
          Add everyone playing at this table, drag to set pass order, then start the game.
        </div>

        <div v-else-if="store.isHost">
          <RoomCodeDisplay
            v-if="joinUrl"
            :code="code"
            :join-url="joinUrl"
          />
          <p v-else class="text-center text-sm text-slate-400 animate-pulse">
            Preparing invite link...
          </p>
          <button
            v-if="joinUrl"
            type="button"
            class="mt-3 w-full rounded-xl border border-space-600 py-2.5 text-sm text-slate-300 hover:border-nebula-400"
            @click="copyInviteLink"
          >
            Copy invite link
          </button>
          <p class="mt-2 text-center text-xs text-slate-500">
            Players scan this QR to connect directly to your device.
          </p>
        </div>

        <div v-if="isLocal" class="space-y-3">
          <label class="text-sm text-slate-400">Add player</label>
          <input
            v-model="newPlayerName"
            type="text"
            maxlength="20"
            placeholder="Player name"
            class="w-full rounded-xl border border-space-600 bg-space-800 px-4 py-3 text-slate-100 focus:border-nebula-400 focus:outline-none"
            @keyup.enter="addLocalPlayer"
          />
          <button
            type="button"
            class="w-full rounded-xl bg-nebula-400 py-3 font-semibold text-space-950"
            :disabled="!newPlayerName.trim()"
            @click="addLocalPlayer"
          >
            Add Player
          </button>
        </div>

        <div v-else-if="showNameForm" class="space-y-3">
          <label class="text-sm text-slate-400">Your Name</label>
          <input
            v-model="playerName"
            type="text"
            maxlength="20"
            placeholder="Enter your name"
            class="w-full rounded-xl border border-space-600 bg-space-800 px-4 py-3 text-slate-100 focus:border-nebula-400 focus:outline-none"
            @keyup.enter="handleSetName"
          />
          <button
            type="button"
            class="w-full rounded-xl bg-nebula-400 py-3 font-semibold text-space-950"
            :disabled="!playerName.trim()"
            @click="handleSetName"
          >
            {{ store.isHost ? 'Join as Host' : 'Join Lobby' }}
          </button>
        </div>

        <LobbyPlayerList
          v-if="(isLocal || (store.me && !showNameForm)) && store.state.players.length"
          :players="store.state.players"
          :host-id="store.state.hostId"
          :reorderable="isLocal || store.isHost"
          :show-host-badge="!isLocal"
          :show-order="isLocal || store.isHost"
          @reorder="reorderPlayers"
        />

        <ExpansionToggles v-if="store.isHost || isLocal" v-model="localExpansions" />
        <ExpansionToggles v-else v-model="localExpansions" disabled />

        <button
          v-if="store.isHost || isLocal"
          type="button"
          class="w-full rounded-xl bg-phase-settle py-4 text-lg font-bold text-space-950 disabled:opacity-40"
          :disabled="store.playerCount < 2"
          @click="startGame"
        >
          Start Game ({{ store.playerCount }} players)
        </button>
        <p v-else-if="store.me" class="text-center text-sm text-slate-400">
          Waiting for host to start the game...
        </p>
      </div>

      <!-- PHASE SELECT -->
      <div v-else-if="store.state.screen === 'select'" class="space-y-6">
        <div class="text-center">
          <p class="text-sm text-slate-400">Round {{ store.state.round }}</p>
          <h2 class="text-xl font-bold">Phase Selection</h2>
        </div>

        <PassDevicePrompt
          v-if="isLocal && passStep === 'handoff' && activePlayer"
          :player-name="activePlayer.name"
          subtitle="Pass the device to"
          :progress="passProgress"
          @ready="handDeviceToPlayer"
        />

        <template v-else-if="!isLocal || passStep === 'playing'">
          <PhasePicker
            :expansions="store.state.expansions"
            :player-count="store.playerCount"
            :selected="mySelections"
            :locked="isConfirmed"
            @update="updateSelections"
            @confirm="confirmSelection"
          />

          <VpTracker
            v-if="isLocal && activePlayerId"
            :players="store.state.players"
            :my-id="activePlayerId"
            :vp-pool="store.state.vpPool"
            :vp-pool-initial="store.state.vpPoolInitial"
            :last-round="store.state.lastRound"
            :game-ended="store.state.gameEnded"
            :is-host="true"
            local-mode
            @adjust-vp="adjustVp"
            @set-vp="setVp"
            @end-game="endGame"
          />
        </template>

        <PlayerStatusList
          :players="store.state.players"
          :my-id="isLocal ? (activePlayerId ?? '') : store.peerId"
        />

        <VpTracker
          v-if="!isLocal"
          :players="store.state.players"
          :my-id="store.peerId"
          :vp-pool="store.state.vpPool"
          :vp-pool-initial="store.state.vpPoolInitial"
          :last-round="store.state.lastRound"
          :game-ended="store.state.gameEnded"
          :is-host="store.isHost"
          @adjust-vp="adjustVp"
          @set-vp="setVp"
          @end-game="endGame"
        />
      </div>

      <!-- REVEAL -->
      <div v-else-if="store.state.screen === 'reveal'" class="space-y-6">
        <RevealScreen
          :phases="store.state.revealedPhases"
          :round="store.state.round"
          :current-index="store.state.revealPhaseIndex ?? 0"
          :players="store.state.players"
          :vp-pool="store.state.vpPool"
          :vp-pool-initial="store.state.vpPoolInitial"
          :last-round="store.state.lastRound"
          :my-id="isLocal ? '' : store.peerId"
          :local-mode="isLocal"
          :can-navigate="store.isHost || isLocal"
          @set-reveal-index="setRevealIndex"
          @adjust-vp="adjustVp"
          @set-vp="setVp"
          @finish-round="finishRevealRound"
        />
      </div>

      <!-- SCORING -->
      <div v-else-if="store.state.screen === 'scoring'" class="space-y-6">
        <div v-if="needsTiebreak" class="space-y-4">
          <p class="text-center text-sm font-semibold text-star-400">
            Tie for first place — answer the tie-breaker questions
          </p>

          <PassDevicePrompt
            v-if="isLocal && passStep === 'handoff' && activePlayer && activeTiebreakPlayer"
            :player-name="activePlayer.name"
            subtitle="Pass the device to"
            :progress="passProgress"
            @ready="handDeviceToPlayer"
          />

          <TiebreakerSheet
            v-else-if="isLocal && passStep === 'playing' && activeTiebreakPlayer"
            :player-name="activeTiebreakPlayer.name"
            @submit="submitTiebreak"
          />

          <TiebreakerSheet
            v-else-if="showMyTiebreakForm && store.me"
            :player-name="store.me.name"
            @submit="submitTiebreak"
          />

          <p v-else-if="!isLocal" class="text-center text-sm text-slate-400">
            Waiting for tied players to submit tie-breakers...
          </p>
        </div>

        <Leaderboard
          v-if="!needsTiebreak"
          :ranked="ranked"
          :expansions="store.state.expansions"
        />
      </div>
      </div>
    </template>

    <ConnectionDiagnosticsDrawer />
  </div>
</template>
