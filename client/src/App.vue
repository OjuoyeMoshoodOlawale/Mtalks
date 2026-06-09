<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import BaseToast from '@/components/common/BaseToast.vue'
import BaseLoader from '@/components/common/BaseLoader.vue'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next'

const auth = useAuthStore()
const ui   = useUiStore()

onMounted(async () => {
  if (auth.accessToken) await auth.fetchMe()
})

const iconFor = (type) => ({
  success: CheckCircle, error: XCircle, warning: AlertTriangle
}[type] || CheckCircle)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>

  <!-- Toast notifications -->
  <div class="toast-stack">
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      :class="['toast', `toast--${toast.type}`]"
      role="alert"
    >
      <component :is="iconFor(toast.type)" :size="18" />
      <span>{{ toast.message }}</span>
    </div>
  </div>

  <!-- Global loading overlay -->
  <Teleport to="body">
    <div v-if="ui.loading" class="loading-overlay" aria-label="Loading">
      <div class="spinner" />
    </div>
  </Teleport>
</template>
