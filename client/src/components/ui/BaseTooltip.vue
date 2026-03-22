<template>
  <div class="relative group inline-flex" @mouseenter="show = true" @mouseleave="show = false">
    <slot />
    <Transition name="tooltip-fade">
      <div
        v-show="show"
        class="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1f2e] border border-[#c8aa6e]/40 rounded shadow-2xl pointer-events-none whitespace-nowrap min-w-max"
      >
        <!-- Arrow -->
        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-8 border-transparent border-t-[#c8aa6e]/40" />
        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-7 border-transparent border-t-[#1a1f2e]" />
        
        <span class="text-[10px] font-black uppercase tracking-widest text-[#0ac8b9]">
          {{ content }}
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  content: string
}>()

const show = ref(false)
</script>

<style scoped>
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px) scale(0.95);
}
</style>
