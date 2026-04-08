<script setup lang="ts">
import type { Room } from '@/types'

defineProps<{
  room: Room
}>()
</script>

<template>
  <router-link
    :to="`/rooms/${room.id}`"
    class="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
  >
    <!-- Image -->
    <div class="relative h-48 overflow-hidden bg-gray-100">
      <img
        v-if="room.images && room.images.length > 0"
        :src="room.images[0].imageUrl"
        :alt="room.name"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div v-else class="flex h-full items-center justify-center text-gray-400">
        <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <!-- Status Badge -->
      <span
        v-if="room.status !== 'active'"
        :class="[
          'absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium',
          room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700',
        ]"
      >
        {{ room.status === 'maintenance' ? 'ปรับปรุง' : 'ไม่พร้อมใช้งาน' }}
      </span>
    </div>

    <!-- Info -->
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ room.name }}</h3>
      <p v-if="room.building || room.floor" class="mt-1 text-sm text-gray-500">
        {{ [room.building, room.floor].filter(Boolean).join(' ') }}
      </p>

      <div class="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span class="flex items-center gap-1">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ room.capacity }} คน
        </span>
        <span>{{ room.openTime }} - {{ room.closeTime }}</span>
      </div>

      <!-- Amenities -->
      <div v-if="room.amenities && room.amenities.length > 0" class="mt-3 flex flex-wrap gap-1">
        <span
          v-for="a in room.amenities.slice(0, 4)"
          :key="a.id"
          class="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
        >
          {{ a.name }}
        </span>
        <span
          v-if="room.amenities.length > 4"
          class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
        >
          +{{ room.amenities.length - 4 }}
        </span>
      </div>
    </div>
  </router-link>
</template>
