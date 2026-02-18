<template>
  <div class="block">
    <UTooltip v-if="collapsed" :text="label" :popper="{ placement: 'right' }">
      <NuxtLink
        :to="to"
        class="flex items-center justify-center w-full h-10 rounded-lg transition-colors"
        :class="active ? 'bg-guardian-50 text-guardian-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
      >
        <UIcon :name="icon" class="w-5 h-5 flex-shrink-0" :class="iconColor && !active ? iconColor : ''" />
      </NuxtLink>
    </UTooltip>
    <NuxtLink
      v-else
      :to="to"
      class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
      :class="active ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
    >
      <UIcon :name="icon" class="w-5 h-5 flex-shrink-0" :class="iconColor && !active ? iconColor : ''" />
      <span class="truncate">{{ label }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  to: string
  icon: string
  label: string
  active: boolean
  collapsed: boolean
  iconColor?: string
}>()
</script>
