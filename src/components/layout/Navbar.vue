<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/authStore'
// import NotificationBell from '@/components/ui/NotificationBell.vue'
import logo from '@/assets/logo.png'

const auth = useAuthStore()
const mobileMenuOpen = ref(false)

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
          <img :src="logo" alt="Logo" class="h-10" />
        </router-link>

        <!-- Hamburger Button (mobile) -->
        <button
          class="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg v-if="!mobileMenuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Desktop Nav Links -->
        <div class="hidden md:flex items-center gap-4">
          <router-link to="/" class="text-gray-700 hover:text-blue-600">หน้าแรก</router-link>
          <router-link to="/rooms" class="text-gray-700 hover:text-blue-600">ห้องประชุม</router-link>

          <template v-if="isLoggedIn">

            <router-link to="/bookings" class="text-gray-700 hover:text-blue-600">การจองของฉัน</router-link>

            <template v-if="isAdmin">
              <router-link to="/admin/dashboard" class="text-gray-700 hover:text-blue-600">Dashboard</router-link>
              <router-link to="/admin/approvals" class="text-gray-700 hover:text-blue-600">อนุมัติ</router-link>
            </template>

            <!-- Notification Bell -->
            <!-- <NotificationBell /> -->

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

    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" class="border-t border-gray-200 md:hidden">
      <div class="space-y-1 px-4 py-3">
        <router-link to="/" class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600" @click="mobileMenuOpen = false">หน้าแรก</router-link>
        <router-link to="/rooms" class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600" @click="mobileMenuOpen = false">ห้องประชุม</router-link>

        <template v-if="isLoggedIn">
          <router-link to="/bookings" class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600" @click="mobileMenuOpen = false">การจองของฉัน</router-link>

          <template v-if="isAdmin">
            <router-link to="/admin/dashboard" class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600" @click="mobileMenuOpen = false">Dashboard</router-link>
            <router-link to="/admin/approvals" class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600" @click="mobileMenuOpen = false">อนุมัติ</router-link>
          </template>

          <div class="border-t border-gray-200 pt-2 mt-2">
            <p class="px-3 py-1 text-sm text-gray-600">{{ auth.user?.fullName }}</p>
            <button @click="logout" class="block w-full text-left rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">ออกจากระบบ</button>
          </div>
        </template>

        <template v-else>
          <button @click="login"
            class="w-full cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            เข้าสู่ระบบ (SSO)
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
