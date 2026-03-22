<template>
  <img
    :src="roleImage"
    :alt="role"
    :width="size"
    :height="size"
    class="inline-block object-contain"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import topImg from '../../assets/roles/top.png'
import jungleImg from '../../assets/roles/jungle.png'
import midImg from '../../assets/roles/mid.png'
import adcImg from '../../assets/roles/adc.png'
import supportImg from '../../assets/roles/support.png'

const props = withDefaults(defineProps<{
  role: string
  size?: number
}>(), {
  size: 16,
})

const images: Record<string, string> = {
  Top: topImg,
  Jungle: jungleImg,
  Mid: midImg,
  ADC: adcImg,
  Support: supportImg,
}

const roleImage = computed(() => images[props.role] || midImg)
</script>
