<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import StudentNav from '@/components/layout/StudentNav.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { BookOpen, Search, CheckCircle, Clock, ChevronRight, AlertCircle } from 'lucide-vue-next'

const auth        = useAuthStore()
const enrollments = ref([])
const loading     = ref(true)
const error       = ref('')
const search      = ref('')
const filter      = ref('all')  // all | in-progress | completed | not-started

const certificates = ref([])

onMounted(async () => {
  try {
    const [enrolRes, certRes] = await Promise.all([
      api.get('/enrollments/my'),
      api.get('/certificates/my').catch(() => ({ data: { data: [] } }))
    ])
    enrollments.value  = enrolRes.data.data || []
    certificates.value = certRes.data.data || []
  } catch {
    error.value = 'Could not load your courses. Please try again.'
  } finally {
    loading.value = false
  }
})

const certFor = (title) => certificates.value.find(c => c.course_title === title)

const progress = (e) =>
  e.total_lessons > 0 ? Math.round((e.completed_lessons / e.total_lessons) * 100) : 0

const statusLabel = (e) => {
  const p = progress(e)
  if (p === 100) return 'completed'
  if (p > 0)     return 'in-progress'
  return 'not-started'
}

const filtered = computed(() => {
  let list = enrollments.value
  if (search.value.trim())
    list = list.filter(e => e.title.toLowerCase().includes(search.value.toLowerCase()))
  if (filter.value !== 'all')
    list = list.filter(e => statusLabel(e) === filter.value)
  return list
})

const completedCount   = computed(() => enrollments.value.filter(e => progress(e) === 100).length)
const inProgressCount  = computed(() => enrollments.value.filter(e => { const p = progress(e); return p > 0 && p < 100 }).length)
</script>

