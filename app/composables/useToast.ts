export type ToastKind = 'info' | 'success' | 'warn' | 'error'

export interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

const toasts = ref<ToastItem[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 1

const DEFAULT_DURATION: Record<ToastKind, number> = {
  info: 4000,
  success: 3500,
  warn: 5000,
  error: 6000,
}

export function useToast() {
  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  function toast(message: string, kind: ToastKind = 'info', duration?: number) {
    const id = nextId++
    const item: ToastItem = { id, message, kind }
    toasts.value.push(item)

    const ms = duration ?? DEFAULT_DURATION[kind]
    const timer = setTimeout(() => dismiss(id), ms)
    timers.set(id, timer)

    return id
  }

  return {
    toasts: readonly(toasts),
    toast,
    dismiss,
  }
}
