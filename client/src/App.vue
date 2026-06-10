<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import BaseToast from '@/components/common/BaseToast.vue'
import BaseLoader from '@/components/common/BaseLoader.vue'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next'
import api from '@/services/api'
import MuzzamilBot from '@/components/common/MuzzamilBot.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const auth = useAuthStore()
const ui   = useUiStore()
const route = useRoute()

// Hide Muzzamil on admin pages and in the course player
const showBot = computed(() =>
  !route.path.startsWith('/admin') && !route.path.includes('/learn'))

onMounted(async () => {
  if (auth.accessToken) await auth.fetchMe()

  // Load Crisp chat widget if website ID is set in admin Settings
  try {
    const { data } = await api.get('/settings/public')
    const raw = Array.isArray(data.data) ? data.data : []
    const settings = Object.fromEntries(raw.map(s => [s.key, s.value]))
    const crispId = settings.crisp_website_id
    if (crispId && crispId.trim()) {
      window.$crisp = []
      window.CRISP_WEBSITE_ID = crispId.trim()
      const s = document.createElement('script')
      s.src = 'https://client.crisp.chat/l.js'
      s.async = true
      document.head.appendChild(s)
    }
  } catch {
    // Crisp is optional — silently skip if settings endpoint fails
  }
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

  <!-- Muzzamil assistant -->
  <MuzzamilBot v-if="showBot" />

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
