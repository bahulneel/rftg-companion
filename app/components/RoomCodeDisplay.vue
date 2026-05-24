<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const props = defineProps<{
  code: string
  joinUrl: string
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="rounded-2xl bg-white p-4 shadow-lg shadow-nebula-400/10">
      <QrcodeVue :value="joinUrl" :size="180" level="M" />
    </div>
    <div class="text-center">
      <p class="text-xs uppercase tracking-widest text-slate-400">Room Code</p>
      <p class="font-display text-4xl font-bold tracking-[0.3em] text-star-400">
        {{ code }}
      </p>
    </div>
  </div>
</template>
