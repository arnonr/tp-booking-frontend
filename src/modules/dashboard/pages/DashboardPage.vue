<!-- frontend/src/modules/dashboard/pages/DashboardPage.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useReportStore } from '@/modules/dashboard/stores/reportStore'
import { useDashboardStore } from '@/modules/dashboard/stores/dashboardStore'
import SummaryCards from '../components/SummaryCards.vue'
import ChartsSection from '../components/ChartsSection.vue'
import RoomStatusGrid from '../components/RoomStatusGrid.vue'
import ActivityFeed from '../components/ActivityFeed.vue'

const reportStore = useReportStore()
const dashboardStore = useDashboardStore()

const summary = computed(() => reportStore.summary)
const availableRoomCount = computed(
  () => dashboardStore.roomStatuses.filter((r) => !r.currentBooking && r.status === 'active').length,
)
const totalRooms = computed(() => dashboardStore.roomStatuses.length)
const isLoading = computed(() => reportStore.isLoading || dashboardStore.isLoading)
const error = computed(() => reportStore.error ?? dashboardStore.error)

onMounted(async () => {
  await Promise.all([
    reportStore.fetchSummary(),
    reportStore.fetchMonthlyStats(),
    reportStore.fetchRoomUsage(),
    reportStore.fetchPeakHours(),
    dashboardStore.fetchRoomStatuses(),
    dashboardStore.fetchRecentActivities(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">ภาพรวมระบบจองห้องประชุม</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !summary" class="flex justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

    <!-- Content -->
    <template v-else>
      <!-- Zone 1: Summary Cards -->
      <SummaryCards
        :summary="summary"
        :available-room-count="availableRoomCount"
        :total-rooms="totalRooms"
      />

      <!-- Zone 2: Charts -->
      <ChartsSection />

      <!-- Zone 3: Room Status + Activity Feed side by side on large screens -->
      <div class="grid gap-6 xl:grid-cols-3">
        <div class="xl:col-span-2">
          <RoomStatusGrid />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </template>
  </div>
</template>
