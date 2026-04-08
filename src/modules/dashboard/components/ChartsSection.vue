<!-- frontend/src/modules/dashboard/components/ChartsSection.vue -->
<script setup lang="ts">
import { computed } from 'vue'
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

const monthlyChartData = computed(() => ({
  labels: store.monthlyStats.map((s) => s.month),
  datasets: [
    {
      label: 'ทั้งหมด',
      data: store.monthlyStats.map((s) => s.totalBookings),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
      borderRadius: 6,
    },
    {
      label: 'อนุมัติ',
      data: store.monthlyStats.map((s) => s.approved),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1,
      borderRadius: 6,
    },
    {
      label: 'ปฏิเสธ',
      data: store.monthlyStats.map((s) => s.rejected),
      backgroundColor: 'rgba(239, 68, 68, 0.7)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
}))

const roomUsageChartData = computed(() => ({
  labels: store.roomUsage.map((r) => r.roomName),
  datasets: [
    {
      data: store.roomUsage.map((r) => Math.round(r.occupancyRate * 100)),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ],
      borderWidth: 0,
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
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: (ctx: any) => {
        const canvas = ctx.chart.ctx
        const gradient = canvas.createLinearGradient(0, 0, 0, ctx.chart.height)
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)')
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)')
        return gradient
      },
      tension: 0.4,
      pointBackgroundColor: 'rgb(99, 102, 241)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const, labels: { usePointStyle: true, padding: 16 } },
    tooltip: { cornerRadius: 8, padding: 10 },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { grid: { display: false } },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 12 } },
    tooltip: { cornerRadius: 8, padding: 10 },
  },
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { cornerRadius: 8, padding: 10 },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { grid: { display: false } },
  },
}
</script>

<template>
  <div class="space-y-5">
    <!-- Top row: side-by-side -->
    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Monthly Bar Chart -->
      <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <h3 class="mb-4 text-base font-semibold text-gray-800">สถิติรายเดือน</h3>
        <div class="h-72">
          <Bar v-if="store.monthlyStats.length > 0" :data="monthlyChartData" :options="chartOptions" />
          <div v-else class="flex h-full items-center justify-center text-sm text-gray-400">ไม่มีข้อมูล</div>
        </div>
      </div>

      <!-- Room Usage Doughnut -->
      <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <h3 class="mb-4 text-base font-semibold text-gray-800">อัตราการใช้งานห้อง</h3>
        <div class="h-72">
          <Doughnut v-if="store.roomUsage.length > 0" :data="roomUsageChartData" :options="doughnutOptions" />
          <div v-else class="flex h-full items-center justify-center text-sm text-gray-400">ไม่มีข้อมูล</div>
        </div>
      </div>
    </div>

    <!-- Bottom row: full-width line chart -->
    <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <h3 class="mb-4 text-base font-semibold text-gray-800">ช่วงเวลายอดนิยม</h3>
      <div class="h-64">
        <Line v-if="store.peakHours.length > 0" :data="peakHourChartData" :options="lineOptions" />
        <div v-else class="flex h-full items-center justify-center text-sm text-gray-400">ไม่มีข้อมูล</div>
      </div>
    </div>
  </div>
</template>
