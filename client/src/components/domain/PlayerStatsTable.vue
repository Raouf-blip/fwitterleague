<template>
  <div>
    <!-- Filters/Search -->
    <div
      class="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center"
    >
      <div class="w-full sm:w-64">
        <BaseInput
          v-model="searchQuery"
          placeholder="Rechercher un joueur..."
          class="w-full"
        >
          <template #prefix>
            <Search :size="16" class="text-text-muted" />
          </template>
        </BaseInput>
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
              class="p-3 font-medium cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('rank_val')"
            >
              Rang <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('username')"
            >
              Joueur <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('games_played')"
            >
              Matchs <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('win_rate')"
            >
              Win Rate <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('kda')"
            >
              KDA <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
            <th
              class="p-3 font-medium text-center cursor-pointer hover:text-text-primary select-none"
              @click="sortBy('cs_min_avg')"
            >
              CS/min <ArrowDownUp :size="14" class="inline ml-1" />
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="player in sortedPlayers"
            :key="player.id"
            class="hover:bg-surface-elevated transition-colors"
          >
            <td class="p-3">
              <RankBadge :rank="player.rank" :lp="player.lp" size="sm" />
            </td>
            <td class="p-3">
              <div class="flex items-center gap-3">
                <BaseAvatar
                  :src="player.avatar_url"
                  :name="player.username"
                  size="sm"
                />
                <span class="font-medium text-text-primary">{{
                  player.username
                }}</span>
              </div>
            </td>
            <td class="p-3 text-center text-text-secondary">
              {{ player.games_played }}
            </td>
            <td class="p-3 text-center">
              <div class="flex flex-col items-center">
                <span
                  class="font-bold"
                  :class="getWinRateColor(player.win_rate)"
                >
                  {{ player.win_rate.toFixed(1) }}%
                </span>
                <span class="text-xs text-text-muted">
                  {{ player.wins }}W - {{ player.losses }}L
                </span>
              </div>
            </td>
            <td class="p-3 text-center">
              <div class="font-mono text-text-primary">
                {{ player.kda.toFixed(2) }}
              </div>
              <div class="text-xs text-text-muted">
                {{ player.kills }}/{{ player.deaths }}/{{ player.assists }}
              </div>
            </td>
            <td class="p-3 text-center font-mono text-text-primary">
              {{ player.cs_min_avg.toFixed(1) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="!loading && sortedPlayers.length === 0"
      class="text-center py-12 text-text-muted"
    >
      Aucun joueur trouvé.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ArrowDownUp, Search } from "lucide-vue-next";
import { api } from "../../lib/api";
import BaseInput from "../ui/BaseInput.vue";
import BaseSpinner from "../ui/BaseSpinner.vue";
import BaseAvatar from "../ui/BaseAvatar.vue";
import RankBadge from "../domain/RankBadge.vue";

interface PlayerStat {
  id: string;
  username: string;
  avatar_url: string;
  rank: string;
  lp?: number; // Added LP
  games_played: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  win_rate: number;
  kda: number;
  cs_min_avg: number;
  rank_val?: number; // Helper for sorting
}

const loading = ref(true);
const error = ref<string | null>(null);
const players = ref<PlayerStat[]>([]);
const searchQuery = ref("");
const sortKey = ref<keyof PlayerStat | "rank_val">("rank_val"); // Start sorted by rank
const sortDesc = ref(true);

const rankOrder: Record<string, number> = {
  Iron: 0,
  Bronze: 1000,
  Silver: 2000,
  Gold: 3000,
  Platinum: 4000,
  Emerald: 5000,
  Diamond: 6000,
  Master: 7000,
  Grandmaster: 8000,
  Challenger: 9000,
  Unranked: -1,
};

function getRankValue(player: any): number {
  if (!player.rank || player.rank === "Unranked") return -1;

  const parts = player.rank.split(" ");
  const tier = parts[0];
  const division = parts[1]; // I, II, III, IV

  let score = rankOrder[tier] || 0;

  // Add Division Score (IV=0, III=100, II=200, I=300)
  if (division) {
    if (division === "I") score += 300;
    else if (division === "II") score += 200;
    else if (division === "III") score += 100;
  }

  // Add LP (Assume LP is roughly 0-100 for non-apex tiers, but for Master+ it's uncapped)
  // For Master+, score is Base + LP.
  // For lower tiers, score is Base + Division + LP.
  if (player.lp) {
    score += Number(player.lp) || 0;
  }

  return score;
}

async function fetchStats() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api.get("/stats/players");
    players.value = data.map((p: any) => {
      const stats = {
        ...p,
        rank_val: 0, // Will be set below
        win_rate: Number(p.win_rate) || 0,
        kda: Number(p.kda) || 0,
        cs_min_avg: Number(p.cs_min_avg) || 0,
        lp: Number(p.lp) || 0,
      };
      // Calculate rank value with the full object context
      stats.rank_val = getRankValue(stats);
      return stats;
    });
  } catch (e: any) {
    error.value = "Impossible de charger les statistiques.";
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function sortBy(key: keyof PlayerStat | "rank_val") {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortKey.value = key;
    sortDesc.value = true;
  }
}

const sortedPlayers = computed(() => {
  let result = [...players.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((p) => p.username.toLowerCase().includes(query));
  }

  // Sorting
  result.sort((a, b) => {
    const valA = a[sortKey.value as keyof PlayerStat];
    const valB = b[sortKey.value as keyof PlayerStat];

    if (valA === valB) return 0;

    // Sort strings properly
    if (typeof valA === "string" && typeof valB === "string") {
      return sortDesc.value
        ? valB.localeCompare(valA)
        : valA.localeCompare(valB);
    }

    // Sort numbers
    // @ts-ignore
    return sortDesc.value ? valB - valA : valA - valB;
  });

  return result;
});

function getWinRateColor(rate: number) {
  if (rate >= 60) return "text-gold";
  if (rate >= 50) return "text-success";
  if (rate >= 40) return "text-text-primary";
  return "text-danger";
}

onMounted(() => {
  fetchStats();
});
</script>
