<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BookingFormModal from '@/modules/booking/components/BookingFormModal.vue'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'
import { useAuthStore } from '@/modules/auth/stores/authStore'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const authStore = useAuthStore()

const roomId = computed(() => Number(route.params.id))
const selectedDate = ref(new Date().toISOString().split('T')[0])
const activeImageIndex = ref(0)

const room = computed(() => roomStore.currentRoom)

const isLoggedIn = computed(() => !!authStore.user)

const dayNames: Record<string, string> = {
  mon: 'จันทร์', tue: 'อังคาร', wed: 'พุธ', thu: 'พฤหัสบดี',
  fri: 'ศุกร์', sat: 'เสาร์', sun: 'อาทิตย์',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear}`
}

const showBookingModal = ref(false)

function bookThisRoom() {
  showBookingModal.value = true
}

onMounted(() => {
  roomStore.fetchRoomById(roomId.value)
})
</script>

<template>
  <AppLayout>
    <div v-if="roomStore.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <div v-else-if="!room" class="py-16 text-center text-gray-500">
      <p class="text-lg">ไม่พบห้องประชุม</p>
      <router-link to="/" class="mt-4 inline-block text-blue-600 hover:underline">
        กลับหน้าแรก
      </router-link>
    </div>

    <div v-else class="space-y-6">
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

      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Left: Images + Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Image Gallery -->
          <div class="overflow-hidden rounded-xl bg-gray-100">
            <div class="relative h-72 sm:h-96">
              <img
                v-if="room.images && room.images.length > 0"
                :src="room.images[activeImageIndex]?.imageUrl"
                :alt="room.name"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full items-center justify-center text-gray-400">
                <svg class="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <!-- Thumbnails -->
            <div
              v-if="room.images && room.images.length > 1"
              class="flex gap-2 p-3"
            >
              <button
                v-for="(img, i) in room.images"
                :key="img.id"
                @click="activeImageIndex = i"
                :class="[
                  'h-16 w-24 overflow-hidden rounded-md border-2 transition',
                  i === activeImageIndex ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100',
                ]"
              >
                <img :src="img.imageUrl" :alt="room.name" class="h-full w-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Info Card -->
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <h1 class="text-2xl font-bold text-gray-900">{{ room.name }}</h1>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ [room.building, room.floor].filter(Boolean).join(' ') || '-' }}
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                รองรับ {{ room.capacity }} คน
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ room.openTime }} - {{ room.closeTime }}
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                ช่วงละ {{ room.slotDurationMin }} นาที
              </div>
            </div>

            <div v-if="room.description" class="mt-4 border-t border-gray-100 pt-4">
              <h3 class="text-sm font-medium text-gray-900">รายละเอียด</h3>
              <p class="mt-1 text-sm text-gray-600 whitespace-pre-line">{{ room.description }}</p>
            </div>

            <!-- Amenities -->
            <div v-if="room.amenities && room.amenities.length > 0" class="mt-4 border-t border-gray-100 pt-4">
              <h3 class="text-sm font-medium text-gray-900">สิ่งอำนวยความสะดวก</h3>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="a in room.amenities"
                  :key="a.id"
                  class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                >
                  {{ a.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar: Availability -->
        <div class="space-y-4">
          <div class="rounded-xl border border-gray-200 bg-white p-6">
            <h2 class="text-lg font-semibold text-gray-900">ตรวจสอบช่วงเวลาว่าง</h2>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700">เลือกวันที่</label>
              <input
                v-model="selectedDate"
                type="date"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                @change="roomStore.fetchAvailability(roomId, selectedDate)"
              />
            </div>

            <!-- Availability Slots -->
            <div class="mt-4 space-y-2">
              <div
                v-for="slot in roomStore.availability"
                :key="slot.startTime"
                :class="[
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                  slot.isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
                ]"
              >
                <span>{{ slot.startTime }} - {{ slot.endTime }}</span>
                <span class="text-xs font-medium">
                  {{ slot.isAvailable ? 'ว่าง' : 'ไม่ว่าง' }}
                </span>
              </div>
              <p
                v-if="roomStore.availability.length === 0 && !roomStore.isLoading"
                class="py-4 text-center text-sm text-gray-400"
              >
                เลือกวันที่เพื่อดูช่วงเวลา
              </p>
            </div>

            <!-- Book Button -->
            <button
              v-if="isLoggedIn && room.status === 'active'"
              @click="bookThisRoom"
              class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              จองห้องนี้
            </button>
            <button
              v-else-if="!isLoggedIn && room.status === 'active'"
              @click="router.push('/api/auth/sso/redirect')"
              class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              เข้าสู่ระบบเพื่อจองห้องนี้
            </button>
            <p v-else-if="room.status !== 'active'" class="mt-4 text-center text-sm text-red-500">
              ห้องนี้ไม่พร้อมให้บริการ
            </p>
          </div>
        </div>
      </div>
    </div>

    <BookingFormModal
      :show="showBookingModal"
      :default-room-id="roomId"
      :default-date="selectedDate"
      @close="showBookingModal = false"
      @done="showBookingModal = false"
    />
  </AppLayout>
</template>
