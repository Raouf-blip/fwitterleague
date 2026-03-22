<template>
  <div
    :class="[sizeClasses, 'rounded-full flex items-center justify-center font-bold uppercase shrink-0 bg-gradient-to-br from-gold-dark to-gold text-body']"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="w-full h-full rounded-full object-cover"
    />
    <span v-else :class="textSizeClass">{{ initial }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getInitial } from '../../lib/formatters'

const props = withDefaults(defineProps<{
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md',
})

const initial = computed(() => getInitial(props.name))

const sizeClasses = computed(() => ({
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
}[props.size]))

const textSizeClass = computed(() => ({
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
}[props.size]))
</script>
