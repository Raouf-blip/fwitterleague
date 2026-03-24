<template>
  <div>
    <PageHeader title="Administration" subtitle="Gestion complète de la plateforme." />

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
        Gérer les tournois
      </BaseButton>
      <BaseButton variant="secondary" @click="activeSection = 'users'">
        <template #icon><Users :size="16" /></template>
        Utilisateurs
      </BaseButton>
      <BaseButton variant="secondary" @click="activeSection = 'teams'">
        <template #icon><Shield :size="16" /></template>
        Équipes
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
                placeholder="Rôle"
                class="w-32"
              />
              <BaseSelect
                v-model="statusFilter"
                :options="statusOptions"
                placeholder="Statut"
                class="w-36"
              />
            </div>
          </div>

          <div v-if="filteredUsers.length === 0" class="text-center text-text-muted py-10 text-sm">
            Aucun utilisateur trouvé.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-text-muted text-left">
                  <th class="px-5 py-3">Joueur</th>
                  <th class="px-5 py-3 hidden sm:table-cell">Riot ID</th>
                  <th class="px-5 py-3 hidden md:table-cell">Discord</th>
                  <th class="px-5 py-3">Rôle</th>
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
                      <BaseAvatar :name="user.username" :src="user.avatar_url ?? undefined" size="sm" />
                      <div>
                        <RouterLink
                          :to="`/profile/${user.id}`"
                          class="font-semibold text-text-primary hover:text-gold transition-colors"
                        >
                          {{ user.username }}
                        </RouterLink>
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
                    <RankBadge :rank="user.rank" :lp="user.lp" />
                  </td>
                  <td class="px-5 py-3 hidden lg:table-cell">
                    <div class="flex flex-wrap gap-1">
                      <BaseBadge v-if="user.is_captain" variant="gold" size="sm">Capitaine</BaseBadge>
                      <BaseBadge v-if="user.is_looking_for_team" variant="success" size="sm">Agent libre</BaseBadge>
                      <BaseBadge v-if="user.is_caster" variant="purple" size="sm">Caster</BaseBadge>
                    </div>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <BaseButton variant="ghost" size="sm" :to="`/profile/${user.id}`">
                        <template #icon><Eye :size="14" /></template>
                      </BaseButton>
                      <BaseButton
                        v-if="isSuperAdmin"
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
            <h2 class="text-lg font-bold text-text-primary">Équipes ({{ teams.length }})</h2>
            <BaseInput
              v-model="teamSearch"
              placeholder="Rechercher une équipe..."
              class="w-56"
            />
          </div>

          <div v-if="filteredTeams.length === 0" class="text-center text-text-muted py-10 text-sm">
            Aucune équipe trouvée.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-text-muted text-left">
                  <th class="px-5 py-3">Équipe</th>
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
                        <RouterLink
                          :to="`/teams/${t.id}`"
                          class="font-bold text-text-primary hover:text-gold transition-colors"
                        >
                          {{ t.name }}
                        </RouterLink>
                        <div class="text-xs text-text-muted">[{{ t.tag }}]</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3 hidden sm:table-cell">
                    <RouterLink
                      v-if="getCaptainId(t)"
                      :to="`/profile/${getCaptainId(t)}`"
                      class="font-semibold text-text-primary hover:text-gold transition-colors"
                    >
                      {{ getCaptainName(t) }}
                    </RouterLink>
                    <span v-else class="text-text-secondary">{{ getCaptainName(t) }}</span>
                  </td>
                  <td class="px-5 py-3 text-center text-text-primary font-semibold">
                    {{ t.members?.length || 0 }}/6
                  </td>
                  <td class="px-5 py-3 hidden md:table-cell">
                    <BaseBadge v-if="t.is_locked" variant="danger" size="sm">Verrouillé</BaseBadge>
                    <BaseBadge v-else variant="success" size="sm">Ouvert</BaseBadge>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <BaseButton variant="ghost" size="sm" :to="`/teams/${t.id}`">
                        <template #icon><Eye :size="14" /></template>
                      </BaseButton>
                      <BaseButton
                        v-if="isSuperAdmin"
                        variant="secondary"
                        size="sm"
                        @click="openManageMembers(t)"
                      >
                        <template #icon><UserCog :size="14" /></template>
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
    <BaseModal v-model="showRoleModal" title="Changer le rôle" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-text-secondary">
          Modifier le rôle de <strong class="text-text-primary">{{ selectedUser?.username }}</strong>
        </p>
        <BaseSelect
          v-model="newRole"
          label="Nouveau rôle"
          :options="[
            { value: 'user', label: 'Utilisateur' },
            { value: 'admin', label: 'Admin' },
            { value: 'superadmin', label: 'Super Admin' },
          ]"
        />
        <BaseSelect
          v-model="newStatus"
          label="Statut du joueur"
          :options="[
            { value: 'none', label: 'Aucun' },
            { value: 'captain', label: 'Capitaine' },
            { value: 'lft', label: 'Agent libre' },
          ]"
        />
        <BaseSelect
          v-model="isCaster"
          label="Caster Officiel"
          :options="[
            { value: 'no', label: 'Non' },
            { value: 'yes', label: 'Oui' },
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
      :message="`Voulez-vous vraiment supprimer le compte de ${selectedUser?.username} ? Cette action est irréversible.`"
      confirm-label="Supprimer"
      variant="danger"
      :loading="deletingUser"
      @confirm="deleteUser"
    />

    <!-- Delete Team Confirm -->
    <ConfirmDialog
      v-model="showDeleteTeamConfirm"
      title="Dissoudre cette équipe ?"
      :message="`Voulez-vous vraiment dissoudre l'équipe ${selectedTeam?.name} [${selectedTeam?.tag}] ? Tous les membres seront retirés.`"
      confirm-label="Dissoudre"
      variant="danger"
      :loading="deletingTeam"
      @confirm="deleteTeam"
    />

    <!-- Manage Members Modal -->
    <BaseModal v-model="showMembersModal" :title="`Membres de ${managedTeam?.name || ''}`" size="md">
      <div class="space-y-5">
        <!-- Current members -->
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-text-muted mb-3">Membres actuels</h3>
          <div v-if="!managedTeam?.members?.length" class="text-sm text-text-muted text-center py-4">Aucun membre.</div>
          <div v-else class="space-y-2">
            <div
              v-for="m in managedTeam?.members"
              :key="m.profile_id"
              class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
            >
              <div class="flex items-center gap-3">
                <BaseAvatar :name="m.profile?.username" :src="m.profile?.avatar_url ?? undefined" size="sm" />
                <div>
                  <RouterLink
                    :to="`/profile/${m.profile_id}`"
                    class="text-sm font-semibold text-text-primary hover:text-gold transition-colors"
                  >
                    {{ m.profile?.username }}
                  </RouterLink>
                  <BaseBadge v-if="m.role === 'Captain'" variant="gold" size="sm" class="ml-2">Capitaine</BaseBadge>
                </div>
              </div>
              <BaseButton
                v-if="m.profile_id !== managedTeam?.captain_id"
                variant="danger"
                size="sm"
                :loading="removingMemberId === m.profile_id"
                @click="removeMember(m.profile_id)"
              >
                <template #icon><UserMinus :size="14" /></template>
                Retirer
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Add a player -->
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-text-muted mb-3">Ajouter un joueur</h3>
          <div class="flex gap-2">
            <BaseInput
              v-model="addPlayerSearch"
              placeholder="Rechercher un joueur..."
              class="flex-1"
            />
          </div>
          <div v-if="addPlayerResults.length > 0" class="mt-2 space-y-1 max-h-48 overflow-y-auto">
            <div
              v-for="p in addPlayerResults"
              :key="p.id"
              class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div class="flex items-center gap-3">
                <BaseAvatar :name="p.username" :src="p.avatar_url ?? undefined" size="sm" />
                <div>
                  <RouterLink
                    :to="`/profile/${p.id}`"
                    class="text-sm font-semibold text-text-primary hover:text-gold transition-colors"
                  >
                    {{ p.username }}
                  </RouterLink>
                  <span v-if="p.riot_id" class="text-xs text-text-muted ml-2">{{ p.riot_id }}</span>
                </div>
              </div>
              <BaseButton
                variant="primary"
                size="sm"
                :loading="addingPlayerId === p.id"
                @click="addMember(p.id)"
              >
                <template #icon><UserPlus :size="14" /></template>
                Ajouter
              </BaseButton>
            </div>
          </div>
          <p v-else-if="addPlayerSearch.length >= 2" class="text-xs text-text-muted mt-2">Aucun joueur libre trouvé.</p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShieldCheck, Trash2, Eye, Trophy, Users, Shield, UserCog, UserPlus, UserMinus } from 'lucide-vue-next'
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
const statusFilter = ref('')
const teamSearch = ref('')

