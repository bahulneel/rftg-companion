export type PhaseId =
  | 'explore-11'
  | 'explore-vp5'
  | 'develop'
  | 'settle'
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
  name: string
  vpChips: number
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
}

export interface RevealedPhase {
  id: PhaseId
  players: string[]
}

export interface GameState {
  code: string
  hostId: string
  screen: GameScreen
  players: Player[]
  expansions: Expansions
  round: number
  selections: Record<string, PhaseId[]>
  confirmed: Record<string, boolean>
  revealedPhases: RevealedPhase[]
  vpPool: number
  vpPoolInitial: number
  lastRound: boolean
  gameEnded: boolean
  scores: Record<string, ScoreInput>
}

export type GameAction =
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'JOIN'; playerId: string; name: string }
  | { type: 'SET_NAME'; playerId: string; name: string }
  | { type: 'SET_EXPANSIONS'; expansions: Expansions }
  | { type: 'START_GAME' }
  | { type: 'SELECT_PHASES'; playerId: string; phases: PhaseId[] }
  | { type: 'CONFIRM'; playerId: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'ADJUST_VP'; playerId: string; delta: number }
  | { type: 'END_GAME' }
  | { type: 'SUBMIT_SCORE'; playerId: string; score: Partial<ScoreInput> }
