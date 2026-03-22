<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
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
      placeholder="••••••••"
      required
    />
    <div class="flex justify-end">
      <router-link to="/forgot-password" class="text-sm text-gold hover:text-gold-light transition-colors">
        Mot de passe oublié ?
      </router-link>
    </div>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    <BaseButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full">
      Se connecter
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'

const emit = defineEmits<{ success: [] }>()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (err) throw err
    emit('success')
  } catch (e: any) {
    error.value = e.message || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>
