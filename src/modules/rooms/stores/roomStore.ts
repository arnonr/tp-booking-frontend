import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { Room, Amenity, AvailabilitySlot, PaginatedResponse } from '@/types'

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<Room[]>([])
  const currentRoom = ref<Room | null>(null)
  const availability = ref<AvailabilitySlot[]>([])
  const amenities = ref<Amenity[]>([])
  const isLoading = ref(false)
  const availabilityLoading = ref(false)
  const amenityLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ page: 1, limit: 10, total: 0 })

  async function fetchRooms(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<PaginatedResponse<Room>>('/rooms', { params })
      rooms.value = data.data
      pagination.value = data.pagination
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load rooms'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllRooms() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get('/rooms')
      rooms.value = Array.isArray(data) ? data : data.data ?? []
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load rooms'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPublicRooms(params?: {
    building?: string
    minCapacity?: number
    search?: string
    amenityId?: number
  }) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<Room[]>('/rooms', {
        params: { status: 'active', ...params },
      })
      rooms.value = Array.isArray(data) ? data : (data as any)?.data ?? []
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load rooms'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRoomById(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<Room>(`/rooms/${id}`)
      currentRoom.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load room'
    } finally {
      isLoading.value = false
    }
  }

  async function createRoom(form: Partial<Room>) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.post<Room>('/rooms', form)
      return data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create room'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateRoom(id: number, form: Partial<Room>) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.put<Room>(`/rooms/${id}`, form)
      return data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update room'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function deleteRoom(id: number) {
    isLoading.value = true
    error.value = null
    try {
      await api.delete(`/rooms/${id}`)
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete room'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAvailability(roomId: number, date: string) {
    availabilityLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<{
        openTime: string
        closeTime: string
        slotDurationMin: number
        bookedSlots: { startTime: string; endTime: string }[]
      }>(`/rooms/${roomId}/availability`, { params: { date } })

      availability.value = generateSlots(data.openTime, data.closeTime, data.slotDurationMin, data.bookedSlots ?? [])
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'โหลดช่วงเวลาว่างไม่สำเร็จ'
    } finally {
      availabilityLoading.value = false
    }
  }

  function generateSlots(
    openTime: string,
    closeTime: string,
    slotDurationMin: number,
    bookedSlots: { startTime: string; endTime: string }[],
  ): AvailabilitySlot[] {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    const toTime = (min: number) =>
      `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

    const slots: AvailabilitySlot[] = []
    const open = toMin(openTime)
    const close = toMin(closeTime)

    for (let start = open; start + slotDurationMin <= close; start += slotDurationMin) {
      const end = start + slotDurationMin
      const startTime = toTime(start)
      const endTime = toTime(end)
      const isBooked = bookedSlots.some(b => b.startTime < endTime && b.endTime > startTime)
      slots.push({ startTime, endTime, isAvailable: !isBooked })
    }
    return slots
  }

  async function uploadImages(roomId: number, files: File[]) {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    try {
      await api.post(`/rooms/${roomId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to upload images'
      throw e
    }
  }

  async function deleteImage(roomId: number, imageId: number) {
    try {
      await api.delete(`/rooms/${roomId}/images/${imageId}`)
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete image'
      throw e
    }
  }

  async function updateAmenities(roomId: number, amenityIds: number[]) {
    try {
      await api.put(`/rooms/${roomId}/amenities`, { amenityIds })
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update amenities'
      throw e
    }
  }

  async function fetchAmenities() {
    amenityLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<Amenity[]>('/amenities')
      amenities.value = Array.isArray(data) ? data : (data as any)?.data ?? []
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'โหลด amenity ไม่สำเร็จ'
    } finally {
      amenityLoading.value = false
    }
  }

  async function createAmenity(form: { name: string; icon?: string }) {
    amenityLoading.value = true
    error.value = null
    try {
      const { data } = await api.post<Amenity>('/amenities', form)
      amenities.value.push(data)
      return data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'เพิ่ม amenity ไม่สำเร็จ'
      throw e
    } finally {
      amenityLoading.value = false
    }
  }

  async function updateAmenity(id: number, form: { name: string; icon?: string }) {
    amenityLoading.value = true
    error.value = null
    try {
      const { data } = await api.put<Amenity>(`/amenities/${id}`, form)
      const idx = amenities.value.findIndex((a) => a.id === id)
      if (idx !== -1) amenities.value[idx] = data
      return data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'แก้ไข amenity ไม่สำเร็จ'
      throw e
    } finally {
      amenityLoading.value = false
    }
  }

  async function deleteAmenity(id: number) {
    amenityLoading.value = true
    error.value = null
    try {
      await api.delete(`/amenities/${id}`)
      amenities.value = amenities.value.filter((a) => a.id !== id)
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'ลบ amenity ไม่สำเร็จ'
      throw e
    } finally {
      amenityLoading.value = false
    }
  }

  return {
    rooms,
    currentRoom,
    availability,
    amenities,
    isLoading,
    availabilityLoading,
    amenityLoading,
    error,
    pagination,
    fetchRooms,
    fetchAllRooms,
    fetchPublicRooms,
    fetchRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    fetchAvailability,
    uploadImages,
    deleteImage,
    updateAmenities,
    fetchAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity,
  }
})
