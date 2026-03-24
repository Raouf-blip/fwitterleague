<template>
  <div>
    <PageHeader title="Casters & Diffuseurs" subtitle="Les voix officielles de la FwitterLeague. Retrouvez nos casters et streamers sur leurs chaînes." />

    <BaseSpinner v-if="loading" />

    <BaseEmptyState
      v-else-if="casters.length === 0"
      :icon="Mic"
      title="Aucun caster"
      description="Aucun caster n'est encore référencé."
    />

    <div v-else>
      <!-- Featured Casters (Big cards) -->
      <div v-if="featuredCasters.length > 0" class="mb-12">
        <h2 class="text-xs font-black uppercase tracking-widest text-purple-400 mb-6 flex items-center gap-2">
          <Star :size="14" />
          Casters Principaux
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="caster in featuredCasters"
            :key="caster.id"
            class="group relative bg-surface border border-purple-500/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]"
          >
            <!-- Gradient glow top -->
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-600" />

            <div class="p-6 flex flex-col items-center text-center">
              <RouterLink :to="`/profile/${caster.id}`" class="mb-4">
                <BaseAvatar :name="caster.username" :src="caster.avatar_url ?? undefined" size="xl" class="ring-2 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all" />
              </RouterLink>

              <RouterLink :to="`/profile/${caster.id}`" class="text-lg font-extrabold text-text-primary hover:text-purple-400 transition-colors">
                {{ caster.username }}
              </RouterLink>

              <div class="flex items-center gap-1.5 mt-2 px-2 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Star :size="10" class="text-purple-400" />
                <span class="text-[10px] font-black text-purple-400 uppercase tracking-widest">Caster Principal</span>
              </div>

              <p v-if="caster.bio" class="text-sm text-text-secondary mt-4 line-clamp-3 leading-relaxed">
                {{ caster.bio }}
              </p>

              <a
                v-if="caster.twitch_url"
                :href="caster.twitch_url"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9146FF]/10 border border-[#9146FF]/30 rounded-xl text-[#9146FF] hover:bg-[#9146FF]/20 hover:border-[#9146FF]/50 transition-all font-bold text-sm"
              >
                <TwitchIcon :size="18" />
                {{ getTwitchName(caster.twitch_url) }}
              </a>
              <div v-else class="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-text-muted text-sm">
                <TwitchIcon :size="18" />
                Chaîne non renseignée
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Casters -->
      <div v-if="otherCasters.length > 0">
        <h2 class="text-xs font-black uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
          <Mic :size="14" />
          Communauté Casters
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="caster in otherCasters"
            :key="caster.id"
            class="group bg-surface border border-border rounded-xl p-4 transition-all duration-200 hover:border-purple-500/30 hover:bg-white/[0.02]"
          >
            <div class="flex items-center gap-3">
              <RouterLink :to="`/profile/${caster.id}`">
                <BaseAvatar :name="caster.username" :src="caster.avatar_url ?? undefined" size="md" class="ring-1 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all" />
              </RouterLink>
              <div class="flex-1 min-w-0">
                <RouterLink :to="`/profile/${caster.id}`" class="font-bold text-text-primary hover:text-purple-400 transition-colors text-sm truncate block">
                  {{ caster.username }}
                </RouterLink>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <Mic :size="10" class="text-purple-400" />
                  <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest">Caster</span>
                </div>
              </div>
            </div>

            <p v-if="caster.bio" class="text-xs text-text-secondary mt-3 line-clamp-2 leading-relaxed">
              {{ caster.bio }}
            </p>

            <a
              v-if="caster.twitch_url"
              :href="caster.twitch_url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#9146FF] hover:underline"
            >
              <TwitchIcon :size="14" />
              {{ getTwitchName(caster.twitch_url) }}
              <ExternalLink :size="10" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Mic, Star, ExternalLink } from 'lucide-vue-next'
import { api } from '../lib/api'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import BaseAvatar from '../components/ui/BaseAvatar.vue'
import TwitchIcon from '../components/icons/TwitchIcon.vue'

interface Caster {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  twitch_url: string | null
  is_featured_caster: boolean
}

function getTwitchName(url: string): string {
  try {
    const clean = url.replace(/\/+$/, '')
    const parts = clean.split('/')
    return parts[parts.length - 1] || 'Twitch'
  } catch {
    return 'Twitch'
  }
}

const casters = ref<Caster[]>([])
const loading = ref(true)

const featuredCasters = computed(() => casters.value.filter(c => c.is_featured_caster))
const otherCasters = computed(() => casters.value.filter(c => !c.is_featured_caster))

onMounted(async () => {
  try {
    casters.value = await api.get('/profiles/casters')
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})
</script>
