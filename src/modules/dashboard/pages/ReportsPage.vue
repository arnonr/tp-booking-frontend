<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'
import { useReportStore } from '@/modules/dashboard/stores/reportStore'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler,
)

const store = useReportStore()
const activeTab = ref<'overview' | 'monthly' | 'rooms' | 'peak'>('overview')

const summary = computed(() => store.summary)

const monthlyChartData = computed(() => ({
  labels: store.monthlyStats.map((s) => s.month),
  datasets: [
    {
      label: 'ทั้งหมด',
      data: store.monthlyStats.map((s) => s.totalBookings),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    },
    {
      label: 'อนุมัติ',
      data: store.monthlyStats.map((s) => s.approved),
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1,
    },
  ],
}))

const roomUsageChartData = computed(() => ({
  labels: store.roomUsage.map((r) => r.roomName),
  datasets: [
    {
      label: 'อัตราการใช้งาน (%)',
      data: store.roomUsage.map((r) => Math.round(r.occupancyRate * 100)),
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(239, 68, 68, 0.6)',
        'rgba(139, 92, 246, 0.6)',
        'rgba(236, 72, 153, 0.6)',
      ],
    },
  ],
}))

const peakHourChartData = computed(() => ({
  labels: store.peakHours.map((p) => p.hour),
  datasets: [
    {
      label: 'จำนวนการจอง',
      data: store.peakHours.map((p) => p.bookingCount),
      fill: true,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.3,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
  },
}

function exportCsv() {
  const url = store.getExportUrl()
  window.open(url, '_blank')
}

onMounted(async () => {
  await Promise.all([
    store.fetchSummary(),
    store.fetchMonthlyStats(),
    store.fetchRoomUsage(),
    store.fetchPeakHours(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">รายงาน</h1>
        <p class="mt-1 text-sm text-gray-500">สถิติการใช้งานห้องประชุม</p>
      </div>
      <button
        @click="exportCsv"
        class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <p class="text-sm font-medium text-gray-500">การจองทั้งหมด</p>
        <p class="mt-1 text-3xl font-bold text-gray-900">{{ summary.totalBookings }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <p class="text-sm font-medium text-gray-500">วันนี้</p>
        <p class="mt-1 text-3xl font-bold text-blue-600">{{ summary.todayBookings }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <p class="text-sm font-medium text-gray-500">รออนุมัติ</p>
        <p class="mt-1 text-3xl font-bold text-yellow-600">{{ summary.pendingApprovals }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <p class="text-sm font-medium text-gray-500">อัตราการใช้งาน</p>
        <p class="mt-1 text-3xl font-bold text-green-600">
          {{ Math.round((summary.occupancyRate ?? 0) * 100) }}%
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 rounded-lg bg-gray-100 p-1">
      <button
        v-for="tab in ([
          { key: 'overview', label: 'ภาพรวม' },
          { key: 'monthly', label: 'รายเดือน' },
          { key: 'rooms', label: 'ห้อง' },
          { key: 'peak', label: 'ช่วงเวลายอดนิยม' },
        ] as const)"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'flex-1 rounded-md px-3 py-2 text-sm font-medium transition',
          activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Charts -->
    <div v-if="activeTab === 'monthly'" class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">สถิติรายเดือน</h2>
      <div class="h-80">
        <Bar :data="monthlyChartData" :options="chartOptions" />
      </div>
    </div>

    <div v-if="activeTab === 'rooms'" class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">อัตราการใช้งานห้อง</h2>
      <div class="h-80">
        <Doughnut :data="roomUsageChartData" :options="chartOptions" />
      </div>

      <!-- Room Usage Table -->
      <div v-if="store.roomUsage.length > 0" class="mt-6 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">ห้อง</th>
              <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">จอง</th>
              <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">ชั่วโมง</th>
              <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">อัตรา</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="room in store.roomUsage" :key="room.roomId">
              <td class="px-4 py-2 text-sm text-gray-900">{{ room.roomName }}</td>
              <td class="px-4 py-2 text-right text-sm text-gray-600">{{ room.totalBookings }}</td>
              <td class="px-4 py-2 text-right text-sm text-gray-600">{{ room.totalHours }}</td>
              <td class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                {{ Math.round(room.occupancyRate * 100) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'peak'" class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">ช่วงเวลายอดนิยม</h2>
      <div class="h-80">
        <Line :data="peakHourChartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  </div>
</template>
