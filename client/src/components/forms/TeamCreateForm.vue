<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <BaseInput
      v-model="name"
      label="Nom de l'equipe"
      placeholder="Les Invincibles"
      required
    />
    <BaseInput
      v-model="tag"
      label="Tag (max 4 caracteres)"
      placeholder="INVC"
      required
      :maxlength="4"
    />
    <BaseTextarea
      v-model="description"
      label="Description"
      placeholder="Presentation de l'equipe..."
      :rows="3"
    />
    <div class="flex gap-3">
      <BaseButton type="submit" variant="primary" :loading="loading">
        {{ submitLabel }}
      </BaseButton>
      <BaseButton type="button" variant="ghost" @click="$emit('cancel')">
        Annuler
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseButton from '../ui/BaseButton.vue'

const props = withDefaults(defineProps<{
  initialName?: string
  initialTag?: string
  initialDescription?: string
  loading?: boolean
  submitLabel?: string
}>(), {
  submitLabel: 'Creer',
})

const emit = defineEmits<{
  submit: [data: { name: string; tag: string; description: string }]
  cancel: []
}>()

const name = ref(props.initialName || '')
const tag = ref(props.initialTag || '')
const description = ref(props.initialDescription || '')

function handleSubmit() {
  if (!name.value.trim() || !tag.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    tag: tag.value.trim().toUpperCase(),
    description: description.value.trim(),
  })
}
</script>
