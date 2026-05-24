<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const code = computed(() => String(route.params.code).toUpperCase())
const hostPeerId = computed(() => {
  const value = route.query.host ?? route.query.h
  return typeof value === 'string' ? value : undefined
})

onMounted(() => {
  if (!hostPeerId.value) {
    router.replace('/')
  }
})
</script>

<template>
  <GameSession
    v-if="hostPeerId"
    mode="guest"
    :code="code"
    :host-peer-id="hostPeerId"
  />
</template>
