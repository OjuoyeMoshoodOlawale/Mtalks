<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Menu, X, User, LogOut } from 'lucide-vue-next'

const auth   = useAuthStore()
const route  = useRoute()
const open   = ref(false)
const scrolled = ref(false)

const links = [
  { to: '/',           label: 'Home' },
  { to: '/about',      label: 'About' },
  { to: '/services',   label: 'Services' },
  { to: '/courses',    label: 'Courses' },
  { to: '/events',     label: 'Events' },
  { to: '/team',       label: 'Team' },
  { to: '/contact',    label: 'Contact' },
]

const onScroll = () => { scrolled.value = window.scrollY > 40 }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header :class="['site-header', { 'site-header--scrolled': scrolled }]">
    <div class="container flex items-center justify-between" style="height:68px">
      <!-- Logo -->
      <RouterLink to="/" class="header-logo">
        <span class="logo-icon">M</span>
        <span class="logo-text">Muhsinah <em>Academy</em></span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="header-nav hide-mobile" aria-label="Main navigation">
        <RouterLink
          v-for="l in links" :key="l.to" :to="l.to"
          :class="['nav-link', { 'nav-link--active': route.path === l.to }]"
        >{{ l.label }}</RouterLink>
      </nav>

      <!-- CTA -->
      <div class="header-cta hide-mobile flex items-center gap-md">
        <RouterLink v-if="auth.isLoggedIn && auth.isAdmin" to="/admin" class="btn btn--sm btn--outline">Dashboard</RouterLink>
        <RouterLink v-else-if="auth.isLoggedIn" to="/dashboard" class="btn btn--sm btn--outline">My Courses</RouterLink>
        <RouterLink v-else to="/login" class="btn btn--sm btn--outline">Sign In</RouterLink>
        <RouterLink to="/consultation" class="btn btn--sm btn--primary">Book Consultation</RouterLink>
      </div>

      <!-- Mobile toggle -->
      <button class="mobile-toggle hide-desktop" @click="open = !open" :aria-label="open ? 'Close menu' : 'Open menu'">
        <X v-if="open" :size="24" /> <Menu v-else :size="24" />
      </button>
    </div>

    <!-- Mobile drawer -->
    <div v-if="open" class="mobile-drawer hide-desktop">
      <nav>
        <RouterLink
          v-for="l in links" :key="l.to" :to="l.to"
          class="mobile-link" @click="open = false"
        >{{ l.label }}</RouterLink>
      </nav>
      <div style="display:flex;flex-direction:column;gap:10px;padding:16px">
        <RouterLink to="/consultation" class="btn btn--primary w-full text-center" @click="open = false">Book Consultation</RouterLink>
        <RouterLink v-if="!auth.isLoggedIn" to="/login" class="btn btn--outline w-full text-center" @click="open = false">Sign In</RouterLink>
        <RouterLink v-else to="/dashboard" class="btn btn--outline w-full text-center" @click="open = false">My Account</RouterLink>
      </div>
    </div>
  </header>
  <div style="height:68px" />
</template>

<style scoped>
.site-header{position:fixed;top:0;left:0;right:0;z-index:var(--z-nav);background:var(--ma-green-dark);transition:box-shadow var(--trans-base)}
.site-header--scrolled{box-shadow:var(--shadow-lg)}
.header-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.logo-icon{width:38px;height:38px;background:var(--ma-green);color:var(--ma-green-dark);font-family:var(--font-heading);font-weight:700;font-size:1.3rem;display:flex;align-items:center;justify-content:center;border-radius:8px}
.logo-text{font-family:var(--font-heading);color:var(--ma-white);font-size:1.05rem}
.logo-text em{font-style:normal;color:var(--ma-green);margin-left:4px}
.header-nav{display:flex;gap:4px}
.nav-link{padding:6px 12px;border-radius:6px;color:rgba(255,255,255,.8);font-size:.9rem;transition:color var(--trans-fast),background var(--trans-fast)}
.nav-link:hover,.nav-link--active{color:var(--ma-white);background:rgba(255,255,255,.08)}
.nav-link--active{color:var(--ma-green)!important}
.mobile-toggle{color:var(--ma-white);display:flex}
.mobile-drawer{background:var(--ma-green-dark);border-top:1px solid rgba(255,255,255,.1);padding-bottom:16px}
.mobile-link{display:block;padding:12px 24px;color:rgba(255,255,255,.85);font-size:1rem;border-bottom:1px solid rgba(255,255,255,.06)}
.mobile-link:hover{background:rgba(255,255,255,.06);color:var(--ma-white)}
</style>
