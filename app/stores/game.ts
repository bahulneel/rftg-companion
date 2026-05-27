import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import type { Expansions, GameAction, GameState, PhaseId, Player, ScoreInput } from '~/types/game'
import { buildRevealedPhases, getPhaseLimit } from '~/utils/phases'
import { ownedPlayers } from '~/utils/permissions'
import {
  applyVpTarget,
  defaultScoreInput,
  vpPoolForPlayerCount,
} from '~/utils/scoring'

function syncScoreVp(s: GameState, playerId: string, vpChips: number) {
  if (s.scores[playerId]) {
    s.scores[playerId]!.vpChips = vpChips
  }
}

function finishGameFromVp(s: GameState) {
  s.gameEnded = true
  s.screen = 'scoring'
  for (const player of s.players) {
    s.scores[player.id] = {
      ...defaultScoreInput(player.vpChips),
      vpChips: player.vpChips,
      submitted: true,
      tiebreakSubmitted: false,
    }
  }
}

function addPlayerToState(s: GameState, playerId: string, ownerPeerId: string, name: string) {
  if (s.players.some((player) => player.id === playerId)) return

  s.players.push({
    id: playerId,
    ownerPeerId,
    name: name.trim() || 'Player',
    vpChips: 0,
    tableauSize: 0,
    tutorialEnabled: false,
    status: 'thinking',
  })
  s.selections[playerId] = []
  s.confirmed[playerId] = false
  s.scores[playerId] = defaultScoreInput()
}

function createInitialState(code: string, hostId: string): GameState {
  return {
    code,
    hostId,
    screen: 'lobby',
    players: [],
    registeredPeerIds: [],
    expansions: {
      gatheringStorm: false,
      rebelVsImperium: false,
      prestige: false,
      goals: false,
    },
    round: 0,
    actionPickLimit: 1,
    selections: {},
    confirmed: {},
    revealedPhases: [],
    revealPhaseIndex: 0,
    vpPool: 0,
    vpPoolInitial: 0,
    lastRound: false,
    gameEnded: false,
    scores: {},
  }
}

