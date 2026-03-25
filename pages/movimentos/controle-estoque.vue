<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: () => navigateTo('/estoque/principal', { redirectCode: 301 })
})
</script>
