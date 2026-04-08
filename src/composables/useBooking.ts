import { computed } from 'vue'
import type { BookingStatus } from '@/types'

const statusConfig: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'รออนุมัติ', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  approved: { label: 'อนุมัติแล้ว', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: 'ปฏิเสธ', color: 'text-red-700', bg: 'bg-red-100' },
  cancelled: { label: 'ยกเลิก', color: 'text-gray-700', bg: 'bg-gray-100' },
  completed: { label: 'เสร็จสิ้น', color: 'text-blue-700', bg: 'bg-blue-100' },
}

export function useBooking() {
  function getStatusLabel(status: BookingStatus): string {
    return statusConfig[status]?.label ?? status
  }

  function getStatusColor(status: BookingStatus) {
    return {
      text: statusConfig[status]?.color ?? 'text-gray-700',
      bg: statusConfig[status]?.bg ?? 'bg-gray-100',
    }
  }

  function canCancel(status: BookingStatus, startTime: string, isAdmin: boolean): boolean {
    if (['completed', 'rejected', 'cancelled'].includes(status)) return false
    if (isAdmin) return true
    const diff = new Date(startTime).getTime() - Date.now()
    return diff > 2 * 60 * 60 * 1000
  }

  function canCheckIn(booking: {
    status: BookingStatus
    checkedIn: boolean
    startTime: string
    bookingDate: string
  }): boolean {
    if (booking.status !== 'approved' || booking.checkedIn) return false
    const start = new Date(`${booking.bookingDate}T${booking.startTime}`).getTime()
    const now = Date.now()
    const diff = now - start
    return diff >= 0 && diff <= 15 * 60 * 1000
  }

  function canGiveFeedback(booking: {
    status: BookingStatus
    checkedIn: boolean
  }): boolean {
    return booking.status === 'completed' && booking.checkedIn
  }

  const bookingStatuses = computed(() =>
    Object.entries(statusConfig).map(([value, cfg]) => ({
      value: value as BookingStatus,
      label: cfg.label,
    })),
  )

  return {
    getStatusLabel,
    getStatusColor,
    canCancel,
    canCheckIn,
    canGiveFeedback,
    bookingStatuses,
  }
}
