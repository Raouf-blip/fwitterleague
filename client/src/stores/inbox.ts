import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from './auth'
import type { AppNotification, Application } from '../types'

export const useInboxStore = defineStore('inbox', () => {
  const authStore = useAuthStore()
  const notifications = ref<AppNotification[]>([])
  const applications = ref<Application[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => {
    // 1. Notifications non lues
    const unreadNotifs = notifications.value.filter(n => !n.is_read).length

    // 2. Candidatures / Invitations en attente qui me concernent
    const pendingInteractions = applications.value.filter(i => {
      if (i.status !== 'pending') return false

      const isCaptain = authStore.profile?.is_captain
      const teamId = authStore.profile?.team?.id

      // Si c'est une candidature de joueur -> seulement si je suis capitaine de l'équipe
      if (i.type === 'application') {
        return isCaptain && i.team_id === teamId
      }

      // Si c'est une invitation d'équipe -> seulement si je suis le destinataire
      if (i.type === 'offer') {
        return i.sender_id === authStore.user?.id
      }

      return false
    }).length

    return unreadNotifs + pendingInteractions
  })

  async function fetchInbox() {
    if (!authStore.user) return
    loading.value = true
    try {
      const token = await getToken()
      const res = await api.get('/social/inbox', token)
      notifications.value = res.notifications || []
      applications.value = res.interactions || []
    } catch (e) {
      console.error('Failed to fetch inbox:', e)
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string) {
    try {
      const token = await getToken()
      await api.patch(`/social/notifications/${id}`, { is_read: true }, token)
      const notif = notifications.value.find(n => n.id === id)
      if (notif) notif.is_read = true
    } catch (e) {
      console.error('Failed to mark notification as read:', e)
    }
  }

  async function markAllAsRead() {
    try {
      const token = await getToken()
      await api.post('/social/notifications/read-all', {}, token)
      notifications.value.forEach(n => n.is_read = true)
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e)
    }
  }

  return {
    notifications,
    applications,
    loading,
    unreadCount,
    fetchInbox,
    markAsRead,
    markAllAsRead
  }
})
