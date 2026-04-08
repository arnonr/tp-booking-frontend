<script setup lang="ts">
import { computed, watch } from 'vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import type { Booking } from '@/types'

const props = defineProps<{
  show: boolean
  booking: Booking | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', booking: Booking): void
  (e: 'cancel', bookingId: number): void
}>()

const store = useBookingStore()

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${buddhistYear}`
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr)
  const buddhistYear = d.getFullYear() + 543
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${buddhistYear} ${time} น.`
}

const roomLabel = computed(() => {
  if (!props.booking?.room) return `ห้อง #${props.booking?.roomId}`
  const loc = [props.booking.room.building, props.booking.room.floor ? `ชั้น ${props.booking.room.floor}` : ''].filter(Boolean).join(' ')
  return loc ? `${props.booking.room.name} — ${loc}` : props.booking.room.name
})

const canEdit = computed(() => props.booking?.status === 'pending')
const canCancel = computed(() => props.booking?.status === 'pending' || props.booking?.status === 'approved')

async function handleCancel() {
  if (!props.booking) return
  if (!confirm('ยืนยันการยกเลิกการจองนี้?')) return
  await store.cancelBooking(props.booking.id)
  emit('cancel', props.booking.id)
  emit('close')
}

// ล็อก scroll เมื่อ modal เปิด
watch(() => props.show, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show && booking"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

        <!-- Modal -->
        <div class="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">

          <!-- Header -->
          <div class="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div class="flex-1 min-w-0 pr-3">
              <p class="text-xs font-medium text-blue-600 mb-1">รายละเอียดการจอง #{{ booking.id }}</p>
              <h2 class="text-lg font-bold text-gray-900 truncate">{{ roomLabel }}</h2>
              <p v-if="booking.room?.description" class="mt-0.5 text-xs text-gray-400 line-clamp-1">{{ booking.room.description }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <StatusBadge :status="booking.status" />
              <button
                @click="emit('close')"
                class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto flex-1 px-5 py-4 space-y-5">

            <!-- วันที่ & เวลา -->
            <div class="rounded-xl bg-blue-50 px-4 py-3 flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <p class="text-xs text-blue-500 font-medium mb-0.5">วันที่จอง</p>
                <p class="text-sm font-semibold text-blue-900">{{ formatDate(booking.bookingDate) }}</p>
              </div>
              <div>
                <p class="text-xs text-blue-500 font-medium mb-0.5">เวลา</p>
                <p class="text-sm font-semibold text-blue-900">{{ formatTime(booking.startTime) }} – {{ formatTime(booking.endTime) }} น.</p>
              </div>
              <div>
                <p class="text-xs text-blue-500 font-medium mb-0.5">ผู้เข้าร่วม</p>
                <p class="text-sm font-semibold text-blue-900">{{ booking.attendeeCount }} คน</p>
              </div>
            </div>

            <!-- วัตถุประสงค์ -->
            <div>
              <p class="text-xs font-medium text-gray-400 mb-1">วัตถุประสงค์</p>
              <p class="text-sm text-gray-800 leading-relaxed">{{ booking.purpose }}</p>
            </div>

            <!-- ความต้องการเพิ่มเติม -->
            <div v-if="booking.additionalRequirements">
              <p class="text-xs font-medium text-gray-400 mb-1">ความต้องการเพิ่มเติม</p>
              <p class="text-sm text-gray-800 leading-relaxed">{{ booking.additionalRequirements }}</p>
            </div>

            <!-- ข้อมูลห้อง -->
            <div v-if="booking.room" class="rounded-xl border border-gray-100 px-4 py-3 space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">ข้อมูลห้อง</p>
              <div class="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p class="text-xs text-gray-400">ชื่อห้อง</p>
                  <p class="font-medium text-gray-800">{{ booking.room.name }}</p>
                </div>
                <div v-if="booking.room.building || booking.room.floor">
                  <p class="text-xs text-gray-400">ที่ตั้ง</p>
                  <p class="font-medium text-gray-800">
                    {{ [booking.room.building, booking.room.floor ? `ชั้น ${booking.room.floor}` : ''].filter(Boolean).join(' ') }}
                  </p>
                </div>
                <div v-if="booking.room.capacity">
                  <p class="text-xs text-gray-400">ความจุ</p>
                  <p class="font-medium text-gray-800">{{ booking.room.capacity }} คน</p>
                </div>
              </div>
            </div>

            <!-- ข้อมูลผู้จอง -->
            <div v-if="booking.user" class="rounded-xl border border-gray-100 px-4 py-3 space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">ผู้จอง</p>
              <div class="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p class="text-xs text-gray-400">ชื่อ</p>
                  <p class="font-medium text-gray-800">{{ booking.user.fullName || booking.user.username }}</p>
                </div>
                <div v-if="booking.user.department">
                  <p class="text-xs text-gray-400">หน่วยงาน</p>
                  <p class="font-medium text-gray-800">{{ booking.user.department }}</p>
                </div>
                <div v-if="booking.user.phone">
                  <p class="text-xs text-gray-400">โทรศัพท์</p>
                  <p class="font-medium text-gray-800">{{ booking.user.phone }}</p>
                </div>
                <div v-if="booking.user.email">
                  <p class="text-xs text-gray-400">อีเมล</p>
                  <p class="font-medium text-gray-800 truncate">{{ booking.user.email }}</p>
                </div>
              </div>
            </div>

            <!-- Check-in -->
            <div v-if="booking.checkedIn" class="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
              <svg class="h-4 w-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-green-800">Check-in แล้ว</p>
                <p v-if="booking.checkedInAt" class="text-xs text-green-600">{{ formatDateTime(booking.checkedInAt) }}</p>
              </div>
            </div>

            <!-- หมายเหตุจาก Admin -->
            <div v-if="booking.adminRemark" class="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p class="text-xs font-medium text-amber-600 mb-1">หมายเหตุจาก Admin</p>
              <p class="text-sm text-amber-900">{{ booking.adminRemark }}</p>
            </div>

            <!-- วันที่สร้าง / อนุมัติ -->
            <div class="text-xs text-gray-400 space-y-1 pb-1">
              <p>สร้างเมื่อ: {{ formatDateTime(booking.createdAt) }}</p>
              <p v-if="booking.approvedAt">อนุมัติเมื่อ: {{ formatDateTime(booking.approvedAt) }}</p>
            </div>

          </div>

          <!-- Footer actions -->
          <div class="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
            <button
              v-if="canCancel"
              @click="handleCancel"
              :disabled="store.isLoading"
              class="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              ยกเลิกการจอง
            </button>
            <button
              v-if="canEdit"
              @click="emit('edit', booking)"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              แก้ไขการจอง
            </button>
            <button
              v-if="!canEdit && !canCancel"
              @click="emit('close')"
              class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              ปิด
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: translateY(20px);
  opacity: 0;
}
</style>
