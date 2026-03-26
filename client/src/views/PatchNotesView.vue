<template>
  <div>
    <PageHeader
      title="Patch Notes"
      subtitle="Toutes les nouveautés et mises à jour de FwitterLeague."
    />

    <BaseSpinner v-if="loading" />

    <BaseEmptyState
      v-else-if="patchNotes.length === 0"
      :icon="Megaphone"
      title="Aucun patch note"
      description="Les mises à jour du site seront affichées ici."
    />

    <!-- Timeline -->
    <div v-else class="relative mt-8">
      <!-- Vertical line -->
      <div class="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/30 to-transparent" />

      <div class="space-y-8">
        <div
          v-for="(patch, index) in visiblePatchNotes"
          :key="patch.id"
          class="relative pl-12 sm:pl-16"
        >
          <!-- Timeline dot -->
          <div
            :class="[
              'absolute left-2.5 sm:left-4.5 w-3 h-3 rounded-full border-2 mt-1.5',
              index === 0
                ? 'bg-gold border-gold shadow-[0_0_8px_rgba(201,169,89,0.5)]'
                : 'bg-surface border-gold/40',
            ]"
          />

          <BaseCard :hoverable="false" class="relative overflow-hidden">
            <!-- Latest badge -->
            <div
              v-if="index === 0"
              class="absolute top-0 right-0 px-3 py-1 bg-gold/10 border-l border-b border-gold/20 rounded-bl-lg"
            >
              <span class="text-[10px] font-black text-gold uppercase tracking-wider">Dernière</span>
            </div>

            <!-- Header -->
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span class="text-xl font-black text-text-primary">{{ patch.version }}</span>
              <span class="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {{ patch.date }}
              </span>
              <h3 class="text-sm font-semibold text-gold">{{ patch.title }}</h3>
            </div>

            <!-- Changes by category -->
            <div class="space-y-4">
              <div v-for="category in patch.categories" :key="category.label">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-base">{{ category.emoji }}</span>
                  <h4 :class="['text-xs font-bold uppercase tracking-wider', category.color]">
                    {{ category.label }}
                  </h4>
                </div>
                <ul class="space-y-1.5 ml-6">
                  <li
                    v-for="(item, i) in category.items"
                    :key="i"
                    class="text-sm text-text-secondary flex gap-2 items-start"
                  >
                    <span :class="['shrink-0 mt-1.5 w-1 h-1 rounded-full', category.dotColor]" />
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Show more button -->
      <div v-if="hasMore" class="mt-12 flex justify-center pb-12 pl-4 sm:pl-6">
        <BaseButton
          variant="ghost"
          @click="displayLimit += 10"
        >
          Voir plus
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Megaphone } from "lucide-vue-next";
import { api } from "../lib/api";
import PageHeader from "../components/layout/PageHeader.vue";
import BaseCard from "../components/ui/BaseCard.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import BaseEmptyState from "../components/ui/BaseEmptyState.vue";
import BaseButton from "../components/ui/BaseButton.vue";

interface PatchCategory {
  emoji: string;
  label: string;
  color: string;
  dotColor: string;
  items: string[];
}

interface PatchNote {
  id: string;
  version: string;
  date: string;
  title: string;
  categories: PatchCategory[];
}

const patchNotes = ref<PatchNote[]>([]);
const loading = ref(true);
const displayLimit = ref(10);

const visiblePatchNotes = computed(() => patchNotes.value.slice(0, displayLimit.value));
const hasMore = computed(() => patchNotes.value.length > displayLimit.value);

onMounted(async () => {
  try {
    patchNotes.value = await api.get("/patchnotes");
  } catch (e) {
    console.error("Failed to fetch patch notes:", e);
  } finally {
    loading.value = false;
  }
});
</script>
