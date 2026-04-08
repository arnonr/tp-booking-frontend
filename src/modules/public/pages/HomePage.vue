<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import RoomCard from '@/components/ui/RoomCard.vue'
import HomeCalendar from '@/modules/public/components/HomeCalendar.vue'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'

const roomStore = useRoomStore()

const searchQuery = ref('')
const selectedBuilding = ref('')
const selectedCapacity = ref('')
const selectedAmenityId = ref<number | null>(null)

const rooms = computed(() => roomStore.rooms ?? [])
const isLoading = computed(() => roomStore.isLoading)

const buildings = computed(() => {
  const set = new Set<string>()
  for (const r of rooms.value) {
    if (r.building) set.add(r.building)
  }
  return Array.from(set).sort()
})

const allAmenities = computed(() => {
  const map = new Map<number, { id: number; name: string }>()
  for (const r of rooms.value) {
    for (const a of r.amenities ?? []) {
      if (!map.has(a.id)) map.set(a.id, { id: a.id, name: a.name })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'))
})

const buildingOptions = computed(() => [
  { label: 'ทั้งหมด', value: '' },
  ...buildings.value.map((b) => ({ label: b, value: b })),
])

const capacityOptions = [
  { label: 'ทุกขนาด', value: '' },
  { label: '5+ คน', value: '5' },
  { label: '10+ คน', value: '10' },
  { label: '20+ คน', value: '20' },
  { label: '50+ คน', value: '50' },
]

const amenityOptions = computed(() => [
  { label: 'ทั้งหมด', value: null as number | null },
  ...allAmenities.value.map((a) => ({ label: a.name, value: a.id as number | null })),
])

const filteredRooms = computed(() => {
  return rooms.value.filter((room) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchName = room.name.toLowerCase().includes(q)
      const matchDesc = room.description?.toLowerCase().includes(q) ?? false
      if (!matchName && !matchDesc) return false
    }
    if (selectedBuilding.value && room.building !== selectedBuilding.value) return false
    if (selectedCapacity.value) {
      const min = Number(selectedCapacity.value)
      if (room.capacity < min) return false
    }
    if (selectedAmenityId.value !== null) {
      const hasAmenity = room.amenities?.some((a) => a.id === selectedAmenityId.value) ?? false
      if (!hasAmenity) return false
    }
    return true
  })
})

function clearFilters() {
  searchQuery.value = ''
  selectedBuilding.value = ''
  selectedCapacity.value = ''
  selectedAmenityId.value = null
}

onMounted(() => {
  roomStore.fetchPublicRooms()
})
</script>

<template>
  <AppLayout>
    <!-- Hero Section -->
    <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-16 text-white sm:px-12 sm:py-20">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div class="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
      </div>
      <div class="relative z-10 mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          จองห้องประชุม<br class="sm:hidden" />ให้ง่าย ให้เร็ว
        </h1>
        <p class="mt-4 text-lg text-blue-100 sm:text-xl">
          ค้นหาห้องประชุมที่เหมาะกับคุณ — เลือกช่วงเวลา จองได้ทันที
        </p>
      </div>
    </section>

    <!-- Calendar Section -->
    <section class="mt-8">
      <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
        <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        ปฏิทินการจอง
      </h2>
      <HomeCalendar />
    </section>

    <!-- Rooms Section: Filters -->
    <section class="mt-10">
      <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
        <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        ห้องประชุม
      </h2>
      <div class="flex flex-wrap items-end gap-3">
        <!-- Search -->
        <div class="min-w-0 flex-1 sm:min-w-[200px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">ค้นหา</label>
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ชื่อห้อง, คำอธิบาย..."
              class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Building -->
        <div class="min-w-[140px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">อาคาร</label>
          <AppSelect v-model="selectedBuilding" :options="buildingOptions" class="w-full" />
        </div>

        <!-- Capacity -->
        <div class="min-w-[130px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">ความจุขั้นต่ำ</label>
          <AppSelect v-model="selectedCapacity" :options="capacityOptions" class="w-full" />
        </div>

        <!-- Amenity -->
        <div class="min-w-[160px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">อุปกรณ์</label>
          <AppSelect v-model="selectedAmenityId" :options="amenityOptions" class="w-full" />
        </div>

        <!-- Clear -->
        <button
          v-if="searchQuery || selectedBuilding || selectedCapacity || selectedAmenityId !== null"
          @click="clearFilters"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </section>

    <!-- Room Grid -->
    <section class="mt-8">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredRooms.length === 0" class="py-20 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="mt-4 text-lg font-medium text-gray-500">ไม่พบห้องที่ตรงกับเงื่อนไข</p>
        <p class="mt-1 text-sm text-gray-400">ลองปรับตัวกรองหรือคำค้นหาใหม่</p>
        <button
          @click="clearFilters"
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          ล้างตัวกรอง
        </button>
      </div>

      <!-- Cards -->
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <RoomCard v-for="room in filteredRooms" :key="room.id" :room="room" />
      </div>
    </section>
  </AppLayout>
</template>
