<template>
  <div class="agents-view">
    <header class="page-header">
      <h1>Agents Libres</h1>
      <p>Joueurs à la recherche d'une équipe pour la saison.</p>
    </header>

    <div class="filters card">
      <div class="filter-group">
        <label>Rang</label>
        <select v-model="filterRank">
          <option value="">Tous les rangs</option>
          <option value="Challenger">Challenger</option>
          <option value="Grandmaster">Grandmaster</option>
          <option value="Master">Master</option>
          <option value="Diamond">Diamond</option>
          <option value="Emerald">Emerald</option>
          <option value="Platinum">Platinum</option>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Bronze">Bronze</option>
          <option value="Iron">Iron</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Chargement des agents...</div>
    <div v-else class="grid">
      <div v-for="agent in filteredAgents" :key="agent.id" class="card agent-card">
        <div class="agent-header">
          <h3>{{ agent.username }}</h3>
          <span class="badge rank-badge">{{ agent.rank || 'Unranked' }}</span>
        </div>
        <p class="riot-id">{{ agent.riot_id || 'ID Masqué' }}</p>
        <p class="bio">{{ agent.bio || 'Aucune description.' }}</p>
        <div class="roles">
           <span v-for="role in agent.preferred_roles" :key="role" class="badge role-tag">{{ role }}</span>
        </div>
        <div class="card-footer">
          <button v-if="authStore.profile?.is_captain && agent.id !== authStore.user?.id" 
                  @click="recruitPlayer(agent)" 
                  class="btn btn-primary btn-sm"
                  :disabled="isInvited(agent)">
            {{ isInvited(agent) ? 'Invité' : 'Recruter' }}
          </button>
          <RouterLink :to="'/profile/' + agent.id" class="btn btn-secondary btn-sm">Voir Profil</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { api } from '../lib/api'

const authStore = useAuthStore()
const agents = ref<any[]>([])
const myTeamOffers = ref<any[]>([])
const loading = ref(true)
const filterRank = ref('')

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  try {
    const data = await api.get('/social/agents')
    agents.value = data

    if (authStore.user && authStore.profile?.is_captain) {
      const { data: { session } } = await supabase.auth.getSession()
      const inbox = await api.get('/social/inbox', session?.access_token)
      // On filtre les interactions de type 'offer' envoyées par notre équipe
      myTeamOffers.value = inbox.interactions.filter((i: any) => i.type === 'offer' && i.status === 'pending')
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function isInvited(agent: any) {
  return myTeamOffers.value.some(o => o.sender_id === agent.id)
}

async function recruitPlayer(agent: any) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    // Route backend : POST /api/v1/recruitment/invite/:playerId
    await api.post(`/recruitment/invite/${agent.id}`, {
      team_id: authStore.profile?.team?.id,
      message: `L'équipe ${authStore.profile?.team?.name} souhaite vous recruter.`
    }, token)

    alert(`Invitation envoyée à ${agent.username} !`)
    await fetchData()
  } catch (err: any) {
    alert('Erreur: ' + (err.message || "Impossible d'envoyer l'invitation"))
  }
}

const filteredAgents = computed(() => {
  if (!filterRank.value) return agents.value
  return agents.value.filter(a => a.rank?.includes(filterRank.value))
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.filters {
  margin-bottom: 2rem;
  padding: 1rem;
}

.agent-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.riot-id {
  font-size: 0.85rem;
  color: var(--accent-color);
  margin-bottom: 1rem;
}

.bio {
  font-size: 0.9rem;
  color: #ccc;
  flex-grow: 1;
  margin-bottom: 1rem;
}

.roles {
  margin-bottom: 1rem;
}

.role-tag {
  background: rgba(11, 198, 227, 0.1);
  border-color: rgba(11, 198, 227, 0.3);
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
