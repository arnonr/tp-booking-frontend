<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'

const router = useRouter()
const bookingStore = useBookingStore()
const roomStore = useRoomStore()

const form = ref({
  roomId: null as number | null,
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  attendeeCount: 1,
  recurringType: 'weekly' as 'weekly' | 'monthly',
  recurringEndDate: '',
})

const previewDates = ref<string[]>([])
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const createdBookings = ref<number>(0)

const rooms = computed(() => roomStore.rooms.filter((r) => r.status === 'active'))
const selectedRoom = computed(() => rooms.value.find((r) => r.id === form.value.roomId))

const roomOptions = computed(() =>
  rooms.value.map((r) => ({ label: `${r.name} (${r.capacity} คน)`, value: r.id as number })),
)
const recurringTypeOptions = [
  { label: 'ทุกสัปดาห์', value: 'weekly' },
  { label: 'ทุกเดือน', value: 'monthly' },
]

watch(() => form.value.recurringType, refreshPreview)

function generatePreviewDates(): string[] {
  if (!form.value.bookingDate || !form.value.recurringEndDate) return []

  const dates: string[] = []
  const start = new Date(form.value.bookingDate)
  const end = new Date(form.value.recurringEndDate)

  if (end <= start) return []

  let current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    if (form.value.recurringType === 'weekly') {
      current.setDate(current.getDate() + 7)
    } else {
      current.setMonth(current.getMonth() + 1)
    }
  }
  return dates
}

function refreshPreview() {
  previewDates.value = generatePreviewDates()
}

function formatBuddhistDate(dateStr: string): string {
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear}`
}

async function handleSubmit() {
  message.value = null
  if (!form.value.roomId || !form.value.bookingDate || !form.value.recurringEndDate) {
    message.value = { type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
    return
  }

  try {
    const result = await bookingStore.createRecurringBooking({
      roomId: form.value.roomId!,
      bookingDate: form.value.bookingDate,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      purpose: form.value.purpose,
      attendeeCount: form.value.attendeeCount,
      recurringType: form.value.recurringType,
      recurringEndDate: form.value.recurringEndDate,
    })

    if (result) {
      createdBookings.value = result.length
      message.value = {
        type: 'success',
        text: `สร้าง recurring booking สำเร็จ (${result.length} รายการ)`,
      }
    }
  } catch {
    message.value = { type: 'error', text: bookingStore.error ?? 'เกิดข้อผิดพลาด' }
  }
}

onMounted(() => {
  roomStore.fetchAllRooms()
})
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-3xl space-y-6">
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

      <div>
        <h1 class="text-2xl font-bold text-gray-900">จองห้องประชุม (Recurring)</h1>
        <p class="mt-1 text-sm text-gray-500">
          สร้างการจองแบบซ้ำรายสัปดาห์หรือรายเดือน
        </p>
      </div>

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

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Room Selection -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">เลือกห้องประชุม</h2>
          <AppSelect
            v-model="form.roomId"
            :options="roomOptions"
            placeholder="เลือกห้องประชุม"
            :is-searchable="true"
            class="w-full"
          />
          <div v-if="selectedRoom" class="mt-3 flex flex-wrap gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <span>{{ selectedRoom.openTime }} - {{ selectedRoom.closeTime }}</span>
            <span>ช่วงละ {{ selectedRoom.slotDurationMin }} นาที</span>
          </div>
        </div>

        <!-- Date/Time -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">วันและเวลา</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">วันเริ่มต้น *</label>
              <input
                v-model="form.bookingDate"
                type="date"
                required
                @change="refreshPreview"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">เวลาเริ่ม *</label>
              <input
                v-model="form.startTime"
                type="time"
                required
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">เวลาจบ *</label>
              <input
                v-model="form.endTime"
                type="time"
                required
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Recurring Settings -->
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700">ประเภท</label>
              <AppSelect
                v-model="form.recurringType"
                :options="recurringTypeOptions"
                class="mt-1 w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">สิ้นสุดวันที่ *</label>
              <input
                v-model="form.recurringEndDate"
                type="date"
                required
                @change="refreshPreview"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Preview -->
          <div v-if="previewDates.length > 0" class="mt-4">
            <p class="mb-2 text-sm font-medium text-gray-700">
              ตัวอย่างวันที่จะจอง ({{ previewDates.length }} วัน)
            </p>
            <div class="max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-3">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(d, i) in previewDates"
                  :key="i"
                  class="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700"
                >
                  {{ formatBuddhistDate(d) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">รายละเอียด</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">วัตถุประสงค์ *</label>
              <textarea
                v-model="form.purpose"
                rows="3"
                required
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="ระบุวัตถุประสงค์..."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">จำนวนผู้เข้าร่วม *</label>
              <input
                v-model.number="form.attendeeCount"
                type="number"
                min="1"
                required
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-40"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="router.back()"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            :disabled="bookingStore.isLoading"
            class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <span v-if="bookingStore.isLoading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            สร้าง Recurring Booking
          </button>
        </div>
      </form>
    </div>
  </AppLayout>
</template>
