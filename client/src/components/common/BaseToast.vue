<script setup>
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-vue-next'
defineProps({ message: String, type: { type: String, default: 'success' } })
const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info }
</script>
<template>
  <div :class="['toast', `toast--${type}`]" role="alert">
    <component :is="icons[type] || icons.success" :size="18" aria-hidden="true" />
    <span>{{ message }}</span>
  </div>
</template>
