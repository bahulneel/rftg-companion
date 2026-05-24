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
  const diag = useConnectionDiagnostics()
  let room: TrysteroRoom | null = null
  let broadcastState: ((state: GameState, target?: string) => void) | null = null
  let sendAction: ((action: GameAction, target?: string) => void) | null = null
  let hostPeerId: string | null = null
  let peerPollTimer: ReturnType<typeof setInterval> | null = null

  const hostReady = ref(false)
  const signalingWarning = ref('')

  function stopPeerPolling() {
    if (peerPollTimer) {
      clearInterval(peerPollTimer)
      peerPollTimer = null
    }
  }

  function startPeerPolling(label: string) {
    stopPeerPolling()
    peerPollTimer = setInterval(() => {
      if (!room) return
      const peers = room.getPeers()
      diag.log('info', `${label}: peer snapshot`, {
        peerCount: peers.length,
        peers,
        selfId: store.peerId,
        expectedHostPeerId: hostPeerId,
        hostReady: hostReady.value,
        storeConnected: store.connected,
        hasGameState: !!store.state,
      })
    }, 4000)
  }

  function leaveRoom() {
    diag.log('info', 'Leaving room')
    stopPeerPolling()
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
    if (!room || !hostPeerId) {
      diag.log('warn', 'setupChannel skipped — room or hostPeerId missing', {
        hasRoom: !!room,
        hostPeerId,
      })
      return
    }

    diag.log('info', 'Setting up state/action channels', { isHostRole, hostPeerId })

    const [broadcast, onReceive] = room.makeAction<GameState>('state')
    const [send, onAction] = room.makeAction<GameAction>('action')

    broadcastState = (state, target) => broadcast(state, target ?? undefined)
    sendAction = (action, target) => send(action, target ?? undefined)

    onReceive((state, fromPeerId) => {
      if (isHostRole) return
      if (fromPeerId !== hostPeerId) {
        diag.log('warn', 'Ignored state from unexpected peer', { fromPeerId, expected: hostPeerId })
        return
      }
      diag.log('success', 'Received game state from host', {
        screen: state.screen,
        playerCount: state.players.length,
      })
      store.applyState(state)
    })

    onAction((action, fromPeerId) => {
      if (!isHostRole) return
      if (fromPeerId === store.peerId) return

      diag.log('info', 'Host received guest action', { type: action.type, fromPeerId })
      const newState = store.dispatch(action)
      if (newState) broadcastState?.(newState)
    })

    room.onPeerJoin((joinedPeerId) => {
      if (joinedPeerId === store.peerId) return

      diag.log('success', 'Peer joined room', { joinedPeerId, isHostRole })

      if (isHostRole) {
        store.peerCount++
        if (store.state) broadcastState?.(store.state, joinedPeerId)
      } else if (joinedPeerId === hostPeerId) {
        store.peerCount = 1
        hostReady.value = true
        diag.log('success', 'Host peer connected — guest link is live')
        stopPeerPolling()
      } else {
        diag.log('warn', 'Guest saw unexpected peer join (not the host)', {
          joinedPeerId,
          expectedHost: hostPeerId,
        })
      }
    })

    room.onPeerLeave((leftPeerId) => {
      diag.log('warn', 'Peer left room', { leftPeerId, isHostRole })

      if (isHostRole) {
        store.peerCount = Math.max(0, store.peerCount - 1)
      } else if (leftPeerId === hostPeerId) {
        store.peerCount = 0
        hostReady.value = false
        diag.log('error', 'Host peer disconnected')
        startPeerPolling('Waiting for host after disconnect')
      }
    })
  }

  function connectToRoom(
    code: string,
    namespaceHostId: string,
    isHostRole: boolean,
    expectedHostPeerId?: string,
  ): boolean {
    const ns = roomNamespace(code, namespaceHostId)
    diag.log('info', 'Joining Trystero room', {
      code,
      namespace: ns,
      isHostRole,
      selfId,
      expectedHostPeerId,
      appId: APP_ID,
    })

    const callbacks = expectedHostPeerId
      ? {
          onPeerHandshake(peerId: string) {
            diag.log('info', 'Guest handshake with peer', { peerId, expectedHostPeerId })
            if (peerId !== expectedHostPeerId) {
              diag.log('error', 'Handshake rejected — peer is not the expected host', {
                peerId,
                expectedHostPeerId,
              })
              throw new Error('Unexpected peer')
            }
            diag.log('success', 'Guest handshake accepted host peer', { peerId })
          },
          onJoinError(details: {
            appId?: string
            roomId?: string
            peerId?: string
            error?: unknown
          }) {
            const message =
              'Having trouble reaching the host. Make sure the host still has the game open.'
            signalingWarning.value = message
            diag.log('error', message, details)
          },
        }
      : {
          onJoinError(details: {
            appId?: string
            roomId?: string
            peerId?: string
            error?: unknown
          }) {
            const message =
              'Signaling is limited — players may need to retry joining from the QR code.'
            signalingWarning.value = message
            diag.log('error', message, details)
          },
        }

    try {
      room = joinRoom(
        { appId: APP_ID, rtcConfig: RTC_CONFIG },
        ns,
        callbacks,
      )
      const initialPeers = room.getPeers()
      diag.log('info', 'Trystero room joined', {
        initialPeerCount: initialPeers.length,
        initialPeers,
      })
      setupChannel(isHostRole)
      store.connected = true
      diag.log('success', 'Room connection established', { connected: true })
      return true
    } catch (err) {
      const message = isHostRole
        ? 'Could not open the listening room. Refresh and try again.'
        : 'Could not join the host room. Check the invite link and try again.'
      signalingWarning.value = message
      diag.log('error', message, err)
      return false
    }
  }

  function startHost(code: string): boolean {
    if (import.meta.server) return false

    diag.log('info', 'Starting host session', { code, selfId })
    leaveRoom()

    hostPeerId = selfId
    hostReady.value = true
    store.setPeerId(selfId)
    store.initAsHost(code, selfId)

    const ok = connectToRoom(code, selfId, true)
    if (ok) startPeerPolling('Host listening')
    return ok
  }

  function joinHost(code: string, expectedHostPeerId: string): boolean {
    if (import.meta.server) return false

    diag.log('info', 'Guest joining host session', {
      code,
      expectedHostPeerId,
      selfId,
    })

    if (expectedHostPeerId === selfId) {
      diag.log('error', 'Cannot join your own host peer id')
      return false
    }

    leaveRoom()

    hostPeerId = expectedHostPeerId
    hostReady.value = false
    store.setPeerId(selfId)

    const ok = connectToRoom(code, expectedHostPeerId, false, expectedHostPeerId)
    if (ok) startPeerPolling('Guest waiting for host peer')
    return ok
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
    if (!hostPeerId) {
      diag.log('warn', 'clientAction dropped — no host peer id', { type: action.type })
      return
    }
    sendAction?.(action, hostPeerId)
  }

  watch(hostReady, (ready, wasReady) => {
    if (ready === wasReady) return
    diag.log(ready ? 'success' : 'warn', `hostReady → ${ready}`)
  })

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
