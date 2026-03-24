<template>
  <div class="space-y-6">
    <!-- Image Upload Area for OCR -->
    <div class="bg-surface border border-border rounded-xl p-6 text-center">
      <div v-if="previewUrl" class="mb-4 relative group">
        <img
          :src="previewUrl"
          alt="Scoreboard Preview"
          class="max-h-64 mx-auto rounded-lg shadow-lg"
        />
        <button
          @click="clearImage"
          class="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-1 rounded-full text-white transition-colors"
        >
          <X :size="16" />
        </button>
      </div>

      <div v-if="isProcessing" class="py-4">
        <BaseSpinner />
        <p class="text-sm text-text-muted mt-2">
          Analyse de l'image en cours...
        </p>
      </div>

      <div v-else class="space-y-2">
        <label class="block">
          <span class="sr-only">Choisir une capture d'écran</span>
          <input
            type="file"
            accept="image/*"
            class="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan/10 file:text-cyan hover:file:bg-cyan/20 cursor-pointer"
            @change="handleFileChange"
          />
        </label>
        <p class="text-xs text-text-muted">
          Chargez une capture du tableau des scores pour pré-remplir les stats
          via OCR.
        </p>
      </div>
    </div>

    <!-- Stats Table Form -->
    <form @submit.prevent="handleSubmit">
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm text-left">
          <thead
            class="bg-surface-elevated text-text-secondary border-b border-border"
          >
            <tr>
              <th class="px-4 py-3 font-medium">Joueur</th>
              <th class="px-4 py-3 font-medium">Champion</th>
              <th class="px-4 py-3 font-medium w-20">K</th>
              <th class="px-4 py-3 font-medium w-20">D</th>
              <th class="px-4 py-3 font-medium w-20">A</th>
              <th class="px-4 py-3 font-medium w-20">CS</th>
              <th class="px-4 py-3 font-medium w-24 text-center">Victoire</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border bg-surface">
            <tr v-for="(stat, index) in localStats" :key="stat.user_id">
              <td class="px-4 py-2 font-medium text-text-primary">
                {{ getUsername(stat.user_id) }}
              </td>
              <td class="px-4 py-2">
                <input
                  v-model="stat.champion"
                  type="text"
                  class="w-full bg-transparent border-b border-transparent focus:border-cyan outline-none text-text-primary"
                  placeholder="Ahri"
                />
              </td>
              <td class="px-4 py-2">
                <input
                  v-model.number="stat.kills"
                  type="number"
                  min="0"
                  class="w-full bg-transparent focus:bg-surface-elevated rounded px-1 outline-none text-right"
                />
              </td>
              <td class="px-4 py-2">
                <input
                  v-model.number="stat.deaths"
                  type="number"
                  min="0"
                  class="w-full bg-transparent focus:bg-surface-elevated rounded px-1 outline-none text-right"
                />
              </td>
              <td class="px-4 py-2">
                <input
                  v-model.number="stat.assists"
                  type="number"
                  min="0"
                  class="w-full bg-transparent focus:bg-surface-elevated rounded px-1 outline-none text-right"
                />
              </td>
              <td class="px-4 py-2">
                <input
                  v-model.number="stat.cs"
                  type="number"
                  min="0"
                  class="w-full bg-transparent focus:bg-surface-elevated rounded px-1 outline-none text-right"
                />
              </td>
              <td class="px-4 py-2 text-center">
                <input
                  v-model="stat.win"
                  type="checkbox"
                  class="w-4 h-4 text-cyan bg-surface border-border rounded focus:ring-cyan"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-surface p-4 rounded-lg border border-border mb-6">
        <BaseInput
          v-model="screenshotUrl"
          label="Lien de la capture d'écran (Optionnel)"
          placeholder="https://imgur.com/..."
        />
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton
          type="button"
          variant="ghost"
          :disabled="loading"
          @click="$emit('cancel')"
          >Annuler</BaseButton
        >
        <BaseButton type="submit" variant="primary" :loading="loading"
          >Enregistrer les Résultats</BaseButton
        >
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { X } from "lucide-vue-next";
import Tesseract from "tesseract.js";
import BaseInput from "../ui/BaseInput.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseSpinner from "../ui/BaseSpinner.vue";
import type { ScrimParticipant } from "../../types";

const props = defineProps<{
  participants: ScrimParticipant[];
  loading?: boolean;
}>();

const emit = defineEmits(["submit", "cancel"]);

const previewUrl = ref<string | null>(null);
const isProcessing = ref(false);
const screenshotUrl = ref("");

// Initialize stats array based on participants
const localStats = ref<any[]>([]);

function initStats() {
  localStats.value = props.participants.map((p) => ({
    user_id: p.user_id,
    champion: "",
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    win: false,
  }));
}
watch(() => props.participants, initStats, { immediate: true });

function getUsername(userId: string) {
  const p = props.participants.find((part) => part.user_id === userId);
  return p?.profile?.username || "Inconnu";
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
      processOCR(file);
    };
    reader.readAsDataURL(file);
  }
}

function clearImage() {
  previewUrl.value = null;
  isProcessing.value = false;
}

async function processOCR(file: File) {
  isProcessing.value = true;
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(file, "eng", {
      logger: (m) => console.log(m),
    });

    // Tentative naïve de parsing
    // Ceci est très difficile sans structure fixe, mais on peut essayer de trouver des nombres
    // Pour l'instant, on avertit juste l'utilisateur
    console.log("OCR Text:", text);
    // TODO: Implémenter un parsing plus intelligent si pattern connu
  } catch (e) {
    console.error("OCR Error:", e);
  } finally {
    isProcessing.value = false;
  }
}

function handleSubmit() {
  emit("submit", {
    screenshot_url: screenshotUrl.value,
    stats: localStats.value.map((s) => ({
      user_id: s.user_id,
      champion_name: s.champion,
      kills: s.kills,
      deaths: s.deaths,
      assists: s.assists,
      cs: s.cs,
      win: s.win,
    })),
  });
}
</script>
