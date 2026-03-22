<template>
  <div
    :class="[
      'flex items-start gap-3 p-4 rounded-lg border transition-all duration-200',
      isUnread
        ? 'bg-cyan-muted/30 border-l-4 border-l-cyan border-t-border border-r-border border-b-border'
        : 'bg-surface border-border',
    ]"
  >
    <!-- Icon -->
    <div
      :class="[
        'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
        item.type === 'offer' ? 'bg-gold-muted text-gold' : item.type === 'application' ? 'bg-cyan-muted text-cyan' : 'bg-white/5 text-text-muted',
      ]"
    >
      <UserPlus v-if="item.type === 'offer'" :size="16" />
      <Send v-else-if="item.type === 'application'" :size="16" />
      <Bell v-else :size="16" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <strong class="text-sm text-text-primary">
          {{ item.title || defaultTitle }}
        </strong>
        <BaseBadge v-if="item.status" :variant="statusVariant" size="sm">
          {{ statusLabel }}
        </BaseBadge>
      </div>
      <p v-if="item.message" class="text-sm text-text-secondary mt-1 line-clamp-2">{{ item.message }}</p>

      <!-- Sender / Team info -->
      <div v-if="item.sender && item.type === 'application' && direction === 'inbox'" class="text-xs text-text-muted mt-1.5">
        Candidat : <strong class="text-text-secondary">{{ item.sender.username }}</strong>
        <span v-if="item.sender.rank"> ({{ item.sender.rank }})</span>
      </div>
      <div v-if="item.team && item.type === 'offer' && direction === 'inbox'" class="text-xs text-text-muted mt-1.5">
        Équipe : <strong class="text-text-secondary">{{ item.team.name }} [{{ item.team.tag }}]</strong>
      </div>
      <div v-if="item.team && item.type === 'application' && direction === 'outbox'" class="text-xs text-text-muted mt-1.5">
        Vers : <strong class="text-text-secondary">{{ item.team.name }}</strong>
      </div>
      <div v-if="item.sender && item.type === 'offer' && direction === 'outbox'" class="text-xs text-text-muted mt-1.5">
        Joueur invité : <strong class="text-text-secondary">{{ item.sender.username }}</strong>
      </div>

      <span class="text-[11px] text-text-muted block mt-2">{{ formatRelativeTime(item.created_at) }}</span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 shrink-0">
      <template v-if="item.status === 'pending' && direction === 'inbox'">
        <BaseButton variant="primary" size="sm" @click="$emit('accept', item)">Accepter</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="$emit('reject', item)">Refuser</BaseButton>
      </template>
      <template v-else-if="!item.status && !item.is_read">
        <BaseButton variant="ghost" size="sm" @click="$emit('markRead', item)">
          <template #icon><Check :size="14" /></template>
          Lu
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserPlus, Send, Bell, Check } from 'lucide-vue-next'
import { formatRelativeTime } from '../../lib/formatters'
import { STATUS_MAP } from '../../lib/constants'
import BaseBadge from '../ui/BaseBadge.vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps<{
  item: any
  direction: 'inbox' | 'outbox'
}>()

defineEmits<{
  accept: [item: any]
  reject: [item: any]
  markRead: [item: any]
}>()

const isUnread = computed(() => {
  if (props.item.is_read === false) return true
  if (props.item.status === 'pending' && props.direction === 'inbox') return true
  return false
})

const defaultTitle = computed(() => {
  if (props.item.type === 'offer') return 'Invitation de recrutement'
  if (props.item.type === 'application') return 'Candidature'
  return 'Notification'
})

const statusConfig = computed(() => {
  if (!props.item.status) return null
  return STATUS_MAP[props.item.status as keyof typeof STATUS_MAP]
})
const statusLabel = computed(() => statusConfig.value?.label || props.item.status)
const statusVariant = computed(() => (statusConfig.value?.color || 'muted') as 'warning' | 'success' | 'danger' | 'muted')
</script>
