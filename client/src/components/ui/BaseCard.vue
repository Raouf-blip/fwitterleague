<template>
  <div
    :class="[
      'bg-[#111318] border border-gold/10 rounded-xl transition-all duration-300',
      hoverable && 'hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 hover:-translate-y-0.5',
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
