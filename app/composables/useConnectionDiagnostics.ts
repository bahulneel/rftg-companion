export type DiagnosticLevel = 'info' | 'warn' | 'error' | 'success'

export interface DiagnosticEntry {
  id: number
  ts: number
  level: DiagnosticLevel
  message: string
  detail?: string
}

const MAX_ENTRIES = 250
const entries = ref<DiagnosticEntry[]>([])
let nextId = 1

function formatDetail(detail: unknown): string | undefined {
  if (detail === undefined) return undefined
  if (typeof detail === 'string') return detail
  if (detail instanceof Error) {
    return JSON.stringify(
      {
        name: detail.name,
        message: detail.message,
        stack: detail.stack,
      },
      null,
      2,
    )
  }
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return String(detail)
  }
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString().slice(11, 23)
}

export function useConnectionDiagnostics() {
  function log(level: DiagnosticLevel, message: string, detail?: unknown) {
    const entry: DiagnosticEntry = {
      id: nextId++,
      ts: Date.now(),
      level,
      message,
      detail: formatDetail(detail),
    }
    entries.value.push(entry)
    if (entries.value.length > MAX_ENTRIES) {
      entries.value.splice(0, entries.value.length - MAX_ENTRIES)
    }
    if (import.meta.dev) {
      const prefix = `[rftg:${level}]`
      if (detail !== undefined) console.log(prefix, message, detail)
      else console.log(prefix, message)
    }
  }

  function clear() {
    entries.value = []
    log('info', 'Diagnostics log cleared')
  }

  const formattedLog = computed(() =>
    entries.value
      .map((e) => {
        const line = `${formatTimestamp(e.ts)} [${e.level.toUpperCase()}] ${e.message}`
        return e.detail ? `${line}\n${e.detail}` : line
      })
      .join('\n\n'),
  )

  async function copyToClipboard(): Promise<boolean> {
    if (!import.meta.client || !formattedLog.value) return false
    try {
      await navigator.clipboard.writeText(formattedLog.value)
      log('success', 'Copied diagnostics to clipboard')
      return true
    } catch (err) {
      log('error', 'Failed to copy diagnostics', err)
      return false
    }
  }

  return {
    entries: readonly(entries),
    formattedLog,
    log,
    clear,
    copyToClipboard,
  }
}
