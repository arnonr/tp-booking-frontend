import { ref, watch, onBeforeUnmount, type Ref } from 'vue'

export function useAnimatedCounter(target: Ref<number>, duration = 1000) {
  const displayValue = ref(0)
  let animationFrame: number | null = null

  function animate(from: number, to: number) {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame)

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      displayValue.value = Math.round(from + (to - from) * eased)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick)
      }
    }

    animationFrame = requestAnimationFrame(tick)
  }

  watch(target, (newVal) => {
    animate(displayValue.value, newVal)
  }, { immediate: true })

  onBeforeUnmount(() => {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame)
  })

  return { displayValue }
}
