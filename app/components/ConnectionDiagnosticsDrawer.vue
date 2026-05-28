<script setup lang="ts">
import type { DiagnosticEntry, DiagnosticLevel } from '~/composables/useConnectionDiagnostics'

const { entries, formattedLog, copyToClipboard, clear } = useConnectionDiagnostics()

const open = ref(false)
const copied = ref(false)

const levelClass: Record<DiagnosticLevel, string> = {
  info: 'text-slate-300',
  warn: 'text-amber-300',
  error: 'text-red-400',
  success: 'text-emerald-400',
}

function formatTime(ts: number): string {
  return new Date(ts).toISOString().slice(11, 23)
}

async function handleCopy() {
  const ok = await copyToClipboard()
  if (!ok) return
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function entryKey(entry: DiagnosticEntry) {
  return entry.id
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end p-3 sm:p-3">
    <button
      type="button"
      class="pointer-events-auto mb-16 rounded-full border border-space-600 bg-space-900/95 px-3 py-2 text-xs font-medium text-slate-300 shadow-lg backdrop-blur hover:border-nebula-400 hover:text-nebula-200 sm:mb-0"
      @click="open = true"
    >
      <span class="sm:hidden">Log</span>
      <span class="hidden sm:inline">Connection log</span>
      <span
        v-if="entries.length"
        class="ml-1.5 rounded-full bg-nebula-400/20 px-1.5 py-0.5 text-[10px] text-nebula-300"
      >
        {{ entries.length }}
      </span>
    </button>
  </div>

  <Teleport to="body">
    <Transition name="diag-backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] bg-space-950/70 backdrop-blur-sm"
        @click="open = false"
      />
    </Transition>

    <Transition name="diag-drawer">
      <aside
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-[70] flex max-h-[min(70dvh,32rem)] flex-col rounded-t-2xl border border-space-600 bg-space-900 shadow-2xl"
        role="dialog"
        aria-label="Connection diagnostics"
      >
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-space-700 px-4 py-3">
          <div>
            <h2 class="text-sm font-semibold text-slate-100">Connection diagnostics</h2>
            <p class="text-xs text-slate-500">WebRTC / Trystero handshake trace</p>
          </div>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-space-800 hover:text-slate-200"
            aria-label="Close diagnostics"
            @click="open = false"
          >
            ✕
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed">
          <p v-if="!entries.length" class="text-slate-500">
            No events yet. Open this panel while connecting to capture the handshake trace.
          </p>
          <ul v-else class="space-y-3">
            <li
              v-for="entry in entries"
              :key="entryKey(entry)"
              class="border-b border-space-800/80 pb-3 last:border-0"
            >
              <div class="flex flex-wrap gap-x-2 gap-y-0.5">
                <span class="text-slate-600">{{ formatTime(entry.ts) }}</span>
                <span class="uppercase" :class="levelClass[entry.level]">{{ entry.level }}</span>
              </div>
              <p class="mt-0.5 text-slate-200">{{ entry.message }}</p>
              <pre
                v-if="entry.detail"
                class="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-slate-500"
              >{{ entry.detail }}</pre>
            </li>
          </ul>
        </div>

        <footer class="flex shrink-0 gap-2 border-t border-space-700 p-3">
          <button
            type="button"
            class="flex-1 rounded-xl bg-nebula-400 py-2.5 text-sm font-semibold text-space-950 disabled:opacity-40"
            :disabled="!formattedLog"
            @click="handleCopy"
          >
            {{ copied ? 'Copied!' : 'Copy log' }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-space-600 px-4 py-2.5 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200"
            @click="clear"
          >
            Clear
          </button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.diag-backdrop-enter-active,
.diag-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.diag-backdrop-enter-from,
.diag-backdrop-leave-to {
  opacity: 0;
}

.diag-drawer-enter-active,
.diag-drawer-leave-active {
  transition: transform 0.25s ease;
}
.diag-drawer-enter-from,
.diag-drawer-leave-to {
  transform: translateY(100%);
}
</style>
