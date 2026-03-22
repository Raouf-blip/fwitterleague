<template>
  <div class="space-y-2">
    <label v-if="label" class="text-xs font-black uppercase tracking-widest text-text-muted">
      {{ label }}
    </label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="role in LOL_ROLES"
        :key="role.key"
        type="button"
        @click="toggleRole(role.key)"
        class="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all duration-200 min-w-[64px] cursor-pointer"
        :class="[
          modelValue?.includes(role.key)
            ? 'bg-cyan/10 border-cyan text-cyan shadow-[0_0_10px_-5px_rgba(0,188,212,0.5)]'
            : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
        ]"
      >
        <LolRoleIcon :role="role.key" :size="20" />
        <span class="text-[10px] font-black uppercase tracking-tighter">{{ role.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LOL_ROLES } from '../../lib/constants'
import LolRoleIcon from '../icons/LolRoleIcon.vue'

const props = defineProps<{
  modelValue?: string[]
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

function toggleRole(key: string) {
  const current = [...(props.modelValue || [])]
  const index = current.indexOf(key)

  if (index === -1) {
    if (current.length < 2) {
      current.push(key)
    } else {
      current[0] = current[1]
      current[1] = key
    }
  } else {
    current.splice(index, 1)
  }

  emit('update:modelValue', current)
}
</script>
