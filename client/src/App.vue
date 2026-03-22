<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notifications'
import AppNavbar from './components/layout/AppNavbar.vue'
import AppFooter from './components/layout/AppFooter.vue'

import BaseSpinner from './components/ui/BaseSpinner.vue'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-vue-next'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastColors = {
  success: 'border-l-success text-success',
  error: 'border-l-danger text-danger',
  warning: 'border-l-warning text-warning',
  info: 'border-l-cyan text-cyan',
}

onMounted(async () => {
  await authStore.initialize()
})
</script>

<template>
  <!-- Toast System -->
  <div class="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="slide-right">
      <div
        v-for="toast in notificationStore.notifications"
        :key="toast.id"
        class="pointer-events-auto min-w-[320px] max-w-md bg-surface-elevated border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl cursor-pointer border-l-4 transition-all duration-300 hover:bg-surface-overlay"
        :class="toastColors[toast.type]"
        @click="notificationStore.remove(toast.id)"
      >
        <component :is="toastIcons[toast.type]" :size="20" class="shrink-0" />
        <span class="text-sm text-text-primary">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>

  <AppNavbar />

  <main class="min-h-screen pt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView v-if="!authStore.loading" v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
      <BaseSpinner v-else />
    </div>
  </main>

  <AppFooter />
</template>
