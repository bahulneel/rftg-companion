<script setup lang="ts">
/** Legacy path route — redirects to query form so GitHub Pages can serve index.html. */
const route = useRoute()
const router = useRouter()

const code = computed(() => String(route.params.code).toUpperCase())

onMounted(() => {
  router.replace({ path: '/', query: { room: code.value } })
})
</script>

<template>
  <p class="p-6 text-center text-slate-400">Redirecting…</p>
</template>
