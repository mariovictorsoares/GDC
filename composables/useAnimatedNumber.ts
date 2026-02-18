export const useAnimatedNumber = (target: Ref<number>, duration = 600) => {
  const display = ref(0)

  watch(target, (newVal) => {
    const start = display.value
    const range = newVal - start
    if (range === 0) return
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      display.value = start + range * eased
      if (progress < 1) requestAnimationFrame(animate)
      else display.value = newVal
    }

    requestAnimationFrame(animate)
  }, { immediate: true })

  return display
}
