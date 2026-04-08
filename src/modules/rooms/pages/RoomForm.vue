<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import AppSelect from '@/components/common/AppSelect.vue'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const store = useRoomStore()
const { show: showToast } = useToast()

const isEdit = computed(() => !!route.params.id)
const roomId = computed(() => Number(route.params.id))
const pageTitle = computed(() => (isEdit.value ? 'แก้ไขห้องประชุม' : 'สร้างห้องประชุมใหม่'))

const form = ref({
  name: '',
  building: '',
  floor: '',
  capacity: 10,
  description: '',
  status: 'active' as 'active' | 'maintenance' | 'inactive',
  openTime: '08:00',
  closeTime: '17:00',
  slotDurationMin: 60,
})

const selectedAmenities = ref<number[]>([])
const uploadedFiles = ref<File[]>([])

// VueDatePicker time-picker เก็บ { hours, minutes }
const pickerOpenTime = ref<{ hours: number; minutes: number } | null>(null)
const pickerCloseTime = ref<{ hours: number; minutes: number } | null>(null)

function timeStringToPickerValue(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(':').map(Number)
  return { hours: h, minutes: m }
}
function pickerValueToTimeString(v: { hours: number; minutes: number } | null): string {
  if (!v) return ''
  return `${String(v.hours).padStart(2, '0')}:${String(v.minutes).padStart(2, '0')}`
}

const slotDurationOptions = [
  { label: '30 นาที', value: 30 },
  { label: '60 นาที', value: 60 },
  { label: '90 นาที', value: 90 },
  { label: '120 นาที', value: 120 },
]

const statusOptions = [
  { label: 'พร้อมใช้งาน', value: 'active' },
  { label: 'ปรับปรุง', value: 'maintenance' },
  { label: 'ไม่พร้อมใช้งาน', value: 'inactive' },
]

async function handleSubmit() {
  try {
    const payload = {
      name: form.value.name,
      building: form.value.building || null,
      floor: form.value.floor || null,
      capacity: form.value.capacity,
      description: form.value.description || null,
      status: form.value.status,
      openTime: pickerValueToTimeString(pickerOpenTime.value) || form.value.openTime,
      closeTime: pickerValueToTimeString(pickerCloseTime.value) || form.value.closeTime,
      slotDurationMin: form.value.slotDurationMin,
    }

    if (isEdit.value) {
      await store.updateRoom(roomId.value, payload)
      await store.updateAmenities(roomId.value, selectedAmenities.value)
      if (uploadedFiles.value.length > 0) {
        await store.uploadImages(roomId.value, uploadedFiles.value)
      }
      showToast('อัปเดตห้องสำเร็จ', 'success')
    } else {
      const room = await store.createRoom(payload)
      if (room && selectedAmenities.value.length > 0) {
        await store.updateAmenities(room.id, selectedAmenities.value)
      }
      if (room && uploadedFiles.value.length > 0) {
        await store.uploadImages(room.id, uploadedFiles.value)
      }
      showToast('สร้างห้องสำเร็จ', 'success')
      router.push('/admin/rooms')
      return
    }
  } catch {
    showToast(store.error ?? 'เกิดข้อผิดพลาด', 'error')
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    uploadedFiles.value = [...uploadedFiles.value, ...Array.from(input.files!)]
  }
}

function removeFile(index: number) {
  uploadedFiles.value.splice(index, 1)
}

async function removeImage(imageId: number) {
  try {
    await store.deleteImage(roomId.value, imageId)
    await store.fetchRoomById(roomId.value)
  } catch {
    // handled by store
  }
}

