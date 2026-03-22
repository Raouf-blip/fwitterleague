<template>
  <div>
    <!-- Hero Section -->
    <div
      class="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-12 px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-gold/5 via-body to-body border-b border-border"
    >
      <div class="max-w-3xl mx-auto text-center">
        <h1
          class="text-4xl sm:text-5xl lg:text-6xl font-black text-text-primary tracking-tight leading-tight"
        >
          La ligue independante
          <span class="text-gold">League of Legends</span>
        </h1>
        <p class="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
          Formez votre equipe, recrutez des joueurs, et affrontez les meilleurs
          dans nos tournois.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <BaseButton variant="primary" size="lg" to="/agents">
            <template #icon><Users :size="18" /></template>
            Trouver des joueurs
          </BaseButton>
          <BaseButton variant="secondary" size="lg" to="/teams">
            <template #icon><Shield :size="18" /></template>
            Voir les equipes
          </BaseButton>
        </div>
      </div>

      <!-- Stats row -->
      <div class="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
        <StatBlock label="Joueurs" :value="stats.players" />
        <StatBlock label="Equipes" :value="stats.teams" />
        <StatBlock label="Tournois" :value="stats.tournaments" />
      </div>
    </div>

    <!-- Recent Agents -->
    <section>
      <PageHeader
        title="Agents Libres"
        subtitle="Les derniers joueurs a la recherche d'une equipe"
      >
        <template #actions>
          <BaseButton variant="ghost" to="/agents">Voir tout</BaseButton>
        </template>
      </PageHeader>

      <BaseSpinner v-if="loading" />
      <BaseEmptyState
        v-else-if="agents.length === 0"
        :icon="UserSearch"
        title="Aucun agent libre"
        description="Aucun joueur ne recherche d'equipe pour le moment."
      />
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <TransitionGroup name="list">
          <PlayerCard v-for="agent in agents" :key="agent.id" :player="agent" />
        </TransitionGroup>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Users, Shield, UserSearch } from "lucide-vue-next";
import { api } from "../lib/api";
import type { Agent } from "../types";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import BaseEmptyState from "../components/ui/BaseEmptyState.vue";
import PageHeader from "../components/layout/PageHeader.vue";
import PlayerCard from "../components/domain/PlayerCard.vue";
import StatBlock from "../components/domain/StatBlock.vue";

const agents = ref<Agent[]>([]);
const loading = ref(true);
const stats = ref({ players: 0, teams: 0, tournaments: 0 });

onMounted(async () => {
  try {
    const [agentsData, teamsData, tournamentsData] = await Promise.all([
      api.get("/social/agents"),
      api.get("/teams"),
      api.get("/tournaments"),
    ]);
    agents.value = (agentsData as Agent[]).slice(0, 3);
    stats.value = {
      players: (agentsData as any[]).length,
      teams: (teamsData as any[]).length,
      tournaments: (tournamentsData as any[]).length,
    };
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
});
</script>
