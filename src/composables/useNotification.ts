import { onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/modules/notification/stores/notificationStore'

export function useNotificationPolling(intervalMs = 30000) {
  const store = useNotificationStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function startPolling() {
    store.fetchUnreadCount()
    timer = setInterval(() => {
      store.fetchUnreadCount()
    }, intervalMs)
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(startPolling)
  onUnmounted(stopPolling)

  return {
    stopPolling,
  }
}
