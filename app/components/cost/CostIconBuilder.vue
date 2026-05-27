<script setup lang="ts">
import type { CostIconToken, CostIconType } from '~/utils/cardCost'
import { newCostTokenId } from '~/utils/cardCost'

const props = defineProps<{
  tokens: CostIconToken[]
}>()

const emit = defineEmits<{
  'update:tokens': [tokens: CostIconToken[]]
}>()

const pickingType = ref<CostIconType | null>(null)
const pickValue = ref(2)

const palette: { type: CostIconType; label: string; hint: string }[] = [
  { type: 'discard', label: 'Discard', hint: 'Hand cards paid as money' },
  { type: 'military', label: 'Military', hint: 'Settle using empire strength' },
  { type: 'or', label: 'OR', hint: 'Pay one way or the other' },
]

function startPick(type: CostIconType) {
  if (type === 'or') {
    emit('update:tokens', [...props.tokens, { id: newCostTokenId(), type: 'or', value: 0 }])
    return
  }
  pickingType.value = type
  pickValue.value = type === 'discard' ? 2 : 1
}

function confirmPick() {
  if (!pickingType.value || pickingType.value === 'or') return
  emit('update:tokens', [
    ...props.tokens,
    {
      id: newCostTokenId(),
      type: pickingType.value,
      value: pickValue.value,
    },
  ])
  pickingType.value = null
}

function removeToken(id: string) {
  emit('update:tokens', props.tokens.filter((token) => token.id !== id))
}

function clearStrip() {
  emit('update:tokens', [])
  pickingType.value = null
}

const maxPick = computed(() => (pickingType.value === 'military' ? 7 : 6))
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Card cost strip</p>
      <p class="mt-0.5 text-xs text-slate-400">
        Tap icons below to build the cost box like on the physical card.
      </p>
      <div
        class="mt-3 flex min-h-[3.25rem] flex-wrap items-center gap-2 rounded-xl border border-space-600 bg-space-950/80 px-3 py-3"
      >
        <template v-if="tokens.length > 0">
          <CostIconGlyph
            v-for="token in tokens"
            :key="token.id"
            :token="token"
            size="md"
            @remove="removeToken(token.id)"
          />
        </template>
        <span v-else class="text-sm text-slate-500">No cost symbols yet</span>
      </div>
      <button
        v-if="tokens.length > 0"
        type="button"
        class="mt-2 text-xs text-slate-500 underline hover:text-slate-300"
        @click="clearStrip"
      >
        Clear strip
      </button>
    </div>

    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Add symbol</p>
      <div class="mt-2 grid grid-cols-3 gap-2">
        <button
          v-for="item in palette"
          :key="item.type"
          type="button"
          class="rounded-xl border border-space-600 bg-space-800/60 px-2 py-2.5 text-left transition hover:border-nebula-400/40"
          @click="startPick(item.type)"
        >
          <span class="block text-sm font-semibold text-slate-200">{{ item.label }}</span>
          <span class="mt-0.5 block text-[10px] leading-snug text-slate-500">{{ item.hint }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="pickingType && pickingType !== 'or'"
      class="rounded-xl border border-nebula-400/30 bg-nebula-400/10 p-3"
    >
      <p class="text-sm font-medium text-nebula-200">
        {{ pickingType === 'discard' ? 'How many cards to discard?' : 'Military strength required?' }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="n in maxPick"
          :key="n"
          type="button"
          class="h-10 w-10 rounded-lg border text-sm font-bold transition"
          :class="pickValue === n
            ? 'border-nebula-400 bg-nebula-400/20 text-nebula-200'
            : 'border-space-600 bg-space-800 text-slate-300 hover:border-space-500'"
          @click="pickValue = n"
        >
          {{ n }}
        </button>
      </div>
      <div class="mt-3 flex justify-center pointer-events-none">
        <CostIconGlyph
          :token="{ id: 'preview', type: pickingType, value: pickValue }"
          size="md"
        />
      </div>
      <div class="mt-3 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg border border-space-600 py-2 text-sm text-slate-400"
          @click="pickingType = null"
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg bg-nebula-400 py-2 text-sm font-semibold text-space-950"
          @click="confirmPick"
        >
          Add to strip
        </button>
      </div>
    </div>
  </div>
</template>
