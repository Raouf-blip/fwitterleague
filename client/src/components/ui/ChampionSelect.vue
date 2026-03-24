<template>
  <div class="relative" ref="container">
    <div class="relative">
      <input
        type="text"
        :value="modelValue"
        @input="handleInput"
        @focus="openDropdown"
        class="w-full bg-surface-elevated border border-border rounded px-2 py-1 outline-none text-text-primary focus:border-primary focus:ring-1 focus:ring-primary pl-9 transition-colors"
        :placeholder="placeholder"
      />
      <!-- Champion Icon Preview if selected -->
      <div
        v-if="selectedChampionData"
        class="absolute left-1 top-1/2 -translate-y-1/2"
      >
        <img
          :src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${selectedChampionData.image.full}`"
          class="w-6 h-6 rounded-full border border-border"
        />
      </div>
      <div
        v-else
        class="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen && filteredChampions.length > 0"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="fixed z-[9999] mt-1 max-h-60 overflow-y-auto bg-surface-elevated border border-border rounded-lg shadow-xl"
      >
        <button
          v-for="champ in filteredChampions"
          :key="champ.id"
          type="button"
          class="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors"
          @click="selectChampion(champ)"
        >
          <img
            :src="`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`"
            :alt="champ.name"
            class="w-8 h-8 rounded-full border border-border"
            loading="lazy"
          />
          <span class="text-text-primary font-medium">{{ champ.name }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const version = ref("14.1.1"); // Default fallback
const champions = ref<any[]>([]);
const container = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref({});
const searchQuery = ref("");

// Computed
const filteredChampions = computed(() => {
  if (!searchQuery.value && !props.modelValue)
    return champions.value.slice(0, 10); // Show popular or first few

  // If user is typing matches
  const q = searchQuery.value.toLowerCase();

  // If User hasn't typed but has a value (editing), maybe show all or related?
  // Let's rely on searchQuery for dropdown filtering
  if (!q) return champions.value;

  return champions.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
  );
});

const selectedChampionData = computed(() => {
  if (!props.modelValue || champions.value.length === 0) return null;
  // Try to find by name or ID
  return champions.value.find(
    (c) => c.name === props.modelValue || c.id === props.modelValue,
  );
});

// Methods
function updatePosition() {
  if (!container.value) return;
  const rect = container.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: `${rect.bottom}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
}

function openDropdown() {
  updatePosition();
  isOpen.value = true;
}

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  searchQuery.value = val;
  emit("update:modelValue", val);
  openDropdown();
}

function selectChampion(champ: any) {
  emit("update:modelValue", champ.name);
  searchQuery.value = champ.name; // Keep display consistent
  isOpen.value = false;
}

// Fetch Logic
async function fetchChampions() {
  try {
    // 1. Get latest version
    const vRes = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json",
    );
    const versions = await vRes.json();
    version.value = versions[0];

    // 2. Get Data
    // Use fr_FR if possible, else en_US
    const lang = "fr_FR";
    const cRes = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version.value}/data/${lang}/champion.json`,
    );
    const data = await cRes.json();

    champions.value = Object.values(data.data).sort((a: any, b: any) =>
      a.name.localeCompare(b.name),
    );
  } catch (e) {
    console.error("Failed to fetch champions", e);
  }
}

// Click Outside to close
function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  // Check if click is outside BOTH container AND dropdown (portal)
  const isOutsideContainer =
    container.value && !container.value.contains(target);
  const isOutsideDropdown =
    dropdownRef.value && !dropdownRef.value.contains(target);

  if (isOutsideContainer && isOutsideDropdown) {
    isOpen.value = false;
  }
}

// Update position on scroll/resize
function handleScroll() {
  if (isOpen.value) updatePosition();
}

onMounted(() => {
  fetchChampions();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", handleScroll, true);
  window.addEventListener("resize", handleScroll);
  // Sync initial search query if modelValue exists
  if (props.modelValue) searchQuery.value = props.modelValue;
});
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", handleScroll, true);
  window.removeEventListener("resize", handleScroll);
});
</script>
