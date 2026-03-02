<template>
  <div class="relative inline-flex items-center justify-center" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="transform -rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="progressColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        class="transition-all duration-500 ease-out"
      />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="font-bold" :class="textClass" :style="{ fontSize: fontSize + 'px' }">
        {{ Math.round(value) }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  size?: number
  strokeWidth?: number
}>(), {
  size: 80,
  strokeWidth: 6
})

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  const progress = Math.min(Math.max(props.value, 0), 100)
  return circumference.value - (progress / 100) * circumference.value
})
const fontSize = computed(() => props.size * 0.22)

const trackColor = computed(() => '#e5e7eb')
const progressColor = computed(() => {
  if (props.value >= 100) return '#16a34a'
  if (props.value > 0) return '#f59e0b'
  return '#d1d5db'
})

const textClass = computed(() => {
  if (props.value >= 100) return 'text-controle-600'
  if (props.value > 0) return 'text-amber-600'
  return 'text-operacao-400'
})
</script>
