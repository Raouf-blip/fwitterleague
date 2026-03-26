<template>
  <BaseCard class="flex flex-col">
    <div class="flex items-start gap-3">
      <div v-if="team.logo_url" class="w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <img :src="team.logo_url" :alt="team.name" class="w-full h-full object-cover" />
      </div>
      <div v-else class="w-12 h-12 rounded-lg bg-gold-muted border border-border-gold flex items-center justify-center text-xl font-extrabold text-gold shrink-0">
        {{ team.tag }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-text-primary truncate">{{ team.name }}</h3>
          <BaseBadge variant="gold">{{ team.tag }}</BaseBadge>
          <span v-if="memberCount !== undefined" class="text-xs text-text-muted">{{ memberCount }}/6</span>
        </div>
        <div v-if="team.average_rank" class="flex items-center gap-1.5 text-[10px] text-text-muted font-bold mt-1">
          Elo moyen :
          <RankBadge :rank="team.average_rank" />
        </div>
      </div>
    </div>

    <p v-if="team.description" class="text-sm text-text-secondary mt-3 line-clamp-2">{{ team.description }}</p>

    <div class="mt-auto pt-4 flex items-center gap-2">
      <BaseButton variant="ghost" size="sm" :to="`/teams/${team.id}`">
        Voir détails
      </BaseButton>
      <BaseButton
        v-if="showApply"
        variant="cyan"
        size="sm"
        :loading="applying"
        :disabled="isPending"
        @click="$emit('apply', team)"
      >
        <template #icon><Send :size="14" /></template>
        {{ isPending ? 'Déjà postulé' : 'Postuler' }}
      </BaseButton>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { Send } from 'lucide-vue-next'
import type { Team } from '../../types'
import BaseCard from '../ui/BaseCard.vue'
import BaseBadge from '../ui/BaseBadge.vue'
import BaseButton from '../ui/BaseButton.vue'
import RankBadge from './RankBadge.vue'

defineProps<{
  team: Team
  memberCount?: number
  showApply?: boolean
  applying?: boolean
  isPending?: boolean
}>()

defineEmits<{
  apply: [team: Team]
}>()
</script>
