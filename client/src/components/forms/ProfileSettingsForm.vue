<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Avatar Upload Section -->
    <div class="flex flex-col items-center gap-4 py-6 border-b border-white/5 mb-6">
      <div class="relative group">
        <div 
          class="w-24 h-24 rounded-full bg-surface-elevated border-2 border-border-cyan shadow-[0_0_20px_rgba(10,200,185,0.1)] overflow-hidden relative cursor-pointer"
          @click="triggerFileInput"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="username"
            class="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-cyan-muted text-cyan text-3xl font-black">
            {{ username ? username.charAt(0).toUpperCase() : '?' }}
          </div>

          <!-- Overlay on hover -->
          <div class="absolute inset-0 bg-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Pencil :size="24" class="text-white drop-shadow-lg" />
          </div>
        </div>

        <button
          type="button"
          @click="triggerFileInput"
          class="absolute bottom-0 right-0 p-2 bg-cyan text-body rounded-full shadow-lg hover:bg-cyan-light hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-body z-10"
          :disabled="uploading"
          title="Changer de photo"
        >
          <Loader2 v-if="uploading" :size="16" class="animate-spin" />
          <Pencil v-else :size="16" />
        </button>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept="image/*"
          @change="handleFileUpload"
        />
      </div>
      <div class="text-center">
        <p class="text-[10px] font-black uppercase tracking-widest text-cyan mb-1">Photo de profil</p>
        <p class="text-[10px] text-text-muted uppercase font-bold tracking-tight">PNG, JPG ou SVG (Max 2Mo)</p>
      </div>
    </div>

    <!-- Riot ID Section -->
    <div class="flex flex-col gap-1">
      <BaseInput
        v-model="riotId"
        label="Riot ID"
        placeholder="Pseudo#TAG"
        :error="riotError"
        :disabled="isRiotIdLocked"
        :class="{ 'border-danger ring-danger/30': riotError }"
      >
        <template #trailing>
          <div class="flex items-center gap-2">
            <!-- Sync Button (Visible when editing) -->
            <button
              v-if="!isRiotIdLocked && riotId.includes('#')"
              type="button"
              @click="$emit('sync', riotId)"
              class="p-1.5 text-cyan/60 hover:text-cyan transition-colors bg-cyan/5 hover:bg-cyan/10 rounded-md border border-cyan/10"
              title="Synchroniser"
              :disabled="syncing"
            >
              <Loader2 v-if="syncing" :size="14" class="animate-spin" />
              <Check v-else :size="14" />
            </button>

            <!-- Modifier Button (Visible when locked) -->
            <button
              v-if="isRiotIdLocked && initialRiotId"
              type="button"
              @click="isRiotIdLocked = false"
              class="p-1.5 text-cyan/60 hover:text-cyan transition-colors bg-cyan/5 hover:bg-cyan/10 rounded-md border border-cyan/10"
              title="Modifier le Riot ID"
            >
              <Pencil :size="14" />
            </button>
          </div>
        </template>
      </BaseInput>

      <div v-if="isRiotIdLocked && initialRiotId" class="flex items-center gap-4 px-1">
        <a
          :href="getOpggUrl(riotId)"
          target="_blank"
          class="text-[10px] font-bold text-cyan hover:underline inline-flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <ExternalLink :size="10" />
          Voir sur OP.GG
        </a>

        <a
          :href="getDpmUrl(riotId)"
          target="_blank"
          class="text-[10px] font-bold text-cyan hover:underline inline-flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <ExternalLink :size="10" />
          Voir sur DPM.LOL
        </a>
      </div>
    </div>

    <!-- Discord Section -->
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-bold text-text-secondary">Compte Discord</label>
      <div v-if="discordId" class="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-[#5865F2]/10 rounded-lg">
            <DiscordIcon :size="20" class="text-[#5865F2]" />
          </div>
          <div>
            <p class="text-xs font-black text-success uppercase tracking-wider">Compte Lié</p>
            <p class="text-sm font-bold text-text-primary">{{ discord }}</p>
          </div>
        </div>
        <BaseButton variant="ghost" size="sm" @click="handleSyncDiscord" :loading="syncingDiscord" class="text-[10px] uppercase font-black">
          Mettre à jour
        </BaseButton>
      </div>
      <div v-else class="flex flex-col gap-3">
        <p class="text-xs text-text-secondary leading-relaxed">
          Liez votre compte Discord permettant la synchronisation de vos informations avec le serveur.
        </p>
        <BaseButton 
          type="button"
          variant="secondary" 
          class="w-full !justify-start gap-3 border-[#5865F2]/30 hover:bg-[#5865F2]/10"
          :loading="syncingDiscord"
          @click="handleSyncDiscord"
        >
          <template #icon><DiscordIcon :size="18" class="text-[#5865F2]" /></template>
          Synchroniser mon compte Discord
        </BaseButton>
      </div>
    </div>

    <RoleSelector
      v-model="preferredRoles"
      label="Postes préférés"
    />

    <BaseTextarea
      v-model="bio"
      label="Bio / Description"
      placeholder="Décris ton style de jeu, tes champions préférés..."
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
        <span v-if="hasTeam" class="block text-xs text-gold font-bold">Désactivé (Déjà en équipe)</span>
        <span v-else class="block text-xs text-text-secondary">Je recherche une équipe</span>
      </div>
    </label>

    <div class="pt-2">
      <BaseButton type="submit" variant="primary" size="lg" :loading="saving || syncing || uploading" class="w-full">
        <template #icon><Save :size="18" /></template>
        Enregistrer les modifications
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Save, ExternalLink, Pencil, Loader2, Check } from 'lucide-vue-next'
import DiscordIcon from '../icons/DiscordIcon.vue'
import { getDpmUrl, getOpggUrl } from '../../lib/formatters'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { getToken } from '../../composables/useAuth'
import BaseInput from '../ui/BaseInput.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseButton from '../ui/BaseButton.vue'
import RoleSelector from '../ui/RoleSelector.vue'

