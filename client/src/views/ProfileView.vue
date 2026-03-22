<template>
  <div v-if="authStore.profile">
    <!-- Profile Header (Aligned with ProfileDetailView) -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <BaseAvatar :name="authStore.profile.username" :src="authStore.profile.avatar_url" size="xl" />
        
        <div class="flex-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-extrabold text-text-primary">{{ authStore.profile.username }}</h1>
            <BaseBadge 
              v-if="authStore.profile.role === 'admin' || authStore.profile.role === 'superadmin'" 
              variant="cyan" 
              size="sm"
            >
              Staff
            </BaseBadge>
          </div>

          <div class="flex items-center gap-3 mt-1 flex-wrap">
            <span class="text-sm text-gold font-bold">{{ authStore.profile.riot_id || 'Riot ID non configure' }}</span>
            <a
              v-if="authStore.profile.riot_id"
              :href="getOpggUrl(authStore.profile.riot_id)"
              target="_blank"
              class="text-[10px] text-cyan hover:underline flex items-center gap-1 bg-cyan/5 px-1.5 py-0.5 rounded border border-cyan/10"
              title="Voir sur OP.GG"
            >
              <ExternalLink :size="12" />
              OP.GG
            </a>
            <a
              v-if="authStore.profile.riot_id"
              :href="getDpmUrl(authStore.profile.riot_id)"
              target="_blank"
              class="text-[10px] text-cyan hover:underline flex items-center gap-1 bg-cyan/5 px-1.5 py-0.5 rounded border border-cyan/10"
              title="Voir sur DPM.LOL"
            >
              <ExternalLink :size="12" />
              DPM.LOL
            </a>
            <span v-if="authStore.profile.discord" class="flex items-center gap-1 text-sm text-text-secondary">
              <DiscordIcon :size="14" class="text-[#5865F2]" />
              {{ authStore.profile.discord }}
            </span>
          </div>

          <div class="flex items-center gap-4 mt-3">
            <RankBadge :rank="authStore.profile.rank" />
            <div v-if="authStore.profile.preferred_roles?.length" class="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 shadow-inner">
              <span class="text-[10px] font-black text-text-muted uppercase tracking-widest mr-1">Postes:</span>
              <div class="flex items-center gap-2">
                <BaseTooltip
                  v-for="role in authStore.profile.preferred_roles"
                  :key="role"
                  :content="role"
                >
                  <div class="hover:scale-110 transition-transform cursor-pointer flex items-center justify-center">
                    <LolRoleIcon :role="role" :size="16" class="text-cyan" />
                  </div>
                </BaseTooltip>
              </div>
            </div>
            <span class="text-sm text-text-secondary">
              Winrate: <strong class="text-text-primary">{{ authStore.profile.winrate }}%</strong>
            </span>
            <span v-if="authStore.profile.lp" class="text-sm text-text-secondary">
              LP: <strong class="text-text-primary">{{ authStore.profile.lp }}</strong>
            </span>
          </div>

          <BaseBadge v-if="authStore.profile.is_looking_for_team && !team" variant="success" size="md" class="mt-3">
            Cherche une equipe
          </BaseBadge>
        </div>

        <div class="flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto">
          <BaseButton variant="secondary" size="md" @click="showSettings = true" class="w-full">
            <template #icon><Settings :size="18" /></template>
            Parametres
          </BaseButton>
          <BaseButton variant="ghost" size="sm" @click="logout" class="w-full text-danger hover:bg-danger/10">
            <template #icon><LogOut :size="16" /></template>
            Deconnexion
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Bio -->
        <BaseCard :hoverable="false" title="Bio">
          <p class="text-text-secondary leading-relaxed whitespace-pre-wrap">
            {{ authStore.profile.bio || "Vous n'avez pas encore de bio. Ajoutez-en une dans les parametres pour vous presenter aux autres joueurs !" }}
          </p>
        </BaseCard>

        <!-- Private Panel: Notifications & Applications -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Notifications -->
          <BaseCard :hoverable="false">
            <template #title>
              <div class="flex items-center justify-between w-full">
                <span>Notifications</span>
                <span v-if="unreadNotifs > 0" class="text-[10px] px-2 py-0.5 bg-cyan text-white rounded-full">
                  {{ unreadNotifs }}
                </span>
              </div>
            </template>
            
            <div v-if="notifications.length === 0" class="text-center py-8">
              <BellOff :size="32" class="mx-auto text-text-muted/30 mb-2" />
              <p class="text-sm text-text-muted">Aucune notification.</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="notif in notifications.slice(0, 4)"
                :key="notif.id"
                :class="['p-3 rounded-lg border transition-all', !notif.is_read ? 'bg-cyan/5 border-cyan/20' : 'bg-white/5 border-transparent opacity-60']"
              >
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-text-primary truncate">{{ notif.title }}</p>
                    <p class="text-xs text-text-secondary mt-0.5 line-clamp-2">{{ notif.message }}</p>
                    <p class="text-[10px] text-text-muted mt-2 uppercase font-bold">{{ formatRelativeTime(notif.created_at) }}</p>
                  </div>
                  <button
                    v-if="!notif.is_read"
                    class="p-1.5 hover:bg-cyan/10 rounded-lg text-cyan transition-colors"
                    title="Marquer comme lu"
                    @click="markAsRead(notif.id)"
                  >
                    <Check :size="14" />
                  </button>
                </div>
              </div>
              <BaseButton variant="ghost" size="sm" to="/notifications" class="w-full mt-2">
                Voir toutes les notifications
              </BaseButton>
            </div>
          </BaseCard>

          <!-- Applications -->
          <BaseCard :hoverable="false" title="Candidatures envoyees">
            <div v-if="sentApplications.length === 0" class="text-center py-8">
              <Send :size="32" class="mx-auto text-text-muted/30 mb-2" />
              <p class="text-sm text-text-muted">Aucune candidature envoyee.</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="app in sentApplications.slice(0, 4)"
                :key="app.id"
                class="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <p class="text-sm font-bold text-text-primary truncate">
                    {{ app.team?.name }} <span class="text-gold">[{{ app.team?.tag }}]</span>
                  </p>
                  <p class="text-[10px] text-text-muted mt-1 uppercase font-bold">{{ formatDate(app.created_at) }}</p>
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

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Team Card -->
        <BaseCard :hoverable="false" title="Mon Equipe">
          <div v-if="team" class="space-y-4">
            <div class="flex items-center gap-4 p-3 rounded-xl bg-gold/5 border border-gold/20">
              <div v-if="team.logo_url" class="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img :src="team.logo_url" :alt="team.name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-12 h-12 rounded-lg bg-gold-muted border border-border-gold flex items-center justify-center text-xl font-black text-gold shrink-0">
                {{ team.tag }}
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-text-primary truncate">{{ team.name }}</h3>
                <p class="text-xs text-gold uppercase tracking-widest font-bold">Membre actif</p>
              </div>
            </div>
            <BaseButton variant="secondary" size="md" :to="'/teams/' + team.id" class="w-full">
              Gerer l'equipe
            </BaseButton>
          </div>
          
          <div v-else-if="!creatingTeam" class="text-center py-6">
            <ShieldPlus :size="48" class="mx-auto text-text-muted/20 mb-3" />
            <p class="text-sm text-text-secondary mb-4">Vous n'avez pas encore d'equipe.</p>
            <BaseButton variant="primary" size="md" @click="creatingTeam = true" class="w-full">
              Creer une equipe
            </BaseButton>
          </div>

          <div v-else class="pt-2">
            <TeamCreateForm
              :loading="savingTeam"
              @submit="createTeam"
              @cancel="creatingTeam = false"
            />
          </div>
        </BaseCard>

        <!-- Statut de recrutement -->
        <BaseCard :hoverable="false" title="Statut de recrutement">
          <div class="space-y-4">
            <button 
              :disabled="!!team || togglingStatus"
              @click="toggleRecruitmentStatus"
              class="w-full relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group overflow-hidden"
              :class="[
                authStore.profile.is_looking_for_team && !team 
                  ? 'bg-success/5 border-success/30 hover:border-success/60 shadow-[0_0_20px_-10px_rgba(40,167,69,0.2)]' 
                  : 'bg-white/5 border-white/10 hover:border-white/20',
                team ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'
              ]"
            >
              <!-- Background Glow for Active State -->
              <div 
                v-if="authStore.profile.is_looking_for_team && !team"
                class="absolute inset-0 bg-gradient-to-r from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />

              <div class="relative z-10 flex flex-col items-start text-left">
                <span 
                  class="text-xs uppercase tracking-widest font-black mb-1 transition-colors"
                  :class="authStore.profile.is_looking_for_team && !team ? 'text-success' : 'text-text-muted'"
                >
                  {{ authStore.profile.is_looking_for_team && !team ? 'Visible' : 'Invisible' }}
                </span>
                <span class="text-sm font-bold text-text-primary">
                  {{ authStore.profile.is_looking_for_team && !team ? 'Je suis Agent Libre' : 'Recherche fermee' }}
                </span>
              </div>

              <!-- Visual Switch -->
              <div class="relative z-10">
                <div 
                  class="w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1"
                  :class="authStore.profile.is_looking_for_team && !team ? 'bg-success' : 'bg-white/10'"
                >
                  <div 
                    class="w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 transform"
                    :class="authStore.profile.is_looking_for_team && !team ? 'translate-x-6' : 'translate-x-0'"
                  >
                    <div 
                      v-if="togglingStatus" 
                      class="w-full h-full border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" 
                    />
                  </div>
                </div>
              </div>
            </button>
            
            <div class="px-1">
              <p v-if="team" class="text-[10px] text-gold font-black uppercase tracking-widest flex items-center gap-2">
                <Shield :size="12" />
                Statut verrouille (En equipe)
              </p>
              <p v-else class="text-[10px] text-text-muted leading-relaxed uppercase font-bold tracking-wider">
                {{ authStore.profile.is_looking_for_team ? 'Vous apparaissez dans la liste des agents. Cliquez pour vous retirer.' : 'Activez pour que les capitaines puissent vous recruter.' }}
              </p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Settings Modal -->
    <BaseModal v-model="showSettings" title="Parametres du profil" size="md">
      <ProfileSettingsForm
        :username="authStore.profile.username"
        :initial-bio="authStore.profile.bio || ''"
        :initial-riot-id="authStore.profile.riot_id || ''"
        :initial-avatar-url="authStore.profile.avatar_url || ''"
        :initial-discord="authStore.profile.discord || ''"
        :initial-is-looking="authStore.profile.is_looking_for_team"
        :initial-roles="authStore.profile.preferred_roles || []"
        :has-team="!!team"
        :saving="savingProfile"
        :syncing="fetchingRiot"
        @save="handleSaveSettings"
      />
    </BaseModal>
  </div>

  <BaseSpinner v-else-if="authStore.loading" />
  
  <BaseEmptyState
    v-else
    :icon="AlertTriangle"
    title="Profil introuvable"
    description="Impossible de charger votre profil. Veuillez vous reconnecter."
  >
    <template #action>
      <BaseButton @click="logout">Se reconnecter</BaseButton>
    </template>
  </BaseEmptyState>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShieldPlus,
  AlertTriangle,
  Settings,
  LogOut,
  BellOff,
  Check,
  Send,
  Shield,
  ExternalLink,
} from 'lucide-vue-next'
import DiscordIcon from '../components/icons/DiscordIcon.vue'
import LolRoleIcon from '../components/icons/LolRoleIcon.vue'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { getOpggUrl, getDpmUrl, formatRelativeTime, formatDate } from '../lib/formatters'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseAvatar from '../components/ui/BaseAvatar.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseTooltip from '../components/ui/BaseTooltip.vue'
import RankBadge from '../components/domain/RankBadge.vue'
import ProfileSettingsForm from '../components/forms/ProfileSettingsForm.vue'
import TeamCreateForm from '../components/forms/TeamCreateForm.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const showSettings = ref(false)
const savingProfile = ref(false)
const savingTeam = ref(false)
const fetchingRiot = ref(false)
const creatingTeam = ref(false)
const togglingStatus = ref(false)
const team = ref<any>(null)
const notifications = ref<any[]>([])
const sentApplications = ref<any[]>([])

