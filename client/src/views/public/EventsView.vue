<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { Calendar, MapPin, Monitor, Tag, Clock, ChevronRight } from 'lucide-vue-next'

import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title:       'Events',
  description: 'Register for upcoming summits, retreats and workshops by Muhsinah Academy. Transformative live events for couples and singles across Nigeria.',
  url:         '/events',
})


const events  = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try { const { data } = await api.get('/events'); events.value = data.data }
  finally { loading.value = false }
})

const formatDate = (d) => new Date(d).toLocaleDateString('en-NG', { weekday:'short', day:'numeric', month:'long', year:'numeric' })
const isEarlyBird = (pkg) => pkg.early_bird_price && new Date(pkg.early_bird_deadline) > new Date()
const lowestPrice = (event) => {
  if (!event.packages?.length) return null
  const prices = event.packages.map(p => isEarlyBird(p) ? Number(p.early_bird_price) : Number(p.price))
  return Math.min(...prices)
}
</script>

<template>
  <div class="page-view">
  <PublicHeader />
  <div class="page-hero">
    <div class="container">
      <span class="section-tag">Events & Live Sessions</span>
      <h1>Upcoming Events</h1>
      <p class="section-sub">Join Coach Madinah live — online or in Abuja — for transformative coaching sessions, workshops, and community gatherings.</p>
    </div>
  </div>

  <section class="section">
    <div class="container">
      <BaseLoader v-if="loading" />
      <div v-else-if="!events.length" style="text-align:center;padding:60px 0">
        <Calendar :size="48" color="var(--ma-border)" />
        <p style="color:var(--ma-text-muted);margin-top:12px">No upcoming events right now. Check back soon!</p>
      </div>
      <div v-else class="events-list">
        <RouterLink v-for="ev in events" :key="ev.id" :to="`/events/${ev.slug}`" class="event-card">
          <div class="event-banner">
            <img :src="ev.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=70&auto=format'" :alt="ev.title" loading="lazy" />
            <div class="event-type-badge">
              <Monitor v-if="ev.type==='online'" :size="14" /> <MapPin v-else :size="14" />
              {{ ev.type === 'online' ? 'Online' : 'In-Person' }}
            </div>
          </div>
          <div class="event-body">
            <div class="event-date-strip">
              <Calendar :size="16" color="var(--ma-green-deep)" />
              <span>{{ formatDate(ev.event_date) }}</span>
              <span class="event-time"><Clock :size="14" /> {{ new Date(ev.event_date).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}) }}</span>
            </div>
            <h3>{{ ev.title }}</h3>
            <p class="event-desc">{{ ev.description?.slice(0,130) }}{{ ev.description?.length > 130 ? '…' : '' }}</p>
            <div class="event-footer">
              <div v-if="ev.packages?.length">
                <span class="section-tag" style="font-size:.7rem">From</span>
                <span class="event-price">₦{{ lowestPrice(ev)?.toLocaleString() }}</span>
                <span v-if="ev.packages.some(p=>isEarlyBird(p))" class="badge badge--gold" style="margin-left:6px">Early Bird</span>
              </div>
              <span class="event-cta">Register <ChevronRight :size="16" /></span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
  <PublicFooter />
  </div>
</template>

<style scoped>
.page-hero{background:var(--ma-green-dark);color:var(--ma-white);padding:60px 0}
.page-hero h1{color:var(--ma-white);margin:8px 0 12px}
.events-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:28px}
.event-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow var(--trans-base),transform var(--trans-base)}
.event-card:hover{box-shadow:var(--shadow-md);transform:translateY(-3px)}
.event-banner{position:relative;height:200px;overflow:hidden}
.event-banner img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease}
.event-card:hover .event-banner img{transform:scale(1.04)}
.event-type-badge{position:absolute;top:12px;left:12px;background:var(--ma-green-dark);color:#fff;padding:4px 12px;border-radius:20px;font-size:.76rem;font-weight:600;display:flex;align-items:center;gap:6px}
.event-body{padding:20px;display:flex;flex-direction:column;flex:1}
.event-date-strip{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--ma-green-mid);font-weight:600;margin-bottom:10px}
.event-time{display:flex;align-items:center;gap:4px;margin-left:auto;color:var(--ma-text-muted)}
.event-body h3{font-size:1rem;color:var(--ma-green-dark);margin-bottom:8px;line-height:1.35}
.event-desc{font-size:.85rem;color:var(--ma-text-muted);line-height:1.6;flex:1}
.event-footer{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid var(--ma-border)}
.event-price{font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--ma-green-dark)}
.event-cta{display:flex;align-items:center;gap:4px;font-size:.85rem;font-weight:600;color:var(--ma-green-deep)}
</style>
