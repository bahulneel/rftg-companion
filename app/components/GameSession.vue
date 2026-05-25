<script setup lang="ts">
import type { Expansions, GameAction, PhaseId, ScoreInput } from '~/types/game'
import { rankPlayers } from '~/utils/scoring'
import { buildJoinUrl, isValidRoomCode } from '~/utils/room'

const LOCAL_HOST_ID = 'local-host'

const props = defineProps<{
  mode: 'host' | 'guest' | 'local'
  code: string
  hostPeerId?: string
}>()

const router = useRouter()
const config = useRuntimeConfig()
const store = useGameStore()
const { startHost, joinHost, clientAction, hostReady, signalingWarning, selfId } = useGameRoom()
const diag = useConnectionDiagnostics()
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
const localSelections = ref<PhaseId[]>([])
const localExpansions = ref<Expansions>({
  gatheringStorm: false,
  rebelVsImperium: false,
  prestige: false,
  goals: false,
})
const connecting = ref(true)
const connectionError = ref('')

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
    const done = store.state.players.filter((p) => store.state!.scores[p.id]?.submitted).length
    return `${done} of ${total} scores submitted`
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

function syncPassAndPlay() {
  if (!isLocal.value || !store.state) return

  if (store.state.screen === 'select') {
    resetForPlayers(store.state.players, (id) => store.state!.confirmed[id])
    localSelections.value = []
  } else if (store.state.screen === 'scoring') {
    resetForPlayers(
      store.state.players,
      (id) => store.state!.scores[id]?.submitted ?? false,
    )
  }
}

