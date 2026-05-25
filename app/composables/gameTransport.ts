import type { GameAction } from '~/types/game'
import { useGameStore } from '~/stores/game'

export const LOCAL_HOST_ID = 'local-host'

export interface GameTransport {
  dispatch(action: GameAction): void
}

export function createLocalTransport(): GameTransport {
  const store = useGameStore()
  return {
    dispatch(action) {
      store.dispatch(action)
    },
  }
}

export function createP2PTransport(
  clientAction: (action: GameAction) => void,
): GameTransport {
  return {
    dispatch(action) {
      clientAction(action)
    },
  }
}
