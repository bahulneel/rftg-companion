import { joinRoom } from 'trystero'
import type { GameAction, GameState } from '~/types/game'
import { useGameStore } from '~/stores/game'

const APP_ID = 'rftg-companion-v1'

type TrysteroRoom = ReturnType<typeof joinRoom>

export function useGameRoom() {
  const store = useGameStore()
  let room: TrysteroRoom | null = null
  let broadcastState: ((state: GameState) => void) | null = null
  let sendAction: ((action: GameAction, peerId?: string) => void) | null = null

  function leaveRoom() {
    room?.leave()
    room = null
    broadcastState = null
    sendAction = null
    store.connected = false
    store.peerCount = 0
  }

  async function join(code: string, asHost = false) {
    if (import.meta.server) return

    leaveRoom()

    room = joinRoom({ appId: APP_ID }, code.toUpperCase())
    const [broadcast, onReceive] = room.makeAction<GameState>('state')
    const [send, onAction] = room.makeAction<GameAction>('action')

    broadcastState = broadcast
    sendAction = send

    onReceive((state, fromPeerId) => {
      if (fromPeerId === store.peerId) return
      store.applyState(state)
    })

    onAction((action, fromPeerId) => {
      if (!store.isHost) return
      if (fromPeerId === store.peerId) return

      const newState = store.dispatch(action)
      if (newState) broadcastState?.(newState)
    })

    room.onPeerJoin((joinedPeerId) => {
      store.peerCount++
      if (store.isHost && store.state) {
        broadcastState?.(store.state)
      }
    })

    room.onPeerLeave(() => {
      store.peerCount = Math.max(0, store.peerCount - 1)
    })

    store.connected = true

    if (asHost && store.state) {
      broadcastState(store.state)
    }
  }

  function hostAction(action: GameAction) {
    const newState = store.dispatch(action)
    if (newState && store.isHost) {
      broadcastState?.(newState)
    }
    return newState
  }

  function clientAction(action: GameAction) {
    if (store.isHost) {
      return hostAction(action)
    }
    sendAction?.(action)
  }

  onUnmounted(() => leaveRoom())

  return { join, leaveRoom, hostAction, clientAction }
}
