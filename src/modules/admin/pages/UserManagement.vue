<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useUserStore } from '@/modules/admin/stores/userStore'
import { useToast } from '@/composables/useToast'
import type { User } from '@/types'

const store = useUserStore()
const toast = useToast()

// ── Filters ───────────────────────────────────────────────────────
const search = ref('')
const roleFilter = ref<string | number | null>('')
const statusFilter = ref<string | number | null>('')
const page = ref(1)
const limit = 10

const roleOptions = [
  { label: 'ทุกสิทธิ์', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
]

const statusOptions = [
  { label: 'ทุกสถานะ', value: '' },
  { label: 'ใช้งานอยู่', value: 'active' },
  { label: 'ระงับ', value: 'inactive' },
]

// ── Computed ──────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  return store.users.filter((u) => {
    if (search.value) {
      const q = search.value.toLowerCase()
      if (
        !u.fullName.toLowerCase().includes(q) &&
        !u.username.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false
    }
    if (roleFilter.value && u.role !== roleFilter.value) return false
    if (statusFilter.value === 'active' && !u.isActive) return false
    if (statusFilter.value === 'inactive' && u.isActive) return false
    return true
  })
})

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * limit
  return filteredUsers.value.slice(start, start + limit)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / limit)))

const statsTotal = computed(() => store.users.length)
const statsAdmin = computed(() => store.users.filter((u) => u.role === 'admin').length)
const statsEmployee = computed(() => store.users.filter((u) => u.role === 'employee' && u.isActive).length)
const statsInactive = computed(() => store.users.filter((u) => !u.isActive).length)

function onFilterChange() {
  page.value = 1
}

// ── Actions ───────────────────────────────────────────────────────
const confirmToggleId = ref<number | null>(null)

async function onRoleChange(user: User, newRole: User['role']) {
  try {
    await store.updateUserRole(user.id, newRole)
    toast.show(`เปลี่ยนสิทธิ์ ${user.fullName} เป็น ${newRole === 'admin' ? 'Admin' : 'Employee'} สำเร็จ`, 'success')
  } catch {
    toast.show('เปลี่ยนสิทธิ์ไม่สำเร็จ', 'error')
  }
}

async function toggleStatus(user: User) {
  const newStatus = !user.isActive
  try {
    await store.toggleUserStatus(user.id, newStatus)
    toast.show(
      newStatus
        ? `เปิดใช้งาน ${user.fullName} สำเร็จ`
        : `ระงับ ${user.fullName} สำเร็จ`,
      'success',
    )
  } catch {
    toast.show('เปลี่ยนสถานะไม่สำเร็จ', 'error')
  }
  confirmToggleId.value = null
}

function roleSelectClass(role: User['role']) {
  return role === 'admin'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-gray-50 text-gray-700 border-gray-200'
}

