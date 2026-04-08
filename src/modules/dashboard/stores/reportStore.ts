import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { ReportSummary, MonthlyStat, RoomUsage, PeakHour } from '@/types'

export const useReportStore = defineStore('report', () => {
  const summary = ref<ReportSummary | null>(null)
  const monthlyStats = ref<MonthlyStat[]>([])
  const roomUsage = ref<RoomUsage[]>([])
  const peakHours = ref<PeakHour[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSummary() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<ReportSummary>('/reports/summary')
      summary.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load summary'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMonthlyStats(params?: { year?: number }) {
    try {
      const { data } = await api.get<MonthlyStat[]>('/reports/monthly', { params })
      monthlyStats.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load monthly stats'
    }
  }

  async function fetchRoomUsage() {
    try {
      const { data } = await api.get<RoomUsage[]>('/reports/room-usage')
      roomUsage.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load room usage'
    }
  }

  async function fetchPeakHours() {
    try {
      const { data } = await api.get<PeakHour[]>('/reports/peak-hours')
      peakHours.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load peak hours'
    }
  }

  function getExportUrl() {
    return '/api/reports/export'
  }

  return {
    summary,
    monthlyStats,
    roomUsage,
    peakHours,
    isLoading,
    error,
    fetchSummary,
    fetchMonthlyStats,
    fetchRoomUsage,
    fetchPeakHours,
    getExportUrl,
  }
})
