<script setup lang="ts">
import type { ToastKind } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

const kindStyles: Record<ToastKind, string> = {
  info: 'border-space-600 bg-space-800/95 text-slate-200',
  success: 'border-phase-settle/40 bg-space-800/95 text-phase-settle',
  warn: 'border-star-400/40 bg-space-800/95 text-star-300',
  error: 'border-red-500/40 bg-space-800/95 text-red-300',
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex flex-col items-center gap-2 px-4"
    aria-live="polite"
    aria-relevant="additions removals"
  >
    <TransitionGroup name="toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm"
        :class="kindStyles[item.kind]"
        role="status"
      >
        <p class="flex-1 text-sm leading-snug">{{ item.message }}</p>
        <button
          type="button"
          class="shrink-0 text-xs opacity-60 hover:opacity-100"
          aria-label="Dismiss"
          @click="dismiss(item.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}

.toast-move {
  transition: transform 0.25s ease;
}
</style>
