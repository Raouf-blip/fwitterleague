<template>
  <div v-if="authStore.profile">
    <!-- Profile Header -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <BaseAvatar :name="authStore.profile.username" size="xl" />
        <div class="flex-1">
          <h1 class="text-2xl font-extrabold text-text-primary">{{ authStore.profile.username }}</h1>
          <p class="text-sm text-gold mt-0.5">{{ authStore.profile.riot_id || 'Riot ID non configure' }}</p>
          <div class="flex items-center gap-4 mt-3">
            <RankBadge :rank="authStore.profile.rank" />
            <span class="text-sm text-text-secondary">
              Winrate: <strong class="text-text-primary">{{ authStore.profile.winrate }}%</strong>
            </span>
          </div>
        </div>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Settings -->
      <BaseCard :hoverable="false">
        <h2 class="text-lg font-bold text-text-primary mb-5 pb-3 border-b border-border">Parametres</h2>
        <ProfileSettingsForm
          :initial-bio="authStore.profile.bio || ''"
          :initial-riot-id="authStore.profile.riot_id || ''"
          :initial-is-looking="authStore.profile.is_looking_for_team"
          :saving="savingProfile"
          :syncing="fetchingRiot"
          @save="updateProfile"
          @sync-riot="fetchRiotData"
        />
      </BaseCard>

      <!-- Team -->
      <BaseCard :hoverable="false">
        <h2 class="text-lg font-bold text-text-primary mb-5 pb-3 border-b border-border">Mon Equipe</h2>
        <div v-if="team">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-lg bg-gold-muted border border-border-gold flex items-center justify-center text-lg font-black text-gold">
              {{ team.tag }}
            </div>
            <div>
              <h3 class="font-bold text-text-primary">{{ team.name }} [{{ team.tag }}]</h3>
              <p class="text-xs text-text-secondary">{{ team.description }}</p>
            </div>
          </div>
          <BaseButton variant="secondary" size="sm" :to="'/teams/' + team.id">
            Voir l'equipe
          </BaseButton>
        </div>
        <div v-else-if="!creatingTeam">
          <BaseEmptyState
            :icon="ShieldPlus"
            title="Pas d'equipe"
            description="Vous n'avez pas encore d'equipe."
          >
            <template #action>
              <BaseButton @click="creatingTeam = true">Creer une equipe</BaseButton>
            </template>
          </BaseEmptyState>
        </div>
        <div v-else>
          <TeamCreateForm
            :loading="savingTeam"
            @submit="createTeam"
            @cancel="creatingTeam = false"
          />
        </div>
      </BaseCard>
    </div>

    <!-- Notifications + Applications -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <!-- Notifications -->
      <BaseCard :hoverable="false">
        <h2 class="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border">
          Notifications
          <span v-if="unreadNotifs > 0" class="ml-2 text-xs px-2 py-0.5 bg-cyan-muted text-cyan rounded-full">{{ unreadNotifs }}</span>
        </h2>
        <div v-if="notifications.length === 0" class="text-center text-text-muted py-6 text-sm">Aucune notification.</div>
        <div v-else class="space-y-2">
          <div
            v-for="notif in notifications.slice(0, 5)"
            :key="notif.id"
            :class="['p-3 rounded-lg text-sm', !notif.is_read ? 'bg-cyan-muted/20 border-l-2 border-l-cyan' : 'bg-white/[0.02]']"
          >
            <div class="flex justify-between items-start gap-2">
              <div>
                <strong class="text-text-primary">{{ notif.title }}</strong>
                <p class="text-text-secondary text-xs mt-0.5">{{ notif.message }}</p>
              </div>
              <button
                v-if="!notif.is_read"
                class="text-xs text-cyan hover:underline shrink-0 cursor-pointer"
                @click="markAsRead(notif.id)"
              >
                Marquer lu
              </button>
            </div>
          </div>
        </div>
        <BaseButton v-if="notifications.length > 0" variant="ghost" size="sm" to="/notifications" class="mt-3">
          Voir tout
        </BaseButton>
      </BaseCard>

      <!-- Sent Applications -->
      <BaseCard :hoverable="false">
        <h2 class="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border">Candidatures envoyees</h2>
        <div v-if="sentApplications.length === 0" class="text-center text-text-muted py-6 text-sm">Aucune candidature envoyee.</div>
        <div v-else class="space-y-2">
          <div
            v-for="app in sentApplications"
            :key="app.id"
            class="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]"
          >
            <div>
              <strong class="text-sm text-text-primary">{{ app.team?.name }} [{{ app.team?.tag }}]</strong>
              <p v-if="app.message" class="text-xs text-text-muted mt-0.5 italic">{{ app.message }}</p>
            </div>
            <BaseBadge
              :variant="app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'"
              size="sm"
            >
              {{ app.status === 'pending' ? 'En attente' : app.status === 'accepted' ? 'Accepte' : 'Refuse' }}
            </BaseBadge>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>

  <BaseEmptyState
    v-else-if="!authStore.loading"
    :icon="AlertTriangle"
    title="Profil introuvable"
    description="Votre profil n'a pas ete cree correctement."
  >
    <template #action>
      <BaseButton @click="logout">Retour a l'accueil</BaseButton>
    </template>
  </BaseEmptyState>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldPlus, AlertTriangle } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseAvatar from '../components/ui/BaseAvatar.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import RankBadge from '../components/domain/RankBadge.vue'
