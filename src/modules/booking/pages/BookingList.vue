<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BookingFormModal from '@/modules/booking/components/BookingFormModal.vue'
import BookingDetailModal from '@/modules/booking/components/BookingDetailModal.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useBooking } from '@/composables/useBooking'
import type { Booking, BookingStatus } from '@/types'

const store = useBookingStore()
const { bookingStatuses } = useBooking()

const showBookingModal = ref(false)
const editingBooking = ref<Booking | undefined>(undefined)

const showDetailModal = ref(false)
const detailBooking = ref<Booking | null>(null)

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const buddhistYear = (d.getFullYear() + 543) % 100
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${String(buddhistYear).padStart(2, '0')}`
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

function roomLabel(booking: Booking): string {
  if (!booking.room) return `ห้อง #${booking.roomId}`
  const loc = [booking.room.building, booking.room.floor ? `ชั้น ${booking.room.floor}` : ''].filter(Boolean).join(' ')
  return loc ? `${booking.room.name} · ${loc}` : booking.room.name
}

function setStatusFilter(status: BookingStatus | 'all') {
  store.setStatusFilter(status)
}

function openCreate() {
  editingBooking.value = undefined
  showBookingModal.value = true
}

function openDetail(booking: Booking) {
  detailBooking.value = booking
  showDetailModal.value = true
}

function openEdit(booking: Booking) {
  showDetailModal.value = false
  editingBooking.value = booking
  showBookingModal.value = true
}

function onDetailCancel() {
  showDetailModal.value = false
  detailBooking.value = null
  store.fetchBookings()
}

function onModalDone() {
  showBookingModal.value = false
  editingBooking.value = undefined
  store.fetchBookings()
}

onMounted(() => {
  store.fetchBookings()
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">การจองของฉัน</h1>
          <p class="mt-1 text-sm text-gray-500">รายการจองห้องประชุมทั้งหมดของคุณ</p>
        </div>
        <button
          @click="openCreate"
          class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          จองห้องประชุม
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2">
        <button
          @click="setStatusFilter('all')"
          :class="[
            'rounded-full px-3 py-1 text-sm font-medium transition',
            store.statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          ทั้งหมด
        </button>
        <button
          v-for="s in bookingStatuses"
          :key="s.value"
          @click="setStatusFilter(s.value)"
          :class="[
            'rounded-full px-3 py-1 text-sm font-medium transition',
            store.statusFilter === s.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <!-- Empty -->
      <div v-else-if="store.filteredBookings.length === 0" class="py-16 text-center">
        <svg class="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-lg font-medium text-gray-500">ไม่มีรายการจอง</p>
        <p class="mt-1 text-sm text-gray-400">กดปุ่ม "จองห้องประชุม" เพื่อเริ่มจอง</p>
      </div>

      <!-- Booking Cards -->
      <div v-else class="space-y-3">
        <div
          v-for="booking in store.filteredBookings"
          :key="booking.id"
          @click="openDetail(booking)"
          class="block cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-gray-900">{{ roomLabel(booking) }}</h3>
                <StatusBadge :status="booking.status" />
              </div>
              <div class="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>{{ formatDate(booking.bookingDate) }}</span>
                <span>{{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</span>
                <span>{{ booking.attendeeCount }} คน</span>
              </div>
              <p class="text-sm text-gray-600 line-clamp-1">{{ booking.purpose }}</p>
            </div>

            <div class="flex items-center gap-2">
              <span v-if="booking.checkedIn" class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Check-in แล้ว
              </span>
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="store.pagination.total > store.pagination.limit"
        class="flex items-center justify-center gap-2"
      >
        <button
          :disabled="store.pagination.page <= 1"
          @click="store.fetchBookings({ page: store.pagination.page - 1 })"
          class="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          ก่อนหน้า
        </button>
        <span class="text-sm text-gray-600">
          หน้า {{ store.pagination.page }} / {{ Math.ceil(store.pagination.total / store.pagination.limit) }}
        </span>
        <button
          :disabled="store.pagination.page >= Math.ceil(store.pagination.total / store.pagination.limit)"
          @click="store.fetchBookings({ page: store.pagination.page + 1 })"
          class="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
    </div>

    <BookingDetailModal
      :show="showDetailModal"
      :booking="detailBooking"
      @close="showDetailModal = false; detailBooking = null"
      @edit="openEdit"
      @cancel="onDetailCancel"
    />

    <BookingFormModal
      :show="showBookingModal"
      :booking="editingBooking"
      @close="showBookingModal = false; editingBooking = undefined"
      @done="onModalDone"
    />
  </AppLayout>
</template>
