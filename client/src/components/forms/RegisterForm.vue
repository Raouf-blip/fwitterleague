<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <BaseInput
      v-model="username"
      label="Pseudo"
      placeholder="MonPseudo"
      required
    />
    <BaseInput
      v-model="email"
      label="Email"
      type="email"
      placeholder="ton@email.com"
      required
    />
    <BaseInput
      v-model="password"
      label="Mot de passe"
      type="password"
      placeholder="Min. 6 caracteres"
      required
    />
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    <BaseButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full">
      Creer mon compte
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'

const emit = defineEmits<{ success: [] }>()

const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caracteres'
    return
  }
  loading.value = true
  try {
    const { error: err } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { data: { username: username.value } },
    })
    if (err) throw err
    emit('success')
  } catch (e: any) {
    error.value = e.message || "Erreur lors de l'inscription"
  } finally {
    loading.value = false
  }
}
</script>
