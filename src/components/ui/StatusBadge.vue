<script setup lang="ts">
import type { BookingStatus } from '@/types'
import { useBooking } from '@/composables/useBooking'

const props = defineProps<{
  status: BookingStatus
}>()

const { getStatusLabel, getStatusColor } = useBooking()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      getStatusColor(props.status).bg,
      getStatusColor(props.status).text,
    ]"
  >
    {{ getStatusLabel(props.status) }}
  </span>
</template>