// ── Init ──────────────────────────────────────────────────────────
onMounted(() => {
  store.fetchAllUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
      <p class="mt-1 text-sm text-gray-500">จัดการสิทธิ์และสถานะพนักงานทั้งหมดในระบบ</p>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">ทั้งหมด</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ statsTotal }}</p>
        <p class="mt-0.5 text-xs text-gray-500">ผู้ใช้งาน</p>
      </div>
      <div class="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-blue-500">Admin</p>
        <p class="mt-1 text-2xl font-bold text-blue-700">{{ statsAdmin }}</p>
        <p class="mt-0.5 text-xs text-blue-500">คน</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-emerald-500">Employee</p>
        <p class="mt-1 text-2xl font-bold text-emerald-700">{{ statsEmployee }}</p>
        <p class="mt-0.5 text-xs text-emerald-500">คน</p>
      </div>
      <div class="rounded-xl border border-red-100 bg-red-50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-red-400">ระงับ</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ statsInactive }}</p>
        <p class="mt-0.5 text-xs text-red-400">คน</p>
      </div>
    </div>

    <!-- Filters Card -->
    <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-[200px] flex-1">
          <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">ค้นหา</label>
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="search" type="text" placeholder="ชื่อ, username, email..." @input="onFilterChange"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
        <div class="min-w-[150px]">
          <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">สิทธิ์</label>
          <AppSelect v-model="roleFilter" :options="roleOptions" class="w-full" @update:model-value="onFilterChange" />
        </div>
        <div class="min-w-[150px]">
          <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">สถานะ</label>
          <AppSelect v-model="statusFilter" :options="statusOptions" class="w-full"
            @update:model-value="onFilterChange" />
        </div>
        <div class="ml-auto flex items-end pb-0.5">
          <span class="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
            {{ filteredUsers.length === 0 ? 0 : (page - 1) * limit + 1 }}–{{ Math.min(page * limit,
              filteredUsers.length) }}
            จาก {{ filteredUsers.length }} คน
          </span>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="store.error"
      class="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {{ store.error }}
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading"
      class="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-16 shadow-sm">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      <p class="mt-4 text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredUsers.length === 0"
      class="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p class="mt-4 font-medium text-gray-600">ไม่พบพนักงานที่ตรงกับเงื่อนไข</p>
      <p class="mt-1 text-sm text-gray-400">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50/70">
            <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">ชื่อ-สกุล</th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Username</th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Email</th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">แผนก</th>
            <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">สิทธิ์</th>
            <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">สถานะ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="user in paginatedUsers" :key="user.id"
            :class="['group transition-colors hover:bg-indigo-50/40', !user.isActive ? 'opacity-60' : '']">
            <td class="px-5 py-4 text-sm font-semibold text-gray-900">{{ user.fullName }}</td>
            <td class="px-5 py-4 text-sm text-gray-500">{{ user.username }}</td>
            <td class="px-5 py-4 text-sm text-gray-500">{{ user.email }}</td>
            <td class="px-5 py-4 text-sm text-gray-500">
              <span v-if="user.department"
                class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{{ user.department
                }}</span>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-5 py-4 text-center">
              <select :value="user.role" :disabled="!user.isActive"
                @change="onRoleChange(user, ($event.target as HTMLSelectElement).value as User['role'])" :class="[
                  'rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-200',
                  roleSelectClass(user.role),
                  !user.isActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                ]">
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </td>
            <td class="px-5 py-4 text-center">
              <!-- Confirm toggle -->
              <div v-if="confirmToggleId === user.id" class="flex items-center justify-center gap-2">
                <span class="text-xs font-medium text-gray-600">ยืนยัน{{ user.isActive ? 'ระงับ' : 'เปิดใช้งาน'
                }}?</span>
                <button @click="toggleStatus(user)" :class="[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition',
                  user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700',
                ]">
                  {{ user.isActive ? 'ระงับ' : 'เปิดใช้งาน' }}
                </button>
                <button @click="confirmToggleId = null"
                  class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50">
                  ยกเลิก
                </button>
              </div>
              <!-- Toggle switch -->
              <div v-else class="inline-flex items-center justify-center gap-2">
                <button @click="confirmToggleId = user.id" :class="[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-200',
                  user.isActive ? 'bg-emerald-500' : 'bg-gray-300',
                ]">
                  <span :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    user.isActive ? 'translate-x-5' : 'translate-x-0',
                  ]" />
                </button>
                <span :class="['text-xs font-semibold', user.isActive ? 'text-emerald-600' : 'text-gray-400']">
                  {{ user.isActive ? 'ใช้งาน' : 'ระงับ' }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-1">
      <button @click="page--" :disabled="page === 1"
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:opacity-30">
        ‹
      </button>
      <button v-for="p in totalPages" :key="p" @click="page = p" :class="[
        'rounded-lg border px-3.5 py-2 text-sm font-medium shadow-sm transition',
        p === page
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
      ]">
        {{ p }}
      </button>
      <button @click="page++" :disabled="page === totalPages"
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:opacity-30">
        ›
      </button>
    </div>
  </div>
</template>
