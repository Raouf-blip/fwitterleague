<template>
  <div class="px-4 pb-12">
    <PageHeader
      title="Scrims"
      subtitle="Entraînez-vous en équipe ou rejoignez des parties ouvertes."
    >
      <template #actions>
        <BaseButton @click="showCreateModal = true" variant="primary">
          <template #icon><Swords :size="18" /></template>
          Créer un Scrim
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-6">
      <BaseButton
        :variant="currentFilter === 'all' ? 'secondary' : 'ghost'"
        size="sm"
        @click="setFilter('all')"
      >
        En cours / À venir
      </BaseButton>
      <div class="w-px bg-border mx-2"></div>
      <BaseButton
        :variant="currentFilter === 'history' ? 'secondary' : 'ghost'"
        size="sm"
        @click="setFilter('history')"
      >
        Historique
      </BaseButton>
      <div class="w-px bg-border mx-2"></div>
      <BaseButton
        :variant="currentFilter === 'players' ? 'secondary' : 'ghost'"
        size="sm"
        @click="setFilter('players')"
      >
        Classement Joueurs
      </BaseButton>
    </div>

    <!-- Players Stats View -->
    <div v-if="currentFilter === 'players'">
      <PlayerStatsTable />
    </div>

    <!-- Scrims View -->
    <div v-else>
      <!-- Loading / Empty -->
      <div
        v-if="scrimStore.loading && scrims.length === 0"
        class="flex justify-center py-12"
      >
        <BaseSpinner size="lg" />
      </div>

      <BaseEmptyState
        v-else-if="scrims.length === 0"
        :icon="Swords"
        title="Aucun scrim prévu"
        description="Soyez le premier à proposer un match d'entraînement !"
      />

      <!-- List -->
      <div v-else>
        <!-- Grid Cards View (Active) -->
        <div
          v-if="currentFilter !== 'history'"
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            v-for="scrim in scrims"
            :key="scrim.id"
            class="bg-surface border border-border rounded-xl p-4 hover:border-cyan/50 transition-colors cursor-pointer group"
            @click="$router.push(`/scrims/${scrim.id}`)"
          >
            <!-- Header -->
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-2">
                <BaseBadge :variant="scrim.type === 'open' ? 'cyan' : 'purple'">
                  {{ scrim.type === "open" ? "OPEN" : "TEAM" }}
                </BaseBadge>
                <span class="text-xs text-text-muted font-mono">
                  {{
                    new Date(scrim.scheduled_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}
                </span>
              </div>
              <BaseBadge size="sm" :variant="getStatusVariant(scrim.status)">
                {{ getStatusLabel(scrim.status) }}
              </BaseBadge>
            </div>

            <!-- Content -->
            <div
              v-if="scrim.type === 'team'"
              class="flex items-center justify-between px-2 py-4"
            >
              <div class="text-center w-1/3">
                <div class="font-bold text-text-primary truncate">
                  {{ scrim.challenger_team?.tag || "?" }}
                </div>
                <div class="text-[10px] text-text-muted">
                  {{ scrim.challenger_team?.name }}
                </div>
              </div>
              <div class="text-sm font-bold text-text-muted">VS</div>
              <div class="text-center w-1/3">
                <div class="font-bold text-text-primary truncate">
                  {{ scrim.challenged_team?.tag || "?" }}
                </div>
                <div class="text-[10px] text-text-muted">
                  {{ scrim.challenged_team?.name }}
                </div>
              </div>
            </div>

            <div v-else class="py-2">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm text-text-secondary"
                  >Organisé par
                  <span class="text-text-primary font-medium">{{
                    scrim.creator?.username
                  }}</span></span
                >
              </div>
              <!-- Slots usage -->
              <div class="w-full bg-surface-elevated rounded-full h-2 mt-2">
                <div
                  class="bg-cyan h-2 rounded-full transition-all"
                  :style="{
                    width: `${(scrim.participants?.length || 0) * 10}%`,
                  }"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-text-muted mt-1">
                <span>{{ scrim.participants?.length || 0 }} / 10 joueurs</span>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-text-muted"
            >
              <span>{{
                new Date(scrim.scheduled_at).toLocaleDateString()
              }}</span>
              <span class="group-hover:text-cyan transition-colors"
                >Voir détails &rarr;</span
              >
            </div>
          </div>
        </div>

        <!-- List Rows View (History) -->
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="scrim in scrims"
            :key="scrim.id"
            class="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-surface-elevated transition-colors cursor-pointer gap-4 group"
            @click="$router.push(`/scrims/${scrim.id}`)"
          >
            <!-- Date & Time -->
            <div class="flex items-center gap-4 min-w-[150px]">
              <div class="flex flex-col">
                <span class="font-bold text-lg text-text-primary">
                  {{ new Date(scrim.scheduled_at).toLocaleDateString() }}
                </span>
                <span class="text-xs text-text-muted">
                  {{
                    new Date(scrim.scheduled_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}
                </span>
              </div>
              <!-- Badge Type -->
              <BaseBadge :variant="scrim.type === 'open' ? 'cyan' : 'purple'">
                {{ scrim.type === "open" ? "OPEN" : "TEAM" }}
              </BaseBadge>
            </div>

            <!-- Match Info -->
            <div class="flex-1 flex items-center justify-start md:pl-50">
              <div
                v-if="scrim.type === 'team'"
                class="flex items-center gap-4 text-sm md:text-base w-full justify-start"
              >
                <div
                  class="flex items-center gap-2"
                  :class="
                    scrim.winner_id &&
                    scrim.challenger_team?.id &&
                    scrim.winner_id === scrim.challenger_team?.id
                      ? 'text-success font-bold'
                      : 'text-text-primary'
                  "
                >
                  {{
                    scrim.challenger_team?.tag || scrim.challenger_team?.name
                  }}
                </div>
                <span class="text-text-muted font-bold text-xs shrink-0"
                  >VS</span
                >
                <div
                  class="flex items-center gap-2"
                  :class="
                    scrim.winner_id &&
                    scrim.challenged_team?.id &&
                    scrim.winner_id === scrim.challenged_team?.id
                      ? 'text-success font-bold'
                      : 'text-text-primary'
                  "
                >
                  {{
                    scrim.challenged_team?.tag || scrim.challenged_team?.name
                  }}
                </div>
              </div>
              <div v-else class="flex items-center gap-2 w-full justify-start">
                <span class="text-text-primary font-medium">Scrim Open</span>
                <span class="text-xs text-text-muted"
                  >par {{ scrim.creator?.username }}</span
                >
              </div>
            </div>

            <!-- Status & Result -->
            <div
              class="flex items-center gap-4 justify-between md:justify-end min-w-[120px]"
            >
              <div v-if="scrim.status === 'completed'" class="text-right">
                <span class="text-xs text-text-muted block whitespace-nowrap"
                  >Durée:
                  {{
                    scrim.game_duration
                      ? Math.floor(scrim.game_duration / 60) + " min"
                      : "-"
                  }}</span
                >
              </div>
              <BaseBadge size="sm" :variant="getStatusVariant(scrim.status)">
                {{ getStatusLabel(scrim.status) }}
              </BaseBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Close Wrapper -->

    <CreateScrimModal v-model="showCreateModal" @created="refresh" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Swords } from "lucide-vue-next"; // New icon
import { useScrimStore } from "../stores/scrims";
import PageHeader from "../components/layout/PageHeader.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import BaseEmptyState from "../components/ui/BaseEmptyState.vue";
import CreateScrimModal from "../components/forms/CreateScrimModal.vue";
import PlayerStatsTable from "../components/domain/PlayerStatsTable.vue";

const scrimStore = useScrimStore();
const showCreateModal = ref(false);
const currentFilter = ref("all");

const scrims = computed(() => {
  const allScrims = scrimStore.scrims;

  if (currentFilter.value === "history") {
    return allScrims
      .filter((s) => ["completed", "cancelled"].includes(s.status))
      .sort(
        (a, b) =>
          new Date(b.scheduled_at).getTime() -
          new Date(a.scheduled_at).getTime(),
      );
  }

  // Active scrims (scheduled, pending)
  const activeScrims = allScrims
    .filter((s) => !["completed", "cancelled"].includes(s.status))
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );

  if (currentFilter.value === "all") return activeScrims;
  return activeScrims.filter((s) => s.type === currentFilter.value);
});

function setFilter(filter: string) {
  currentFilter.value = filter;
  // On pourrait trigger un fetch avec params ici, mais pour l'instant on filtre localement
  // refresh() if needed
}

function getStatusVariant(status: string) {
  switch (status) {
    case "scheduled":
      return "success";
    case "pending":
      return "warning";
    case "completed":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "default";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "Planifié";
    case "pending":
      return "En attente";
    case "completed":
      return "Terminé";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

async function refresh() {
  await scrimStore.fetchScrims();
}

onMounted(() => {
  refresh();
});
</script>
