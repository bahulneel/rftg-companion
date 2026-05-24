import { joinRoom, selfId } from 'trystero'
import type { GameAction, GameState } from '~/types/game'
import { useGameStore } from '~/stores/game'

const APP_ID = 'rftg-companion-v1'

type TrysteroRoom = ReturnType<typeof joinRoom>

export function useGameRoom() {
  const store = useGameStore()
  let room: TrysteroRoom | null = null
  let broadcastState: ((state: GameState, target?: string) => void) | null = null
  let sendAction: ((action: GameAction, target?: string) => void) | null = null
  let hostPeerId: string | null = null

  const hostReady = ref(false)

  function leaveRoom() {
    room?.leave()
    room = null
    broadcastState = null
    sendAction = null
    hostPeerId = null
    hostReady.value = false
    store.connected = false
    store.peerCount = 0
  }

  function setupChannel(isHostRole: boolean) {
    if (!room || !hostPeerId) return

    const [broadcast, onReceive] = room.makeAction<GameState>('state')
    const [send, onAction] = room.makeAction<GameAction>('action')

    broadcastState = (state, target) => broadcast(state, target ?? undefined)
    sendAction = (action, target) => send(action, target ?? undefined)

    onReceive((state, fromPeerId) => {
      if (isHostRole) return
      if (fromPeerId !== hostPeerId) return
      store.applyState(state)
    })

    onAction((action, fromPeerId) => {
      if (!isHostRole) return
      if (fromPeerId === store.peerId) return

      const newState = store.dispatch(action)
      if (newState) broadcastState?.(newState)
    })

    room.onPeerJoin((joinedPeerId) => {
      if (joinedPeerId === store.peerId) return

      if (isHostRole) {
        store.peerCount++
        if (store.state) broadcastState?.(store.state, joinedPeerId)
      } else if (joinedPeerId === hostPeerId) {
        store.peerCount = 1
        hostReady.value = true
      }
    })

    room.onPeerLeave((leftPeerId) => {
      if (isHostRole) {
        store.peerCount = Math.max(0, store.peerCount - 1)
      } else if (leftPeerId === hostPeerId) {
        store.peerCount = 0
        hostReady.value = false
      }
    })
  }

  async function startHost(code: string) {
    if (import.meta.server) return

    leaveRoom()

    hostPeerId = selfId
    hostReady.value = true
    store.setPeerId(selfId)
    store.initAsHost(code, selfId)

    room = joinRoom({ appId: APP_ID }, code.toUpperCase())
    setupChannel(true)
    store.connected = true
  }

  async function joinHost(code: string, expectedHostPeerId: string) {
    if (import.meta.server) return

    leaveRoom()

    hostPeerId = expectedHostPeerId
    hostReady.value = false
    store.setPeerId(selfId)

    room = joinRoom({ appId: APP_ID }, code.toUpperCase())
    setupChannel(false)
    store.connected = true
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
    if (!hostPeerId) return
    sendAction?.(action, hostPeerId)
  }

  onUnmounted(() => leaveRoom())

  return {
    startHost,
    joinHost,
    leaveRoom,
    hostAction,
    clientAction,
    hostPeerId: computed(() => hostPeerId),
    hostReady,
    selfId: computed(() => selfId),
  }
}
