<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import api from '@/plugins/axios'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  const code = route.query.code as string

  if (!code) {
    router.push('/login')
    return
  }

  console.log("FREEDOM");
  console.log(code);

  try {
    await api.post('/auth/sso/callback', { code })
    await auth.fetchUser()
    router.push('/')
  } catch {
    router.push('/login')
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p class="mt-4 text-gray-600">กำลังเข้าสู่ระบบ...</p>
    </div>
  </div>
</template>
