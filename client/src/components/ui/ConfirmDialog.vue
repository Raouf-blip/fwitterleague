<template>
  <BaseModal :model-value="modelValue" :title="title" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <p class="text-text-secondary text-sm">{{ message }}</p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" size="sm" @click="$emit('update:modelValue', false)">Annuler</BaseButton>
        <BaseButton :variant="variant" size="sm" :loading="loading" @click="$emit('confirm')">
          {{ confirmLabel }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'primary' | 'danger'
  loading?: boolean
}>(), {
  confirmLabel: 'Confirmer',
  variant: 'danger',
  loading: false,
})

defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>
