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
        <h3 class="font-bold text-text-primary truncate">{{ team.name }}</h3>
        <p class="text-xs text-text-muted mt-0.5">
          [{{ team.tag }}]
          <span v-if="memberCount !== undefined"> &middot; {{ memberCount }}/6 joueurs</span>
        </p>
      </div>
    </div>

    <p v-if="team.description" class="text-sm text-text-secondary mt-3 line-clamp-2">{{ team.description }}</p>

    <div class="mt-auto pt-4 flex items-center gap-2">
      <BaseButton variant="ghost" size="sm" :to="`/teams/${team.id}`">
        Voir details
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
        {{ isPending ? 'Deja postule' : 'Postuler' }}
      </BaseButton>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { Send } from 'lucide-vue-next'
import type { Team } from '../../types'
import BaseCard from '../ui/BaseCard.vue'
import BaseButton from '../ui/BaseButton.vue'

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
