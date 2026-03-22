<template>
  <BaseSpinner v-if="loading" />

  <div v-else-if="tournament">
    <!-- Tournament Header -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary">{{ tournament.name }}</h1>
            <BaseBadge :variant="statusVariant" size="md">{{ statusLabel }}</BaseBadge>
          </div>
          <p v-if="tournament.description" class="text-sm text-text-secondary mt-2">{{ tournament.description }}</p>
          <div class="flex items-center gap-5 mt-3 text-sm text-text-muted">
            <span class="flex items-center gap-1">
              <Calendar :size="14" />
              {{ formatDate(tournament.start_date) }} - {{ formatDate(tournament.end_date) }}
            </span>
            <span class="flex items-center gap-1">
              <Users :size="14" />
              {{ regCount }}/{{ tournament.max_teams }} équipes
            </span>
          </div>
          <!-- Progress bar -->
          <div class="mt-3 w-64">
            <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="progressPercent >= 100 ? 'bg-danger' : progressPercent >= 75 ? 'bg-warning' : 'bg-cyan'"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>
        </div>
        <BaseButton
          v-if="canRegister"
          variant="primary"
          :loading="registering"
          @click="registerTeam"
        >
          Inscrire mon équipe
        </BaseButton>
        <div 
          v-else-if="authStore.profile?.is_captain && !isAlreadyRegistered && tournament?.status === 'upcoming' && !hasRequiredMembers" 
          class="p-4 bg-gold/10 border border-gold/20 rounded-lg"
        >
          <p class="text-gold text-sm font-bold flex items-center gap-2">
            <AlertTriangle :size="16" />
            Votre équipe doit avoir au moins 5 membres pour s'inscrire.
          </p>
        </div>
        <BaseButton
          v-else-if="isAlreadyRegistered && tournament?.status === 'upcoming'"
          variant="danger"
          :loading="registering"
          @click="unregisterTeam"
        >
          Se désinscrire
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Tabs -->
    <BaseTabs
      :tabs="[
        { key: 'teams', label: 'Équipes', count: regCount },
        { key: 'matches', label: 'Matchs', count: matches.length },
        { key: 'standings', label: 'Classement' },
      ]"
      v-model="activeTab"
    />

    <div class="mt-6">
      <!-- Teams Tab -->
      <div v-if="activeTab === 'teams'">
        <BaseEmptyState
          v-if="registrations.length === 0"
          :icon="ShieldOff"
          title="Aucune équipe inscrite"
          description="Les inscriptions sont ouvertes, soyez les premiers !"
        />
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <TeamCard
            v-for="reg in registrations"
            :key="reg.id"
            :team="reg.team"
            :member-count="reg.team.members?.length"
          />
        </div>
      </div>

      <!-- Matches Tab -->
      <div v-if="activeTab === 'matches'">
        <BaseEmptyState
          v-if="tournamentMatches.length === 0"
          :icon="Swords"
          title="Aucun match"
          description="Les matchs n'ont pas encore été planifiés."
        />
        <div v-else class="space-y-2">
          <MatchCard v-for="match in tournamentMatches" :key="match.id" :match="match" />
        </div>
      </div>

      <!-- Standings Tab -->
      <div v-if="activeTab === 'standings'">
        <BaseEmptyState
          v-if="standings.length === 0"
          :icon="BarChart3"
          title="Classement indisponible"
          description="Le classement sera disponible dès que les matchs auront commencé."
        />
        <div v-else class="bg-surface border border-border rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-text-muted text-left">
                <th class="px-4 py-3 w-12">#</th>
                <th class="px-4 py-3">Équipe</th>
                <th class="px-4 py-3 text-center">V</th>
                <th class="px-4 py-3 text-center">D</th>
                <th class="px-4 py-3 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in standings"
                :key="row.teamId"
                class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-4 py-3 font-bold" :class="index < 3 ? 'text-gold' : 'text-text-muted'">{{ index + 1 }}</td>
                <td class="px-4 py-3 font-semibold text-text-primary">{{ row.teamName }}</td>
                <td class="px-4 py-3 text-center text-success font-semibold">{{ row.wins }}</td>
                <td class="px-4 py-3 text-center text-danger font-semibold">{{ row.losses }}</td>
                <td class="px-4 py-3 text-center text-text-primary font-bold">{{ row.winrate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <BaseEmptyState v-else :icon="Trophy" title="Tournoi introuvable">
    <template #action>
      <BaseButton to="/tournaments">Retour aux tournois</BaseButton>
    </template>
  </BaseEmptyState>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Calendar, Users, ShieldOff, Swords, BarChart3, Trophy, AlertTriangle } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { formatDate } from '../lib/formatters'
import { TOURNAMENT_STATUS_MAP } from '../lib/constants'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { Tournament, TournamentRegistration, Match } from '../types'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseTabs from '../components/ui/BaseTabs.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import TeamCard from '../components/domain/TeamCard.vue'
import MatchCard from '../components/domain/MatchCard.vue'

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const tournament = ref<Tournament | null>(null)
const registrations = ref<TournamentRegistration[]>([])
const matches = ref<Match[]>([])
const loading = ref(true)
const activeTab = ref('teams')
const registering = ref(false)

const regCount = computed(() => registrations.value.length)
const progressPercent = computed(() => tournament.value ? Math.min(100, (regCount.value / tournament.value.max_teams) * 100) : 0)

const statusConfig = computed(() => tournament.value ? TOURNAMENT_STATUS_MAP[tournament.value.status] : TOURNAMENT_STATUS_MAP.upcoming)
const statusLabel = computed(() => statusConfig.value.label)
const statusVariant = computed(() => statusConfig.value.color as 'cyan' | 'gold' | 'muted')

const isAlreadyRegistered = computed(() => {
  const teamId = authStore.profile?.team?.id
  if (!teamId) return false
  return registrations.value.some(r => r.team_id === teamId)
})

const hasRequiredMembers = computed(() => (authStore.profile?.team?.member_count || 0) >= 5)

const canRegister = computed(() => 
  tournament.value?.status === 'upcoming' && 
  authStore.profile?.is_captain && 
  !isAlreadyRegistered.value &&
  hasRequiredMembers.value
)

const tournamentMatches = computed(() =>
  matches.value.filter(m => m.tournament_id === tournament.value?.id)
)

const standings = computed(() => {
  const teamStats: Record<string, { teamName: string; wins: number; losses: number }> = {}

  for (const reg of registrations.value) {
    teamStats[reg.team_id] = { teamName: reg.team.name, wins: 0, losses: 0 }
  }

  for (const match of tournamentMatches.value) {
    if (match.winner_id) {
      const loserId = match.winner_id === match.team_1_id ? match.team_2_id : match.team_1_id
      if (teamStats[match.winner_id]) teamStats[match.winner_id].wins++
      if (teamStats[loserId]) teamStats[loserId].losses++
    }
  }

  return Object.entries(teamStats)
    .map(([teamId, s]) => ({
      teamId,
      teamName: s.teamName,
      wins: s.wins,
      losses: s.losses,
      winrate: s.wins + s.losses > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
    }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
})

onMounted(async () => {
  try {
    const [data, m] = await Promise.all([
      api.get(`/tournaments/${route.params.id}`),
      api.get('/tournaments/matches'),
    ])
    tournament.value = data
    registrations.value = Array.isArray(data.registrations) && data.registrations[0]?.team
      ? data.registrations
      : []
    matches.value = m
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})

async function registerTeam() {
  registering.value = true
  try {
    const token = await getToken()
    await api.post(`/tournaments/${tournament.value!.id}/register`, {}, token)
    notificationStore.show('Inscription réussie !', 'success')
    const data = await api.get(`/tournaments/${route.params.id}`)
    tournament.value = data
    registrations.value = data.registrations || []
  } catch (e: any) {
    notificationStore.show(e.message || "Erreur lors de l'inscription.", 'error')
  } finally {
    registering.value = false
  }
}

async function unregisterTeam() {
  registering.value = true
  try {
    const token = await getToken()
    await api.post(`/tournaments/${tournament.value!.id}/unregister`, {}, token)
    notificationStore.show('Désinscription réussie.', 'success')
    const data = await api.get(`/tournaments/${route.params.id}`)
    tournament.value = data
    registrations.value = data.registrations || []
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur lors de la désinscription.', 'error')
  } finally {
    registering.value = false
  }
}
</script>
