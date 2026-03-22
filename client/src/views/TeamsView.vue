<template>
  <div>
    <PageHeader title="Equipes" subtitle="Decouvrez les structures engagees dans la ligue." />

    <BaseSpinner v-if="loading" />
    <BaseEmptyState
      v-else-if="teams.length === 0"
      :icon="ShieldOff"
      title="Aucune equipe"
      description="Aucune equipe n'a ete creee pour le moment."
    />
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <TransitionGroup name="list">
        <TeamCard
          v-for="team in teams"
          :key="team.id"
          :team="team"
          :member-count="team.members?.length"
          :show-apply="canApply(team)"
          :is-pending="isPending(team)"
          :applying="applyingTeamId === team.id"
          @apply="openApply(team)"
        />
      </TransitionGroup>
    </div>

    <!-- Apply Modal -->
    <ApplyModal
      v-model="showApply"
      :team-name="selectedTeam?.name || ''"
      :loading="applying"
      @submit="sendApplication"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ShieldOff } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { Team } from '../types'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import TeamCard from '../components/domain/TeamCard.vue'
import ApplyModal from '../components/forms/ApplyModal.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const teams = ref<Team[]>([])
const myApplications = ref<any[]>([])
const loading = ref(true)
const showApply = ref(false)
const selectedTeam = ref<Team | null>(null)
const applying = ref(false)
const applyingTeamId = ref<string | null>(null)

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  try {
    teams.value = await api.get('/teams')
    if (authStore.user) {
      const token = await getToken()
      myApplications.value = await api.get('/profiles/me/applications', token)
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function canApply(team: Team) {
  return !!(authStore.user && !authStore.profile?.team && authStore.profile?.id !== team.captain_id)
}

function isPending(team: Team) {
  return myApplications.value.some((app: any) => app.team_id === team.id && app.status === 'pending')
}

function openApply(team: Team) {
  selectedTeam.value = team
  showApply.value = true
}

async function sendApplication(message: string) {
  if (!selectedTeam.value) return
  applying.value = true
  applyingTeamId.value = selectedTeam.value.id
  try {
    const token = await getToken()
    await api.post(`/recruitment/apply/${selectedTeam.value.id}`, {
      message: message || 'Je souhaite rejoindre votre equipe !',
    }, token)
    notificationStore.show('Candidature envoyee !', 'success')
    showApply.value = false
    await fetchData()
  } catch (err: any) {
    notificationStore.show(err.message, 'error')
  } finally {
    applying.value = false
    applyingTeamId.value = null
  }
}
</script>
