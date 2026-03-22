<template>
  <component
    :is="to ? 'RouterLink' : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled || loading"
    :class="classes"
    class="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold/50"
  >
    <Loader2 v-if="loading" class="animate-spin" :size="iconSize" />
    <slot v-else name="icon" />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'cyan'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  to?: string | object
  type?: string
}>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
})

const iconSize = computed(() => {
  if (props.size === 'sm') return 14
  if (props.size === 'lg') return 20
  return 16
})

const classes = computed(() => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  }

  const variantClasses = {
    primary: 'bg-gold text-body hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20 active:scale-[0.97]',
    secondary: 'border border-border-gold text-gold hover:bg-gold-muted hover:border-gold active:scale-[0.97]',
    danger: 'bg-danger text-white hover:bg-red-500 hover:shadow-lg hover:shadow-danger/20 active:scale-[0.97]',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5',
    cyan: 'bg-cyan text-body hover:bg-cyan-light hover:shadow-lg hover:shadow-cyan/20 active:scale-[0.97]',
  }

  return [sizeClasses[props.size], variantClasses[props.variant]]
})
</script>
