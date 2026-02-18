<template>
  <div :class="collapsed ? 'mt-2' : 'mt-5'">
    <p
      v-if="!collapsed"
      class="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
    >
      {{ title }}
    </p>
    <div v-else class="mb-2 mx-1 border-t border-gray-100" />
    <div class="space-y-0.5">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  collapsed: boolean
}>()
</script>
