<template>
  <BaseModal :model-value="modelValue" title="Recruter un joueur" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <div class="space-y-4">
      <p class="text-sm text-text-secondary">
        Inviter <strong class="text-text-primary">{{ playerName }}</strong> à rejoindre votre équipe ?
      </p>
      <BaseTextarea
        v-model="message"
        label="Message (optionnel)"
        placeholder="Un mot pour le joueur..."
        :rows="3"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" size="sm" @click="$emit('update:modelValue', false)">Annuler</BaseButton>
        <BaseButton variant="primary" size="sm" :loading="loading" @click="$emit('submit', message)">
          Envoyer l'invitation
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../ui/BaseModal.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps<{
  modelValue: boolean
  playerName: string
  loading?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [message: string]
}>()

const message = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    message.value = ''
  }
})
</script>
