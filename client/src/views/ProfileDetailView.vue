<template>
  <BaseSpinner v-if="loading" />

  <div v-else-if="profile">
    <!-- Profile Header -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <BaseAvatar :name="profile.username" :src="profile.avatar_url ?? undefined" size="xl" />
        <div class="flex-1">
          <h1 class="text-2xl font-extrabold text-text-primary">{{ profile.username }}</h1>
          <div class="flex items-center gap-3 mt-1 flex-wrap">
            <span class="text-sm text-gold">{{ profile.riot_id || 'Riot ID non configuré' }}</span>
            <a
              v-if="opggUrl"
              :href="opggUrl"
              target="_blank"
              class="text-[10px] text-cyan hover:underline flex items-center gap-1 bg-cyan/5 px-1.5 py-0.5 rounded border border-cyan/10"
              title="Voir sur OP.GG"
            >
              <ExternalLink :size="12" />
              OP.GG
            </a>
            <a
              v-if="dpmUrl"
              :href="dpmUrl"
              target="_blank"
              class="text-[10px] text-cyan hover:underline flex items-center gap-1 bg-cyan/5 px-1.5 py-0.5 rounded border border-cyan/10"
              title="Voir sur DPM.LOL"
            >
              <ExternalLink :size="12" />
              DPM.LOL
            </a>
            <span v-if="profile.discord" class="flex items-center gap-1 text-sm text-text-secondary">
              <DiscordIcon :size="14" class="text-[#5865F2]" />
              {{ profile.discord }}
            </span>
          </div>
          <div class="flex items-center gap-4 mt-3">
            <RankBadge :rank="profile.rank" :lp="profile.lp" />
            <div v-if="profile.preferred_roles?.length" class="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 shadow-inner">
              <span class="text-[10px] font-black text-text-muted uppercase tracking-widest mr-1">Postes:</span>
              <div class="flex items-center gap-2">
                <BaseTooltip
                  v-for="role in profile.preferred_roles"
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
              Winrate: <strong class="text-text-primary">{{ profile.winrate }}%</strong>
            </span>
          </div>
          <BaseBadge v-if="profile.is_looking_for_team" variant="success" size="md" class="mt-3">
            Cherche une équipe
          </BaseBadge>
        </div>
        <BaseButton
          v-if="canRecruit"
          :variant="isInvited ? 'secondary' : 'primary'"
          :loading="recruiting"
          :disabled="isInvited"
          @click="showInvite = true"
        >
          <template #icon><UserPlus :size="16" /></template>
          {{ isInvited ? 'Déjà invité' : 'Recruter' }}
        </BaseButton>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Bio -->
      <BaseCard :hoverable="false">
        <h2 class="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border">Bio</h2>
        <p class="text-sm text-text-secondary leading-relaxed">
          {{ profile.bio || "Cet utilisateur n'a pas encore de bio." }}
        </p>
      </BaseCard>

      <!-- Team -->
      <BaseCard :hoverable="false">
        <h2 class="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border">Équipe</h2>
        <div v-if="team">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-gold-muted border border-border-gold flex items-center justify-center text-sm font-bold text-gold">
              {{ team.tag }}
            </div>
            <div>
              <h3 class="font-bold text-text-primary text-sm">{{ team.name }} [{{ team.tag }}]</h3>
            </div>
          </div>
          <BaseButton variant="secondary" size="sm" :to="'/teams/' + team.id">Voir l'équipe</BaseButton>
        </div>
        <div v-else class="text-center py-4">
          <p class="text-sm text-text-muted">Ce joueur n'a pas encore d'équipe.</p>
        </div>
      </BaseCard>
    </div>

    <!-- Invite Modal -->
    <InviteModal
      v-model="showInvite"
      :player-name="profile.username"
      :loading="recruiting"
      @submit="sendInvite"
    />
  </div>

  <BaseEmptyState v-else :icon="UserX" title="Profil introuvable" description="Ce joueur n'existe pas.">
    <template #action>
      <BaseButton to="/agents">Retour aux agents</BaseButton>
    </template>
  </BaseEmptyState>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DiscordIcon from '../components/icons/DiscordIcon.vue'
import LolRoleIcon from '../components/icons/LolRoleIcon.vue'
import { UserPlus, UserX, ExternalLink } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { getOpggUrl, getDpmUrl } from '../lib/formatters'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { Profile } from '../types'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseTooltip from '../components/ui/BaseTooltip.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseAvatar from '../components/ui/BaseAvatar.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import RankBadge from '../components/domain/RankBadge.vue'
import InviteModal from '../components/forms/InviteModal.vue'

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const profile = ref<Profile | null>(null)
const team = ref<any>(null)
const loading = ref(true)
const recruiting = ref(false)
const showInvite = ref(false)
const myTeamOffers = ref<any[]>([])

const opggUrl = computed(() => profile.value?.riot_id ? getOpggUrl(profile.value.riot_id) : null)
const dpmUrl = computed(() => profile.value?.riot_id ? getDpmUrl(profile.value.riot_id) : null)
const canRecruit = computed(() => {
  return authStore.profile?.is_captain &&
         profile.value?.id !== authStore.user?.id &&
         !team.value &&
         profile.value?.is_looking_for_team
})

const isInvited = computed(() => {
  if (!profile.value) return false
  return myTeamOffers.value.some((o: any) => o.sender_id === profile.value!.id)
})

onMounted(async () => {
  try {
    const data = await api.get(`/profiles/${route.params.id}`)
    profile.value = data
    team.value = data.team

    if (authStore.user && authStore.profile?.is_captain) {
      const token = await getToken()
      const inbox = await api.get('/social/inbox', token)
      myTeamOffers.value = inbox.interactions.filter((i: any) => i.type === 'offer' && i.status === 'pending')
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})

async function sendInvite(message: string) {
  if (!profile.value) return
  recruiting.value = true
  try {
    const token = await getToken()
    await api.post(`/recruitment/invite/${profile.value.id}`, {
      team_id: authStore.profile?.team?.id,
      message: message || `L'équipe ${authStore.profile?.team?.name} souhaite vous recruter.`,
    }, token)
    notificationStore.show('Offre de recrutement envoyée !', 'success')
    showInvite.value = false

    // Refresh inbox
    const inbox = await api.get('/social/inbox', token)
    myTeamOffers.value = inbox.interactions.filter((i: any) => i.type === 'offer' && i.status === 'pending')
  } catch (err: any) {
    notificationStore.show(err.message || "Impossible d'envoyer l'invitation", 'error')
  } finally {
    recruiting.value = false
  }
}
</script>
