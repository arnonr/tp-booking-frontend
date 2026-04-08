// ── Auth ──
export interface User {
  id: number
  username: string
  email: string
  fullName: string
  department: string | null
  phone: string | null
  role: 'admin' | 'employee'
  isActive: boolean
}

// ── Rooms ──
export interface Room {
  id: number
  name: string
  building: string | null
  floor: string | null
  capacity: number
  description: string | null
  status: 'active' | 'maintenance' | 'inactive'
  openTime: string
  closeTime: string
  slotDurationMin: number
  images?: RoomImage[]
  amenities?: Amenity[]
}

export interface RoomImage {
  id: number
  imageUrl: string
  sortOrder: number
}

export interface Amenity {
  id: number
  name: string
  icon: string | null
}

export interface TimeSlot {
  id: number
  roomId: number
  dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface AvailabilitySlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  bookingId?: number
}

// ── Bookings ──
export interface Booking {
  id: number
  userId: number
  roomId: number
  bookingDate: string
  startTime: string
  endTime: string
  purpose: string
  attendeeCount: number
  additionalRequirements: string | null
  status: BookingStatus
  adminRemark: string | null
  approvedBy: number | null
  approvedAt: string | null
  checkedIn: boolean
  checkedInAt: string | null
  recurringGroupId: string | null
  createdAt: string
  room?: Room
  user?: User
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'

export interface BookingFormData {
  roomId: number
  bookingDate: string
  startTime: string
  endTime: string
  purpose: string
  attendeeCount: number
  additionalRequirements?: string
  bookerName?: string
  bookerPhone?: string
}

export interface RecurringBookingFormData extends BookingFormData {
  recurringType: 'weekly' | 'monthly'
  recurringEndDate: string
  bookerName?: string
  bookerPhone?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  resourceId?: number
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    bookingId: number
    status: BookingStatus
    roomName: string
    roomLocation: string
    roomCapacity: number | null
    purpose: string
    attendeeCount: number
    additionalRequirements: string
    bookerName: string
    bookerDepartment: string
    checkedIn: boolean
  }
}

// ── Equipment ──
export interface Equipment {
  id: number
  name: string
  totalQty: number
  description: string | null
}

export interface BookingEquipment {
  id: number
  bookingId: number
  equipmentId: number
  quantity: number
}

// ── Feedback ──
export interface Feedback {
  id: number
  bookingId: number
  userId: number
  rating: number
  comment: string | null
  createdAt: string
  user?: User
}

export interface FeedbackFormData {
  rating: number
  comment: string
}

// ── Notifications ──
export interface Notification {
  id: number
  bookingId: number | null
  type: NotificationType
  title: string
  message: string | null
  isRead: boolean
  createdAt: string
}

export type NotificationType =
  | 'booking_approved'
  | 'booking_rejected'
  | 'new_booking_request'
  | 'new_external_request'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'no_show_warning'

// ── External Requests ──
export interface ExternalRequest {
  id: number
  fullName: string
  organization: string | null
  phone: string
  email: string | null
  roomId: number | null
  preferredDate: string | null
  preferredStart: string | null
  preferredEnd: string | null
  purpose: string
  refCode: string
  status: 'new' | 'contacted' | 'confirmed' | 'declined'
  adminNote: string | null
  handledBy: number | null
  createdAt: string
  room?: Room
}

export interface ExternalRequestFormData {
  fullName: string
  organization?: string
  phone: string
  email?: string
  roomId?: number
  preferredDate?: string
  preferredStart?: string
  preferredEnd?: string
  purpose: string
}

// ── Reports ──
export interface ReportSummary {
  totalBookings: number
  totalRooms: number
  totalUsers: number
  pendingApprovals: number
  todayBookings: number
  occupancyRate: number
}

export interface MonthlyStat {
  month: string
  totalBookings: number
  approved: number
  rejected: number
  cancelled: number
  completed: number
}

export interface RoomUsage {
  roomId: number
  roomName: string
  totalBookings: number
  totalHours: number
  occupancyRate: number
}

export interface PeakHour {
  hour: string
  bookingCount: number
}

// ── Audit Logs ──
export interface AuditLog {
  id: number
  userId: number | null
  entityType: string
  entityId: number
  action: string
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
  user?: User
}

// ── Dashboard ──
export interface RoomStatusItem {
  id: number
  name: string
  building: string | null
  floor: string | null
  capacity: number
  status: 'active' | 'maintenance' | 'inactive'
  currentBooking: {
    id: number
    purpose: string
    endTime: string
  } | null
  nextBooking: {
    startTime: string
  } | null
}

// ── Pagination ──
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

// ── API Error ──
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
