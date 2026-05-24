const PLAYER_ID_KEY = 'rftg-player-id'

export function usePlayerId() {
  const id = useState<string>('playerId', () => {
    if (import.meta.client) {
      let stored = localStorage.getItem(PLAYER_ID_KEY)
      if (!stored) {
        stored = crypto.randomUUID()
        localStorage.setItem(PLAYER_ID_KEY, stored)
      }
      return stored
    }
    return crypto.randomUUID()
  })

  return { playerId: id }
}
