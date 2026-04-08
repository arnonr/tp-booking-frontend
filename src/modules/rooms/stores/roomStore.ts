import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { Room, AvailabilitySlot, PaginatedResponse } from '@/types'

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<Room[]>([])
  const currentRoom = ref<Room | null>(null)
  const availability = ref<AvailabilitySlot[]>([])
  const isLoading = ref(false)
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
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<AvailabilitySlot[]>(`/rooms/${roomId}/availability`, {
        params: { date },
      })
      availability.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load availability'
    } finally {
      isLoading.value = false
    }
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

  return {
    rooms,
    currentRoom,
    availability,
    isLoading,
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
  }
})
