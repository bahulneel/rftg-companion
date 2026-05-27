export type PhaseId =
  | 'explore-11'
  | 'explore-vp5'
  | 'develop'
  | 'develop-2'
  | 'settle'
  | 'settle-2'
  | 'consume-trade'
  | 'consume-x2'
  | 'produce'
  | 'search'
  | 'repair'

export type GameScreen = 'lobby' | 'select' | 'reveal' | 'scoring'

export interface Expansions {
  gatheringStorm: boolean
  rebelVsImperium: boolean
  prestige: boolean
  goals: boolean
}

export interface Player {
  id: string
  ownerPeerId: string
  name: string
  vpChips: number
  /** Face-up cards in tableau (start world counts as 1 when the game begins). */
  tableauSize: number
  tutorialEnabled: boolean
  status: 'thinking' | 'ready'
}

export interface ScoreInput {
  vpChips: number
  cardFaceValue: number
  devBonuses: number
  prestigePoints: number
  goalPoints: number
  cardsInHand: number
  goodsOnWorlds: number
  submitted: boolean
  tiebreakSubmitted: boolean
}

export interface RevealedPhaseParticipant {
  id: string
  name: string
}

export interface RevealedPhase {
  id: PhaseId
  players: RevealedPhaseParticipant[]
}

export interface GameState {
  code: string
  hostId: string
  screen: GameScreen
  players: Player[]
  registeredPeerIds: string[]
  expansions: Expansions
  round: number
  /** Action cards each player may select per round (1 standard, 2 experienced 2-player). */
  actionPickLimit: number
  selections: Record<string, PhaseId[]>
  confirmed: Record<string, boolean>
  revealedPhases: RevealedPhase[]
  revealPhaseIndex: number
  vpPool: number
  vpPoolInitial: number
  lastRound: boolean
  gameEnded: boolean
  scores: Record<string, ScoreInput>
}

export type GameAction =
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'REGISTER_PEER'; peerId: string }
  | { type: 'ADD_PLAYER'; playerId: string; ownerPeerId: string; name: string }
  | { type: 'SET_NAME'; playerId: string; name: string }
  | { type: 'REORDER_PLAYERS'; playerIds: string[] }
  | { type: 'SET_EXPANSIONS'; expansions: Expansions }
  | { type: 'START_GAME' }
  | { type: 'SELECT_PHASES'; playerId: string; phases: PhaseId[] }
  | { type: 'CONFIRM'; playerId: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'SET_REVEAL_INDEX'; index: number }
  | { type: 'ADJUST_VP'; playerId: string; delta: number }
  | { type: 'SET_VP'; playerId: string; vpChips: number }
  | { type: 'END_GAME' }
  | { type: 'SUBMIT_TIEBREAK'; playerId: string; goodsOnWorlds: number; cardsInHand: number }
  | { type: 'SUBMIT_SCORE'; playerId: string; score: Partial<ScoreInput> }
  | { type: 'SET_TUTORIAL_ENABLED'; playerId: string; enabled: boolean }
