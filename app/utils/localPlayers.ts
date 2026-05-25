export interface SavedLocalPlayer {
  id: string
  name: string
}

const STORAGE_KEY = 'rftg-companion:local-players'

export function loadSavedLocalPlayers(): SavedLocalPlayer[] {
  if (!import.meta.client) return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (entry): entry is SavedLocalPlayer =>
        typeof entry === 'object'
        && entry !== null
        && typeof (entry as SavedLocalPlayer).id === 'string'
        && typeof (entry as SavedLocalPlayer).name === 'string'
        && (entry as SavedLocalPlayer).name.trim().length > 0,
    )
  } catch {
    return []
  }
}

export function saveLocalPlayers(players: SavedLocalPlayer[]) {
  if (!import.meta.client || players.length === 0) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}

export function maxLocalPlayerCounter(players: SavedLocalPlayer[]): number {
  return players.reduce((max, player) => {
    const match = /^local-player-(\d+)$/.exec(player.id)
    return match ? Math.max(max, Number.parseInt(match[1]!, 10)) : max
  }, 0)
}
