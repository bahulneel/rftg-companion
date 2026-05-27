<script setup lang="ts">
import { canAdjustTableau } from '~/utils/scoring'

const props = defineProps<{
  value: number
  editable: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  adjust: [delta: number]
  set: [value: number]
}>()

const editing = ref(false)
const draft = ref('')

const canIncrease = computed(() => props.editable && canAdjustTableau(props.value, 1))
const canDecrease = computed(() => props.editable && canAdjustTableau(props.value, -1))

function startEdit() {
  if (!props.editable) return
  editing.value = true
  draft.value = String(props.value)
}

function commitEdit() {
  const parsed = Number.parseInt(draft.value, 10)
  if (!Number.isNaN(parsed)) {
    emit('set', parsed)
  }
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}

const buttonSize = computed(() => (props.compact ? 'h-8 w-8 text-lg' : 'h-12 w-12 text-2xl'))
const scoreSize = computed(() => (props.compact ? 'text-lg min-w-[2rem]' : 'text-4xl'))
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      v-if="editable"
      type="button"
      class="flex items-center justify-center rounded-full bg-space-700 font-bold hover:bg-space-600 disabled:opacity-40"
      :class="buttonSize"
      :disabled="!canDecrease"
      @click="emit('adjust', -1)"
    >
      −
    </button>

    <input
      v-if="editing"
      v-model="draft"
      type="number"
      min="0"
      class="w-16 rounded-lg border border-phase-settle/50 bg-space-700 px-2 py-1 text-center font-semibold text-phase-settle"
      :class="compact ? 'text-sm' : 'text-xl'"
      @keydown.enter.prevent="commitEdit"
      @keydown.esc.prevent="cancelEdit"
      @blur="commitEdit"
    />
    <button
      v-else
      type="button"
      class="text-center font-bold transition"
      :class="[
        scoreSize,
        editable
          ? 'text-phase-settle underline decoration-dotted underline-offset-4 hover:opacity-90'
          : 'text-phase-settle',
      ]"
      :disabled="!editable"
      @click="startEdit"
    >
      {{ value }}
    </button>

    <button
      v-if="editable"
      type="button"
      class="flex items-center justify-center rounded-full bg-phase-settle font-bold text-space-950 hover:opacity-90 disabled:opacity-40"
      :class="buttonSize"
      :disabled="!canIncrease"
      @click="emit('adjust', 1)"
    >
      +
    </button>
  </div>
</template>
