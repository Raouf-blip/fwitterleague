<template>
  <div class="flex flex-col items-center p-3 bg-white/[0.03] rounded-lg">
    <span class="text-2xl font-extrabold text-text-primary">{{ value }}</span>
    <span class="text-xs text-text-muted uppercase tracking-wide mt-1">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>
