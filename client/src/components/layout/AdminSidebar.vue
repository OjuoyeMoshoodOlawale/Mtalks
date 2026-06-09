<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import {
  LayoutDashboard, BookOpen, Calendar, Users, CreditCard,
  BarChart3, UserCheck, Star, HelpCircle, Settings, Bug, X, LogOut, MessageSquare
} from 'lucide-vue-next'

const props = defineProps({ open: Boolean })
const emit  = defineEmits(['close'])
const route = useRoute()
const auth  = useAuthStore()

/* Unread messages badge — polls every 60s */
const unreadMessages = ref(0)
let pollTimer = null
const fetchUnread = async () => {
  try {
    const { data } = await api.get('/contacts/unread-count')
    unreadMessages.value = data.data?.count || 0
  } catch { /* silent */ }
}
onMounted(() => { fetchUnread(); pollTimer = setInterval(fetchUnread, 60000) })
onUnmounted(() => clearInterval(pollTimer))

const nav = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',    exact: true },
  { to: '/admin/courses',       icon: BookOpen,         label: 'Courses' },
  { to: '/admin/events',        icon: Calendar,         label: 'Events' },
  { to: '/admin/users',         icon: Users,            label: 'Users' },
  { to: '/admin/payments',      icon: CreditCard,       label: 'Payments' },
  { to: '/admin/analytics',     icon: BarChart3,        label: 'Analytics' },
  { to: '/admin/team',          icon: UserCheck,        label: 'Team' },
  { to: '/admin/testimonials',  icon: Star,             label: 'Testimonials' },
  { to: '/admin/faqs',          icon: HelpCircle,       label: 'FAQs' },
  { to: '/admin/settings',      icon: Settings,   label: 'Settings' },
  { to: '/admin/messages',      icon: MessageSquare, label: 'Messages', badge: true },
  { to: '/admin/logs',          icon: Bug,        label: 'Error Logs' },
]

const isActive = (item) => item.exact ? route.path === item.to : route.path.startsWith(item.to)
</script>

<template>
  <aside :class="['admin-sidebar', { 'admin-sidebar--open': open }]">
    <div class="sidebar-brand">
      <RouterLink to="/" class="brand-link">
        <span class="brand-icon">M</span>
        <span class="brand-name">Muhsinah</span>
      </RouterLink>
      <button @click="emit('close')" class="sidebar-close hide-desktop" aria-label="Close sidebar"><X :size="20" /></button>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in nav" :key="item.to" :to="item.to"
        :class="['nav-item', { 'nav-item--active': isActive(item) }]"
        @click="emit('close')"
      >
        <component :is="item.icon" :size="20" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <span v-if="item.badge && unreadMessages > 0" class="nav-badge">{{ unreadMessages > 99 ? '99+' : unreadMessages }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="admin-user">
        <div class="admin-avatar">{{ auth.user?.name?.[0] }}</div>
        <div>
          <p style="font-weight:600;font-size:.85rem">{{ auth.user?.name }}</p>
          <p style="font-size:.75rem;opacity:.65">Administrator</p>
        </div>
      </div>
      <button @click="auth.logout();$router.push('/')" class="logout-btn" aria-label="Sign out">
        <LogOut :size="18" />
      </button>
    </div>
  </aside>
  <!-- Backdrop -->
  <div v-if="open" class="sidebar-backdrop hide-desktop" @click="emit('close')" />
</template>

<style scoped>
.admin-sidebar{width:240px;background:var(--ma-green-dark);display:flex;flex-direction:column;height:100vh;position:sticky;top:0;flex-shrink:0}
@media(max-width:768px){
  .admin-sidebar{position:fixed;left:-260px;top:0;bottom:0;z-index:200;transition:left var(--trans-base);width:260px}
  .admin-sidebar--open{left:0}
}
.sidebar-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:199}
.sidebar-brand{display:flex;align-items:center;justify-content:space-between;padding:20px 16px;border-bottom:1px solid rgba(255,255,255,.1)}
.brand-link{display:flex;align-items:center;gap:10px;text-decoration:none}
.brand-icon{width:36px;height:36px;background:var(--ma-green);color:var(--ma-green-dark);font-family:var(--font-heading);font-weight:700;font-size:1.2rem;display:flex;align-items:center;justify-content:center;border-radius:8px}
.brand-name{font-family:var(--font-heading);color:var(--ma-white);font-size:1.05rem}
.sidebar-close{color:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:6px}
.sidebar-close:hover{background:rgba(255,255,255,.1)}
.sidebar-nav{flex:1;overflow-y:auto;padding:12px 8px;display:flex;flex-direction:column;gap:2px}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:rgba(255,255,255,.65);font-size:.875rem;font-weight:500;text-decoration:none;transition:all var(--trans-fast)}
.nav-item:hover{background:rgba(255,255,255,.08);color:var(--ma-white)}
.nav-item--active{background:rgba(118,196,66,.2);color:var(--ma-green)!important}
.sidebar-footer{padding:16px;border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:12px}
.admin-user{flex:1;display:flex;align-items:center;gap:10px;color:var(--ma-white);min-width:0}
.admin-avatar{width:36px;height:36px;background:var(--ma-green);color:var(--ma-green-dark);font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logout-btn{color:rgba(255,255,255,.5);padding:8px;border-radius:8px;display:flex;transition:all var(--trans-fast)}
.logout-btn:hover{background:rgba(255,255,255,.08);color:var(--ma-white)}
.nav-badge{margin-left:auto;background:var(--ma-gold);color:#3d2f00;font-size:.68rem;font-weight:800;padding:1px 7px;border-radius:10px;min-width:20px;text-align:center}
</style>
