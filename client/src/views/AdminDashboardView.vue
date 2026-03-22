<template>
  <div>
    <PageHeader title="Administration" subtitle="Gestion complete de la plateforme." />

    <!-- Stats Row -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-surface border border-border rounded-xl p-4 text-center">
        <div class="text-2xl font-extrabold" :class="stat.color">{{ stat.value }}</div>
        <div class="text-xs text-text-muted mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-3 mb-8">
      <BaseButton variant="primary" to="/admin/tournaments">
        <template #icon><Trophy :size="16" /></template>
        Gerer les tournois
      </BaseButton>
      <BaseButton variant="secondary" @click="activeSection = 'users'">
        <template #icon><Users :size="16" /></template>
        Utilisateurs
      </BaseButton>
      <BaseButton variant="secondary" @click="activeSection = 'teams'">
        <template #icon><Shield :size="16" /></template>
        Equipes
      </BaseButton>
    </div>

    <BaseSpinner v-if="loading" />

    <template v-else>
      <!-- ==================== USERS SECTION ==================== -->
      <div v-if="activeSection === 'users'">
        <BaseCard :hoverable="false" class="!p-0 overflow-hidden">
          <div class="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-text-primary">Utilisateurs ({{ users.length }})</h2>
            <div class="flex items-center gap-3">
              <BaseInput
                v-model="userSearch"
                placeholder="Rechercher..."
                class="w-48"
              />
              <BaseSelect
                v-model="roleFilter"
                :options="roleOptions"
                placeholder="Tous les roles"
                class="w-40"
              />
            </div>
          </div>

          <div v-if="filteredUsers.length === 0" class="text-center text-text-muted py-10 text-sm">
            Aucun utilisateur trouve.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-text-muted text-left">
                  <th class="px-5 py-3">Joueur</th>
                  <th class="px-5 py-3 hidden sm:table-cell">Riot ID</th>
                  <th class="px-5 py-3 hidden md:table-cell">Discord</th>
                  <th class="px-5 py-3">Role</th>
                  <th class="px-5 py-3 hidden md:table-cell">Rang</th>
                  <th class="px-5 py-3 hidden lg:table-cell">Statut</th>
                  <th class="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      <BaseAvatar :name="user.username" size="sm" />
                      <div>
                        <div class="font-semibold text-text-primary">{{ user.username }}</div>
                        <div class="text-xs text-text-muted">{{ formatDate(user.created_at) }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-text-secondary hidden sm:table-cell">{{ user.riot_id || '-' }}</td>
                  <td class="px-5 py-3 text-text-secondary hidden md:table-cell">{{ user.discord || '-' }}</td>
                  <td class="px-5 py-3">
                    <BaseBadge
                      :variant="user.role === 'superadmin' ? 'danger' : user.role === 'admin' ? 'gold' : 'muted'"
                      size="sm"
                    >
                      {{ user.role }}
                    </BaseBadge>
                  </td>
                  <td class="px-5 py-3 hidden md:table-cell">
                    <RankBadge :rank="user.rank" />
                  </td>
                  <td class="px-5 py-3 hidden lg:table-cell">
                    <div class="flex flex-wrap gap-1">
                      <BaseBadge v-if="user.is_captain" variant="gold" size="sm">Capitaine</BaseBadge>
                      <BaseBadge v-if="user.is_looking_for_team" variant="success" size="sm">Agent libre</BaseBadge>
                    </div>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <BaseButton variant="ghost" size="sm" :to="`/profile/${user.id}`">
                        <template #icon><Eye :size="14" /></template>
                      </BaseButton>
                      <BaseButton
                        v-if="isSuperAdmin && user.id !== authStore.user?.id"
                        variant="ghost"
                        size="sm"
                        @click="openRoleModal(user)"
                      >
                        <template #icon><ShieldCheck :size="14" /></template>
                      </BaseButton>
                      <BaseButton
                        v-if="isSuperAdmin && user.id !== authStore.user?.id"
                        variant="danger"
                        size="sm"
                        @click="confirmDeleteUser(user)"
                      >
                        <template #icon><Trash2 :size="14" /></template>
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>

      <!-- ==================== TEAMS SECTION ==================== -->
      <div v-if="activeSection === 'teams'">
        <BaseCard :hoverable="false" class="!p-0 overflow-hidden">
          <div class="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-text-primary">Equipes ({{ teams.length }})</h2>
            <BaseInput
              v-model="teamSearch"
              placeholder="Rechercher une equipe..."
              class="w-56"
            />
          </div>

          <div v-if="filteredTeams.length === 0" class="text-center text-text-muted py-10 text-sm">
            Aucune equipe trouvee.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-text-muted text-left">
                  <th class="px-5 py-3">Equipe</th>
                  <th class="px-5 py-3 hidden sm:table-cell">Capitaine</th>
                  <th class="px-5 py-3 text-center">Membres</th>
                  <th class="px-5 py-3 hidden md:table-cell">Statut</th>
                  <th class="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="t in filteredTeams"
                  :key="t.id"
                  class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-gold-muted border border-border-gold flex items-center justify-center text-xs font-black text-gold">
                        {{ t.tag }}
                      </div>
                      <div>
                        <div class="font-semibold text-text-primary">{{ t.name }}</div>
                        <div class="text-xs text-text-muted">[{{ t.tag }}]</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3 hidden sm:table-cell">
                    <span class="text-text-secondary">{{ getCaptainName(t) }}</span>
                  </td>
                  <td class="px-5 py-3 text-center text-text-primary font-semibold">
                    {{ t.members?.length || 0 }}/6
                  </td>
                  <td class="px-5 py-3 hidden md:table-cell">
                    <BaseBadge v-if="t.is_locked" variant="danger" size="sm">Verrouille</BaseBadge>
                    <BaseBadge v-else variant="success" size="sm">Ouvert</BaseBadge>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <BaseButton variant="ghost" size="sm" :to="`/teams/${t.id}`">
                        <template #icon><Eye :size="14" /></template>
                      </BaseButton>
                      <BaseButton
                        variant="danger"
                        size="sm"
                        @click="confirmDeleteTeam(t)"
                      >
                        <template #icon><Trash2 :size="14" /></template>
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </template>

    <!-- Role Change Modal -->
    <BaseModal v-model="showRoleModal" title="Changer le role" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-text-secondary">
          Modifier le role de <strong class="text-text-primary">{{ selectedUser?.username }}</strong>
        </p>
        <BaseSelect
          v-model="newRole"
          label="Nouveau role"
          :options="[
            { value: 'user', label: 'Utilisateur' },
            { value: 'admin', label: 'Admin' },
            { value: 'superadmin', label: 'Super Admin' },
          ]"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="showRoleModal = false">Annuler</BaseButton>
          <BaseButton variant="primary" :loading="changingRole" @click="changeRole">Confirmer</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Delete User Confirm -->
    <ConfirmDialog
      v-model="showDeleteUserConfirm"
      title="Supprimer cet utilisateur ?"
      :message="`Voulez-vous vraiment supprimer le compte de ${selectedUser?.username} ? Cette action est irreversible.`"
      confirm-label="Supprimer"
      variant="danger"
      :loading="deletingUser"
      @confirm="deleteUser"
    />

    <!-- Delete Team Confirm -->
    <ConfirmDialog
      v-model="showDeleteTeamConfirm"
      title="Dissoudre cette equipe ?"
      :message="`Voulez-vous vraiment dissoudre l'equipe ${selectedTeam?.name} [${selectedTeam?.tag}] ? Tous les membres seront retires.`"
      confirm-label="Dissoudre"
      variant="danger"
      :loading="deletingTeam"
      @confirm="deleteTeam"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShieldCheck, Trash2, Eye, Trophy, Users, Shield } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { formatDate } from '../lib/formatters'
