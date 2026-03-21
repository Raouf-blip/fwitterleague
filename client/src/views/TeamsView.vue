<template>
  <div class="teams-view">
    <header class="page-header">
      <h1>Équipes</h1>
      <p>Découvrez les structures engagées dans la ligue.</p>
    </header>

    <div v-if="loading" class="loading">Chargement des équipes...</div>
    <div v-else-if="teams.length === 0" class="no-data">Aucune équipe n'a été créée pour le moment.</div>
    <div v-else class="grid">
      <div v-for="team in teams" :key="team.id" class="card team-card">
        <div class="team-header">
          <div class="logo-placeholder">
             {{ team.name?.[0]?.toUpperCase() }}
          </div>
          <div class="team-meta">
            <h3>{{ team.name }} [{{ team.tag }}]</h3>
          </div>
        </div>
        <p class="description">{{ team.description || 'Pas de description.' }}</p>
        <div class="card-footer">
          <button v-if="canApply(team)" @click="applyToTeam(team)" class="btn btn-primary btn-sm" :disabled="isPending(team)">
            {{ isPending(team) ? 'En attente...' : 'Postuler' }}
          </button>
          <RouterLink :to="'/teams/' + team.id" class="btn btn-secondary btn-sm">Voir Détails</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { api } from '../lib/api'

const authStore = useAuthStore()
const teams = ref<any[]>([])
const myApplications = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  try {
    const data = await api.get('/teams')
    teams.value = data

    if (authStore.user) {
      const { data: { session } } = await supabase.auth.getSession()
      const myApps = await api.get('/profiles/me/applications', session?.access_token)
      myApplications.value = myApps
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function canApply(team: any) {
  // Un joueur peut postuler s'il est connecté et n'a pas encore d'équipe
  return authStore.user && !authStore.profile?.team && authStore.profile?.id !== team.captain_id
}

function isPending(team: any) {
  return myApplications.value.some(app => app.team_id === team.id && app.status === 'pending')
}

async function applyToTeam(team: any) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    // Route backend : POST /api/v1/recruitment/apply/:teamId
    await api.post(`/recruitment/apply/${team.id}`, { message: "Je souhaite rejoindre votre équipe !" }, session?.access_token)
    alert('Candidature envoyée !')
    await fetchData()
  } catch (err: any) {
    alert(err.message)
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.team-card {
  display: flex;
  flex-direction: column;
}

.team-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.logo-placeholder {
  width: 60px;
  height: 60px;
  background: var(--accent-color);
  color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  font-weight: bold;
}

.team-meta h3 {
  margin: 0;
}

.description {
  font-size: 0.9rem;
  color: #ccc;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.card-footer {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  flex: 1;
}
</style>
