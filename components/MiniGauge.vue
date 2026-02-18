<template>
  <svg :width="size" :height="size / 2 + 8" :viewBox="`0 0 ${size} ${size / 2 + 8}`" class="block">
    <!-- Background arc -->
    <path :d="bgArc" fill="none" :stroke="'#f3f4f6'" :stroke-width="strokeWidth" stroke-linecap="round" />
    <!-- Value arc -->
    <path :d="valueArc" fill="none" :stroke="arcColor" :stroke-width="strokeWidth" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  min?: number
  max?: number
  size?: number
  strokeWidth?: number
  thresholds?: { value: number; color: string }[]
}>(), {
  min: 0,
  max: 50,
  size: 80,
  strokeWidth: 6,
  thresholds: () => [
    { value: 25, color: '#4CC17A' },
    { value: 32, color: '#F6A63A' },
    { value: 100, color: '#EF4444' }
  ]
})

const cx = computed(() => props.size / 2)
const cy = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)

const describeArc = (startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx.value, cy.value, radius.value, endAngle)
  const end = polarToCartesian(cx.value, cy.value, radius.value, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${radius.value} ${radius.value} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

const polarToCartesian = (centerX: number, centerY: number, r: number, angleDeg: number) => {
  const angleRad = (angleDeg - 90) * (Math.PI / 180)
  return {
    x: centerX + r * Math.cos(angleRad),
    y: centerY + r * Math.sin(angleRad)
  }
}

const bgArc = computed(() => describeArc(180, 360))

const clampedValue = computed(() => Math.min(Math.max(props.value, props.min), props.max))

const valueAngle = computed(() => {
  const pct = (clampedValue.value - props.min) / (props.max - props.min)
  return 180 + pct * 180
})

const valueArc = computed(() => {
  if (valueAngle.value <= 180) return ''
  return describeArc(180, valueAngle.value)
})

const arcColor = computed(() => {
  for (const t of props.thresholds) {
    if (props.value <= t.value) return t.color
  }
  return props.thresholds[props.thresholds.length - 1]?.color || '#6b7280'
})
</script>
