<!-- frontend/src/modules/dashboard/components/SummaryCards.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedCounter } from '@/composables/useAnimatedCounter'
import type { ReportSummary } from '@/types'

const props = defineProps<{
  summary: ReportSummary | null
  availableRoomCount: number
  totalRooms: number
}>()

const totalBookings = useAnimatedCounter(computed(() => props.summary?.totalBookings ?? 0))
const todayBookings = useAnimatedCounter(computed(() => props.summary?.todayBookings ?? 0))
const pendingApprovals = useAnimatedCounter(computed(() => props.summary?.pendingApprovals ?? 0))
const occupancyRate = useAnimatedCounter(computed(() => Math.round((props.summary?.occupancyRate ?? 0) * 100)))

const cards = computed(() => [
  {
    label: 'การจองทั้งหมด',
    value: totalBookings.displayValue.value,
    sub: 'รวมทุกสถานะ',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />',
  },
  {
    label: 'จองวันนี้',
    value: todayBookings.displayValue.value,
    sub: `${props.availableRoomCount} ห้องว่างตอนนี้`,
    gradient: 'from-emerald-500 to-teal-600',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />',
  },
  {
    label: 'รออนุมัติ',
    value: pendingApprovals.displayValue.value,
    sub: 'รายการรอดำเนินการ',
    gradient: 'from-amber-500 to-orange-600',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
    link: '/admin/approvals',
    linkLabel: 'ดูคิวอนุมัติ',
  },
  {
    label: 'อัตราการใช้งาน',
    value: occupancyRate.displayValue.value,
    suffix: '%',
    sub: `${props.totalRooms} ห้องทั้งหมด`,
    gradient: 'from-purple-500 to-pink-600',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
  },
])
</script>

<template>
  <div v-if="summary" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.label"
      :class="[
        'group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
        card.gradient,
      ]"
    >
      <!-- Decorative circle -->
      <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div class="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-white/5" />

      <div class="relative">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-white/80">{{ card.label }}</p>
          <div class="rounded-lg bg-white/20 p-2">
            <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="card.icon" />
          </div>
        </div>
        <p class="mt-2 text-3xl font-bold tracking-tight">
          {{ card.value }}<span v-if="card.suffix" class="text-2xl">{{ card.suffix }}</span>
        </p>
        <p class="mt-1 text-xs text-white/70">{{ card.sub }}</p>
        <router-link
          v-if="card.link"
          :to="card.link"
          class="mt-2 inline-block text-xs font-medium text-white underline decoration-white/50 hover:decoration-white"
        >
          {{ card.linkLabel }}
        </router-link>
      </div>
    </div>
  </div>
</template>