import type { Profile, Team } from '../types'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseAvatar from '../components/ui/BaseAvatar.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import RankBadge from '../components/domain/RankBadge.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const users = ref<Profile[]>([])
const teams = ref<Team[]>([])
const tournaments = ref<any[]>([])
const matches = ref<any[]>([])
const loading = ref(true)
const activeSection = ref<'users' | 'teams'>('users')

// User filters
const userSearch = ref('')
const roleFilter = ref('')
const teamSearch = ref('')

// Role modal
const showRoleModal = ref(false)
const selectedUser = ref<Profile | null>(null)
const newRole = ref('user')
const changingRole = ref(false)

// Delete user
const showDeleteUserConfirm = ref(false)
const deletingUser = ref(false)

// Delete team
const showDeleteTeamConfirm = ref(false)
const selectedTeam = ref<Team | null>(null)
const deletingTeam = ref(false)

const isSuperAdmin = computed(() => authStore.profile?.role === 'superadmin')

const roleOptions = [
  { value: '', label: 'Tous' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
]

const stats = computed(() => {
  const totalUsers = users.value.length
  const admins = users.value.filter(u => u.role === 'admin' || u.role === 'superadmin').length
  const captains = users.value.filter(u => u.is_captain).length
  const agents = users.value.filter(u => u.is_looking_for_team).length
  const totalTeams = teams.value.length
  const totalTournaments = tournaments.value.length
  return [
    { label: 'Utilisateurs', value: totalUsers, color: 'text-text-primary' },
    { label: 'Admins', value: admins, color: 'text-gold' },
    { label: 'Capitaines', value: captains, color: 'text-cyan' },
    { label: 'Agents libres', value: agents, color: 'text-success' },
    { label: 'Equipes', value: totalTeams, color: 'text-text-primary' },
    { label: 'Tournois', value: totalTournaments, color: 'text-gold' },
  ]
})

const filteredUsers = computed(() => {
  let result = users.value
  if (userSearch.value) {
    const q = userSearch.value.toLowerCase()
    result = result.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.riot_id?.toLowerCase().includes(q) ||
      u.discord?.toLowerCase().includes(q)
    )
  }
  if (roleFilter.value) {
    result = result.filter(u => u.role === roleFilter.value)
  }
  return result
})

