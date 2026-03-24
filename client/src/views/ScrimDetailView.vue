<template>
  <div class="max-w-4xl mx-auto px-4 pb-12">
    <div v-if="scrimStore.loading && !scrim" class="flex justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <div v-else-if="!scrim" class="py-12 text-center text-text-muted">
      Scrim introuvable.
    </div>

    <div v-else>
      <!-- Header -->
      <div class="mb-8 border-b border-border pb-6">
        <div class="flex items-center justify-between mb-4">
          <BaseBadge variant="cyan">{{
            scrim.type === "open" ? "OPEN SCRIM" : "TEAM CHALLENGE"
          }}</BaseBadge>
          <span class="text-sm text-text-muted font-mono">
            {{ new Date(scrim.scheduled_at).toLocaleString() }}
          </span>
        </div>

        <h1 class="text-3xl font-extrabold text-text-primary mb-2">
          {{ getScrimTitle() }}
        </h1>
        <div class="flex items-center gap-2 text-sm text-text-secondary">
          <span>Statut : </span>
          <BaseBadge :variant="getStatusVariant(scrim.status)">
            {{ scrim.status.toUpperCase() }}
          </BaseBadge>
        </div>
      </div>

      <!-- Actions -->
      <div class="mb-8 flex gap-3" v-if="canManage">
        <!-- Accept / Decline for Guest Captain -->
        <template v-if="scrim.status === 'pending' && isChallengedCaptain">
          <BaseButton
            variant="primary"
            @click="respond('accept')"
            :loading="loadingAction"
            >Accepter le défi</BaseButton
          >
          <BaseButton
            variant="destructive"
            @click="respond('decline')"
            :loading="loadingAction"
            >Refuser</BaseButton
          >
        </template>

        <!-- Submit Results -->
        <template v-if="canSubmitResults">
          <BaseButton variant="secondary" @click="showResultModal = true">
            <template #icon><UploadCloud :size="18" /></template>
            {{
              scrim.status === "completed"
                ? "Modifier les Résultats"
                : "Soumettre Résultats"
            }}
          </BaseButton>
          <BaseButton
            v-if="scrim.status !== 'completed'"
            variant="ghost"
            class="text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
            @click="confirmFinish"
            :loading="loadingAction"
          >
            Terminer sans stats
          </BaseButton>
        </template>
      </div>

      <!-- Participants Display (Team Scrim) -->
      <div v-if="scrim.type === 'team'" class="grid md:grid-cols-2 gap-8">
        <!-- Challenger (Blue) -->
        <div
          class="bg-surface border border-border rounded-xl p-4 flex flex-col"
        >
          <div
            class="flex items-center gap-3 mb-4 border-b border-blue-500/30 pb-3"
          >
            <div
              v-if="scrim.challenger_team?.logo_url"
              class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
            >
              <img
                :src="scrim.challenger_team.logo_url"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center font-bold text-cyan"
            >
              {{ scrim.challenger_team?.tag }}
            </div>
            <div>
              <h3 class="font-bold text-cyan text-lg">
                {{ scrim.challenger_team?.name }}
              </h3>
              <span class="text-xs text-text-muted">CHALLENGER (BLUE)</span>
            </div>
          </div>

          <div v-if="loadingMembers" class="py-4 flex justify-center">
            <BaseSpinner />
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="member in blueTeamMembers"
              :key="member.id"
              class="flex items-center gap-3 p-2 rounded bg-surface-elevated"
            >
              <BaseAvatar
                :src="member.profile?.avatar_url"
                :name="member.profile?.username"
                size="sm"
              />
              <div class="flex flex-col">
                <span class="font-bold text-sm">{{
                  member.profile?.username
                }}</span>
                <span class="text-[10px] text-text-muted uppercase">{{
                  member.role
                }}</span>
              </div>
              <div class="ml-auto">
                <RankBadge
                  v-if="member.profile?.rank"
                  :rank="member.profile.rank"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Challenged (Red) -->
        <div
          class="bg-surface border border-border rounded-xl p-4 flex flex-col"
        >
          <div
            class="flex items-center gap-3 mb-4 border-b border-red-500/30 pb-3"
          >
            <div
              v-if="scrim.challenged_team?.logo_url"
              class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
            >
              <img
                :src="scrim.challenged_team.logo_url"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center font-bold text-danger"
            >
              {{ scrim.challenged_team?.tag }}
            </div>
            <div>
              <h3 class="font-bold text-danger text-lg">
                {{ scrim.challenged_team?.name }}
              </h3>
              <span class="text-xs text-text-muted">CHALLENGED (RED)</span>
            </div>
          </div>

          <div v-if="loadingMembers" class="py-4 flex justify-center">
            <BaseSpinner />
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="member in redTeamMembers"
              :key="member.id"
              class="flex items-center gap-3 p-2 rounded bg-surface-elevated"
            >
              <BaseAvatar
                :src="member.profile?.avatar_url"
                :name="member.profile?.username"
                size="sm"
              />
              <div class="flex flex-col">
                <span class="font-bold text-sm">{{
                  member.profile?.username
                }}</span>
                <span class="text-[10px] text-text-muted uppercase">{{
                  member.role
                }}</span>
              </div>
              <div class="ml-auto">
                <RankBadge
                  v-if="member.profile?.rank"
                  :rank="member.profile.rank"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Participants Display (Open Scrim) -->
      <div v-else class="grid md:grid-cols-3 gap-6">
        <!-- Blue Side -->
        <div
          class="bg-surface border-t-4 border-t-cyan border-x border-b border-border rounded-xl p-4 flex flex-col"
          :class="{
            'ring-2 ring-cyan ring-offset-2 ring-offset-background':
              mySide === 'blue',
          }"
        >
          <div class="flex justify-between items-center mb-4">
            <h3
              class="font-bold text-cyan truncate"
              :title="scrim.challenger_team?.name"
            >
              {{
                scrim.type === "team" && scrim.challenger_team
                  ? scrim.challenger_team.tag || scrim.challenger_team.name
                  : "Équipe Bleue"
              }}
            </h3>
            <span class="text-xs text-text-muted">{{ blueSide.length }}/5</span>
          </div>
          <div class="space-y-2 flex-1">
            <div
              v-for="p in blueSide"
              :key="p.id"
              class="flex items-center gap-2 p-2 rounded bg-surface-elevated"
            >
              <BaseAvatar
                :src="p.profile?.avatar_url"
                :name="p.profile?.username"
                size="sm"
              />
              <span class="text-sm font-medium truncate">{{
                p.profile?.username
              }}</span>
              <span class="text-xs text-text-muted ml-auto">{{
                p.profile?.rank || "Unranked"
              }}</span>
            </div>
            <div
              v-if="blueSide.length === 0"
              class="text-xs text-text-muted text-center py-4"
            >
              Aucun joueur
            </div>
          </div>
          <div
            v-if="scrim.status === 'scheduled'"
            class="mt-4 pt-4 border-t border-border"
          >
            <BaseButton
              v-if="mySide !== 'blue'"
              variant="ghost"
              size="sm"
              class="w-full border-dashed border border-border text-cyan hover:bg-cyan/10 hover:border-cyan"
              @click="join('blue')"
              :loading="loadingAction"
            >
              {{
                mySide
                  ? "Changer pour " +
                    (scrim.type === "team" ? "cette équipe" : "l'équipe Bleue")
                  : "Rejoindre " +
                    (scrim.type === "team" ? "cette équipe" : "l'équipe Bleue")
              }}
            </BaseButton>
            <div v-else class="text-center text-xs text-cyan font-bold py-2">
              Vous êtes dans cette équipe
            </div>
          </div>
        </div>

        <!-- Red Side -->
        <div
          class="bg-surface border-t-4 border-t-danger border-x border-b border-border rounded-xl p-4 flex flex-col"
          :class="{
            'ring-2 ring-danger ring-offset-2 ring-offset-background':
              mySide === 'red',
          }"
        >
          <div class="flex justify-between items-center mb-4">
            <h3
              class="font-bold text-danger truncate"
              :title="scrim.challenged_team?.name"
            >
              {{
                scrim.type === "team" && scrim.challenged_team
                  ? scrim.challenged_team.tag || scrim.challenged_team.name
                  : "Équipe Rouge"
              }}
            </h3>
            <span class="text-xs text-text-muted">{{ redSide.length }}/5</span>
          </div>
          <div class="space-y-2 flex-1">
            <div
              v-for="p in redSide"
              :key="p.id"
              class="flex items-center gap-2 p-2 rounded bg-surface-elevated"
            >
              <BaseAvatar
                :src="p.profile?.avatar_url"
                :name="p.profile?.username"
                size="sm"
              />
              <span class="text-sm font-medium truncate">{{
                p.profile?.username
              }}</span>
              <span class="text-xs text-text-muted ml-auto">{{
                p.profile?.rank || "Unranked"
              }}</span>
            </div>
            <div
              v-if="redSide.length === 0"
              class="text-xs text-text-muted text-center py-4"
            >
              Aucun joueur
            </div>
          </div>
          <div
            v-if="scrim.status === 'scheduled'"
            class="mt-4 pt-4 border-t border-border"
          >
            <BaseButton
              v-if="mySide !== 'red'"
              variant="ghost"
              size="sm"
              class="w-full border-dashed border border-border text-danger hover:bg-danger/10 hover:border-danger"
              @click="join('red')"
              :loading="loadingAction"
            >
              {{
                mySide
                  ? "Changer pour " +
                    (scrim.type === "team" ? "cette équipe" : "l'équipe Rouge")
                  : "Rejoindre " +
                    (scrim.type === "team" ? "cette équipe" : "l'équipe Rouge")
              }}
            </BaseButton>
            <div v-else class="text-center text-xs text-danger font-bold py-2">
              Vous êtes dans cette équipe
            </div>
          </div>
        </div>

        <!-- Reserve Side -->
        <div
          class="bg-surface border-t-4 border-t-text-muted border-x border-b border-border rounded-xl p-4 flex flex-col"
          :class="{
            'ring-2 ring-text-muted ring-offset-2 ring-offset-background':
              mySide && !['blue', 'red'].includes(mySide),
          }"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-text-muted">Remplaçants</h3>
            <span class="text-xs text-text-muted">{{
              reserveSide.length
            }}</span>
          </div>
          <div class="space-y-2 flex-1">
            <div
              v-for="p in reserveSide"
              :key="p.id"
              class="flex items-center gap-2 p-2 rounded bg-surface-elevated opacity-75"
            >
              <BaseAvatar
                :src="p.profile?.avatar_url"
                :name="p.profile?.username"
                size="sm"
              />
              <span class="text-sm font-medium truncate">{{
                p.profile?.username
              }}</span>
              <span class="text-xs text-text-muted ml-auto">{{
                p.profile?.rank || "Unranked"
              }}</span>
            </div>
            <div
              v-if="reserveSide.length === 0"
              class="text-xs text-text-muted text-center py-4"
            >
              Aucun remplaçant
            </div>
          </div>
          <div
            v-if="scrim.status === 'scheduled'"
            class="mt-4 pt-4 border-t border-border"
          >
            <!-- Allow reserve join for everyone -->
            <BaseButton
              v-if="mySide && ['blue', 'red'].includes(mySide)"
              variant="ghost"
              size="sm"
              class="w-full border-dashed border border-border text-text-muted hover:bg-surface-elevated"
              @click="join('reserve')"
              :loading="loadingAction"
            >
              Passer en réserve
            </BaseButton>
            <BaseButton
              v-else-if="!mySide"
              variant="ghost"
              size="sm"
              class="w-full border-dashed border border-border text-text-muted hover:bg-surface-elevated"
              @click="join('reserve')"
              :loading="loadingAction"
            >
              Rejoindre en réserve
            </BaseButton>
            <div
              v-else
              class="text-center text-xs text-text-muted font-bold py-2"
            >
              Vous êtes en réserve
            </div>
          </div>
        </div>
      </div>

      <!-- User Action: Leave -->
      <div
        v-if="amIParticipant && scrim.status === 'scheduled'"
        class="mt-8 text-center"
      >
        <BaseButton
          variant="ghost"
          class="text-danger hover:text-danger hover:bg-danger/10"
          @click="leave"
          :loading="loadingAction"
        >
          Se désinscrire
        </BaseButton>
      </div>

      <!-- Stats Display (if completed) -->
      <div v-if="scrim.status === 'completed'" class="mt-12">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <BarChart2 :size="20" /> Résultats du match
          </h2>
          <span
            v-if="scrim.game_duration"
            class="px-3 py-1 bg-surface-elevated rounded-full text-sm text-text-muted border border-border"
          >
            Durée: {{ Math.floor(scrim.game_duration / 60) }}m
            {{ (scrim.game_duration % 60).toString().padStart(2, "0") }}s
          </span>
        </div>
        <!-- Simple Table for now -->
        <div class="overflow-x-auto border border-border rounded-lg">
          <table class="w-full text-sm text-left">
            <thead class="bg-surface-elevated text-text-secondary">
              <tr>
                <th class="p-3">Joueur</th>
                <th class="p-3">Role</th>
                <th class="p-3">Champion</th>
                <th class="p-3 text-right">K / D / A</th>
                <th class="p-3 text-right">CS</th>
                <th class="p-3 text-center">Résultat</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="stat in scrim.stats"
                :key="stat.id"
                :class="stat.win ? 'bg-cyan/5' : ''"
              >
                <td class="p-3 font-medium">{{ stat.profile?.username }}</td>
                <td class="p-3">
                  <div v-if="stat.role" class="flex items-center gap-1">
                    <!-- You can add an icon here if LolRoleIcon is globally registered or imported -->
                    <span>{{ stat.role }}</span>
                  </div>
                  <span v-else class="text-text-muted text-xs">-</span>
                </td>
                <td class="p-3">{{ stat.champion_name }}</td>
                <td class="p-3 text-right font-mono">
                  {{ stat.kills }}/{{ stat.deaths }}/{{ stat.assists }}
                </td>
                <td class="p-3 text-right font-mono">{{ stat.cs }}</td>
                <td class="p-3 text-center">
                  <BaseBadge
                    :variant="stat.win ? 'success' : 'destructive'"
                    size="sm"
                  >
                    {{ stat.win ? "VICTOIRE" : "DÉFAITE" }}
                  </BaseBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="scrim.screenshot_url" class="mt-4">
          <a
            :href="scrim.screenshot_url"
            target="_blank"
            class="text-sm text-cyan hover:underline flex items-center gap-1"
          >
            <ImageIcon :size="14" /> Voir la capture d'écran
          </a>
        </div>
      </div>

      <!-- Result Modal -->
      <BaseModal
        v-model="showResultModal"
        title="Saisie des Résultats"
        size="3xl"
      >
        <ScrimResultForm
          :scrimId="scrim.id"
          :participants="formParticipants"
          @submit="handleSubmitResults"
          @cancel="showResultModal = false"
        />
      </BaseModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { UploadCloud, BarChart2, Image as ImageIcon } from "lucide-vue-next";
