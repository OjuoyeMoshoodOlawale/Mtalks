<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import api from '@/services/api'
import BaseLoader  from '@/components/common/BaseLoader.vue'
import BaseButton  from '@/components/common/BaseButton.vue'
import { CheckCircle, Circle, ChevronLeft, ChevronRight, BookOpen, Award } from 'lucide-vue-next'

const route   = useRoute()
const auth    = useAuthStore()
const ui      = useUiStore()
const course  = ref(null)
const progress= ref([])
const current = ref(null)
const loading = ref(true)
const sidebarOpen = ref(true)

const flatLessons = computed(() => {
  if (!course.value) return []
  return course.value.modules?.flatMap(m => m.lessons?.map(l => ({ ...l, module_title: m.title })) || []) || []
})

const currentIdx = computed(() => flatLessons.value.findIndex(l => l.id === current.value?.id))
const isDone     = (id) => progress.value.includes(id)
const totalDone  = computed(() => flatLessons.value.filter(l => isDone(l.id)).length)
const totalLessons = computed(() => flatLessons.value.length)
const pct = computed(() => totalLessons.value > 0 ? Math.round((totalDone.value / totalLessons.value) * 100) : 0)

const driveUrl   = (id) => `https://drive.google.com/file/d/${id}/preview`

onMounted(async () => {
  const [c, p] = await Promise.all([
    api.get(`/courses/${route.params.id}?by_id=1`).catch(() =>
      api.get(`/courses?id=${route.params.id}`)),
    api.get('/lessons/progress')
  ])

  const { data: cd } = await api.get(`/enrollments/my`)
  const enrol = cd.data.find(e => e.course_id == route.params.id)
  if (enrol) {
    const { data } = await api.get(`/courses/${enrol.slug}`)
    course.value = data.data
  }
  progress.value = p.data.data || []
  current.value = flatLessons.value[0] || null
  loading.value = false
})

const select = (lesson) => { current.value = lesson }

const markDone = async () => {
  if (!current.value || isDone(current.value.id)) return
  await api.post(`/lessons/${current.value.id}/complete`)
  progress.value.push(current.value.id)
  ui.toast('Lesson completed!')
}

const next = () => {
  const idx = currentIdx.value
  if (idx < flatLessons.value.length - 1) current.value = flatLessons.value[idx + 1]
}
const prev = () => {
  const idx = currentIdx.value
  if (idx > 0) current.value = flatLessons.value[idx - 1]
}
</script>

