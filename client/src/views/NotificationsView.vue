<template>
  <div>
    <PageHeader
      title="Centre de Notifications"
      subtitle="Gérez vos invitations, candidatures et alertes."
    />

    <BaseTabs
      :tabs="[
        { key: 'inbox', label: 'Boîte de réception', count: inbox.length },
        { key: 'outbox', label: 'Envoyés', count: outbox.length },
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
            title="Rien à signaler"
            description="Votre boîte de réception est vide."
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
            title="Aucune demande envoyée"
            description="Vous n'avez envoyé aucune candidature ou invitation."
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
import { ref, onMounted, computed } from "vue";
import { Inbox as InboxIcon, Send } from "lucide-vue-next";
import { api } from "../lib/api";
import { getToken } from "../composables/useAuth";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notifications";
import { useInboxStore } from "../stores/inbox";
import PageHeader from "../components/layout/PageHeader.vue";
import BaseTabs from "../components/ui/BaseTabs.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import BaseEmptyState from "../components/ui/BaseEmptyState.vue";
import NotificationItem from "../components/domain/NotificationItem.vue";

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const inboxStore = useInboxStore();
const loading = ref(true);
const activeTab = ref("inbox");

const inbox = computed(() => {
  const notifs = inboxStore.notifications.map((n: any) => ({
    ...n,
    isNotif: true,
  }));

  const receivedApps = inboxStore.applications.filter((i: any) => {
    const userIsCaptainOfThisTeam =
      authStore.profile?.team?.id === i.team_id &&
      authStore.profile?.is_captain;
    const userIsTargetOfOffer =
      i.type === "offer" && i.sender_id === authStore.user?.id;

    if (i.type === "application") return userIsCaptainOfThisTeam;
    if (i.type === "offer") return userIsTargetOfOffer;
    return false;
  });

  return [...notifs, ...receivedApps].sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
});

const outbox = computed(() => {
  const sentApps = inboxStore.applications.filter((i: any) => {
    const userIsApplicant =
      i.type === "application" && i.sender_id === authStore.user?.id;
    const userIsInitiatorOfOffer =
      i.type === "offer" &&
      authStore.profile?.team?.id === i.team_id &&
      authStore.profile?.is_captain;
    return userIsApplicant || userIsInitiatorOfOffer;
  });

  const sentNotifs = inboxStore.sentNotifications.map((n: any) => ({
    ...n,
    isSentNotif: true,
  }));

  return [...sentApps, ...sentNotifs].sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
});

onMounted(async () => {
  await fetchData();
});

async function fetchData() {
  loading.value = true;
  try {
    await inboxStore.fetchInbox();
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
}

async function markAsRead(item: any) {
  try {
    await inboxStore.markAsRead(item.id);
  } catch (e) {
    console.error(e);
  }
}

async function respond(item: any, status: "accepted" | "rejected") {
  const token = await getToken();
  try {
    if (item.type === "scrim_request") {
      const action = status === "accepted" ? "accept" : "decline";
      const scrimId = item.metadata?.scrim_id;
      if (!scrimId) throw new Error("Scrim ID manquant");
      await api.post(`/scrims/${scrimId}/challenge`, { action }, token);

      // Mark as read after action
      await inboxStore.markAsRead(item.id);
    } else {
      await api.patch(`/recruitment/${item.id}/respond`, { status }, token);
    }

    await authStore.fetchProfile();
    await fetchData();
    notificationStore.show("Réponse enregistrée !", "success");
  } catch (e: any) {
    notificationStore.show(e.message || "Une erreur est survenue", "error");
  }
}
</script>
