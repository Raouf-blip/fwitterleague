<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-text-secondary">{{ label }}</label>
    <select
      :value="modelValue"
      :disabled="disabled"
      class="w-full bg-surface-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 disabled:opacity-50 cursor-pointer appearance-none"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled class="text-text-muted">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="bg-surface-elevated text-text-primary"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  disabled?: boolean
  options: Array<{ value: string; label: string }>
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
