import type { GameAction, GameState, Player } from '~/types/game'

export function ownedPlayers(state: GameState, peerId: string): Player[] {
  return state.players.filter((player) => player.ownerPeerId === peerId)
}

export function isRegisteredPeer(state: GameState, peerId: string): boolean {
  return state.registeredPeerIds.includes(peerId)
}

export function isSpectatorPeer(state: GameState, peerId: string): boolean {
  return isRegisteredPeer(state, peerId) && ownedPlayers(state, peerId).length === 0
}

export function canRegisterPeer(fromPeerId: string, actionPeerId: string): boolean {
  return fromPeerId === actionPeerId
}

export function canAddPlayer(fromPeerId: string, ownerPeerId: string): boolean {
  return fromPeerId === ownerPeerId
}

export function canActForPlayer(fromPeerId: string, player: Player): boolean {
  return player.ownerPeerId === fromPeerId
}

export function canEditVp(
  fromPeerId: string,
  isHost: boolean,
  playerId: string,
  players: Player[],
): boolean {
  if (isHost) return true
  const player = players.find((entry) => entry.id === playerId)
  return player?.ownerPeerId === fromPeerId
}

export function canReorder(isHost: boolean): boolean {
  return isHost
}

export function canControlSession(isHost: boolean): boolean {
  return isHost
}

function findPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find((player) => player.id === playerId)
}

export function isAuthorized(fromPeerId: string, action: GameAction, state: GameState): boolean {
  const isHost = state.hostId === fromPeerId

  switch (action.type) {
    case 'SYNC_STATE':
      return false

    case 'REGISTER_PEER':
      return (
        state.screen === 'lobby'
        && canRegisterPeer(fromPeerId, action.peerId)
        && !state.registeredPeerIds.includes(action.peerId)
      )

    case 'ADD_PLAYER': {
      if (state.screen !== 'lobby') return false
      if (!canAddPlayer(fromPeerId, action.ownerPeerId)) return false
      if (state.players.some((player) => player.id === action.playerId)) return false
      return true
    }

    case 'SET_NAME': {
      const player = findPlayer(state, action.playerId)
      return player ? canActForPlayer(fromPeerId, player) : false
    }

    case 'REORDER_PLAYERS':
      return canReorder(isHost) && state.screen === 'lobby'

    case 'SET_EXPANSIONS':
    case 'START_GAME':
    case 'SET_REVEAL_INDEX':
    case 'NEXT_ROUND':
    case 'END_GAME':
      return canControlSession(isHost)

    case 'SELECT_PHASES':
    case 'CONFIRM':
    case 'SUBMIT_TIEBREAK': {
      const player = findPlayer(state, action.playerId)
      return player ? canActForPlayer(fromPeerId, player) : false
    }

    case 'ADJUST_VP':
    case 'SET_VP':
      return canEditVp(fromPeerId, isHost, action.playerId, state.players)

    case 'SUBMIT_SCORE': {
      const player = findPlayer(state, action.playerId)
      return player ? canActForPlayer(fromPeerId, player) : false
    }

    default:
      return false
  }
}
