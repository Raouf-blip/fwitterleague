<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Image Upload Area for OCR -->
      <div
        class="bg-surface border border-border rounded-xl p-3 text-center h-32 flex flex-col justify-center relative"
      >
        <div
          v-if="isProcessing"
          class="h-full flex flex-col items-center justify-center w-full px-8"
        >
          <p class="text-xs font-medium text-cyan mb-3 animate-pulse">
            Analyse de la capture...
          </p>
          <div
            class="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden border border-border"
          >
            <div
              class="h-full bg-cyan rounded-full animate-pulse w-full origin-left"
            ></div>
          </div>
        </div>

        <div
          v-else-if="errorMessage"
          class="h-full flex flex-col items-center justify-center px-4 py-2"
        >
          <p class="text-xs font-bold text-danger mb-1">Erreur d'analyse</p>
          <p
            class="text-[10px] text-text-muted mb-3 break-words w-full overflow-hidden text-ellipsis line-clamp-3"
          >
            {{ errorMessage }}
          </p>
          <button @click="clearImage" class="text-xs text-cyan hover:underline">
            Réessayer
          </button>
        </div>

        <div
          v-else-if="previewUrl"
          class="h-full relative group flex items-center justify-center"
        >
          <img
            :src="previewUrl"
            alt="Scoreboard Preview"
            class="max-h-full max-w-full rounded shadow-sm object-contain"
          />
          <button
            @click="clearImage"
            class="absolute top-1 right-1 bg-black/50 hover:bg-black/70 p-1 rounded-full text-white transition-colors"
          >
            <X :size="14" />
          </button>
        </div>

        <div v-else class="h-full flex flex-col items-center justify-center">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />
          <button
            type="button"
            @click="triggerFileInput"
            class="inline-flex items-center gap-2 text-sm text-cyan hover:text-cyan/80 transition-colors bg-cyan/10 px-3 py-1.5 rounded-full"
          >
            <UploadCloud :size="16" />
            <span>Charger le tableau des scores</span>
          </button>
        </div>
      </div>

      <!-- Global Match Info -->
      <div
        class="bg-surface p-3 rounded-xl border border-border flex flex-col justify-center gap-3 h-32"
      >
        <div class="flex flex-col gap-1">
          <span class="font-bold text-sm">Équipe Gagnante :</span>
          <div class="flex gap-2 w-full">
            <button
              type="button"
              class="flex-1 py-1.5 text-sm rounded border font-bold transition-all"
              :class="
                winningTeam === 'blue'
                  ? 'bg-cyan text-background border-cyan'
                  : 'bg-surface-elevated border-border text-text-muted hover:border-cyan'
              "
              @click="setWinner('blue')"
            >
              BLEUE
            </button>
            <button
              type="button"
              class="flex-1 py-1.5 text-sm rounded border font-bold transition-all"
              :class="
                winningTeam === 'red'
                  ? 'bg-danger text-white border-danger'
                  : 'bg-surface-elevated border-border text-text-muted hover:border-danger'
              "
              @click="setWinner('red')"
            >
              ROUGE
            </button>
          </div>
        </div>
        <div class="w-full flex items-center gap-2">
          <label class="text-xs text-text-muted whitespace-nowrap"
            >Durée (min) :</label
          >
          <input
            type="number"
            v-model="gameDuration"
            class="bg-surface-elevated border border-border rounded px-2 py-1 w-20 text-center text-text-primary text-sm no-spinner"
            placeholder="25"
          />
        </div>
      </div>
    </div>

    <!-- Stats Table Form -->
    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start mb-24">
        <!-- Blue Team -->
        <div v-if="blueTeamStats.length > 0">
          <h3
            class="font-bold text-cyan mb-2 text-lg border-b border-border pb-2"
          >
            Équipe Bleue
          </h3>
          <div class="overflow-x-auto border border-border rounded-lg">
            <table class="w-full text-sm text-left">
              <thead
                class="bg-cyan/10 text-text-primary border-b border-border"
              >
                <tr>
                  <th class="px-2 py-2 font-medium min-w-[120px]">Joueur</th>
                  <th class="px-1 py-2 font-medium w-20">Role</th>
                  <th class="px-1 py-2 font-medium min-w-[140px]">Champion</th>
                  <th class="px-1 py-2 font-medium w-12 text-center">K</th>
                  <th class="px-1 py-2 font-medium w-12 text-center">D</th>
                  <th class="px-1 py-2 font-medium w-12 text-center">A</th>
                  <th class="px-1 py-2 font-medium w-14 text-center">CS</th>
                  <th class="px-1 py-2 font-medium w-10 text-center">W</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border bg-surface">
                <tr
                  v-for="stat in blueTeamStats"
                  :key="stat.user_id"
                  class="hover:bg-surface-elevated transition-colors"
                  :class="stat.win ? 'bg-cyan/5' : ''"
                >
                  <td class="px-2 py-2 font-medium text-text-primary">
                    <div
                      class="truncate max-w-[120px]"
                      :title="getUsername(stat.user_id)"
                    >
                      {{ getUsername(stat.user_id) }}
                    </div>
                  </td>
                  <td class="px-1 py-1">
                    <select
                      v-model="stat.role"
                      class="w-full bg-surface-elevated border border-border rounded px-0 py-1 text-xs text-text-secondary outline-none focus:border-cyan text-center"
                    >
                      <option>Top</option>
                      <option>Jungle</option>
                      <option>Mid</option>
                      <option>ADC</option>
                      <option>Support</option>
                    </select>
                  </td>
                  <td class="px-1 py-1">
                    <ChampionSelect
                      v-model="stat.champion"
                      placeholder="Champ"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.kills"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-cyan rounded px-1 py-1 outline-none text-center font-mono text-text-primary p-0"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.deaths"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-cyan rounded px-1 py-1 outline-none text-center font-mono text-danger p-0"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.assists"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-cyan rounded px-1 py-1 outline-none text-center font-mono text-cyan p-0"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.cs"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-cyan rounded px-1 py-1 outline-none text-center font-mono text-text-primary p-0"
                    />
                  </td>
                  <td class="px-1 py-1 text-center">
                    <input
                      v-model="stat.win"
                      type="checkbox"
                      class="w-4 h-4 text-cyan bg-surface border-border rounded focus:ring-cyan cursor-pointer"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Red Team -->
        <div v-if="redTeamStats.length > 0">
          <h3
            class="font-bold text-danger mb-2 text-lg border-b border-border pb-2"
          >
            Équipe Rouge
          </h3>
          <div class="overflow-x-auto border border-border rounded-lg">
            <table class="w-full text-sm text-left">
              <thead
                class="bg-danger/10 text-text-primary border-b border-border"
              >
                <tr>
                  <th class="px-2 py-2 font-medium min-w-[120px]">Joueur</th>
                  <th class="px-1 py-2 font-medium w-20">Role</th>
                  <th class="px-1 py-2 font-medium min-w-[140px]">Champion</th>
                  <th class="px-1 py-2 font-medium w-12 text-center">K</th>
                  <th class="px-1 py-2 font-medium w-12 text-center">D</th>
                  <th class="px-1 py-2 font-medium w-12 text-center">A</th>
                  <th class="px-1 py-2 font-medium w-14 text-center">CS</th>
                  <th class="px-1 py-2 font-medium w-10 text-center">W</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border bg-surface">
                <tr
                  v-for="stat in redTeamStats"
                  :key="stat.user_id"
                  class="hover:bg-surface-elevated transition-colors"
                  :class="stat.win ? 'bg-danger/5' : ''"
                >
                  <td class="px-2 py-2 font-medium text-text-primary">
                    <div
                      class="truncate max-w-[120px]"
                      :title="getUsername(stat.user_id)"
                    >
                      {{ getUsername(stat.user_id) }}
                    </div>
                  </td>
                  <td class="px-1 py-1">
                    <select
                      v-model="stat.role"
                      class="w-full bg-surface-elevated border border-border rounded px-0 py-1 text-xs text-text-secondary outline-none focus:border-danger text-center"
                    >
                      <option>Top</option>
                      <option>Jungle</option>
                      <option>Mid</option>
                      <option>ADC</option>
                      <option>Support</option>
                    </select>
                  </td>
                  <td class="px-1 py-1">
                    <ChampionSelect
                      v-model="stat.champion"
                      placeholder="Champ"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.kills"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-danger rounded px-1 py-1 outline-none text-center font-mono text-text-primary p-0"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.deaths"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-danger rounded px-1 py-1 outline-none text-center font-mono text-danger p-0"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.assists"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-danger rounded px-1 py-1 outline-none text-center font-mono text-cyan p-0"
                    />
                  </td>
                  <td class="px-1 py-1">
                    <input
                      v-model.number="stat.cs"
                      type="number"
                      min="0"
                      class="w-full bg-surface-elevated border border-transparent focus:border-danger rounded px-1 py-1 outline-none text-center font-mono text-text-primary p-0"
                    />
                  </td>
                  <td class="px-1 py-1 text-center">
                    <input
                      v-model="stat.win"
                      type="checkbox"
                      class="w-4 h-4 text-danger bg-surface border-border rounded focus:ring-danger cursor-pointer"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        class="flex justify-end gap-3 sticky bottom-4 bg-surface p-4 border border-border rounded-xl shadow-xl z-10"
      >
        <BaseButton
          type="button"
          variant="ghost"
          :disabled="loading"
          @click="$emit('cancel')"
          >Annuler</BaseButton
        >
        <BaseButton
          type="submit"
          variant="primary"
          :loading="loading"
          class="px-8"
          >Enregistrer les Résultats</BaseButton
        >
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { X, UploadCloud } from "lucide-vue-next";
import { supabase } from "../../lib/supabase";
import { api } from "../../lib/api";
import { getToken } from "../../composables/useAuth";
import BaseInput from "../ui/BaseInput.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseSpinner from "../ui/BaseSpinner.vue";
import ChampionSelect from "../ui/ChampionSelect.vue";
import type { ScrimParticipant } from "../../types";