<template>
  <div class="player-wrap">
    <!-- Top bar -->
    <div class="player-topbar">
      <RouterLink to="/dashboard" style="display:flex;align-items:center;gap:8px;color:var(--ma-white);font-weight:600">
        <ChevronLeft :size="18" /> My Courses
      </RouterLink>
      <div class="player-progress">
        <div class="prog-bar"><div class="prog-fill" :style="{width:pct+'%'}" /></div>
        <span>{{ totalDone }}/{{ totalLessons }} · {{ pct }}%</span>
      </div>
    </div>

    <BaseLoader v-if="loading" style="padding:80px" />
    <div v-else class="player-body">
      <!-- Sidebar -->
      <aside :class="['player-sidebar', {open: sidebarOpen}]">
        <div class="sidebar-header">
          <BookOpen :size="18" color="var(--ma-green)" />
          <span style="font-size:.9rem;font-weight:600;color:var(--ma-white)">{{ course?.title }}</span>
          <button @click="sidebarOpen=!sidebarOpen" style="color:var(--ma-white);margin-left:auto" aria-label="Toggle sidebar"><ChevronLeft :size="20" /></button>
        </div>
        <div class="sidebar-list">
          <div v-for="mod in course?.modules" :key="mod.id" class="sidebar-module">
            <p class="module-title">{{ mod.title }}</p>
            <button v-for="l in mod.lessons" :key="l.id"
              :class="['lesson-btn', {active: current?.id===l.id}]"
              @click="select(l)">
              <component :is="isDone(l.id) ? CheckCircle : Circle" :size="16"
                :color="isDone(l.id) ? 'var(--ma-green)' : 'rgba(255,255,255,.4)'" />
              <span>{{ l.title }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main player -->
      <main class="player-main">
        <div v-if="current" class="video-area">
          <iframe v-if="current.drive_file_id"
            :src="driveUrl(current.drive_file_id)"
            class="drive-frame"
            allow="autoplay"
            allowfullscreen
          />
          <div v-else class="video-placeholder">
            <BookOpen :size="48" color="rgba(255,255,255,.3)" />
            <p>Video will appear here once uploaded to Google Drive</p>
          </div>

          <div class="player-controls">
            <div>
              <p class="lesson-title">{{ current.title }}</p>
              <p v-if="current.content" class="lesson-notes">{{ current.content }}</p>
            </div>
            <div class="ctrl-btns">
              <BaseButton variant="outline" @click="prev" :disabled="currentIdx===0" size="sm">
                <ChevronLeft :size="16" /> Prev
              </BaseButton>
              <BaseButton v-if="!isDone(current.id)" @click="markDone" size="sm">
                <CheckCircle :size="16" /> Mark Complete
              </BaseButton>
              <span v-else style="display:flex;align-items:center;gap:6px;font-size:.85rem;color:var(--ma-green-deep);font-weight:600">
                <CheckCircle :size="16" color="var(--ma-green)" /> Completed
              </span>
              <BaseButton @click="next" :disabled="currentIdx===flatLessons.length-1" size="sm">
                Next <ChevronRight :size="16" />
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Completion card -->
        <div v-if="pct===100" class="completion-card">
          <Award :size="48" color="var(--ma-gold)" />
          <h3>Alhamdulillah! You've completed this course.</h3>
          <p>JazakAllahu Khairan for your dedication to growth.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.player-wrap{display:flex;flex-direction:column;height:100vh;background:#0a1f0a;color:#fff}
.player-topbar{background:var(--ma-green-dark);padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid rgba(255,255,255,.1);flex-shrink:0}
.player-progress{display:flex;align-items:center;gap:12px;font-size:.82rem;color:rgba(255,255,255,.7)}
.prog-bar{width:160px;height:5px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden}
.prog-fill{height:100%;background:var(--ma-green);border-radius:3px;transition:width .4s}
.player-body{display:flex;flex:1;overflow:hidden}
.player-sidebar{width:280px;background:var(--ma-green-dark);display:flex;flex-direction:column;flex-shrink:0;overflow:hidden;transition:width var(--trans-base)}
.player-sidebar:not(.open){width:0}
.sidebar-header{padding:16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.1);flex-shrink:0}
.sidebar-list{flex:1;overflow-y:auto;padding:8px}
.sidebar-module{margin-bottom:16px}
.module-title{font-size:.75rem;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:uppercase;padding:6px 8px;margin-bottom:4px}
.lesson-btn{display:flex;align-items:center;gap:8px;width:100%;padding:9px 8px;border-radius:6px;background:none;color:rgba(255,255,255,.75);font-size:.83rem;cursor:pointer;text-align:left;transition:background var(--trans-fast);border:none}
.lesson-btn:hover,.lesson-btn.active{background:rgba(118,196,66,.15);color:#fff}
.lesson-btn.active{font-weight:600}
.player-main{flex:1;overflow-y:auto;padding:24px}
.video-area{max-width:900px;margin:0 auto}
.drive-frame{width:100%;aspect-ratio:16/9;border:none;border-radius:var(--radius-lg);background:#000;display:block}
.video-placeholder{aspect-ratio:16/9;background:rgba(255,255,255,.05);border:2px dashed rgba(255,255,255,.15);border-radius:var(--radius-lg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:rgba(255,255,255,.4)}
.player-controls{padding:20px 4px;display:flex;flex-direction:column;gap:16px}
.lesson-title{font-family:var(--font-heading);font-size:1.2rem;color:#fff;margin-bottom:8px}
.lesson-notes{font-size:.875rem;color:rgba(255,255,255,.65);line-height:1.7;white-space:pre-line}
.ctrl-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.completion-card{max-width:500px;margin:32px auto;background:rgba(240,193,48,.08);border:2px solid var(--ma-gold);border-radius:var(--radius-xl);padding:36px;text-align:center}
.completion-card h3{font-family:var(--font-heading);color:var(--ma-gold);margin:16px 0 8px}
.completion-card p{color:rgba(255,255,255,.7)}
</style>
