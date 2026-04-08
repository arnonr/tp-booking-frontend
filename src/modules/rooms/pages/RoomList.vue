<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import RoomCard from '@/components/ui/RoomCard.vue'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'

const store = useRoomStore()
const search = ref('')
const capacityFilter = ref<number | null>(null)
const statusFilter = ref<string>('active')

const capacityOptions = [
  { label: 'ทุกขนาด', value: null as number | null },
  { label: '1-10 คน', value: 10 as number | null },
  { label: '11-20 คน', value: 20 as number | null },
  { label: '21-50 คน', value: 50 as number | null },
  { label: '50+ คน', value: 51 as number | null },
]

const statusOptions = [
  { label: 'พร้อมใช้งาน', value: 'active' },
  { label: 'ปรับปรุง', value: 'maintenance' },
  { label: 'ทั้งหมด', value: '' },
]

const filteredRooms = computed(() => {
  let result = store.rooms

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.building?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q),
    )
  }

  if (capacityFilter.value !== null) {
    if (capacityFilter.value === 51) {
      result = result.filter((r) => r.capacity > 50)
    } else {
      result = result.filter((r) => r.capacity <= (capacityFilter.value ?? Infinity))
    }
  }

  if (statusFilter.value) {
    result = result.filter((r) => r.status === statusFilter.value)
  }

  return result
})

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
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="relative flex-1">
          <svg
            class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="ค้นหาชื่อห้อง, อาคาร..."
            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <AppSelect v-model="capacityFilter" :options="capacityOptions" class="min-w-[140px]" />
        <AppSelect v-model="statusFilter" :options="statusOptions" class="min-w-[140px]" />
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredRooms.length === 0"
        class="flex flex-col items-center justify-center py-16 text-gray-500"
      >
        <svg class="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-lg font-medium">ไม่พบห้องประชุม</p>
        <p class="text-sm">ลองปรับตัวกรองหรือคำค้นหา</p>
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
