<script setup lang="ts">
const year = new Date().getFullYear() + 543
</script>

<template>
  <footer class="mt-auto border-t border-gray-100 bg-white">
    <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">

        <!-- Brand -->
        <div class="flex items-center gap-2.5">
          <div class="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
            <svg class="h-3.5 w-3.5 text-white" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="5" height="5" rx="0.5" fill="currentColor" opacity="1"/>
              <rect x="8" y="1" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.6"/>
              <rect x="1" y="8" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.6"/>
              <rect x="8" y="8" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <span class="text-sm font-semibold tracking-tight text-gray-800">Technopark</span>
          <span class="hidden text-xs text-gray-300 sm:inline">|</span>
          <span class="hidden text-xs text-gray-400 sm:inline">ระบบจองห้องประชุม</span>
        </div>

        <!-- Right: copyright -->
        <p class="text-xs text-gray-400">
          &copy; พ.ศ. {{ year }} · พัฒนาโดย Technopark
        </p>

      </div>
    </div>
  </footer>
</template>
