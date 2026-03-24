<template>
  <BaseSpinner v-if="loading" />

  <div v-else class="p-6">
    <PageHeader title="Panel Admin" subtitle="Gestion des utilisateurs et des équipes" />

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div v-for="s in stats" :key="s.label" class="bg-surface border border-border p-4 rounded-xl">
        <div class="text-xs text-text-muted mb-1 font-bold uppercase tracking-wider">{{ s.label }}</div>
        <div class="text-2xl font-black" :class="s.color">{{ s.value }}</div>
      </div>
    </div>

    <BaseTabs
      v-model="activeSection"
      :tabs="[
        { key: 'users', label: 'Utilisateurs' },
        { key: 'teams', label: 'Équipes' }
      ]"
      class="mb-6"
    />

    <!-- Users Section -->
    <div v-if="activeSection === 'users'" class="space-y-6">
      <BaseCard :hoverable="false">
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <div class="flex-1">
            <BaseInput v-model="userSearch" placeholder="Rechercher un utilisateur (pseudo, riot, discord)...">
              <template #icon><Users :size="18" /></template>
            </BaseInput>
          </div>
          <div class="w-full md:w-48">
            <BaseSelect v-model="roleFilter" :options="roleOptions" />
          </div>
          <div class="w-full md:w-64">
            <BaseSelect v-model="statusFilter" :options="statusOptions" />
          </div>
        </div>

        <div v-if="filteredUsers.length === 0" class="text-center text-text-muted py-10 text-sm">
          Aucun utilisateur trouvé.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-text-muted text-left">
                <th class="px-5 py-3">Utilisateur</th>
                <th class="px-5 py-3 hidden lg:table-cell">Rôle</th>
                <th class="px-5 py-3 text-center">Rank</th>
                <th class="px-5 py-3 text-center">Statut</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in filteredUsers"
                :key="u.id"
                class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                :class="{ 'opacity-50': u.role === 'admin' && !isSuperAdmin }"
              >
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <BaseAvatar :src="u.avatar_url || undefined" :name="u.username" size="sm" />
                    <div>
                      <RouterLink
                        :to="`/profile/${u.id}`"
                        class="font-bold text-text-primary hover:text-gold transition-colors"
                      >
                        {{ u.username }}
                      </RouterLink>
                      <div class="text-xs text-text-muted">{{ u.riot_id || 'Riot ID non lié' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3 hidden lg:table-cell">
                  <BaseBadge
                    :variant="u.role === 'superadmin' ? 'danger' : u.role === 'admin' ? 'cyan' : 'muted'"
                    size="sm"
                  >
                     {{ u.role }}
                  </BaseBadge>
                </td>
                <td class="px-5 py-3 text-center">
                  <RankBadge :rank="u.rank" :lp="u.lp" />
                </td>
                <td class="px-5 py-3">
                  <div class="flex flex-wrap justify-center gap-1.5">
                    <BaseBadge v-if="u.is_captain" variant="cyan" size="sm">Capitaine</BaseBadge>
                    <BaseBadge v-if="u.is_looking_for_team" variant="success" size="sm">Agent libre</BaseBadge>
                    <BaseBadge v-if="u.is_caster" variant="purple" size="sm">
                      <template #icon><Mic :size="10" /></template>
                      Caster
                    </BaseBadge>
                    <span v-if="!u.is_captain && !u.is_looking_for_team && !u.is_caster" class="text-text-muted">-</span>
                  </div>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click="openRoleModal(u)"
                      :disabled="u.role === 'superadmin' && authStore.profile?.id !== u.id && !isSuperAdmin"
                    >
                      <template #icon><UserCog :size="14" /></template>
                    </BaseButton>
                    <BaseButton
                      v-if="isSuperAdmin"
                      variant="ghost"
                      size="sm"
                      class="text-danger hover:bg-danger/10"
                      @click="confirmDeleteUser(u)"
                      :disabled="u.id === authStore.user?.id"
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

    <!-- Teams Section -->
    <div v-else-if="activeSection === 'teams'" class="space-y-6">
      <BaseCard :hoverable="false">
        <div class="mb-6">
          <BaseInput v-model="teamSearch" placeholder="Rechercher une équipe (nom, tag)...">
            <template #icon><Shield :size="18" /></template>
          </BaseInput>
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
                <th class="px-5 py-3 text-center">Elo Moyen</th>
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
                <td class="px-5 py-3 text-center">
                  <RankBadge v-if="t.average_rank" :rank="t.average_rank" />
                  <span v-else class="text-text-muted">-</span>
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
                      <template #icon><Users :size="14" /></template>
                    </BaseButton>
                    <BaseButton
                      v-if="isSuperAdmin"
                      variant="ghost"
                      size="sm"
                      class="text-danger hover:bg-danger/10"
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

    <!-- Role Modal -->
    <BaseModal v-model="showRoleModal" title="Gérer l'utilisateur" size="sm">
      <div v-if="selectedUser" class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
          <BaseAvatar :src="selectedUser.avatar_url || undefined" :name="selectedUser.username" size="md" />
          <div>
            <div class="font-bold text-text-primary">{{ selectedUser.username }}</div>
            <div class="text-xs text-text-muted">{{ selectedUser.riot_id || 'Riot ID non lié' }}</div>
          </div>
        </div>

        <div class="space-y-4">
          <div v-if="isSuperAdmin">
            <label class="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">Rôle Système</label>
            <BaseSelect v-model="newRole" :options="roleOptions" />
          </div>

          <div>
            <label class="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">Statut Joueur</label>
            <BaseSelect v-model="newStatus" :options="[
              { value: 'none', label: 'Aucun' },
              { value: 'captain', label: 'Capitaine' },
              { value: 'lft', label: 'Agent libre' }
            ]" />
          </div>

          <div>
            <label class="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">Caster</label>
            <BaseSelect v-model="isCaster" :options="[
              { value: 'no', label: 'Non' },
              { value: 'yes', label: 'Oui' }
            ]" />
          </div>
        </div>

        <div class="pt-4 flex gap-2">
          <BaseButton variant="secondary" class="flex-1" @click="showRoleModal = false">Annuler</BaseButton>
          <BaseButton variant="primary" class="flex-1" :loading="changingRole" @click="changeRole">Enregistrer</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Confirm Dialogs -->
    <ConfirmDialog
      v-model="showDeleteUserConfirm"
      title="Supprimer le compte ?"
      :message="`Voulez-vous vraiment supprimer définitivement le compte de ${selectedUser?.username} ? Cette action est irréversible.`"
      confirm-label="Supprimer"
      variant="danger"
      :loading="deletingUser"
      @confirm="deleteUser"
    />

    <ConfirmDialog
      v-model="showDeleteTeamConfirm"
      title="Dissoudre l'équipe ?"
      :message="`Voulez-vous vraiment dissoudre l'équipe ${selectedTeam?.name} ?`"
      confirm-label="Dissoudre"
      variant="danger"
      :loading="deletingTeam"
      @confirm="deleteTeam"
    />

    <!-- Manage Members Modal -->
    <BaseModal v-model="showMembersModal" :title="`Membres : ${managedTeam?.name}`" size="md">
      <div v-if="managedTeam" class="space-y-6">
        <div>
          <h3 class="text-sm font-bold text-text-primary mb-3 flex justify-between items-center">
            Membres Actuels
            <span class="text-xs text-text-muted font-normal">{{ managedTeam.members?.length || 0 }}/6</span>
          </h3>
          <div class="space-y-2">
            <div v-for="m in managedTeam.members" :key="m.profile_id" class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div class="flex items-center gap-3">
                <BaseAvatar :src="m.profile?.avatar_url || undefined" :name="m.profile?.username" size="sm" />
                <div>
                  <div class="text-sm font-bold text-text-primary">{{ m.profile?.username }}</div>
                  <div class="text-[10px] text-text-muted uppercase font-bold tracking-widest">{{ m.role }}</div>
                </div>
              </div>
              <BaseButton
                v-if="m.role !== 'Captain'"
                variant="ghost"
                size="sm"
                class="text-danger hover:bg-danger/10"
                @click="removeMember(m.profile_id)"
                :loading="removingMemberId === m.profile_id"
              >
                <template #icon><UserMinus :size="14" /></template>
              </BaseButton>
            </div>
          </div>
        </div>

        <div v-if="(managedTeam.members?.length || 0) < 6" class="border-t border-border pt-6">
          <h3 class="text-sm font-bold text-text-primary mb-3">Ajouter un membre</h3>
          <BaseInput v-model="addPlayerSearch" placeholder="Rechercher un joueur par pseudo...">
            <template #icon><UserPlus :size="16" /></template>
          </BaseInput>

          <div v-if="addPlayerResults.length > 0" class="mt-4 space-y-1 max-h-48 overflow-y-auto pr-1">
            <div v-for="u in addPlayerResults" :key="u.id" class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
              <div class="flex items-center gap-2">
                <BaseAvatar :src="u.avatar_url || undefined" :name="u.username" size="sm" />
                <div class="text-sm font-semibold text-text-primary">{{ u.username }}</div>
              </div>
              <BaseButton
                variant="secondary"
                size="sm"
                @click="addMember(u.id)"
                :loading="addingPlayerId === u.id"
              >
                <template #icon><UserPlus :size="14" /></template>
                Ajouter
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Trash2, Eye, Users, Shield, UserCog, UserPlus, UserMinus, Mic } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { Profile, Team } from '../types'
import PageHeader from '../components/layout/PageHeader.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import RankBadge from '../components/domain/RankBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseAvatar from '../components/ui/BaseAvatar.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseSpinner from '../components/ui/BaseSpinner.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import BaseTabs from '../components/ui/BaseTabs.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const users = ref<Profile[]>([])
const teams = ref<Team[]>([])
const tournaments = ref<any[]>([])
const loading = ref(true)
const activeSection = ref<'users' | 'teams'>('users')

