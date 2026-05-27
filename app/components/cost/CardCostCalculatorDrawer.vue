<script setup lang="ts">
import type { EmpireBonus } from '~/types/game'
import type { CostIconToken } from '~/utils/cardCost'
import { calculateCostBreakdown } from '~/utils/cardCost'

const props = defineProps<{
  open: boolean
  empireBonuses: EmpireBonus[]
}>()

const emit = defineEmits<{
  close: []
}>()

const tokens = ref<CostIconToken[]>([])

const breakdown = computed(() => calculateCostBreakdown(tokens.value, props.empireBonuses))

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
        class="fixed inset-x-0 bottom-0 z-[80] max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-space-600 bg-space-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
        @click.stop
      >
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-100">Card cost calculator</h3>
            <p class="text-xs text-slate-500">
              Match the card’s cost box, then compare what you’d pay before picking phases.
            </p>
          </div>
          <button type="button" class="text-slate-400 hover:text-slate-200" @click="emit('close')">
            ✕
          </button>
        </div>

        <CostIconBuilder v-model:tokens="tokens" />

        <div class="mt-4 space-y-3">
          <div
            v-if="tokens.length === 0"
            class="rounded-xl border border-space-600 bg-space-800/30 p-4 text-sm text-slate-400"
          >
            Add cost symbols above to see printed cost, empire bonuses, and phase options.
          </div>

          <template v-else>
            <section class="rounded-xl border border-space-600 bg-space-800/30 p-4">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Printed on card</p>
              <CostResultOptions :calculation="breakdown.printed" tone="muted" />
            </section>

            <section class="rounded-xl border border-star-400/25 bg-star-400/5 p-4">
              <p class="text-xs font-medium uppercase tracking-wide text-star-300/90">
                With your empire
                <span v-if="empireBonuses.length === 0" class="font-normal normal-case text-slate-500">
                  (no bonuses tracked yet)
                </span>
              </p>
              <CostResultOptions :calculation="breakdown.withEmpire" tone="empire" />
              <ul
                v-if="breakdown.withEmpire.modifierNotes.length > 0"
                class="mt-2 space-y-0.5 border-t border-star-400/20 pt-2 text-xs text-slate-500"
              >
                <li v-for="(note, index) in breakdown.withEmpire.modifierNotes" :key="index">
                  {{ note }}
                </li>
              </ul>
            </section>

            <section
              v-if="breakdown.phaseScenarios.length > 0"
              class="rounded-xl border border-phase-develop/30 bg-phase-develop/5 p-4"
            >
              <p class="text-xs font-medium uppercase tracking-wide text-phase-develop">
                If you call a phase this round
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Phase bonuses stack on top of your empire. Use this to decide which phases to pick.
              </p>
              <div class="mt-3 space-y-4">
                <div
                  v-for="{ scenario, result } in breakdown.phaseScenarios"
                  :key="scenario.id"
                  class="rounded-lg border border-space-600/80 bg-space-900/40 px-3 py-2.5"
                >
                  <p class="text-sm font-medium text-slate-200">{{ scenario.label }}</p>
                  <CostResultOptions class="mt-2" :calculation="result" tone="phase" />
                </div>
              </div>
            </section>
          </template>
        </div>
      </div>
    </Transition>

    <div
      v-if="open"
      class="fixed inset-0 z-[75] bg-black/60"
      aria-hidden="true"
      @click="emit('close')"
    />
  </Teleport>
</template>
