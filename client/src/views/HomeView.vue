<template>
  <div class="home">
    <header class="hero">
      <h1>Bienvenue dans la FwitterLeague</h1>
      <p>La ligue indépendante LoL par excellence.</p>
      <div class="cta-buttons">
        <RouterLink to="/agents" class="btn btn-primary">Trouver des joueurs</RouterLink>
        <RouterLink to="/teams" class="btn btn-secondary">Voir les équipes</RouterLink>
      </div>
    </header>

    <section class="section">
      <h2>Derniers Agents Libres</h2>
      <div v-if="loading" class="loading">Chargement des agents...</div>
      <div v-else-if="agents.length === 0" class="no-data">Aucun agent libre pour le moment.</div>
      <div v-else class="grid">
        <div v-for="agent in agents" :key="agent.id" class="card">
          <h3>{{ agent.username }}</h3>
          <p class="rank">{{ agent.rank }} {{ agent.lp }} LP</p>
          <div class="roles">
             <span v-for="role in agent.preferred_roles" :key="role" class="badge">{{ role }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const agents = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_looking_for_team', true)
    .limit(3)
    .order('created_at', { ascending: false })
  
  if (!error) {
    agents.value = data
  }
  loading.value = false
})
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 4rem 0;
  background: linear-gradient(rgba(1, 10, 19, 0.8), rgba(1, 10, 19, 0.8)), url('https://universe.leagueoflegends.com/images/summonersRiftBackground.jpg');
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 3rem;
}

h1 {
  font-size: 3.5rem;
  color: var(--accent-color);
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.cta-buttons {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.section {
  margin-bottom: 4rem;
}

h2 {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(11, 198, 227, 0.2);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  font-size: 0.8rem;
  margin-right: 0.5rem;
  text-transform: uppercase;
}

.rank {
  color: var(--accent-color);
  font-weight: bold;
}
</style>
