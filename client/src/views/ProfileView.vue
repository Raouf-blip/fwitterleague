<template>
  <div v-if="authStore.profile">
    <!-- Profile Header (Aligned with ProfileDetailView) -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <BaseAvatar
          :name="authStore.profile.username"
          :src="authStore.profile.avatar_url ?? undefined"
          size="xl"
        />

        <div class="flex-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-extrabold text-text-primary">{{ authStore.profile.username }}</h1>

            <!-- Team Badge -->
            <div v-if="team" class="flex items-center gap-1.5 px-2 py-1 bg-gold/10 rounded-lg border border-gold/20 shrink-0">
              <Shield :size="12" class="text-gold" />
              <span class="text-[11px] font-black text-gold uppercase tracking-widest">{{ team.tag || team.name }}</span>
            </div>

            <!-- Caster Badge -->
            <div v-if="authStore.profile.is_caster" class="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20 shrink-0">
              <Mic :size="12" class="text-purple-400" />
              <span class="text-[11px] font-black text-purple-400 uppercase tracking-widest">Caster</span>
            </div>

            <!-- Admin Badge -->
            <BaseBadge
              v-if="authStore.profile.role === 'admin' || authStore.profile.role === 'superadmin'"
              variant="cyan"
              size="sm"
            >
              <ShieldCheck :size="12" class="text-cyan" />
              <span class="text-[11px] font-black text-cyan uppercase tracking-widest">Staff</span>
            </BaseBadge>
          </div>

          <div class="flex items-center gap-3 mt-1 flex-wrap">
            <span class="text-sm text-gold font-bold">{{
              authStore.profile.riot_id || "Riot ID non configuré"
            }}</span>
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
            <span v-if="authStore.profile.discord_id" class="flex items-center gap-1 text-sm text-text-secondary">
              <DiscordIcon :size="14" class="text-[#5865F2]" />
              {{ authStore.profile.discord }}
            </span>
          </div>

          <div class="flex items-center gap-4 mt-3">
            <RankBadge
              :rank="authStore.profile.rank"
              :lp="authStore.profile.lp"
            />
            <div
              v-if="authStore.profile.preferred_roles?.length"
              class="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 shadow-inner"
            >
              <span
                class="text-[10px] font-black text-text-muted uppercase tracking-widest mr-1"
                >Postes:</span
              >
              <div class="flex items-center gap-2">
                <BaseTooltip
                  v-for="role in authStore.profile.preferred_roles"
                  :key="role"
                  :content="role"
                >
                  <div
                    class="hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                  >
                    <LolRoleIcon :role="role" :size="16" class="text-cyan" />
                  </div>
                </BaseTooltip>
              </div>
            </div>
            <span class="text-sm text-text-secondary">
              Winrate:
              <strong class="text-text-primary"
                >{{ authStore.profile.winrate }}%</strong
              >
            </span>
          </div>

          <BaseBadge
            v-if="authStore.profile.is_looking_for_team && !team"
            variant="success"
            size="md"
            class="mt-3"
          >
            Cherche une équipe
          </BaseBadge>
        </div>

        <div
          class="flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto"
        >
          <BaseButton
            v-if="authStore.profile.riot_id"
            variant="cyan"
            size="md"
            class="w-full"
            :loading="syncingRiot"
            :disabled="isSyncDisabled"
            :title="isSyncDisabled ? syncTooltip : 'Synchroniser Riot'"
            @click="handleSyncRiot"
          >
            <template #icon><RefreshCw :size="18" /></template>
            Sync Riot
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="md"
            @click="showSettings = true"
            class="w-full"
          >
            <template #icon><Settings :size="18" /></template>
            Paramètres
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="logout"
            class="w-full text-danger hover:bg-danger/10"
          >
            <template #icon><LogOut :size="16" /></template>
            Déconnexion
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Discord Sync Alert Banner (Full Width) -->
      <div v-if="!authStore.profile.discord_id" class="lg:col-span-3">
        <div class="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-danger/10 border border-danger/20 gap-4 shadow-lg shadow-danger/5">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <div class="p-2 bg-danger/20 rounded-lg shrink-0">
              <AlertCircle :size="24" class="text-danger" />
            </div>
            <div>
              <p class="font-bold text-text-primary">Synchronisation Discord</p>
              <p class="text-xs text-text-secondary">Votre compte Discord n'est pas lié. Veuillez lier votre compte Discord dans les paramètres pour synchroniser vos informations avec le serveur.</p>
            </div>
          </div>
          <BaseButton variant="danger" size="sm" @click="showSettings = true" class="w-full sm:w-auto shrink-0">
            Lier mon compte
          </BaseButton>
        </div>
      </div>

      <div v-if="!authStore.profile.riot_id" class="lg:col-span-3">
        <div class="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-danger/10 border border-danger/20 gap-4 shadow-lg shadow-danger/5">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <div class="p-2 bg-danger/20 rounded-lg shrink-0">
              <AlertCircle :size="24" class="text-danger" />
            </div>
            <div>
              <p class="font-bold text-text-primary">Synchronisation Riot</p>
              <p class="text-xs text-text-secondary">Votre compte Riot n'est pas lié. Veuillez entrez votre Riot ID dans les paramètres pour que les autres joueurs puissent vous trouver.</p>
            </div>
          </div>
          <BaseButton variant="danger" size="sm" @click="showSettings = true" class="w-full sm:w-auto shrink-0">
            Lier mon compte
          </BaseButton>
        </div>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Bio -->
        <BaseCard :hoverable="false" title="Bio">
          <p class="text-text-secondary leading-relaxed whitespace-pre-wrap">
            {{
              authStore.profile.bio ||
              "Vous n'avez pas encore de bio. Ajoutez-en une dans les paramètres pour vous présenter aux autres joueurs !"
            }}
          </p>
        </BaseCard>

        <!-- Stats -->
        <BaseCard
          v-if="authStore.profile.scrim_stats"
          :hoverable="false"
          class="border border-cyan/20 bg-cyan/[0.03] shadow-[0_0_15px_-5px_rgba(34,211,238,0.2)]"
        >
          <div
            class="flex items-center gap-3 border-b border-cyan/10 pb-3 mb-4"
          >
            <h2 class="text-lg font-bold text-text-primary">
              Statistiques Scrims
            </h2>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBlock
              label="Matchs Joués"
              :value="authStore.profile.scrim_stats.games_played"
            />
            <StatBlock
              label="Winrate"
              :value="
                Math.round(
                  (authStore.profile.scrim_stats.wins /
                    authStore.profile.scrim_stats.games_played) *
                    100,
                ) + '%'
              "
              class="text-cyan font-mono"
            />
            <StatBlock
              label="KDA"
              :value="authStore.profile.scrim_stats.kda"
              :class="
                parseFloat(authStore.profile.scrim_stats.kda) > 3
                  ? 'text-gold'
                  : 'text-text-primary'
              "
            />
            <StatBlock
              label="CS/min"
              :value="authStore.profile.scrim_stats.avg_cs"
            />
          </div>
        </BaseCard>

        <!-- Private Panel: Notifications & Applications -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Notifications -->
          <BaseCard :hoverable="false">
            <template #title>
              <div class="flex items-center justify-between w-full">
                <span>Notifications</span>
                <span
                  v-if="unreadNotifs > 0"
                  class="text-[10px] px-2 py-0.5 bg-cyan text-white rounded-full"
                >
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
                :class="[
                  'p-3 rounded-lg border transition-all',
                  !notif.is_read
                    ? 'bg-cyan/5 border-cyan/20'
                    : 'bg-white/5 border-transparent opacity-60',
                ]"
              >
                <div class="flex justify-between items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-text-primary truncate">{{ notif.title }}</p>
                    <p class="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap break-words" :class="expandedNotifs.has(notif.id) ? '' : 'line-clamp-2'">
                      {{ notif.message }}
                    </p>
                    <button
                      v-if="notif.message && notif.message.length > 100"
                      @click="toggleNotif(notif.id)"
                      class="text-[10px] text-cyan hover:underline mt-1 font-bold uppercase tracking-tight"
                    >
                      {{ expandedNotifs.has(notif.id) ? 'Voir moins' : 'Lire la suite' }}
                    </button>
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
              <BaseButton
                variant="ghost"
                size="sm"
                to="/notifications"
                class="w-full mt-2"
              >
                Voir toutes les notifications
              </BaseButton>
            </div>
          </BaseCard>

          <!-- Interactions (Applications & Invitations) -->
          <BaseCard :hoverable="false" title="Invitations & Candidatures">
            <div v-if="allInteractions.length === 0" class="text-center py-8">
              <Send :size="32" class="mx-auto text-text-muted/30 mb-2" />
              <p class="text-sm text-text-muted">Aucune interaction en cours.</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="app in allInteractions.slice(0, 6)"
                :key="app.id"
                class="p-3 rounded-lg bg-surface border border-border flex items-center justify-between gap-3 shadow-sm"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-0.5">
                    <p class="text-sm font-bold text-text-primary truncate">
                      {{ interactionTitle(app) }}
                    </p>
                    <BaseBadge :variant="app.type === 'offer' ? 'gold' : 'cyan'" size="sm" class="text-[9px] uppercase">
                      {{ app.type === 'offer' ? 'Offre' : 'Candidature' }}
                    </BaseBadge>
                  </div>
                  <p class="text-[10px] text-text-muted uppercase font-bold flex items-center gap-1.5">
                    {{ app.type === 'offer' ? (app.sender_id === authStore.user?.id ? 'De :' : 'Pour :') : (app.sender_id === authStore.user?.id ? 'Vers :' : 'De :') }}
                    <span class="text-text-secondary">{{ interactionTarget(app) }}</span>
                    &middot; {{ formatRelativeTime(app.created_at) }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <BaseBadge
                    :variant="app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'"
                    size="sm"
                  >
                    {{ app.status === 'pending' ? 'En attente' : app.status === 'accepted' ? 'Accepté' : 'Refusé' }}
                  </BaseBadge>
                  <BaseButton
                    v-if="app.status === 'pending' && canRespond(app)"
                    variant="ghost"
                    size="sm"
                    to="/notifications"
                    class="!p-1 h-8 w-8"
                    title="Voir les détails"
                  >
                    <Eye :size="14" />
                  </BaseButton>
                </div>
              </div>
              <BaseButton variant="ghost" size="sm" to="/notifications" class="w-full mt-2">
                Gérer les invitations
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Team Card -->
        <BaseCard :hoverable="false" title="Mon Équipe">
          <div v-if="team" class="space-y-4">
            <div
              class="flex items-center gap-4 p-3 rounded-xl bg-gold/5 border border-gold/20"
            >
              <div
                v-if="team.logo_url"
                class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
              >
                <img
                  :src="team.logo_url"
                  :alt="team.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-12 h-12 rounded-lg bg-gold-muted border border-border-gold flex items-center justify-center text-xl font-black text-gold shrink-0"
              >
                {{ team.tag }}
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-text-primary truncate">{{ team.name }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <p class="text-[10px] text-gold uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20">Membre Actif</p>
                  <RankBadge v-if="team.average_rank && isAdmin" :rank="team.average_rank" />
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <BaseButton
                variant="secondary"
                size="md"
                :to="'/teams/' + team.id"
                class="flex-1"
              >
                Gérer l'équipe
              </BaseButton>
              <BaseButton
                v-if="!authStore.profile?.is_captain"
                variant="danger"
                size="md"
                @click="showLeaveConfirm = true"
              >
                <template #icon><DoorOpen :size="16" /></template>
                Quitter
              </BaseButton>
            </div>
          </div>

          <div v-else-if="!creatingTeam" class="text-center py-6">
            <ShieldPlus :size="48" class="mx-auto text-text-muted/20 mb-3" />
            <p class="text-sm text-text-secondary mb-4">
              Vous n'avez pas encore d'équipe.
            </p>
            <BaseButton
              variant="primary"
              size="md"
              @click="creatingTeam = true"
              class="w-full"
            >
              Créer une équipe
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
                team
                  ? 'opacity-50 cursor-not-allowed grayscale'
                  : 'cursor-pointer',
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
                  :class="
                    authStore.profile.is_looking_for_team && !team
                      ? 'text-success'
                      : 'text-text-muted'
                  "
                >
                  {{
                    authStore.profile.is_looking_for_team && !team
                      ? "Visible"
                      : "Invisible"
                  }}
                </span>
                <span class="text-sm font-bold text-text-primary">
                  {{
                    authStore.profile.is_looking_for_team && !team
                      ? "Je suis Agent Libre"
                      : "Recherche fermée"
                  }}
                </span>
              </div>

              <!-- Visual Switch -->
              <div class="relative z-10">
                <div
                  class="w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1"
                  :class="
                    authStore.profile.is_looking_for_team && !team
                      ? 'bg-success'
                      : 'bg-white/10'
                  "
                >
                  <div
                    class="w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 transform"
                    :class="
                      authStore.profile.is_looking_for_team && !team
                        ? 'translate-x-6'
                        : 'translate-x-0'
                    "
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
              <p
                v-if="team"
                class="text-[10px] text-gold font-black uppercase tracking-widest flex items-center gap-2"
              >
                <Shield :size="12" />
                Statut verrouillé (En équipe)
              </p>
              <p
                v-else
                class="text-[10px] text-text-muted leading-relaxed uppercase font-bold tracking-wider"
              >
                {{
                  authStore.profile.is_looking_for_team
                    ? "Vous apparaissez dans la liste des agents. Cliquez pour vous retirer."
                    : 'Activez le statut "Agent Libre" pour que les capitaines puissent vous recruter, sinon vous serez invisible.'
                }}
              </p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Settings Modal -->
    <BaseModal v-model="showSettings" title="Paramètres du profil" size="md">
      <ProfileSettingsForm
        :username="authStore.profile.username"
        :initial-bio="authStore.profile.bio || ''"
        :initial-riot-id="authStore.profile.riot_id || ''"
        :initial-avatar-url="authStore.profile.avatar_url || ''"
        :initial-discord="authStore.profile.discord || ''"
        :initial-discord-id="authStore.profile.discord_id || null"
        :initial-is-looking="authStore.profile.is_looking_for_team"
        :initial-roles="authStore.profile.preferred_roles || []"
        :has-team="!!team"
        :saving="savingProfile"
        :syncing="fetchingRiot"
        :riot-error="riotError"
        @save="handleSaveSettings"
        @sync="handleRiotSyncOnly"
      />
    </BaseModal>

    <!-- Leave Team Confirm -->
    <ConfirmDialog
      v-model="showLeaveConfirm"
      title="Quitter l'équipe"
      :message="`Voulez-vous vraiment quitter ${team?.name} [${team?.tag}] ? Cette action est irréversible.`"
      confirm-label="Quitter l'équipe"
      variant="danger"
      :loading="leavingTeam"
      @confirm="leaveTeam"
    />
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
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
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
  DoorOpen,
  RefreshCw,
  Mic,
  ShieldCheck,
  Eye,
  AlertCircle,
} from 'lucide-vue-next'
import DiscordIcon from '../components/icons/DiscordIcon.vue'
import LolRoleIcon from '../components/icons/LolRoleIcon.vue'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { useInboxStore } from '../stores/inbox'
import { getOpggUrl, getDpmUrl, formatRelativeTime } from '../lib/formatters'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseAvatar from '../components/ui/BaseAvatar.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseTooltip from '../components/ui/BaseTooltip.vue'
import RankBadge from '../components/domain/RankBadge.vue'
import StatBlock from "../components/domain/StatBlock.vue";
import ProfileSettingsForm from '../components/forms/ProfileSettingsForm.vue'
import TeamCreateForm from '../components/forms/TeamCreateForm.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const inboxStore = useInboxStore();
const router = useRouter();

