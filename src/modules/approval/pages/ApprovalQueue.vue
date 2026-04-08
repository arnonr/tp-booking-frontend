<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useApprovalStore } from '@/modules/approval/stores/approvalStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useApprovalStore()

const selectedIds = ref<number[]>([])
const rejectRemark = ref<Record<number, string>>({})
const showRejectModal = ref<number | null>(null)
const showBulkRejectModal = ref(false)
const bulkRemark = ref('')
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear}`
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === store.pendingBookings.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = store.pendingBookings.map((b) => b.id)
  }
}

async function handleApprove(id: number) {
  try {
    await store.approve(id)
    selectedIds.value = selectedIds.value.filter((sid) => sid !== id)
    message.value = { type: 'success', text: 'อนุมัติสำเร็จ' }
  } catch {
    message.value = { type: 'error', text: store.error ?? 'อนุมัติไม่สำเร็จ' }
  }
}

async function handleReject(id: number) {
  const remark = rejectRemark.value[id] ?? ''
  try {
    await store.reject(id, remark)
    showRejectModal.value = null
    selectedIds.value = selectedIds.value.filter((sid) => sid !== id)
    message.value = { type: 'success', text: 'ปฏิเสธสำเร็จ' }
  } catch {
    message.value = { type: 'error', text: store.error ?? 'ปฏิเสธไม่สำเร็จ' }
  }
}

async function handleBulkApprove() {
  if (selectedIds.value.length === 0) return
  try {
    await store.bulkAction(selectedIds.value, 'approve')
    selectedIds.value = []
    message.value = { type: 'success', text: 'อนุมัติหลายรายการสำเร็จ' }
  } catch {
    message.value = { type: 'error', text: store.error ?? 'อนุมัติไม่สำเร็จ' }
  }
}

async function handleBulkReject() {
  if (selectedIds.value.length === 0) return
  try {
    await store.bulkAction(selectedIds.value, 'reject', bulkRemark.value)
    selectedIds.value = []
    showBulkRejectModal.value = false
    bulkRemark.value = ''
    message.value = { type: 'success', text: 'ปฏิเสธหลายรายการสำเร็จ' }
  } catch {
    message.value = { type: 'error', text: store.error ?? 'ปฏิเสธไม่สำเร็จ' }
  }
}

onMounted(() => {
  store.fetchPending()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">คิวอนุมัติการจอง</h1>
        <p class="mt-1 text-sm text-gray-500">
          รออนุมัติ {{ store.pendingBookings.length }} รายการ
        </p>
      </div>
      <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
        <button
          @click="handleBulkApprove"
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          อนุมัติ ({{ selectedIds.length }})
        </button>
        <button
          @click="showBulkRejectModal = true"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          ปฏิเสธ ({{ selectedIds.length }})
        </button>
      </div>
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

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <!-- Empty -->
    <div v-else-if="store.pendingBookings.length === 0" class="py-16 text-center">
      <svg class="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-lg font-medium text-gray-500">ไม่มีรายการรออนุมัติ</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">
              <input
                type="checkbox"
                :checked="selectedIds.length === store.pendingBookings.length && store.pendingBookings.length > 0"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ผู้จอง</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ห้อง</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">วัน/เวลา</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">วัตถุประสงค์</th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">จัดการ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="booking in store.pendingBookings" :key="booking.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.includes(booking.id)"
                @change="toggleSelect(booking.id)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
            <td class="px-4 py-3 text-sm">
              <p class="font-medium text-gray-900">{{ booking.user?.fullName ?? `User #${booking.userId}` }}</p>
              <p class="text-xs text-gray-500">{{ booking.user?.department }}</p>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
              {{ booking.room?.name ?? `Room #${booking.roomId}` }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              <p>{{ formatDate(booking.bookingDate) }}</p>
              <p class="text-xs">{{ booking.startTime }} - {{ booking.endTime }}</p>
            </td>
            <td class="max-w-xs truncate px-4 py-3 text-sm text-gray-600">
              {{ booking.purpose }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="handleApprove(booking.id)"
                  class="rounded-md bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  อนุมัติ
                </button>
                <button
                  @click="showRejectModal = booking.id"
                  class="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  ปฏิเสธ
                </button>
                <router-link
                  :to="`/bookings/${booking.id}`"
                  class="rounded-md bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  ดู
                </router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reject Modal (single) -->
    <div
      v-if="showRejectModal !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showRejectModal = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900">ปฏิเสธการจอง #{{ showRejectModal }}</h3>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700">หมายเหตุ</label>
          <textarea
            v-model="rejectRemark[showRejectModal]"
            rows="3"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="ระบุเหตุผล..."
          />
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="showRejectModal = null"
            class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            @click="handleReject(showRejectModal!)"
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ปฏิเสธ
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Reject Modal -->
    <div
      v-if="showBulkRejectModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showBulkRejectModal = false"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900">ปฏิเสธ {{ selectedIds.length }} รายการ</h3>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700">หมายเหตุ</label>
          <textarea
            v-model="bulkRemark"
            rows="3"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="ระบุเหตุผล..."
          />
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="showBulkRejectModal = false"
            class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            @click="handleBulkReject"
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ปฏิเสธทั้งหมด
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
