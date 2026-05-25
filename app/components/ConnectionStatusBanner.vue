<script setup lang="ts">
import type { ConnectionPhase } from '~/composables/useGameRoom'

const props = defineProps<{
  phase: ConnectionPhase
  isHost: boolean
  guestCount?: number
  message?: string
}>()

const banner = computed(() => {
  switch (props.phase) {
    case 'connecting':
      return {
        tone: 'info' as const,
        title: props.isHost ? 'Starting host…' : 'Joining room…',
        detail: 'Setting up peer connection.',
      }
    case 'listening':
      return {
        tone: 'info' as const,
        title: 'Room open',
        detail:
          props.guestCount && props.guestCount > 0
            ? `${props.guestCount} player${props.guestCount === 1 ? '' : 's'} connected.`
            : 'Share the QR code — waiting for players to join.',
      }
    case 'waiting-for-host':
      return {
        tone: 'info' as const,
        title: 'Connecting to host…',
        detail: 'Completing WebRTC handshake. This can take a few seconds.',
      }
    case 'reconnecting':
      return {
        tone: 'warn' as const,
        title: 'Host disconnected',
        detail: 'Waiting for the host to come back online. Keep this page open.',
      }
    case 'error':
      return {
        tone: 'error' as const,
        title: 'Connection problem',
        detail: props.message || 'Check the connection log or try again.',
      }
    default:
      return null
  }
})

const toneClasses = {
  info: 'border-nebula-400/30 bg-nebula-400/10 text-nebula-300',
  warn: 'border-star-400/30 bg-star-400/10 text-star-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
}
</script>

<template>
  <div
    v-if="banner"
    class="mb-4 rounded-xl border px-4 py-3 text-sm"
    :class="toneClasses[banner.tone]"
    role="status"
  >
    <p class="font-medium">{{ banner.title }}</p>
    <p class="mt-1 text-xs opacity-80">{{ banner.detail }}</p>
  </div>
</template>
