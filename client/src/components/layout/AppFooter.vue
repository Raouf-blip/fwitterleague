<template>
  <footer class="border-t border-border mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3 text-text-muted text-sm">
          <img src="../../assets/logo.png" alt="FwitterLeague" class="h-10 w-auto" />
          <span>&copy; {{ year }}</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-text-muted">
          <RouterLink to="/patchnotes" class="hover:text-gold transition-colors">Patch Notes</RouterLink>
          <RouterLink to="/rules" class="hover:text-gold transition-colors">Règlement</RouterLink>
          <RouterLink to="/contact" class="hover:text-gold transition-colors">Contact</RouterLink>
        </div>
        <p class="text-xs text-text-muted">
          Plateforme de tournois League of Legends
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
