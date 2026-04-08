import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)

  async function fetchUser() {
    try {
      const { data } = await api.get<User>('/auth/me')
      user.value = data
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    await api.post('/auth/logout')
    user.value = null
    window.location.href = '/'
  }

  function isAdmin() {
    return user.value?.role === 'admin'
  }

  return { user, isLoading, fetchUser, logout, isAdmin }
})
