<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { th } from 'date-fns/locale'
import { useDate } from '@/composables/useDate'
import AppSelect from '@/components/common/AppSelect.vue'
import { useBookingStore } from '@/modules/booking/stores/bookingStore'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'
import { useToast } from '@/composables/useToast'
import type { Booking } from '@/types'

const props = defineProps<{
  show: boolean
  booking?: Booking       // ถ้าส่งมา → edit mode
  defaultDate?: string    // pre-fill วันที่ (create mode)
  defaultRoomId?: number  // pre-fill ห้อง (create mode)
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'done', bookingId: number): void
}>()

const bookingStore = useBookingStore()
const roomStore = useRoomStore()
const toast = useToast()
const router = useRouter()

const form = ref({
  roomId: null as number | null,
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  attendeeCount: 1,
  additionalRequirements: '',
})

// picker intermediary refs
const pickerDate = ref<string | null>(null)
const today = new Date(new Date().toDateString()) // date-only, no time
const pickerStartTime = ref<{ hours: number; minutes: number } | null>(null)
const pickerEndTime = ref<{ hours: number; minutes: number } | null>(null)

const showConflictWarning = ref(false)
const conflictMessage = ref('')
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const isEditMode = computed(() => !!props.booking)
const rooms = computed(() => roomStore.rooms.filter((r) => r.status === 'active'))
const selectedRoom = computed(() => rooms.value.find((r) => r.id === form.value.roomId))
const roomOptions = computed(() =>
  rooms.value.map((r) => ({
    label: `${r.name} (${r.capacity} คน)${r.building ? ` - ${r.building}` : ''}`,
    value: r.id as number,
  })),
)
const availableSlots = computed(() => roomStore.availability.filter((s) => s.isAvailable))

const { formatDate } = useDate()
const formatBuddhistDate = formatDate

// HH:mm string → { hours, minutes }
function stringToTime(s: string): { hours: number; minutes: number } | null {
  if (!s) return null
  const [h, m] = s.split(':').map(Number)
  return { hours: h, minutes: m }
}

// sync picker → form (date)
watch(pickerDate, (d) => {
  form.value.bookingDate = d ?? ''
})

// sync picker → form (time)
watch(pickerStartTime, (t) => {
  form.value.startTime = t
    ? `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`
    : ''
})
watch(pickerEndTime, (t) => {
  form.value.endTime = t
    ? `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`
    : ''
})

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
  pickerStartTime.value = stringToTime(slot.startTime)
  pickerEndTime.value = stringToTime(slot.endTime)
}

