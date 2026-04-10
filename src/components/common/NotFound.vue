<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-300">404</h1>
      <p class="mt-4 text-lg text-gray-600">ไม่พบหน้าที่ค้นหา</p>
      <router-link :to="{ name: 'home' }" class="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
        กลับหน้าแรก
      </router-link>
    </div>
  </div>
</template>
