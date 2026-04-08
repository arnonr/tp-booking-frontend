import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
  duration: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++nextId
    toasts.value.push({ id, type, message, duration })
    setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, show, dismiss }
}