async function handleSubmit() {
  message.value = null
  showConflictWarning.value = false

  if (!form.value.roomId || !form.value.bookingDate || !form.value.startTime || !form.value.endTime) {
    message.value = { type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
    return
  }

  try {
    if (isEditMode.value && props.booking) {
      await bookingStore.updateBooking(props.booking.id, {
        bookingDate: form.value.bookingDate,
        startTime: form.value.startTime,
        endTime: form.value.endTime,
        purpose: form.value.purpose,
        attendeeCount: form.value.attendeeCount,
        additionalRequirements: form.value.additionalRequirements,
      })
      emit('done', props.booking.id)
    } else {

      const created = await bookingStore.createBooking({
        roomId: form.value.roomId,
        bookingDate: form.value.bookingDate,
        startTime: form.value.startTime,
        endTime: form.value.endTime,
        purpose: form.value.purpose,
        attendeeCount: form.value.attendeeCount,
        additionalRequirements: form.value.additionalRequirements,
      })
      if (created) {
        toast.show('จองเรียบร้อยแล้ว! รอเจ้าหน้าที่อนุมัติการจองของคุณ', 'success')
        emit('done', created.id)
        router.push({ name: 'bookings' })
      }
    }
  } catch {
    message.value = { type: 'error', text: bookingStore.error ?? 'เกิดข้อผิดพลาด' }
    if (bookingStore.error?.toLowerCase().includes('conflict')) {
      showConflictWarning.value = true
      conflictMessage.value = bookingStore.error
    }
  }
}

watch(
  () => props.show,
  async (v) => {
    if (!v) return
    message.value = null
    showConflictWarning.value = false
    if (roomStore.rooms.length === 0) await roomStore.fetchAllRooms()

    if (props.booking) {
      // edit mode — pre-fill from booking object
      form.value = {
        roomId: props.booking.roomId,
        bookingDate: props.booking.bookingDate,
        startTime: props.booking.startTime,
        endTime: props.booking.endTime,
        purpose: props.booking.purpose,
        attendeeCount: props.booking.attendeeCount,
        additionalRequirements: props.booking.additionalRequirements ?? '',
      }
      pickerDate.value = props.booking.bookingDate
      pickerStartTime.value = stringToTime(props.booking.startTime)
      pickerEndTime.value = stringToTime(props.booking.endTime)
    } else {
      // create mode
      form.value = {
        roomId: props.defaultRoomId ?? null,
        bookingDate: props.defaultDate ?? '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendeeCount: 1,
        additionalRequirements: '',
      }
      pickerDate.value = props.defaultDate ?? null
      pickerStartTime.value = null
      pickerEndTime.value = null
    }
  },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="bfm">
      <div v-if="show" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
        @click.self="emit('close')">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

        <!-- Panel -->
        <div class="bfm-panel relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg">
                {{ isEditMode ? '✏️' : '📋' }}
              </span>
              <h2 class="text-lg font-bold text-gray-900">
                {{ isEditMode ? 'แก้ไขการจอง' : 'จองห้องประชุม' }}
              </h2>
            </div>
            <button @click="emit('close')"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6">
            <!-- Alerts -->
            <div v-if="message"
              :class="['mb-4 rounded-lg px-4 py-3 text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700']">
              {{ message.text }}
            </div>
            <div v-if="showConflictWarning"
              class="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              <strong>เวลาซ้อนกัน!</strong> {{ conflictMessage }}
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">

              <!-- Step 1: ห้อง -->
              <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">1</span>
                  ห้องประชุม
                </h3>
                <AppSelect v-model="form.roomId" :options="roomOptions" placeholder="เลือกห้องประชุม"
                  :is-searchable="true" :disabled="isEditMode" class="w-full" />
                <p v-if="isEditMode" class="mt-1.5 text-xs text-gray-400">ไม่สามารถเปลี่ยนห้องได้ในการแก้ไข</p>
                <div v-if="selectedRoom"
                  class="mt-3 flex flex-wrap gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                  <span v-if="selectedRoom.building">{{ selectedRoom.building }}</span>
                  <span>ความจุ {{ selectedRoom.capacity }} คน</span>
                  <span>{{ selectedRoom.openTime }}–{{ selectedRoom.closeTime }}</span>
                  <span v-for="a in selectedRoom.amenities" :key="a.id" class="rounded-full bg-white px-2 py-0.5">{{
                    a.name }}</span>
                </div>
              </div>

              <!-- Step 2: วันและเวลา -->
              <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">2</span>
                  วันและเวลา
                </h3>
                <div class="grid gap-3 sm:grid-cols-3">
                  <!-- วันที่ — แสดงปี พ.ศ. -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">วันที่ *</label>
                    <VueDatePicker v-model="pickerDate" :locale="th" :time-config="{ enableTimePicker: false }"
                      model-type="yyyy-MM-dd" :min-date="today" auto-apply text-input>
                      <template #dp-input="{ onFocus, onBlur, toggleMenu }">
                        <input type="text" :value="pickerDate ? formatDate(pickerDate) : ''" readonly
                          @click="toggleMenu" @focus="onFocus" @blur="onBlur" class="dp-input"
                          placeholder="เลือกวันที่" />
                      </template>
                      <template #year-overlay-value="{ text }">
                        {{ parseInt(text) + 543 }}
                      </template>
                      <template #year="{ text }">
                        {{ Number(text) + 543 }}
                      </template>
                    </VueDatePicker>
                  </div>
                  <!-- เวลาเริ่ม -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">เวลาเริ่ม *</label>
                    <VueDatePicker v-model="pickerStartTime" time-picker :minutes-increment="30" placeholder="เลือกเวลา"
                      input-class-name="dp-input" />
                  </div>
                  <!-- เวลาจบ -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">เวลาจบ *</label>
                    <VueDatePicker v-model="pickerEndTime" time-picker :minutes-increment="30" placeholder="เลือกเวลา"
                      input-class-name="dp-input" />
                  </div>
                </div>
                <!-- Slots -->
                <div v-if="availableSlots.length > 0" class="mt-3">
                  <p class="mb-1.5 text-xs font-medium text-gray-500">ช่วงเวลาว่าง ({{
                    formatBuddhistDate(form.bookingDate) }})</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button v-for="slot in availableSlots" :key="slot.startTime" type="button" @click="selectSlot(slot)"
                      :class="[
                        'rounded-md px-2.5 py-1 text-xs font-medium transition',
                        form.startTime === slot.startTime && form.endTime === slot.endTime
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-50 text-green-700 hover:bg-green-100',
                      ]">{{ slot.startTime }}–{{ slot.endTime }}</button>
                  </div>
                </div>
                <p v-else-if="form.bookingDate && form.roomId && !roomStore.isLoading"
                  class="mt-2 text-xs text-gray-400">
                  ไม่มีช่วงเวลาว่างในวันที่เลือก
                </p>
              </div>

              <!-- Step 3: รายละเอียด -->
              <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">3</span>
                  รายละเอียด
                </h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600">วัตถุประสงค์ *</label>
                    <textarea v-model="form.purpose" rows="2" required
                      class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="ระบุวัตถุประสงค์ของการประชุม..." />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600">จำนวนผู้เข้าร่วม *</label>
                    <input v-model.number="form.attendeeCount" type="number" min="1" required
                      class="mt-1 w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                    <p v-if="selectedRoom && form.attendeeCount > selectedRoom.capacity"
                      class="mt-1 text-xs text-red-500">
                      เกินความจุของห้อง ({{ selectedRoom.capacity }} คน)
                    </p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600">ความต้องการเพิ่มเติม</label>
                    <textarea v-model="form.additionalRequirements" rows="2"
                      class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="เช่น ต้องการโปรเจกเตอร์, ไวท์บอร์ด, อาหารว่าง ฯลฯ" />
                  </div>
                </div>
              </div>

              <!-- Summary -->
              <div v-if="form.roomId && form.bookingDate && form.startTime && form.endTime"
                class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <span class="font-semibold text-blue-800">สรุป: </span>
                {{ selectedRoom?.name }} · {{ formatBuddhistDate(form.bookingDate) }} · {{ form.startTime }}–{{
                  form.endTime }} · {{
                  form.attendeeCount }} คน
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-1">
                <button type="button" @click="emit('close')"
                  class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  ยกเลิก
                </button>
                <button type="submit" :disabled="bookingStore.isLoading"
                  class="inline-flex items-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition">
                  <span v-if="bookingStore.isLoading"
                    class="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {{ isEditMode ? 'บันทึกการแก้ไข' : 'ยืนยันการจอง' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bfm-enter-active,
.bfm-leave-active {
  transition: opacity 0.2s ease;
}

.bfm-enter-active .bfm-panel,
.bfm-leave-active .bfm-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.bfm-enter-from,
.bfm-leave-to {
  opacity: 0;
}

.bfm-enter-from .bfm-panel,
.bfm-leave-to .bfm-panel {
  transform: scale(0.96) translateY(10px);
  opacity: 0;
}

/* ปรับ input ของ VueDatePicker ให้เข้ากับ design */
:deep(.dp-input) {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #111827;
  font-family: inherit;
  outline: none;
}

:deep(.dp__main),
:deep(.dp__menu),
:deep(.dp__calendar),
:deep(.dp__overlay) {
  font-family: inherit;
}

:deep(.dp-input:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

:deep(.dp__input_wrap) {
  width: 100%;
}
</style>
