import { defineStore } from 'pinia'
import type { Expansions, GameAction, GameState, PhaseId, ScoreInput } from '~/types/game'
import { buildRevealedPhases, getPhaseLimit } from '~/utils/phases'
import { defaultScoreInput, vpPoolForPlayerCount } from '~/utils/scoring'

function createInitialState(code: string, hostId: string): GameState {
  return {
    code,
    hostId,
    screen: 'lobby',
    players: [],
    expansions: {
      gatheringStorm: false,
      rebelVsImperium: false,
      prestige: false,
      goals: false,
    },
    round: 0,
    selections: {},
    confirmed: {},
    revealedPhases: [],
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
  const me = computed(() => state.value?.players.find((p) => p.id === peerId.value))
  const playerCount = computed(() => state.value?.players.length ?? 0)

  function setPeerId(id: string) {
    peerId.value = id
  }

  function applyState(newState: GameState) {
    state.value = newState
  }

  function dispatch(action: GameAction): GameState | null {
    if (!state.value) return null

    const s = structuredClone(state.value)

    switch (action.type) {
      case 'SYNC_STATE':
        state.value = action.state
        return action.state

      case 'JOIN': {
        if (s.players.some((p) => p.id === action.playerId)) break
        s.players.push({
          id: action.playerId,
          name: action.name,
          vpChips: 0,
          status: 'thinking',
        })
        s.selections[action.playerId] = []
        s.confirmed[action.playerId] = false
        s.scores[action.playerId] = defaultScoreInput()
        break
      }

      case 'SET_NAME': {
        const player = s.players.find((p) => p.id === action.playerId)
        if (player) player.name = action.name.trim() || 'Player'
        break
      }

      case 'SET_EXPANSIONS':
        if (action.expansions) s.expansions = action.expansions
        break

      case 'START_GAME': {
        s.screen = 'select'
        s.round = 1
        s.vpPoolInitial = vpPoolForPlayerCount(s.players.length)
        s.vpPool = s.vpPoolInitial
        s.lastRound = false
        s.gameEnded = false
        for (const p of s.players) {
          p.status = 'thinking'
          p.vpChips = 0
          s.selections[p.id] = []
          s.confirmed[p.id] = false
          s.scores[p.id] = defaultScoreInput()
        }
        break
      }

      case 'SELECT_PHASES': {
        const limit = getPhaseLimit(s.players.length)
        s.selections[action.playerId] = action.phases.slice(0, limit)
        const player = s.players.find((p) => p.id === action.playerId)
        if (player && s.confirmed[action.playerId]) {
          player.status = 'thinking'
          s.confirmed[action.playerId] = false
        }
        break
      }

      case 'CONFIRM': {
        const limit = getPhaseLimit(s.players.length)
        const sel = s.selections[action.playerId] ?? []
        if (sel.length !== limit) break

        s.confirmed[action.playerId] = true
        const player = s.players.find((p) => p.id === action.playerId)
        if (player) player.status = 'ready'

        const allConfirmed = s.players.every((p) => s.confirmed[p.id])
        if (allConfirmed) {
          const names = Object.fromEntries(s.players.map((p) => [p.id, p.name]))
          s.revealedPhases = buildRevealedPhases(s.selections, names)
          s.screen = 'reveal'
        }
        break
      }

      case 'NEXT_ROUND': {
        if (s.gameEnded) break
        s.screen = 'select'
        s.round += 1
        s.revealedPhases = []
        for (const p of s.players) {
          p.status = 'thinking'
          s.selections[p.id] = []
          s.confirmed[p.id] = false
        }
        break
      }

      case 'ADJUST_VP': {
        const player = s.players.find((p) => p.id === action.playerId)
        if (!player) break
        const newVp = Math.max(0, player.vpChips + action.delta)
        const actualDelta = newVp - player.vpChips
        if (actualDelta > 0 && s.vpPool < actualDelta) break

        player.vpChips = newVp
        s.vpPool = Math.max(0, s.vpPool - actualDelta)

        if (s.scores[action.playerId]) {
          s.scores[action.playerId]!.vpChips = newVp
        }

        if (s.vpPool === 0 && !s.lastRound) {
          s.lastRound = true
        }
        break
      }

      case 'END_GAME': {
        s.gameEnded = true
        s.screen = 'scoring'
        for (const p of s.players) {
          if (s.scores[p.id]) {
            s.scores[p.id]!.vpChips = p.vpChips
          }
        }
        break
      }

      case 'SUBMIT_SCORE': {
        const existing = s.scores[action.playerId] ?? defaultScoreInput()
        s.scores[action.playerId] = {
          ...existing,
          ...action.score,
          vpChips: s.players.find((p) => p.id === action.playerId)?.vpChips ?? existing.vpChips,
          submitted: true,
        }
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
    me,
    playerCount,
    setPeerId,
    applyState,
    dispatch,
    initAsHost,
    reset,
  }
})
