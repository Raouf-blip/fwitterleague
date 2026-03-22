<template>
  <div
     :class="[
      'bg-surface border border-border rounded-xl transition-all duration-300',
      hoverable && 'hover:border-border-gold hover:shadow-lg hover:shadow-gold/5 hover:-translate-y-0.5',
      padding && 'p-5',
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  hoverable?: boolean
  padding?: boolean
}>(), {
  hoverable: true,
  padding: true,
})
</script>
