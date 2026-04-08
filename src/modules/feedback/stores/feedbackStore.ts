import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { Feedback, FeedbackFormData, PaginatedResponse } from '@/types'

export const useFeedbackStore = defineStore('feedback', () => {
  const feedbacks = ref<Feedback[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchByRoom(roomId: number) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<Feedback[]>(`/feedback/room/${roomId}`)
      feedbacks.value = data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load feedback'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<PaginatedResponse<Feedback>>('/feedback')
      feedbacks.value = data.data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load feedback'
    } finally {
      isLoading.value = false
    }
  }

  async function submitFeedback(bookingId: number, form: FeedbackFormData) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.post<Feedback>('/feedback', {
        bookingId,
        ...form,
      })
      return data
    } catch (e: unknown) {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit feedback'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    feedbacks,
    isLoading,
    error,
    fetchByRoom,
    fetchAll,
    submitFeedback,
  }
})
