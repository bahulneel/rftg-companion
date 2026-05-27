<script setup lang="ts">
import type { Player } from '~/types/game'

const props = defineProps<{
  players: Player[]
  pendingPeerIds?: string[]
  hostId: string
  peerId?: string
  reorderable: boolean
  showOrder?: boolean
  showHostRow?: boolean
  preview?: boolean
  canSetTutorialForPlayer?: (playerId: string) => boolean
  canRemovePlayer?: (playerId: string) => boolean
}>()

const pendingPeerIds = computed(() => props.pendingPeerIds ?? [])

const totalCount = computed(() => props.players.length + pendingPeerIds.value.length)

const emit = defineEmits<{
  reorder: [playerIds: string[]]
  remove: [playerId: string]
  setTutorialEnabled: [playerId: string, enabled: boolean]
}>()

const dragId = ref<string | null>(null)
const overId = ref<string | null>(null)

function reorder(sourceId: string, targetId: string) {
  if (sourceId === targetId) return

  const ids = props.players.map((player) => player.id)
  const from = ids.indexOf(sourceId)
  const to = ids.indexOf(targetId)
  if (from < 0 || to < 0) return

  ids.splice(from, 1)
  ids.splice(to, 0, sourceId)
  emit('reorder', ids)
}

function movePlayer(playerId: string, delta: number) {
  const ids = props.players.map((player) => player.id)
  const from = ids.indexOf(playerId)
  const to = from + delta
  if (from < 0 || to < 0 || to >= ids.length) return
  reorder(playerId, ids[to]!)
}

function canMove(playerId: string, delta: number): boolean {
  const ids = props.players.map((player) => player.id)
  const index = ids.indexOf(playerId)
  if (index < 0) return false
  const destination = index + delta
  return destination >= 0 && destination < ids.length
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

function isOwnPlayer(player: Player): boolean {
  return !!props.peerId && player.ownerPeerId === props.peerId
}

function canRemovePlayer(playerId: string): boolean {
  return props.canRemovePlayer?.(playerId) ?? false
}

function removePlayer(player: Player) {
  if (!canRemovePlayer(player.id)) return
  const confirmed = import.meta.client
    ? window.confirm(`Remove ${player.name} from the lobby?`)
    : true
  if (confirmed) emit('remove', player.id)
}
</script>

<template>
  <div>
    <h2 class="mb-1 text-lg font-semibold">
      {{ preview ? 'Lobby activity' : 'Players' }} ({{ totalCount }})
      <span
        v-if="pendingPeerIds.length"
        class="text-sm font-normal text-slate-500"
      >
        · {{ pendingPeerIds.length }} connecting
      </span>
    </h2>
    <p v-if="preview" class="mb-3 text-xs text-slate-500">
      Peers are connecting — add players on this device below.
    </p>
    <p v-else-if="reorderable" class="mb-3 text-xs text-slate-500">
      Drag or tap arrows to reorder. Player 1 picks phases first.
    </p>
    <ul class="space-y-2" role="list">
      <li
        v-if="showHostRow"
        class="flex items-center gap-3 rounded-lg border border-star-400/20 bg-star-400/5 px-3 py-2"
      >
        <span class="w-5 shrink-0 text-center text-xs font-semibold text-star-400" aria-hidden="true">
          ★
        </span>
        <span class="min-w-0 flex-1 font-medium text-star-300">Host (spectator)</span>
        <span class="shrink-0 text-xs text-star-400">You</span>
      </li>
      <li
        v-for="(player, index) in players"
        :key="player.id"
        class="touch-manipulation rounded-xl bg-space-800/50 px-3 py-3 transition"
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
        <div class="flex items-start justify-between gap-3 sm:items-center">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span
                v-if="reorderable"
                class="cursor-grab select-none text-slate-500 active:cursor-grabbing"
                aria-hidden="true"
              >
                ↕
              </span>
              <span
                v-if="showOrder"
                class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-space-700 px-1.5 text-xs font-semibold text-slate-300"
              >
                {{ index + 1 }}
              </span>
              <span class="truncate text-base font-semibold text-slate-100">{{ player.name }}</span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                v-if="isOwnPlayer(player)"
                class="rounded-full border border-nebula-400/30 bg-nebula-400/10 px-2 py-0.5 text-nebula-300"
              >
                This device
              </span>
              <span
                v-if="!canSetTutorialForPlayer?.(player.id) && player.tutorialEnabled"
                class="rounded-full border border-nebula-400/30 bg-nebula-400/10 px-2 py-0.5 text-nebula-300"
              >
                Tutorial on
              </span>
            </div>
          </div>
          <button
            v-if="canRemovePlayer(player.id)"
            type="button"
            class="shrink-0 rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:border-red-400 hover:text-red-100"
            :aria-label="`Remove ${player.name}`"
            @click="removePlayer(player)"
          >
            Remove
          </button>
        </div>

        <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div v-if="reorderable" class="flex items-center gap-2">
            <span class="text-[11px] uppercase tracking-wide text-slate-500">Move</span>
            <button
              type="button"
              class="rounded-md border border-space-600 px-3 py-1.5 text-sm text-slate-300 transition enabled:hover:border-nebula-400 disabled:opacity-40"
              :disabled="!canMove(player.id, -1)"
              :aria-label="`Move ${player.name} earlier`"
              @click="movePlayer(player.id, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="rounded-md border border-space-600 px-3 py-1.5 text-sm text-slate-300 transition enabled:hover:border-nebula-400 disabled:opacity-40"
              :disabled="!canMove(player.id, 1)"
              :aria-label="`Move ${player.name} later`"
              @click="movePlayer(player.id, 1)"
            >
              ↓
            </button>
          </div>
          <label
            v-if="canSetTutorialForPlayer?.(player.id)"
            class="inline-flex cursor-pointer items-center gap-2 self-start rounded-lg border border-space-600 bg-space-800/70 px-2.5 py-1.5 text-xs text-slate-300"
            :title="'Show card & phase tutorial for ' + player.name"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-space-600 bg-space-800 text-nebula-400 focus:ring-nebula-400/50"
              :checked="player.tutorialEnabled"
              @change="emit('setTutorialEnabled', player.id, ($event.target as HTMLInputElement).checked)"
            />
            Tutorial prompts
          </label>
        </div>
      </li>
      <li
        v-for="(pendingId, index) in pendingPeerIds"
        :key="`pending-${pendingId}`"
        class="flex items-center gap-3 rounded-lg border border-dashed border-space-600 bg-space-800/30 px-3 py-2"
      >
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          <span class="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-medium text-slate-400">Peer {{ index + 1 }}</span>
          <span class="block text-xs text-slate-500">Connected — joining lobby…</span>
        </span>
        <span class="shrink-0 text-xs text-amber-400/80">Connecting</span>
      </li>
    </ul>
  </div>
</template>
