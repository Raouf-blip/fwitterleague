<template>
  <div>
    <PageHeader title="Centre de Notifications" subtitle="Gerez vos invitations, candidatures et alertes." />

    <BaseTabs
      :tabs="[
        { key: 'inbox', label: 'Boite de reception', count: inbox.length },
        { key: 'outbox', label: 'Envoyes', count: outbox.length },
      ]"
      v-model="activeTab"
    />

    <BaseSpinner v-if="loading" />

    <div v-else class="mt-6">
      <!-- INBOX -->
      <Transition name="fade" mode="out-in">
        <div v-if="activeTab === 'inbox'" key="inbox">
          <BaseEmptyState
            v-if="inbox.length === 0"
            :icon="InboxIcon"
            title="Rien a signaler"
            description="Votre boite de reception est vide."
          />
          <div v-else class="space-y-3">
            <TransitionGroup name="list">
              <NotificationItem
                v-for="item in inbox"
                :key="item.id"
                :item="item"
                direction="inbox"
                @accept="respond(item, 'accepted')"
                @reject="respond(item, 'rejected')"
                @mark-read="markAsRead(item)"
              />
            </TransitionGroup>
          </div>
        </div>

        <!-- OUTBOX -->
        <div v-else key="outbox">
          <BaseEmptyState
            v-if="outbox.length === 0"
            :icon="Send"
            title="Aucune demande envoyee"
            description="Vous n'avez envoye aucune candidature ou invitation."
          />
          <div v-else class="space-y-3">
            <NotificationItem
              v-for="item in outbox"
              :key="item.id"
              :item="item"
              direction="outbox"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Inbox as InboxIcon, Send } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseTabs from '../components/ui/BaseTabs.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import BaseEmptyState from '../components/ui/BaseEmptyState.vue'
import NotificationItem from '../components/domain/NotificationItem.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const loading = ref(true)
const activeTab = ref('inbox')
const rawData = ref<any>({ notifications: [], interactions: [] })

const inbox = computed(() => {
  const notifs = rawData.value.notifications.map((n: any) => ({ ...n, isNotif: true }))

  const receivedApps = rawData.value.interactions.filter((i: any) => {
    const userIsCaptainOfThisTeam = authStore.profile?.team?.id === i.team_id && authStore.profile?.is_captain
    const userIsTargetOfOffer = i.type === 'offer' && i.sender_id === authStore.user?.id

    if (i.type === 'application') return userIsCaptainOfThisTeam
    if (i.type === 'offer') return userIsTargetOfOffer
    return false
  })

  return [...notifs, ...receivedApps].sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

const outbox = computed(() => {
  return rawData.value.interactions.filter((i: any) => {
    const userIsApplicant = i.type === 'application' && i.sender_id === authStore.user?.id
    const userIsInitiatorOfOffer = i.type === 'offer' && authStore.profile?.team?.id === i.team_id && authStore.profile?.is_captain
    return userIsApplicant || userIsInitiatorOfOffer
  })
})

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const token = await getToken()
    rawData.value = await api.get('/social/inbox', token)
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

async function markAsRead(item: any) {
  const token = await getToken()
  await api.patch(`/social/notifications/${item.id}`, {}, token)
  await fetchData()
}

async function respond(item: any, status: 'accepted' | 'rejected') {
  const token = await getToken()
  try {
    await api.patch(`/recruitment/${item.id}/respond`, { status }, token)
    await authStore.fetchProfile()
    await fetchData()
    notificationStore.show('Reponse enregistree !', 'success')
  } catch (e: any) {
    notificationStore.show(e.message || 'Une erreur est survenue', 'error')
  }
}
</script>
