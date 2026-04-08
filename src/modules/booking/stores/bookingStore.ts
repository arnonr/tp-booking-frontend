import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/plugins/axios'
import type {
  Booking,
  BookingFormData,
  RecurringBookingFormData,
  CalendarEvent,
  PaginatedResponse,
  BookingStatus,
} from '@/types'

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref<Booking[]>([])
  const currentBooking = ref<Booking | null>(null)
  const calendarEvents = ref<CalendarEvent[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ page: 1, limit: 10, total: 0 })

  const statusFilter = ref<BookingStatus | 'all'>('all')

  const filteredBookings = computed(() => {
    if (statusFilter.value === 'all') return bookings.value
    return bookings.value.filter((b) => b.status === statusFilter.value)
  })

  async function fetchBookings(params?: {
    page?: number
    limit?: number
    status?: BookingStatus
  }) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<PaginatedResponse<Booking>>('/bookings', { params })
      bookings.value = data.data
      pagination.value = data.pagination
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load bookings'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBookingById(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<Booking>(`/bookings/${id}`)
      currentBooking.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load booking'
    } finally {
      isLoading.value = false
    }
  }

  async function createBooking(form: BookingFormData) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.post<Booking>('/bookings', form)
      return data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create booking'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function cancelBooking(id: number) {
    isLoading.value = true
    error.value = null
    try {
      await api.patch(`/bookings/${id}/cancel`)
      if (currentBooking.value?.id === id) {
        currentBooking.value.status = 'cancelled'
      }
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to cancel booking'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function checkIn(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.post<Booking>(`/bookings/${id}/checkin`)
      if (currentBooking.value?.id === id) {
        currentBooking.value = data
      }
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to check in'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCalendar(params: {
    roomId?: number
    dateFrom: string
    dateTo: string
  }) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<CalendarEvent[]>('/bookings/calendar', {
        params: {
          roomId: params.roomId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
        },
      })
      calendarEvents.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load calendar'
    } finally {
      isLoading.value = false
    }
  }

  async function createRecurringBooking(form: RecurringBookingFormData) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.post<Booking[]>('/bookings/recurring', form)
      return data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create recurring booking'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function setStatusFilter(status: BookingStatus | 'all') {
    statusFilter.value = status
  }

  return {
    bookings,
    currentBooking,
    calendarEvents,
    isLoading,
    error,
    pagination,
    statusFilter,
    filteredBookings,
    fetchBookings,
    fetchBookingById,
    createBooking,
    cancelBooking,
    checkIn,
    fetchCalendar,
    createRecurringBooking,
    setStatusFilter,
  }
})
