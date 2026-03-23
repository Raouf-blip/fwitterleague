<template>
  <BaseSpinner v-if="loading" />

  <div v-else-if="team">
    <!-- Team Header -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center gap-5">
        <div v-if="team.logo_url" class="w-16 h-16 rounded-xl overflow-hidden shrink-0">
          <img :src="team.logo_url" :alt="team.name" class="w-full h-full object-cover" />
        </div>
        <div v-else class="w-16 h-16 rounded-xl bg-gold-muted border border-border-gold flex items-center justify-center text-2xl font-black text-gold shrink-0">
          {{ team.tag }}
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-extrabold text-text-primary">{{ team.name }}</h1>
            <BaseBadge variant="gold">[{{ team.tag }}]</BaseBadge>
            <BaseBadge v-if="team.is_locked" variant="danger" size="md">Roster verrouillé</BaseBadge>
          </div>
          <p v-if="team.description" class="text-sm text-text-secondary mt-2">{{ team.description }}</p>
        </div>
        <div class="flex gap-2 shrink-0">
          <BaseButton v-if="canApply" variant="cyan" :loading="applying" :disabled="isApplied" @click="openApplyModal">
            <template #icon><Send :size="16" /></template>
            {{ isApplied ? 'Déjà postulé' : 'Postuler' }}
          </BaseButton>
          <BaseButton v-if="isCaptain" variant="secondary" size="sm" @click="showEdit = true">
            <template #icon><Edit :size="14" /></template>
            Modifier
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
      :message="`Voulez-vous renvoyer ${kickTarget?.profile?.username} de l'équipe ?`"
      confirm-label="Renvoyer"
      variant="danger"
      :loading="kicking"
      @confirm="doKick"
    />

    <!-- Disband Confirm -->
    <ConfirmDialog
      v-model="showDisband"
      title="Dissoudre l'équipe ?"
      :message="`Voulez-vous vraiment dissoudre ${team?.name} [${team?.tag}] ? Tous les membres seront retirés et cette action est irréversible.`"
      confirm-label="Dissoudre l'équipe"
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

    <!-- Edit Team Modal -->
    <BaseModal v-model="showEdit" title="Modifier l'équipe" size="md">
      <TeamCreateForm
        :initial-name="team.name"
        :initial-tag="team.tag"
        :initial-logo-url="team.logo_url || ''"
        :initial-description="team.description || ''"
        :loading="updating"
        submit-label="Enregistrer"
        @submit="updateTeam"
        @cancel="showEdit = false"
      />
    </BaseModal>
  </div>

  <BaseEmptyState v-else :icon="ShieldOff" title="Équipe introuvable" description="Cette équipe n'existe pas ou a été dissoute.">
    <template #action>
      <BaseButton to="/teams">Retour aux équipes</BaseButton>
    </template>
  </BaseEmptyState>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Send, ShieldOff, Trash2, Edit } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { useInboxStore } from '../stores/inbox'
import type { Team, TeamMember } from '../types'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import RosterTable from '../components/domain/RosterTable.vue'
import StatBlock from '../components/domain/StatBlock.vue'
import ApplyModal from '../components/forms/ApplyModal.vue'
import TeamCreateForm from '../components/forms/TeamCreateForm.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const inboxStore = useInboxStore()

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
const showEdit = ref(false)
const updating = ref(false)

const isCaptain = computed(() => !!(authStore.profile && team.value && team.value.captain_id === authStore.profile.id))
const isMember = computed(() => members.value.some(m => m.profile_id === authStore.profile?.id))
const canApply = computed(() => authStore.user && !authStore.profile?.team && !isMember.value)

const isApplied = computed(() => {
  return inboxStore.applications.some((app: any) => 
    app.type === 'application' && 
    app.team_id === team.value?.id && 
    app.status === 'pending'
  )
})

onMounted(async () => {
  if (authStore.user) {
    inboxStore.fetchInbox();
  }
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
      message: message || `${authStore.profile?.username} souhaite rejoindre votre équipe.`,
    }, token)
    notificationStore.show('Candidature envoyée !', 'success')
    showApply.value = false
    await inboxStore.fetchInbox()
  } catch (e: any) {
    notificationStore.show(e.message, 'error')
  } finally {
    applying.value = false
  }
}

async function updateTeam(data: { name: string; tag: string; description: string; logo_url: string }) {
  updating.value = true
  try {
    const token = await getToken()
    const updated = await api.patch(`/teams/${team.value!.id}`, data, token)
    team.value = { ...team.value!, ...updated }
    notificationStore.show('Équipe mise à jour !', 'success')
    showEdit.value = false
    // Refresh auth store to sync profile's team info if needed
    await authStore.fetchProfile()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur lors de la mise à jour', 'error')
  } finally {
    updating.value = false
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
    notificationStore.show('Joueur expulsé.', 'success')
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
    notificationStore.show('Équipe dissoute.', 'success')
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
    notificationStore.show('Vous avez quitté l\'\u00e9quipe.', 'success')
    await authStore.fetchProfile()
    await fetchTeamData()
  } catch (e: any) {
    notificationStore.show(e.message, 'error')
  }
}
</script>
