<template>
  <form @submit.prevent="$emit('save', { bio, riot_id: riotId, is_looking_for_team: isLooking })" class="space-y-5">
    <div>
      <div class="flex items-end gap-3">
        <BaseInput
          v-model="riotId"
          label="Riot ID"
          placeholder="Pseudo#TAG"
          class="flex-1"
        />
        <BaseButton
          type="button"
          variant="cyan"
          size="md"
          :loading="syncing"
          :disabled="!riotId"
          @click="$emit('sync-riot', riotId)"
        >
          <template #icon><RefreshCw :size="14" /></template>
          Sync
        </BaseButton>
      </div>
      <a
        v-if="riotId && riotId.includes('#')"
        :href="getOpggUrl(riotId)"
        target="_blank"
        class="text-xs text-cyan hover:underline mt-1 inline-block"
      >
        Voir sur OP.GG
      </a>
    </div>

    <BaseTextarea
      v-model="bio"
      label="Bio / Description"
      placeholder="Decris ton style de jeu, tes champions preferes..."
      :rows="3"
    />

    <label class="flex items-center gap-3 cursor-pointer group">
      <div class="relative">
        <input
          type="checkbox"
          v-model="isLooking"
          class="sr-only peer"
        />
        <div class="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-cyan transition-colors" />
        <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
      </div>
      <span class="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
        Je recherche une equipe
      </span>
    </label>

    <BaseButton type="submit" variant="primary" :loading="saving">
      Sauvegarder
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { getOpggUrl } from '../../lib/formatters'
import BaseInput from '../ui/BaseInput.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps<{
  initialBio?: string
  initialRiotId?: string
  initialIsLooking?: boolean
  saving?: boolean
  syncing?: boolean
}>()

defineEmits<{
  save: [data: { bio: string; riot_id: string; is_looking_for_team: boolean }]
  'sync-riot': [riotId: string]
}>()

const bio = ref(props.initialBio || '')
const riotId = ref(props.initialRiotId || '')
const isLooking = ref(props.initialIsLooking || false)

watch(() => props.initialBio, (v) => { if (v !== undefined) bio.value = v })
watch(() => props.initialRiotId, (v) => { if (v !== undefined) riotId.value = v })
watch(() => props.initialIsLooking, (v) => { if (v !== undefined) isLooking.value = v })
</script>
