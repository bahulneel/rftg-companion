<script setup lang="ts">
const rates = [
  { id: 'novelty', label: 'Novelty cargo', cards: 2, class: 'text-sky-300 border-sky-400/40 bg-sky-400/10' },
  { id: 'rare', label: 'Rare cargo', cards: 3, class: 'text-amber-300 border-amber-400/40 bg-amber-400/10' },
  { id: 'genes', label: 'Genes cargo', cards: 4, class: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  { id: 'alien', label: 'Alien cargo', cards: 5, class: 'text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-400/10' },
] as const
</script>

<template>
  <div class="rounded-xl border border-phase-consume/30 bg-phase-consume/5 p-4">
    <p class="text-xs font-semibold uppercase tracking-wide text-phase-consume">Trade quick reference</p>
    <p class="mt-1 text-xs text-slate-400">
      Trade one cargo for cards based on its cargo type.
    </p>
    <ul class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <li
        v-for="rate in rates"
        :key="rate.id"
        class="flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs"
        :class="rate.class"
      >
        <span class="font-semibold">{{ rate.label }}</span>
        <span class="text-slate-100">{{ rate.cards }} cards</span>
      </li>
    </ul>
  </div>
</template>
