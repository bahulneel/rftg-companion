<script setup lang="ts">
import type { CostModifier } from '~/types/game'
import type { CostIconToken } from '~/utils/cardCost'
import { calculateCost } from '~/utils/cardCost'

const props = defineProps<{
  open: boolean
  modifiers: CostModifier[]
}>()

const emit = defineEmits<{
  close: []
}>()

const tokens = ref<CostIconToken[]>([])

const result = computed(() => calculateCost(tokens.value, props.modifiers))

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) tokens.value = []
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-space-600 bg-space-900 p-4 shadow-2xl"
      >
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-100">Card cost calculator</h3>
            <p class="text-xs text-slate-500">Build the cost strip, then see what you pay after modifiers.</p>
          </div>
          <button type="button" class="text-slate-400 hover:text-slate-200" @click="emit('close')">
            ✕
          </button>
        </div>

        <CostIconBuilder v-model:tokens="tokens" />

        <div class="mt-4 rounded-xl border border-star-400/25 bg-star-400/5 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-star-300/90">You pay</p>

          <div v-if="tokens.length === 0" class="mt-2 text-sm text-slate-400">
            Add cost symbols above to calculate.
          </div>

          <template v-else>
            <div class="mt-2 space-y-3 text-sm">
              <p v-if="result.hasOrChoice" class="text-slate-400">
                This card offers a choice — pick one way to pay:
              </p>
              <div
                v-for="(option, optionIndex) in result.options"
                :key="optionIndex"
                class="space-y-2 rounded-lg bg-space-900/50 px-3 py-2"
              >
                <p v-if="result.hasOrChoice" class="text-xs font-medium uppercase text-slate-500">
                  Option {{ optionIndex + 1 }}
                </p>
                <div
                  v-if="option.effectiveDiscard !== null"
                  class="flex items-center gap-3"
                >
                  <CostIconGlyph
                    :token="{ id: `r-d-${optionIndex}`, type: 'discard', value: option.discardRequired ?? 0 }"
                    size="sm"
                    :interactive="false"
                  />
                  <div>
                    <p class="font-medium text-slate-200">
                      Discard
                      <span class="text-star-400">{{ option.effectiveDiscard }}</span>
                      <span
                        v-if="option.discardRequired !== option.effectiveDiscard"
                        class="text-slate-500"
                      >
                        (card shows {{ option.discardRequired }})
                      </span>
                    </p>
                    <p class="text-xs text-slate-500">cards from your hand</p>
                  </div>
                </div>
                <div
                  v-if="option.effectiveMilitary !== null"
                  class="flex items-center gap-3"
                >
                  <CostIconGlyph
                    :token="{ id: `r-m-${optionIndex}`, type: 'military', value: option.militaryRequired ?? 0 }"
                    size="sm"
                    :interactive="false"
                  />
                  <div>
                    <p class="font-medium text-slate-200">
                      Military
                      <span class="text-star-400">{{ option.effectiveMilitary }}</span>
                      <span
                        v-if="option.militaryRequired !== option.effectiveMilitary"
                        class="text-slate-500"
                      >
                        (card shows {{ option.militaryRequired }})
                      </span>
                    </p>
                    <p class="text-xs text-slate-500">strength from your empire</p>
                  </div>
                </div>
              </div>
            </div>

            <ul v-if="result.modifierNotes.length > 0" class="mt-3 space-y-0.5 border-t border-star-400/20 pt-2 text-xs text-slate-500">
              <li v-for="(note, index) in result.modifierNotes" :key="index">{{ note }}</li>
            </ul>
          </template>
        </div>
      </div>
    </Transition>

    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/50"
      @click="emit('close')"
    />
  </Teleport>
</template>
