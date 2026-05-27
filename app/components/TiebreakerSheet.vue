<script setup lang="ts">
defineProps<{
  playerName: string
}>()

const emit = defineEmits<{
  submit: [goodsOnWorlds: number, cardsInHand: number]
}>()

const goodsOnWorlds = ref(0)
const cardsInHand = ref(0)

function submit() {
  emit('submit', goodsOnWorlds.value, cardsInHand.value)
}
</script>

<template>
  <div class="rounded-xl border border-star-400/30 bg-star-400/10 p-4">
    <h3 class="font-semibold text-slate-100">Break the tie — {{ playerName }}</h3>
    <p class="mt-1 text-sm text-slate-400">
      Tie-breaker: most cargo on planets, then most cards in hand.
    </p>

    <form class="mt-4 space-y-3" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-400">Cargo on planets</label>
          <input
            v-model.number="goodsOnWorlds"
            type="number"
            min="0"
            class="mt-1 w-full rounded-lg border border-space-600 bg-space-700 px-3 py-2 text-slate-100"
          />
        </div>
        <div>
          <label class="text-xs text-slate-400">Cards in Hand</label>
          <input
            v-model.number="cardsInHand"
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
        Submit Tie-Breaker
      </button>
    </form>
  </div>
</template>