import { useScrimStore } from "../stores/scrims";
import { useAuthStore } from "../stores/auth";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import BaseAvatar from "../components/ui/BaseAvatar.vue";
import BaseModal from "../components/ui/BaseModal.vue";
import RankBadge from "../components/domain/RankBadge.vue";
import ScrimResultForm from "../components/forms/ScrimResultForm.vue";
import { supabase } from "../lib/supabase"; // Import Supabase directly for ad-hoc queries

const route = useRoute();
const scrimStore = useScrimStore();
const authStore = useAuthStore();

const loadingAction = ref(false);
const showResultModal = ref(false);

// Team Rosters Loading
const blueTeamMembers = ref<any[]>([]);
const redTeamMembers = ref<any[]>([]);
const loadingMembers = ref(false);

const scrim = computed(() => scrimStore.currentScrim);
const me = computed(() => authStore.user?.id);

// Team Rosters Loading Logic (Moved up or consolidated)
// Fetch members logic
async function fetchTeamMembers() {
  if (!scrim.value || scrim.value.type !== "team") return;

  loadingMembers.value = true;
  try {
    // Challenger = Blue
    if (scrim.value.challenger_team_id) {
      const { data } = await supabase
        .from("team_members")
        .select("*, profile:profile_id(*)")
        .eq("team_id", scrim.value.challenger_team_id);
      blueTeamMembers.value = data || [];
    }
    // Challenged = Red
    if (scrim.value.challenged_team_id) {
      const { data } = await supabase
        .from("team_members")
        .select("*, profile:profile_id(*)")
        .eq("team_id", scrim.value.challenged_team_id);
      redTeamMembers.value = data || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingMembers.value = false;
  }
}

// Watch scrim to fetch members
watch(
  () => scrim.value,
  (newVal) => {
    if (newVal && newVal.type === "team") {
      fetchTeamMembers();
    }
  },
  { immediate: true },
);

// Participant list for Result Form
const formParticipants = computed(() => {
  if (scrim.value?.type === "open") {
    return scrim.value.participants || [];
  }
  // For Team, map members to participant shape
  const pBlue = blueTeamMembers.value.map((m: any) => ({
    user_id: m.profile_id,
    side: "blue",
    profile: m.profile,
    role: m.role,
  }));
  const pRed = redTeamMembers.value.map((m: any) => ({
    user_id: m.profile_id,
    side: "red",
    profile: m.profile,
    role: m.role,
  }));
  return [...pBlue, ...pRed];
});

// Roles
const isCreator = computed(() => scrim.value?.creator_id === me.value);
const isChallengerCaptain = computed(
  () => scrim.value?.challenger_team?.captain_id === me.value,
);
const isChallengedCaptain = computed(
  () => scrim.value?.challenged_team?.captain_id === me.value,
);

const isAdmin = computed(() => {
  return (
    authStore.profile?.role === "admin" ||
    authStore.profile?.role === "superadmin"
  );
});

const amIParticipant = computed(() => {
  return scrim.value?.participants?.some((p) => p.user_id === me.value);
});

const canManage = computed(
  () =>
    isCreator.value ||
    isChallengerCaptain.value ||
    isChallengedCaptain.value ||
    isAdmin.value,
);

const canSubmitResults = computed(() => {
  if (!scrim.value) return false;
  const isScheduledOrCompleted =
    scrim.value.status === "scheduled" || scrim.value.status === "completed";
  const hasPermission =
    isCreator.value ||
    isChallengerCaptain.value ||
    isChallengedCaptain.value ||
    isAdmin.value;
  return isScheduledOrCompleted && hasPermission;
});

// Participants Split
const blueSide = computed(
  () => scrim.value?.participants?.filter((p) => p.side === "blue") || [],
);
const redSide = computed(
  () => scrim.value?.participants?.filter((p) => p.side === "red") || [],
);
const reserveSide = computed(
  () =>
    scrim.value?.participants?.filter(
      (p) => !["blue", "red"].includes(p.side),
    ) || [],
);

const mySide = computed(() => {
  const p = scrim.value?.participants?.find((p) => p.user_id === me.value);
  if (!p) return null; // Not participating
  return p.side || "reserve";
});

function getScrimTitle() {
  if (!scrim.value) return "";
  if (scrim.value.type === "team") {
    const challenger = scrim.value.challenger_team?.name || "Equipe Inconnue";
    const challenged = scrim.value.challenged_team?.name || "Equipe Inconnue";
    return `${challenger} VS ${challenged}`;
  }
  const creatorName = scrim.value.creator?.username;
  return creatorName ? `Open Scrim de ${creatorName}` : "Open Scrim Session";
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

async function join(side: string) {
  if (!scrim.value) return;
  loadingAction.value = true;
  try {
    await scrimStore.joinScrim(scrim.value.id, side);
  } catch (e) {
    console.error(e);
  } finally {
    loadingAction.value = false;
  }
}

async function leave() {
  if (!scrim.value) return;
  loadingAction.value = true;
  try {
    await scrimStore.leaveScrim(scrim.value.id);
  } catch (e) {
    console.error(e);
  } finally {
    loadingAction.value = false;
  }
}

async function respond(action: "accept" | "decline") {
  if (!scrim.value) return;
  loadingAction.value = true;
  try {
    await scrimStore.respondToChallenge(scrim.value.id, action);
  } catch (e) {
    console.error(e);
  } finally {
    loadingAction.value = false;
  }
}

async function confirmFinish() {
  if (!confirm("Voulez-vous vraiment marquer ce scrim comme terminé ?")) return;
  try {
    loadingAction.value = true;
    await scrimStore.markAsCompleted(scrim.value!.id);
  } catch (e: any) {
    alert(e.message);
  } finally {
    loadingAction.value = false;
  }
}

async function handleSubmitResults(data: any) {
  if (!scrim.value) return;
  try {
    await scrimStore.submitResults(scrim.value.id, data);
    showResultModal.value = false;
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  scrimStore.fetchScrimById(route.params.id as string);
});
</script>
