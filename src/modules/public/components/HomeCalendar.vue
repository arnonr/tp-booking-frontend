<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { BookingStatus } from '@/types'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import AppSelect from '@/components/common/AppSelect.vue'
import BookingFormModal from '@/modules/booking/components/BookingFormModal.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'
import { useAuthStore } from '@/modules/auth/stores/authStore'

const ROOM_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
]

const router = useRouter()
const bookingStore = useBookingStore()
const roomStore = useRoomStore()
const authStore = useAuthStore()

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const selectedRoomId = ref<number | null>(null)

// ── Booking Modal ──
interface SelectedEvent {
  bookingId: number
  title: string
  roomName: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  color: string
}
const showModal = ref(false)
const selectedEvent = ref<SelectedEvent | null>(null)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  const month = d.toLocaleString('th-TH', { month: 'long' })
  return `${d.getDate()} ${month} ${buddhistYear}`
}

function formatTime(dt: string): string {
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function closeModal() {
  showModal.value = false
  selectedEvent.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

const roomOptions = computed(() => [
  { label: 'ทุกห้อง', value: null as number | null },
  ...roomStore.rooms.map((r) => ({ label: r.name, value: r.id as number | null })),
])

const now = ref(new Date())
let nowTimer: ReturnType<typeof setInterval>
onMounted(() => {
  nowTimer = setInterval(() => { now.value = new Date() }, 60_000)
})
onUnmounted(() => clearInterval(nowTimer))

const roomColorMap = computed(() => {
  const map = new Map<number, string>()
  roomStore.rooms.forEach((r, i) => {
    map.set(r.id, ROOM_COLORS[i % ROOM_COLORS.length])
  })
  return map
})

// Public homepage shows only approved bookings
const calendarEvents = computed(() =>
  bookingStore.calendarEvents
    .filter((evt) => evt.extendedProps?.status === 'approved')
    .map((evt) => {
      const roomId = evt.resourceId ?? 0
      const color = roomColorMap.value.get(roomId) ?? ROOM_COLORS[0]
      return {
        id: evt.id,
        title: evt.title,
        start: evt.start,
        end: evt.end,
        resourceId: evt.resourceId,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: evt.extendedProps,
      }
    })
)

const monthBookings = computed(() => {
  const y = now.value.getFullYear()
  const m = now.value.getMonth()
  return calendarEvents.value.filter((evt) => {
    const d = new Date(evt.start as string)
    return d.getFullYear() === y && d.getMonth() === m
  }).length
})

const todayBookings = computed(() => {
  const d = now.value
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return calendarEvents.value.filter((evt) =>
    (evt.start as string).startsWith(today)
  ).length
})

const availableRoomsNow = computed(() => {
  const total = roomStore.rooms.length
  const busyRoomIds = new Set(
    bookingStore.calendarEvents
      .filter((evt) => {
        if (!evt.start || !evt.end) return false
        const start = new Date(evt.start as string)
        const end = new Date(evt.end as string)
        return evt.extendedProps?.status === 'approved' && start <= now.value && now.value < end
      })
      .map((evt) => evt.resourceId ?? -1)
  )
  return total - busyRoomIds.size
})

const legendItems = computed(() => {
  const roomIdsInEvents = new Set(
    calendarEvents.value.map((evt) => (evt as { resourceId?: number }).resourceId ?? 0)
  )
  return roomStore.rooms
    .filter((r) => roomIdsInEvents.has(r.id))
    .map((r) => ({
      roomId: r.id,
      name: r.name,
      color: roomColorMap.value.get(r.id) ?? ROOM_COLORS[0],
    }))
})

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'th',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek',
  },
  buttonText: {
    today: 'วันนี้',
    month: 'เดือน',
    week: 'สัปดาห์',
  },
  firstDay: 1,
  events: [],
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  datesSet: handleDatesSet,
  height: 'auto',
  dayMaxEvents: 3,
  moreLinkText: (n) => `+${n} รายการ`,
  nowIndicator: true,
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  selectable: true,
  dayCellClassNames: () => 'fc-day-clickable',
}))

