<script setup lang="ts">
import type { Expansions, PhaseId, ScoreInput } from '~/types/game'
import { rankPlayers } from '~/utils/scoring'
import { getJoinUrl, isValidRoomCode } from '~/utils/room'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const { playerId } = usePlayerId()
const { join, clientAction } = useGameRoom()

const code = computed(() => String(route.params.code).toUpperCase())
const isHostParam = computed(() => route.query.host === '1')

const playerName = ref('')
const localSelections = ref<PhaseId[]>([])
const localExpansions = ref<Expansions>({
  gatheringStorm: false,
  rebelVsImperium: false,
  prestige: false,
  goals: false,
})
const joining = ref(false)
const connectionError = ref('')

const config = useRuntimeConfig()
const joinUrl = computed(() => getJoinUrl(code.value, config.app.baseURL))

onMounted(async () => {
  if (!isValidRoomCode(code.value)) {
    router.replace('/')
    return
  }

  store.setPeerId(playerId.value)

  if (isHostParam.value) {
    store.initAsHost(code.value, playerId.value)
    await join(code.value, true)
    clientAction({ type: 'JOIN', playerId: playerId.value, name: 'Host' })
  } else {
    joining.value = true
    await join(code.value, false)
    joining.value = false
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
  clientAction({ type: 'SET_NAME', playerId: playerId.value, name: playerName.value.trim() })
  if (!store.state?.players.some((p) => p.id === playerId.value)) {
    clientAction({ type: 'JOIN', playerId: playerId.value, name: playerName.value.trim() })
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
  clientAction({ type: 'SELECT_PHASES', playerId: playerId.value, phases })
}

function confirmSelection() {
  clientAction({ type: 'CONFIRM', playerId: playerId.value })
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
  clientAction({ type: 'SUBMIT_SCORE', playerId: playerId.value, score })
}

const mySelections = computed(() => store.state?.selections[playerId.value] ?? localSelections.value)
const isConfirmed = computed(() => store.state?.confirmed[playerId.value] ?? false)
const showNameForm = computed(() => !store.me?.name || store.me.name === 'Host')

const ranked = computed(() => {
  if (!store.state) return []
  return rankPlayers(store.state.players, store.state.scores, store.state.expansions)
})

const allScoresSubmitted = computed(() =>
  store.state?.players.every((p) => store.state?.scores[p.id]?.submitted) ?? false,
)

watch(
  () => store.state?.selections[playerId.value],
  (sel) => {
    if (sel) localSelections.value = [...sel]
  },
)
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-lg px-4 py-6">
    <!-- Connection status -->
    <div v-if="!store.connected" class="text-center text-slate-400">
      <p class="animate-pulse">Connecting via WebRTC...</p>
    </div>

    <div v-else-if="connectionError" class="text-center text-red-400">
      {{ connectionError }}
    </div>

    <template v-else-if="store.state">
      <!-- Header -->
      <header class="mb-6 flex items-center justify-between">
        <NuxtLink to="/" class="text-sm text-slate-400 hover:text-slate-200">← Home</NuxtLink>
        <span class="font-mono text-sm tracking-widest text-star-400">{{ code }}</span>
        <span
          class="rounded-full px-2 py-0.5 text-xs"
          :class="store.connected ? 'bg-phase-settle/20 text-phase-settle' : 'bg-red-500/20 text-red-400'"
        >
          {{ store.connected ? 'P2P' : 'Offline' }}
        </span>
      </header>

      <!-- LOBBY -->
      <div v-if="store.state.screen === 'lobby'" class="space-y-6">
        <RoomCodeDisplay v-if="store.isHost" :code="code" :join-url="joinUrl" />

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
            Join Lobby
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

        <ExpansionToggles
          v-if="store.isHost"
          v-model="localExpansions"
        />
        <ExpansionToggles
          v-else
          v-model="localExpansions"
          disabled
        />

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

        <PlayerStatusList
          :players="store.state.players"
          :my-id="playerId"
        />

        <VpTracker
          :players="store.state.players"
          :my-id="playerId"
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
          :my-id="playerId"
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
          v-if="store.me && !store.state.scores[playerId]?.submitted"
          :expansions="store.state.expansions"
          :score="store.state.scores[playerId] ?? { vpChips: store.me.vpChips, cardFaceValue: 0, devBonuses: 0, prestigePoints: 0, goalPoints: 0, cardsInHand: 0, goodsOnWorlds: 0, submitted: false }"
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

    <div v-else-if="joining || (!store.state && store.connected)" class="space-y-4 text-center text-slate-400">
      <p class="animate-pulse">{{ joining ? `Joining room ${code}...` : 'Waiting for host...' }}</p>
      <p v-if="!joining" class="text-xs">Make sure the host has created the game and is connected.</p>
    </div>
  </div>
</template>
