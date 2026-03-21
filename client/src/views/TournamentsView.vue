<template>
  <div class="tournaments-view">
    <header class="page-header">
      <h1>Tournois & Compétitions</h1>
      <p>Suivez les événements en cours et inscrivez votre équipe.</p>
    </header>

    <div v-if="loading" class="loading">Chargement des tournois...</div>
    <div v-else class="grid">
      <div v-for="tournament in tournaments" :key="tournament.id" class="card tournament-card">
        <div class="tournament-header">
          <h3>{{ tournament.name }}</h3>
          <span class="badge" :class="tournament.status">{{ tournament.status }}</span>
        </div>
        <p>{{ tournament.description }}</p>
        <div class="tournament-info">
          <span>📅 {{ new Date(tournament.start_date).toLocaleDateString() }}</span>
          <span>👥 {{ tournament.registrations?.[0]?.count || 0 }}/{{ tournament.max_teams }} Équipes</span>
        </div>
        <div class="card-footer">
          <button v-if="canRegister(tournament)" @click="registerTeam(tournament)" class="btn btn-primary btn-sm">Inscrire mon équipe</button>
          <button class="btn btn-secondary btn-sm">Voir Classement</button>
        </div>
      </div>
    </div>

    <section v-if="matches.length > 0" class="matches-section section card">
      <h2>Matchs Récents</h2>
      <div class="match-list">
        <div v-for="match in matches" :key="match.id" class="match-item">
          <div class="team team-1" :class="{ 'winner': match.winner_id === match.team_1_id }">
            {{ match.team_1?.name }}
          </div>
          <div class="score">
            {{ match.score_1 ?? '-' }} : {{ match.score_2 ?? '-' }}
          </div>
          <div class="team team-2" :class="{ 'winner': match.winner_id === match.team_2_id }">
            {{ match.team_2?.name }}
          </div>
          <div class="match-status badge" :class="match.status">{{ match.status }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

import { api } from '../lib/api'

const authStore = useAuthStore()
const tournaments = ref<any[]>([])
const matches = ref<any[]>([])
const loading = ref(true)
const userTeamId = ref<string | null>(null)

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  try {
    tournaments.value = await api.get('/tournaments')
    matches.value = await api.get('/tournaments/matches')

    if (authStore.profile) {
       // Utilisation de /profiles/me pour simplifier
       const me = await api.get('/profiles/me', (await supabase.auth.getSession()).data.session?.access_token)
       userTeamId.value = me.team?.id || null
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function canRegister(tournament: any) {
  return tournament.status === 'upcoming' && authStore.profile?.is_captain
}

async function registerTeam(tournament: any) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    // Route backend : POST /api/v1/tournaments/:id/register
    await api.post(`/tournaments/${tournament.id}/register`, {}, session?.access_token)
    alert('Inscription réussie !')
    await fetchData()
  } catch (e: any) {
    alert(e.message || 'Une erreur est survenue lors de l\'inscription.')
  }
}
</script>

<style scoped>
.tournament-card {
  display: flex;
  flex-direction: column;
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tournament-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #888;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
}

.team {
  flex: 1;
  font-weight: bold;
}

.team-2 { text-align: right; }

.winner { color: var(--accent-color); }

.score {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0 1.5rem;
}

.badge.open { color: #4dff4d; border: 1px solid #4dff4d; }
.badge.ongoing { color: var(--primary-color); border: 1px solid var(--primary-color); }
</style>
