<script setup lang="ts">
const route = useRoute()
const code = computed(() => String(route.params.code).toUpperCase())
</script>

<template>
  <GameSession mode="host" :code="code" />
</template>
