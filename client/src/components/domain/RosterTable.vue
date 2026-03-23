<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(slot, index) in slots"
      :key="index"
      class="flex items-center justify-between p-3 rounded-xl border transition-all duration-300 relative group"
      :class="slot.member ? 'bg-surface border-border hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5' : 'bg-transparent border-dashed border-white/10 opacity-70 hover:opacity-100'"
    >
      <!-- LEFT SLOT INFO -->
      <div class="flex items-center justify-center w-8 shrink-0 mr-2 border-r border-white/5 pr-4 h-full">
        <span class="text-[10px] text-text-muted font-black tracking-widest text-center">
          {{ index + 1 }}
        </span>
      </div>

      <template v-if="slot.member">
        <div class="flex items-center gap-4 flex-1 min-w-0 pr-4">
          <div class="relative shrink-0">
            <BaseAvatar :name="slot.member.profile.username" :src="slot.member.profile.avatar_url ?? undefined" size="md" />
            <div
              v-if="slot.member.role === 'Captain'"
              class="absolute -bottom-1 -right-1 bg-gold text-surface p-0.5 rounded-full shadow-md tooltip-trigger"
              title="Capitaine"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
          
          <div class="flex flex-col min-w-0">
            <RouterLink
              :to="`/profile/${slot.member.profile.id}`"
              class="font-black text-base text-text-primary truncate hover:text-gold transition-colors block leading-tight mb-1"
            >
              {{ slot.member.profile.username }}
            </RouterLink>
            
            <div class="flex flex-wrap items-center gap-2">
              <RankBadge :rank="slot.member.profile.rank" :lp="slot.member.profile.lp" />
              <div v-if="slot.member.profile.preferred_roles?.length" class="flex items-center gap-1.5 border-l border-white/10 pl-2">
                <BaseTooltip
                  v-for="role in slot.member.profile.preferred_roles"
                  :key="role"
                  :content="role"
                >
                  <div class="flex items-center justify-center">
                    <LolRoleIcon :role="role" :size="14" class="text-cyan drop-shadow-md" />
                  </div>
                </BaseTooltip>
              </div>
              <div v-if="slot.member.profile.winrate" class="flex items-center gap-1 text-xs text-text-muted border-l border-white/10 pl-2">
                <TrendingUp :size="12" class="text-cyan" />
                <span><strong class="text-text-primary">{{ slot.member.profile.winrate }}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0">
          <RouterLink
            :to="`/profile/${slot.member.profile.id}`"
            class="p-2 text-text-secondary hover:text-cyan hover:bg-cyan/10 rounded-lg transition-colors flex items-center justify-center"
            title="Voir profil"
          >
            <Eye :size="16" />
          </RouterLink>
          
          <button
            v-if="isCaptain && !isLocked && slot.member.role !== 'Captain'"
            class="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            title="Renvoyer ce joueur"
            @click="$emit('kick', slot.member!)"
          >
            <UserMinus :size="16" />
          </button>
        </div>
      </template>

      <!-- EMPTY SLOT -->
      <template v-else>
        <div class="flex items-center gap-4 flex-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <div class="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center bg-white/5 text-text-muted group-hover:border-cyan/50 group-hover:text-cyan transition-colors">
            <UserPlus :size="18" />
          </div>
          <div>
            <span class="block text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">Emplacement libre</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserMinus, UserPlus, Eye, TrendingUp } from 'lucide-vue-next'
import type { TeamMember } from '../../types'
import BaseAvatar from '../ui/BaseAvatar.vue'
import BaseTooltip from '../ui/BaseTooltip.vue'
import RankBadge from './RankBadge.vue'
import LolRoleIcon from '../icons/LolRoleIcon.vue'

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
