<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BookingFormModal from '@/modules/booking/components/BookingFormModal.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useFeedbackStore } from '@/modules/feedback/stores/feedbackStore'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import { useBooking } from '@/composables/useBooking'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const feedbackStore = useFeedbackStore()
const authStore = useAuthStore()
const { getStatusLabel, canCancel, canCheckIn, canGiveFeedback } = useBooking()

const bookingId = computed(() => Number(route.params.id))
const booking = computed(() => bookingStore.currentBooking)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const showCancelConfirm = ref(false)
const showFeedbackForm = ref(false)
const showEditModal = ref(false)
const feedbackForm = ref({ rating: 5, comment: '' })
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

function formatBuddhistDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const _canCancel = computed(() => {
  if (!booking.value) return false
  return canCancel(
    booking.value.status,
    `${booking.value.bookingDate}T${booking.value.startTime}`,
    isAdmin.value,
  )
})

const _canCheckIn = computed(() => {
  if (!booking.value) return false
  return canCheckIn(booking.value)
})

const _canGiveFeedback = computed(() => {
  if (!booking.value) return false
  return canGiveFeedback(booking.value)
})

async function handleCancel() {
  try {
    await bookingStore.cancelBooking(bookingId.value)
    showCancelConfirm.value = false
    message.value = { type: 'success', text: 'ยกเลิกการจองสำเร็จ' }
    await bookingStore.fetchBookingById(bookingId.value)
  } catch {
    message.value = { type: 'error', text: bookingStore.error ?? 'ไม่สามารถยกเลิกได้' }
  }
}

async function handleCheckIn() {
  try {
    await bookingStore.checkIn(bookingId.value)
    message.value = { type: 'success', text: 'Check-in สำเร็จ' }
    await bookingStore.fetchBookingById(bookingId.value)
  } catch {
    message.value = { type: 'error', text: bookingStore.error ?? 'Check-in ไม่สำเร็จ' }
  }
}

async function handleFeedback() {
  try {
    await feedbackStore.submitFeedback(bookingId.value, feedbackForm.value)
    showFeedbackForm.value = false
    message.value = { type: 'success', text: 'ส่ง Feedback สำเร็จ' }
  } catch {
    message.value = { type: 'error', text: feedbackStore.error ?? 'ส่ง Feedback ไม่สำเร็จ' }
  }
}

const statusTimeline = computed(() => {
  if (!booking.value) return []
  const steps: { label: string; time?: string; done: boolean }[] = [
    { label: 'สร้างการจอง', time: booking.value.createdAt, done: true },
    { label: 'รออนุมัติ', done: true },
  ]

  if (booking.value.status === 'approved' || booking.value.status === 'completed') {
    steps.push({ label: 'อนุมัติแล้ว', time: booking.value.approvedAt ?? undefined, done: true })
  } else if (booking.value.status === 'rejected') {
    steps.push({ label: 'ปฏิเสธ', time: booking.value.approvedAt ?? undefined, done: true })
  } else if (booking.value.status === 'cancelled') {
    steps.push({ label: 'ยกเลิก', done: true })
  }

  if (booking.value.checkedIn) {
    steps.push({ label: 'Check-in', time: booking.value.checkedInAt ?? undefined, done: true })
  }

  if (booking.value.status === 'completed') {
    steps.push({ label: 'เสร็จสิ้น', done: true })
  }

  return steps
})

onMounted(() => {
  bookingStore.fetchBookingById(bookingId.value)
})
</script>

