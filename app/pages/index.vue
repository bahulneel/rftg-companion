<script setup lang="ts">
import { generateRoomCode, parseJoinUrl } from '~/utils/room'

const router = useRouter()
const inviteUrl = ref('')

function createGame() {
  router.push(`/host/${generateRoomCode()}`)
}

function joinFromInvite() {
  const parsed = parseJoinUrl(inviteUrl.value)
  if (!parsed) return
  router.push(`/join/${parsed.code}?host=${encodeURIComponent(parsed.hostPeerId)}`)
}
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm space-y-8 text-center">
      <div>
        <div class="mb-2 text-5xl">🌌</div>
        <h1 class="font-display text-3xl font-bold text-slate-100">
          Race for the Galaxy
        </h1>
        <p class="mt-2 text-slate-400">Digital Companion</p>
      </div>

      <p class="text-sm leading-relaxed text-slate-400">
        The host creates a game on their phone and shares a QR code.
        The host shares a QR code; players scan it to connect to the host device — no game server involved.
      </p>

      <button
        type="button"
        class="w-full rounded-2xl bg-nebula-400 py-4 text-lg font-bold text-space-950 shadow-lg shadow-nebula-400/20 transition hover:bg-nebula-300 active:scale-[0.98]"
        @click="createGame"
      >
        Create Game
      </button>

      <div class="space-y-3">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-space-600" />
          </div>
          <div class="relative flex justify-center">
            <span class="bg-space-950 px-3 text-sm text-slate-500">or paste invite link</span>
          </div>
        </div>

        <input
          v-model="inviteUrl"
          type="url"
          placeholder="https://…/join/ABCD?host=…"
          class="w-full rounded-xl border border-space-600 bg-space-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-nebula-400 focus:outline-none"
        />

        <button
          type="button"
          class="w-full rounded-xl border border-space-600 py-3 font-semibold text-slate-200 transition hover:border-nebula-400 hover:text-nebula-300 disabled:opacity-40"
          :disabled="!parseJoinUrl(inviteUrl)"
          @click="joinFromInvite"
        >
          Join via Invite Link
        </button>
      </div>
    </div>
  </div>
</template>
