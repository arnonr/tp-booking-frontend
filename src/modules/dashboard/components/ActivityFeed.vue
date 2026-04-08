<!-- frontend/src/modules/dashboard/components/ActivityFeed.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/modules/dashboard/stores/dashboardStore'

const dashboardStore = useDashboardStore()
const activities = computed(() => dashboardStore.recentActivities)

const actionConfig: Record<string, { color: string; label: string }> = {
  create: { color: 'bg-blue-500', label: 'สร้าง' },
  approve: { color: 'bg-green-500', label: 'อนุมัติ' },
  reject: { color: 'bg-red-500', label: 'ปฏิเสธ' },
  cancel: { color: 'bg-orange-500', label: 'ยกเลิก' },
  no_show: { color: 'bg-orange-500', label: 'No-show' },
  auto_cancel: { color: 'bg-gray-400', label: 'ยกเลิกอัตโนมัติ' },
  update: { color: 'bg-indigo-500', label: 'แก้ไข' },
  delete: { color: 'bg-gray-500', label: 'ลบ' },
}

function getActionStyle(action: string) {
  return actionConfig[action] ?? { color: 'bg-gray-400', label: action }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'เมื่อสักครู่'
  if (diffMin < 60) return `${diffMin} นาทีก่อน`
  if (diffHour < 24) return `${diffHour} ชั่วโมงก่อน`
  if (diffDay < 7) return `${diffDay} วันก่อน`

  const buddhistYear = date.getFullYear() + 543
  return `${date.getDate()}/${date.getMonth() + 1}/${buddhistYear}`
}

function getEntityLabel(type: string): string {
  const labels: Record<string, string> = {
    booking: 'การจอง',
    room: 'ห้อง',
    user: 'ผู้ใช้',
    external_request: 'คำขอภายนอก',
  }
  return labels[type] ?? type
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-800">กิจกรรมล่าสุด</h3>
      <router-link to="/admin/reports" class="text-xs font-medium text-blue-600 hover:underline">
        ดูทั้งหมด &rarr;
      </router-link>
    </div>

    <div v-if="activities.length === 0" class="rounded-2xl border border-gray-100 bg-white py-12 text-center text-sm text-gray-400">
      ไม่มีกิจกรรม
    </div>

    <div v-else class="space-y-0 divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white">
      <div
        v-for="(activity, index) in activities"
        :key="activity.id"
        class="flex items-start gap-3 px-5 py-3.5 transition hover:bg-gray-50/50"
      >
        <!-- Timeline dot -->
        <div class="mt-1.5 flex flex-col items-center">
          <span
            :class="['h-2.5 w-2.5 rounded-full ring-2 ring-white', getActionStyle(activity.action).color]"
          />
          <span v-if="index < activities.length - 1" class="mt-1 h-full w-px bg-gray-200" />
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <p class="text-sm text-gray-700">
            <span class="font-medium text-gray-900">{{ activity.user?.fullName ?? `User #${activity.userId}` }}</span>
            <span :class="['ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white', getActionStyle(activity.action).color]">
              {{ getActionStyle(activity.action).label }}
            </span>
            <span class="ml-1">{{ getEntityLabel(activity.entityType) }}</span>
            <span v-if="activity.newValues" class="ml-1 text-gray-500">
              #{{ activity.entityId }}
            </span>
          </p>
          <p class="mt-0.5 text-xs text-gray-400">{{ formatRelativeTime(activity.createdAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
