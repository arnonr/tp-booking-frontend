<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppSelect from '@/components/common/AppSelect.vue'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'
import type { Room } from '@/types'

const router = useRouter()
const store = useRoomStore()

// ── Tabs ──────────────────────────────────────────────────────────
const activeTab = ref<'rooms' | 'amenities'>('rooms')

// ── Tab: ห้องประชุม ───────────────────────────────────────────────
const search = ref('')
const statusFilter = ref('')
const buildingFilter = ref('')
const page = ref(1)
const limit = 10

const statusOptions = [
  { label: 'ทุกสถานะ', value: '' },
  { label: 'พร้อมใช้งาน', value: 'active' },
  { label: 'ปรับปรุง', value: 'maintenance' },
  { label: 'ไม่พร้อมใช้งาน', value: 'inactive' },
]

const buildingOptions = computed(() => {
  const set = new Set<string>()
  for (const r of store.rooms) {
    if (r.building) set.add(r.building)
  }
  return [
    { label: 'ทุกอาคาร', value: '' },
    ...Array.from(set)
      .sort()
      .map((b) => ({ label: b, value: b })),
  ]
})

const filteredRooms = computed(() => {
  return store.rooms.filter((room) => {
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!room.name.toLowerCase().includes(q)) return false
    }
    if (statusFilter.value && room.status !== statusFilter.value) return false
    if (buildingFilter.value && room.building !== buildingFilter.value) return false
    return true
  })
})

const paginatedRooms = computed(() => {
  const start = (page.value - 1) * limit
  return filteredRooms.value.slice(start, start + limit)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRooms.value.length / limit)))

function onSearch() {
  page.value = 1
}

function statusLabel(status: Room['status']) {
  const map: Record<Room['status'], string> = {
    active: 'พร้อมใช้งาน',
    maintenance: 'ปรับปรุง',
    inactive: 'ไม่พร้อมใช้งาน',
  }
  return map[status]
}

function statusClass(status: Room['status']) {
  const map: Record<Room['status'], string> = {
    active: 'bg-green-100 text-green-700',
    maintenance: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-red-100 text-red-700',
  }
  return map[status]
}

// inline delete confirm per room id
const confirmDeleteRoomId = ref<number | null>(null)

async function confirmDeleteRoom(id: number) {
  try {
    await store.deleteRoom(id)
    confirmDeleteRoomId.value = null
    await store.fetchAllRooms()
  } catch {
    // error shown via store.error
  }
}

// ── Tab: Amenities ───────────────────────────────────────────────
const amenityForm = ref({ name: '', icon: '' })
const editingAmenityId = ref<number | null>(null)
const amenityMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const confirmDeleteAmenityId = ref<number | null>(null)

function startEditAmenity(a: { id: number; name: string; icon: string | null }) {
  editingAmenityId.value = a.id
  amenityForm.value = { name: a.name, icon: a.icon ?? '' }
  amenityMessage.value = null
}

function cancelAmenityForm() {
  editingAmenityId.value = null
  amenityForm.value = { name: '', icon: '' }
  amenityMessage.value = null
}

async function submitAmenityForm() {
  amenityMessage.value = null
  const payload = {
    name: amenityForm.value.name.trim(),
    icon: amenityForm.value.icon.trim() || undefined,
  }
  if (!payload.name) {
    amenityMessage.value = { type: 'error', text: 'กรุณาระบุชื่อ amenity' }
    return
  }
  try {
    if (editingAmenityId.value !== null) {
      await store.updateAmenity(editingAmenityId.value, payload)
      amenityMessage.value = { type: 'success', text: 'อัปเดต amenity สำเร็จ' }
    } else {
      await store.createAmenity(payload)
      amenityMessage.value = { type: 'success', text: 'เพิ่ม amenity สำเร็จ' }
    }
    cancelAmenityForm()
    amenityMessage.value = { type: 'success', text: editingAmenityId.value !== null ? 'อัปเดตสำเร็จ' : 'เพิ่มสำเร็จ' }
  } catch {
    amenityMessage.value = { type: 'error', text: store.error ?? 'เกิดข้อผิดพลาด' }
  }
}

