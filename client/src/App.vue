<script setup>
import { onMounted, ref, computed } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import BaseToast from '@/components/common/BaseToast.vue'
import BaseLoader from '@/components/common/BaseLoader.vue'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next'
import api from '@/services/api'
import MuzzamilBot from '@/components/common/MuzzamilBot.vue'
import { useRoute } from 'vue-router'

const auth     = useAuthStore()
const router2  = useRouter()
const navLoading = ref(false)
router2.beforeEach(() => { navLoading.value = true })
router2.afterEach(()  => { setTimeout(() => { navLoading.value = false }, 120) })
const ui   = useUiStore()
const route = useRoute()
const crispActive = ref(false)

// Hide Muzzamil on admin pages, in the course player, or when Crisp is configured
const showBot = computed(() =>
  !crispActive.value && !route.path.startsWith('/admin') && !route.path.includes('/learn'))

onMounted(async () => {
  // Note: auth.fetchMe() is handled by the router beforeEach guard (once per session)
  // Load Crisp chat widget if website ID is set in admin Settings
  try {
    const { data } = await api.get('/settings/public')
    const settings = data.data || {}
    const crispId = settings.crisp_website_id
    if (crispId && crispId.trim()) {
      crispActive.value = true
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
  <!-- Navigation progress bar — prevents perceived blank during route change -->
  <div v-if="navLoading" class="nav-progress" />
  <RouterView v-slot="{ Component, route: r }">
      <!--
        BLANK PAGE FIX:
        mode="out-in" caused a blank gap — old page leaves (250ms) then
        new page enters (250ms) = 500ms of nothing visible.
        Removing mode lets old and new overlap (concurrent), no blank gap.
        :key forces remount when route changes so onMounted always fires.
      -->
      <Transition name="page">
        <component :is="Component" :key="r.fullPath" />
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
