<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import RoomCard from '@/components/ui/RoomCard.vue'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'

const store = useRoomStore()
const search = ref('')
const selectedBuilding = ref('')
const selectedCapacity = ref('')
const selectedAmenityId = ref<number | null>(null)
const statusFilter = ref<string>('active')

const rooms = computed(() => store.rooms ?? [])

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

const statusOptions = [
  { label: 'ทั้งหมด', value: '' },
  { label: 'พร้อมใช้งาน', value: 'active' },
  { label: 'ปรับปรุง', value: 'maintenance' },
]

const filteredRooms = computed(() => {
  return rooms.value.filter((room) => {
    if (search.value) {
      const q = search.value.toLowerCase()
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
    if (statusFilter.value && room.status !== statusFilter.value) return false
    return true
  })
})

function clearFilters() {
  search.value = ''
  selectedBuilding.value = ''
  selectedCapacity.value = ''
  selectedAmenityId.value = null
  statusFilter.value = 'active'
}

onMounted(() => {
  store.fetchAllRooms()
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">ห้องประชุม</h1>
          <p class="mt-1 text-sm text-gray-500">
            ค้นหาและเลือกห้องประชุมที่เหมาะสม
          </p>
        </div>
        <router-link
          v-if="$route.path.startsWith('/admin')"
          to="/admin/rooms/create"
          class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มห้องใหม่
        </router-link>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-end gap-3">
        <!-- Search -->
        <div class="min-w-0 flex-1 sm:min-w-[200px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">ค้นหา</label>
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="search" type="text" placeholder="ชื่อห้อง, คำอธิบาย..."
              class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        <!-- Building -->
        <div class="min-w-[160px]">
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

        <!-- Status -->
        <div class="min-w-[140px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">สถานะ</label>
          <AppSelect v-model="statusFilter" :options="statusOptions" class="w-full" />
        </div>

        <!-- Clear -->
        <button
          v-if="search || selectedBuilding || selectedCapacity || selectedAmenityId !== null || statusFilter"
          @click="clearFilters"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50">
          ล้างตัวกรอง
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="flex justify-center py-12">
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
        <button @click="clearFilters"
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          ล้างตัวกรอง
        </button>
      </div>

      <!-- Room Grid -->
      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <RoomCard v-for="room in filteredRooms" :key="room.id" :room="room" />
      </div>

      <!-- Admin Table View -->
      <div v-if="$route.path.startsWith('/admin') && filteredRooms.length > 0" class="mt-8">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">รายการห้อง (ตาราง)</h2>
        <div class="overflow-x-auto rounded-lg border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ชื่อห้อง</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">อาคาร/ชั้น</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ความจุ</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">เวลาเปิด-ปิด</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">สถานะ</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="room in filteredRooms" :key="room.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ room.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ [room.building, room.floor].filter(Boolean).join(' ') || '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ room.capacity }} คน</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ room.openTime }} - {{ room.closeTime }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      room.status === 'active' ? 'bg-green-100 text-green-700' :
                      room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700',
                    ]"
                  >
                    {{ room.status === 'active' ? 'พร้อมใช้งาน' : room.status === 'maintenance' ? 'ปรับปรุง' : 'ไม่พร้อมใช้งาน' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <router-link
                      :to="`/admin/rooms/${room.id}/edit`"
                      class="text-sm text-blue-600 hover:text-blue-800"
                    >
                      แก้ไข
                    </router-link>
                    <button
                      @click="store.deleteRoom(room.id)"
                      class="text-sm text-red-600 hover:text-red-800"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
