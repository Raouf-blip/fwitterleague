<template>
  <span
    v-if="rank"
    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border shadow-sm"
    :style="{ color: rankColor, borderColor: rankColor + '40', backgroundColor: rankColor + '15' }"
  >
    <img :src="rankIconSrc" :alt="rank" class="w-4 h-4 object-contain drop-shadow-md" />
    {{ rank }}
  </span>
  <span v-else class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-text-muted bg-white/5 border border-white/10">
    <img :src="rankIconSrc" alt="Unranked" class="w-4 h-4 object-contain opacity-60" />
    Unranked
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getRankColor, getRankIconUrl } from '../../lib/formatters'

const props = defineProps<{
  rank: string | null
}>()

const rankIconSrc = computed(() => getRankIconUrl(props.rank))
const rankColor = computed(() => getRankColor(props.rank))
</script>
