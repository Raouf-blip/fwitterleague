<template>
  <div>
    <!-- Filters/Search -->
    <div
      class="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center"
    >
      <div class="w-full sm:w-64">
        <BaseInput
          v-model="searchQuery"
          placeholder="Rechercher une équipe..."
          class="w-full"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-danger">
      {{ error }}
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-x-auto border border-border rounded-lg bg-surface"
    >
      <table class="w-full text-sm text-left">
        <thead
          class="bg-surface-elevated text-text-secondary border-b border-border"
        >
          <tr>
            <th
              class="p-3 font-medium cursor-pointer hover:text-text-primary select-none w-16 text-center"
              @click="sortBy('rank')"
            >
              #
            </th>
            <th
              class="p-3 font-medium cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('name')"
            >
              Équipe <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('games_played')"
            >
              Matchs <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('wins')"
            >
              Victoires <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('losses')"
            >
              Défaites <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('win_rate')"
            >
              Win Rate <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="team in sortedTeams"
            :key="team.id"
            class="hover:bg-surface-elevated transition-colors cursor-pointer"
            @click="$router.push(`/teams/${team.id}`)"
          >
            <td class="p-3 text-center font-bold text-text-muted">
              {{ team.rank }}
            </td>
            <td class="p-3">
              <div class="flex items-center gap-3">
                <div
                  v-if="team.logo_url"
                  class="w-8 h-8 rounded shrink-0 overflow-hidden"
                >
                  <img
                    :src="team.logo_url"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  v-else
                  class="w-8 h-8 rounded bg-surface-elevated flex items-center justify-center text-xs font-bold text-cyan shrink-0"
                >
                  {{ team.tag }}
                </div>
                <div>
                  <span class="font-bold text-text-primary block">{{
                    team.name
                  }}</span>
                  <span class="text-xs text-text-muted">{{ team.tag }}</span>
                </div>
              </div>
            </td>
            <td class="p-3 text-center text-text-secondary">
              {{ team.games_played }}
            </td>
            <td class="p-3 text-center text-success font-bold">
              {{ team.wins }}
            </td>
            <td class="p-3 text-center text-danger font-bold">
              {{ team.losses }}
            </td>
            <td class="p-3 text-center">
              <span
                class="font-bold px-2 py-1 rounded"
                :class="getWinRateColor(team.win_rate)"
              >
                {{ team.win_rate.toFixed(1) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="!loading && sortedTeams.length === 0"
      class="text-center py-12 text-text-muted"
    >
      Aucune équipe classée.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ArrowDownUp, Search } from "lucide-vue-next";
import { api } from "../../lib/api";
import BaseInput from "../ui/BaseInput.vue";
import BaseSpinner from "../ui/BaseSpinner.vue";

interface TeamStat {
  id: string;
  name: string;
  tag: string;
  logo_url?: string;
  games_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  rank: number;
}

const loading = ref(true);
const error = ref<string | null>(null);
const teams = ref<TeamStat[]>([]);
const searchQuery = ref("");
const sortKey = ref<keyof TeamStat>("rank");
const sortDesc = ref(false);

async function fetchStats() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api.get("/stats/teams");
    teams.value = data.map((t: any, index: number) => ({
      ...t,
      win_rate: Number(t.win_rate) || 0,
      rank: index + 1,
    }));
  } catch (e: any) {
    error.value = "Impossible de charger les statistiques d'équipe.";
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function sortBy(key: keyof TeamStat) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortKey.value = key;
    sortDesc.value = key !== "rank"; // Rank ascending by default, others descending
  }
}

const sortedTeams = computed(() => {
  let result = [...teams.value];

  // Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q),
    );
  }

  // Sort
  result.sort((a, b) => {
    const valA = a[sortKey.value];
    const valB = b[sortKey.value];

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDesc.value
        ? valB.localeCompare(valA)
        : valA.localeCompare(valB);
    }

    if (valA === valB) return 0;

    // Specific numeric sort
    return sortDesc.value
      ? Number(valB) - Number(valA)
      : Number(valA) - Number(valB);
  });

  return result;
});

function getWinRateColor(rate: number) {
  if (rate >= 60) return "text-success bg-success/10";
  if (rate >= 50) return "text-cyan bg-cyan/10";
  if (rate >= 40) return "text-warning bg-warning/10";
  return "text-danger bg-danger/10";
}

onMounted(() => {
  fetchStats();
});
</script>
