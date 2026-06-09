<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { Star } from 'lucide-vue-next'

const testimonials = ref([]); const loading = ref(true)
onMounted(async () => { try { const { data } = await api.get('/testimonials'); testimonials.value = data.data } finally { loading.value=false } })
</script>

<template>
  <div class="page-view">
  <PublicHeader />
  <div style="background:var(--ma-green-dark);padding:60px 0;color:var(--ma-white)">
    <div class="container text-center">
      <h1 style="color:var(--ma-white);margin:10px 0 12px">What Our Clients Say</h1>
      <p style="color:rgba(255,255,255,.75)">Real stories from real people whose lives were transformed through coaching.</p>
    </div>
  </div>
  <section class="section">
    <div class="container">
      <BaseLoader v-if="loading"/>
      <div v-else class="testimonials-grid">
        <div v-for="t in testimonials" :key="t.id" class="t-card">
          <div class="stars"><Star v-for="i in t.rating" :key="i" :size="16" fill="var(--ma-gold)" color="var(--ma-gold)"/></div>
          <p class="t-quote">"{{ t.content }}"</p>
          <div class="t-author">
            <img :src="t.client_photo||'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=70&auto=format'" :alt="t.client_name"/>
            <strong>{{ t.client_name }}</strong>
          </div>
        </div>
        <div v-if="!testimonials.length" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ma-text-muted)">Testimonials coming soon.</div>
      </div>
    </div>
  </section>
  <PublicFooter />
  </div>
</template>

<style scoped>
.testimonials-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px}
.t-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-xl);padding:28px}
.stars{display:flex;gap:2px;margin-bottom:14px}
.t-quote{font-style:italic;line-height:1.75;color:var(--ma-text);margin:0 0 20px}
.t-author{display:flex;align-items:center;gap:12px}
.t-author img{width:44px;height:44px;border-radius:50%;object-fit:cover}
.t-author strong{font-size:.9rem;color:var(--ma-green-dark)}
</style>