watch(calendarEvents, (newEvents) => {
  const api = calendarRef.value?.getApi()
  if (!api) return
  api.removeAllEvents()
  newEvents.forEach((evt) => api.addEvent(evt))
})

function handleEventClick(info: EventClickArg) {
  const props = info.event.extendedProps
  selectedEvent.value = {
    bookingId: props?.bookingId,
    title: info.event.title,
    roomName: props?.roomName ?? '',
    date: formatDate(info.event.startStr),
    startTime: formatTime(info.event.startStr),
    endTime: info.event.endStr ? formatTime(info.event.endStr) : '',
    status: props?.status ?? 'approved',
    color: info.event.backgroundColor || ROOM_COLORS[0],
  }
  showModal.value = true
}

// ── Booking Form Modal ──
const showBookingForm = ref(false)
const bookingFormDate = ref('')

function openBookingForm(date?: string) {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  bookingFormDate.value = date ?? ''
  showBookingForm.value = true
}

function onBookingDone() {
  showBookingForm.value = false
  // refresh calendar
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
}

function handleDateClick(info: DateClickArg) {
  openBookingForm(info.dateStr)
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
  if (roomStore.rooms.length === 0) {
    roomStore.fetchPublicRooms()
  }
})
</script>

<template>
  <div class="space-y-4">

    <!-- Stats Bar -->
    <div class="grid grid-cols-3 gap-3">
      <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg">📅</div>
        <div>
          <div class="text-xl font-extrabold leading-none text-gray-900">{{ monthBookings }}</div>
          <div class="mt-0.5 text-xs text-gray-400">การจองเดือนนี้</div>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-lg">🟢</div>
        <div>
          <div class="text-xl font-extrabold leading-none text-gray-900">{{ availableRoomsNow }}</div>
          <div class="mt-0.5 text-xs text-gray-400">ห้องที่ว่างตอนนี้</div>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-lg">⏰</div>
        <div>
          <div class="text-xl font-extrabold leading-none text-gray-900">{{ todayBookings }}</div>
          <div class="mt-0.5 text-xs text-gray-400">การจองวันนี้</div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2">
        <!-- Room Filter -->
        <AppSelect
          v-model="selectedRoomId"
          :options="roomOptions"
          :is-searchable="true"
          placeholder="ทุกห้อง"
          class="min-w-[180px]"
        />
        <!-- Loading -->
        <div v-if="bookingStore.isLoading" class="flex items-center gap-1.5 text-sm text-gray-400">
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          กำลังโหลด...
        </div>
      </div>
      <!-- Book CTA -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">คลิกวันที่เพื่อจอง</span>
        <button
          @click="openBookingForm()"
          class="rounded-[9px] bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] transition hover:opacity-90"
        >
          + จองห้องประชุม
        </button>
      </div>
    </div>

    <!-- Calendar -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

    <!-- Dynamic Legend -->
    <div v-if="legendItems.length > 0" class="flex flex-wrap items-center gap-3">
      <span class="text-xs font-medium text-gray-500">สีตามห้อง:</span>
      <span
        v-for="item in legendItems"
        :key="item.roomId"
        class="flex items-center gap-1.5 text-xs text-gray-700"
      >
        <span
          class="inline-block h-2.5 w-2.5 rounded-sm"
          :style="{ backgroundColor: item.color }"
        />
        {{ item.name }}
      </span>
    </div>
    <div v-else class="flex flex-wrap items-center gap-4 text-xs text-gray-500">
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
        การจองที่อนุมัติแล้ว
      </span>
    </div>

  </div>

  <!-- Booking Form Modal (Create) -->
  <BookingFormModal
    :show="showBookingForm"
    :default-date="bookingFormDate"
    @close="showBookingForm = false"
    @done="onBookingDone"
  />

  <!-- Booking Detail Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showModal && selectedEvent"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal" />

        <!-- Panel -->
        <div class="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
          <!-- Color header strip -->
          <div
            class="h-1.5 w-full rounded-t-2xl"
            :style="{ backgroundColor: selectedEvent.color }"
          />

          <div class="p-5">
            <!-- Title row -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-base shadow"
                  :style="{ backgroundColor: selectedEvent.color }"
                >📋</span>
                <div>
                  <p class="text-xs font-medium text-gray-400">รายละเอียดการจอง</p>
                  <h3 class="text-base font-bold text-gray-900 leading-snug">{{ selectedEvent.title }}</h3>
                </div>
              </div>
              <button
                class="mt-0.5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                @click="closeModal"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Info list -->
            <div class="mt-4 space-y-2.5 rounded-xl bg-gray-50 p-3.5 text-sm">
              <div class="flex items-center gap-2.5">
                <span class="text-base">🏢</span>
                <div>
                  <span class="text-xs text-gray-400">ห้องประชุม</span>
                  <p class="font-semibold text-gray-800">{{ selectedEvent.roomName }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="text-base">📅</span>
                <div>
                  <span class="text-xs text-gray-400">วันที่</span>
                  <p class="font-semibold text-gray-800">{{ selectedEvent.date }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="text-base">⏰</span>
                <div>
                  <span class="text-xs text-gray-400">เวลา</span>
                  <p class="font-semibold text-gray-800">{{ selectedEvent.startTime }} – {{ selectedEvent.endTime }} น.</p>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="text-base">✅</span>
                <div>
                  <span class="text-xs text-gray-400">สถานะ</span>
                  <p class="font-semibold text-green-700">อนุมัติแล้ว</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex gap-2">
              <button
                class="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                @click="closeModal"
              >
                ปิด
              </button>
              <router-link
                v-if="authStore.user && selectedEvent.bookingId"
                :to="`/bookings/${selectedEvent.bookingId}`"
                class="flex-1 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                @click="closeModal"
              >
                ดูรายละเอียด
              </router-link>
              <router-link
                v-else-if="!authStore.user"
                to="/login"
                class="flex-1 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                @click="closeModal"
              >
                เข้าสู่ระบบ
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Toolbar Title ── */
:deep(.fc .fc-toolbar-title) {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

/* ── Header Toolbar (gradient bg) ── */
:deep(.fc .fc-toolbar.fc-header-toolbar) {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%);
  padding: 10px 14px;
  margin-bottom: 0;
  border-radius: 0;
}

/* ── Nav Buttons ── */
:deep(.fc .fc-button) {
  font-size: 0.78rem;
  padding: 0.3rem 0.7rem;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 7px;
  color: white;
  box-shadow: none;
  transition: background 0.15s;
}

:deep(.fc .fc-button:hover) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
}

:deep(.fc .fc-button:focus) {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
}

:deep(.fc .fc-button-active),
:deep(.fc .fc-button-primary:not(:disabled).fc-button-active) {
  background: rgba(255, 255, 255, 0.35) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  color: white !important;
}

/* ── Today Cell ── */
:deep(.fc .fc-day-today) {
  background-color: #eff6ff !important;
}

:deep(.fc .fc-day-today .fc-daygrid-day-number) {
  background: #2563eb;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* ── Weekend Columns ── */
:deep(.fc .fc-day-sat),
:deep(.fc .fc-day-sun) {
  background-color: #fef2f2;
}

:deep(.fc .fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion),
:deep(.fc .fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion) {
  color: #f87171;
}

/* ── Day Hover ── */
:deep(.fc .fc-day:not(.fc-day-other):hover) {
  background-color: #f0f9ff;
  cursor: pointer;
}

:deep(.fc .fc-day-clickable) {
  cursor: pointer;
}

/* ── Events ── */
:deep(.fc .fc-event) {
  cursor: pointer;
  font-size: 0.72rem;
  padding: 2px 5px;
  border-radius: 5px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: opacity 0.15s, transform 0.1s;
}

:deep(.fc .fc-event:hover) {
  opacity: 0.88;
  transform: translateY(-1px);
}

:deep(.fc .fc-daygrid-event) {
  white-space: normal;
}

/* ── More link ── */
:deep(.fc .fc-daygrid-more-link) {
  font-size: 0.7rem;
  color: #6366f1;
  font-weight: 600;
}

/* ── Modal transition ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
