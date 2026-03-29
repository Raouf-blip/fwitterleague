import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { clearTokenCache } from '../composables/useAuth'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)
  const profileLoading = ref(false)

  async function fetchProfile(token?: string) {
    if (!user.value) return
    profileLoading.value = true
    try {
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token
      }
      try {
        const data = await api.get('/profiles/me', token)
        profile.value = data
      } catch (e: any) {
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
    } finally {
      profileLoading.value = false
    }
  }

  async function initialize() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    loading.value = false
    if (user.value && session) {
      fetchProfile(session.access_token)
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTokenCache()
      user.value = session?.user ?? null
      if (user.value && session) {
        fetchProfile(session.access_token)
      } else {
        profile.value = null
      }
    })
  }

  async function signOut() {
    clearTokenCache()
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return { user, profile, loading, profileLoading, initialize, fetchProfile, signOut }
})
