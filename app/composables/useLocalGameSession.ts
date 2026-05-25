import type { ConnectionPhase } from '~/composables/useGameRoom'

export function useLocalGameSession() {
  const hostReady = ref(true)
  const connectionPhase = ref<ConnectionPhase>('connected')
  const connectedPeerIds = ref<string[]>([])
  const pendingLobbyPeers = computed(() => [] as string[])
  const signalingWarning = ref('')
  const selfId = computed(() => '')

  async function startHost(): Promise<boolean> {
    return false
  }

  async function joinHost(): Promise<boolean> {
    return false
  }

  function clientAction(): void {}

  return {
    startHost,
    joinHost,
    clientAction,
    hostReady,
    connectionPhase,
    connectedPeerIds,
    pendingLobbyPeers,
    signalingWarning,
    selfId,
  }
}