// Role modal
const showRoleModal = ref(false)
const selectedUser = ref<Profile | null>(null)
const newRole = ref('user')
const newStatus = ref<'none' | 'captain' | 'lft'>('none')
const isCaster = ref('no')
const changingRole = ref(false)

// Delete user
const showDeleteUserConfirm = ref(false)
const deletingUser = ref(false)

// Delete team
const showDeleteTeamConfirm = ref(false)
const selectedTeam = ref<Team | null>(null)
const deletingTeam = ref(false)

// Manage members
const showMembersModal = ref(false)
const managedTeam = ref<any>(null)
const addPlayerSearch = ref('')
const addingPlayerId = ref<string | null>(null)
const removingMemberId = ref<string | null>(null)

const isSuperAdmin = computed(() => authStore.profile?.role === 'superadmin')

const roleOptions = [
  { value: '', label: 'Tous les rôles' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
]

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'captain', label: 'Capitaine' },
  { value: 'lft', label: 'Agent libre' },
  { value: 'caster', label: 'Caster' },
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
    { label: 'Équipes', value: totalTeams, color: 'text-text-primary' },
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
  if (statusFilter.value) {
    if (statusFilter.value === 'captain') result = result.filter(u => u.is_captain)
    else if (statusFilter.value === 'lft') result = result.filter(u => u.is_looking_for_team)
    else if (statusFilter.value === 'caster') result = result.filter(u => u.is_caster)
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

const addPlayerResults = computed(() => {
  if (addPlayerSearch.value.length < 2 || !managedTeam.value) return []
  const q = addPlayerSearch.value.toLowerCase()
  const memberIds = new Set(managedTeam.value.members?.map((m: any) => m.profile_id) || [])
  return users.value.filter(u => {
    if (memberIds.has(u.id)) return false
    // Only show players without a team
    const inAnyTeam = teams.value.some(t => t.members?.some((m: any) => m.profile_id === u.id))
    if (inAnyTeam) return false
    return u.username.toLowerCase().includes(q) || u.riot_id?.toLowerCase().includes(q)
  }).slice(0, 8)
})

function getCaptainName(team: Team) {
  const captain = team.members?.find(m => m.role === 'Captain')
  return captain?.profile?.username || '-'
}

function getCaptainId(team: Team) {
  const captain = team.members?.find(m => m.role === 'Captain')
  return captain?.profile_id
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
  
  if (user.is_captain) newStatus.value = 'captain'
  else if (user.is_looking_for_team) newStatus.value = 'lft'
  else newStatus.value = 'none'

  isCaster.value = user.is_caster ? 'yes' : 'no'
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
    
    const promises = []
    
    // Update role if changed
    if (newRole.value !== selectedUser.value.role) {
      promises.push(api.patch(`/profiles/${selectedUser.value.id}/role`, { role: newRole.value }, token))
    }
    
    // Update status
    const isCaptain = newStatus.value === 'captain'
    const isLFT = newStatus.value === 'lft'
    const newIsCaster = isCaster.value === 'yes'
    const casterChanged = newIsCaster !== selectedUser.value.is_caster
    
    if (isCaptain !== selectedUser.value.is_captain || isLFT !== selectedUser.value.is_looking_for_team || casterChanged) {
      promises.push(api.patch(`/profiles/${selectedUser.value.id}/status`, { 
        is_captain: isCaptain, 
        is_looking_for_team: isLFT,
        is_caster: newIsCaster
      }, token))
    }

    if (promises.length > 0) {
      await Promise.all(promises)
      notificationStore.show(`Utilisateur ${selectedUser.value.username} mis à jour`, 'success')
      await fetchAll()
    }
    
    showRoleModal.value = false
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur mise à jour utilisateur', 'error')
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
    notificationStore.show(`Compte de ${selectedUser.value.username} supprimé`, 'success')
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
    notificationStore.show(`Équipe ${selectedTeam.value.name} dissoute`, 'success')
    showDeleteTeamConfirm.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur suppression équipe', 'error')
  } finally {
    deletingTeam.value = false
  }
}