const props = defineProps<{
  username?: string
  initialBio?: string
  initialRiotId?: string
  initialAvatarUrl?: string
  initialDiscord?: string
  initialDiscordId?: string | null
  initialIsLooking?: boolean
  initialRoles?: string[]
  hasTeam?: boolean
  saving?: boolean
  syncing?: boolean
  riotError?: string
}>()

const emit = defineEmits<{
  save: [data: { bio: string; riot_id: string; avatar_url: string; discord: string; discord_id: string | null; is_looking_for_team: boolean; preferred_roles: string[] }]
  sync: [riotId: string]
}>()

const bio = ref(props.initialBio || '')
const riotId = ref(props.initialRiotId || '')
const avatarUrl = ref(props.initialAvatarUrl || '')
const discord = ref(props.initialDiscord || '')
const discordId = ref(props.initialDiscordId || null)
const isLooking = ref(props.initialIsLooking || false)
const preferredRoles = ref<string[]>(props.initialRoles || [])
const uploading = ref(false)
const syncingDiscord = ref(false)
const isRiotIdLocked = ref(!!props.initialRiotId)
const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.initialBio, (v) => { if (v !== undefined) bio.value = v })
watch(() => props.initialAvatarUrl, (v) => { if (v !== undefined) avatarUrl.value = v })
watch(() => props.initialDiscord, (v) => { if (v !== undefined) discord.value = v })
watch(() => props.initialDiscordId, (v) => { if (v !== undefined) discordId.value = v })
watch(() => props.initialRiotId, (v) => { if (v !== undefined) { riotId.value = v; isRiotIdLocked.value = !!v } })
watch(() => props.initialIsLooking, (v) => { if (v !== undefined) isLooking.value = v })
watch(() => props.initialRoles, (v) => { if (v !== undefined) preferredRoles.value = v || [] })

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  
  // Get current user ID for the RLS policy: folder name must match user ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    alert('Session expirée')
    return
  }

  const filePath = `${user.id}/${fileName}`

  uploading.value = true
  try {
    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) throw uploadError

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    avatarUrl.value = publicUrl
  } catch (error: any) {
    console.error('Error uploading avatar:', error.message)
    alert('Erreur lors de l\'upload de l\'image : ' + error.message)
  } finally {
    uploading.value = false
  }
}

async function handleSyncDiscord() {
  syncingDiscord.value = true
  try {
    const token = await getToken()
    const { url } = await api.get('/auth/discord', token)
    if (url) {
      window.location.href = url
    }
  } catch (error: any) {
    console.error('Error getting Discord sync URL:', error.message)
    alert('Erreur lors de la préparation de la synchronisation Discord.')
  } finally {
    syncingDiscord.value = false
  }
}

function handleSubmit() {
  emit('save', {
    bio: bio.value,
    riot_id: riotId.value,
    avatar_url: avatarUrl.value,
    discord: discord.value,
    discord_id: discordId.value,
    is_looking_for_team: isLooking.value,
    preferred_roles: preferredRoles.value
  })
}
</script>
