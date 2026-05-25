export type PassStep = 'handoff' | 'playing'

export function usePassAndPlay() {
  const passStep = ref<PassStep>('handoff')
  const activePlayerId = ref<string | null>(null)

  function resetForPlayers(
    players: { id: string }[],
    isDone: (id: string) => boolean,
  ) {
    const next = players.find((p) => !isDone(p.id))
    activePlayerId.value = next?.id ?? null
    passStep.value = 'handoff'
  }

  function handDeviceToPlayer() {
    passStep.value = 'playing'
  }

  function finishPlayerTurn(
    players: { id: string }[],
    isDone: (id: string) => boolean,
  ) {
    passStep.value = 'handoff'
    resetForPlayers(players, isDone)
  }

  return {
    passStep,
    activePlayerId,
    resetForPlayers,
    handDeviceToPlayer,
    finishPlayerTurn,
  }
}
