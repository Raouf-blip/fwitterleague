<template>
  <div>
    <PageHeader title="Administration" subtitle="Gestion des utilisateurs et de la plateforme." />

    <!-- Stats Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-surface border border-border rounded-xl p-4 text-center">
        <div class="text-2xl font-extrabold" :class="stat.color">{{ stat.value }}</div>
        <div class="text-xs text-text-muted mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Users Section -->
    <BaseCard :hoverable="false" class="!p-0 overflow-hidden">
      <div class="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-text-primary">Utilisateurs</h2>
        <div class="flex items-center gap-3">
          <BaseInput
            v-model="search"
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

      <BaseSpinner v-if="loading" class="py-10" />

      <div v-else-if="filteredUsers.length === 0" class="text-center text-text-muted py-10 text-sm">
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
                    <div class="text-xs text-text-muted">
                      {{ user.is_captain ? 'Capitaine' : user.is_looking_for_team ? 'Agent libre' : 'Joueur' }}
                    </div>
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
              <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-2">
                  <BaseButton
                    v-if="isSuperAdmin && user.id !== authStore.user?.id"
                    variant="ghost"
                    size="sm"
                    @click="openRoleModal(user)"
                  >
                    <template #icon><ShieldCheck :size="14" /></template>
                    Role
                  </BaseButton>
                  <BaseButton
                    v-if="isSuperAdmin && user.id !== authStore.user?.id"
                    variant="danger"
                    size="sm"
                    @click="confirmDelete(user)"
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

    <!-- Delete Confirm -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Supprimer cet utilisateur ?"
      :message="`Voulez-vous vraiment supprimer le compte de ${selectedUser?.username} ? Cette action est irreversible.`"
      confirm-label="Supprimer"
      variant="danger"
      :loading="deleting"
      @confirm="deleteUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShieldCheck, Trash2 } from 'lucide-vue-next'
import { api } from '../lib/api'
import { getToken } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import type { Profile } from '../types'
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
const loading = ref(true)
const search = ref('')
const roleFilter = ref('')
const showRoleModal = ref(false)
const showDeleteConfirm = ref(false)
const selectedUser = ref<Profile | null>(null)
const newRole = ref('user')
const changingRole = ref(false)
const deleting = ref(false)

const isSuperAdmin = computed(() => authStore.profile?.role === 'superadmin')

const roleOptions = [
  { value: '', label: 'Tous' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
]

const stats = computed(() => {
  const total = users.value.length
  const admins = users.value.filter(u => u.role === 'admin' || u.role === 'superadmin').length
  const captains = users.value.filter(u => u.is_captain).length
  const agents = users.value.filter(u => u.is_looking_for_team).length
  return [
    { label: 'Utilisateurs', value: total, color: 'text-text-primary' },
    { label: 'Admins', value: admins, color: 'text-gold' },
    { label: 'Capitaines', value: captains, color: 'text-cyan' },
    { label: 'Agents libres', value: agents, color: 'text-success' },
  ]
})

const filteredUsers = computed(() => {
  let result = users.value
  if (search.value) {
    const q = search.value.toLowerCase()
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

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  try {
    const token = await getToken()
    users.value = await api.get('/profiles', token)
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur chargement utilisateurs', 'error')
  }
  loading.value = false
}

function openRoleModal(user: Profile) {
  selectedUser.value = user
  newRole.value = user.role
  showRoleModal.value = true
}

function confirmDelete(user: Profile) {
  selectedUser.value = user
  showDeleteConfirm.value = true
}

async function changeRole() {
  if (!selectedUser.value) return
  changingRole.value = true
  try {
    const token = await getToken()
    await api.patch(`/profiles/${selectedUser.value.id}/role`, { role: newRole.value }, token)
    notificationStore.show(`Role de ${selectedUser.value.username} mis a jour`, 'success')
    showRoleModal.value = false
    await fetchUsers()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur changement de role', 'error')
  } finally {
    changingRole.value = false
  }
}

async function deleteUser() {
  if (!selectedUser.value) return
  deleting.value = true
  try {
    const token = await getToken()
    await api.delete(`/profiles/${selectedUser.value.id}`, token)
    notificationStore.show(`Compte de ${selectedUser.value.username} supprime`, 'success')
    showDeleteConfirm.value = false
    await fetchUsers()
  } catch (e: any) {
    notificationStore.show(e.message || 'Erreur suppression', 'error')
  } finally {
    deleting.value = false
  }
}
</script>
