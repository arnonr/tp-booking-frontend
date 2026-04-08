<!-- frontend/src/modules/dashboard/components/RoomStatusGrid.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/modules/dashboard/stores/dashboardStore'

const dashboardStore = useDashboardStore()

const rooms = computed(() => dashboardStore.roomStatuses)

function getStatusStyle(room: { status: string; currentBooking: unknown }) {
  if (room.status === 'maintenance') {
    return { border: 'border-l-yellow-400', dot: 'bg-yellow-400', label: 'ซ่อมบำรุง', textColor: 'text-yellow-700' }
  }
  if (room.currentBooking) {
    return { border: 'border-l-red-500', dot: 'bg-red-500', label: 'กำลังใช้', textColor: 'text-red-600' }
  }
  return { border: 'border-l-green-500', dot: 'bg-green-500', label: 'ว่าง', textColor: 'text-green-600' }
}

const roomStyles = computed(() => {
  const map = new Map<number, ReturnType<typeof getStatusStyle>>()
  for (const room of rooms.value) {
    map.set(room.id, getStatusStyle(room))
  }
  return map
})

function formatEndTime(time: string): string {
  return `${time} น.`
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-800">สถานะห้องประชุม</h3>
      <div class="flex items-center gap-4 text-xs text-gray-500">
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-green-500" /> ว่าง
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-red-500" /> กำลังใช้
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-yellow-400" /> ซ่อมบำรุง
        </span>
      </div>
    </div>

    <div v-if="rooms.length === 0" class="rounded-2xl border border-gray-100 bg-white py-12 text-center text-sm text-gray-400">
      ไม่มีข้อมูลห้อง
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="room in rooms"
        :key="room.id"
        :class="[
          'rounded-xl border border-gray-100 border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md',
          roomStyles.get(room.id)!.border,
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-semibold text-gray-900">{{ room.name }}</h4>
            <p class="text-xs text-gray-500">
              {{ [room.building, room.floor ? `ชั้น ${room.floor}` : ''].filter(Boolean).join(', ') || '-' }}
              <span class="mx-1">&middot;</span>
              {{ room.capacity }} ที่นั่ง
            </p>
          </div>
          <span :class="['flex items-center gap-1 text-xs font-medium', roomStyles.get(room.id)!.textColor]">
            <span
              :class="[
                'h-2 w-2 rounded-full',
                roomStyles.get(room.id)!.dot,
                room.currentBooking ? 'animate-pulse' : '',
              ]"
            />
            {{ roomStyles.get(room.id)!.label }}
          </span>
        </div>

        <div class="mt-3 border-t border-gray-50 pt-2">
          <template v-if="room.status === 'maintenance'">
            <p class="text-xs text-yellow-600">อยู่ระหว่างซ่อมบำรุง</p>
          </template>
          <template v-else-if="room.currentBooking">
            <p class="truncate text-xs font-medium text-gray-700">
              {{ room.currentBooking.purpose }}
            </p>
            <p class="text-xs text-gray-400">
              จบ {{ formatEndTime(room.currentBooking.endTime) }}
            </p>
          </template>
          <template v-else-if="room.nextBooking">
            <p class="text-xs text-gray-500">
              ถัดไป: {{ room.nextBooking.startTime }} น.
            </p>
          </template>
          <template v-else>
            <p class="text-xs text-green-600 font-medium">ว่างทั้งวัน</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
