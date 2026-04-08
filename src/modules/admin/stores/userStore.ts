import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { User } from '@/types'

export const useUserStore = defineStore('user-management', () => {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAllUsers() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get('/users')
      users.value = Array.isArray(data) ? data : data.data ?? []
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'โหลดข้อมูลพนักงานไม่สำเร็จ'
    } finally {
      isLoading.value = false
    }
  }

  async function updateUserRole(id: number, role: User['role']) {
    try {
      await api.put(`/users/${id}`, { role })
      const idx = users.value.findIndex((u) => u.id === id)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], role }
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'เปลี่ยนสิทธิ์ไม่สำเร็จ'
      throw e
    }
  }

  async function toggleUserStatus(id: number, isActive: boolean) {
    try {
      await api.patch(`/users/${id}/status`, { isActive })
      const idx = users.value.findIndex((u) => u.id === id)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], isActive }
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'เปลี่ยนสถานะไม่สำเร็จ'
      throw e
    }
  }

  return { users, isLoading, error, fetchAllUsers, updateUserRole, toggleUserStatus }
})
