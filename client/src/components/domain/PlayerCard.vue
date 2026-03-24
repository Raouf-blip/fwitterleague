<template>
  <BaseCard class="flex flex-col">
    <div class="flex items-start gap-3">
      <BaseAvatar :name="player.username" :src="player.avatar_url ?? undefined" size="lg" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="font-bold text-text-primary truncate">{{ player.username }}</h3>
          
          <!-- Status Badge next to name -->
          <div v-if="player.team" class="flex items-center gap-1 px-1.5 py-0.5 bg-gold/10 rounded border border-gold/20 shrink-0">
            <Shield :size="10" class="text-gold" />
            <span class="text-[9px] font-black text-gold uppercase tracking-tighter">{{ player.team.tag || player.team.name }}</span>
          </div>
          <div v-if="player.is_caster" class="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/20 shrink-0">
            <Mic :size="10" class="text-purple-400" />
            <span class="text-[9px] font-black text-purple-400 uppercase tracking-tighter">Caster</span>
          </div>
          <div v-if="player.role === 'admin' || player.role === 'superadmin'" class="flex items-center gap-1 px-1.5 py-0.5 bg-cyan/10 rounded border border-cyan/20 shrink-0">
            <ShieldCheck :size="10" class="text-cyan" />
            <span class="text-[9px] font-black text-cyan uppercase tracking-tighter">Staff</span>
          </div>
          <div v-else-if="player.is_looking_for_team" class="flex items-center gap-1 px-1.5 py-0.5 bg-cyan/10 rounded border border-cyan/20 shrink-0">
            <UserPlus :size="10" class="text-cyan" />
            <span class="text-[9px] font-black text-cyan uppercase tracking-tighter">Libre</span>
          </div>
        </div>

        <div v-if="player.riot_id" class="flex items-center gap-2 mt-0.5">
          <p class="text-xs text-text-secondary truncate">{{ player.riot_id }}</p>
          <a
            :href="getOpggUrl(player.riot_id)"
            target="_blank"
            class="text-[10px] text-cyan hover:underline flex items-center gap-1 bg-cyan/5 px-1.5 py-0.5 rounded border border-cyan/10"
            title="Voir sur OP.GG"
            @click.stop
          >
            <ExternalLink :size="10" />
            OP.GG
          </a>
          <a
            :href="getDpmUrl(player.riot_id)"
            target="_blank"
            class="text-[10px] text-cyan hover:underline flex items-center gap-1 bg-cyan/5 px-1.5 py-0.5 rounded border border-cyan/10"
            title="Voir sur DPM.LOL"
            @click.stop
          >
            <ExternalLink :size="10" />
            DPM.LOL
          </a>
        </div>
        <div class="mt-2 flex items-center gap-3">
          <RankBadge :rank="player.rank" :lp="player.lp" />
          
          <!-- Preferred Roles -->
          <div v-if="player.preferred_roles?.length" class="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-lg border border-white/5">
            <BaseTooltip
              v-for="role in player.preferred_roles"
              :key="role"
              :content="role"
            >
              <div class="cursor-pointer flex items-center justify-center">
                <LolRoleIcon :role="role" :size="14" class="text-cyan" />
              </div>
            </BaseTooltip>
          </div>
        </div>
      </div>
    </div>

    <div v-if="player.discord" class="flex items-center gap-1.5 mt-2 text-xs text-text-muted">
      <DiscordIcon :size="12" class="text-[#5865F2]" />
      <span>{{ player.discord }}</span>
    </div>

    <p v-if="player.bio" class="text-sm text-text-secondary mt-3 line-clamp-2">{{ player.bio }}</p>

    <div v-if="player.winrate" class="mt-3 flex items-center gap-2 text-xs text-text-muted">
      <TrendingUp :size="14" class="text-cyan" />
      <span>Winrate: <strong class="text-text-primary">{{ player.winrate }}%</strong></span>
    </div>

    <div class="mt-auto pt-4 flex items-center gap-2">
      <BaseButton
        variant="ghost"
        size="sm"
        :to="`/profile/${player.id}`"
      >
        Voir profil
      </BaseButton>
      <BaseButton
        v-if="showRecruit"
        :variant="invited ? 'secondary' : 'primary'"
        size="sm"
        :disabled="invited || recruiting"
        :loading="recruiting"
        @click="!invited && $emit('recruit', player)"
      >
        <template #icon><UserPlus :size="14" /></template>
        {{ invited ? 'Déjà invité' : 'Recruter' }}
      </BaseButton>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import DiscordIcon from '../icons/DiscordIcon.vue'
import LolRoleIcon from '../icons/LolRoleIcon.vue'
import { TrendingUp, UserPlus, ExternalLink, Shield, Mic, ShieldCheck } from 'lucide-vue-next'
import type { Agent } from '../../types'
import { getOpggUrl, getDpmUrl } from '../../lib/formatters'
import BaseCard from '../ui/BaseCard.vue'
import BaseAvatar from '../ui/BaseAvatar.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseTooltip from '../ui/BaseTooltip.vue'
import RankBadge from './RankBadge.vue'

defineProps<{
  player: Agent
  showRecruit?: boolean
  recruiting?: boolean
  invited?: boolean
}>()

defineEmits<{
  recruit: [player: Agent]
}>()
</script>
