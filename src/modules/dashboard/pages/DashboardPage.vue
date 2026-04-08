<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/modules/dashboard/stores/reportStore'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useBooking } from '@/composables/useBooking'

const router = useRouter()
const reportStore = useReportStore()
const bookingStore = useBookingStore()
const { getStatusLabel, getStatusColor } = useBooking()

const summary = computed(() => reportStore.summary)
const recentBookings = computed(() => bookingStore.bookings.slice(0, 5))

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear}`
}

onMounted(async () => {
  await Promise.all([
    reportStore.fetchSummary(),
    bookingStore.fetchBookings({ limit: 5 }),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">ภาพรวมระบบจองห้องประชุม</p>
    </div>

    <!-- Summary Cards -->
    <div v-if="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-500">การจองทั้งหมด</p>
          <div class="rounded-lg bg-blue-100 p-2">
            <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <p class="mt-2 text-3xl font-bold text-gray-900">{{ summary.totalBookings }}</p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-500">วันนี้</p>
          <div class="rounded-lg bg-green-100 p-2">
            <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <p class="mt-2 text-3xl font-bold text-blue-600">{{ summary.todayBookings }}</p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-500">รออนุมัติ</p>
          <div class="rounded-lg bg-yellow-100 p-2">
            <svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p class="mt-2 text-3xl font-bold text-yellow-600">{{ summary.pendingApprovals }}</p>
        <button
          @click="router.push('/admin/approvals')"
          class="mt-2 text-xs font-medium text-blue-600 hover:underline"
        >
          ดูคิวอนุมัติ
        </button>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-500">อัตราการใช้งาน</p>
          <div class="rounded-lg bg-purple-100 p-2">
            <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <p class="mt-2 text-3xl font-bold text-purple-600">
          {{ Math.round((summary.occupancyRate ?? 0) * 100) }}%
        </p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid gap-4 sm:grid-cols-3">
      <button
        @click="router.push('/admin/approvals')"
        class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
      >
        <div class="rounded-lg bg-yellow-100 p-2">
          <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-gray-900">อนุมัติการจอง</p>
          <p class="text-sm text-gray-500">{{ summary?.pendingApprovals ?? 0 }} รายการรออนุมัติ</p>
        </div>
      </button>

      <button
        @click="router.push('/admin/rooms')"
        class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
      >
        <div class="rounded-lg bg-blue-100 p-2">
          <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-gray-900">จัดการห้อง</p>
          <p class="text-sm text-gray-500">{{ summary?.totalRooms ?? 0 }} ห้อง</p>
        </div>
      </button>

      <button
        @click="router.push('/admin/reports')"
        class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
      >
        <div class="rounded-lg bg-green-100 p-2">
          <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-gray-900">รายงาน</p>
          <p class="text-sm text-gray-500">ดูสถิติและรายงาน</p>
        </div>
      </button>
    </div>

    <!-- Recent Bookings -->
    <div class="rounded-xl border border-gray-200 bg-white">
      <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-gray-900">การจองล่าสุด</h2>
        <router-link to="/bookings" class="text-sm text-blue-600 hover:underline">
          ดูทั้งหมด
        </router-link>
      </div>

      <div v-if="bookingStore.isLoading" class="flex justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>

      <div v-else-if="recentBookings.length === 0" class="px-6 py-8 text-center text-sm text-gray-400">
        ยังไม่มีการจอง
      </div>

      <div v-else class="divide-y divide-gray-100">
        <router-link
          v-for="booking in recentBookings"
          :key="booking.id"
          :to="`/bookings/${booking.id}`"
          class="flex items-center justify-between px-6 py-3 transition hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ booking.room?.name ?? `Room #${booking.roomId}` }}
              </p>
              <p class="text-xs text-gray-500">
                {{ booking.user?.fullName ?? `User #${booking.userId}` }} - {{ formatDate(booking.bookingDate) }} {{ booking.startTime }}-{{ booking.endTime }}
              </p>
            </div>
          </div>
          <span
            :class="[
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              getStatusColor(booking.status).bg,
              getStatusColor(booking.status).text,
            ]"
          >
            {{ getStatusLabel(booking.status) }}
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>
