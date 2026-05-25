<script setup lang="ts">
import type { Player } from '~/types/game'

const props = defineProps<{
  players: Player[]
  pendingPeerIds?: string[]
  hostId: string
  reorderable: boolean
  showHostBadge?: boolean
  showOrder?: boolean
  showGameMaster?: boolean
  preview?: boolean
}>()

const pendingPeerIds = computed(() => props.pendingPeerIds ?? [])

const totalCount = computed(() => props.players.length + pendingPeerIds.value.length)

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
    <h2 class="mb-1 text-lg font-semibold">
      <template v-if="showGameMaster">Lobby</template>
      <template v-else>{{ preview ? 'Lobby activity' : 'Players' }}</template>
      ({{ totalCount }})
      <span
        v-if="pendingPeerIds.length"
        class="text-sm font-normal text-slate-500"
      >
        · {{ pendingPeerIds.length }} connecting
      </span>
    </h2>
    <p v-if="preview" class="mb-3 text-xs text-slate-500">
      Players are connecting — enter your name below to join the lobby.
    </p>
    <p v-else-if="reorderable" class="mb-3 text-xs text-slate-500">
      Drag to set turn order — first player picks phases first each round.
    </p>
    <ul class="space-y-2" role="list">
      <li
        v-if="showGameMaster"
        class="flex items-center gap-3 rounded-lg border border-star-400/20 bg-star-400/5 px-3 py-2"
      >
        <span class="w-5 shrink-0 text-center text-xs font-semibold text-star-400" aria-hidden="true">
          ★
        </span>
        <span class="min-w-0 flex-1 font-medium text-star-300">Game master</span>
        <span class="shrink-0 text-xs text-star-400">You</span>
      </li>
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
      <li
        v-for="(peerId, index) in pendingPeerIds"
        :key="`pending-${peerId}`"
        class="flex items-center gap-3 rounded-lg border border-dashed border-space-600 bg-space-800/30 px-3 py-2"
      >
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          <span class="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-medium text-slate-400">
            Anonymous player {{ index + 1 }}
          </span>
          <span class="block text-xs text-slate-500">Connected — choosing name…</span>
        </span>
        <span class="shrink-0 text-xs text-amber-400/80">Connecting</span>
      </li>
    </ul>
  </div>
</template>
