<template>
  <div v-if="authStore.profile" class="profile">
    <div class="profile-header card">
      <div class="profile-main">
        <div class="avatar-placeholder">
          {{ authStore.profile.username?.[0]?.toUpperCase() }}
        </div>
        <div class="profile-info">
          <h2>{{ authStore.profile.username }}</h2>
          <p class="riot-id">{{ authStore.profile.riot_id || 'Riot ID non configuré' }}</p>
          <div class="stats">
            <div class="stat-item">
              <span class="label">Rang</span>
              <span class="value">{{ authStore.profile.rank || 'Unranked' }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Winrate</span>
              <span class="value">{{ authStore.profile.winrate }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-actions">
         <button @click="logout" class="btn btn-secondary">Déconnexion</button>
      </div>
    </div>

    <div class="profile-content grid">
      <!-- Paramètres du profil -->
      <div class="settings-card card">
        <h3>Paramètres</h3>
        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label>Riot ID (GameName#TagLine)</label>
            <div class="input-with-button">
              <input type="text" v-model="form.riot_id" placeholder="Pseudo#TAG" />
              <button type="button" @click="fetchRiotData" class="btn btn-secondary btn-sm" :disabled="fetchingRiot">
                {{ fetchingRiot ? 'Sync...' : 'Sync Riot' }}
              </button>
            </div>
          </div>
          <div class="form-group" v-if="opggUrl">
            <label>Lien OP.GG</label>
            <div class="opgg-preview">
               <a :href="opggUrl" target="_blank" class="accent-link">Voir mon OP.GG ↗</a>
            </div>
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea v-model="form.bio" placeholder="Parlez-nous de vous..."></textarea>
          </div>

          <div class="form-group checkbox">
            <input type="checkbox" id="looking" v-model="form.is_looking_for_team" />
            <label for="looking">Je cherche une équipe</label>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="savingProfile">
            {{ savingProfile ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </form>
      </div>

      <!-- Gestion d'Équipe -->
      <div class="team-card card">
        <h3>Mon Équipe</h3>
        <div v-if="team" class="team-info">
          <h4>{{ team.name }} [{{ team.tag }}]</h4>
          <p>{{ team.description }}</p>
          <RouterLink :to="'/teams/' + team.id" class="btn btn-secondary">Voir l'équipe</RouterLink>
        </div>
        <div v-else-if="!creatingTeam" class="no-team">
          <p>Vous n'avez pas encore d'équipe.</p>
          <div class="team-actions">
            <button @click="creatingTeam = true" class="btn btn-primary">Créer une équipe</button>
          </div>
        </div>
        <div v-else class="create-team-form">
          <form @submit.prevent="createTeam">
            <div class="form-group">
              <label>Nom de l'équipe</label>
              <input type="text" v-model="teamForm.name" required />
            </div>
            <div class="form-group">
              <label>Tag (3-4 caractères)</label>
              <input type="text" v-model="teamForm.tag" maxlength="4" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="teamForm.description"></textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="savingTeam">
                 {{ savingTeam ? 'Création...' : 'Créer' }}
              </button>
              <button type="button" @click="creatingTeam = false" class="btn btn-secondary">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Section Notifications & Candidatures -->
    <div class="dashboard-grid grid">
      <!-- Mes Notifications (Reçues) -->
      <section class="section card">
        <h3>Notifications</h3>
        <div v-if="notifications.length === 0" class="no-data">Aucune notification.</div>
        <div v-else class="notification-list">
          <div v-for="notif in notifications" :key="notif.id" class="notification-item" :class="{ 'unread': !notif.is_read }">
            <div class="notif-content">
              <strong>{{ notif.title }}</strong>
              <p>{{ notif.message }}</p>
              <span class="notif-date">{{ new Date(notif.created_at).toLocaleDateString() }}</span>
            </div>
            <div class="notif-actions">
               <button v-if="!notif.is_read" @click="markAsRead(notif.id)" class="btn btn-sm btn-secondary">Lu</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Mes Candidatures Envoyées -->
      <section class="section card">
        <h3>Candidatures Envoyées</h3>
        <div v-if="sentApplications.length === 0" class="no-data">Aucune candidature envoyée.</div>
        <div v-else class="sent-apps-list">
          <div v-for="app in sentApplications" :key="app.id" class="app-item">
            <div class="app-info">
              <strong>{{ app.team?.name }} [{{ app.team?.tag }}]</strong>
              <span class="status-badge" :class="app.status">{{ app.status }}</span>
            </div>
            <p class="app-message" v-if="app.message">{{ app.message }}</p>
            <span class="notif-date">{{ new Date(app.created_at).toLocaleDateString() }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
  <div v-else-if="!authStore.loading" class="error-container card">
    <h2>Oups ! Profil introuvable.</h2>
    <p>Il semble que votre profil n'ait pas été créé correctement lors de l'inscription.</p>
    <button @click="logout" class="btn btn-primary">Retour à l'accueil</button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const savingProfile = ref(false)
const savingTeam = ref(false)
const fetchingRiot = ref(false)
const creatingTeam = ref(false)
const team = ref<any>(null)
const notifications = ref<any[]>([])
const sentApplications = ref<any[]>([])

const form = reactive({
  riot_id: '',
  bio: '',
  rank: 'Unranked',
  winrate: 0,
  is_looking_for_team: false
})

const opggUrl = computed(() => {
  if (!form.riot_id || !form.riot_id.includes('#')) return null
  const parts = form.riot_id.split('#')
  if (parts.length < 2 || !parts[1]) return null
  return `https://www.op.gg/summoners/euw/${encodeURIComponent(parts[0])}-${encodeURIComponent(parts[1])}`
})

const teamForm = reactive({
  name: '',
  tag: '',
  description: ''
})

watch(() => authStore.profile, (newProfile) => {
  if (newProfile) {
    form.riot_id = newProfile.riot_id || ''
    form.bio = newProfile.bio || ''
    form.rank = newProfile.rank || 'Unranked'
    form.winrate = newProfile.winrate || 0
    form.is_looking_for_team = newProfile.is_looking_for_team || false
    team.value = newProfile.team
  }
}, { immediate: true })

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  if (authStore.user) {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    try {
      // Le serveur renvoie { notifications: [], interactions: [] }
      const res = await api.get('/social/inbox', token)
      notifications.value = res.notifications || []

      // Route /profiles/me/applications existe et renvoie les candidatures envoyées
      const apps = await api.get('/profiles/me/applications', token)
      sentApplications.value = apps
    } catch (e) {
      console.error('FetchData error:', e)
    }
  }
}

async function markAsRead(id: string) {
  const { data: { session } } = await supabase.auth.getSession()
  try {
    await api.patch(`/social/notifications/${id}`, {}, session?.access_token)
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function fetchRiotData() {
  if (!form.riot_id.includes('#')) {
    notificationStore.show('Format invalide. Utilisez GameName#TagLine', 'error')
    return
  }

  fetchingRiot.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const data = await api.post('/profiles/sync-riot', { riotId: form.riot_id }, session?.access_token)

    form.rank = data.rank
    form.winrate = data.winrate
    notificationStore.show('Données Riot synchronisées !')
  } catch (err: any) {
    notificationStore.show('Erreur: ' + err.message, 'error')
  } finally {
    fetchingRiot.value = false
  }
}

async function updateProfile() {
  if (!authStore.user) return
  
  savingProfile.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    await api.patch('/profiles/me', {
      riot_id: form.riot_id,
      bio: form.bio,
      rank: form.rank,
      winrate: form.winrate,
      is_looking_for_team: form.is_looking_for_team,
      opgg_url: opggUrl.value
    }, session?.access_token)
    
    await authStore.fetchProfile()
    notificationStore.show('Profil mis à jour !')
  } catch (err: any) {
    notificationStore.show('Erreur: ' + err.message, 'error')
  } finally {
    savingProfile.value = false
  }
}

async function createTeam() {
  savingTeam.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    await api.post('/teams', {
      name: teamForm.name,
      tag: teamForm.tag,
      description: teamForm.description
    }, session?.access_token)

    creatingTeam.value = false
    await authStore.fetchProfile()
    await fetchData()
    notificationStore.show('Équipe créée avec succès !')
  } catch (err: any) {
    notificationStore.show('Erreur équipe: ' + err.message, 'error')
  } finally {
    savingTeam.value = false
  }
}

async function logout() {
  await authStore.signOut()
  router.push('/')
}
</script>

<style scoped>
/* (Style inchangé) */
.error-container {
  text-align: center;
  padding: 4rem;
  margin-top: 2rem;
}

.dashboard-grid {
  margin-top: 2rem;
  align-items: start;
}

.no-data {
  text-align: center;
  color: #888;
  padding: 2rem 0;
}

.notification-item, .app-item {
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notif-content, .app-info {
  flex: 1;
}

.notif-date {
  font-size: 0.75rem;
  color: #666;
  display: block;
  margin-top: 0.2rem;
}

.notification-item.unread {
  border-left: 3px solid var(--primary-color);
  background: rgba(11, 198, 227, 0.03);
}

.app-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.app-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.app-message {
  font-size: 0.9rem;
  color: #ccc;
  font-style: italic;
  margin: 0;
}

.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: bold;
}

.status-badge.pending { background: #c89b3c; color: #000; }
.status-badge.accepted { background: #4dff4d; color: #000; }
.status-badge.rejected { background: #ff4d4d; color: #fff; }

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 2rem;
}

.profile-main {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  background: var(--accent-color);
  color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  font-weight: bold;
  border-radius: 50%;
}

.stats {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
}

.stat-item .value {
  font-size: 1.2rem;
  color: var(--accent-color);
  font-weight: bold;
}

.card {
  background: rgba(30, 35, 40, 0.7);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
}

input[type="text"], textarea {
  width: 100%;
  padding: 0.7rem;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border-color);
  color: white;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.no-team {
  text-align: center;
  padding: 2rem 0;
}

.create-team-form {
  margin-top: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
