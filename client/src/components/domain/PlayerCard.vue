<template>
  <BaseCard class="flex flex-col">
    <div class="flex items-start gap-3">
      <BaseAvatar :name="player.username" size="lg" />
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-text-primary truncate">{{ player.username }}</h3>
        <p v-if="player.riot_id" class="text-xs text-text-secondary mt-0.5">{{ player.riot_id }}</p>
        <div class="mt-2">
          <RankBadge :rank="player.rank" />
        </div>
      </div>
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
import { TrendingUp, UserPlus } from 'lucide-vue-next'
import type { Agent } from '../../types'
import BaseCard from '../ui/BaseCard.vue'
import BaseAvatar from '../ui/BaseAvatar.vue'
import BaseButton from '../ui/BaseButton.vue'
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
