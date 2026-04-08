<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApprovalStore, type ApprovalTab } from '@/modules/approval/stores/approvalStore'
import type { Booking } from '@/types'

const store = useApprovalStore()

// ── Tabs config ────────────────────────────────────────────
const TABS: { key: ApprovalTab; label: string; badgeClass: string }[] = [
  { key: 'pending',   label: 'รออนุมัติ',   badgeClass: 'bg-red-500 text-white' },
  { key: 'approved',  label: 'อนุมัติแล้ว', badgeClass: 'bg-sky-100 text-sky-700' },
  { key: 'rejected',  label: 'ปฏิเสธ',      badgeClass: 'bg-red-100 text-red-700' },
  { key: 'cancelled', label: 'ยกเลิก',      badgeClass: 'bg-yellow-100 text-yellow-700' },
  { key: 'completed', label: 'สำเร็จ',      badgeClass: 'bg-green-100 text-green-700' },
]

// ── Selection (pending tab only) ───────────────────────────
const selectedIds = ref<number[]>([])

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function toggleSelectAll() {
  if (selectedIds.value.length === filtered.value.length) selectedIds.value = []
  else selectedIds.value = filtered.value.map((b) => b.id)
}

// ── Search (client-side) ────────────────────────────────────
const searchQuery = ref('')

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return store.bookingsList
  const q = searchQuery.value.toLowerCase()
  return store.bookingsList.filter(
    (b) =>
      (b.user?.fullName ?? '').toLowerCase().includes(q) ||
      (b.room?.name ?? '').toLowerCase().includes(q) ||
      (b.purpose ?? '').toLowerCase().includes(q),
  )
})

// ── Urgency ────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

function rowUrgencyClass(dateStr: string): string {
  if (dateStr === today) return 'border-l-4 border-l-red-400 bg-red-50/40'
  if (dateStr === tomorrow) return 'border-l-4 border-l-amber-400 bg-amber-50/30'
  return ''
}

function urgencyBadge(dateStr: string): { label: string; cls: string } | null {
  if (dateStr === today) return { label: 'วันนี้', cls: 'bg-red-100 text-red-700' }
  if (dateStr === tomorrow) return { label: 'พรุ่งนี้', cls: 'bg-amber-100 text-amber-700' }
  return null
}

// ── Modals ─────────────────────────────────────────────────
const rejectRemark = ref<Record<number, string>>({})
const showRejectModal = ref<number | null>(null)
const showBulkRejectModal = ref(false)
const bulkRemark = ref('')

// Edit modal
const showEditModal = ref(false)
const editTarget = ref<Booking | null>(null)
const editForm = ref({
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  attendeeCount: 1,
  additionalRequirements: '',
})

function openEdit(booking: Booking) {
  editTarget.value = booking
  editForm.value = {
    bookingDate: booking.bookingDate,
    startTime: booking.startTime.slice(0, 5),
    endTime: booking.endTime.slice(0, 5),
    purpose: booking.purpose,
    attendeeCount: booking.attendeeCount,
    additionalRequirements: booking.additionalRequirements ?? '',
  }
  showEditModal.value = true
}

// ── Toast ──────────────────────────────────────────────────
const toast = ref<{ type: 'success' | 'error'; text: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(type: 'success' | 'error', text: string) {
  toast.value = { type, text }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3500)
}

// ── Actions ────────────────────────────────────────────────
async function handleApprove(id: number) {
  try {
    await store.approve(id)
    selectedIds.value = selectedIds.value.filter((s) => s !== id)
    showToast('success', 'อนุมัติสำเร็จ')
  } catch { showToast('error', store.error ?? 'อนุมัติไม่สำเร็จ') }
}

async function handleReject(id: number) {
  try {
    await store.reject(id, rejectRemark.value[id] ?? '')
    showRejectModal.value = null
    delete rejectRemark.value[id]
    selectedIds.value = selectedIds.value.filter((s) => s !== id)
    showToast('success', 'ปฏิเสธสำเร็จ')
  } catch { showToast('error', store.error ?? 'ปฏิเสธไม่สำเร็จ') }
}