const unreadNotifs = computed(() => notifications.value.filter(n => !n.is_read).length)

watch(() => authStore.profile, (p) => {
  if (p) {
    team.value = p.team
    // Auto-disable looking for team if user has a team
    if (p.team && p.is_looking_for_team) {
      silentlyDisableLooking()
    }
  }
}, { immediate: true })

onMounted(async () => {
  await fetchData()
})

async function silentlyDisableLooking() {
  const token = await getToken()
  try {
    await api.patch('/profiles/me', { is_looking_for_team: false }, token)
    await authStore.fetchProfile()
  } catch (e) {
    console.error('Failed to auto-disable recruitment status', e)
  }
}

async function toggleRecruitmentStatus() {
  if (team.value || togglingStatus.value) return
  
  togglingStatus.value = true
  try {
    const token = await getToken()
    const newStatus = !authStore.profile?.is_looking_for_team
    await api.patch('/profiles/me', { is_looking_for_team: newStatus }, token)
    await authStore.fetchProfile()
    notificationStore.show(
      newStatus ? 'Vous etes maintenant en recherche d\'equipe !' : 'Vous ne recherchez plus d\'equipe.', 
      'success'
    )
  } catch (err: any) {
    notificationStore.show('Erreur: ' + err.message, 'error')
  } finally {
    togglingStatus.value = false
  }
}

