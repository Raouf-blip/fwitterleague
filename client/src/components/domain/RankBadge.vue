<template>
  <span
    v-if="rank"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border"
    :style="{ color: rankColor, borderColor: rankColor + '40', backgroundColor: rankColor + '15' }"
  >
    {{ rank }}
  </span>
  <span v-else class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-text-muted bg-white/5 border border-white/10">
    Unranked
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getRankColor } from '../../lib/formatters'

const props = defineProps<{
  rank: string | null
}>()

const rankColor = computed(() => getRankColor(props.rank))
</script>
