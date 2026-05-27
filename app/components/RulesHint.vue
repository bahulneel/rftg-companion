<script setup lang="ts">
import type { RulesHintItem } from '~/utils/rulesHints'

withDefaults(
  defineProps<{
    items: RulesHintItem[]
    title?: string
    defaultOpen?: boolean
  }>(),
  {
    title: 'Rules reminders',
    defaultOpen: false,
  },
)
</script>

<template>
  <details
    v-if="items.length > 0"
    class="group rounded-xl border border-space-600/80 bg-space-800/30"
    :open="defaultOpen"
  >
    <summary
      class="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-slate-300 marker:content-none [&::-webkit-details-marker]:hidden"
    >
      <span class="inline-flex items-center gap-2">
        <span
          class="text-slate-500 transition group-open:rotate-90"
          aria-hidden="true"
        >▸</span>
        {{ title }}
      </span>
    </summary>
    <ul class="space-y-1.5 border-t border-space-600/50 px-4 pb-3 pt-2 text-xs leading-relaxed text-slate-400">
      <li v-for="(item, index) in items" :key="index">
        {{ item.text }}
      </li>
    </ul>
  </details>
</template>
