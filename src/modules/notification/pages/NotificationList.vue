<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useNotificationStore } from '@/modules/notification/stores/notificationStore'

const router = useRouter()
const store = useNotificationStore()

const notificationTypeIcons: Record<string, string> = {
  booking_approved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  booking_rejected: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  new_booking_request: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  new_external_request: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  booking_reminder: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  booking_cancelled: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  no_show_warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
}

const notificationTypeColors: Record<string, string> = {
  booking_approved: 'bg-green-100 text-green-600',
  booking_rejected: 'bg-red-100 text-red-600',
  new_booking_request: 'bg-blue-100 text-blue-600',
  new_external_request: 'bg-purple-100 text-purple-600',
  booking_reminder: 'bg-yellow-100 text-yellow-600',
  booking_cancelled: 'bg-gray-100 text-gray-600',
  no_show_warning: 'bg-orange-100 text-orange-600',
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  if (days < 7) return `${days} วันที่แล้ว`

  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear}`
}

async function handleClick(id: number, bookingId: number | null, isRead: boolean) {
  if (!isRead) {
    await store.markAsRead(id)
  }
  if (bookingId) {
    router.push(`/bookings/${bookingId}`)
  }
}

async function handleMarkAllRead() {
  await store.markAllAsRead()
}

onMounted(() => {
  store.fetchNotifications()
})
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-2xl space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
        <button
          v-if="store.notifications.some((n) => !n.isRead)"
          @click="handleMarkAllRead"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <!-- Empty -->
      <div v-else-if="store.notifications.length === 0" class="py-16 text-center">
        <svg class="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p class="text-lg font-medium text-gray-500">ไม่มีการแจ้งเตือน</p>
      </div>

      <!-- Notifications -->
      <div v-else class="space-y-2">
        <button
          v-for="notif in store.notifications"
          :key="notif.id"
          @click="handleClick(notif.id, notif.bookingId, notif.isRead)"
          :class="[
            'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition',
            notif.isRead
              ? 'border-gray-200 bg-white hover:bg-gray-50'
              : 'border-blue-200 bg-blue-50 hover:bg-blue-100',
          ]"
        >
          <!-- Icon -->
          <div
            :class="[
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              notificationTypeColors[notif.type] ?? 'bg-gray-100 text-gray-600',
            ]"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                :d="notificationTypeIcons[notif.type] ?? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'" />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 space-y-0.5">
            <p :class="['text-sm', notif.isRead ? 'text-gray-700' : 'font-medium text-gray-900']">
              {{ notif.title }}
            </p>
            <p v-if="notif.message" class="text-xs text-gray-500 line-clamp-2">
              {{ notif.message }}
            </p>
            <p class="text-xs text-gray-400">{{ formatTime(notif.createdAt) }}</p>
          </div>

          <!-- Unread dot -->
          <div v-if="!notif.isRead" class="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        </button>
      </div>
    </div>
  </AppLayout>
</template>
