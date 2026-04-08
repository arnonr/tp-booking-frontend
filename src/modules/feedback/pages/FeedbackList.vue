<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useFeedbackStore } from '@/modules/feedback/stores/feedbackStore'
import { useRoomStore } from '@/modules/rooms/stores/roomStore'

const route = useRoute()
const feedbackStore = useFeedbackStore()
const roomStore = useRoomStore()

const roomId = computed(() => Number(route.params.roomId))
const room = computed(() => roomStore.currentRoom)

const averageRating = computed(() => {
  if (feedbackStore.feedbacks.length === 0) return 0
  const sum = feedbackStore.feedbacks.reduce((acc, f) => acc + f.rating, 0)
  return (sum / feedbackStore.feedbacks.length).toFixed(1)
})

const ratingDistribution = computed(() => {
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  feedbackStore.feedbacks.forEach((f) => {
    dist[f.rating] = (dist[f.rating] || 0) + 1
  })
  return dist
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const buddhistYear = d.getFullYear() + 543
  return `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear}`
}

function renderStars(rating: number): string {
  return '&#9733;'.repeat(rating) + '&#9734;'.repeat(5 - rating)
}

onMounted(async () => {
  if (roomId.value) {
    await roomStore.fetchRoomById(roomId.value)
    await feedbackStore.fetchByRoom(roomId.value)
  } else {
    await feedbackStore.fetchAll()
  }
})
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-3xl space-y-6">
      <!-- Back -->
      <button
        @click="$router.back()"
        class="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        กลับ
      </button>

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ room ? `Feedback: ${room.name}` : 'Feedback ทั้งหมด' }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ feedbackStore.feedbacks.length }} รายการ
        </p>
      </div>

      <!-- Loading -->
      <div v-if="feedbackStore.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>

      <template v-else>
        <!-- Rating Summary -->
        <div v-if="feedbackStore.feedbacks.length > 0" class="rounded-xl border border-gray-200 bg-white p-6">
          <div class="flex items-center gap-6">
            <div class="text-center">
              <p class="text-4xl font-bold text-gray-900">{{ averageRating }}</p>
              <div class="mt-1 text-yellow-400" v-html="renderStars(Math.round(Number(averageRating)))" />
              <p class="mt-1 text-sm text-gray-500">{{ feedbackStore.feedbacks.length }} รายการ</p>
            </div>
            <div class="flex-1 space-y-1">
              <div v-for="n in [5, 4, 3, 2, 1]" :key="n" class="flex items-center gap-2">
                <span class="w-4 text-sm text-gray-600">{{ n }}</span>
                <svg class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div class="flex-1">
                  <div class="h-2 rounded-full bg-gray-200">
                    <div
                      class="h-2 rounded-full bg-yellow-400"
                      :style="{ width: `${(ratingDistribution[n] / feedbackStore.feedbacks.length) * 100}%` }"
                    />
                  </div>
                </div>
                <span class="w-6 text-right text-sm text-gray-500">{{ ratingDistribution[n] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback Items -->
        <div v-if="feedbackStore.feedbacks.length > 0" class="space-y-3">
          <div
            v-for="fb in feedbackStore.feedbacks"
            :key="fb.id"
            class="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-yellow-400" v-html="renderStars(fb.rating)" />
                  <span class="text-sm font-medium text-gray-900">
                    {{ fb.user?.fullName ?? `User #${fb.userId}` }}
                  </span>
                </div>
                <p v-if="fb.comment" class="mt-2 text-sm text-gray-700">{{ fb.comment }}</p>
                <p class="mt-1 text-xs text-gray-400">{{ formatDate(fb.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="py-16 text-center">
          <svg class="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-lg font-medium text-gray-500">ยังไม่มี Feedback</p>
        </div>
      </template>
    </div>
  </AppLayout>
</template>