const props = defineProps<{
  scrimId: string;
  participants: ScrimParticipant[];
  loading?: boolean;
}>();

const emit = defineEmits(["submit", "cancel"]);

const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  fileInput.value?.click();
}

const previewUrl = ref<string | null>(null);
const isProcessing = ref(false);
const errorMessage = ref<string | null>(null);
const screenshotUrl = ref("");
const gameDuration = ref(0);
const winningTeam = ref<"blue" | "red" | null>(null);

// Initialize stats array based on participants
const localStats = ref<any[]>([]);

function initStats() {
  const blueSides = props.participants.filter((p) => p.side === "blue");
  const redSides = props.participants.filter((p) => p.side === "red");

  // Pre-fill mapping if not provided (basic order assumption)
  const defaultRoles = ["Top", "Jungle", "Mid", "ADC", "Support"];

  const mapParticipant = (p: any, index: number) => ({
    user_id: p.user_id,
    side: p.side,
    role: p.role || defaultRoles[index] || "Flex",
    champion: "",
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    win: false,
  });

  localStats.value = [
    ...blueSides.map(mapParticipant),
    ...redSides.map(mapParticipant),
  ];
}
watch(() => props.participants, initStats, { immediate: true });

const blueTeamStats = computed(() =>
  localStats.value.filter((s) => s.side === "blue"),
);

