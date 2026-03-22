<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <BaseInput
      v-model="riotId"
      label="Riot ID"
      placeholder="Pseudo#TAG"
      required
    />
    
    <div v-if="riotId && riotId.includes('#')" class="flex items-center gap-2 -mt-3 mb-2">
      <a
        :href="getOpggUrl(riotId)"
        target="_blank"
        class="text-xs text-cyan hover:underline inline-flex items-center gap-1"
      >
        <ExternalLink :size="12" />
        Voir sur OP.GG
      </a>
    </div>

    <BaseInput
      v-model="discord"
      label="Discord"
      placeholder="tonpseudo"
    />

    <RoleSelector
      v-model="preferredRoles"
      label="Postes preferes"
    />

    <BaseTextarea
      v-model="bio"
      label="Bio / Description"
      placeholder="Decris ton style de jeu, tes champions preferes..."
      :rows="4"
    />

    <label 
      class="flex items-center gap-3 cursor-pointer group p-3 rounded-lg bg-white/5 border border-white/10 hover:border-cyan/30 transition-all"
      :class="{ 'opacity-50 grayscale cursor-not-allowed': hasTeam }"
    >
      <div class="relative">
        <input
          type="checkbox"
          v-model="isLooking"
          :disabled="hasTeam"
          class="sr-only peer"
        />
        <div class="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-cyan transition-colors" />
        <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
      </div>
      <div class="flex-1">
        <span class="block text-sm font-bold text-text-primary">Recrutement actif</span>
        <span v-if="hasTeam" class="block text-xs text-gold font-bold">Desactive (Deja en equipe)</span>
        <span v-else class="block text-xs text-text-secondary">Je recherche une equipe</span>
      </div>
    </label>

    <div class="pt-2">
      <BaseButton type="submit" variant="primary" size="lg" :loading="saving || syncing" class="w-full">
        <template #icon><Save :size="18" /></template>
        Enregistrer & Synchroniser
      </BaseButton>
      <p class="text-[10px] text-text-muted text-center mt-2 uppercase tracking-widest font-bold">
        La synchronisation avec Riot peut prendre quelques secondes
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Save, ExternalLink } from 'lucide-vue-next'
import { getOpggUrl } from '../../lib/formatters'
import BaseInput from '../ui/BaseInput.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseButton from '../ui/BaseButton.vue'
import RoleSelector from '../ui/RoleSelector.vue'

const props = defineProps<{
  initialBio?: string
  initialRiotId?: string
  initialDiscord?: string
  initialIsLooking?: boolean
  initialRoles?: string[]
  hasTeam?: boolean
  saving?: boolean
  syncing?: boolean
}>()

const emit = defineEmits<{
  save: [data: { bio: string; riot_id: string; discord: string; is_looking_for_team: boolean; preferred_roles: string[] }]
}>()

const bio = ref(props.initialBio || '')
const riotId = ref(props.initialRiotId || '')
const discord = ref(props.initialDiscord || '')
const isLooking = ref(props.initialIsLooking || false)
const preferredRoles = ref<string[]>(props.initialRoles || [])

watch(() => props.initialBio, (v) => { if (v !== undefined) bio.value = v })
watch(() => props.initialRiotId, (v) => { if (v !== undefined) riotId.value = v })
watch(() => props.initialDiscord, (v) => { if (v !== undefined) discord.value = v })
watch(() => props.initialIsLooking, (v) => { if (v !== undefined) isLooking.value = v })
watch(() => props.initialRoles, (v) => { if (v !== undefined) preferredRoles.value = v || [] })

function handleSubmit() {
  emit('save', {
    bio: bio.value,
    riot_id: riotId.value,
    discord: discord.value,
    is_looking_for_team: isLooking.value,
    preferred_roles: preferredRoles.value
  })
}
</script>
