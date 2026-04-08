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

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

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
    {
      label: 'ปฏิเสธ',
      data: store.monthlyStats.map((s) => s.rejected),
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 1,
    },
    {
      label: 'ยกเลิก',
      data: store.monthlyStats.map((s) => s.cancelled),
      backgroundColor: 'rgba(156, 163, 175, 0.6)',
      borderColor: 'rgb(156, 163, 175)',
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
        'rgba(20, 184, 166, 0.6)',
        'rgba(249, 115, 22, 0.6)',
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
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointRadius: 4,
      pointHoverRadius: 6,
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

const barChartOptions = {
  ...chartOptions,
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

const lineChartOptions = {
  ...chartOptions,
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

function exportCsv() {
  const url = store.getExportUrl()
  window.open(url, '_blank')
}

function onYearChange() {
  store.fetchMonthlyStats({ year: selectedYear.value })
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
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p class="mt-1 text-sm text-gray-500">สถิติการใช้งานห้องประชุม</p>
        </div>
        <button
          @click="exportCsv"
          class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading && !summary" class="flex justify-center py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <!-- Error -->
      <div v-else-if="store.error" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        {{ store.error }}
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Summary Cards -->
        <div v-if="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-500">การจองทั้งหมด</p>
            <p class="mt-1 text-3xl font-bold text-gray-900">{{ summary.totalBookings }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ summary.totalRooms }} ห้องประชุม</p>
          </div>
          <div class="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <p class="text-sm font-medium text-blue-600">วันนี้</p>
            <p class="mt-1 text-3xl font-bold text-blue-700">{{ summary.todayBookings }}</p>
            <p class="mt-1 text-xs text-blue-400">การจอง</p>
          </div>
          <div class="rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-5 shadow-sm">
            <p class="text-sm font-medium text-yellow-600">รออนุมัติ</p>
            <p class="mt-1 text-3xl font-bold text-yellow-700">{{ summary.pendingApprovals }}</p>
            <p class="mt-1 text-xs text-yellow-400">รายการ</p>
          </div>
          <div class="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
            <p class="text-sm font-medium text-green-600">อัตราการใช้งาน</p>
            <p class="mt-1 text-3xl font-bold text-green-700">
              {{ Math.round((summary.occupancyRate ?? 0) * 100) }}%
            </p>
            <p class="mt-1 text-xs text-green-400">เฉลี่ย</p>
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

        <!-- Tab: Overview -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-lg font-semibold text-gray-900">สถิติรายเดือน</h2>
              <div class="h-64">
                <Bar :data="monthlyChartData" :options="barChartOptions" />
              </div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-lg font-semibold text-gray-900">อัตราการใช้งานห้อง</h2>
              <div class="h-64">
                <Doughnut :data="roomUsageChartData" :options="chartOptions" />
              </div>
            </div>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-gray-900">ช่วงเวลายอดนิยม</h2>
            <div class="h-64">
              <Line :data="peakHourChartData" :options="lineChartOptions" />
            </div>
          </div>
        </div>

        <!-- Tab: Monthly -->
        <div v-if="activeTab === 'monthly'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 class="text-lg font-semibold text-gray-900">สถิติรายเดือน</h2>
              <select
                v-model="selectedYear"
                @change="onYearChange"
                class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y + 543 }}</option>
              </select>
            </div>
            <div class="h-80">
              <Bar :data="monthlyChartData" :options="barChartOptions" />
            </div>
          </div>

          <!-- Monthly Table -->
          <div v-if="store.monthlyStats.length > 0" class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">เดือน</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">ทั้งหมด</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">อนุมัติ</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">ปฏิเสธ</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">ยกเลีก</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">เสร็จสิ้น</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="stat in store.monthlyStats" :key="stat.month" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ stat.month }}</td>
                    <td class="px-4 py-3 text-right text-sm text-gray-600">{{ stat.totalBookings }}</td>
                    <td class="px-4 py-3 text-right text-sm text-green-600">{{ stat.approved }}</td>
                    <td class="px-4 py-3 text-right text-sm text-red-600">{{ stat.rejected }}</td>
                    <td class="px-4 py-3 text-right text-sm text-gray-500">{{ stat.cancelled }}</td>
                    <td class="px-4 py-3 text-right text-sm text-blue-600">{{ stat.completed }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab: Rooms -->
        <div v-if="activeTab === 'rooms'" class="space-y-6">
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-lg font-semibold text-gray-900">สัดส่วนการใช้งาน</h2>
              <div class="h-80">
                <Doughnut :data="roomUsageChartData" :options="chartOptions" />
              </div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-lg font-semibold text-gray-900">อัตราการใช้งานห้อง</h2>
              <div class="space-y-3">
                <div v-for="room in store.roomUsage" :key="room.roomId">
                  <div class="mb-1 flex items-center justify-between text-sm">
                    <span class="font-medium text-gray-900">{{ room.roomName }}</span>
                    <span class="text-gray-500">{{ Math.round(room.occupancyRate * 100) }}%</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      class="h-full rounded-full bg-blue-600 transition-all"
                      :style="{ width: Math.round(room.occupancyRate * 100) + '%' }"
                    />
                  </div>
                  <div class="mt-1 flex gap-4 text-xs text-gray-400">
                    <span>{{ room.totalBookings }} การจอง</span>
                    <span>{{ room.totalHours }} ชั่วโมง</span>
                  </div>
                </div>
                <div v-if="store.roomUsage.length === 0" class="py-8 text-center text-sm text-gray-400">
                  ไม่มีข้อมูล
                </div>
              </div>
            </div>
          </div>

          <!-- Room Usage Table -->
          <div v-if="store.roomUsage.length > 0" class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ห้อง</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">จอง</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">ชั่วโมง</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">อัตรา</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="room in store.roomUsage" :key="room.roomId" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ room.roomName }}</td>
                    <td class="px-4 py-3 text-right text-sm text-gray-600">{{ room.totalBookings }}</td>
                    <td class="px-4 py-3 text-right text-sm text-gray-600">{{ room.totalHours }}</td>
                    <td class="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {{ Math.round(room.occupancyRate * 100) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab: Peak Hours -->
        <div v-if="activeTab === 'peak'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-gray-900">ช่วงเวลายอดนิยม</h2>
            <div class="h-80">
              <Line :data="peakHourChartData" :options="lineChartOptions" />
            </div>
          </div>

          <!-- Peak Hours Table -->
          <div v-if="store.peakHours.length > 0" class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ช่วงเวลา</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">จำนวนการจอง</th>
                    <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">สัดส่วน</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="hour in store.peakHours" :key="hour.hour" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ hour.hour }}</td>
                    <td class="px-4 py-3 text-right text-sm text-gray-600">{{ hour.bookingCount }}</td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <div class="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                          <div
                            class="h-full rounded-full bg-blue-600 transition-all"
                            :style="{
                              width: store.peakHours.length
                                ? Math.round((hour.bookingCount / Math.max(...store.peakHours.map((p) => p.bookingCount))) * 100) + '%'
                                : '0%',
                            }"
                          />
                        </div>
                        <span class="text-sm text-gray-500">
                          {{ store.peakHours.length
                            ? Math.round((hour.bookingCount / Math.max(...store.peakHours.map((p) => p.bookingCount))) * 100)
                            : 0 }}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>
</template>
