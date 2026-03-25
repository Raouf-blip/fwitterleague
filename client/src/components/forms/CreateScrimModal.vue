<template>
  <BaseModal v-model="isOpen" title="Créer un Scrim" max-width="md">
    <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
      <!-- Type Selection -->
      <div>
        <label class="block text-sm font-medium text-text-secondary mb-2"
          >Type de Scrim</label
        >
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="p-3 border rounded-lg text-sm font-medium transition-all text-center"
            :class="
              form.type === 'open'
                ? 'bg-cyan/10 border-cyan text-cyan'
                : 'bg-surface border-border text-text-muted hover:bg-surface-elevated'
            "
            @click="form.type = 'open'"
          >
            Open (Pick-up)
          </button>

          <div class="relative group">
            <button
              type="button"
              class="w-full p-3 border rounded-lg text-sm font-medium transition-all text-center"
              :class="
                form.type === 'team'
                  ? 'bg-cyan/10 border-cyan text-cyan'
                  : 'bg-surface border-border text-text-muted hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed'
              "
              @click="canCreateTeamScrim ? (form.type = 'team') : null"
              :disabled="!canCreateTeamScrim"
            >
              Team vs Team
            </button>
            <BaseTooltip
              v-if="!canCreateTeamScrim"
              text="Réservé aux capitaines d'équipe"
            />
          </div>
        </div>
      </div>

      <!-- Date & Time -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1"
            >Date</label
          >
          <input
            v-model="form.date"
            type="date"
            required
            class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
            :min="minDate"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1"
            >Heure</label
          >
          <input
            v-model="form.time"
            type="time"
            required
            class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
          />
        </div>
      </div>

      <!-- Team Selection (Only for Team Scrim) -->
      <div v-if="form.type === 'team'">
        <label class="block text-sm font-medium text-text-secondary mb-1"
          >Équipe adverse</label
        >
        <select
          v-model="form.guest_team_id"
          class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
          required
        >
          <option value="" disabled>Sélectionner une équipe</option>
          <option
            v-for="team in availableTeams"
            :key="team.id"
            :value="team.id"
            :disabled="team.id === authStore.profile?.team?.id"
          >
            {{ team.name }} [{{ team.tag }}]
            {{
              team.id === authStore.profile?.team?.id ? "(Votre équipe)" : ""
            }}
          </option>
        </select>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4">
        <BaseButton type="button" variant="ghost" @click="isOpen = false"
          >Annuler</BaseButton
        >
        <BaseButton type="submit" variant="primary" :loading="loading"
          >Créer le Scrim</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useScrimStore } from "../../stores/scrims";
import { api } from "../../lib/api";
import BaseModal from "../ui/BaseModal.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseTooltip from "../ui/BaseTooltip.vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue", "created"]);

const authStore = useAuthStore();
const scrimStore = useScrimStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const loading = ref(false);
const teamsList = ref<any[]>([]);

// Form Data
const form = ref({
  type: "open",
  date: "",
  time: "",
  guest_team_id: "",
});

// Minimum date = Now
const minDate = computed(() => {
  return new Date().toISOString().split("T")[0];
});

const canCreateTeamScrim = computed(() => {
  return authStore.profile?.is_captain && authStore.profile?.team;
});

const availableTeams = computed(() => {
  return teamsList.value;
});

watch(
  () => form.value.type,
  async (newType) => {
    if (newType === "team") {
      fetchTeams();
    }
  },
);

// Also fetch when modal opens if type is team (e.g. persisted state)
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && form.value.type === "team") {
      fetchTeams();
    }
  },
);

async function fetchTeams() {
  try {
    const res = await api.get("/teams");
    teamsList.value = res;
  } catch (e) {
    console.error(e);
  }
}

async function handleSubmit() {
  loading.value = true;
  try {
    const dateTimeString = `${form.value.date}T${form.value.time}:00`;
    const scheduledDate = new Date(dateTimeString);
    if (scheduledDate < new Date()) {
      alert("La date du scrim doit être ultérieure à maintenant.");
      loading.value = false;
      return;
    }

    const payload: any = {
      type: form.value.type,
      scheduled_at: scheduledDate.toISOString(),
    };

    if (form.value.type === "team") {
      payload.challenger_team_id = authStore.profile?.team?.id;
      payload.challenged_team_id = form.value.guest_team_id;
    }

    await scrimStore.createScrim(payload);
    emit("created");
    isOpen.value = false;

    // Reset form
    form.value = {
      type: "open",
      date: "",
      time: "",
      guest_team_id: "",
    };
  } catch (e: any) {
    alert(e.message); // Ou via notif store
  } finally {
    loading.value = false;
  }
}
</script>
