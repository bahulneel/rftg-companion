import { joinRoom, selfId } from 'trystero'
import type { GameAction, GameState } from '~/types/game'
import { useGameStore } from '~/stores/game'
import { roomNamespace } from '~/utils/room'

const APP_ID = 'rftg-companion-v1'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

type TrysteroRoom = ReturnType<typeof joinRoom>

export function useGameRoom() {
  const store = useGameStore()
  let room: TrysteroRoom | null = null
  let broadcastState: ((state: GameState, target?: string) => void) | null = null
  let sendAction: ((action: GameAction, target?: string) => void) | null = null
  let hostPeerId: string | null = null

  const hostReady = ref(false)
  const signalingWarning = ref('')

  function leaveRoom() {
    room?.leave()
    room = null
    broadcastState = null
    sendAction = null
    hostPeerId = null
    hostReady.value = false
    signalingWarning.value = ''
    store.reset()
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

  function connectToRoom(
    code: string,
    namespaceHostId: string,
    isHostRole: boolean,
    expectedHostPeerId?: string,
  ): boolean {
    const callbacks = expectedHostPeerId
      ? {
          onPeerHandshake(peerId: string) {
            if (peerId !== expectedHostPeerId) {
              throw new Error('Unexpected peer')
            }
          },
          onJoinError() {
            signalingWarning.value =
              'Having trouble reaching the host. Make sure the host still has the game open.'
          },
        }
      : {
          onJoinError() {
            signalingWarning.value =
              'Signaling is limited — players may need to retry joining from the QR code.'
          },
        }

    try {
      room = joinRoom(
        { appId: APP_ID, rtcConfig: RTC_CONFIG },
        roomNamespace(code, namespaceHostId),
        callbacks,
      )
      setupChannel(isHostRole)
      store.connected = true
      return true
    } catch {
      signalingWarning.value = isHostRole
        ? 'Could not open the listening room. Refresh and try again.'
        : 'Could not join the host room. Check the invite link and try again.'
      return false
    }
  }

  function startHost(code: string): boolean {
    if (import.meta.server) return false

    leaveRoom()

    hostPeerId = selfId
    hostReady.value = true
    store.setPeerId(selfId)
    store.initAsHost(code, selfId)

    return connectToRoom(code, selfId, true)
  }

  function joinHost(code: string, expectedHostPeerId: string): boolean {
    if (import.meta.server) return false

    if (expectedHostPeerId === selfId) {
      return false
    }

    leaveRoom()

    hostPeerId = expectedHostPeerId
    hostReady.value = false
    store.setPeerId(selfId)

    return connectToRoom(code, expectedHostPeerId, false, expectedHostPeerId)
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
    signalingWarning,
    selfId: computed(() => selfId),
  }
}
