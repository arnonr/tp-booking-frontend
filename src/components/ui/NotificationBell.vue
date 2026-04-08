<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotificationStore } from '@/modules/notification/stores/notificationStore'

const store = useNotificationStore()
const unreadCount = computed(() => store.unreadCount)

onMounted(() => {
  store.fetchUnreadCount()
})
</script>

<template>
  <router-link to="/notifications" class="relative text-gray-700 hover:text-blue-600">
    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    <span
      v-if="unreadCount > 0"
      class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
    >
      {{ unreadCount > 9 ? '9+' : unreadCount }}
    </span>
  </router-link>
</template>
