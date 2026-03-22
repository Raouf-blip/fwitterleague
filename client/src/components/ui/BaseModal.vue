<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="$emit('update:modelValue', false)"
        />
        <!-- Panel -->
        <Transition name="slide-up" appear>
          <div
            v-if="modelValue"
            :class="sizeClasses"
            class="relative bg-surface-elevated border border-border rounded-xl shadow-2xl z-10 max-h-[85vh] flex flex-col"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 class="text-lg font-bold text-text-primary">{{ title }}</h2>
              <button
                class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
                @click="$emit('update:modelValue', false)"
              >
                <X :size="20" />
              </button>
            </div>
            <!-- Body -->
            <div class="px-6 py-5 overflow-y-auto flex-1">
              <slot />
            </div>
            <!-- Footer -->
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-border">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClasses = computed(() => ({
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-lg',
  lg: 'w-full max-w-2xl',
}[props.size]))
</script>
