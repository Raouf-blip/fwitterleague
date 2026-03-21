<template>
  <div v-if="team" class="team-detail">
    <header class="team-header card">
      <div class="team-main">
        <div class="logo-placeholder">
          {{ team.name?.[0]?.toUpperCase() }}
        </div>
        <div class="team-info">
          <h1>{{ team.name }} [{{ team.tag }}]</h1>
          <p class="description">{{ team.description }}</p>
        </div>
      </div>
      <div v-if="isCaptain" class="header-actions">
         <button @click="editing = true" class="btn btn-secondary">Modifier</button>
      </div>
      <div v-else-if="authStore.user && !isMember" class="header-actions">
         <button @click="applyToTeam" class="btn btn-primary" :disabled="applying">
           {{ applying ? 'Envoi...' : 'Postuler' }}
         </button>
      </div>
    </header>

    <div class="team-content grid">
      <section class="roster-section card">
        <h3>Roster ({{ members.length }}/6)</h3>
        <div class="member-list">
          <div v-for="member in members" :key="member.id" class="member-item">
            <div class="member-info">
              <span class="role-icon">{{ getRoleIcon(member.role) }}</span>
              <span class="username">{{ member.profile?.username }}</span>
              <span class="rank">{{ member.profile?.rank || 'Unranked' }}</span>
            </div>
            <div v-if="isCaptain && member.profile_id !== authStore.profile.id" class="member-actions">
               <button @click="kickMember(member)" class="btn btn-secondary btn-sm">Renvoyer</button>
            </div>
          </div>
          <div v-for="i in (6 - members.length)" :key="'empty-'+i" class="member-item empty">
            <span class="placeholder">Emplacement libre</span>
          </div>
        </div>
      </section>

      <section class="stats-section card">
        <h3>Statistiques d'Équipe</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="label">Matchs Joués</span>
            <span class="value">0</span>
          </div>
          <div class="stat-item">
            <span class="label">Victoires</span>
            <span class="value">0</span>
          </div>
          <div class="stat-item">
            <span class="label">Winrate</span>
            <span class="value">0%</span>
          </div>
        </div>
      </section>
    </div>
  </div>
  <div v-else-if="loading" class="loading">Chargement de l'équipe...</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { api } from '../lib/api'

const route = useRoute()
const authStore = useAuthStore()
const team = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const applying = ref(false)
const editing = ref(false)

const isCaptain = computed(() => {
  return authStore.profile && team.value && team.value.captain_id === authStore.profile.id
})

const isMember = computed(() => {
  return members.value.some(m => m.profile_id === authStore.profile?.id)
})

onMounted(async () => {
  await fetchTeamData()
})

async function fetchTeamData() {
  try {
    const data = await api.get(`/teams/${route.params.id}`)
    team.value = data
    members.value = data.members || []
  } catch (e) {
    console.error('FetchTeamData error:', e)
  }
  loading.value = false
}

function getRoleIcon(role: string) {
  const roles: any = {
    'Top': '🛡️',
    'Jungle': '⚔️',
    'Mid': '🔮',
    'ADC': '🏹',
    'Support': '⛑️',
    'Captain': '👑'
  }
  return roles[role] || '👤'
}

async function applyToTeam() {
  if (!authStore.user) return
  applying.value = true
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Route backend : POST /api/v1/recruitment/apply/:teamId
    await api.post(`/recruitment/apply/${team.value.id}`, {
      message: `${authStore.profile.username} souhaite rejoindre votre équipe.`
    }, session?.access_token)

    alert('Candidature envoyée !')
  } catch (e: any) {
    alert(e.message)
  } finally {
    applying.value = false
  }
}

async function kickMember(member: any) {
  if (!confirm(`Renvoyer ${member.profile?.username} ?`)) return
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    // Route backend : DELETE /api/v1/teams/:id/members/:profileId
    await api.delete(`/teams/${team.value.id}/members/${member.profile_id}`, session?.access_token)
    await fetchTeamData()
    alert('Joueur expulsé.')
  } catch (e: any) {
    alert(e.message)
  }
}
</script>

<style scoped>
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  margin-bottom: 2rem;
}

.team-main {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.logo-placeholder {
  width: 100px;
  height: 100px;
  background: var(--accent-color);
  color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  font-weight: bold;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
}

.member-item.empty {
  border: 1px dashed rgba(255,255,255,0.2);
  background: transparent;
  color: #666;
  justify-content: center;
}

.member-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.role-icon {
  font-size: 1.2rem;
}

.username {
  font-weight: bold;
}

.rank {
  color: var(--accent-color);
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .label {
  font-size: 0.8rem;
  color: #888;
}

.stat-item .value {
  font-size: 1.5rem;
  color: var(--primary-color);
  font-weight: bold;
}
</style>