import ProfileSettingsForm from '../components/forms/ProfileSettingsForm.vue'
import TeamCreateForm from '../components/forms/TeamCreateForm.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const savingProfile = ref(false)
const savingTeam = ref(false)
const fetchingRiot = ref(false)
const creatingTeam = ref(false)
const team = ref<any>(null)
const notifications = ref<any[]>([])
const sentApplications = ref<any[]>([])

const unreadNotifs = computed(() => notifications.value.filter(n => !n.is_read).length)

watch(() => authStore.profile, (p) => {
  if (p) team.value = p.team
}, { immediate: true })

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  if (!authStore.user) return
  const token = await getToken()
  try {
    const res = await api.get('/social/inbox', token)
    notifications.value = res.notifications || []
    const apps = await api.get('/profiles/me/applications', token)
    sentApplications.value = apps
  } catch (e) {
    console.error(e)
  }
}

async function markAsRead(id: string) {
  const token = await getToken()
  try {
    await api.patch(`/social/notifications/${id}`, {}, token)
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function fetchRiotData(riotId: string) {
  if (!riotId.includes('#')) {
    notificationStore.show('Format invalide. Utilisez GameName#TagLine', 'error')
    return
  }
  fetchingRiot.value = true
  try {
    const token = await getToken()
    await api.post('/profiles/sync-riot', { riotId }, token)
    await authStore.fetchProfile()
    notificationStore.show('Donnees Riot synchronisees !', 'success')
  } catch (err: any) {
    notificationStore.show('Erreur: ' + err.message, 'error')
  } finally {
    fetchingRiot.value = false
  }
}

async function updateProfile(data: { bio: string; riot_id: string; is_looking_for_team: boolean }) {
  savingProfile.value = true
  try {
    const token = await getToken()
    await api.patch('/profiles/me', data, token)
    await authStore.fetchProfile()
    notificationStore.show('Profil mis a jour !', 'success')
  } catch (err: any) {
    notificationStore.show('Erreur: ' + err.message, 'error')
  } finally {
    savingProfile.value = false
  }
}

async function createTeam(data: { name: string; tag: string; description: string }) {
  savingTeam.value = true
  try {
    const token = await getToken()
    await api.post('/teams', data, token)
    creatingTeam.value = false
    await authStore.fetchProfile()
    await fetchData()
    notificationStore.show('Equipe creee avec succes !', 'success')
  } catch (err: any) {
    notificationStore.show('Erreur: ' + err.message, 'error')
  } finally {
    savingTeam.value = false
  }
}

async function logout() {
  await authStore.signOut()
  router.push('/')
}
</script>
