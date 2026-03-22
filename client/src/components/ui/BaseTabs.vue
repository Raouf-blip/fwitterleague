<template>
  <div class="flex gap-1 border-b border-border">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="[
        'px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all duration-200 border-b-2 -mb-px cursor-pointer',
        modelValue === tab.key
          ? 'text-gold border-gold'
          : 'text-text-muted border-transparent hover:text-text-secondary hover:border-white/10',
      ]"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined"
        :class="[
          'ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full',
          modelValue === tab.key ? 'bg-gold-muted text-gold' : 'bg-white/5 text-text-muted',
        ]"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tabs: Array<{ key: string; label: string; count?: number }>
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
