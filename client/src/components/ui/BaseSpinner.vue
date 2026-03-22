<template>
  <div class="flex items-center justify-center py-12">
    <Loader2 class="animate-spin text-gold" :size="size" />
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

withDefaults(defineProps<{
  size?: number
}>(), {
  size: 32,
})
</script>
