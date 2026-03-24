<template>
  <div class="flex items-center justify-center py-12">
    <Loader2 class="animate-spin text-gold" :size="iconSize" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  size?: number | 'sm' | 'md' | 'lg' | 'xl' 
}>(), {
  size: 'md',
})

const iconSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  
  switch (props.size) {
    case 'sm': return 16
    case 'md': return 32 
    case 'lg': return 48
    case 'xl': return 64
    default: return 32
  }
})
</script>
