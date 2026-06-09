<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useAuthStore }    from '@/stores/auth'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { BookOpen, Clock, Users, Lock, Unlock, Search } from 'lucide-vue-next'

import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title:       'Online Courses',
  description: 'Browse our library of life and marriage coaching courses. Free and paid self-paced courses for singles, engaged couples, and married partners.',
  url:         '/courses',
})


const store   = useCoursesStore()
const auth    = useAuthStore()
const search  = ref('')
const filter  = ref('all')

onMounted(() => store.fetchAll())

const filtered = computed(() => {
  let list = store.courses
  if (filter.value === 'free')  list = list.filter(c => c.is_free || c.price == 0)
  if (filter.value === 'paid')  list = list.filter(c => !c.is_free && c.price > 0)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
  }
  return list
})

const formatPrice = (c) => c.is_free || c.price == 0 ? 'Free' : `₦${Number(c.price).toLocaleString()}`
</script>

<template>
  <div class="page-view">
  <PublicHeader />

  <div class="page-hero">
    <div class="container">
      <span class="section-tag">Online Learning</span>
      <h1>Courses & Training</h1>
      <p class="section-sub">Learn at your own pace. Evidence-based, Islamically grounded content on relationships, marriage, and personal development.</p>
    </div>
  </div>

  <section class="section">
    <div class="container">
      <!-- Filters -->
      <div class="courses-toolbar">
        <div class="search-wrap">
          <Search :size="18" class="search-icon" />
          <input v-model="search" type="search" placeholder="Search courses..." class="search-input" />
        </div>
        <div class="filter-pills">
          <button v-for="f in [{v:'all',l:'All'},{v:'free',l:'Free'},{v:'paid',l:'Paid'}]"
            :key="f.v" :class="['pill', {active: filter===f.v}]" @click="filter=f.v">{{ f.l }}
          </button>
        </div>
      </div>

      <BaseLoader v-if="store.loading" />

      <div v-else-if="!filtered.length" style="text-align:center;padding:60px 0">
        <BookOpen :size="48" color="var(--ma-border)" />
        <p style="color:var(--ma-text-muted);margin-top:12px">No courses found.</p>
      </div>

      <div v-else class="courses-grid">
        <RouterLink v-for="c in filtered" :key="c.id" :to="`/courses/${c.slug}`" class="course-card">
          <div class="course-thumb">
            <img :src="c.thumbnail || 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=400&q=70&auto=format'" :alt="c.title" loading="lazy" />
            <span class="price-badge" :class="c.is_free || c.price==0 ? 'free' : 'paid'">{{ formatPrice(c) }}</span>
          </div>
          <div class="course-body">
            <h3>{{ c.title }}</h3>
            <p class="course-desc">{{ c.description?.slice(0, 110) }}{{ c.description?.length > 110 ? '…' : '' }}</p>
            <div class="course-meta">
              <span><Clock :size="14" /> {{ c.duration_min || '—' }} min</span>
              <span v-if="c.is_free || c.price==0"><Unlock :size="14" /> Free access</span>
              <span v-else><Lock :size="14" /> Enrolment required</span>
            </div>
            <span class="course-cta">Explore course →</span>
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
.courses-toolbar{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-bottom:32px}
.search-wrap{position:relative;flex:1;min-width:220px}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--ma-text-muted)}
.search-input{width:100%;padding:11px 14px 11px 42px;border:1.5px solid var(--ma-border);border-radius:var(--radius-md);font-size:.9rem;background:var(--ma-white)}
.search-input:focus{border-color:var(--ma-green);outline:none}
.filter-pills{display:flex;gap:8px}
.pill{padding:8px 18px;border-radius:20px;font-size:.85rem;font-weight:500;border:1.5px solid var(--ma-border);background:transparent;cursor:pointer;transition:all var(--trans-fast)}
.pill.active,.pill:hover{background:var(--ma-green);border-color:var(--ma-green);color:#fff}
.courses-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}
.course-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow var(--trans-base),transform var(--trans-base)}
.course-card:hover{box-shadow:var(--shadow-md);transform:translateY(-3px)}
.course-thumb{position:relative;height:180px;overflow:hidden}
.course-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease}
.course-card:hover .course-thumb img{transform:scale(1.04)}
.price-badge{position:absolute;top:12px;right:12px;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:700}
.price-badge.free{background:var(--ma-green);color:#fff}
.price-badge.paid{background:var(--ma-gold);color:#000}
.course-body{padding:20px;display:flex;flex-direction:column;flex:1}
.course-body h3{font-size:1rem;margin-bottom:8px;color:var(--ma-green-dark);line-height:1.35}
.course-desc{font-size:.85rem;color:var(--ma-text-muted);line-height:1.6;flex:1}
.course-meta{display:flex;gap:12px;margin:12px 0;font-size:.78rem;color:var(--ma-text-muted)}
.course-meta span{display:flex;align-items:center;gap:4px}
.course-cta{font-size:.85rem;font-weight:600;color:var(--ma-green-deep);margin-top:auto}
</style>