const showSettings = ref(false);
const savingProfile = ref(false);
const savingTeam = ref(false);
const fetchingRiot = ref(false);
const syncingRiot = ref(false);
const riotError = ref("");
const creatingTeam = ref(false);
const showLeaveConfirm = ref(false);
const leavingTeam = ref(false);
const togglingStatus = ref(false);
const team = ref<any>(null);
const sentApplications = ref<any[]>([]);

const notifications = computed(() => inboxStore.notifications)
const unreadNotifs = computed(() => inboxStore.unreadCount)
const isAdmin = computed(() => authStore.profile?.role === 'admin' || authStore.profile?.role === 'superadmin')

const expandedNotifs = ref(new Set<string>())
function toggleNotif(id: string) {
  if (expandedNotifs.value.has(id)) expandedNotifs.value.delete(id)
  else expandedNotifs.value.add(id)
}

const allInteractions = computed(() => {
  const sent = sentApplications.value.map((a: any) => ({ ...a, direction: 'sent' }))
  const received = inboxStore.applications.map((a: any) => ({ ...a, direction: 'received' }))

  // Fusionner et retirer les doublons (si une offre apparaît dans les deux)
  const merged = [...sent]
  received.forEach((r: any) => {
    if (!merged.find((m: any) => m.id === r.id)) {
      merged.push(r)
    }
  })

  return merged.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

function interactionTitle(app: any) {
  return app.team?.name || 'Équipe inconnue'
}

function interactionTarget(app: any) {
  if (app.type === 'offer') {
    return app.sender_id === authStore.user?.id ? (app.team?.name || 'Une équipe') : (app.sender?.username || 'Un joueur')
  }
  return app.sender_id === authStore.user?.id ? (app.team?.name || 'Une équipe') : (app.sender?.username || 'Un joueur')
}

function canRespond(app: any) {
  if (app.type === 'offer' && app.sender_id === authStore.user?.id) return true
  if (app.type === 'application' && authStore.profile?.is_captain && app.team_id === authStore.profile?.team?.id) return true
  return false
}

watch(
  () => authStore.profile,
  (p) => {
    if (p) {
      team.value = p.team;
      // Auto-disable looking for team if user has a team
      if (p.team && p.is_looking_for_team) {
        silentlyDisableLooking();
      }
    }
    fetchData()
  },
  { immediate: true },
);

const now = ref(Date.now());
let syncTimer: any = null;

onMounted(async () => {
  syncTimer = setInterval(() => { now.value = Date.now() }, 10000)

  // Handle Discord Sync results from URL
  const params = new URLSearchParams(window.location.search)
  if (params.has('success')) {
    if (params.get('success') === 'discord_synced') {
      notificationStore.show('Compte Discord synchronisé !', 'success')
    }
    // Clean URL
    router.replace({ query: {} })
  } else if (params.has('error')) {
    const error = params.get('error')
    if (error === 'discord_denied') {
      notificationStore.show('Synchronisation Discord annulée.', 'warning')
    } else {
      notificationStore.show('Échec de la synchronisation Discord.', 'error')
    }
    // Clean URL
    router.replace({ query: {} })
  }

  await fetchData()
})

onUnmounted(() => {
  if (syncTimer) clearInterval(syncTimer);
});

const isSyncDisabled = computed(() => {
  if (!authStore.profile?.last_riot_sync) return false;
  const diff = now.value - new Date(authStore.profile.last_riot_sync).getTime();
  return diff < 2 * 60 * 1000; // 2 mins cooldown
});

const syncTooltip = computed(() => {
  if (!isSyncDisabled.value || !authStore.profile?.last_riot_sync) return "";
  const diff = now.value - new Date(authStore.profile.last_riot_sync).getTime();
  const remaining = 2 * 60 * 1000 - diff;
  const mins = Math.ceil(remaining / 60000);
  return `Prochaine synchronisation dans ${mins} min`;
});

async function silentlyDisableLooking() {
  const token = await getToken();
  try {
    await api.patch("/profiles/me", { is_looking_for_team: false }, token);
    await authStore.fetchProfile();
  } catch (e) {
    console.error("Failed to auto-disable recruitment status", e);
  }
}

async function toggleRecruitmentStatus() {
  if (team.value || togglingStatus.value) return;

  togglingStatus.value = true;
  try {
    const token = await getToken();
    const newStatus = !authStore.profile?.is_looking_for_team;
    await api.patch("/profiles/me", { is_looking_for_team: newStatus }, token);
    await authStore.fetchProfile();
    notificationStore.show(
      newStatus
        ? "Vous êtes maintenant en recherche d'\u00e9quipe !"
        : "Vous ne recherchez plus d'\u00e9quipe.",
      "success",
    );
  } catch (err: any) {
    notificationStore.show("Erreur: " + err.message, "error");
  } finally {
    togglingStatus.value = false;
  }
}

async function fetchData() {
  if (!authStore.user) return;
  const token = await getToken();
  try {
    const apps = await api.get("/profiles/me/applications", token);
    sentApplications.value = apps;
    await inboxStore.fetchInbox();
  } catch (e) {
    console.error(e);
  }
}

async function handleSyncRiot() {
  if (!authStore.profile?.riot_id || isSyncDisabled.value) return;
  syncingRiot.value = true;
  try {
    const token = await getToken();
    await api.post(
      "/profiles/sync-riot",
      { riotId: authStore.profile.riot_id },
      token,
    );
    await authStore.fetchProfile();
    notificationStore.show("Profil Riot synchronisé !", "success");
    now.value = Date.now(); // Force refresh tooltip
  } catch (err: any) {
    notificationStore.show(
      err.response?.data?.error || "Échec de la synchronisation",
      "error",
    );
  } finally {
    syncingRiot.value = false;
  }
}

async function handleRiotSyncOnly(newRiotId: string) {
  if (!newRiotId || !newRiotId.includes('#')) {
    riotError.value = 'Format invalide (Pseudo#TAG)'
    return
  }

  // Allow bypassing the cooldown IF it's a new ID
  const isNewId = newRiotId !== authStore.profile?.riot_id

  if (isSyncDisabled.value && !isNewId) {
    notificationStore.show(syncTooltip.value, 'warning')
    return
  }

  fetchingRiot.value = true
  riotError.value = ''
  try {
    const token = await getToken()
    await api.post('/profiles/sync-riot', { riotId: newRiotId }, token)
    await authStore.fetchProfile()
    notificationStore.show('Profil Riot synchronisé !', 'success')
  } catch (err: any) {
    let msg = err.message
    try { msg = JSON.parse(err.message).error || msg } catch(e) {}

    if (msg.includes('introuvable')) {
      riotError.value = 'Riot ID introuvable.'
    } else if (msg.includes('patienter')) {
      riotError.value = 'Veuillez patienter.'
    } else {
      riotError.value = 'Erreur de synchronisation.'
    }
    notificationStore.show('Erreur Riot Sync: ' + msg, 'error')
  } finally {
    fetchingRiot.value = false
  }
}


async function markAsRead(id: string) {
  try {
    await inboxStore.markAsRead(id)
  } catch (e) {
    console.error(e)
  }
}

async function handleSaveSettings(data: { bio: string; riot_id: string; avatar_url: string; discord: string; discord_id: string | null; is_looking_for_team: boolean; preferred_roles: string[] }) {
  savingProfile.value = true
  fetchingRiot.value = true
  riotError.value = ''

  try {
    const token = await getToken()

    // Step 1: Update Profile data
    await api.patch('/profiles/me', data, token)

    // Step 2: Auto-sync Riot data if Riot ID has changed
    if (data.riot_id !== authStore.profile?.riot_id) {
      if (data.riot_id && data.riot_id.includes('#')) {
        try {
          await api.post('/profiles/sync-riot', { riotId: data.riot_id }, token)
        } catch (syncErr: any) {
          let msg = syncErr.message
          try {
            msg = JSON.parse(syncErr.message).error || msg
          } catch(e) {}

          if (msg.includes('introuvable')) {
            riotError.value = 'Riot ID introuvable. Ce compte n\'existe pas.'
          } else if (msg.includes('patienter')) {
            riotError.value = 'Veuillez patienter 2 minutes entre chaque synchronisation.'
          } else {
            riotError.value = 'Impossible de lier ce compte Riot.'
          }
          return // N'enregistre pas la suite du flow de sauvegarde, garde la pop-up ouverte
        }
      }
    }
  } finally {
    savingProfile.value = false;
  }
}

async function createTeam(data: any) {
  savingTeam.value = true;
  try {
    const token = await getToken();
    await api.post("/teams", data, token);
    await authStore.fetchProfile(); // Reload to get team
    notificationStore.show(`Équipe ${data.name} créée !`, "success");
    creatingTeam.value = false;
  } catch (err: any) {
    notificationStore.show(
      err.response?.data?.error || "Impossible de créer l'équipe",
      "error",
    );
  } finally {
    savingTeam.value = false;
  }
}

async function leaveTeam() {
  if (!team.value) return;
  leavingTeam.value = true;
  try {
    const token = await getToken();
    await api.post(`/teams/${team.value.id}/leave`, {}, token);
    await authStore.fetchProfile();
    team.value = null; // Update local state immediately
    notificationStore.show("Vous avez quitté l'équipe.", "success");
    showLeaveConfirm.value = false;
  } catch (err: any) {
    notificationStore.show(
      err.response?.data?.error || "Impossible de quitter l'équipe",
      "error",
    );
  } finally {
    leavingTeam.value = false;
  }
}

function logout() {
  authStore.signOut();
  router.push("/login");
}
</script>
