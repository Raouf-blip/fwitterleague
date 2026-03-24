import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../lib/api";
import { useAuthStore } from "./auth";
import { getToken } from "../composables/useAuth";
import type { Scrim } from "../types";

export const useScrimStore = defineStore("scrims", () => {
  const authStore = useAuthStore();
  const scrims = ref<Scrim[]>([]);
  const currentScrim = ref<Scrim | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchScrims(filters: { type?: string; status?: string } = {}) {
    loading.value = true;
    error.value = null;
    try {
      // Construction de la query string manuelle
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);

      const endpoint = `/scrims?${params.toString()}`;
      scrims.value = await api.get(endpoint);
    } catch (e: any) {
      error.value = e.message || "Erreur lors du chargement des scrims";
    } finally {
      loading.value = false;
    }
  }

  async function fetchScrimById(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get(`/scrims/${id}`);
      currentScrim.value = data;
    } catch (e: any) {
      error.value = e.message || "Erreur lors du chargement du scrim";
    } finally {
      loading.value = false;
    }
  }

  async function createScrim(payload: {
    type: string;
    scheduled_at: string;
    challenger_team_id?: string;
    challenged_team_id?: string;
  }) {
    loading.value = true;
    try {
      const token = await getToken();
      const res = await api.post("/scrims", payload, token);
      // On ajoute directement à la liste locale si ça match les filtres actuels (simplifié ici)
      scrims.value.push(res);
      return res;
    } catch (e: any) {
      throw new Error(e.message || "Erreur lors de la création du scrim");
    } finally {
      loading.value = false;
    }
  }

  async function joinScrim(id: string, side?: string) {
    loading.value = true;
    try {
      const token = await getToken();
      const res = await api.post(`/scrims/${id}/join`, { side }, token);

      // Update local state if currentScrim is the one joined
      if (currentScrim.value && currentScrim.value.id === id) {
        // Re-fetch to get clean state or push manually
        await fetchScrimById(id);
      }
      // Also update the list item if it exists
      const listItem = scrims.value.find((s) => s.id === id);
      if (listItem) {
        // Simple optimistic update or refetch
        // We do a partial fetch or just re-fetch the single scrim to get updated participant count
        const updated = await api.get(`/scrims/${id}`);
        Object.assign(listItem, updated);
      }
      return res;
    } catch (e: any) {
      throw new Error(e.message || "Erreur lors de l'inscription");
    } finally {
      loading.value = false;
    }
  }

  async function leaveScrim(id: string) {
    loading.value = true;
    try {
      const token = await getToken();
      await api.post(`/scrims/${id}/leave`, {}, token);

      if (currentScrim.value && currentScrim.value.id === id) {
        await fetchScrimById(id);
      }

      // Also update the list item if it exists
      const listItem = scrims.value.find((s) => s.id === id);
      if (listItem) {
        const updated = await api.get(`/scrims/${id}`);
        Object.assign(listItem, updated);
      }
    } catch (e: any) {
      throw new Error(e.message);
    } finally {
      loading.value = false;
    }
  }

  async function respondToChallenge(id: string, action: "accept" | "decline") {
    loading.value = true;
    try {
      const token = await getToken();
      await api.post(`/scrims/${id}/challenge`, { action }, token);

      // Update local list status
      const scrim = scrims.value.find((s) => s.id === id);
      if (scrim) {
        if (action === "accept") scrim.status = "scheduled";
        if (action === "decline") scrim.status = "cancelled";
      }
      if (currentScrim.value && currentScrim.value.id === id) {
        currentScrim.value.status =
          action === "accept" ? "scheduled" : "cancelled";
      }
    } catch (e: any) {
      throw new Error(e.message);
    } finally {
      loading.value = false;
    }
  }

  async function markAsCompleted(id: string) {
    loading.value = true;
    try {
      const token = await getToken();
      await api.patch(`/scrims/${id}/status`, { status: "completed" }, token);

      const scrim = scrims.value.find((s) => s.id === id);
      if (scrim) scrim.status = "completed";

      if (currentScrim.value && currentScrim.value.id === id) {
        currentScrim.value.status = "completed";
      }
    } catch (e: any) {
      throw new Error(e.message || "Erreur lors de la mise à jour du statut");
    } finally {
      loading.value = false;
    }
  }

  async function submitResults(
    id: string,
    data: {
      screenshot_url: string;
      game_duration?: number;
      stats: any[];
    },
  ) {
    loading.value = true;
    try {
      const token = await getToken();
      await api.post(`/scrims/${id}/results`, data, token);
      if (currentScrim.value && currentScrim.value.id === id) {
        await fetchScrimById(id);
      }
    } catch (e: any) {
      throw new Error(e.message);
    } finally {
      loading.value = false;
    }
  }

  return {
    scrims,
    currentScrim,
    loading,
    error,
    fetchScrims,
    fetchScrimById,
    createScrim,
    joinScrim,
    leaveScrim,
    respondToChallenge,
    markAsCompleted,
    submitResults,
  };
});
