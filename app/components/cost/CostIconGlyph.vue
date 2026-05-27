<script setup lang="ts">
import type { CostIconToken } from '~/utils/cardCost'

const props = withDefaults(
  defineProps<{
    token: CostIconToken
    size?: 'sm' | 'md'
    selected?: boolean
    interactive?: boolean
  }>(),
  { interactive: true },
)

const emit = defineEmits<{
  remove: []
}>()

const tag = computed(() => (props.interactive ? 'button' : 'div'))
</script>

<template>
  <component
    :is="tag"
    v-if="token.type === 'or'"
    :type="interactive ? 'button' : undefined"
    class="flex h-10 w-6 shrink-0 items-center justify-center rounded border border-dashed border-slate-500/60 text-[10px] font-bold uppercase tracking-tight text-slate-400"
    :class="selected ? 'ring-2 ring-nebula-400/60' : ''"
    title="Discard cards OR use military"
    @click="interactive && emit('remove')"
  >
    or
  </component>

  <component
    :is="tag"
    v-else-if="token.type === 'discard'"
    :type="interactive ? 'button' : undefined"
    class="relative shrink-0 rounded-lg border-2 border-amber-700/80 bg-gradient-to-br from-amber-900/90 to-amber-950 shadow-inner transition hover:border-amber-500/80"
    :class="[
      size === 'sm' ? 'h-10 w-9' : 'h-12 w-11',
      selected ? 'ring-2 ring-nebula-400/70' : '',
    ]"
    title="Discard cards from hand as money"
    @click="interactive && emit('remove')"
  >
    <span
      class="absolute -left-0.5 top-1 h-7 w-5 rounded-sm border border-amber-600/50 bg-amber-800/60"
      aria-hidden="true"
    />
    <span
      class="absolute left-1 top-2 h-7 w-5 rounded-sm border border-amber-600/70 bg-amber-700/70"
      aria-hidden="true"
    />
    <span
      class="relative flex h-full w-full items-center justify-center text-lg font-bold text-amber-100"
    >
      {{ token.value }}
    </span>
  </component>

  <component
    :is="tag"
    v-else
    :type="interactive ? 'button' : undefined"
    class="relative flex shrink-0 items-center justify-center rounded-full border-2 border-red-500/80 bg-gradient-to-br from-red-950 to-red-900 shadow-inner transition hover:border-red-400"
    :class="[
      size === 'sm' ? 'h-10 w-10' : 'h-12 w-12',
      selected ? 'ring-2 ring-nebula-400/70' : '',
    ]"
    title="Settle using military strength"
    @click="interactive && emit('remove')"
  >
    <span class="text-[10px] font-bold uppercase leading-none text-red-200/90">mil</span>
    <span
      class="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow"
    >
      {{ token.value }}
    </span>
  </component>
</template>