<template>
  <div class="my-courses-page">
    <PublicHeader />
    <StudentNav />

    <div class="page-hero">
      <div class="container">
        <h1>My Courses</h1>
        <p>Track your learning journey, {{ auth.user?.name?.split(' ')[0] }}</p>
      </div>
    </div>

    <div class="container page-body">
      <!-- Stats bar -->
      <div class="stats-row">
        <div class="stat-pill">
          <BookOpen :size="16" /> {{ enrollments.length }} Enrolled
        </div>
        <div class="stat-pill stat-pill--green">
          <CheckCircle :size="16" /> {{ completedCount }} Completed
        </div>
        <div class="stat-pill stat-pill--gold">
          <Clock :size="16" /> {{ inProgressCount }} In Progress
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <Search :size="16" class="search-icon" />
          <input v-model="search" type="text" placeholder="Search your courses…" class="search-input" />
        </div>
        <div class="filter-tabs">
          <button
            v-for="f in ['all','in-progress','completed','not-started']"
            :key="f"
            class="filter-tab"
            :class="{ active: filter === f }"
            @click="filter = f"
          >
            {{ f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f === 'completed' ? 'Completed' : 'Not Started' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loader-wrap">
        <BaseLoader />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <AlertCircle :size="36" color="var(--ma-red, #e53e3e)" />
        <p>{{ error }}</p>
        <button class="btn btn--outline btn--sm" @click="$router.go(0)">Retry</button>
      </div>

      <!-- Empty enrolled -->
      <div v-else-if="!enrollments.length" class="empty-state">
        <BookOpen :size="48" color="var(--ma-border)" />
        <h3>No courses enrolled yet</h3>
        <p>Explore our library and start your first course today.</p>
        <RouterLink to="/courses" class="btn btn--primary">Browse Courses</RouterLink>
      </div>

      <!-- Empty filtered -->
      <div v-else-if="!filtered.length" class="empty-state">
        <Search :size="40" color="var(--ma-border)" />
        <h3>No courses match your filter</h3>
        <button class="btn btn--outline btn--sm" @click="search=''; filter='all'">Clear filters</button>
      </div>

      <!-- Course grid -->
      <div v-else class="courses-grid">
        <RouterLink
          v-for="e in filtered"
          :key="e.id"
          :to="`/dashboard/courses/${e.course_id}/learn`"
          class="course-card"
        >
          <div class="card-thumb">
            <img
              :src="e.thumbnail || 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=400&q=70&auto=format'"
              :alt="e.title"
            />
            <span class="status-badge" :class="`status-badge--${statusLabel(e)}`">
              {{ statusLabel(e) === 'completed' ? 'Completed' : statusLabel(e) === 'in-progress' ? 'In Progress' : 'Not Started' }}
            </span>
          </div>

          <div class="card-body">
            <h4 class="card-title">{{ e.title }}</h4>

            <div class="progress-section">
              <div class="progress-header">
                <span>{{ e.completed_lessons || 0 }}/{{ e.total_lessons || 0 }} lessons</span>
                <span class="pct">{{ progress(e) }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress(e) + '%' }"></div>
              </div>
            </div>

            <div class="card-footer">
              <span class="enrolled-date" v-if="e.enrolled_at">
                Enrolled {{ new Date(e.enrolled_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) }}
              </span>
              <span class="continue-link">
                {{ progress(e) === 100 ? 'Review' : progress(e) > 0 ? 'Continue' : 'Start' }}
                <ChevronRight :size="14" />
              </span>
            </div>

            <!-- Certificate earned -->
            <a
              v-if="certFor(e.title)"
              :href="`/certificate/${certFor(e.title).cert_code}`"
              target="_blank"
              class="cert-link"
              @click.stop
            >
               View Certificate · {{ certFor(e.title).cert_code }}
            </a>
          </div>
        </RouterLink>
      </div>
    </div>

    <PublicFooter />
  </div>
</template>

<style scoped>
.my-courses-page{background:var(--ma-off-white);min-height:100vh}
.page-hero{background:var(--ma-green-dark);color:var(--ma-white);padding:48px 0 36px}
.page-hero h1{font-family:var(--font-heading);font-size:2rem;margin-bottom:6px}
.page-hero p{opacity:.75;font-size:.95rem}
.page-body{padding:36px 0 64px}
/* Stats */
.stats-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
.stat-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:var(--ma-white);border:1px solid var(--ma-border);font-size:.82rem;font-weight:600;color:var(--ma-text-muted)}
.stat-pill--green{color:var(--ma-green-deep);border-color:var(--ma-green)}
.stat-pill--gold{color:#856900;border-color:var(--ma-gold)}
/* Toolbar */
.toolbar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:28px}
.search-wrap{position:relative;flex:1;min-width:200px}
.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ma-text-muted)}
.search-input{width:100%;padding:9px 12px 9px 36px;border:1px solid var(--ma-border);border-radius:var(--radius-md);font-size:.9rem;background:var(--ma-white)}
.search-input:focus{outline:none;border-color:var(--ma-green)}
.filter-tabs{display:flex;gap:4px;flex-wrap:wrap}
.filter-tab{padding:7px 14px;border-radius:20px;border:1px solid var(--ma-border);background:var(--ma-white);font-size:.82rem;cursor:pointer;color:var(--ma-text-muted);transition:all var(--trans-fast)}
.filter-tab.active,.filter-tab:hover{background:var(--ma-green);color:var(--ma-white);border-color:var(--ma-green)}
/* States */
.loader-wrap{padding:60px 0;display:flex;justify-content:center}
.error-state,.empty-state{text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:14px}
.error-state p,.empty-state p{color:var(--ma-text-muted)}
.empty-state h3{color:var(--ma-green-dark);font-family:var(--font-heading)}
/* Grid */
.courses-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:22px}
.course-card{background:var(--ma-white);border-radius:var(--radius-lg);border:1px solid var(--ma-border);overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow var(--trans-base),transform var(--trans-base)}
.course-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.card-thumb{position:relative}
.card-thumb img{width:100%;height:150px;object-fit:cover;display:block}
.status-badge{position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:10px;font-size:.72rem;font-weight:700}
.status-badge--completed{background:#d4edda;color:#155724}
.status-badge--in-progress{background:#fff3cd;color:#856900}
.status-badge--not-started{background:rgba(0,0,0,.45);color:#fff}
.card-body{padding:16px;display:flex;flex-direction:column;gap:12px;flex:1}
.card-title{font-size:.9rem;font-weight:700;color:var(--ma-green-dark);line-height:1.35;margin:0}
.progress-section{display:flex;flex-direction:column;gap:5px}
.progress-header{display:flex;justify-content:space-between;font-size:.78rem;color:var(--ma-text-muted)}
.pct{font-weight:700;color:var(--ma-green-deep)}
.progress-bar{height:7px;background:var(--ma-border);border-radius:4px;overflow:hidden}
.progress-fill{height:100%;background:var(--ma-green);border-radius:4px;transition:width .5s ease}
.card-footer{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:4px}
.enrolled-date{font-size:.75rem;color:var(--ma-text-muted)}
.continue-link{display:flex;align-items:center;gap:2px;font-size:.8rem;font-weight:700;color:var(--ma-green-deep)}
.cert-link{display:block;margin-top:8px;font-size:.75rem;font-weight:700;color:#856900;background:#fff8e1;border:1px solid var(--ma-gold);border-radius:8px;padding:6px 10px;text-align:center;text-decoration:none;transition:background var(--trans-fast)}
.cert-link:hover{background:var(--ma-gold);color:#3d2f00}
</style>
