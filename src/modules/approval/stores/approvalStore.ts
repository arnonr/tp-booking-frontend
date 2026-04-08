import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { Booking } from '@/types'

export const useApprovalStore = defineStore('approval', () => {
  const pendingBookings = ref<Booking[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPending() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<Booking[]>('/approvals/pending')
      pendingBookings.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load pending approvals'
    } finally {
      isLoading.value = false
    }
  }

  async function approve(id: number) {
    try {
      await api.patch(`/approvals/${id}/approve`)
      pendingBookings.value = pendingBookings.value.filter((b) => b.id !== id)
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to approve'
      throw e
    }
  }

  async function reject(id: number, remark: string) {
    try {
      await api.patch(`/approvals/${id}/reject`, { remark })
      pendingBookings.value = pendingBookings.value.filter((b) => b.id !== id)
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reject'
      throw e
    }
  }

  async function bulkAction(
    bookingIds: number[],
    action: 'approve' | 'reject',
    remark?: string,
  ) {
    try {
      await api.post('/approvals/bulk', { bookingIds, action, remark })
      pendingBookings.value = pendingBookings.value.filter(
        (b) => !bookingIds.includes(b.id),
      )
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to perform bulk action'
      throw e
    }
  }

  return {
    pendingBookings,
    isLoading,
    error,
    fetchPending,
    approve,
    reject,
    bulkAction,
  }
})
