import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<any | null>(null)
  const loading = ref(true)

  async function fetchProfile() {
    if (!user.value) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      try {
        const data = await api.get('/profiles/me', token)
        profile.value = data
      } catch (e: any) {
        // Si le profil n'existe pas, on le crée (cas d'un nouvel utilisateur)
        if (e.message.includes('Profil non existant') || e.message.includes('404')) {
          const username = user.value.user_metadata?.username || user.value.email?.split('@')[0]
          await api.patch('/profiles/me', { username }, token)
          const data = await api.get('/profiles/me', token)
          profile.value = data
        } else {
          throw e
        }
      }
    } catch (e) {
      console.error('Erreur API Profil:', e)
    }
  }

  async function initialize() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    if (user.value) {
      await fetchProfile()
    }
    
    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) {
        await fetchProfile()
      } else {
        profile.value = null
      }
    })
    loading.value = false
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return { user, profile, loading, initialize, fetchProfile, signOut }
})
