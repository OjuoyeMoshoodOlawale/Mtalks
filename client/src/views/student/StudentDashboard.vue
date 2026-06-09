<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import StudentNav from '@/components/layout/StudentNav.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { BookOpen, Calendar, User, TrendingUp, Award } from 'lucide-vue-next'

const auth       = useAuthStore()
const enrollments = ref([])
const events      = ref([])
const loading     = ref(true)

onMounted(async () => {
  try {
    const [e, r] = await Promise.all([
      api.get('/enrollments/my'), api.get('/registrations/my')
    ])
    enrollments.value = e.data.data
    events.value      = r.data.data
  } finally { loading.value = false }
})

const avgProgress = computed(() => {
  if (!enrollments.value.length) return 0
  const total = enrollments.value.reduce((acc, e) => {
    const pct = e.total_lessons > 0 ? Math.round((e.completed_lessons / e.total_lessons) * 100) : 0
    return acc + pct
  }, 0)
  return Math.round(total / enrollments.value.length)
})
</script>

<template>
  <PublicHeader />
  <div class="dashboard-wrap">
    <div class="container">
      <!-- Greeting -->
      <div class="dash-greeting">
        <div>
          <h2>Assalamu Alaikum, {{ auth.user?.name?.split(' ')[0] }}</h2>
          <p style="color:var(--ma-text-muted)">Track your learning journey and event registrations.</p>
        </div>
        <RouterLink to="/courses" class="btn btn--primary">Browse More Courses</RouterLink>
      </div>

      <!-- Stats -->
      <div class="dash-stats">
        <div class="stat-card">
          <BookOpen :size="24" color="var(--ma-green-deep)" />
          <div class="stat-val">{{ enrollments.length }}</div>
          <div class="stat-lbl">Enrolled courses</div>
        </div>
        <div class="stat-card">
          <TrendingUp :size="24" color="var(--ma-green-deep)" />
          <div class="stat-val">{{ avgProgress }}%</div>
          <div class="stat-lbl">Average progress</div>
        </div>
        <div class="stat-card">
          <Calendar :size="24" color="var(--ma-green-deep)" />
          <div class="stat-val">{{ events.length }}</div>
          <div class="stat-lbl">Events registered</div>
        </div>
        <div class="stat-card">
          <Award :size="24" color="var(--ma-green-deep)" />
          <div class="stat-val">{{ enrollments.filter(e=>e.total_lessons>0&&e.completed_lessons>=e.total_lessons).length }}</div>
          <div class="stat-lbl">Courses completed</div>
        </div>
      </div>

      <BaseLoader v-if="loading" />
      <div v-else>
        <!-- My Courses -->
        <h3 style="margin-bottom:16px">My Courses</h3>
        <div v-if="!enrollments.length" style="text-align:center;padding:32px;background:var(--ma-off-white);border-radius:var(--radius-lg);margin-bottom:36px">
          <BookOpen :size="40" color="var(--ma-border)" />
          <p style="color:var(--ma-text-muted);margin-top:10px">No courses enrolled yet.</p>
          <RouterLink to="/courses" class="btn btn--primary btn--sm" style="margin-top:12px;display:inline-flex">Browse Courses</RouterLink>
        </div>
        <div v-else class="enrolled-grid">
          <RouterLink v-for="e in enrollments" :key="e.id" :to="`/dashboard/courses/${e.course_id}/learn`" class="enrolled-card">
            <img :src="e.thumbnail||'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=300&q=70&auto=format'" :alt="e.title" />
            <div class="enrolled-body">
              <h4>{{ e.title }}</h4>
              <div class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill"
                    :style="{width: e.total_lessons>0 ? Math.round(e.completed_lessons/e.total_lessons*100)+'%' : '0%'}"></div>
                </div>
                <span class="progress-pct">{{ e.total_lessons>0 ? Math.round(e.completed_lessons/e.total_lessons*100) : 0 }}%</span>
              </div>
              <span class="continue-btn">Continue →</span>
            </div>
          </RouterLink>
        </div>

        <!-- My Events -->
        <h3 style="margin:36px 0 16px">My Event Tickets</h3>
        <div v-if="!events.length" style="text-align:center;padding:32px;background:var(--ma-off-white);border-radius:var(--radius-lg)">
          <Calendar :size="40" color="var(--ma-border)" />
          <p style="color:var(--ma-text-muted);margin-top:10px">No event tickets yet.</p>
          <RouterLink to="/events" class="btn btn--primary btn--sm" style="margin-top:12px;display:inline-flex">Browse Events</RouterLink>
        </div>
        <div v-else class="events-list">
          <div v-for="r in events" :key="r.id" class="event-ticket">
            <div class="ticket-left">
              <p style="font-weight:700;color:var(--ma-green-dark)">{{ r.title }}</p>
              <p style="font-size:.85rem;color:var(--ma-text-muted)">{{ r.package_name }} · {{ new Date(r.event_date).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'}) }}</p>
            </div>
            <div class="ticket-code">{{ r.ticket_code }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <PublicFooter />
</template>

<style scoped>
.dashboard-wrap{padding:40px 0 60px;min-height:60vh;background:var(--ma-off-white)}
.dash-greeting{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:28px}
.dash-greeting h2{font-family:var(--font-heading);color:var(--ma-green-dark)}
.dash-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:36px}
.stat-card{background:var(--ma-white);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:8px;border:1px solid var(--ma-border)}
.stat-val{font-family:var(--font-heading);font-size:2rem;font-weight:700;color:var(--ma-green-dark)}
.stat-lbl{font-size:.82rem;color:var(--ma-text-muted)}
.enrolled-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin-bottom:8px}
.enrolled-card{background:var(--ma-white);border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--ma-border);text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow var(--trans-base)}
.enrolled-card:hover{box-shadow:var(--shadow-md)}
.enrolled-card img{width:100%;height:140px;object-fit:cover}
.enrolled-body{padding:16px;display:flex;flex-direction:column;gap:8px}
.enrolled-body h4{font-size:.9rem;color:var(--ma-green-dark);margin:0;line-height:1.35}
.progress-wrap{display:flex;align-items:center;gap:8px}
.progress-bar{flex:1;height:6px;background:var(--ma-border);border-radius:3px;overflow:hidden}
.progress-fill{height:100%;background:var(--ma-green);border-radius:3px;transition:width .4s ease}
.progress-pct{font-size:.78rem;font-weight:600;color:var(--ma-green-deep);min-width:34px}
.continue-btn{font-size:.82rem;font-weight:600;color:var(--ma-green-mid)}
.events-list{display:flex;flex-direction:column;gap:12px}
.event-ticket{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.ticket-code{font-family:var(--font-mono);font-size:.85rem;background:var(--ma-green-tint);color:var(--ma-green-deep);padding:6px 12px;border-radius:6px;letter-spacing:.1em}
</style>
