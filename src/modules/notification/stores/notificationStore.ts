import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/plugins/axios'
import type { Notification, PaginatedResponse } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hasUnread = computed(() => unreadCount.value > 0)

  async function fetchNotifications() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<PaginatedResponse<Notification>>('/notifications')
      notifications.value = data.data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load notifications'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count')
      unreadCount.value = data.count
    } catch {
      // silent
    }
  }

  async function markAsRead(id: number) {
    try {
      await api.patch(`/notifications/${id}/read`)
      const n = notifications.value.find((n) => n.id === id)
      if (n && !n.isRead) {
        n.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to mark as read'
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch('/notifications/read-all')
      notifications.value.forEach((n) => (n.isRead = true))
      unreadCount.value = 0
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to mark all as read'
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  }
})
