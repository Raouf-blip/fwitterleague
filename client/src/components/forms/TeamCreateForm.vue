<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Logo Upload Section -->
    <div class="flex flex-col items-center gap-4 py-6 border-b border-white/5 mb-6">
      <div class="relative group">
        <div 
          class="w-24 h-24 rounded-2xl bg-surface-elevated border-2 border-border-gold shadow-[0_0_20px_rgba(200,170,110,0.1)] overflow-hidden relative cursor-pointer"
          @click="triggerFileInput"
        >
          <img
            v-if="logoUrl"
            :src="logoUrl"
            :alt="name"
            class="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gold-muted text-gold text-3xl font-black">
            {{ tag || '?' }}
          </div>

          <!-- Overlay on hover -->
          <div class="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Pencil :size="24" class="text-white drop-shadow-lg" />
          </div>
        </div>
        
        <button
          type="button"
          @click="triggerFileInput"
          class="absolute -bottom-2 -right-2 p-2 bg-gold text-body rounded-lg shadow-lg hover:bg-gold-light hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-body z-10"
          :disabled="uploading"
          title="Changer le logo"
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
        <p class="text-[10px] font-black uppercase tracking-widest text-gold mb-1">Logo de l'équipe</p>
        <p class="text-[10px] text-text-muted uppercase font-bold tracking-tight">PNG, JPG ou SVG (Max 2Mo)</p>
      </div>
    </div>

    <BaseInput
      v-model="name"
      label="Nom de l'équipe"
      placeholder="Les Invincibles"
      required
    />
    <BaseInput
      v-model="tag"
      label="Tag (max 4 caractères)"
      placeholder="INVC"
      required
      :maxlength="4"
    />
    <BaseTextarea
      v-model="description"
      label="Description"
      placeholder="Présentation de l'équipe..."
      :rows="3"
    />
    <div class="flex gap-3 pt-2">
      <BaseButton type="submit" variant="primary" :loading="loading || uploading" class="flex-1">
        {{ submitLabel }}
      </BaseButton>
      <BaseButton type="button" variant="ghost" @click="$emit('cancel')">
        Annuler
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, Loader2 } from 'lucide-vue-next'
import { supabase } from '../../lib/supabase'
import BaseInput from '../ui/BaseInput.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseButton from '../ui/BaseButton.vue'

const props = withDefaults(defineProps<{
  initialName?: string
  initialTag?: string
  initialLogoUrl?: string
  initialDescription?: string
  loading?: boolean
  submitLabel?: string
}>(), {
  submitLabel: 'Créer',
})

const emit = defineEmits<{
  submit: [data: { name: string; tag: string; logo_url: string; description: string }]
  cancel: []
}>()

const name = ref(props.initialName || '')
const tag = ref(props.initialTag || '')
const logoUrl = ref(props.initialLogoUrl || '')
const description = ref(props.initialDescription || '')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${fileName}` // Upload to root of bucket

  uploading.value = true
  try {
    const { error: uploadError } = await supabase.storage
      .from('team-logos')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('team-logos')
      .getPublicUrl(filePath)

    logoUrl.value = publicUrl
  } catch (error: any) {
    console.error('Error uploading logo:', error.message)
    alert('Erreur lors de l\'upload du logo : ' + error.message)
  } finally {
    uploading.value = false
  }
}

function handleSubmit() {
  if (!name.value.trim() || !tag.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    tag: tag.value.trim().toUpperCase(),
    logo_url: logoUrl.value.trim(),
    description: description.value.trim(),
  })
}
</script>
