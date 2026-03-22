<template>
  <div>
    <PageHeader title="Mercato" subtitle="Joueurs a la recherche d'une equipe pour la saison." />

    <!-- Filters -->
    <div class="mb-6 bg-surface p-4 rounded-xl border border-border">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <BaseInput
            v-model="search"
            placeholder="Rechercher un joueur..."
            class="w-full sm:w-64"
          />
          
          <!-- Toggle Filter -->
          <div class="flex items-center gap-3 p-1 bg-white/5 rounded-lg border border-white/5">
            <button
              @click="filterOnlyFree = true"
              class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
              :class="filterOnlyFree ? 'bg-cyan text-body shadow-lg' : 'text-text-muted hover:text-text-secondary'"
            >
              Agents Libres
            </button>
            <button
              @click="filterOnlyFree = false"
              class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
              :class="!filterOnlyFree ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-secondary'"
            >
              Tout le monde
            </button>
          </div>
        </div>

        <button
          @click="resetFilters"
          class="text-xs font-bold text-text-muted hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw :size="14" />
          Reinitialiser
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Rangs -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Rangs</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="rank in LOL_RANKS"
              :key="rank"
              @click="toggleRank(rank)"
              class="flex items-center gap-1.5 px-2 py-1 rounded border transition-colors cursor-pointer"
              :class="filterRanks.includes(rank) ? 'bg-cyan/20 border-cyan/50 text-cyan' : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20 hover:text-white'"
            >
              <img :src="getRankIconUrl(rank)" :alt="rank" class="w-3.5 h-3.5 object-contain" :class="!filterRanks.includes(rank) && 'opacity-60 grayscale'" />
              <span class="text-[10px] font-bold">{{ rank }}</span>
            </button>
          </div>
        </div>

        <!-- Roles -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Postes</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="role in LOL_ROLES"
              :key="role.key"
              @click="toggleRole(role.key)"
              class="flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer"
              :class="filterRoles.includes(role.key) ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20 hover:text-white'"
            >
              <LolRoleIcon :role="role.key" :size="12" />
              <span class="text-[10px] font-bold">{{ role.label }}</span>
            </button>
          </div>
        </div>

        <!-- Winrate -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-text-muted">Winrate</label>
            <span class="text-xs font-bold text-cyan">{{ filterWinrateMin }}% - {{ filterWinrateMax }}%</span>
          </div>
          <div class="space-y-3 mt-4">
            <div class="relative">
              <span class="absolute -top-3 left-0 text-[9px] text-text-muted">Min</span>
              <input
                type="range"
                v-model.number="filterWinrateMin"
                min="0"
                max="100"
                step="5"
                class="w-full accent-cyan h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                @input="() => filterWinrateMin > filterWinrateMax ? filterWinrateMax = filterWinrateMin : null"
              />
            </div>
            <div class="relative">
              <span class="absolute -top-3 left-0 text-[9px] text-text-muted">Max</span>
              <input
                type="range"
                v-model.number="filterWinrateMax"
                min="0"
                max="100"
                step="5"
                class="w-full accent-gold h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                @input="() => filterWinrateMax < filterWinrateMin ? filterWinrateMin = filterWinrateMax : null"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Visibility Notice -->
    <div class="mb-6 p-4 bg-cyan/10 border border-cyan/20 rounded-xl">
      <p class="text-cyan text-sm font-bold flex items-center gap-2">
        <Info :size="16" />
        Note : Seuls les Agents Libres ou les joueurs possédant déjà une équipe apparaissent dans le Mercato.
      </p>
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
          :invited="isInvited(agent)"
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
import { UserSearch, RefreshCw, Info } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { LOL_RANKS, LOL_ROLES } from '../lib/constants'
import { getRankIconUrl } from '../lib/formatters'
import type { Agent } from '../types'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import PlayerCard from '../components/domain/PlayerCard.vue'
import InviteModal from '../components/forms/InviteModal.vue'
import LolRoleIcon from '../components/icons/LolRoleIcon.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const agents = ref<Agent[]>([])
const myTeamOffers = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const filterOnlyFree = ref(true)
const filterRanks = ref<string[]>([])
const filterRoles = ref<string[]>([])
const filterWinrateMin = ref<number | ''>(0)
const filterWinrateMax = ref<number | ''>(100)
const showInvite = ref(false)
const selectedAgent = ref<Agent | null>(null)
const inviting = ref(false)
const recruitingId = ref<string | null>(null)

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
  // On ne peut recruter que si on est capitaine, que ce n'est pas nous-même, 
  // que le joueur n'a pas déjà d'équipe et qu'il est en recherche active.
  return authStore.profile?.is_captain && 
         agent.id !== authStore.user?.id && 
         !agent.team && 
         agent.is_looking_for_team
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

function toggleRank(rank: string) {
  const i = filterRanks.value.indexOf(rank)
  if (i === -1) filterRanks.value.push(rank)
  else filterRanks.value.splice(i, 1)
}

function toggleRole(role: string) {
  const i = filterRoles.value.indexOf(role)
  if (i === -1) filterRoles.value.push(role)
  else filterRoles.value.splice(i, 1)
}

function resetFilters() {
  search.value = ''
  filterOnlyFree.value = true
  filterRanks.value = []
  filterRoles.value = []
  filterWinrateMin.value = 0
  filterWinrateMax.value = 100
}

const filteredAgents = computed(() => {
  let result = [...agents.value]
  
  // 1. Filtre de recherche
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(a =>
      a.username.toLowerCase().includes(q) ||
      a.riot_id?.toLowerCase().includes(q)
    )
  }

  // 2. Filtre par rang
  if (filterRanks.value.length > 0) {
    result = result.filter(a => a.rank && filterRanks.value.some(r => a.rank!.toUpperCase().includes(r)))
  }

  // 3. Filtre par rôle
  if (filterRoles.value.length > 0) {
    result = result.filter(a => a.preferred_roles && a.preferred_roles.some(r => filterRoles.value.includes(r)))
  }
  
  // 4. Filtre par winrate
  const minW = typeof filterWinrateMin.value === 'number' ? filterWinrateMin.value : 0
  const maxW = typeof filterWinrateMax.value === 'number' ? filterWinrateMax.value : 100
  if (minW > 0 || maxW < 100) {
    result = result.filter(a => {
      if (a.winrate === undefined || a.winrate === null) return false
      return a.winrate >= minW && a.winrate <= maxW
    })
  }

  // 5. Filtre par statut (Agents Libres vs Tout le monde)
  if (filterOnlyFree.value) {
    result = result.filter(a => a.is_looking_for_team && !a.team)
  }

  // 6. Tri : Agents Libres en priorité, puis par date de création
  return result.sort((a, b) => {
    const aIsFree = a.is_looking_for_team && !a.team;
    const bIsFree = b.is_looking_for_team && !b.team;

    if (aIsFree && !bIsFree) return -1;
    if (!aIsFree && bIsFree) return 1;
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })
})
</script>
