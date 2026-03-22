<template>
  <div>
    <PageHeader title="Tournois & Compétitions" subtitle="Suivez les événements en cours et inscrivez votre équipe." />

    <BaseSpinner v-if="loading" />
    <BaseEmptyState
      v-else-if="tournaments.length === 0"
      :icon="Trophy"
      title="Aucun tournoi"
      description="Aucun tournoi n'a été créé pour le moment."
    />
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <TransitionGroup name="list">
        <TournamentCard
          v-for="tournament in tournaments"
          :key="tournament.id"
          :tournament="tournament"
          :show-register="canRegister(tournament)"
          :is-registered="isRegistered(tournament)"
          :registering="registeringId === tournament.id"
          @register="registerTeam"
          @unregister="unregisterTeam"
        />
      </TransitionGroup>
    </div>

    <!-- Recent Matches -->
    <section v-if="matches.length > 0" class="mt-12">
      <h2 class="text-xl font-bold text-text-primary mb-5 pb-3 border-b border-border">Matchs Récents</h2>
      <div class="space-y-2">
        <MatchCard v-for="match in matches" :key="match.id" :match="match" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Trophy } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { Tournament, Match } from '../types'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import TournamentCard from '../components/domain/TournamentCard.vue'
import MatchCard from '../components/domain/MatchCard.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const tournaments = ref<Tournament[]>([])
const matches = ref<Match[]>([])
const loading = ref(true)
const registeringId = ref<string | null>(null)
const registeredTournamentIds = ref<Set<string>>(new Set())

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  try {
    const [t, m] = await Promise.all([
      api.get('/tournaments'),
      api.get('/tournaments/matches'),
    ])
    tournaments.value = t
    matches.value = m

    // Fetch registered tournaments for captain's team
    if (authStore.profile?.is_captain && authStore.profile?.team?.id) {
      const ids = new Set<string>()
      for (const tournament of t) {
        try {
          const detail = await api.get(`/tournaments/${tournament.id}`)
          const regs = detail.registrations || []
          if (regs.some((r: any) => r.team_id === authStore.profile?.team?.id)) {
            ids.add(tournament.id)
          }
        } catch { /* ignore */ }
      }
      registeredTournamentIds.value = ids
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function canRegister(tournament: Tournament) {
  return tournament.status === 'upcoming' && authStore.profile?.is_captain && !registeredTournamentIds.value.has(tournament.id)
}

function isRegistered(tournament: Tournament) {
  return authStore.profile?.is_captain && registeredTournamentIds.value.has(tournament.id)
}

async function registerTeam(tournament: Tournament) {
  registeringId.value = tournament.id
  try {
    const token = await getToken()
    await api.post(`/tournaments/${tournament.id}/register`, {}, token)
    notificationStore.show('Inscription réussie !', 'success')
    await fetchData()
  } catch (e: any) {
    notificationStore.show(e.message || "Erreur lors de l'inscription.", 'error')
  } finally {
    registeringId.value = null
  }
}

async function unregisterTeam(tournament: Tournament) {
  registeringId.value = tournament.id
  try {
    const token = await getToken()
    await api.post(`/tournaments/${tournament.id}/unregister`, {}, token)
    notificationStore.show('Désinscription réussie.', 'success')
    await fetchData()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur lors de la désinscription.', 'error')
  } finally {
    registeringId.value = null
  }
}
</script>