export const useGameStore = defineStore('game', () => {
  const state = ref<GameState | null>(null)
  const peerId = ref<string>('')
  const connected = ref(false)
  const peerCount = ref(0)

  const isHost = computed(() => state.value?.hostId === peerId.value)
  const playerCount = computed(() => state.value?.players.length ?? 0)

  const myPlayers = computed(() => {
    if (!state.value || !peerId.value) return [] as Player[]
    return ownedPlayers(state.value, peerId.value)
  })

  const isRegistered = computed(() => {
    if (!state.value || !peerId.value) return false
    return state.value.registeredPeerIds.includes(peerId.value)
  })

  const isSpectator = computed(() => isRegistered.value && myPlayers.value.length === 0)

  function setPeerId(id: string) {
    peerId.value = id
  }

  function applyState(newState: GameState) {
    state.value = {
      ...newState,
      registeredPeerIds: newState.registeredPeerIds ?? [],
      players: newState.players.map((player) => ({
        ...player,
        ownerPeerId: player.ownerPeerId ?? player.id,
        tutorialEnabled: player.tutorialEnabled ?? false,
      })),
      revealPhaseIndex: newState.revealPhaseIndex ?? 0,
      actionPickLimit:
        newState.actionPickLimit ?? getPhaseLimit(newState.players.length),
      scores: Object.fromEntries(
        Object.entries(newState.scores).map(([id, score]) => [
          id,
          { ...score, tiebreakSubmitted: score.tiebreakSubmitted ?? false },
        ]),
      ),
    }
  }

  function dispatch(action: GameAction): GameState | null {
    if (!state.value) return null

    const s = structuredClone(toRaw(state.value))

    switch (action.type) {
      case 'SYNC_STATE':
        state.value = {
          ...action.state,
          registeredPeerIds: action.state.registeredPeerIds ?? [],
        }
        return action.state

      case 'REGISTER_PEER': {
        if (s.registeredPeerIds.includes(action.peerId)) break
        s.registeredPeerIds.push(action.peerId)
        break
      }

      case 'ADD_PLAYER':
        addPlayerToState(s, action.playerId, action.ownerPeerId, action.name)
        if (!s.registeredPeerIds.includes(action.ownerPeerId)) {
          s.registeredPeerIds.push(action.ownerPeerId)
        }
        break

      case 'SET_NAME': {
        const player = s.players.find((entry) => entry.id === action.playerId)
        if (player) player.name = action.name.trim() || 'Player'
        break
      }

      case 'REORDER_PLAYERS': {
        if (s.screen !== 'lobby') break
        const byId = Object.fromEntries(s.players.map((player) => [player.id, player]))
        const reordered = action.playerIds.map((id) => byId[id]).filter(Boolean)
        if (reordered.length !== s.players.length) break
        s.players = reordered
        break
      }

      case 'SET_EXPANSIONS':
        if (action.expansions) s.expansions = action.expansions
        break

      case 'START_GAME': {
        s.screen = 'select'
        s.round = 1
        s.actionPickLimit = getPhaseLimit(s.players.length)
        s.vpPoolInitial = vpPoolForPlayerCount(s.players.length)
        s.vpPool = s.vpPoolInitial
        s.lastRound = false
        s.gameEnded = false
        for (const player of s.players) {
          player.status = 'thinking'
          player.vpChips = 0
          player.tableauSize = TABLEAU_START_SIZE
          s.selections[player.id] = []
          s.confirmed[player.id] = false
          s.scores[player.id] = defaultScoreInput()
        }
        break
      }

      case 'SELECT_PHASES': {
        const limit = s.actionPickLimit ?? getPhaseLimit(s.players.length)
        s.selections[action.playerId] = action.phases.slice(0, limit)
        const player = s.players.find((entry) => entry.id === action.playerId)
        if (player && s.confirmed[action.playerId]) {
          player.status = 'thinking'
          s.confirmed[action.playerId] = false
        }
        break
      }

      case 'CONFIRM': {
        const limit = s.actionPickLimit ?? getPhaseLimit(s.players.length)
        const sel = s.selections[action.playerId] ?? []
        if (sel.length !== limit) break

        s.confirmed[action.playerId] = true
        const player = s.players.find((entry) => entry.id === action.playerId)
        if (player) player.status = 'ready'

        const allConfirmed = s.players.every((entry) => s.confirmed[entry.id])
        if (allConfirmed) {
          const names = Object.fromEntries(s.players.map((entry) => [entry.id, entry.name]))
          s.revealedPhases = buildRevealedPhases(s.selections, names)
          s.revealPhaseIndex = 0
          s.screen = 'reveal'
        }
        break
      }

      case 'NEXT_ROUND': {
        if (s.gameEnded) break
        s.screen = 'select'
        s.round += 1
        s.revealedPhases = []
        s.revealPhaseIndex = 0
        for (const player of s.players) {
          player.status = 'thinking'
          s.selections[player.id] = []
          s.confirmed[player.id] = false
        }
        break
      }

      case 'SET_REVEAL_INDEX': {
        if (s.screen !== 'reveal') break
        const maxIndex = Math.max(0, s.revealedPhases.length - 1)
        s.revealPhaseIndex = Math.min(maxIndex, Math.max(0, action.index))
        break
      }

      case 'ADJUST_VP': {
        const player = s.players.find((entry) => entry.id === action.playerId)
        if (!player) break
        const result = applyVpTarget(
          player.vpChips,
          player.vpChips + action.delta,
          s.vpPool,
          s.vpPoolInitial,
          s.lastRound,
        )
        if (result.vpChips === player.vpChips && result.vpPool === s.vpPool) break

        player.vpChips = result.vpChips
        s.vpPool = result.vpPool
        s.lastRound = result.lastRound
        syncScoreVp(s, action.playerId, player.vpChips)
        break
      }

      case 'SET_VP': {
        const player = s.players.find((entry) => entry.id === action.playerId)
        if (!player) break
        const result = applyVpTarget(
          player.vpChips,
          action.vpChips,
          s.vpPool,
          s.vpPoolInitial,
          s.lastRound,
        )
        if (result.vpChips === player.vpChips && result.vpPool === s.vpPool) break

        player.vpChips = result.vpChips
        s.vpPool = result.vpPool
        s.lastRound = result.lastRound
        syncScoreVp(s, action.playerId, player.vpChips)
        break
      }

      case 'END_GAME': {
        finishGameFromVp(s)
        break
      }

      case 'SUBMIT_TIEBREAK': {
        const existing = s.scores[action.playerId] ?? defaultScoreInput()
        s.scores[action.playerId] = {
          ...existing,
          goodsOnWorlds: Math.max(0, Math.floor(action.goodsOnWorlds)),
          cardsInHand: Math.max(0, Math.floor(action.cardsInHand)),
          tiebreakSubmitted: true,
        }
        break
      }

      case 'SUBMIT_SCORE': {
        const existing = s.scores[action.playerId] ?? defaultScoreInput()
        s.scores[action.playerId] = {
          ...existing,
          ...action.score,
          vpChips: s.players.find((entry) => entry.id === action.playerId)?.vpChips ?? existing.vpChips,
          submitted: true,
        }
        break
      }

      case 'SET_TUTORIAL_ENABLED': {
        if (s.screen !== 'lobby') break
        const player = s.players.find((entry) => entry.id === action.playerId)
        if (player) player.tutorialEnabled = action.enabled
        break
      }
    }

    state.value = s
    return s
  }

  function initAsHost(code: string, hostId: string) {
    peerId.value = hostId
    state.value = createInitialState(code, hostId)
  }

  function reset() {
    state.value = null
    peerId.value = ''
    connected.value = false
    peerCount.value = 0
  }

  return {
    state,
    peerId,
    connected,
    peerCount,
    isHost,
    myPlayers,
    isRegistered,
    isSpectator,
    playerCount,
    setPeerId,
    applyState,
    dispatch,
    initAsHost,
    reset,
  }
})
