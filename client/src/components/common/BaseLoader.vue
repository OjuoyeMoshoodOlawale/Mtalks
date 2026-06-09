<script setup>
defineProps({ fullscreen: Boolean, size: { type: String, default: 'md' } })
</script>
<template>
  <div v-if="fullscreen" class="loading-overlay" role="status" aria-label="Loading">
    <div class="spinner" />
  </div>
  <div v-else :class="['inline-loader', `inline-loader--${size}`]" role="status" aria-label="Loading">
    <div class="spinner" :style="{ width: size === 'sm' ? '24px' : '40px', height: size === 'sm' ? '24px' : '40px' }" />
  </div>
</template>
<style scoped>
.inline-loader { display:flex; justify-content:center; padding:24px; }
</style>
