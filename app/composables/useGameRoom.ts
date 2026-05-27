import { createSharedComposable } from '@vueuse/core'
import { joinRoom, selfId } from 'trystero'
import type { GameAction, GameState } from '~/types/game'
import { useGameStore } from '~/stores/game'
import { roomNamespace } from '~/utils/room'
import { isAuthorized } from '~/utils/permissions'

const APP_ID = 'rftg-companion-v1'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

type TrysteroRoom = ReturnType<typeof joinRoom>

export type ConnectionPhase =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'waiting-for-host'
  | 'connected'
  | 'reconnecting'
  | 'error'

export const useGameRoom = createSharedComposable(() => {
  const store = useGameStore()
  const diag = useConnectionDiagnostics()
  const { toast } = useToast()
  let room: TrysteroRoom | null = null
  let broadcastState: ((state: GameState, target?: string) => void) | null = null
  let sendAction: ((action: GameAction, target?: string) => void) | null = null
  let hostPeerId: string | null = null
  let peerPollTimer: ReturnType<typeof setInterval> | null = null

  const hostReady = ref(false)
  const signalingWarning = ref('')
  const connectionPhase = ref<ConnectionPhase>('idle')
  let isHostRole = false
  let hadHostConnection = false

  const connectedPeerIds = ref<string[]>([])

  function peerIdsFromRoom(): string[] {
    if (!room) return []
    const peers = room.getPeers()
    if (Array.isArray(peers)) return peers.filter((id) => id !== selfId)
    return Object.keys(peers).filter((id) => id !== selfId)
  }

  function syncConnectedPeers() {
    connectedPeerIds.value = peerIdsFromRoom()
    store.peerCount = connectedPeerIds.value.length
  }

  /** WebRTC peers in the room who have not yet registered in the lobby. */
  const pendingLobbyPeers = computed(() => {
    const registered = new Set(store.state?.registeredPeerIds ?? [])
    return connectedPeerIds.value.filter((id) => !registered.has(id))
  })

  function setPhase(phase: ConnectionPhase) {
    connectionPhase.value = phase
  }

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
      syncConnectedPeers()
      const peers = room.getPeers()
      diag.log('info', `${label}: peer snapshot`, {
        peerCount: connectedPeerIds.value.length,
        connectedPeerIds: connectedPeerIds.value,
        pendingLobbyPeers: pendingLobbyPeers.value,
        peers,
        selfId: store.peerId,
        expectedHostPeerId: hostPeerId,
        hostReady: hostReady.value,
        storeConnected: store.connected,
        hasGameState: !!store.state,
      })
    }, 4000)
  }

  async function leaveRoom() {
    diag.log('info', 'Leaving room')
    stopPeerPolling()
    const activeRoom = room
    room = null
    broadcastState = null
    sendAction = null
    hostPeerId = null
    hostReady.value = false
    signalingWarning.value = ''
    isHostRole = false
    hadHostConnection = false
    connectedPeerIds.value = []
    setPhase('idle')
    store.reset()
    if (activeRoom) {
      await activeRoom.leave()
    }
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

    const stateChannel = room.makeAction('state')
    const actionChannel = room.makeAction('action')

    broadcastState = (state, target) => {
      void stateChannel.send(state as any, target ? { target } : undefined)
    }
    sendAction = (action, target) => {
      void actionChannel.send(action as any, target ? { target } : undefined)
    }

    stateChannel.onMessage = (payload, { peerId: fromPeerId }) => {
      if (isHostRole) return
      if (fromPeerId !== hostPeerId) {
        diag.log('warn', 'Ignored state from unexpected peer', { fromPeerId, expected: hostPeerId })
        return
      }
      const state = payload as unknown as GameState
      diag.log('success', 'Received game state from host', {
        screen: state.screen,
        playerCount: state.players.length,
      })
      store.applyState(state)
    }

    actionChannel.onMessage = (payload, { peerId: fromPeerId }) => {
      if (!isHostRole) return
      if (fromPeerId === store.peerId) return
      const action = payload as unknown as GameAction

      if (!store.state || !isAuthorized(fromPeerId, action, store.state)) {
        diag.log('warn', 'Host rejected guest action', { type: action.type, fromPeerId })
        return
      }

      diag.log('info', 'Host received guest action', { type: action.type, fromPeerId })
      const newState = store.dispatch(action)
      if (newState) {
        if (action.type === 'ADD_PLAYER') {
          toast(`${action.name} joined the lobby`, 'success')
        } else if (action.type === 'REGISTER_PEER') {
          toast('A peer joined the lobby', 'success')
        }
        broadcastState?.(newState)
      }
    }

    room.onPeerJoin = (joinedPeerId) => {
      if (joinedPeerId === store.peerId) return

      diag.log('success', 'Peer joined room', { joinedPeerId, isHostRole })

      syncConnectedPeers()

      if (isHostRole) {
        setPhase(connectedPeerIds.value.length > 0 ? 'connected' : 'listening')
        toast('A player connected — waiting for them to join the lobby', 'success')
        if (store.state) broadcastState?.(store.state, joinedPeerId)
      } else if (joinedPeerId === hostPeerId) {
        store.peerCount = 1
        hostReady.value = true
        setPhase('connected')
        toast(
          hadHostConnection ? 'Reconnected to host' : 'Connected to host',
          'success',
        )
        hadHostConnection = true
        diag.log('success', 'Host peer connected — guest link is live')
        stopPeerPolling()
      } else {
        diag.log('warn', 'Guest saw unexpected peer join (not the host)', {
          joinedPeerId,
          expectedHost: hostPeerId,
        })
      }
    }

    room.onPeerLeave = (leftPeerId) => {
      diag.log('warn', 'Peer left room', { leftPeerId, isHostRole })

      syncConnectedPeers()

      if (isHostRole) {
        setPhase(connectedPeerIds.value.length > 0 ? 'connected' : 'listening')
        toast('A player disconnected', 'warn')
      } else if (leftPeerId === hostPeerId) {
        store.peerCount = 0
        hostReady.value = false
        setPhase('reconnecting')
        toast('Host disconnected — waiting to reconnect…', 'error', 8000)
        diag.log('error', 'Host peer disconnected')
        startPeerPolling('Waiting for host after disconnect')
      }
    }
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
          async onPeerHandshake(peerId: string) {
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
            setPhase('error')
            toast(message, 'error')
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
            setPhase('error')
            toast(message, 'warn')
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
      syncConnectedPeers()
      store.connected = true
      diag.log('success', 'Room connection established', { connected: true })
      return true
    } catch (err) {
      const message = isHostRole
        ? 'Could not open the listening room. Refresh and try again.'
        : 'Could not join the host room. Check the invite link and try again.'
      signalingWarning.value = message
      setPhase('error')
      toast(message, 'error')
      diag.log('error', message, err)
      if (room) {
        const failedRoom = room
        room = null
        broadcastState = null
        sendAction = null
        void failedRoom.leave()
      }
      store.connected = false
      return false
    }
  }

  async function startHost(code: string): Promise<boolean> {
    if (import.meta.server) return false

    diag.log('info', 'Starting host session', { code, selfId })
    await leaveRoom()

    isHostRole = true
    setPhase('connecting')
    hostPeerId = selfId
    store.setPeerId(selfId)
    store.initAsHost(code, selfId)

    const ok = connectToRoom(code, selfId, true)
    if (ok) {
      hostReady.value = true
      setPhase('listening')
      toast('Room is open — share the QR code', 'info')
      startPeerPolling('Host listening')
    } else {
      store.reset()
      hostPeerId = null
    }
    return ok
  }

  async function joinHost(code: string, expectedHostPeerId: string): Promise<boolean> {
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

    await leaveRoom()

    isHostRole = false
    setPhase('connecting')
    hostPeerId = expectedHostPeerId
    hostReady.value = false
    store.setPeerId(selfId)

    const ok = connectToRoom(code, expectedHostPeerId, false, expectedHostPeerId)
    if (ok) {
      setPhase('waiting-for-host')
      startPeerPolling('Guest waiting for host peer')
    }
    return ok
  }

  function hostAction(action: GameAction) {
    if (!store.state || !isAuthorized(store.peerId, action, store.state)) {
      diag.log('warn', 'Host rejected own action', { type: action.type })
      return
    }
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

  onUnmounted(() => {
    void leaveRoom()
  })

  return {
    startHost,
    joinHost,
    leaveRoom,
    hostAction,
    clientAction,
    hostPeerId: computed(() => hostPeerId),
    hostReady,
    connectionPhase,
    connectedPeerIds: readonly(connectedPeerIds),
    pendingLobbyPeers,
    signalingWarning,
    selfId: computed(() => selfId),
  }
})
