const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]
  }
  return code
}

export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z]{4}$/.test(code)
}

export function getJoinUrl(code: string, baseURL = '/'): string {
  if (import.meta.client) {
    const base = `${window.location.origin}${baseURL}`.replace(/\/+$/, '')
    return `${base}/room/${code}`
  }
  return `/room/${code}`
}
