import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { RoomStatusItem, AuditLog, Room, Booking, PaginatedResponse } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const roomStatuses = ref<RoomStatusItem[]>([])
  const recentActivities = ref<AuditLog[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoomStatuses() {
    isLoading.value = true
    error.value = null
    try {
      const today = new Date().toISOString().split('T')[0]
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get<Room[]>('/rooms'),
        api.get<Booking[]>('/bookings/calendar', {
          params: { dateFrom: today, dateTo: today },
        }),
      ])

      const rooms = roomsRes.data
      const todayBookings = bookingsRes.data
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      roomStatuses.value = rooms
        .filter((r) => r.status !== 'inactive')
        .map((room) => {
          const roomBookings = todayBookings.filter(
            (b) => b.roomId === room.id && b.status !== 'cancelled' && b.status !== 'rejected',
          )

          const current = roomBookings.find(
            (b) => b.startTime <= currentTime && b.endTime > currentTime,
          )

          const upcoming = roomBookings
            .filter((b) => b.startTime > currentTime && b.status === 'approved')
            .sort((a, b) => a.startTime.localeCompare(b.startTime))

          return {
            id: room.id,
            name: room.name,
            building: room.building,
            floor: room.floor,
            capacity: room.capacity,
            status: room.status,
            currentBooking: current
              ? { id: current.id, purpose: current.purpose, endTime: current.endTime }
              : null,
            nextBooking: upcoming.length > 0
              ? { startTime: upcoming[0].startTime }
              : null,
          }
        })
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'โหลดสถานะห้องไม่สำเร็จ'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRecentActivities() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', {
        params: { limit: 10 },
      })
      recentActivities.value = data.data ?? []
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'โหลดกิจกรรมไม่สำเร็จ'
    } finally {
      isLoading.value = false
    }
  }

  return { roomStatuses, recentActivities, isLoading, error, fetchRoomStatuses, fetchRecentActivities }
})
