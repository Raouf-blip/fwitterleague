<template>
  <BaseSpinner v-if="loading" />

  <div v-else-if="team">
    <!-- Team Header -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center gap-5">
        <div class="w-16 h-16 rounded-xl bg-gold-muted border border-border-gold flex items-center justify-center text-2xl font-black text-gold shrink-0">
          {{ team.tag }}
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-extrabold text-text-primary">{{ team.name }}</h1>
            <BaseBadge variant="gold">[{{ team.tag }}]</BaseBadge>
            <BaseBadge v-if="team.is_locked" variant="danger" size="md">Roster verrouille</BaseBadge>
          </div>
          <p v-if="team.description" class="text-sm text-text-secondary mt-2">{{ team.description }}</p>
        </div>
        <div class="flex gap-2 shrink-0">
          <BaseButton v-if="canApply" variant="cyan" :loading="applying" @click="openApplyModal">
            <template #icon><Send :size="16" /></template>
            Postuler
          </BaseButton>
          <BaseButton v-if="isMember && !isCaptain" variant="danger" size="sm" @click="leaveTeam">
            Quitter
          </BaseButton>
          <BaseButton v-if="isCaptain" variant="danger" size="sm" @click="showDisband = true">
            <template #icon><Trash2 :size="14" /></template>
            Dissoudre
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Roster -->
      <div class="lg:col-span-2">
        <h2 class="text-lg font-bold text-text-primary mb-4">
          Roster ({{ members.length }}/6)
        </h2>
        <RosterTable
          :members="members"
          :is-captain="isCaptain"
          :is-locked="team.is_locked"
          @kick="confirmKick"
        />
      </div>

      <!-- Stats -->
      <div>
        <h2 class="text-lg font-bold text-text-primary mb-4">Statistiques</h2>
        <BaseCard :hoverable="false">
          <div class="grid grid-cols-2 gap-4">
            <StatBlock label="Matchs" value="0" />
            <StatBlock label="Victoires" value="0" />
            <StatBlock label="Winrate" value="0%" />
            <StatBlock label="Joueurs" :value="members.length" />
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Confirm Kick -->
    <ConfirmDialog
      v-model="showKickConfirm"
      title="Renvoyer un joueur"
      :message="`Voulez-vous renvoyer ${kickTarget?.profile?.username} de l'equipe ?`"
      confirm-label="Renvoyer"
      variant="danger"
      :loading="kicking"
      @confirm="doKick"
    />

    <!-- Disband Confirm -->
    <ConfirmDialog
      v-model="showDisband"
      title="Dissoudre l'equipe ?"
      :message="`Voulez-vous vraiment dissoudre ${team?.name} [${team?.tag}] ? Tous les membres seront retires et cette action est irreversible.`"
      confirm-label="Dissoudre l'equipe"
      variant="danger"
      :loading="disbanding"
      @confirm="disbandTeam"
    />

    <!-- Apply Modal -->
    <ApplyModal
      v-model="showApply"
      :team-name="team.name"
      :loading="applying"
      @submit="doApply"
    />
  </div>

  <BaseEmptyState v-else :icon="ShieldOff" title="Equipe introuvable" description="Cette equipe n'existe pas ou a ete dissoute.">
    <template #action>
      <BaseButton to="/teams">Retour aux equipes</BaseButton>
    </template>
  </BaseEmptyState>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Send, ShieldOff, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { Team, TeamMember } from '../types'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import RosterTable from '../components/domain/RosterTable.vue'
import StatBlock from '../components/domain/StatBlock.vue'
import ApplyModal from '../components/forms/ApplyModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const team = ref<Team | null>(null)
const members = ref<TeamMember[]>([])
const loading = ref(true)
const applying = ref(false)
const showApply = ref(false)
const showKickConfirm = ref(false)
const kickTarget = ref<TeamMember | null>(null)
const kicking = ref(false)
const showDisband = ref(false)
const disbanding = ref(false)

const isCaptain = computed(() => !!(authStore.profile && team.value && team.value.captain_id === authStore.profile.id))
const isMember = computed(() => members.value.some(m => m.profile_id === authStore.profile?.id))
const canApply = computed(() => authStore.user && !authStore.profile?.team && !isMember.value)

onMounted(async () => {
  await fetchTeamData()
})

async function fetchTeamData() {
  try {
    const data = await api.get(`/teams/${route.params.id}`)
    team.value = data
    members.value = data.members || []
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function openApplyModal() {
  showApply.value = true
}

async function doApply(message: string) {
  applying.value = true
  try {
    const token = await getToken()
    await api.post(`/recruitment/apply/${team.value!.id}`, {
      message: message || `${authStore.profile?.username} souhaite rejoindre votre equipe.`,
    }, token)
    notificationStore.show('Candidature envoyee !', 'success')
    showApply.value = false
  } catch (e: any) {
    notificationStore.show(e.message, 'error')
  } finally {
    applying.value = false
  }
}

function confirmKick(member: TeamMember) {
  kickTarget.value = member
  showKickConfirm.value = true
}

async function doKick() {
  if (!kickTarget.value) return
  kicking.value = true
  try {
    const token = await getToken()
    await api.delete(`/teams/${team.value!.id}/members/${kickTarget.value.profile_id}`, token)
    notificationStore.show('Joueur expulse.', 'success')
    showKickConfirm.value = false
    await fetchTeamData()
  } catch (e: any) {
    notificationStore.show(e.message, 'error')
  } finally {
    kicking.value = false
  }
}

async function disbandTeam() {
  disbanding.value = true
  try {
    const token = await getToken()
    await api.delete(`/teams/${team.value!.id}`, token)
    notificationStore.show('Equipe dissoute.', 'success')
    await authStore.fetchProfile()
    router.push('/teams')
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur lors de la dissolution', 'error')
  } finally {
    disbanding.value = false
  }
}

async function leaveTeam() {
  try {
    const token = await getToken()
    await api.post(`/teams/${team.value!.id}/leave`, {}, token)
    notificationStore.show('Vous avez quitte l\'equipe.', 'success')
    await authStore.fetchProfile()
    await fetchTeamData()
  } catch (e: any) {
    notificationStore.show(e.message, 'error')
  }
}
</script>