<template>
  <AppLayout>
    <div v-if="bookingStore.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <div v-else-if="!booking" class="py-16 text-center text-gray-500">
      <p class="text-lg">ไม่พบการจอง</p>
      <router-link to="/bookings" class="mt-4 inline-block text-blue-600 hover:underline">
        กลับรายการจอง
      </router-link>
    </div>

    <div v-else class="mx-auto max-w-3xl space-y-6">
      <!-- Back -->
      <button
        @click="router.back()"
        class="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        กลับ
      </button>

      <!-- Message -->
      <div
        v-if="message"
        :class="[
          'rounded-lg px-4 py-3 text-sm',
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
        ]"
      >
        {{ message.text }}
      </div>

      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">
              การจอง #{{ booking.id }}
            </h1>
            <StatusBadge :status="booking.status" />
          </div>
          <p class="mt-1 text-sm text-gray-500">
            สร้างเมื่อ {{ formatDateTime(booking.createdAt) }}
          </p>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Room Info -->
        <div class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="text-sm font-medium text-gray-500">ห้องประชุม</h2>
          <p class="mt-1 text-lg font-semibold text-gray-900">
            {{ booking.room?.name ?? `ห้อง #${booking.roomId}` }}
          </p>
          <p v-if="booking.room" class="mt-1 text-sm text-gray-500">
            {{ [booking.room.building, booking.room.floor].filter(Boolean).join(' ') }}
          </p>
        </div>

        <!-- Date/Time -->
        <div class="rounded-xl border border-gray-200 bg-white p-5">
          <h2 class="text-sm font-medium text-gray-500">วันและเวลา</h2>
          <p class="mt-1 text-lg font-semibold text-gray-900">
            {{ formatBuddhistDate(booking.bookingDate) }}
          </p>
          <p class="mt-1 text-sm text-gray-600">
            {{ booking.startTime }} - {{ booking.endTime }}
          </p>
        </div>

        <!-- Purpose -->
        <div class="rounded-xl border border-gray-200 bg-white p-5 sm:col-span-2">
          <h2 class="text-sm font-medium text-gray-500">วัตถุประสงค์</h2>
          <p class="mt-1 text-gray-900">{{ booking.purpose }}</p>
          <div class="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>ผู้เข้าร่วม: {{ booking.attendeeCount }} คน</span>
            <span v-if="booking.checkedIn">Check-in: {{ formatDateTime(booking.checkedInAt ?? '') }}</span>
          </div>
        </div>

        <!-- Admin Remark -->
        <div v-if="booking.adminRemark" class="rounded-xl border border-yellow-200 bg-yellow-50 p-5 sm:col-span-2">
          <h2 class="text-sm font-medium text-yellow-700">หมายเหตุจาก Admin</h2>
          <p class="mt-1 text-yellow-800">{{ booking.adminRemark }}</p>
        </div>

        <!-- Recurring Group -->
        <div v-if="booking.recurringGroupId" class="rounded-xl border border-blue-200 bg-blue-50 p-5 sm:col-span-2">
          <div class="flex items-center gap-2 text-blue-700">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-sm font-medium">การจองนี้เป็นส่วนหนึ่งของกลุ่ม recurring booking</span>
          </div>
        </div>
      </div>

      <!-- Status Timeline -->
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">สถานะ</h2>
        <div class="space-y-3">
          <div
            v-for="(step, i) in statusTimeline"
            :key="i"
            class="flex items-center gap-3"
          >
            <div :class="[
              'flex h-8 w-8 items-center justify-center rounded-full',
              step.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400',
            ]">
              <svg v-if="step.done" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ step.label }}</p>
              <p v-if="step.time" class="text-xs text-gray-500">{{ formatDateTime(step.time) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <button
          v-if="booking.status === 'pending'"
          @click="showEditModal = true"
          class="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          <svg class="mr-1 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          แก้ไขการจอง
        </button>

        <button
          v-if="_canCheckIn"
          @click="handleCheckIn"
          :disabled="bookingStore.isLoading"
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <svg class="mr-1 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Check-in
        </button>

        <button
          v-if="_canCancel && !showCancelConfirm"
          @click="showCancelConfirm = true"
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          ยกเลิกการจอง
        </button>

        <button
          v-if="_canGiveFeedback && !showFeedbackForm"
          @click="showFeedbackForm = true"
          class="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          ให้ Feedback
        </button>

        <router-link
          v-if="booking.recurringGroupId"
          :to="`/bookings/recurring?groupId=${booking.recurringGroupId}`"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ดูกลุ่ม recurring
        </router-link>
      </div>

      <!-- Cancel Confirmation -->
      <div v-if="showCancelConfirm" class="rounded-xl border border-red-200 bg-red-50 p-5">
        <p class="text-sm font-medium text-red-800">ยืนยันการยกเลิกการจอง?</p>
        <p class="mt-1 text-sm text-red-600">
          การยกเลิกไม่สามารถเรียกคืนได้
        </p>
        <div class="mt-3 flex gap-2">
          <button
            @click="handleCancel"
            :disabled="bookingStore.isLoading"
            class="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            ยืนยันยกเลิก
          </button>
          <button
            @click="showCancelConfirm = false"
            class="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ไม่ยกเลิก
          </button>
        </div>
      </div>

      <!-- Feedback Form -->
      <div v-if="showFeedbackForm" class="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h3 class="text-sm font-medium text-blue-800">ให้ Feedback</h3>
        <div class="mt-3">
          <label class="block text-sm font-medium text-blue-700">คะแนน (1-5)</label>
          <div class="mt-1 flex gap-1">
            <button
              v-for="n in 5"
              :key="n"
              @click="feedbackForm.rating = n"
              type="button"
              :class="[
                'text-2xl transition',
                n <= feedbackForm.rating ? 'text-yellow-400' : 'text-gray-300',
              ]"
            >
              &#9733;
            </button>
          </div>
        </div>
        <div class="mt-3">
          <label class="block text-sm font-medium text-blue-700">ความคิดเห็น</label>
          <textarea
            v-model="feedbackForm.comment"
            rows="3"
            class="mt-1 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="แสดงความคิดเห็นเกี่ยวกับการใช้ห้อง..."
          />
        </div>
        <div class="mt-3 flex gap-2">
          <button
            @click="handleFeedback"
            :disabled="feedbackStore.isLoading"
            class="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            ส่ง Feedback
          </button>
          <button
            @click="showFeedbackForm = false"
            class="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>

    <BookingFormModal
      :show="showEditModal"
      :booking="booking ?? undefined"
      @close="showEditModal = false"
      @done="showEditModal = false; bookingStore.fetchBookingById(bookingId)"
    />
  </AppLayout>
</template>
