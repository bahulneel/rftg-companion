<script setup lang="ts">
/** Legacy path route — redirects to query form so GitHub Pages can serve index.html. */
const route = useRoute()
const router = useRouter()

const code = computed(() => String(route.params.code).toUpperCase())
const hostPeerId = computed(() => {
  const value = route.query.host ?? route.query.h
  return typeof value === 'string' ? value : undefined
})

onMounted(() => {
  if (hostPeerId.value) {
    router.replace({
      path: '/',
      query: { join: code.value, host: hostPeerId.value },
    })
  } else {
    router.replace('/')
  }
})
</script>

<template>
  <p class="p-6 text-center text-slate-400">Redirecting…</p>
</template>