async function handleBulkApprove() {
  const count = selectedIds.value.length
  try {
    await store.bulkAction([...selectedIds.value], 'approve')
    selectedIds.value = []
    showToast('success', `อนุมัติ ${count} รายการสำเร็จ`)
  } catch { showToast('error', store.error ?? 'ดำเนินการไม่สำเร็จ') }
}

async function handleBulkReject() {
  const count = selectedIds.value.length
  try {
    await store.bulkAction([...selectedIds.value], 'reject', bulkRemark.value)
    selectedIds.value = []
    showBulkRejectModal.value = false
    bulkRemark.value = ''
    showToast('success', `ปฏิเสธ ${count} รายการสำเร็จ`)
  } catch { showToast('error', store.error ?? 'ดำเนินการไม่สำเร็จ') }
}

async function handleCancel(id: number) {
  if (!confirm('ยืนยันการยกเลิกการจองนี้?')) return
  try {
    await store.cancelBooking(id)
    showToast('success', 'ยกเลิกการจองสำเร็จ')
  } catch { showToast('error', store.error ?? 'ยกเลิกไม่สำเร็จ') }
}

async function handleEditSave() {
  if (!editTarget.value) return
  try {
    await store.adminUpdateBooking(editTarget.value.id, {
      bookingDate: editForm.value.bookingDate,
      startTime: editForm.value.startTime,
      endTime: editForm.value.endTime,
      purpose: editForm.value.purpose,
      attendeeCount: Number(editForm.value.attendeeCount),
      additionalRequirements: editForm.value.additionalRequirements || undefined,
    })
    showEditModal.value = false
    editTarget.value = null
    showToast('success', 'แก้ไขการจองสำเร็จ')
  } catch { showToast('error', store.error ?? 'แก้ไขไม่สำเร็จ') }
}

// ── Tab / page navigation ──────────────────────────────────
function switchTab(tab: ApprovalTab) {
  selectedIds.value = []
  searchQuery.value = ''
  store.fetchByStatus(tab, 1)
}

function goToPage(page: number) {
  store.fetchByStatus(store.activeTab, page)
}