const filteredTeams = computed(() => {
  if (!teamSearch.value) return teams.value
  const q = teamSearch.value.toLowerCase()
  return teams.value.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.tag.toLowerCase().includes(q)
  )
})

function getCaptainName(team: Team) {
  const captain = team.members?.find(m => m.role === 'Captain')
  return captain?.profile?.username || '-'
}

onMounted(async () => {
  await fetchAll()
})

async function fetchAll() {
  loading.value = true
  try {
    const token = await getToken()
    const [u, te, to, m] = await Promise.all([
      api.get('/profiles', token),
      api.get('/teams'),
      api.get('/tournaments'),
      api.get('/tournaments/matches'),
    ])
    users.value = u
    teams.value = te
    tournaments.value = to
    matches.value = m
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur chargement', 'error')
  }
  loading.value = false
}

// --- User actions ---
function openRoleModal(user: Profile) {
  selectedUser.value = user
  newRole.value = user.role
  showRoleModal.value = true
}

function confirmDeleteUser(user: Profile) {
  selectedUser.value = user
  showDeleteUserConfirm.value = true
}

async function changeRole() {
  if (!selectedUser.value) return
  changingRole.value = true
  try {
    const token = await getToken()
    await api.patch(`/profiles/${selectedUser.value.id}/role`, { role: newRole.value }, token)
    notificationStore.show(`Role de ${selectedUser.value.username} mis a jour`, 'success')
    showRoleModal.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur changement de role', 'error')
  } finally {
    changingRole.value = false
  }
}

async function deleteUser() {
  if (!selectedUser.value) return
  deletingUser.value = true
  try {
    const token = await getToken()
    await api.delete(`/profiles/${selectedUser.value.id}`, token)
    notificationStore.show(`Compte de ${selectedUser.value.username} supprime`, 'success')
    showDeleteUserConfirm.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur suppression', 'error')
  } finally {
    deletingUser.value = false
  }
}

// --- Team actions ---
function confirmDeleteTeam(team: Team) {
  selectedTeam.value = team
  showDeleteTeamConfirm.value = true
}

async function deleteTeam() {
  if (!selectedTeam.value) return
  deletingTeam.value = true
  try {
    const token = await getToken()
    await api.delete(`/teams/${selectedTeam.value.id}`, token)
    notificationStore.show(`Equipe ${selectedTeam.value.name} dissoute`, 'success')
    showDeleteTeamConfirm.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur suppression equipe', 'error')
  } finally {
    deletingTeam.value = false
  }
}
</script>
