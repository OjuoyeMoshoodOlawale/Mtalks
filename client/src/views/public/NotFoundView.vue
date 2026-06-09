<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import { Home, ArrowLeft, BookOpen, Calendar } from 'lucide-vue-next'

const router = useRouter()
const auth   = useAuthStore()
</script>

<template>
  <div class="not-found-page">
    <PublicHeader />

    <main class="not-found-main">
      <div class="nf-container">
        <!-- Big 404 -->
        <div class="nf-number">404</div>

        <div class="nf-leaf nf-leaf--1">🌿</div>
        <div class="nf-leaf nf-leaf--2">🍃</div>

        <h1 class="nf-title">Page Not Found</h1>
        <p class="nf-subtitle">
          This page doesn't exist or may have been moved.<br>
          Let's get you back on track.
        </p>

        <div class="nf-actions">
          <button class="btn btn--outline" @click="router.back()">
            <ArrowLeft :size="16" /> Go Back
          </button>
          <RouterLink to="/" class="btn btn--primary">
            <Home :size="16" /> Home
          </RouterLink>
          <RouterLink v-if="auth.isLoggedIn" to="/dashboard" class="btn btn--outline">
            <BookOpen :size="16" /> My Courses
          </RouterLink>
          <RouterLink to="/courses" class="btn btn--outline">
            <Calendar :size="16" /> Browse Courses
          </RouterLink>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<style scoped>
.not-found-page { background: var(--ma-off-white); min-height: 100vh; display: flex; flex-direction: column; }
.not-found-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 60px 24px; }
.nf-container   { text-align: center; position: relative; max-width: 500px; }
.nf-number      { font-family: var(--font-heading); font-size: clamp(6rem, 20vw, 10rem); font-weight: 700; color: var(--ma-green-tint); line-height: 1; margin-bottom: -16px; user-select: none; }
.nf-leaf        { position: absolute; font-size: 2rem; opacity: .6; animation: float 4s ease-in-out infinite; }
.nf-leaf--1     { top: 10px; left: 20px; animation-delay: 0s; }
.nf-leaf--2     { top: 30px; right: 10px; animation-delay: 1.5s; }
@keyframes float { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-10px) rotate(5deg)} }
.nf-title    { font-family: var(--font-heading); font-size: 1.9rem; color: var(--ma-green-dark); margin-bottom: 12px; }
.nf-subtitle { color: var(--ma-text-muted); line-height: 1.7; margin-bottom: 32px; }
.nf-actions  { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.nf-actions .btn { display: inline-flex; align-items: center; gap: 6px; }
</style>