onMounted(async () => {
  diag.log('info', 'GameSession mounted', {
    mode: props.mode,
    code: props.code,
    hostPeerId: props.hostPeerId,
    userAgent: import.meta.client ? navigator.userAgent : 'server',
    online: import.meta.client ? navigator.onLine : undefined,
  })

  if (!isValidRoomCode(props.code)) {
    diag.log('error', 'Invalid room code — redirecting home', { code: props.code })
    router.replace('/')
    return
  }

  connecting.value = true
  connectionError.value = ''

  try {
    if (props.mode === 'local') {
      store.initAsHost(props.code, LOCAL_HOST_ID)
      store.connected = true
      diag.log('success', 'Local pass-and-play session started', { code: props.code })
    } else if (props.mode === 'host') {
      const ok = await startHost(props.code)
      if (!ok) connectionError.value = 'Failed to start hosting. See connection log.'
    } else {
      if (!props.hostPeerId) {
        connectionError.value = 'Missing host peer. Scan the host QR code to join.'
        diag.log('error', connectionError.value)
        return
      }
      const ok = await joinHost(props.code, props.hostPeerId)
      if (!ok) connectionError.value = 'Failed to join host. See connection log.'
    }
  } catch (err) {
    connectionError.value = 'Failed to establish WebRTC connection.'
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
  () => [store.state?.screen, store.state?.round] as const,
  () => syncPassAndPlay(),
)

watch(
  () => store.state?.expansions,
  (exp) => {
    if (exp) localExpansions.value = { ...exp }
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
  if (store.isHost || isLocal.value) {
    dispatchAction({ type: 'SET_EXPANSIONS', expansions: { ...localExpansions.value } })
  }
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

function adjustVp(playerId: string, delta: number) {
  dispatchAction({ type: 'ADJUST_VP', playerId, delta })
}

function endGame() {
  dispatchAction({ type: 'END_GAME' })
}

function submitScore(score: Partial<ScoreInput>) {
  const playerId = isLocal.value ? activePlayerId.value : store.peerId
  if (!playerId) return
  dispatchAction({ type: 'SUBMIT_SCORE', playerId, score })
  if (isLocal.value && store.state?.screen === 'scoring') {
    finishPlayerTurn(
      store.state.players,
      (id) => store.state!.scores[id]?.submitted ?? false,
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

const allScoresSubmitted = computed(() =>
  store.state?.players.every((p) => store.state?.scores[p.id]?.submitted) ?? false,
)

const activeScorePlayer = computed(() => {
  if (!isLocal.value || !activePlayerId.value || !store.state) return null
  const player = store.state.players.find((p) => p.id === activePlayerId.value)
  if (!player || store.state.scores[activePlayerId.value]?.submitted) return null
  return player
})

watch(joinUrl, (url) => {
  if (url) diag.log('success', 'Host invite link ready', { joinUrl: url })
})

watch(signalingWarning, (warning) => {
  if (warning) diag.log('warn', 'Signaling warning shown to user', { warning })
})

watch(hostReady, (ready) => {
  if (props.mode === 'guest' && ready) {
    diag.log('success', 'Guest UI: host is ready — showing lobby')
  }
})

async function copyInviteLink() {
  if (!joinUrl.value) return
  await navigator.clipboard.writeText(joinUrl.value)
}
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-lg px-4 py-6">
    <div v-if="connecting" class="text-center text-slate-400">
      <p class="animate-pulse">
        {{
          mode === 'local'
            ? 'Setting up pass-and-play...'
            : mode === 'host'
              ? 'Starting host peer...'
              : 'Connecting to host...'
        }}
      </p>
    </div>

    <div v-else-if="connectionError" class="space-y-4 text-center">
      <p class="text-red-400">{{ connectionError }}</p>
      <NuxtLink to="/" class="text-sm text-nebula-300 hover:underline">← Back home</NuxtLink>
    </div>

    <div v-else-if="mode === 'guest' && !hostReady && !store.state" class="space-y-4 text-center text-slate-400">
      <p class="animate-pulse">Waiting for host peer...</p>
      <p class="text-xs">The host must have the game open on their device.</p>
      <p v-if="signalingWarning" class="text-xs text-amber-400/90">{{ signalingWarning }}</p>
      <p class="text-xs text-slate-600">
        Open <span class="text-slate-500">Connection log</span> below to copy diagnostics for troubleshooting.
      </p>
    </div>

    <template v-else-if="store.state">
      <header class="mb-6 flex items-center justify-between">
        <NuxtLink to="/" class="text-sm text-slate-400 hover:text-slate-200">← Home</NuxtLink>
        <span class="font-mono text-sm tracking-widest text-star-400">{{ code }}</span>
        <span
          class="rounded-full px-2 py-0.5 text-xs"
          :class="
            isLocal
              ? 'bg-phase-explore/20 text-phase-explore'
              : store.isHost
                ? 'bg-star-400/20 text-star-300'
                : 'bg-phase-settle/20 text-phase-settle'
          "
        >
          {{ isLocal ? 'Pass & Play' : store.isHost ? 'Hosting' : 'Connected' }}
        </span>
      </header>

      <!-- LOBBY -->
      <div v-if="store.state.screen === 'lobby'" class="space-y-6">
        <div v-if="isLocal" class="rounded-xl border border-space-600 bg-space-800/30 px-4 py-3 text-center text-sm text-slate-400">
          Add everyone playing at this table, then start the game. You'll pass the device for hidden phase picks.
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

        <div v-if="(isLocal || (store.me && !showNameForm)) && store.state.players.length">
          <h2 class="mb-3 text-lg font-semibold">Players ({{ store.playerCount }})</h2>
          <ul class="space-y-2">
            <li
              v-for="player in store.state.players"
              :key="player.id"
              class="flex items-center justify-between rounded-lg bg-space-800/50 px-4 py-2"
            >
              <span>{{ player.name }}</span>
              <span v-if="!isLocal && player.id === store.state.hostId" class="text-xs text-star-400">Host</span>
            </li>
          </ul>
        </div>

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
            @adjust-vp="adjustVp"
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
          @end-game="endGame"
        />
      </div>

      <!-- REVEAL -->
      <div v-else-if="store.state.screen === 'reveal'" class="space-y-6">
        <RevealScreen
          :phases="store.state.revealedPhases"
          :round="store.state.round"
          @next-round="nextRound"
        />

        <VpTracker
          :players="store.state.players"
          :my-id="isLocal ? '' : store.peerId"
          :vp-pool="store.state.vpPool"
          :vp-pool-initial="store.state.vpPoolInitial"
          :last-round="store.state.lastRound"
          :game-ended="store.state.gameEnded"
          :is-host="store.isHost || isLocal"
          :local-mode="isLocal"
          @adjust-vp="adjustVp"
          @end-game="endGame"
        />
      </div>

      <!-- SCORING -->
      <div v-else-if="store.state.screen === 'scoring'" class="space-y-6">
        <PassDevicePrompt
          v-if="isLocal && passStep === 'handoff' && activePlayer && !allScoresSubmitted"
          :player-name="activePlayer.name"
          subtitle="Pass the device to"
          :progress="passProgress"
          @ready="handDeviceToPlayer"
        />

        <ScoreSheet
          v-else-if="isLocal && passStep === 'playing' && activeScorePlayer"
          :expansions="store.state.expansions"
          :score="store.state.scores[activeScorePlayer.id] ?? { vpChips: activeScorePlayer.vpChips, cardFaceValue: 0, devBonuses: 0, prestigePoints: 0, goalPoints: 0, cardsInHand: 0, goodsOnWorlds: 0, submitted: false }"
          :player-name="activeScorePlayer.name"
          :submitted="false"
          @submit="submitScore"
        />

        <ScoreSheet
          v-else-if="!isLocal && store.me && !store.state.scores[store.peerId]?.submitted"
          :expansions="store.state.expansions"
          :score="store.state.scores[store.peerId] ?? { vpChips: store.me.vpChips, cardFaceValue: 0, devBonuses: 0, prestigePoints: 0, goalPoints: 0, cardsInHand: 0, goodsOnWorlds: 0, submitted: false }"
          :player-name="store.me.name"
          :submitted="false"
          @submit="submitScore"
        />

        <div v-if="allScoresSubmitted || ranked.length > 0">
          <Leaderboard
            v-if="allScoresSubmitted"
            :ranked="ranked"
            :expansions="store.state.expansions"
          />
          <p v-else-if="!isLocal" class="text-center text-sm text-slate-400">
            Waiting for all players to submit scores...
          </p>
        </div>
      </div>
    </template>

    <ConnectionDiagnosticsDrawer />
  </div>
</template>
