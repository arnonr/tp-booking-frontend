<script setup lang="ts">
import Navbar from './Navbar.vue'
import AppFooter from './AppFooter.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <Navbar />
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
