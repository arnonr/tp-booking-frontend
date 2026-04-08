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

const statsActive = computed(() => store.rooms.filter((r) => r.status === 'active').length)
const statsMaintenance = computed(() => store.rooms.filter((r) => r.status === 'maintenance').length)
const statsInactive = computed(() => store.rooms.filter((r) => r.status === 'inactive').length)

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
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    maintenance: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    inactive: 'bg-red-50 text-red-600 ring-1 ring-red-200',
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
        <p class="mt-1 text-sm text-gray-500">ดูแลและจัดการห้องประชุมทั้งหมดในระบบ</p>
      </div>
      <button
        v-if="activeTab === 'rooms'"
        @click="router.push('/admin/rooms/create')"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        เพิ่มห้องใหม่
      </button>
    </div>

    <!-- Stats Row (rooms tab only) -->
    <div v-if="activeTab === 'rooms'" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ store.rooms.length }}</p>
        <p class="mt-0.5 text-xs text-gray-500">ห้องประชุม</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-emerald-500">พร้อมใช้งาน</p>
        <p class="mt-1 text-2xl font-bold text-emerald-700">{{ statsActive }}</p>
        <p class="mt-0.5 text-xs text-emerald-500">ห้อง</p>
      </div>
      <div class="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-amber-500">ปรับปรุง</p>
        <p class="mt-1 text-2xl font-bold text-amber-700">{{ statsMaintenance }}</p>
        <p class="mt-0.5 text-xs text-amber-500">ห้อง</p>
      </div>
      <div class="rounded-xl border border-red-100 bg-red-50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-red-400">ไม่พร้อมใช้งาน</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ statsInactive }}</p>
        <p class="mt-0.5 text-xs text-red-400">ห้อง</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
      <button
        @click="activeTab = 'rooms'"
        :class="[
          'rounded-lg px-5 py-2 text-sm font-medium transition',
          activeTab === 'rooms'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ]"
      >
        🏢 ห้องประชุม
      </button>
      <button
        @click="activeTab = 'amenities'"
        :class="[
          'rounded-lg px-5 py-2 text-sm font-medium transition',
          activeTab === 'amenities'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ]"
      >
        ✨ Amenities
      </button>
    </div>

    <!-- ── Tab: ห้องประชุม ── -->
    <div v-if="activeTab === 'rooms'" class="space-y-4">
      <!-- Filters Card -->
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end gap-3">
          <div class="min-w-[200px] flex-1">
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">ค้นหา</label>
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
                class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <div class="min-w-[150px]">
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">สถานะ</label>
            <AppSelect v-model="statusFilter" :options="statusOptions" class="w-full" @update:model-value="onSearch" />
          </div>
          <div class="min-w-[150px]">
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">อาคาร</label>
            <AppSelect v-model="buildingFilter" :options="buildingOptions" class="w-full" @update:model-value="onSearch" />
          </div>
          <div class="ml-auto flex items-end pb-0.5">
            <span class="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
              {{ filteredRooms.length === 0 ? 0 : (page - 1) * limit + 1 }}–{{ Math.min(page * limit, filteredRooms.length) }}
              จาก {{ filteredRooms.length }} ห้อง
            </span>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="store.error" class="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {{ store.error }}
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-16 shadow-sm">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        <p class="mt-4 text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredRooms.length === 0" class="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p class="mt-4 font-medium text-gray-600">ไม่พบห้องที่ตรงกับเงื่อนไข</p>
        <p class="mt-1 text-sm text-gray-400">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/70">
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">ชื่อห้อง</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">อาคาร / ชั้น</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">ความจุ</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">เวลา</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Amenities</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">สถานะ</th>
              <th class="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="room in paginatedRooms"
              :key="room.id"
              class="group transition-colors hover:bg-indigo-50/40"
            >
              <td class="px-5 py-4 text-sm font-semibold text-gray-900">{{ room.name }}</td>
              <td class="px-5 py-4 text-sm text-gray-500">
                <span v-if="room.building || room.floor" class="inline-flex items-center gap-1">
                  <span v-if="room.building" class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{{ room.building }}</span>
                  <span v-if="room.floor" class="text-gray-400">ชั้น {{ room.floor }}</span>
                </span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-5 py-4 text-sm text-gray-600">
                <span class="inline-flex items-center gap-1">
                  <svg class="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ room.capacity }} คน
                </span>
              </td>
              <td class="px-5 py-4 text-sm text-gray-500">
                <span class="font-mono text-xs tracking-tight">{{ room.openTime }} – {{ room.closeTime }}</span>
              </td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap gap-1">
                  <template v-if="room.amenities && room.amenities.length > 0">
                    <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100">
                      <span v-if="room.amenities[0].icon">{{ room.amenities[0].icon }}</span>
                      {{ room.amenities[0].name }}
                    </span>
                    <span
                      v-if="room.amenities.length > 1"
                      class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500"
                    >
                      +{{ room.amenities.length - 1 }}
                    </span>
                  </template>
                  <span v-else class="text-xs text-gray-300">—</span>
                </div>
              </td>
              <td class="px-5 py-4">
                <span :class="['inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(room.status)]">
                  {{ statusLabel(room.status) }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <!-- Delete confirm inline -->
                <div v-if="confirmDeleteRoomId === room.id" class="flex items-center justify-end gap-2">
                  <span class="text-xs font-medium text-gray-600">ยืนยันลบ?</span>
                  <button
                    @click="confirmDeleteRoom(room.id)"
                    class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    ลบ
                  </button>
                  <button
                    @click="confirmDeleteRoomId = null"
                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                </div>
                <!-- Action buttons -->
                <div v-else class="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    @click="router.push(`/admin/rooms/${room.id}/edit`)"
                    title="แก้ไข"
                    class="rounded-lg p-2 text-gray-400 transition hover:bg-indigo-100 hover:text-indigo-600"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDeleteRoomId = room.id"
                    title="ลบ"
                    class="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
          class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:opacity-30"
        >
          ‹
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          @click="page = p"
          :class="[
            'rounded-lg border px-3.5 py-2 text-sm font-medium shadow-sm transition',
            p === page
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
          ]"
        >
          {{ p }}
        </button>
        <button
          @click="page++"
          :disabled="page === totalPages"
          class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>

    <!-- ── Tab: Amenities ── -->
    <div v-if="activeTab === 'amenities'" class="grid gap-6 lg:grid-cols-[1fr_340px]">
      <!-- Left: Amenity table -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-gray-800">รายการ Amenity ทั้งหมด</h2>
          <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            {{ store.amenities.length }} รายการ
          </span>
        </div>

        <!-- Message banner -->
        <div
          v-if="amenityMessage"
          :class="[
            'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium',
            amenityMessage.type === 'success'
              ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border border-red-100 bg-red-50 text-red-700',
          ]"
        >
          <span>{{ amenityMessage.type === 'success' ? '✓' : '✕' }}</span>
          {{ amenityMessage.text }}
        </div>

        <!-- Loading -->
        <div v-if="store.amenityLoading" class="flex items-center justify-center rounded-xl border border-gray-100 bg-white py-12 shadow-sm">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        </div>

        <!-- Empty -->
        <div v-else-if="store.amenities.length === 0" class="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">✨</div>
          <p class="mt-4 font-medium text-gray-600">ยังไม่มี Amenity ในระบบ</p>
          <p class="mt-1 text-sm text-gray-400">เพิ่มได้จากฟอร์มด้านขวา</p>
        </div>

        <!-- Amenity Table -->
        <div v-else class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/70">
                <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Icon</th>
                <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">ชื่อ Amenity</th>
                <th class="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="amenity in store.amenities" :key="amenity.id" class="group transition-colors hover:bg-indigo-50/40">
                <td class="px-5 py-4 text-2xl leading-none">{{ amenity.icon ?? '—' }}</td>
                <td class="px-5 py-4 text-sm font-semibold text-gray-900">{{ amenity.name }}</td>
                <td class="px-5 py-4 text-right">
                  <!-- Delete confirm -->
                  <div v-if="confirmDeleteAmenityId === amenity.id" class="flex items-center justify-end gap-2">
                    <span class="text-xs font-medium text-gray-600">ยืนยันลบ?</span>
                    <button
                      @click="confirmDeleteAmenity(amenity.id)"
                      class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      ลบ
                    </button>
                    <button
                      @click="confirmDeleteAmenityId = null"
                      class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                  <!-- Action buttons -->
                  <div v-else class="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      @click="startEditAmenity(amenity)"
                      title="แก้ไข"
                      class="rounded-lg p-2 text-gray-400 transition hover:bg-indigo-100 hover:text-indigo-600"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="confirmDeleteAmenityId = amenity.id"
                      title="ลบ"
                      class="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Inline form -->
      <div class="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" v-if="editingAmenityId === null" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" v-else />
            </svg>
          </div>
          <h2 class="text-base font-bold text-gray-900">
            {{ editingAmenityId !== null ? 'แก้ไข Amenity' : 'เพิ่ม Amenity ใหม่' }}
          </h2>
        </div>

        <div
          v-if="amenityMessage"
          :class="[
            'mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium',
            amenityMessage.type === 'success'
              ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border border-red-100 bg-red-50 text-red-700',
          ]"
        >
          <span>{{ amenityMessage.type === 'success' ? '✓' : '✕' }}</span>
          {{ amenityMessage.text }}
        </div>

        <form @submit.prevent="submitAmenityForm" class="space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">ชื่อ Amenity <span class="text-red-400">*</span></label>
            <input
              v-model="amenityForm.name"
              type="text"
              required
              placeholder="เช่น โปรเจกเตอร์"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Icon <span class="text-gray-300">(emoji)</span></label>
            <div class="relative">
              <input
                v-model="amenityForm.icon"
                type="text"
                placeholder="เช่น 📽️"
                class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <span v-if="amenityForm.icon" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl">
                {{ amenityForm.icon }}
              </span>
            </div>
          </div>
          <div class="flex gap-2 pt-1">
            <button
              type="submit"
              :disabled="store.amenityLoading"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <span v-if="store.amenityLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {{ editingAmenityId !== null ? 'บันทึก' : 'เพิ่ม Amenity' }}
            </button>
            <button
              v-if="editingAmenityId !== null"
              type="button"
              @click="cancelAmenityForm"
              class="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
