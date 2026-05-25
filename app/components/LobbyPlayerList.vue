<script setup lang="ts">
import type { Player } from '~/types/game'

const props = defineProps<{
  players: Player[]
  hostId: string
  reorderable: boolean
  showHostBadge?: boolean
  showOrder?: boolean
}>()

const emit = defineEmits<{
  reorder: [playerIds: string[]]
}>()

const dragId = ref<string | null>(null)
const overId = ref<string | null>(null)

function reorder(sourceId: string, targetId: string) {
  if (sourceId === targetId) return

  const ids = props.players.map((p) => p.id)
  const from = ids.indexOf(sourceId)
  const to = ids.indexOf(targetId)
  if (from < 0 || to < 0) return

  ids.splice(from, 1)
  ids.splice(to, 0, sourceId)
  emit('reorder', ids)
}

function onDragStart(playerId: string, event: DragEvent) {
  if (!props.reorderable) return
  dragId.value = playerId
  event.dataTransfer?.setData('text/plain', playerId)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(playerId: string, event: DragEvent) {
  if (!props.reorderable || !dragId.value || dragId.value === playerId) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  overId.value = playerId
}

function onDrop(playerId: string, event: DragEvent) {
  event.preventDefault()
  const sourceId = dragId.value
  if (!sourceId || !props.reorderable) return
  reorder(sourceId, playerId)
  dragId.value = null
  overId.value = null
}

function onDragEnd() {
  dragId.value = null
  overId.value = null
}
</script>

<template>
  <div>
    <h2 class="mb-1 text-lg font-semibold">Players ({{ players.length }})</h2>
    <p v-if="reorderable" class="mb-3 text-xs text-slate-500">
      Drag to set turn order — first player picks phases first each round.
    </p>
    <ul class="space-y-2" role="list">
      <li
        v-for="(player, index) in players"
        :key="player.id"
        class="flex items-center gap-3 rounded-lg bg-space-800/50 px-3 py-2 transition"
        :class="{
          'ring-1 ring-nebula-400/50': overId === player.id && dragId !== player.id,
          'opacity-50': dragId === player.id,
        }"
        :draggable="reorderable"
        @dragstart="onDragStart(player.id, $event)"
        @dragover="onDragOver(player.id, $event)"
        @drop="onDrop(player.id, $event)"
        @dragend="onDragEnd"
      >
        <span
          v-if="reorderable"
          class="cursor-grab select-none text-slate-500 active:cursor-grabbing"
          aria-hidden="true"
        >
          ⠿
        </span>
        <span v-if="showOrder" class="w-5 shrink-0 text-center text-xs font-semibold text-slate-500">
          {{ index + 1 }}
        </span>
        <span class="min-w-0 flex-1 truncate font-medium text-slate-100">{{ player.name }}</span>
        <span v-if="showHostBadge && player.id === hostId" class="shrink-0 text-xs text-star-400">
          Host
        </span>
      </li>
    </ul>
  </div>
</template>
