<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'
import { useAuthStore } from '@/modules/auth/stores/authStore'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const roomStore = useRoomStore()
const authStore = useAuthStore()

const form = ref({
  roomId: null as number | null,
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  attendeeCount: 1,
  bookerName: '',
  bookerPhone: '',
})

const showConflictWarning = ref(false)
const conflictMessage = ref('')
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const step = ref(1)

const rooms = computed(() => roomStore.rooms.filter((r) => r.status === 'active'))
const selectedRoom = computed(() => rooms.value.find((r) => r.id === form.value.roomId))
const roomOptions = computed(() =>
  rooms.value.map((r) => ({
    label: `${r.name} (${r.capacity} คน)${r.building ? ` - ${r.building}` : ''}`,
    value: r.id as number,
  })),
)

const selectedDaySlots = computed(() => {
  if (!form.value.bookingDate || !selectedRoom.value) return []
  return roomStore.availability
})

const availableSlots = computed(() => selectedDaySlots.value.filter((s) => s.isAvailable))

function formatBuddhistDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
}

async function checkAvailability() {
  if (form.value.roomId && form.value.bookingDate) {
    await roomStore.fetchAvailability(form.value.roomId, form.value.bookingDate)
  }
}

watch(() => form.value.roomId, checkAvailability)
watch(() => form.value.bookingDate, checkAvailability)

function selectSlot(slot: { startTime: string; endTime: string }) {
  form.value.startTime = slot.startTime
  form.value.endTime = slot.endTime
}

async function handleSubmit() {
  message.value = null
  showConflictWarning.value = false

  if (!form.value.roomId || !form.value.bookingDate || !form.value.startTime || !form.value.endTime) {
    message.value = { type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
    return
  }

  try {
    const booking = await bookingStore.createBooking({
      roomId: form.value.roomId,
      bookingDate: form.value.bookingDate,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      purpose: form.value.purpose,
      attendeeCount: form.value.attendeeCount,
      bookerName: form.value.bookerName,
      bookerPhone: form.value.bookerPhone,
    })

    if (booking) {
      router.push(`/bookings/${booking.id}`)
    }
  } catch {
    message.value = { type: 'error', text: bookingStore.error ?? 'เกิดข้อผิดพลาด' }
    if (bookingStore.error?.toLowerCase().includes('conflict')) {
      showConflictWarning.value = true
      conflictMessage.value = bookingStore.error
    }
  }
}

onMounted(async () => {
  roomStore.fetchAllRooms()
  if (!authStore.user) await authStore.fetchUser()
  form.value.bookerName = authStore.user?.fullName ?? ''
  form.value.bookerPhone = authStore.user?.phone ?? ''
  if (route.query.roomId) {
    form.value.roomId = Number(route.query.roomId)
  }
  if (route.query.date) {
    form.value.bookingDate = route.query.date as string
  }
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

      <h1 class="text-2xl font-bold text-gray-900">จองห้องประชุม</h1>

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

      <!-- Conflict Warning -->
      <div v-if="showConflictWarning" class="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
        <strong>เวลาซ้อนกัน!</strong> {{ conflictMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Step 1: Select Room -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            <span class="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">1</span>
            เลือกห้องประชุม
          </h2>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700">ห้องประชุม *</label>
              <AppSelect
                v-model="form.roomId"
                :options="roomOptions"
                placeholder="เลือกห้องประชุม"
                :is-searchable="true"
                class="mt-1 w-full"
              />
            </div>

            <!-- Selected Room Info -->
            <div v-if="selectedRoom" class="sm:col-span-2 rounded-lg bg-blue-50 p-4">
              <div class="flex flex-wrap gap-3 text-sm text-blue-700">
                <span>{{ selectedRoom.building }}</span>
                <span>{{ selectedRoom.capacity }} คน</span>
                <span>{{ selectedRoom.openTime }} - {{ selectedRoom.closeTime }}</span>
                <span>ช่วงละ {{ selectedRoom.slotDurationMin }} นาที</span>
              </div>
              <div v-if="selectedRoom.amenities?.length" class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="a in selectedRoom.amenities"
                  :key="a.id"
                  class="rounded-full bg-white px-2 py-0.5 text-xs text-blue-600"
                >
                  {{ a.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Select Date & Time -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            <span class="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">2</span>
            เลือกวันและเวลา
          </h2>

          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">วันที่ *</label>
              <input
                v-model="form.bookingDate"
                type="date"
                required
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

          <!-- Available Slots -->
          <div v-if="availableSlots.length > 0" class="mt-4">
            <p class="mb-2 text-sm font-medium text-gray-700">
              ช่วงเวลาว่าง ({{ formatBuddhistDate(form.bookingDate) }})
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="slot in availableSlots"
                :key="slot.startTime"
                type="button"
                @click="selectSlot(slot)"
                :class="[
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  form.startTime === slot.startTime && form.endTime === slot.endTime
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100',
                ]"
              >
                {{ slot.startTime }}-{{ slot.endTime }}
              </button>
            </div>
          </div>
          <div v-else-if="form.bookingDate && form.roomId && !roomStore.isLoading" class="mt-4 text-sm text-gray-400">
            ไม่มีช่วงเวลาว่างในวันที่เลือก
          </div>
        </div>

        <!-- Step 3: Details -->
        <div class="rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            <span class="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">3</span>
            รายละเอียดการจอง
          </h2>

          <div class="space-y-4">
            <!-- ข้อมูลผู้จอง -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">ชื่อผู้จอง *</label>
                <input
                  v-model="form.bookerName"
                  type="text"
                  required
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">เบอร์ติดต่อ</label>
                <input
                  v-model="form.bookerPhone"
                  type="tel"
                  class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">วัตถุประสงค์ *</label>
              <textarea
                v-model="form.purpose"
                rows="3"
                required
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="ระบุวัตถุประสงค์ของการประชุม..."
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
              <p v-if="selectedRoom && form.attendeeCount > selectedRoom.capacity" class="mt-1 text-xs text-red-500">
                เกินความจุของห้อง ({{ selectedRoom.capacity }} คน)
              </p>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="form.roomId && form.bookingDate && form.startTime && form.endTime" class="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 class="text-sm font-semibold text-blue-800">สรุปการจอง</h3>
          <div class="mt-2 space-y-1 text-sm text-blue-700">
            <p>ห้อง: {{ selectedRoom?.name }}</p>
            <p>วันที่: {{ formatBuddhistDate(form.bookingDate) }}</p>
            <p>เวลา: {{ form.startTime }} - {{ form.endTime }}</p>
            <p>จำนวนผู้เข้าร่วม: {{ form.attendeeCount }} คน</p>
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
            ยืนยันการจอง
          </button>
        </div>
      </form>
    </div>
  </AppLayout>
</template>
