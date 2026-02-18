<template>
  <canvas ref="canvasRef" :width="width" :height="height" class="block" />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: number[]
  color?: string
  fillColor?: string
  width?: number
  height?: number
}>(), {
  color: '#2A6FF0',
  fillColor: 'rgba(42, 111, 240, 0.1)',
  width: 100,
  height: 28
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

const draw = () => {
  const canvas = canvasRef.value
  if (!canvas || props.data.length < 2) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = props.width * dpr
  canvas.height = props.height * dpr
  canvas.style.width = props.width + 'px'
  canvas.style.height = props.height + 'px'
  ctx.scale(dpr, dpr)

  const { data, width, height, color, fillColor } = props
  const padding = 2
  const w = width - padding * 2
  const h = height - padding * 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * w,
    y: padding + h - ((v - min) / range) * h
  }))

  ctx.clearRect(0, 0, width, height)

  // Fill
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2
    const yc = (points[i - 1].y + points[i].y) / 2
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
  }
  ctx.quadraticCurveTo(
    points[points.length - 2].x,
    points[points.length - 2].y,
    points[points.length - 1].x,
    points[points.length - 1].y
  )
  ctx.lineTo(points[points.length - 1].x, height)
  ctx.lineTo(points[0].x, height)
  ctx.closePath()
  ctx.fillStyle = fillColor
  ctx.fill()

  // Line
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2
    const yc = (points[i - 1].y + points[i].y) / 2
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
  }
  ctx.quadraticCurveTo(
    points[points.length - 2].x,
    points[points.length - 2].y,
    points[points.length - 1].x,
    points[points.length - 1].y
  )
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()

  // End dot
  const last = points[points.length - 1]
  ctx.beginPath()
  ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.stroke()
}

onMounted(draw)
watch(() => props.data, draw, { deep: true })
</script>