async function fetchData() {
  if (!authStore.user) return
  const token = await getToken()
  try {
    const [res, apps] = await Promise.all([
      api.get('/social/inbox', token),
      api.get('/profiles/me/applications', token),
    ])
    notifications.value = res.notifications || []
    sentApplications.value = apps
  } catch (e) {
    console.error(e)
  }
}

async function markAsRead(id: string) {
  const token = await getToken()
  try {
    await api.patch(`/social/notifications/${id}`, { is_read: true }, token)
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleSaveSettings(data: { bio: string; riot_id: string; avatar_url: string; discord: string; is_looking_for_team: boolean; preferred_roles: string[] }) {
  savingProfile.value = true
  fetchingRiot.value = true
  try {
    const token = await getToken()
    
    // Step 1: Update Profile data
    await api.patch('/profiles/me', data, token)
    
    // Step 2: Auto-sync Riot data if Riot ID is present
    if (data.riot_id && data.riot_id.includes('#')) {
      try {
        await api.post('/profiles/sync-riot', { riotId: data.riot_id }, token)
      } catch (syncErr) {
        console.warn('Riot sync failed, but profile was saved', syncErr)
      }
    }
    
    // Step 3: Refresh local store
    await authStore.fetchProfile()
    
    notificationStore.show('Profil mis a jour et synchronise !', 'success')
    showSettings.value = false
  } catch (err: any) {
    notificationStore.show('Erreur: ' + err.message, 'error')
  } finally {
    savingProfile.value = false
    fetchingRiot.value = false
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