// ── Date/Time helpers ──────────────────────────────────────
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const by = (d.getFullYear() + 543).toString().slice(-2)
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${by}`
}

function formatTime(t: string): string {
  return t ? t.slice(0, 5) : ''
}

// ── Pagination helpers ─────────────────────────────────────
const totalPages = computed(() =>
  Math.ceil(store.pagination.total / store.pagination.limit) || 1,
)

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = store.pagination.page
  const pages: (number | '...')[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

// ── Init ───────────────────────────────────────────────────
watch(searchQuery, () => { selectedIds.value = [] })

onMounted(() => {
  store.fetchTabCounts()
  store.fetchByStatus('pending', 1)
})
</script>

<template>
  <div class="space-y-5">

    <!-- ── Header ── -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">การจัดการการจอง</h1>
        <p class="mt-0.5 text-sm text-gray-500">
          รออนุมัติ
          <span class="font-semibold text-red-600">{{ store.tabCounts.pending }}</span> รายการ
        </p>
      </div>
      <button
        @click="store.fetchByStatus(store.activeTab, store.pagination.page); store.fetchTabCounts()"
        :disabled="store.isLoading"
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
      >
        <svg class="h-4 w-4" :class="{ 'animate-spin': store.isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        รีเฟรช
      </button>
    </div>

    <!-- ── Tab bar ── -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex overflow-x-auto">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          @click="switchTab(tab.key)"
          :class="[
            'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            store.activeTab === tab.key
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
        >
          {{ tab.label }}
          <span
            :class="[
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              store.activeTab === tab.key ? tab.badgeClass : 'bg-gray-100 text-gray-500',
            ]"
          >
            {{ store.tabCounts[tab.key] }}
          </span>
        </button>
      </nav>
    </div>

    <!-- ── Search + Bulk action bar ── -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาชื่อผู้จอง, ห้อง, วัตถุประสงค์..."
          class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="selectedIds.length > 0 && store.activeTab === 'pending'" class="flex items-center gap-2">
          <span class="text-sm text-gray-600">เลือก {{ selectedIds.length }} รายการ</span>
          <button @click="handleBulkApprove"
            class="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
            อนุมัติทั้งหมด
          </button>
          <button @click="showBulkRejectModal = true"
            class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            ปฏิเสธทั้งหมด
          </button>
          <button @click="selectedIds = []"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
        </div>
      </Transition>
    </div>

    <!-- ── Loading skeleton ── -->
    <div v-if="store.isLoading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-xl bg-gray-100" />
    </div>

    <!-- ── Empty ── -->
    <div v-else-if="store.bookingsList.length === 0" class="flex flex-col items-center py-20 text-center">
      <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-lg font-semibold text-gray-600">ไม่มีรายการในสถานะนี้</p>
    </div>

    <!-- ── No search results ── -->
    <div v-else-if="filtered.length === 0" class="py-12 text-center text-gray-500">
      ไม่พบรายการที่ตรงกับการค้นหา
      <button @click="searchQuery = ''" class="ml-2 text-indigo-600 hover:underline">ล้าง</button>
    </div>

    <!-- ── Table + Pagination ── -->
    <template v-else>
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr class="bg-gray-50">
              <th v-if="store.activeTab === 'pending'" class="px-4 py-3 text-left">
                <input type="checkbox"
                  :checked="selectedIds.length === filtered.length && filtered.length > 0"
                  @change="toggleSelectAll"
                  class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ผู้จอง</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ห้อง / วันเวลา</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">วัตถุประสงค์</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">คน</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="booking in filtered"
              :key="booking.id"
              :class="[
                'transition-colors hover:bg-gray-50',
                store.activeTab === 'pending' ? rowUrgencyClass(booking.bookingDate) : '',
                selectedIds.includes(booking.id) ? 'bg-indigo-50/50' : '',
              ]"
            >
              <!-- Checkbox (pending only) -->
              <td v-if="store.activeTab === 'pending'" class="px-4 py-3">
                <input type="checkbox"
                  :checked="selectedIds.includes(booking.id)"
                  @change="toggleSelect(booking.id)"
                  class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              </td>

              <!-- Booker -->
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900">
                  {{ booking.user?.fullName ?? `User #${booking.userId}` }}
                </p>
                <p class="text-xs text-gray-400">{{ booking.user?.department ?? '-' }}</p>
              </td>

              <!-- Room / DateTime -->
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900">
                  {{ booking.room?.name ?? `ห้อง #${booking.roomId}` }}
                  <span v-if="booking.room?.building" class="font-normal text-gray-500">
                    · {{ booking.room.building }}<template v-if="booking.room.floor"> ชั้น {{ booking.room.floor }}</template>
                  </span>
                </p>
                <div class="mt-0.5 flex items-center gap-1.5">
                  <span class="text-xs text-gray-500">
                    {{ formatDate(booking.bookingDate) }} {{ formatTime(booking.startTime) }}–{{ formatTime(booking.endTime) }} น.
                  </span>
                  <span
                    v-if="store.activeTab === 'pending' && urgencyBadge(booking.bookingDate)"
                    :class="['rounded-full px-1.5 py-0.5 text-xs font-semibold', urgencyBadge(booking.bookingDate)!.cls]"
                  >
                    {{ urgencyBadge(booking.bookingDate)!.label }}
                  </span>
                </div>
              </td>

              <!-- Purpose -->
              <td class="max-w-[160px] px-4 py-3">
                <p class="truncate text-sm text-gray-700">{{ booking.purpose }}</p>
                <p v-if="booking.adminRemark && store.activeTab === 'rejected'"
                  class="mt-0.5 truncate text-xs text-red-500">
                  หมายเหตุ: {{ booking.adminRemark }}
                </p>
              </td>

              <!-- Attendee count -->
              <td class="px-4 py-3 text-center text-sm text-gray-600">{{ booking.attendeeCount }}</td>

              <!-- Actions -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- pending: approve + reject -->
                  <template v-if="store.activeTab === 'pending'">
                    <button @click="handleApprove(booking.id)"
                      class="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200 hover:bg-green-100">
                      ✓ อนุมัติ
                    </button>
                    <button @click="showRejectModal = booking.id"
                      class="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
                      ✕ ปฏิเสธ
                    </button>
                  </template>

                  <!-- edit (pending / approved / rejected) -->
                  <button
                    v-if="['pending', 'approved', 'rejected'].includes(store.activeTab)"
                    @click="openEdit(booking)"
                    class="rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
                  >
                    ✎ แก้ไข
                  </button>

                  <!-- cancel (approved only) -->
                  <button
                    v-if="store.activeTab === 'approved'"
                    @click="handleCancel(booking.id)"
                    class="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                  >
                    ยกเลิก
                  </button>

                  <!-- view detail -->
                  <router-link
                    :to="`/bookings/${booking.id}`"
                    class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="ดูรายละเอียด"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination footer -->
        <div class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p class="text-xs text-gray-500">
            แสดง {{ Math.min((store.pagination.page - 1) * store.pagination.limit + 1, store.pagination.total) }}–{{ Math.min(store.pagination.page * store.pagination.limit, store.pagination.total) }}
            จาก {{ store.pagination.total }} รายการ
          </p>
          <div class="flex items-center gap-1">
            <button
              @click="goToPage(store.pagination.page - 1)"
              :disabled="store.pagination.page <= 1"
              class="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >‹</button>
            <template v-for="p in pageNumbers" :key="p">
              <span v-if="p === '...'" class="px-1 text-xs text-gray-400">...</span>
              <button
                v-else
                @click="goToPage(p as number)"
                :class="[
                  'rounded-md border px-2.5 py-1 text-xs',
                  store.pagination.page === p
                    ? 'border-indigo-600 bg-indigo-600 font-semibold text-white'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100',
                ]"
              >{{ p }}</button>
            </template>
            <button
              @click="goToPage(store.pagination.page + 1)"
              :disabled="store.pagination.page >= totalPages"
              class="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >›</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Reject Modal (single) ── -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0">
        <div v-if="showRejectModal !== null"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          @click.self="showRejectModal = null">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 class="text-base font-semibold text-gray-900">ปฏิเสธการจอง #{{ showRejectModal }}</h3>
            <textarea v-model="rejectRemark[showRejectModal!]" rows="3"
              class="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
              placeholder="ระบุเหตุผล (ไม่บังคับ)..." />
            <div class="mt-4 flex justify-end gap-2">
              <button @click="showRejectModal = null"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button @click="handleReject(showRejectModal!)"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Bulk Reject Modal ── -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0">
        <div v-if="showBulkRejectModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          @click.self="showBulkRejectModal = false">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 class="text-base font-semibold text-gray-900">ปฏิเสธ {{ selectedIds.length }} รายการ</h3>
            <textarea v-model="bulkRemark" rows="3"
              class="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
              placeholder="ระบุเหตุผล (ไม่บังคับ)..." />
            <div class="mt-4 flex justify-end gap-2">
              <button @click="showBulkRejectModal = false"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button @click="handleBulkReject"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                ยืนยันปฏิเสธทั้งหมด
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Edit Modal ── -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0">
        <div v-if="showEditModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          @click.self="showEditModal = false">
          <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 class="mb-4 text-base font-semibold text-gray-900">
              แก้ไขการจอง #{{ editTarget?.id }}
              <span class="ml-2 text-xs font-normal text-gray-400">(สถานะไม่เปลี่ยน)</span>
            </h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-600">วันที่จอง</label>
                <input v-model="editForm.bookingDate" type="date"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600">เวลาเริ่ม</label>
                  <input v-model="editForm.startTime" type="time"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600">เวลาสิ้นสุด</label>
                  <input v-model="editForm.endTime" type="time"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600">วัตถุประสงค์</label>
                <input v-model="editForm.purpose" type="text"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600">จำนวนผู้เข้าร่วม</label>
                <input v-model="editForm.attendeeCount" type="number" min="1"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600">ความต้องการเพิ่มเติม</label>
                <textarea v-model="editForm.additionalRequirements" rows="2"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="ระบุหากมี..." />
              </div>
            </div>
            <div class="mt-5 flex justify-end gap-2">
              <button @click="showEditModal = false"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button @click="handleEditSave"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Toast ── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-4 opacity-0"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="translate-y-4 opacity-0"
      >
        <div v-if="toast"
          :class="[
            'fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl',
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
          ]">
          <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="toast.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm font-medium">{{ toast.text }}</span>
          <button @click="toast = null" class="ml-1 opacity-70 hover:opacity-100">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