onMounted(async () => {
  await store.fetchAmenities()

  // init picker values from default form values
  pickerOpenTime.value = timeStringToPickerValue(form.value.openTime)
  pickerCloseTime.value = timeStringToPickerValue(form.value.closeTime)

  if (isEdit.value) {
    await store.fetchRoomById(roomId.value)
    const room = store.currentRoom
    if (room) {
      form.value = {
        name: room.name,
        building: room.building ?? '',
        floor: room.floor ?? '',
        capacity: room.capacity,
        description: room.description ?? '',
        status: room.status,
        openTime: room.openTime,
        closeTime: room.closeTime,
        slotDurationMin: room.slotDurationMin,
      }
      pickerOpenTime.value = timeStringToPickerValue(room.openTime)
      pickerCloseTime.value = timeStringToPickerValue(room.closeTime)
      selectedAmenities.value = room.amenities?.map((a) => a.id) ?? []
    }
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <button
        @click="router.back()"
        class="rounded-md p-1 text-gray-600 hover:bg-gray-100"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-xl font-bold text-gray-900">{{ pageTitle }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">ข้อมูลพื้นฐาน</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700">ชื่อห้อง *</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="เช่น ห้องประชุม 1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">อาคาร</label>
            <input
              v-model="form.building"
              type="text"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="เช่น อาคาร A"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">ชั้น</label>
            <input
              v-model="form.floor"
              type="text"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="เช่น 3"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">ความจุ (คน) *</label>
            <input
              v-model.number="form.capacity"
              type="number"
              min="1"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">รายละเอียด</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="คำอธิบายห้องประชุม..."
            />
          </div>
        </div>
      </div>

      <!-- Time Settings -->
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">ตั้งค่าเวลา</h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">เวลาเปิด</label>
            <VueDatePicker
              v-model="pickerOpenTime"
              time-picker
              :minutes-increment="30"
              placeholder="เลือกเวลา"
              class="mt-1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">เวลาปิด</label>
            <VueDatePicker
              v-model="pickerCloseTime"
              time-picker
              :minutes-increment="30"
              placeholder="เลือกเวลา"
              class="mt-1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">ช่วงเวลาต่อ slot (นาที)</label>
            <AppSelect
              v-model="form.slotDurationMin"
              :options="slotDurationOptions"
              class="mt-1 w-full"
            />
          </div>
        </div>
      </div>

      <!-- Status -->
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">สถานะ</h2>
        <AppSelect
          v-model="form.status"
          :options="statusOptions"
          class="w-full sm:w-56"
        />
      </div>

      <!-- Amenities -->
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Amenities</h2>
        <div v-if="store.amenityLoading" class="text-sm text-gray-500">กำลังโหลด...</div>
        <div v-else-if="store.amenities.length === 0" class="text-sm text-gray-400">ยังไม่มี amenity ในระบบ</div>
        <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label
            v-for="amenity in store.amenities"
            :key="amenity.id"
            class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm transition hover:bg-blue-50"
            :class="selectedAmenities.includes(amenity.id) ? 'border-blue-400 bg-blue-50' : ''"
          >
            <input
              type="checkbox"
              :value="amenity.id"
              v-model="selectedAmenities"
              class="h-4 w-4 rounded text-blue-600"
            />
            <span v-if="amenity.icon" class="text-base">{{ amenity.icon }}</span>
            <span class="text-gray-700">{{ amenity.name }}</span>
          </label>
        </div>
      </div>

      <!-- Images (edit mode) -->
      <div v-if="isEdit && store.currentRoom?.images" class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">รูปภาพห้อง</h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="img in store.currentRoom.images"
            :key="img.id"
            class="relative h-32 w-48 overflow-hidden rounded-lg border border-gray-200"
          >
            <img :src="img.imageUrl" :alt="store.currentRoom.name" class="h-full w-full object-cover" />
            <button
              @click="removeImage(img.id)"
              type="button"
              class="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Upload Images -->
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">อัปโหลดรูปภาพ</h2>
        <input
          type="file"
          accept="image/*"
          multiple
          @change="handleFileSelect"
          class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        <div v-if="uploadedFiles.length > 0" class="mt-3 space-y-1">
          <div
            v-for="(file, i) in uploadedFiles"
            :key="i"
            class="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm"
          >
            <span class="text-gray-700">{{ file.name }}</span>
            <button @click="removeFile(i)" type="button" class="text-red-500 hover:text-red-700">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
          :disabled="store.isLoading"
          class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <span v-if="store.isLoading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {{ isEdit ? 'บันทึก' : 'สร้างห้อง' }}
        </button>
      </div>
    </form>
  </div>
</template>
