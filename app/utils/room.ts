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

export interface JoinLinkParams {
  code: string
  hostPeerId: string
}

export function buildJoinUrl(code: string, hostPeerId: string, baseURL = '/'): string {
  const base = `${getOrigin()}${normalizeBase(baseURL)}`
  const params = new URLSearchParams({ host: hostPeerId })
  return `${base}/join/${code}?${params.toString()}`
}

export function parseJoinUrl(url: string): JoinLinkParams | null {
  try {
    const parsed = new URL(url.trim())
    const match = parsed.pathname.match(/\/join\/([A-Z]{4})\/?$/i)
    if (!match) return null

    const hostPeerId = parsed.searchParams.get('host') ?? parsed.searchParams.get('h')
    if (!hostPeerId) return null

    const code = match[1]!.toUpperCase()
    if (!isValidRoomCode(code)) return null

    return { code, hostPeerId }
  } catch {
    return null
  }
}

function getOrigin(): string {
  if (import.meta.client) return window.location.origin
  return ''
}

function normalizeBase(baseURL: string): string {
  const trimmed = baseURL.replace(/\/+$/, '')
  return trimmed === '' ? '' : trimmed
}