async function confirmDeleteAmenity(id: number) {
  try {
    await store.deleteAmenity(id)
    confirmDeleteAmenityId.value = null
    amenityMessage.value = { type: 'success', text: 'ลบ amenity สำเร็จ' }
  } catch {
    amenityMessage.value = { type: 'error', text: store.error ?? 'ลบไม่สำเร็จ' }
    confirmDeleteAmenityId.value = null
  }
}

// ── Init ──────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([store.fetchAllRooms(), store.fetchAmenities()])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">จัดการห้องประชุม</h1>
        <p class="mt-1 text-sm text-gray-500">รวม {{ store.rooms.length }} ห้อง</p>
      </div>
      <button
        v-if="activeTab === 'rooms'"
        @click="router.push('/admin/rooms/create')"
        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        เพิ่มห้องใหม่
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          @click="activeTab = 'rooms'"
          :class="[
            'border-b-2 pb-3 text-sm font-medium transition',
            activeTab === 'rooms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
        >
          ห้องประชุม
        </button>
        <button
          @click="activeTab = 'amenities'"
          :class="[
            'border-b-2 pb-3 text-sm font-medium transition',
            activeTab === 'amenities'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
        >
          Amenities
        </button>
      </nav>
    </div>

    <!-- ── Tab: ห้องประชุม ── -->
    <div v-if="activeTab === 'rooms'" class="space-y-4">
      <!-- Filters -->
      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-[200px] flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700">ค้นหา</label>
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="ชื่อห้อง..."
              @input="onSearch"
              class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div class="min-w-[150px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">สถานะ</label>
          <AppSelect v-model="statusFilter" :options="statusOptions" class="w-full" @update:model-value="onSearch" />
        </div>
        <div class="min-w-[150px]">
          <label class="mb-1 block text-sm font-medium text-gray-700">อาคาร</label>
          <AppSelect v-model="buildingFilter" :options="buildingOptions" class="w-full" @update:model-value="onSearch" />
        </div>
        <div class="ml-auto flex items-end pb-0.5 text-sm text-gray-500">
          แสดง {{ filteredRooms.length === 0 ? 0 : (page - 1) * limit + 1 }}–{{ Math.min(page * limit, filteredRooms.length) }}
          จาก {{ filteredRooms.length }} ห้อง
        </div>
      </div>

      <!-- Error -->
      <div v-if="store.error" class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ store.error }}
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredRooms.length === 0" class="py-16 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="mt-3 text-gray-500">ไม่พบห้องที่ตรงกับเงื่อนไข</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">ชื่อห้อง</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">อาคาร/ชั้น</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">ความจุ</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">เวลา</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Amenities</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">สถานะ</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="room in paginatedRooms" :key="room.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ room.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ [room.building, room.floor].filter(Boolean).join(' / ') || '—' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ room.capacity }} คน</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ room.openTime }} – {{ room.closeTime }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <template v-if="room.amenities && room.amenities.length > 0">
                    <span
                      class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                    >
                      <span v-if="room.amenities[0].icon">{{ room.amenities[0].icon }}</span>
                      {{ room.amenities[0].name }}
                    </span>
                    <span
                      v-if="room.amenities.length > 1"
                      class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                    >
                      +{{ room.amenities.length - 1 }}
                    </span>
                  </template>
                  <span v-else class="text-xs text-gray-400">—</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusClass(room.status)]">
                  {{ statusLabel(room.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div v-if="confirmDeleteRoomId === room.id" class="flex items-center justify-end gap-2">
                  <span class="text-xs text-gray-600">ยืนยันลบ?</span>
                  <button
                    @click="confirmDeleteRoom(room.id)"
                    class="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    ลบ
                  </button>
                  <button
                    @click="confirmDeleteRoomId = null"
                    class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                </div>
                <div v-else class="flex items-center justify-end gap-3">
                  <button
                    @click="router.push(`/admin/rooms/${room.id}/edit`)"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    แก้ไข
                  </button>
                  <button
                    @click="confirmDeleteRoomId = room.id"
                    class="text-sm text-red-600 hover:text-red-800"
                  >
                    ลบ
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-1">
        <button
          @click="page--"
          :disabled="page === 1"
          class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ‹
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          @click="page = p"
          :class="[
            'rounded-md border px-3 py-1.5 text-sm',
            p === page
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50',
          ]"
        >
          {{ p }}
        </button>
        <button
          @click="page++"
          :disabled="page === totalPages"
          class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>

    <!-- ── Tab: Amenities ── -->
    <div v-if="activeTab === 'amenities'" class="grid gap-6 lg:grid-cols-[1fr_340px]">
      <!-- Left: Amenity table -->
      <div class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900">รายการ Amenity ทั้งหมด</h2>

        <!-- Error/success from delete -->
        <div
          v-if="amenityMessage"
          :class="[
            'rounded-lg px-4 py-3 text-sm',
            amenityMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
          ]"
        >
          {{ amenityMessage.text }}
        </div>

        <div v-if="store.amenityLoading" class="py-8 text-center text-gray-500">กำลังโหลด...</div>
        <div v-else-if="store.amenities.length === 0" class="py-12 text-center">
          <p class="text-gray-400">ยังไม่มี amenity ในระบบ</p>
          <p class="mt-1 text-sm text-gray-400">เพิ่มได้จากฟอร์มด้านขวา</p>
        </div>
        <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">ชื่อ</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Icon</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-for="amenity in store.amenities" :key="amenity.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ amenity.name }}</td>
                <td class="px-4 py-3 text-lg">{{ amenity.icon ?? '—' }}</td>
                <td class="px-4 py-3 text-right">
                  <div v-if="confirmDeleteAmenityId === amenity.id" class="flex items-center justify-end gap-2">
                    <span class="text-xs text-gray-600">ยืนยันลบ?</span>
                    <button
                      @click="confirmDeleteAmenity(amenity.id)"
                      class="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      ลบ
                    </button>
                    <button
                      @click="confirmDeleteAmenityId = null"
                      class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                  <div v-else class="flex items-center justify-end gap-3">
                    <button
                      @click="startEditAmenity(amenity)"
                      class="text-sm text-blue-600 hover:text-blue-800"
                    >
                      แก้ไข
                    </button>
                    <button
                      @click="confirmDeleteAmenityId = amenity.id"
                      class="text-sm text-red-600 hover:text-red-800"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Inline form -->
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="mb-4 text-base font-semibold text-gray-900">
          {{ editingAmenityId !== null ? 'แก้ไข Amenity' : 'เพิ่ม Amenity ใหม่' }}
        </h2>

        <div
          v-if="amenityMessage"
          :class="[
            'mb-4 rounded-lg px-4 py-3 text-sm',
            amenityMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
          ]"
        >
          {{ amenityMessage.text }}
        </div>

        <form @submit.prevent="submitAmenityForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">ชื่อ Amenity *</label>
            <input
              v-model="amenityForm.name"
              type="text"
              required
              placeholder="เช่น โปรเจกเตอร์"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Icon (emoji หรือ text)</label>
            <input
              v-model="amenityForm.icon"
              type="text"
              placeholder="เช่น 📽️"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-2 pt-1">
            <button
              type="submit"
              :disabled="store.amenityLoading"
              class="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <span v-if="store.amenityLoading" class="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {{ editingAmenityId !== null ? 'บันทึก' : 'เพิ่ม' }}
            </button>
            <button
              v-if="editingAmenityId !== null"
              type="button"
              @click="cancelAmenityForm"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
