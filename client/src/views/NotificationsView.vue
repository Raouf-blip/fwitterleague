<template>
  <div class="notifications-center">
    <header class="page-header">
      <h1>Centre de Notifications</h1>
      <p>Gérez vos invitations, candidatures et alertes système.</p>
    </header>

    <div class="tabs">
      <button @click="activeTab = 'inbox'" :class="{ active: activeTab === 'inbox' }">Boîte de réception</button>
      <button @click="activeTab = 'outbox'" :class="{ active: activeTab === 'outbox' }">Envoyés</button>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else class="tab-content">
      <!-- INBOX -->
      <div v-if="activeTab === 'inbox'" class="inbox-content">
        <section class="section">
          <h2>Reçus</h2>
          <div v-if="inbox.length === 0" class="no-data card">Rien à signaler.</div>
          <div v-else class="list">
            <div v-for="item in inbox" :key="item.id" class="item card" :class="{ 'unread': !item.is_read && item.status === 'pending' }">
              <div class="item-main">
                <div class="item-header">
                  <strong>{{ item.title || (item.type === 'offer' ? 'Invitation de recrutement' : 'Candidature reçue') }}</strong>
                  <span v-if="item.status" class="badge" :class="item.status">{{ item.status }}</span>
                  <span v-else-if="!item.is_read" class="badge new">Info</span>
                </div>
                <p>{{ item.message }}</p>
                <div v-if="item.sender && item.type === 'application'" class="sender-info">
                   Candidat : <strong>{{ item.sender.username }}</strong> ({{ item.sender.rank }})
                </div>
                <div v-if="item.team && item.type === 'offer'" class="team-info">
                   Équipe : <strong>{{ item.team.name }} [{{ item.team.tag }}]</strong>
                </div>
                <span class="date">{{ new Date(item.created_at).toLocaleString() }}</span>
              </div>
              <div class="item-actions">
                <template v-if="item.status === 'pending'">
                   <button @click="respond(item, 'accepted')" class="btn btn-primary btn-sm">Accepter</button>
                   <button @click="respond(item, 'rejected')" class="btn btn-secondary btn-sm">Refuser</button>
                </template>
                <template v-else-if="!item.status && !item.is_read">
                   <button @click="markAsRead(item.id)" class="btn btn-secondary btn-sm">Marquer comme lu</button>
                </template>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- OUTBOX -->
      <div v-if="activeTab === 'outbox'" class="outbox-content">
        <section class="section">
          <h2>Mes demandes envoyées</h2>
          <div v-if="outbox.length === 0" class="no-data card">Aucune demande envoyée.</div>
          <div v-else class="list">
            <div v-for="item in outbox" :key="item.id" class="item card">
              <div class="item-main">
                <div class="item-header">
                  <strong>{{ item.type === 'application' ? 'Candidature à une équipe' : 'Invitation d\'un joueur' }}</strong>
                  <span class="badge" :class="item.status">{{ item.status }}</span>
                </div>
                <p v-if="item.message">{{ item.message }}</p>
                <div class="target-info">
                   <template v-if="item.type === 'application'">Vers : <strong>{{ item.team?.name }}</strong></template>
                   <template v-else-if="item.type === 'offer'">Joueur invité : <strong>{{ item.sender?.username }}</strong></template>
                </div>
                <span class="date">{{ new Date(item.created_at).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const loading = ref(true)
const activeTab = ref('inbox')
const rawData = ref<any>({ notifications: [], interactions: [] })

const inbox = computed(() => {
  const notifs = rawData.value.notifications.map((n: any) => ({ ...n, isNotif: true }))
  
  // Received = 
  // 1. Applications WHERE user is captain of the team
  // 2. Offers WHERE player is the user
  const receivedApps = rawData.value.interactions.filter((i: any) => {
    const userIsCaptainOfThisTeam = authStore.profile?.team?.id === i.team_id && authStore.profile?.is_captain;
    const userIsTargetOfOffer = i.type === 'offer' && i.sender_id === authStore.user?.id;
    
    // Pour l'inbox, on veut ce qui nous est destiné ET ce qu'on a reçu (même si status n'est pas pending)
    if (i.type === 'application') return userIsCaptainOfThisTeam;
    if (i.type === 'offer') return userIsTargetOfOffer;
    return false;
  })
  
  return [...notifs, ...receivedApps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const outbox = computed(() => {
  // Sent =
  // 1. Applications WHERE player is the user
  // 2. Offers WHERE user is captain of the team
  return rawData.value.interactions.filter((i: any) => {
    const userIsApplicant = i.type === 'application' && i.sender_id === authStore.user?.id;
    const userIsInitiatorOfOffer = i.type === 'offer' && authStore.profile?.team?.id === i.team_id && authStore.profile?.is_captain;
    
    return userIsApplicant || userIsInitiatorOfOffer;
  })
})

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const data = await api.get('/social/inbox', session?.access_token)
    rawData.value = data
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

async function markAsRead(id: string) {
  const { data: { session } } = await supabase.auth.getSession()
  await api.patch(`/social/notifications/${id}`, {}, session?.access_token)
  await fetchData()
}

async function respond(item: any, status: 'accepted' | 'rejected') {
  const { data: { session } } = await supabase.auth.getSession()
  try {
    // Route backend : PATCH /api/v1/recruitment/:id/respond
    await api.patch(`/recruitment/${item.id}/respond`, { status }, session?.access_token)
    await authStore.fetchProfile()
    await fetchData()
    alert('Réponse enregistrée !')
  } catch (e: any) {
    alert(e.message || 'Une erreur est survenue')
  }
}
</script>

<style scoped>
.notifications-center {
  max-width: 800px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.tabs button {
  background: none;
  border: none;
  color: #888;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  text-transform: uppercase;
  font-weight: bold;
}

.tabs button.active {
  color: var(--accent-color);
  border-bottom: 2px solid var(--accent-color);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
}

.item.unread {
  background: rgba(11, 198, 227, 0.05);
  border-left: 4px solid var(--primary-color);
}

.item-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.badge.new { background: var(--primary-color); color: #000; }
.badge.pending { background: var(--accent-color); color: #000; }
.badge.accepted { background: #4dff4d; color: #000; }
.badge.rejected { background: #ff4d4d; color: #fff; }

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.date {
  font-size: 0.75rem;
  color: #666;
  display: block;
  margin-top: 1rem;
}

.sender-info, .team-info, .target-info {
  font-size: 0.9rem;
  color: #ccc;
  margin-top: 0.5rem;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>
