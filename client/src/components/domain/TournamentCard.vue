<template>
  <BaseCard class="flex flex-col">
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-bold text-text-primary text-lg">{{ tournament.name }}</h3>
      <BaseBadge :variant="statusVariant">{{ statusLabel }}</BaseBadge>
    </div>

    <p v-if="tournament.description" class="text-sm text-text-secondary mt-2 line-clamp-2">
      {{ tournament.description }}
    </p>

    <div class="mt-3 flex items-center gap-4 text-xs text-text-muted">
      <div class="flex items-center gap-1">
        <Calendar :size="14" />
        <span>{{ formatDate(tournament.start_date) }}</span>
      </div>
      <div class="flex items-center gap-1">
        <Users :size="14" />
        <span>{{ regCount }}/{{ tournament.max_teams }} equipes</span>
      </div>
    </div>

    <!-- Registration progress bar -->
    <div class="mt-3">
      <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="progressColor"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <div class="mt-auto pt-4 flex items-center gap-2">
      <BaseButton variant="ghost" size="sm" :to="`/tournaments/${tournament.id}`">
        Voir details
      </BaseButton>
      <BaseButton
        v-if="showRegister && tournament.status === 'upcoming'"
        variant="primary"
        size="sm"
        :loading="registering"
        @click="$emit('register', tournament)"
      >
        Inscrire mon equipe
      </BaseButton>
      <BaseButton
        v-else-if="isRegistered && tournament.status === 'upcoming'"
        variant="danger"
        size="sm"
        :loading="registering"
        @click="$emit('unregister', tournament)"
      >
        Se desinscrire
      </BaseButton>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Users } from 'lucide-vue-next'
import type { Tournament } from '../../types'
import { formatDate, getRegistrationCount } from '../../lib/formatters'
import { TOURNAMENT_STATUS_MAP } from '../../lib/constants'
import BaseCard from '../ui/BaseCard.vue'
import BaseBadge from '../ui/BaseBadge.vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps<{
  tournament: Tournament
  showRegister?: boolean
  isRegistered?: boolean
  registering?: boolean
}>()

defineEmits<{
  register: [tournament: Tournament]
  unregister: [tournament: Tournament]
}>()

const regCount = computed(() => getRegistrationCount(props.tournament.registrations))
const progressPercent = computed(() => Math.min(100, (regCount.value / props.tournament.max_teams) * 100))
const progressColor = computed(() => progressPercent.value >= 100 ? 'bg-danger' : progressPercent.value >= 75 ? 'bg-warning' : 'bg-cyan')

const statusConfig = computed(() => TOURNAMENT_STATUS_MAP[props.tournament.status])
const statusLabel = computed(() => statusConfig.value.label)
const statusVariant = computed(() => statusConfig.value.color as 'cyan' | 'gold' | 'muted')
</script>
