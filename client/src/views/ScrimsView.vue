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
        Tous
      </BaseButton>
      <BaseButton
        :variant="currentFilter === 'open' ? 'secondary' : 'ghost'"
        size="sm"
        @click="setFilter('open')"
      >
        Open (Pick-up)
      </BaseButton>
      <BaseButton
        :variant="currentFilter === 'team' ? 'secondary' : 'ghost'"
        size="sm"
        @click="setFilter('team')"
      >
        Challenge (Team)
      </BaseButton>
    </div>

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
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              :style="{ width: `${(scrim.participants?.length || 0) * 10}%` }"
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
          <span>{{ new Date(scrim.scheduled_at).toLocaleDateString() }}</span>
          <span class="group-hover:text-cyan transition-colors"
            >Voir détails &rarr;</span
          >
        </div>
      </div>
    </div>

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

const scrimStore = useScrimStore();
const showCreateModal = ref(false);
const currentFilter = ref("all");

const scrims = computed(() => {
  if (currentFilter.value === "all") return scrimStore.scrims;
  return scrimStore.scrims.filter((s) => s.type === currentFilter.value);
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
