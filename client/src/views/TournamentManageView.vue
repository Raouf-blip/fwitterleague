<template>
  <div>
    <PageHeader title="Gestion des Tournois" subtitle="Creer, modifier et gerer les tournois et matchs.">
      <template #actions>
        <BaseButton variant="primary" @click="openCreateTournament">
          <template #icon><Plus :size="16" /></template>
          Nouveau tournoi
        </BaseButton>
      </template>
    </PageHeader>

    <BaseSpinner v-if="loading" />

    <template v-else>
      <!-- Tournaments List -->
      <div v-if="tournaments.length === 0" class="text-center text-text-muted py-10 text-sm">
        Aucun tournoi. Creez le premier !
      </div>

      <div v-else class="space-y-4">
        <BaseCard
          v-for="t in tournaments"
          :key="t.id"
          :hoverable="false"
          class="!p-0 overflow-hidden"
        >
          <!-- Tournament header -->
          <div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
            <div class="flex items-center gap-3 flex-wrap">
              <h3 class="font-bold text-text-primary text-lg">{{ t.name }}</h3>
              <BaseBadge
                :variant="t.status === 'upcoming' ? 'cyan' : t.status === 'ongoing' ? 'gold' : 'muted'"
                size="sm"
              >
                {{ t.status === 'upcoming' ? 'A venir' : t.status === 'ongoing' ? 'En cours' : 'Termine' }}
              </BaseBadge>
              <span class="text-xs text-text-muted">
                {{ formatDate(t.start_date) }} - {{ formatDate(t.end_date) }} | Max {{ t.max_teams }} equipes
              </span>
            </div>
            <div class="flex items-center gap-2">
              <BaseButton variant="ghost" size="sm" @click="openEditTournament(t)">
                <template #icon><Pencil :size="14" /></template>
                Modifier
              </BaseButton>
              <BaseButton variant="ghost" size="sm" @click="openStatusModal(t)">
                <template #icon><RefreshCw :size="14" /></template>
                Statut
              </BaseButton>
              <BaseButton variant="ghost" size="sm" @click="openCreateMatch(t)">
                <template #icon><Swords :size="14" /></template>
                + Match
              </BaseButton>
              <BaseButton variant="danger" size="sm" @click="confirmDeleteTournament(t)">
                <template #icon><Trash2 :size="14" /></template>
              </BaseButton>
            </div>
          </div>

          <!-- Registered teams -->
          <div v-if="getRegistrationsForTournament(t.id).length > 0" class="px-5 py-3 border-b border-border">
            <h4 class="text-sm font-semibold text-text-secondary mb-3">
              Equipes inscrites ({{ getRegistrationsForTournament(t.id).length }})
            </h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="reg in getRegistrationsForTournament(t.id)"
                :key="reg.id"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-border/50"
              >
                <span class="text-sm font-semibold text-text-primary">{{ reg.team?.name || 'Equipe' }}</span>
                <span class="text-xs text-text-muted">[{{ reg.team?.tag || '?' }}]</span>
                <button
                  class="ml-1 p-0.5 text-text-muted hover:text-danger transition-colors cursor-pointer"
                  title="Retirer cette equipe"
                  @click="adminUnregister(t.id, reg.team_id, reg.team?.name)"
                >
                  <UserMinus :size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Tournament matches -->
          <div v-if="getMatchesForTournament(t.id).length > 0" class="px-5 py-3">
            <h4 class="text-sm font-semibold text-text-secondary mb-3">
              Matchs ({{ getMatchesForTournament(t.id).length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="match in getMatchesForTournament(t.id)"
                :key="match.id"
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white/[0.02] border border-border/50"
              >
                <div class="flex items-center gap-3 text-sm">
                  <span class="font-semibold text-text-primary">{{ match.team_1?.name || 'TBD' }}</span>
                  <span v-if="match.score_1 !== null" class="text-gold font-bold">{{ match.score_1 }}</span>
                  <span class="text-text-muted">vs</span>
                  <span v-if="match.score_2 !== null" class="text-gold font-bold">{{ match.score_2 }}</span>
                  <span class="font-semibold text-text-primary">{{ match.team_2?.name || 'TBD' }}</span>
                  <BaseBadge v-if="match.winner_id" variant="success" size="sm">Termine</BaseBadge>
                  <span v-if="match.scheduled_at" class="text-xs text-text-muted ml-2">
                    {{ formatDateTime(match.scheduled_at) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <BaseButton variant="ghost" size="sm" @click="openEditMatch(match)">
                    <template #icon><Pencil :size="14" /></template>
                    Score
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="px-5 py-4 text-sm text-text-muted text-center">
            Aucun match planifie.
          </div>
        </BaseCard>
      </div>
    </template>

    <!-- Create/Edit Tournament Modal -->
    <BaseModal v-model="showTournamentModal" :title="editingTournament ? 'Modifier le tournoi' : 'Nouveau tournoi'" size="md">
      <form @submit.prevent="saveTournament" class="space-y-4">
        <BaseInput v-model="tournamentForm.name" label="Nom du tournoi" placeholder="Coupe FwitterLeague S1" required />
        <BaseTextarea v-model="tournamentForm.description" label="Description" placeholder="Description du tournoi..." :rows="2" />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="tournamentForm.start_date" label="Date de debut" type="date" required />
          <BaseInput v-model="tournamentForm.end_date" label="Date de fin" type="date" required />
        </div>
        <BaseInput v-model="tournamentForm.max_teams" label="Nombre max d'equipes" type="number" required />
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="showTournamentModal = false">Annuler</BaseButton>
          <BaseButton variant="primary" :loading="savingTournament" @click="saveTournament">
            {{ editingTournament ? 'Enregistrer' : 'Creer' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Status Change Modal -->
    <BaseModal v-model="showStatusModal" title="Changer le statut" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-text-secondary">
          Tournoi : <strong class="text-text-primary">{{ statusTournament?.name }}</strong>
        </p>
        <BaseSelect
          v-model="newStatus"
          label="Nouveau statut"
          :options="[
            { value: 'upcoming', label: 'A venir' },
            { value: 'ongoing', label: 'En cours' },
            { value: 'finished', label: 'Termine' },
          ]"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="showStatusModal = false">Annuler</BaseButton>
          <BaseButton variant="primary" :loading="changingStatus" @click="changeStatus">Confirmer</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Create Match Modal -->
    <BaseModal v-model="showMatchModal" :title="editingMatch ? 'Modifier le match' : 'Nouveau match'" size="md">
      <form @submit.prevent="saveMatch" class="space-y-4">
        <template v-if="!editingMatch">
          <BaseSelect
            v-model="matchForm.team_1_id"
            label="Equipe 1"
            placeholder="Selectionnez une equipe"
            :options="teamOptions"
          />
          <BaseSelect
            v-model="matchForm.team_2_id"
            label="Equipe 2"
            placeholder="Selectionnez une equipe"
            :options="teamOptions"
          />
          <BaseInput v-model="matchForm.scheduled_at" label="Date et heure" type="datetime-local" />
        </template>
        <template v-else>
          <p class="text-sm text-text-secondary mb-2">
            <strong class="text-text-primary">{{ editingMatch.team_1?.name }}</strong>
            vs
            <strong class="text-text-primary">{{ editingMatch.team_2?.name }}</strong>
          </p>
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="matchForm.score_1" label="Score Equipe 1" type="number" />
            <BaseInput v-model="matchForm.score_2" label="Score Equipe 2" type="number" />
          </div>
          <BaseSelect
            v-model="matchForm.winner_id"
            label="Vainqueur"
            placeholder="Selectionnez le vainqueur"
            :options="winnerOptions"
          />
        </template>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="showMatchModal = false">Annuler</BaseButton>
          <BaseButton variant="primary" :loading="savingMatch" @click="saveMatch">
            {{ editingMatch ? 'Valider le score' : 'Planifier' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Tournament Confirm -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Supprimer ce tournoi ?"
      :message="`Voulez-vous vraiment supprimer '${deletingTournament?.name}' ? Tous les matchs et inscriptions seront supprimes.`"
      confirm-label="Supprimer"
      variant="danger"
      :loading="deletingLoading"
      @confirm="deleteTournament"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Swords, RefreshCw, UserMinus } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useNotificationStore } from '../stores/notifications'
import { formatDate, formatDateTime } from '../lib/formatters'
import type { Tournament, Match, Team } from '../types'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseTextarea from '../components/ui/BaseTextarea.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'

const notificationStore = useNotificationStore()

const tournaments = ref<Tournament[]>([])
const matches = ref<Match[]>([])
const teams = ref<Team[]>([])
const registrations = ref<Record<string, any[]>>({})
const loading = ref(true)

// Tournament form
const showTournamentModal = ref(false)
const editingTournament = ref<Tournament | null>(null)
const savingTournament = ref(false)
const tournamentForm = ref({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  max_teams: '8',
})

// Status change
const showStatusModal = ref(false)
const statusTournament = ref<Tournament | null>(null)
const newStatus = ref('upcoming')
const changingStatus = ref(false)

// Match form
const showMatchModal = ref(false)
const editingMatch = ref<Match | null>(null)
const savingMatch = ref(false)
const matchTournamentId = ref('')
const matchForm = ref({
  team_1_id: '',
  team_2_id: '',
  scheduled_at: '',
  score_1: '',
  score_2: '',
  winner_id: '',
})

// Delete
const showDeleteConfirm = ref(false)
const deletingTournament = ref<Tournament | null>(null)
const deletingLoading = ref(false)

const teamOptions = computed(() =>
  teams.value.map(t => ({ value: t.id, label: `${t.name} [${t.tag}]` }))
)

const winnerOptions = computed(() => {
  if (!editingMatch.value) return []
  return [
    { value: '', label: 'Aucun (pas encore joue)' },
    { value: editingMatch.value.team_1_id, label: editingMatch.value.team_1?.name || 'Equipe 1' },
    { value: editingMatch.value.team_2_id, label: editingMatch.value.team_2?.name || 'Equipe 2' },
  ]
})

function getMatchesForTournament(tournamentId: string) {
  return matches.value.filter(m => m.tournament_id === tournamentId)
}

function getRegistrationsForTournament(tournamentId: string) {
  return registrations.value[tournamentId] || []
}

onMounted(async () => {
  await fetchAll()
})

async function fetchAll() {
  loading.value = true
  try {
    const [t, m, te] = await Promise.all([
      api.get('/tournaments'),
      api.get('/tournaments/matches'),
      api.get('/teams'),
    ])
    tournaments.value = t
    matches.value = m
    teams.value = te

    // Fetch registrations per tournament
    const regsMap: Record<string, any[]> = {}
    await Promise.all(t.map(async (tournament: Tournament) => {
      try {
        const detail = await api.get(`/tournaments/${tournament.id}`)
        regsMap[tournament.id] = detail.registrations || []
      } catch { /* ignore */ }
    }))
    registrations.value = regsMap
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur chargement', 'error')
  }
  loading.value = false
}

async function adminUnregister(tournamentId: string, teamId: string, teamName?: string) {
  if (!confirm(`Retirer ${teamName || 'cette equipe'} du tournoi ?`)) return
  try {
    const token = await getToken()
    await api.delete(`/tournaments/${tournamentId}/registrations/${teamId}`, token)
    notificationStore.show(`${teamName || 'Equipe'} retiree du tournoi.`, 'success')
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur', 'error')
  }
}

// Tournament CRUD
function openCreateTournament() {
  editingTournament.value = null
  tournamentForm.value = { name: '', description: '', start_date: '', end_date: '', max_teams: '8' }
  showTournamentModal.value = true
}

function openEditTournament(t: Tournament) {
  editingTournament.value = t
  tournamentForm.value = {
    name: t.name,
    description: t.description || '',
    start_date: t.start_date.split('T')[0],
    end_date: t.end_date.split('T')[0],
    max_teams: String(t.max_teams),
  }
  showTournamentModal.value = true
}

async function saveTournament() {
  savingTournament.value = true
  try {
    const token = await getToken()
    const payload = {
      name: tournamentForm.value.name,
      description: tournamentForm.value.description || null,
      start_date: tournamentForm.value.start_date,
      end_date: tournamentForm.value.end_date,
      max_teams: parseInt(tournamentForm.value.max_teams),
    }
    if (editingTournament.value) {
      await api.patch(`/tournaments/${editingTournament.value.id}`, payload, token)
      notificationStore.show('Tournoi mis a jour', 'success')
    } else {
      await api.post('/tournaments', payload, token)
      notificationStore.show('Tournoi cree !', 'success')
    }
    showTournamentModal.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur', 'error')
  } finally {
    savingTournament.value = false
  }
}

function openStatusModal(t: Tournament) {
  statusTournament.value = t
  newStatus.value = t.status
  showStatusModal.value = true
}

async function changeStatus() {
  if (!statusTournament.value) return
  changingStatus.value = true
  try {
    const token = await getToken()
    await api.patch(`/tournaments/${statusTournament.value.id}`, { status: newStatus.value }, token)
    notificationStore.show('Statut mis a jour', 'success')
    showStatusModal.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur', 'error')
  } finally {
    changingStatus.value = false
  }
}

function confirmDeleteTournament(t: Tournament) {
  deletingTournament.value = t
  showDeleteConfirm.value = true
}

async function deleteTournament() {
  if (!deletingTournament.value) return
  deletingLoading.value = true
  try {
    const token = await getToken()
    await api.delete(`/tournaments/${deletingTournament.value.id}`, token)
    notificationStore.show('Tournoi supprime', 'success')
    showDeleteConfirm.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur', 'error')
  } finally {
    deletingLoading.value = false
  }
}

// Match CRUD
function openCreateMatch(t: Tournament) {
  editingMatch.value = null
  matchTournamentId.value = t.id
  matchForm.value = { team_1_id: '', team_2_id: '', scheduled_at: '', score_1: '', score_2: '', winner_id: '' }
  showMatchModal.value = true
}

function openEditMatch(match: Match) {
  editingMatch.value = match
  matchForm.value = {
    team_1_id: match.team_1_id,
    team_2_id: match.team_2_id,
    scheduled_at: match.scheduled_at || '',
    score_1: match.score_1 !== null ? String(match.score_1) : '',
    score_2: match.score_2 !== null ? String(match.score_2) : '',
    winner_id: match.winner_id || '',
  }
  showMatchModal.value = true
}

async function saveMatch() {
  savingMatch.value = true
  try {
    const token = await getToken()
    if (editingMatch.value) {
      const payload: Record<string, any> = {}
      if (matchForm.value.score_1 !== '') payload.score_1 = parseInt(matchForm.value.score_1)
      if (matchForm.value.score_2 !== '') payload.score_2 = parseInt(matchForm.value.score_2)
      if (matchForm.value.winner_id) payload.winner_id = matchForm.value.winner_id
      else payload.winner_id = null
      await api.patch(`/tournaments/matches/${editingMatch.value.id}`, payload, token)
      notificationStore.show('Score mis a jour', 'success')
    } else {
      await api.post('/tournaments/matches', {
        tournament_id: matchTournamentId.value,
        team_1_id: matchForm.value.team_1_id,
        team_2_id: matchForm.value.team_2_id,
        scheduled_at: matchForm.value.scheduled_at || null,
      }, token)
      notificationStore.show('Match planifie !', 'success')
    }
    showMatchModal.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur', 'error')
  } finally {
    savingMatch.value = false
  }
}
</script>
