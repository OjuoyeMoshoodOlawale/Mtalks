<script setup>
import BaseModal  from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  title:       { type: String, default: 'Confirm action' },
  message:     String,
  confirmText: { type: String, default: 'Confirm' },
  cancelText:  { type: String, default: 'Cancel' },
  danger:      Boolean,
  loading:     Boolean
})
const emit = defineEmits(['confirm', 'cancel'])
</script>
<template>
  <BaseModal :title="title" size="sm" @close="emit('cancel')">
    <div style="display:flex;gap:16px;align-items:flex-start">
      <AlertTriangle :size="24" :color="danger ? '#D32F2F' : '#F0C130'" />
      <p style="line-height:1.6">{{ message }}</p>
    </div>
    <template #footer>
      <BaseButton variant="outline" @click="emit('cancel')">{{ cancelText }}</BaseButton>
      <BaseButton
        :variant="danger ? 'primary' : 'primary'"
        :loading="loading"
        @click="emit('confirm')"
        :style="danger ? 'background:#D32F2F' : ''"
      >{{ confirmText }}</BaseButton>
    </template>
  </BaseModal>
</template>
