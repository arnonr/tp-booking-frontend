<script setup lang="ts">
import Navbar from './Navbar.vue'
import AppFooter from './AppFooter.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <Navbar />
    <div class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div class="flex gap-6">
        <!-- Sidebar -->
        <aside class="w-56 shrink-0">
          <nav class="space-y-1 rounded-lg bg-white p-4 shadow-sm">
            <router-link to="/admin/dashboard"
              class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              active-class="bg-indigo-50 text-indigo-600 font-medium">
              Dashboard
            </router-link>
            <router-link to="/admin/users"
              class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              active-class="bg-indigo-50 text-indigo-600 font-medium">
              จัดการพนักงาน
            </router-link>
            <router-link to="/admin/rooms"
              class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              active-class="bg-indigo-50 text-indigo-600 font-medium">
              จัดการห้อง
            </router-link>
            <router-link to="/admin/approvals"
              class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              active-class="bg-indigo-50 text-indigo-600 font-medium">
              อนุมัติการจอง
            </router-link>
            <router-link to="/admin/external-requests"
              class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              active-class="bg-indigo-50 text-indigo-600 font-medium">
              คำขอคนนอก
            </router-link>
            <router-link to="/admin/reports"
              class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              active-class="bg-indigo-50 text-indigo-600 font-medium">
              รายงาน
            </router-link>
            <router-link to="/admin/feedback"
              class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              active-class="bg-indigo-50 text-indigo-600 font-medium">
              Feedback
            </router-link>
          </nav>
        </aside>

        <!-- Content -->
        <main class="flex-1">
          <router-view />
        </main>
      </div>
    </div>
    <AppFooter />
  </div>
</template>
