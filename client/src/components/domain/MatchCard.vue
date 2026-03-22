<template>
  <div class="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 transition-all duration-200 hover:border-border-gold">
    <!-- Team 1 -->
    <div class="flex-1 text-right">
      <span
        :class="[
          'font-semibold text-sm',
          match.winner_id === match.team_1_id ? 'text-gold' : 'text-text-primary',
        ]"
      >
        {{ match.team_1?.name || 'TBD' }}
      </span>
    </div>

    <!-- Score -->
    <div class="flex items-center gap-2 px-3">
      <span
        :class="[
          'text-lg font-extrabold w-6 text-center',
          match.winner_id === match.team_1_id ? 'text-gold' : 'text-text-secondary',
        ]"
      >
        {{ match.score_1 ?? '-' }}
      </span>
      <span class="text-text-muted text-xs">VS</span>
      <span
        :class="[
          'text-lg font-extrabold w-6 text-center',
          match.winner_id === match.team_2_id ? 'text-gold' : 'text-text-secondary',
        ]"
      >
        {{ match.score_2 ?? '-' }}
      </span>
    </div>

    <!-- Team 2 -->
    <div class="flex-1">
      <span
        :class="[
          'font-semibold text-sm',
          match.winner_id === match.team_2_id ? 'text-gold' : 'text-text-primary',
        ]"
      >
        {{ match.team_2?.name || 'TBD' }}
      </span>
    </div>

    <!-- Date -->
    <div class="text-xs text-text-muted hidden sm:block shrink-0">
      {{ formatDate(match.scheduled_at) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match } from '../../types'
import { formatDate } from '../../lib/formatters'

defineProps<{
  match: Match
}>()
</script>
