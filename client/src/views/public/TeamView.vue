<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { Instagram, Linkedin, Twitter } from 'lucide-vue-next'

import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title:       'Our Team',
  description: 'Meet the passionate coaches and coordinators behind Muhsinah Academy, led by certified marriage coach Madinah Sanni.',
  url:         '/team',
})


const team    = ref([])
const loading = ref(true)
onMounted(async () => { try { const { data } = await api.get('/team'); team.value = data.data } finally { loading.value=false } })
</script>

<template>
  <div class="page-view">
  <PublicHeader />
  <div style="background:var(--ma-green-dark);padding:60px 0;color:var(--ma-white)">
    <div class="container text-center">
      <span class="section-tag">The People Behind the Work</span>
      <h1 style="color:var(--ma-white);margin:10px 0 12px">Our Team</h1>
      <p style="color:rgba(255,255,255,.75)">Passionate, qualified, and dedicated to your growth.</p>
    </div>
  </div>
  <section class="section">
    <div class="container">
      <BaseLoader v-if="loading"/>
      <div v-else class="team-grid">
        <div v-for="m in team" :key="m.id" class="team-card">
          <img loading="lazy" :src="m.photo||'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=70&auto=format'" :alt="m.name"/>
          <div class="team-body">
            <h3>{{ m.name }}</h3>
            <p class="team-role">{{ m.role }}</p>
            <p v-if="m.bio" class="team-bio">{{ m.bio }}</p>
            <div class="team-social">
              <a v-if="m.social_links?.instagram" :href="m.social_links.instagram" target="_blank"><Instagram :size="18"/></a>
              <a v-if="m.social_links?.linkedin"  :href="m.social_links.linkedin"  target="_blank"><Linkedin  :size="18"/></a>
              <a v-if="m.social_links?.twitter"   :href="m.social_links.twitter"   target="_blank"><Twitter   :size="18"/></a>
            </div>
          </div>
        </div>
        <div v-if="!team.length" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ma-text-muted)">Team profiles coming soon.</div>
      </div>
    </div>
  </section>
  <PublicFooter />
  </div>
</template>

<style scoped>
.team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:28px}
.team-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-xl);overflow:hidden}
.team-card img{width:100%;height:260px;object-fit:cover}
.team-body{padding:20px}
.team-body h3{font-size:1.05rem;color:var(--ma-green-dark);margin:0 0 4px}
.team-role{font-size:.85rem;color:var(--ma-green-mid);font-weight:600;margin:0 0 10px}
.team-bio{font-size:.85rem;color:var(--ma-text-muted);line-height:1.6;margin:0 0 14px}
.team-social{display:flex;gap:10px}
.team-social a{color:var(--ma-text-muted);transition:color var(--trans-fast)}.team-social a:hover{color:var(--ma-green-deep)}
</style>
