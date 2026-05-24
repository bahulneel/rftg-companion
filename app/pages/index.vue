<script setup lang="ts">
import { generateRoomCode } from '~/utils/room'

const router = useRouter()
const joinCode = ref('')

function createGame() {
  const code = generateRoomCode()
  router.push(`/room/${code}?host=1`)
}

function joinGame() {
  const code = joinCode.value.toUpperCase().trim()
  if (code.length === 4) {
    router.push(`/room/${code}`)
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm space-y-8 text-center">
      <!-- Header -->
      <div>
        <div class="mb-2 text-5xl">🌌</div>
        <h1 class="font-display text-3xl font-bold text-slate-100">
          Race for the Galaxy
        </h1>
        <p class="mt-2 text-slate-400">Digital Companion</p>
      </div>

      <p class="text-sm leading-relaxed text-slate-400">
        Replace phase cards and VP chips. Choose actions secretly on your phone,
        reveal simultaneously, and track scores from start to finish.
      </p>

      <!-- Create -->
      <button
        type="button"
        class="w-full rounded-2xl bg-nebula-400 py-4 text-lg font-bold text-space-950 shadow-lg shadow-nebula-400/20 transition hover:bg-nebula-300 active:scale-[0.98]"
        @click="createGame"
      >
        Create Game
      </button>

      <!-- Join -->
      <div class="space-y-3">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-space-600" />
          </div>
          <div class="relative flex justify-center">
            <span class="bg-space-950 px-3 text-sm text-slate-500">or join with code</span>
          </div>
        </div>

        <input
          v-model="joinCode"
          type="text"
          maxlength="4"
          placeholder="ABCD"
          class="w-full rounded-xl border border-space-600 bg-space-800 px-4 py-3 text-center text-2xl font-bold uppercase tracking-[0.3em] text-star-400 placeholder:text-slate-600 focus:border-nebula-400 focus:outline-none"
          @input="joinCode = joinCode.toUpperCase().replace(/[^A-Z]/g, '')"
        />

        <button
          type="button"
          class="w-full rounded-xl border border-space-600 py-3 font-semibold text-slate-200 transition hover:border-nebula-400 hover:text-nebula-300 disabled:opacity-40"
          :disabled="joinCode.length !== 4"
          @click="joinGame"
        >
          Join Game
        </button>
      </div>
    </div>
  </div>
</template>