const userSearch = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const teamSearch = ref('')

const showRoleModal = ref(false)
const selectedUser = ref<Profile | null>(null)
const newRole = ref('user')
const newStatus = ref<'none' | 'captain' | 'lft'>('none')
const isCaster = ref('no')
const changingRole = ref(false)

const showDeleteUserConfirm = ref(false)
const deletingUser = ref(false)

const showDeleteTeamConfirm = ref(false)
const selectedTeam = ref<Team | null>(null)
const deletingTeam = ref(false)

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
  let result = [...users.value]
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
  result.sort((a, b) => a.username.localeCompare(b.username))
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
    const [uResult, teResult, toResult] = await Promise.allSettled([
      api.get('/profiles', token),
      api.get('/teams'),
      api.get('/tournaments'),
    ])

    if (uResult.status === 'fulfilled') {
      users.value = uResult.value
    } else {
      console.error('Erreur chargement utilisateurs:', uResult.reason)
      notificationStore.show('Erreur chargement utilisateurs', 'error')
    }

    if (teResult.status === 'fulfilled') {
      teams.value = teResult.value
    } else {
      console.error('Erreur chargement équipes:', teResult.reason)
      notificationStore.show('Erreur chargement équipes', 'error')
    }

    if (toResult.status === 'fulfilled') {
      tournaments.value = toResult.value
    } else {
      console.error('Erreur chargement tournois:', toResult.reason)
      notificationStore.show('Erreur chargement tournois', 'error')
    }
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur chargement', 'error')
  } finally {
    loading.value = false
  }
}

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
    if (newRole.value !== selectedUser.value.role) {
      promises.push(api.patch(`/profiles/${selectedUser.value.id}/role`, { role: newRole.value }, token))
    }
    const isCaptain = newStatus.value === 'captain'
    const isLFT = newStatus.value === 'lft'
    const newIsCaster = isCaster.value === 'yes'
    if (isCaptain !== selectedUser.value.is_captain || isLFT !== selectedUser.value.is_looking_for_team || newIsCaster !== selectedUser.value.is_caster) {
      promises.push(api.patch(`/profiles/${selectedUser.value.id}/status`, {
        is_captain: isCaptain,
        is_looking_for_team: isLFT,
        is_caster: newIsCaster
      }, token))
    }
    if (promises.length > 0) {
      await Promise.all(promises)
      notificationStore.show('Utilisateur mis à jour', 'success')
      await fetchAll()
    }
    showRoleModal.value = false
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur mise à jour', 'error')
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
    notificationStore.show('Utilisateur supprimé', 'success')
    showDeleteUserConfirm.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur suppression', 'error')
  } finally {
    deletingUser.value = false
  }
}

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
    notificationStore.show('Équipe dissoute', 'success')
    showDeleteTeamConfirm.value = false
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur suppression', 'error')
  } finally {
    deletingTeam.value = false
  }
}

async function openManageMembers(team: any) {
  try {
    const data = await api.get(`/teams/${team.id}`)
    managedTeam.value = data
    addPlayerSearch.value = ''
    showMembersModal.value = true
  } catch (e: any) {
    notificationStore.show('Erreur chargement équipe', 'error')
  }
}

async function addMember(profileId: string) {
  if (!managedTeam.value) return
  addingPlayerId.value = profileId
  try {
    const token = await getToken()
    await api.post(`/teams/${managedTeam.value.id}/members`, { profile_id: profileId }, token)
    notificationStore.show('Joueur ajouté', 'success')
    const data = await api.get(`/teams/${managedTeam.value.id}`)
    managedTeam.value = data
    addPlayerSearch.value = ''
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur ajout', 'error')
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
    notificationStore.show('Joueur retiré', 'success')
    const data = await api.get(`/teams/${managedTeam.value.id}`)
    managedTeam.value = data
    await fetchAll()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur retrait', 'error')
  } finally {
    removingMemberId.value = null
  }
}
</script>
