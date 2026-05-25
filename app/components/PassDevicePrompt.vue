<script setup lang="ts">
defineProps<{
  playerName: string
  subtitle: string
  progress?: string
}>()

defineEmits<{
  ready: []
}>()
</script>

<template>
  <div class="space-y-6 rounded-2xl border border-space-600 bg-space-800/50 px-6 py-10 text-center">
    <p class="text-sm text-slate-400">{{ subtitle }}</p>
    <h2 class="text-2xl font-bold text-slate-100">{{ playerName }}</h2>
    <p class="text-sm text-slate-500">Don't let other players see your choices.</p>
    <button
      type="button"
      class="w-full rounded-xl bg-nebula-400 py-4 text-lg font-semibold text-space-950"
      @click="$emit('ready')"
    >
      I'm ready
    </button>
    <p v-if="progress" class="text-xs text-slate-600">{{ progress }}</p>
  </div>
</template>
