<template>
  <div :class="classes" class="animate-pulse rounded-lg bg-white/5" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'text' | 'circle' | 'card' | 'title'
  width?: string
}>(), {
  variant: 'text',
})

const classes = computed(() => {
  switch (props.variant) {
    case 'circle': return 'w-10 h-10 rounded-full'
    case 'card': return 'w-full h-48'
    case 'title': return `h-7 ${props.width || 'w-48'}`
    default: return `h-4 ${props.width || 'w-full'}`
  }
})
</script>