// --- Manage members ---
async function openManageMembers(team: any) {
  // Fetch fresh team detail with members
  try {
    const data = await api.get(`/teams/${team.id}`)
    managedTeam.value = data
    addPlayerSearch.value = ''
    showMembersModal.value = true
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur chargement équipe', 'error')
  }
}

async function addMember(profileId: string) {
  if (!managedTeam.value) return
  addingPlayerId.value = profileId
  try {
    const token = await getToken()
    await api.post(`/teams/${managedTeam.value.id}/members`, { profile_id: profileId }, token)
    notificationStore.show('Joueur ajouté à l\'équipe', 'success')
    // Refresh
    const data = await api.get(`/teams/${managedTeam.value.id}`)
    managedTeam.value = data
    addPlayerSearch.value = ''
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur ajout joueur', 'error')
  } finally {
    addingPlayerId.value = null
  }
}

async function removeMember(profileId: string) {
  if (!managedTeam.value) return
  removingMemberId.value = profileId
  try {
    const token = await getToken()
    await api.delete(`/teams/${managedTeam.value.id}/members/${profileId}`, token)
    notificationStore.show('Joueur retiré de l\'équipe', 'success')
    // Refresh
    const data = await api.get(`/teams/${managedTeam.value.id}`)
    managedTeam.value = data
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur retrait joueur', 'error')
  } finally {
    removingMemberId.value = null
  }
}
</script>
