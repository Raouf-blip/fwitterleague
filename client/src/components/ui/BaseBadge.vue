<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'gold' | 'cyan' | 'success' | 'danger' | 'warning' | 'muted' | 'info'
  size?: 'sm' | 'md'
}>(), {
  variant: 'gold',
  size: 'sm',
})

const classes = computed(() => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  }

  const variantClasses = {
    gold: 'bg-gold-muted text-gold border border-border-gold',
    cyan: 'bg-cyan-muted text-cyan border border-border-cyan',
    success: 'bg-success-muted text-success border border-success/20',
    danger: 'bg-danger-muted text-danger border border-danger/20',
    warning: 'bg-warning-muted text-warning border border-warning/20',
    muted: 'bg-white/5 text-text-muted border border-white/10',
    info: 'bg-cyan-muted text-cyan-light border border-cyan/20',
  }

  return [
    'inline-flex items-center font-semibold uppercase tracking-wider rounded-md',
    sizeClasses[props.size],
    variantClasses[props.variant],
  ]
})
</script>
