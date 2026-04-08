<script setup lang="ts">
import VueSelect from 'vue3-select-component'

const props = withDefaults(
  defineProps<{
    options: { label: string; value: string | number | null }[]
    placeholder?: string
    isSearchable?: boolean
    isClearable?: boolean
    isDisabled?: boolean
  }>(),
  {
    placeholder: 'เลือก...',
    isSearchable: false,
    isClearable: false,
    isDisabled: false,
  },
)

const model = defineModel<string | number | null>()
</script>

<template>
  <!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
  <VueSelect
    v-model="(model as any)"
    :options="(props.options as any)"
    :placeholder="placeholder"
    :is-searchable="isSearchable"
    :is-clearable="isClearable"
    :is-disabled="isDisabled"
    class="app-select"
  />
</template>

<style>
.app-select {
  --vs-border: 1px solid #d1d5db;
  --vs-border-radius: 0.5rem;
  --vs-font-size: 0.875rem;
  --vs-min-height: 38px;
  --vs-padding: 5px 12px;
  --vs-outline-color: #2563eb;
  --vs-outline-width: 2px;
  --vs-placeholder-color: #9ca3af;
  --vs-text-color: #111827;
  --vs-background-color: #fff;
  --vs-option-focused-background-color: #eff6ff;
  --vs-option-focused-text-color: #1d4ed8;
  --vs-option-selected-background-color: #2563eb;
  --vs-option-selected-text-color: #fff;
  --vs-menu-box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --vs-menu-height: 220px;
  --vs-indicator-icon-size: 18px;
  --vs-menu-offset-top: 4px;
  --vs-font-family: inherit;
  --vs-indicator-icon-cursor: pointer;
  --vs-option-cursor: pointer;
}

.app-select .control {
  cursor: pointer;
}

.app-select.disabled {
  --vs-background-color: #f9fafb;
}
</style>