const redTeamStats = computed(() =>
  localStats.value.filter((s) => s.side === "red"),
);

function getUsername(userId: string) {
  const p = props.participants.find((part) => part.user_id === userId);
  return p?.profile?.username || "Inconnu";
}

function setWinner(side: "blue" | "red") {
  winningTeam.value = side;
  localStats.value.forEach((s) => {
    s.win = s.side === side;
  });
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // AI Processing
    processAI(file);
  }
}

function clearImage() {
  previewUrl.value = null;
  isProcessing.value = false;
  screenshotUrl.value = "";
  errorMessage.value = null;
}

function processAI(file: File) {
  isProcessing.value = true;
  errorMessage.value = null;

  // Upload image to Supabase Storage first? Or base64 to server?
  // Route handles base64?
  // Route: `server/src/routes/scrim.routes.ts` expects `imageUrl`.

  // Code below handles upload then analyze.
  uploadAndAnalyze(file);
}

async function uploadAndAnalyze(file: File) {
  try {
    const fileName = `${props.scrimId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("scrim-screenshots")
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("scrim-screenshots")
      .getPublicUrl(fileName);

    screenshotUrl.value = publicUrlData.publicUrl;

    // Call API
    const token = await getToken();
    const res = await api.post(
      `/scrims/${props.scrimId}/analyze-screenshot`,
      {
        imageUrl: screenshotUrl.value,
      },
      token,
    );

    if (res.stats && Array.isArray(res.stats)) {
      // Map result to localStats
      res.stats.forEach((detected: any) => {
        const existing = localStats.value.find(
          (s) => s.user_id === detected.user_id,
        );
        if (existing) {
          existing.champion = detected.champion_name;
          existing.kills = detected.kills;
          existing.deaths = detected.deaths;
          existing.assists = detected.assists;
          existing.cs = detected.cs;
          existing.win = detected.win;
          if (detected.role) existing.role = detected.role; // If AI detects role
        }
      });

      // Auto set winner based on recognized win
      const winner = res.stats.find((s: any) => s.win);
      if (winner) {
        const side = localStats.value.find(
          (s) => s.user_id === winner.user_id,
        )?.side;
        if (side) winningTeam.value = side;
      }
    }
  } catch (e: any) {
    console.error(e);
    errorMessage.value = "Une erreur est survenue lors de l'analyse.";

    if (e.response && e.response.data && e.response.data.error) {
      errorMessage.value = e.response.data.error;
    } else if (e.message) {
      // Try to parse JSON inside message
      try {
        if (e.message.includes("{")) {
          const jsonPart = e.message.substring(e.message.indexOf("{"));
          const parsed = JSON.parse(jsonPart);
          if (parsed.error) errorMessage.value = parsed.error;
        } else {
          errorMessage.value = e.message;
        }
      } catch {
        errorMessage.value = e.message;
      }
    }

    // Clear preview on error so we can show the error state
    previewUrl.value = null;
  } finally {
    isProcessing.value = false;
  }
}

async function handleSubmit() {
  emit("submit", {
    screenshot_url: screenshotUrl.value,
    game_duration: Number(gameDuration.value) * 60, // minutes to seconds
    stats: localStats.value
      .filter((s) => s.champion && s.champion.trim() !== "") // Only include players with a selected champion
      .map((s) => ({
        user_id: s.user_id,
        champion_name: s.champion,
        kills: Number(s.kills) || 0,
        deaths: Number(s.deaths) || 0,
        assists: Number(s.assists) || 0,
        cs: Number(s.cs) || 0,
        win: s.win,
        role: s.role, // Ensure we send role
    })),
  });
}
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
