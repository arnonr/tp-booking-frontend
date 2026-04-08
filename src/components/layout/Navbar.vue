<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import NotificationBell from '@/components/ui/NotificationBell.vue'

const auth = useAuthStore()

const isLoggedIn = computed(() => !!auth.user)
const isAdmin = computed(() => auth.user?.role === 'admin')

const SSO_CONFIG = {
  client_id: import.meta.env.VITE_SSO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_SSO_REDIRECT_URI,
  scope: import.meta.env.VITE_SSO_SCOPE,
  state: import.meta.env.VITE_SSO_STATE,
  auth_url: import.meta.env.VITE_SSO_URL
};

const ssoUrl = computed(() => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SSO_CONFIG.client_id,
    redirect_uri: SSO_CONFIG.redirect_uri,
    scope: SSO_CONFIG.scope,
    state: SSO_CONFIG.state,
  });
  return `${SSO_CONFIG.auth_url}?${params.toString()}`;
});


function login() {
  window.location.href = ssoUrl.value
}

function logout() {
  auth.logout()
}
</script>

<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="text-xl font-bold text-blue-600">
          TP Booking
        </router-link>

        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-4">
          <router-link to="/" class="text-gray-700 hover:text-blue-600">หน้าแรก</router-link>
          <router-link to="/rooms" class="text-gray-700 hover:text-blue-600">ห้องประชุม</router-link>

          <template v-if="isLoggedIn">
            <router-link to="/bookings/calendar" class="text-gray-700 hover:text-blue-600">ปฏิทิน</router-link>
            <router-link to="/bookings" class="text-gray-700 hover:text-blue-600">การจองของฉัน</router-link>

            <template v-if="isAdmin">
              <router-link to="/admin/dashboard" class="text-gray-700 hover:text-blue-600">Dashboard</router-link>
              <router-link to="/admin/approvals" class="text-gray-700 hover:text-blue-600">อนุมัติ</router-link>
            </template>

            <!-- Notification Bell -->
            <NotificationBell />

            <!-- User Menu -->
            <span class="text-sm text-gray-600">{{ auth.user?.fullName }}</span>
            <button @click="logout" class="text-sm text-red-600 hover:text-red-800">ออกจากระบบ</button>
          </template>

          <template v-else>
            <button @click="login"
              class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              เข้าสู่ระบบ (SSO)
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>
