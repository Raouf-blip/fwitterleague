<template>
  <div v-if="loading" class="loading-container">
    <div class="loading">Chargement du profil...</div>
  </div>
  <div v-else-if="profile" class="profile-detail profile-detail-view">
    <header class="profile-header card">
      <div class="profile-main">
        <div class="avatar-placeholder">
          {{ profile.username?.[0]?.toUpperCase() }}
        </div>
        <div class="profile-info">
          <h2>{{ profile.username }}</h2>
          <div class="riot-id-row">
            <p class="riot-id">{{ profile.riot_id || 'Riot ID non configuré' }}</p>
            <a v-if="profile.riot_id" :href="opggUrl" target="_blank" class="opgg-link">
               <img src="https://s-lol-light.op.gg/static/images/site/common/favicon.py" width="16" height="16" /> OP.GG
            </a>
          </div>
          <div class="stats">
            <div class="stat-item">
              <span class="label">Rang</span>
              <span class="value">{{ profile.rank || 'Unranked' }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Winrate</span>
              <span class="value">{{ profile.winrate }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-actions" v-if="authStore.profile?.is_captain && !hasTeam">
         <button @click="recruitPlayer" class="btn btn-primary">Recruter</button>
      </div>
    </header>

    <div class="profile-content grid">
      <div class="bio-card card">
        <h3>Bio</h3>
        <p class="bio-text">{{ profile.bio || 'Cet utilisateur n\'a pas encore de bio.' }}</p>
      </div>

      <div class="team-card card">
        <h3>Équipe</h3>
        <div v-if="team" class="team-info">
          <h4>{{ team.name }} [{{ team.tag }}]</h4>
          <p>{{ team.description }}</p>
          <RouterLink :to="'/teams/' + team.id" class="btn btn-secondary">Voir l'équipe</RouterLink>
        </div>
        <div v-else class="no-team">
          <p>Ce joueur n'a pas encore d'équipe.</p>
          <span v-if="profile.is_looking_for_team" class="badge open">Cherche une équipe</span>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="error-container">
    <p>Profil non trouvé.</p>
    <RouterLink to="/agents" class="btn btn-primary">Retour aux agents</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

import { api } from '../lib/api'

const route = useRoute()
const authStore = useAuthStore()
const profile = ref<any>(null)
const team = ref<any>(null)
const loading = ref(true)

const opggUrl = computed(() => {
  if (!profile.value?.riot_id || !profile.value.riot_id.includes('#')) return null
  const [name, tag] = profile.value.riot_id.split('#')
  return `https://www.op.gg/summoners/euw/${encodeURIComponent(name)}-${encodeURIComponent(tag)}`
})

const hasTeam = computed(() => !!team.value)

onMounted(async () => {
  try {
    const data = await api.get(`/profiles/${route.params.id}`)
    profile.value = data
    team.value = data.team
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})

async function recruitPlayer() {
  if (!authStore.profile?.is_captain || !profile.value) return

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    
    // Route backend : POST /api/v1/recruitment/invite/:playerId
    await api.post(`/recruitment/invite/${profile.value.id}`, {
      team_id: authStore.profile?.team?.id,
      message: `L'équipe ${authStore.profile?.team?.name} souhaite vous recruter.`
    }, token)

    alert('Offre de recrutement envoyée !')
  } catch (err: any) {
    alert('Erreur: ' + (err.message || "Impossible d'envoyer l'invitation"))
  }
}
</script>

<style scoped>
.profile-detail {
  padding-bottom: 4rem;
}

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

.riot-id-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.riot-id {
  color: var(--accent-color);
  font-weight: bold;
  margin: 0;
}

.opgg-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #ccc;
  text-decoration: none;
  background: rgba(255,255,255,0.05);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1);
}

.opgg-link:hover {
  background: rgba(11, 198, 227, 0.1);
  color: var(--accent-color);
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

h3 {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.bio-text {
  line-height: 1.6;
  color: #ccc;
}

.badge.open {
  color: #4dff4d;
  border: 1px solid #4dff4d;
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
}

.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  flex-direction: column;
  gap: 1rem;
}
</style>
