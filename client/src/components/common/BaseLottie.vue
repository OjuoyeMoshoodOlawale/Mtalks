<script setup>
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

defineProps({
  src:    { type: String, required: true },
  width:  { type: String, default: '180px' },
  height: { type: String, default: '180px' },
  loop:   { type: Boolean, default: true },
})
</script>

<template>
  <DotLottieVue
    :src="src"
    :autoplay="true"
    :loop="loop"
    :style="{ width, height, margin: '0 auto' }"
  />
</template>

<!--
USAGE:
1. Browse free animations at https://lottiefiles.com
2. Click an animation → "Copy asset link" → choose .lottie URL
3. Use anywhere:
   <BaseLottie src="https://lottie.host/YOUR-ID/file.lottie" width="200px" height="200px" />
Good spots: empty states, 404 page, hero sections, loading screens.
-->
