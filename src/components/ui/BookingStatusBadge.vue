<script setup lang="ts">
import type { BookingStatus } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge.vue'

defineProps<{
  status: BookingStatus
}>()
</script>
