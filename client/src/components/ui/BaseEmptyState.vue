<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
      <component :is="icon" :size="28" class="text-text-muted" />
    </div>
    <h3 class="text-lg font-semibold text-text-secondary mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-text-muted max-w-md">{{ description }}</p>
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  description?: string
}>()
</script>
