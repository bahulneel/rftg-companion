import type { ConnectionPhase } from '~/composables/useGameRoom'

export function useLocalGameSession() {
  const hostReady = ref(true)
  const connectionPhase = ref<ConnectionPhase>('connected')
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
    signalingWarning,
    selfId,
  }
}
