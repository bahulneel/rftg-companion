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

/** Trystero namespace scoped to one host session (avoids colliding 4-letter codes). */
export function roomNamespace(code: string, hostPeerId: string): string {
  return `${code.toUpperCase()}-${hostPeerId}`
}

/**
 * Invite link using query params so static hosts (GitHub Pages) serve index.html.
 * Example: https://user.github.io/rftg-companion/?join=ABCD&host=peerId
 */
export function buildJoinUrl(
  code: string,
  hostPeerId: string,
  baseURL = '/',
  siteUrl = '',
): string {
  const origin = (siteUrl || getOrigin()).replace(/\/+$/, '')
  const base = `${origin}${normalizeBase(baseURL)}`
  const params = new URLSearchParams({
    join: code.toUpperCase(),
    host: hostPeerId,
  })
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

export function parseJoinUrl(url: string): JoinLinkParams | null {
  try {
    const parsed = new URL(url.trim())
    const fromQuery = parseJoinQuery(parsed.searchParams)
    if (fromQuery) return fromQuery

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

function queryParam(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

function toSearchParams(search: URLSearchParams | string | Record<string, unknown>): URLSearchParams {
  if (search instanceof URLSearchParams) return search
  if (typeof search === 'string') {
    return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    const single = queryParam(value)
    if (single !== undefined) params.set(key, single)
  }
  return params
}

/** Read join params from the current page URL (client) or route query. */
export function parseJoinQuery(
  search: URLSearchParams | string | Record<string, unknown>,
): JoinLinkParams | null {
  const params = toSearchParams(search)

  const rawCode = params.get('join') ?? params.get('code')
  const hostPeerId = params.get('host') ?? params.get('h')
  if (!rawCode || !hostPeerId) return null

  const code = normalizeRoomCode(rawCode)
  if (!isValidRoomCode(code)) return null

  return { code, hostPeerId }
}

export function parseHostRoomQuery(
  search: URLSearchParams | string | Record<string, unknown>,
): string | null {
  const params = toSearchParams(search)

  const rawCode = params.get('room')
  if (!rawCode) return null

  const code = normalizeRoomCode(rawCode)
  return isValidRoomCode(code) ? code : null
}

export function parseLocalRoomQuery(
  search: URLSearchParams | string | Record<string, unknown>,
): string | null {
  const params = toSearchParams(search)

  const rawCode = params.get('local')
  if (!rawCode) return null

  const code = normalizeRoomCode(rawCode)
  return isValidRoomCode(code) ? code : null
}

function getOrigin(): string {
  if (import.meta.client) return window.location.origin
  return ''
}

function normalizeBase(baseURL: string): string {
  const trimmed = baseURL.replace(/\/+$/, '')
  if (trimmed === '' || trimmed === '/') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}
