<template>
  <div>
    <PageHeader title="Mercato" subtitle="Joueurs a la recherche d'une equipe pour la saison." />

    <!-- Filters -->
    <div class="mb-6">
      <BaseSelect
        v-model="filterRank"
        label="Filtrer par rang"
        placeholder="Tous les rangs"
        :options="rankOptions"
        class="max-w-xs"
      />
    </div>

    <BaseSpinner v-if="loading" />
    <BaseEmptyState
      v-else-if="filteredAgents.length === 0"
      :icon="UserSearch"
      title="Aucun agent libre"
      description="Aucun joueur ne correspond a vos criteres."
    />
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <TransitionGroup name="list">
        <PlayerCard
          v-for="agent in filteredAgents"
          :key="agent.id"
          :player="agent"
          :show-recruit="canRecruit(agent)"
          :recruiting="recruitingId === agent.id"
          @recruit="openInvite(agent)"
        />
      </TransitionGroup>
    </div>

    <!-- Invite Modal -->
    <InviteModal
      v-model="showInvite"
      :player-name="selectedAgent?.username || ''"
      :loading="inviting"
      @submit="sendInvite"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UserSearch } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { LOL_RANKS } from '../lib/constants'
import type { Agent } from '../types'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import PlayerCard from '../components/domain/PlayerCard.vue'
import InviteModal from '../components/forms/InviteModal.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const agents = ref<Agent[]>([])
const myTeamOffers = ref<any[]>([])
const loading = ref(true)
const filterRank = ref('')
const showInvite = ref(false)
const selectedAgent = ref<Agent | null>(null)
const inviting = ref(false)
const recruitingId = ref<string | null>(null)

const rankOptions = LOL_RANKS.map(r => ({ value: r, label: r }))

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  try {
    if (authStore.user && authStore.profile?.is_captain) {
      const token = await getToken()
      const [agentsData, inbox] = await Promise.all([
        api.get('/social/agents'),
        api.get('/social/inbox', token),
      ])
      agents.value = agentsData
      myTeamOffers.value = inbox.interactions.filter((i: any) => i.type === 'offer' && i.status === 'pending')
    } else {
      agents.value = await api.get('/social/agents')
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function canRecruit(agent: Agent) {
  return authStore.profile?.is_captain && agent.id !== authStore.user?.id && !isInvited(agent)
}

function isInvited(agent: Agent) {
  return myTeamOffers.value.some(o => o.sender_id === agent.id)
}

function openInvite(agent: Agent) {
  selectedAgent.value = agent
  showInvite.value = true
}

async function sendInvite(message: string) {
  if (!selectedAgent.value) return
  inviting.value = true
  recruitingId.value = selectedAgent.value.id
  try {
    const token = await getToken()
    await api.post(`/recruitment/invite/${selectedAgent.value.id}`, {
      team_id: authStore.profile?.team?.id,
      message: message || `L'equipe ${authStore.profile?.team?.name} souhaite vous recruter.`,
    }, token)
    notificationStore.show(`Invitation envoyee a ${selectedAgent.value.username} !`, 'success')
    showInvite.value = false
    await fetchData()
  } catch (err: any) {
    notificationStore.show(err.message || "Impossible d'envoyer l'invitation", 'error')
  } finally {
    inviting.value = false
    recruitingId.value = null
  }
}

const filteredAgents = computed(() => {
  if (!filterRank.value) return agents.value
  return agents.value.filter(a => a.rank?.toUpperCase().includes(filterRank.value))
})
</script>
