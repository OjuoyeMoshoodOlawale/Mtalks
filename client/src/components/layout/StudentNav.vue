<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LayoutDashboard, BookOpen, Ticket, User, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const auth  = useAuthStore()

const initials = (name) => {
  if (!name) return 'U'
  const p = name.trim().split(' ')
  return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : p[0].slice(0,2).toUpperCase()
}

const links = [
  { to: '/dashboard',          label: 'Overview',   icon: LayoutDashboard, exact: true },
  { to: '/dashboard/courses',  label: 'My Courses',  icon: BookOpen },
  { to: '/dashboard/events',   label: 'My Tickets',  icon: Ticket },
  { to: '/dashboard/profile',  label: 'Profile',     icon: User },
]

const isActive = (l) => l.exact ? route.path === l.to : route.path.startsWith(l.to)
</script>

<template>
  <nav class="student-nav">
    <div class="container student-nav__inner">
      <!-- Greeting + avatar -->
      <div class="student-nav__identity">
        <div class="s-avatar">{{ initials(auth.user?.name) }}</div>
        <span class="s-name">{{ auth.user?.name?.split(' ')[0] || 'Student' }}</span>
      </div>

      <!-- Tab links -->
      <div class="student-nav__links">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="s-link"
          :class="{ 'is-active': isActive(l) }"
        >
          <component :is="l.icon" :size="16" />
          {{ l.label }}
        </RouterLink>
      </div>

      <!-- Admin shortcut -->
      <RouterLink v-if="auth.isAdmin" to="/admin" class="s-admin-link">
        Admin Panel <ChevronRight :size="14" />
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.student-nav {
  background: var(--ma-white);
  border-bottom: 1px solid var(--ma-border);
  position: sticky;
  top: 64px;   /* sits just below PublicHeader */
  z-index: 90;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.student-nav__inner {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 0;
  padding-bottom: 0;
  height: 52px;
  overflow-x: auto;
}
/* Identity */
.student-nav__identity { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.s-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--ma-green-deep); color: #fff;
  font-family: var(--font-heading); font-size: .8rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.s-name { font-size: .82rem; font-weight: 600; color: var(--ma-text-muted); white-space: nowrap; }
/* Divider */
.student-nav__identity::after {
  content: '';
  display: block;
  width: 1px;
  height: 20px;
  background: var(--ma-border);
  margin-left: 8px;
}
/* Links */
.student-nav__links { display: flex; align-items: center; gap: 2px; flex: 1; }
.s-link {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: .83rem; font-weight: 500;
  color: var(--ma-text-muted);
  text-decoration: none;
  white-space: nowrap;
  transition: background var(--trans-fast), color var(--trans-fast);
}
.s-link:hover    { background: var(--ma-green-tint); color: var(--ma-green-deep); }
.s-link.is-active{ background: var(--ma-green);      color: var(--ma-white); font-weight: 600; }
/* Admin link */
.s-admin-link {
  display: flex; align-items: center; gap: 4px;
  margin-left: auto; flex-shrink: 0;
  font-size: .78rem; font-weight: 600;
  color: var(--ma-green-deep);
  text-decoration: none;
  padding: 4px 10px;
  border: 1px solid var(--ma-green);
  border-radius: 12px;
  transition: background var(--trans-fast);
}
.s-admin-link:hover { background: var(--ma-green-tint); }
/* Scrollbar on mobile */
.student-nav__inner::-webkit-scrollbar { display: none; }
</style>
