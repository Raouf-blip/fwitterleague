<template>
  <BaseCard class="flex flex-col">
    <div class="flex items-start gap-3">
      <BaseAvatar :name="player.username" size="lg" />
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-text-primary truncate">{{ player.username }}</h3>
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
          <RankBadge :rank="player.rank" />
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
        v-if="player.riot_id"
        variant="ghost"
        size="sm"
        :to="`/profile/${player.id}`"
      >
        Voir profil
      </BaseButton>
      <BaseButton
        v-if="showRecruit"
        variant="primary"
        size="sm"
        :loading="recruiting"
        @click="$emit('recruit', player)"
      >
        <template #icon><UserPlus :size="14" /></template>
        Recruter
      </BaseButton>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import DiscordIcon from '../icons/DiscordIcon.vue'
import LolRoleIcon from '../icons/LolRoleIcon.vue'
import { TrendingUp, UserPlus, ExternalLink } from 'lucide-vue-next'
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
}>()

defineEmits<{
  recruit: [player: Agent]
}>()
</script>
