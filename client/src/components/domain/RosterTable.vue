<template>
  <div class="space-y-2">
    <div
      v-for="(slot, index) in slots"
      :key="index"
      class="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200"
      :class="slot.member ? 'bg-surface border-border hover:border-border-gold' : 'bg-transparent border-dashed border-white/10'"
    >
      <!-- Position number -->
      <span class="text-xs font-bold text-text-muted w-5 text-center">{{ index + 1 }}</span>

      <template v-if="slot.member">
        <BaseAvatar :name="slot.member.profile.username" size="sm" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm text-text-primary truncate">
              {{ slot.member.profile.username }}
            </span>
            <BaseBadge v-if="slot.member.role === 'Captain'" variant="gold" size="sm">
              Capitaine
            </BaseBadge>
          </div>
          <RankBadge :rank="slot.member.profile.rank" />
        </div>

        <!-- Kick button -->
        <button
          v-if="isCaptain && !isLocked && slot.member.role !== 'Captain'"
          class="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors cursor-pointer"
          title="Renvoyer"
          @click="$emit('kick', slot.member!)"
        >
          <UserMinus :size="16" />
        </button>
      </template>

      <template v-else>
        <div class="w-8 h-8 rounded-full border border-dashed border-white/20 flex items-center justify-center">
          <UserPlus :size="14" class="text-text-muted" />
        </div>
        <span class="text-sm text-text-muted italic">Emplacement libre</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserMinus, UserPlus } from 'lucide-vue-next'
import type { TeamMember } from '../../types'
import BaseAvatar from '../ui/BaseAvatar.vue'
import BaseBadge from '../ui/BaseBadge.vue'
import RankBadge from './RankBadge.vue'

const props = withDefaults(defineProps<{
  members: TeamMember[]
  maxSlots?: number
  isCaptain?: boolean
  isLocked?: boolean
}>(), {
  maxSlots: 6,
  isCaptain: false,
  isLocked: false,
})

defineEmits<{
  kick: [member: TeamMember]
}>()

const slots = computed(() => {
  const result: Array<{ member: TeamMember | null }> = []
  for (let i = 0; i < props.maxSlots; i++) {
    result.push({ member: props.members[i] || null })
  }
  return result
})
</script>
