import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { Booking, BookingStatus, PaginatedResponse } from '@/types'

export type ApprovalTab = BookingStatus

export const useApprovalStore = defineStore('approval', () => {
  // ── State ──────────────────────────────────────────────
  const bookingsList = ref<Booking[]>([])
  const activeTab = ref<ApprovalTab>('pending')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ page: 1, limit: 20, total: 0 })
  const tabCounts = ref<Record<ApprovalTab, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0,
  })

  // ── Fetch list by status ────────────────────────────────
  async function fetchByStatus(status: ApprovalTab, page = 1) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<PaginatedResponse<Booking>>('/bookings', {
        params: { status, page, limit: 20 },
      })
      bookingsList.value = data.data
      pagination.value = data.pagination
      tabCounts.value[status] = data.pagination.total
      activeTab.value = status
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'โหลดข้อมูลไม่สำเร็จ'
    } finally {
      isLoading.value = false
    }
  }

  // ── Fetch counts for all tabs (on mount) ───────────────
  async function fetchTabCounts() {
    const statuses: ApprovalTab[] = ['pending', 'approved', 'rejected', 'cancelled', 'completed']
    const results = await Promise.allSettled(
      statuses.map((s) =>
        api.get<PaginatedResponse<Booking>>('/bookings', { params: { status: s, limit: 1, page: 1 } }),
      ),
    )
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        tabCounts.value[statuses[i]] = result.value.data.pagination.total
      }
    })
  }

  // ── Approve ────────────────────────────────────────────
  async function approve(id: number) {
    try {
      await api.patch(`/approvals/${id}/approve`)
      bookingsList.value = bookingsList.value.filter((b) => b.id !== id)
      tabCounts.value.pending = Math.max(0, tabCounts.value.pending - 1)
      tabCounts.value.approved++
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'อนุมัติไม่สำเร็จ'
      throw e
    }
  }

  // ── Reject ─────────────────────────────────────────────
  async function reject(id: number, remark: string) {
    try {
      await api.patch(`/approvals/${id}/reject`, { remark })
      bookingsList.value = bookingsList.value.filter((b) => b.id !== id)
      tabCounts.value.pending = Math.max(0, tabCounts.value.pending - 1)
      tabCounts.value.rejected++
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'ปฏิเสธไม่สำเร็จ'
      throw e
    }
  }

  // ── Bulk approve / reject ──────────────────────────────
  async function bulkAction(bookingIds: number[], action: 'approve' | 'reject', remark?: string) {
    try {
      await api.post('/approvals/bulk', { bookingIds, action, remark })
      bookingsList.value = bookingsList.value.filter((b) => !bookingIds.includes(b.id))
      const count = bookingIds.length
      tabCounts.value.pending = Math.max(0, tabCounts.value.pending - count)
      if (action === 'approve') tabCounts.value.approved += count
      else tabCounts.value.rejected += count
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'ดำเนินการไม่สำเร็จ'
      throw e
    }
  }

  // ── Cancel booking (admin) ─────────────────────────────
  async function cancelBooking(id: number) {
    try {
      await api.patch(`/bookings/${id}/cancel`)
      bookingsList.value = bookingsList.value.filter((b) => b.id !== id)
      tabCounts.value.approved = Math.max(0, tabCounts.value.approved - 1)
      tabCounts.value.cancelled++
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'ยกเลิกไม่สำเร็จ'
      throw e
    }
  }

  // ── Revert booking status (admin) ────────────────────
  async function revertStatus(id: number, targetStatus: BookingStatus) {
    try {
      const { data: updated } = await api.patch<Booking>(`/bookings/${id}/revert`, {
        status: targetStatus,
      })
      // Remove from current tab list (it moved to another tab)
      bookingsList.value = bookingsList.value.filter((b) => b.id !== id)
      // Recount all tabs
      await fetchTabCounts()
      return updated
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'ย้อนสถานะไม่สำเร็จ'
      throw e
    }
  }

  // ── Admin update booking ───────────────────────────────
  async function adminUpdateBooking(
    id: number,
    data: {
      bookingDate?: string
      startTime?: string
      endTime?: string
      purpose?: string
      attendeeCount?: number
      additionalRequirements?: string
    },
  ) {
    try {
      const { data: updated } = await api.patch<Booking>(`/bookings/${id}`, data)
      const idx = bookingsList.value.findIndex((b) => b.id === id)
      if (idx !== -1) bookingsList.value[idx] = updated
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'แก้ไขไม่สำเร็จ'
      throw e
    }
  }

  // ── Legacy alias ───────────────────────────────────────
  const pendingBookings = bookingsList

  // ── Legacy fetchPending (used by old code) ─────────────
  async function fetchPending() {
    return fetchByStatus('pending', 1)
  }

  return {
    bookingsList,
    pendingBookings,
    activeTab,
    isLoading,
    error,
    pagination,
    tabCounts,
    fetchByStatus,
    fetchTabCounts,
    fetchPending,
    approve,
    reject,
    bulkAction,
    cancelBooking,
    revertStatus,
    adminUpdateBooking,
  }
})
