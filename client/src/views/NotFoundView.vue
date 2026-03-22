<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <div class="text-8xl font-black text-gold/20 mb-4">404</div>
      <h1 class="text-2xl font-bold text-text-primary mb-2">Page introuvable</h1>
      <p class="text-text-secondary mb-6">Cette page n'existe pas ou a ete deplacee.</p>
      <BaseButton to="/" variant="primary">
        <template #icon><Home :size="16" /></template>
        Retour a l'accueil
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Home } from 'lucide-vue-next'
import BaseButton from '../components/ui/BaseButton.vue'
</script>
