<script setup lang="ts">
import type { Expansions, PhaseId, ScoreInput } from '~/types/game'
import { rankPlayers } from '~/utils/scoring'
import { buildJoinUrl, isValidRoomCode } from '~/utils/room'

const props = defineProps<{
  mode: 'host' | 'guest'
  code: string
  hostPeerId?: string
}>()

const router = useRouter()
const config = useRuntimeConfig()
const store = useGameStore()
const { startHost, joinHost, clientAction, hostReady, selfId } = useGameRoom()

const playerName = ref('')
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
  return buildJoinUrl(props.code, selfId.value, config.app.baseURL)
})

onMounted(async () => {
  if (!isValidRoomCode(props.code)) {
    router.replace('/')
    return
  }

  connecting.value = true
  connectionError.value = ''

  try {
    if (props.mode === 'host') {
      await startHost(props.code)
    } else {
      if (!props.hostPeerId) {
        connectionError.value = 'Missing host peer. Scan the host QR code to join.'
        return
      }
      await joinHost(props.code, props.hostPeerId)
    }
  } catch {
    connectionError.value = 'Failed to establish WebRTC connection.'
  } finally {
    connecting.value = false
  }
})

watch(
  () => store.state?.expansions,
  (exp) => {
    if (exp) localExpansions.value = { ...exp }
  },
  { deep: true },
)

function handleSetName() {
  if (!playerName.value.trim()) return
  clientAction({ type: 'SET_NAME', playerId: store.peerId, name: playerName.value.trim() })
  if (!store.state?.players.some((p) => p.id === store.peerId)) {
    clientAction({ type: 'JOIN', playerId: store.peerId, name: playerName.value.trim() })
  }
}

function handleExpansionsUpdate() {
  if (store.isHost) {
    clientAction({ type: 'SET_EXPANSIONS', expansions: { ...localExpansions.value } })
  }
}

watch(localExpansions, handleExpansionsUpdate, { deep: true })

function startGame() {
  clientAction({ type: 'START_GAME' })
}

function updateSelections(phases: PhaseId[]) {
  localSelections.value = phases
  clientAction({ type: 'SELECT_PHASES', playerId: store.peerId, phases })
}

function confirmSelection() {
  clientAction({ type: 'CONFIRM', playerId: store.peerId })
}

function nextRound() {
  clientAction({ type: 'NEXT_ROUND' })
}

function adjustVp(playerId: string, delta: number) {
  clientAction({ type: 'ADJUST_VP', playerId, delta })
}

function endGame() {
  clientAction({ type: 'END_GAME' })
}

function submitScore(score: Partial<ScoreInput>) {
  clientAction({ type: 'SUBMIT_SCORE', playerId: store.peerId, score })
}

const mySelections = computed(() => store.state?.selections[store.peerId] ?? localSelections.value)
const isConfirmed = computed(() => store.state?.confirmed[store.peerId] ?? false)
const showNameForm = computed(() => !store.me?.name)

const ranked = computed(() => {
  if (!store.state) return []
  return rankPlayers(store.state.players, store.state.scores, store.state.expansions)
})

const allScoresSubmitted = computed(() =>
  store.state?.players.every((p) => store.state?.scores[p.id]?.submitted) ?? false,
)

watch(
  () => store.state?.selections[store.peerId],
  (sel) => {
    if (sel) localSelections.value = [...sel]
  },
)

async function copyInviteLink() {
  if (!joinUrl.value) return
  await navigator.clipboard.writeText(joinUrl.value)
}
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-lg px-4 py-6">
    <div v-if="connecting" class="text-center text-slate-400">
      <p class="animate-pulse">
        {{ mode === 'host' ? 'Starting host peer...' : 'Connecting to host...' }}
      </p>
    </div>

    <div v-else-if="connectionError" class="space-y-4 text-center">
      <p class="text-red-400">{{ connectionError }}</p>
      <NuxtLink to="/" class="text-sm text-nebula-300 hover:underline">← Back home</NuxtLink>
    </div>

    <div v-else-if="mode === 'guest' && !hostReady && !store.state" class="space-y-4 text-center text-slate-400">
      <p class="animate-pulse">Waiting for host peer...</p>
      <p class="text-xs">The host must have the game open on their device.</p>
    </div>

    <template v-else-if="store.state">
      <header class="mb-6 flex items-center justify-between">
        <NuxtLink to="/" class="text-sm text-slate-400 hover:text-slate-200">← Home</NuxtLink>
        <span class="font-mono text-sm tracking-widest text-star-400">{{ code }}</span>
        <span
          class="rounded-full px-2 py-0.5 text-xs"
          :class="store.isHost ? 'bg-star-400/20 text-star-300' : 'bg-phase-settle/20 text-phase-settle'"
        >
          {{ store.isHost ? 'Hosting' : 'Connected' }}
        </span>
      </header>

      <!-- LOBBY -->
      <div v-if="store.state.screen === 'lobby'" class="space-y-6">
        <div v-if="store.isHost">
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

        <div v-if="showNameForm" class="space-y-3">
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

        <div v-if="store.me && !showNameForm">
          <h2 class="mb-3 text-lg font-semibold">Players ({{ store.playerCount }})</h2>
          <ul class="space-y-2">
            <li
              v-for="player in store.state.players"
              :key="player.id"
              class="flex items-center justify-between rounded-lg bg-space-800/50 px-4 py-2"
            >
              <span>{{ player.name }}</span>
              <span v-if="player.id === store.state.hostId" class="text-xs text-star-400">Host</span>
            </li>
          </ul>
        </div>

        <ExpansionToggles v-if="store.isHost" v-model="localExpansions" />
        <ExpansionToggles v-else v-model="localExpansions" disabled />

        <button
          v-if="store.isHost"
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

        <PhasePicker
          :expansions="store.state.expansions"
          :player-count="store.playerCount"
          :selected="mySelections"
          :locked="isConfirmed"
          @update="updateSelections"
          @confirm="confirmSelection"
        />

        <PlayerStatusList :players="store.state.players" :my-id="store.peerId" />

        <VpTracker
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

      <!-- SCORING -->
      <div v-else-if="store.state.screen === 'scoring'" class="space-y-6">
        <ScoreSheet
          v-if="store.me && !store.state.scores[store.peerId]?.submitted"
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
          <p v-else class="text-center text-sm text-slate-400">
            Waiting for all players to submit scores...
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
