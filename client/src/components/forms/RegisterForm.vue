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
      placeholder="Min. 6 caractères"
      required
    />
    <BaseInput
      v-model="riotId"
      label="Riot ID"
      placeholder="Pseudo#TAG"
      required
      :error="riotError"
    />

    <div class="p-3 rounded-lg bg-white/5 border border-white/10">
      <p class="text-[10px] font-black uppercase tracking-widest text-[#5865F2] mb-1">Information Discord</p>
      <p class="text-xs text-text-secondary leading-relaxed">
        La synchronisation Discord se fera dans un second temps depuis votre profil pour garantir la liaison officielle avec le Bot.
      </p>
    </div>

    <RoleSelector
      v-model="preferredRoles"
      label="Postes préférés (Max 2)"
    />

    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <!-- Step indicator during signup -->
    <div v-if="step !== 'idle'" class="flex items-center gap-3 p-3 rounded-lg bg-cyan-muted/20 border border-cyan/20">
      <Loader2 :size="16" class="animate-spin text-cyan" />
      <span class="text-sm text-cyan">{{ stepLabel }}</span>
    </div>

    <BaseButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full">
      Créer mon compte
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/auth'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'
import RoleSelector from '../ui/RoleSelector.vue'

const emit = defineEmits<{ success: [] }>()

const username = ref('')
const email = ref('')
const password = ref('')
const riotId = ref('')
const discord = ref('')
const preferredRoles = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const riotError = ref('')
const step = ref<'idle' | 'creating' | 'saving' | 'syncing'>('idle')

const stepLabel = computed(() => {
  switch (step.value) {
    case 'creating': return 'Création du compte...'
    case 'saving': return 'Sauvegarde du profil...'
    case 'syncing': return 'Synchronisation Riot...'
    default: return ''
  }
})

async function handleSubmit() {
  error.value = ''
  riotError.value = ''

  if (password.value.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères'
    return
  }
  if (riotId.value && !riotId.value.includes('#')) {
    riotError.value = 'Format invalide. Utilisez Pseudo#TAG'
    return
  }

  loading.value = true

  try {
    // Step 1: Create the account
    step.value = 'creating'
    const { data: authData, error: err } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { data: { username: username.value } },
    })
    if (err) throw err

    // Step 2: Save profile data (riot_id + discord)
    const session = authData.session
    if (session) {
      step.value = 'saving'
      const token = session.access_token
      await api.patch('/profiles/me', {
        username: username.value,
        riot_id: riotId.value || null,
        discord: discord.value || null,
        preferred_roles: preferredRoles.value,
        is_looking_for_team: true,
      }, token)

      // Step 3: Auto-sync Riot data
      if (riotId.value && riotId.value.includes('#')) {
        step.value = 'syncing'
        try {
          await api.post('/profiles/sync-riot', { riotId: riotId.value }, token)
        } catch (syncErr) {
          // Riot sync failure is non-blocking
          console.warn('Riot sync failed during registration', syncErr)
        }
      }

      // Step 4: Refresh local profile in store to ensure it's ready
      const authStore = useAuthStore()
      await authStore.fetchProfile(token)
    }

    step.value = 'idle'
    emit('success')
  } catch (e: any) {
    error.value = e.message || "Erreur lors de l'inscription"
    step.value = 'idle'
  } finally {
    loading.value = false
  }
}
</script>
