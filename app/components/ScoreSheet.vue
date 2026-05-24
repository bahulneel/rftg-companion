<script setup lang="ts">
import type { Expansions, ScoreInput } from '~/types/game'

const props = defineProps<{
  expansions: Expansions
  score: ScoreInput
  playerName: string
  submitted: boolean
}>()

const emit = defineEmits<{ submit: [score: Partial<ScoreInput>] }>()

const form = reactive({
  cardFaceValue: props.score.cardFaceValue,
  devBonuses: props.score.devBonuses,
  prestigePoints: props.score.prestigePoints,
  goalPoints: props.score.goalPoints,
  cardsInHand: props.score.cardsInHand,
  goodsOnWorlds: props.score.goodsOnWorlds,
})

function submit() {
  emit('submit', { ...form })
}
</script>

<template>
  <div class="rounded-xl border border-space-600 bg-space-800/50 p-4">
    <h3 class="mb-4 font-semibold text-slate-100">{{ playerName }}'s Score</h3>

    <div v-if="submitted" class="space-y-2 text-sm">
      <div class="flex justify-between"><span class="text-slate-400">VP Chips</span><span>{{ score.vpChips }}</span></div>
      <div class="flex justify-between"><span class="text-slate-400">Card Face Value</span><span>{{ score.cardFaceValue }}</span></div>
      <div class="flex justify-between"><span class="text-slate-400">6-Cost Dev Bonuses</span><span>{{ score.devBonuses }}</span></div>
      <div v-if="expansions.prestige" class="flex justify-between"><span class="text-slate-400">Prestige</span><span>{{ score.prestigePoints }}</span></div>
      <div v-if="expansions.goals" class="flex justify-between"><span class="text-slate-400">Goals</span><span>{{ score.goalPoints }}</span></div>
      <p class="pt-2 text-center text-phase-settle">✓ Submitted</p>
    </div>

    <form v-else class="space-y-3" @submit.prevent="submit">
      <div>
        <label class="text-xs text-slate-400">VP Chips (from tracker)</label>
        <input
          :value="score.vpChips"
          type="number"
          disabled
          class="mt-1 w-full rounded-lg border border-space-600 bg-space-700/50 px-3 py-2 text-slate-300"
        />
      </div>

      <div>
        <label class="text-xs text-slate-400">Card Face Value</label>
        <input
          v-model.number="form.cardFaceValue"
          type="number"
          min="0"
          class="mt-1 w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-slate-100"
        />
      </div>

      <div>
        <label class="text-xs text-slate-400">6-Cost Development Bonuses</label>
        <input
          v-model.number="form.devBonuses"
          type="number"
          min="0"
          class="mt-1 w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-slate-100"
        />
      </div>

      <div v-if="expansions.prestige">
        <label class="text-xs text-slate-400">Prestige Points</label>
        <input
          v-model.number="form.prestigePoints"
          type="number"
          min="0"
          class="mt-1 w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-slate-100"
        />
      </div>

      <div v-if="expansions.goals">
        <label class="text-xs text-slate-400">Goal Tile Points</label>
        <input
          v-model.number="form.goalPoints"
          type="number"
          min="0"
          class="mt-1 w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-slate-100"
        />
      </div>

      <hr class="border-space-600" />
      <p class="text-xs text-slate-400">Tie-breaker info (if needed)</p>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-400">Cards in Hand</label>
          <input
            v-model.number="form.cardsInHand"
            type="number"
            min="0"
            class="mt-1 w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-slate-100"
          />
        </div>
        <div>
          <label class="text-xs text-slate-400">Goods on Worlds</label>
          <input
            v-model.number="form.goodsOnWorlds"
            type="number"
            min="0"
            class="mt-1 w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-slate-100"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full rounded-xl bg-nebula-400 py-3 font-semibold text-space-950 hover:bg-nebula-300"
      >
        Submit Score
      </button>
    </form>
  </div>
</template>
