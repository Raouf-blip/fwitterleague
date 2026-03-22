<template>
  <BaseSpinner v-if="loading" />

  <div v-else-if="profile">
    <!-- Profile Header -->
    <BaseCard :hoverable="false" class="!p-6 mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <BaseAvatar :name="profile.username" size="xl" />
        <div class="flex-1">
          <h1 class="text-2xl font-extrabold text-text-primary">{{ profile.username }}</h1>
          <div class="flex items-center gap-3 mt-1 flex-wrap">
            <span class="text-sm text-gold">{{ profile.riot_id || 'Riot ID non configure' }}</span>
            <a
              v-if="opggUrl"
              :href="opggUrl"
              target="_blank"
              class="text-xs text-cyan hover:underline"
            >
              OP.GG
            </a>
            <span v-if="profile.discord" class="flex items-center gap-1 text-sm text-text-secondary">
              <DiscordIcon :size="14" class="text-[#5865F2]" />
              {{ profile.discord }}
            </span>
          </div>
          <div class="flex items-center gap-4 mt-3">
            <RankBadge :rank="profile.rank" />
            <div v-if="profile.preferred_roles?.length" class="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 shadow-inner">
              <span class="text-[10px] font-black text-text-muted uppercase tracking-widest mr-1">Postes:</span>
              <div class="flex items-center gap-2">
                <BaseTooltip 
                  v-for="role in profile.preferred_roles" 
                  :key="role"
                  :content="role"
                >
                  <div class="hover:scale-110 transition-transform cursor-pointer flex items-center justify-center">
                    <component 
                      :is="getRoleIcon(role)" 
                      :size="16" 
                      class="text-cyan"
                    />
                  </div>
                </BaseTooltip>
              </div>
            </div>
            <span class="text-sm text-text-secondary">
              Winrate: <strong class="text-text-primary">{{ profile.winrate }}%</strong>
            </span>
          </div>
          <BaseBadge v-if="profile.is_looking_for_team" variant="success" size="md" class="mt-3">
            Cherche une equipe
          </BaseBadge>
        </div>
        <BaseButton
          v-if="canRecruit"
          variant="primary"
          :loading="recruiting"
          @click="recruitPlayer"
        >
          <template #icon><UserPlus :size="16" /></template>
          Recruter
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
        <h2 class="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border">Equipe</h2>
        <div v-if="team">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-gold-muted border border-border-gold flex items-center justify-center text-sm font-bold text-gold">
              {{ team.tag }}
            </div>
            <div>
              <h3 class="font-bold text-text-primary text-sm">{{ team.name }} [{{ team.tag }}]</h3>
            </div>
          </div>
          <BaseButton variant="secondary" size="sm" :to="'/teams/' + team.id">Voir l'equipe</BaseButton>
        </div>
        <div v-else class="text-center py-4">
          <p class="text-sm text-text-muted">Ce joueur n'a pas encore d'equipe.</p>
        </div>
      </BaseCard>
    </div>
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
import { UserPlus, UserX, Shield, Swords, Sparkles, Target, Heart } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { getOpggUrl } from '../lib/formatters'
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

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const profile = ref<Profile | null>(null)
const team = ref<any>(null)
const loading = ref(true)
const recruiting = ref(false)

function getRoleIcon(role: string) {
  switch (role) {
    case 'Top': return Shield
    case 'Jungle': return Swords
    case 'Mid': return Sparkles
    case 'ADC': return Target
    case 'Support': return Heart
    default: return Target
  }
}

const opggUrl = computed(() => profile.value?.riot_id ? getOpggUrl(profile.value.riot_id) : null)
const canRecruit = computed(() => authStore.profile?.is_captain && !team.value)

onMounted(async () => {
  try {
    const data = await api.get(`/profiles/${route.params.id}`)
    profile.value = data
    team.value = data.team
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})

async function recruitPlayer() {
  if (!profile.value) return
  recruiting.value = true
  try {
    const token = await getToken()
    await api.post(`/recruitment/invite/${profile.value.id}`, {
      team_id: authStore.profile?.team?.id,
      message: `L'equipe ${authStore.profile?.team?.name} souhaite vous recruter.`,
    }, token)
    notificationStore.show('Offre de recrutement envoyee !', 'success')
  } catch (err: any) {
    notificationStore.show(err.message || "Impossible d'envoyer l'invitation", 'error')
  } finally {
    recruiting.value = false
  }
}
</script>
