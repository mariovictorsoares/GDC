<template>
  <div class="relative overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
    <!-- Accent stripe -->
    <div class="absolute top-0 left-0 right-0 h-0.5" :class="accentGradient" />

    <div class="p-5 pt-6">
      <!-- Header: icon + label + trend -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg" :class="iconBgClass">
            <UIcon :name="icon" class="w-5 h-5" :class="iconColorClass" />
          </div>
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ label }}</span>
        </div>

        <!-- Trend badge -->
        <div v-if="trendValue !== undefined && trendValue !== null && isFinite(trendValue)" class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          :class="trendValue >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          <UIcon
            :name="trendValue >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
            class="w-3.5 h-3.5" />
          {{ Math.abs(trendValue).toFixed(1) }}%
        </div>
      </div>

      <!-- Value -->
      <p class="text-2xl font-bold tabular-nums" :class="valueColorClass || 'text-gray-900'">
        {{ displayValue }}
      </p>

      <!-- Slot for mini-visualization -->
      <div v-if="$slots.default" class="mt-3">
        <slot />
      </div>

      <!-- Secondary text -->
      <p v-if="secondaryText" class="mt-2 text-xs text-gray-400">
        {{ secondaryText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  displayValue: string
  icon: string
  iconBgClass: string
  iconColorClass: string
  accentGradient: string
  trendValue?: number | null
  trendLabel?: string
  secondaryText?: string
  valueColorClass?: string
}>()
</script>
