<template>
  <div class="min-h-[70vh] flex items-center justify-center">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <Trophy :size="48" class="text-gold mx-auto mb-3" />
        <h1 class="text-3xl font-extrabold text-text-primary">
          Fwitter<span class="text-gold">League</span>
        </h1>
        <p class="text-sm text-text-secondary mt-1">Plateforme de tournois League of Legends</p>
      </div>

      <BaseCard :hoverable="false" class="!p-6">
        <BaseTabs
          :tabs="[
            { key: 'login', label: 'Connexion' },
            { key: 'register', label: 'Inscription' },
          ]"
          v-model="activeTab"
        />

        <div class="mt-6">
          <Transition name="fade" mode="out-in">
            <LoginForm v-if="activeTab === 'login'" :key="'login'" @success="onSuccess" />
            <RegisterForm v-else :key="'register'" @success="onRegisterSuccess" />
          </Transition>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy } from 'lucide-vue-next'
import { useNotificationStore } from '../stores/notifications'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseTabs from '../components/ui/BaseTabs.vue'
import LoginForm from '../components/forms/LoginForm.vue'
import RegisterForm from '../components/forms/RegisterForm.vue'

const router = useRouter()
const notificationStore = useNotificationStore()
const activeTab = ref('login')

function onSuccess() {
  router.push('/profile')
}

function onRegisterSuccess() {
  notificationStore.show('Inscription reussie !', 'success')
  router.push('/profile')
}
</script>
