<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'
import FullCalendar from '@fullcalendar/vue3'
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { BookingStatus } from '@/types'

const router = useRouter()
const bookingStore = useBookingStore()
const roomStore = useRoomStore()

const selectedRoomId = ref<number | null>(null)
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const roomOptions = computed(() => [
  { label: 'ทุกห้อง', value: null as number | null },
  ...roomStore.rooms.map((r) => ({ label: r.name, value: r.id as number | null })),
])

const statusColors: Record<BookingStatus, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#9ca3af',
  completed: '#3b82f6',
}

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'th',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  buttonText: {
    today: 'วันนี้',
    month: 'เดือน',
    week: 'สัปดาห์',
    day: 'วัน',
  },
  firstDay: 1,
  events: bookingStore.calendarEvents.map((evt) => ({
    id: evt.id,
    title: evt.title,
    start: evt.start,
    end: evt.end,
    backgroundColor: evt.backgroundColor ?? statusColors[evt.extendedProps?.status ?? 'pending'],
    borderColor: evt.backgroundColor ?? statusColors[evt.extendedProps?.status ?? 'pending'],
    extendedProps: evt.extendedProps,
  })),
  eventClick: handleEventClick,
  datesSet: handleDatesSet,
  height: 'auto',
  dayMaxEvents: 4,
  nowIndicator: true,
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
}))

function handleEventClick(info: EventClickArg) {
  const bookingId = info.event.extendedProps?.bookingId
  if (bookingId) {
    router.push(`/bookings/${bookingId}`)
  }
}

function handleDatesSet(arg: { startStr: string; endStr: string }) {
  bookingStore.fetchCalendar({
    roomId: selectedRoomId.value ?? undefined,
    dateFrom: arg.startStr.split('T')[0],
    dateTo: arg.endStr.split('T')[0],
  })
}

watch(selectedRoomId, () => {
  const api = calendarRef.value?.getApi()
  if (api) {
    const start = api.view.activeStart.toISOString().split('T')[0]
    const end = api.view.activeEnd.toISOString().split('T')[0]
    bookingStore.fetchCalendar({
      roomId: selectedRoomId.value ?? undefined,
      dateFrom: start,
      dateTo: end,
    })
  }
})

onMounted(() => {
  roomStore.fetchAllRooms()
  // Initial fetch for current month
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  bookingStore.fetchCalendar({ dateFrom: start, dateTo: end })
})
</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">ปฏิทินการจอง</h1>
          <p class="mt-1 text-sm text-gray-500">ดูภาพรวมการจองห้องประชุม</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Room Filter -->
          <AppSelect
            v-model="selectedRoomId"
            :options="roomOptions"
            :is-searchable="true"
            class="min-w-[180px]"
          />

          <router-link
            to="/bookings/create"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            จองห้อง
          </router-link>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-3 text-xs">
        <span class="flex items-center gap-1">
          <span class="inline-block h-3 w-3 rounded-full bg-yellow-500" /> รออนุมัติ
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block h-3 w-3 rounded-full bg-green-500" /> อนุมัติแล้ว
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block h-3 w-3 rounded-full bg-red-500" /> ปฏิเสธ
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block h-3 w-3 rounded-full bg-gray-400" /> ยกเลิก
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block h-3 w-3 rounded-full bg-blue-500" /> เสร็จสิ้น
        </span>
      </div>

      <!-- Loading -->
      <div v-if="bookingStore.isLoading" class="flex justify-center py-8">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <!-- Calendar -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <FullCalendar ref="calendarRef" :options="calendarOptions" />
      </div>
    </div>
  </AppLayout>
</template>

<style>
.fc .fc-toolbar-title {
  font-size: 1.2rem;
}
.fc .fc-event {
  cursor: pointer;
  font-size: 0.75rem;
  padding: 1px 4px;
  border-radius: 4px;
}
.fc .fc-daygrid-event {
  white-space: normal;
}
</style>
