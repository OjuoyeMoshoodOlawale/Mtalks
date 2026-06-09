<script setup>
import { Loader2 } from 'lucide-vue-next'
const props = defineProps({
  variant:  { type: String, default: 'primary' },
  size:     { type: String, default: 'md' },
  loading:  Boolean,
  disabled: Boolean,
  type:     { type: String, default: 'button' }
})
</script>
<template>
  <button
    :type="type"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <Loader2 v-if="loading" :size="16" class="spin-icon" aria-hidden="true" />
    <slot />
  </button>
</template>
<style scoped>
.spin-icon { animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn--loading { opacity: .8; }
</style>
