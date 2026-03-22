<template>
  <BaseModal :model-value="modelValue" title="Postuler à l'équipe" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <div class="space-y-4">
      <p class="text-sm text-text-secondary">
        Envoyer une candidature à <strong class="text-text-primary">{{ teamName }}</strong> ?
      </p>
      <BaseTextarea
        v-model="message"
        label="Message (optionnel)"
        placeholder="Présentez-vous brièvement..."
        :rows="3"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" size="sm" @click="$emit('update:modelValue', false)">Annuler</BaseButton>
        <BaseButton variant="cyan" size="sm" :loading="loading" @click="$emit('submit', message)">
          Envoyer
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '../ui/BaseModal.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseButton from '../ui/BaseButton.vue'

defineProps<{
  modelValue: boolean
  teamName: string
  loading?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [message: string]
}>()

const message = ref('')
</script>
