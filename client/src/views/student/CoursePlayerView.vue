<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import api from '@/services/api'
import BaseLoader  from '@/components/common/BaseLoader.vue'
import BaseButton  from '@/components/common/BaseButton.vue'
import { CheckCircle, Circle, ChevronLeft, ChevronRight, BookOpen, Award, HelpCircle, XCircle, X, Lock } from 'lucide-vue-next'

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
  if (current.value) loadVideo(current.value)
  loading.value = false
})

const videoUrl   = ref(null)
const videoError = ref('')
const videoLoading = ref(false)

const loadVideo = async (lesson) => {
  videoUrl.value = null
  videoError.value = ''
  if (!lesson) return
  videoLoading.value = true
  try {
    const { data } = await api.get(`/lessons/${lesson.id}/video`)
    videoUrl.value = data.data?.embed_url || null
  } catch (e) {
    videoError.value = e.response?.data?.message || 'Could not load this video'
  } finally {
    videoLoading.value = false
  }
}

const select = (lesson) => { current.value = lesson; loadVideo(lesson) }

const markDone = async () => {
  if (!current.value || isDone(current.value.id)) return
  await api.post(`/lessons/${current.value.id}/complete`)
  progress.value.push(current.value.id)
  ui.toast('Lesson completed!')
}

const next = () => {
  const idx = currentIdx.value
  if (idx < flatLessons.value.length - 1) select(flatLessons.value[idx + 1])
}
const prev = () => {
  const idx = currentIdx.value
  if (idx > 0) select(flatLessons.value[idx - 1])
}

/* ── Module quiz ── */
const quizOpen     = ref(false)
const quiz         = ref(null)
const quizLoading  = ref(false)
const answers      = ref({})
const quizResult   = ref(null)
const submitting   = ref(false)
const quizModuleTitle = ref('')

const openQuiz = async (mod) => {
  quizOpen.value = true
  quizLoading.value = true
  quizResult.value = null
  answers.value = {}
  quizModuleTitle.value = mod.title
  try {
    const { data } = await api.get(`/evaluations/take/${mod.id}`)
    quiz.value = data.data
  } catch { ui.toastError('Could not load quiz') }
  finally { quizLoading.value = false }
}

const allAnswered = computed(() =>
  quiz.value?.questions?.every(q => answers.value[q.id] != null))

const submitQuiz = async () => {
  if (!allAnswered.value) { ui.toastError('Answer all questions first'); return }
  submitting.value = true
  try {
    const { data } = await api.post(`/evaluations/${quiz.value.id}/submit`, { answers: answers.value })
    quizResult.value = data.data
    if (data.data.passed) ui.toast(`Passed with ${data.data.score}%! 🎉`)
  } catch { ui.toastError('Submission failed') }
  finally { submitting.value = false }
}

const retakeQuiz = () => { quizResult.value = null; answers.value = {} }

const resultFor = (qId) => quizResult.value?.results?.find(r => r.question_id === qId)

/* ── Certificate ── */
const claimingCert = ref(false)
const claimCertificate = async () => {
  claimingCert.value = true
  try {
    const { data } = await api.post('/certificates/claim', { course_id: course.value.id })
    const code = data.data.cert_code
    ui.toast('Certificate issued! 🎓')
    window.open(`/certificate/${code}`, '_blank')
  } catch (e) {
    ui.toastError(e.response?.data?.message || 'Could not issue certificate')
  } finally { claimingCert.value = false }
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
            <button class="quiz-btn" @click="openQuiz(mod)">
              <HelpCircle :size="15" />
              <span>Module Quiz</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main player -->
      <main class="player-main">
        <div v-if="current" class="video-area">
          <!-- Loading video access -->
          <div v-if="videoLoading" class="video-placeholder">
            <BaseLoader />
            <p>Verifying access…</p>
          </div>

          <!-- Access denied / error -->
          <div v-else-if="videoError" class="video-placeholder">
            <Lock :size="40" color="var(--ma-gold)" />
            <p>{{ videoError }}</p>
          </div>

          <!-- Protected player -->
          <div v-else-if="videoUrl" class="video-shield" @contextmenu.prevent>
            <iframe
              :src="videoUrl"
              class="drive-frame"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowfullscreen
              referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>

          <div v-else class="video-placeholder">
            <BookOpen :size="48" color="rgba(255,255,255,.3)" />
            <p>Video will appear here once the instructor uploads it</p>
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
          <BaseButton :loading="claimingCert" @click="claimCertificate" style="margin-top:18px">
            <Award :size="16"/> Get My Certificate
          </BaseButton>
        </div>
      </main>
    </div>

    <!-- ── Quiz overlay ── -->
    <Teleport to="body">
      <div v-if="quizOpen" class="quiz-overlay" @click.self="quizOpen=false">
        <div class="quiz-panel">
          <div class="quiz-header">
            <div>
              <h3>{{ quiz?.title || 'Module Quiz' }}</h3>
              <p class="quiz-sub">{{ quizModuleTitle }} · Pass mark: {{ quiz?.pass_score ?? 70 }}%</p>
            </div>
            <button class="quiz-close" @click="quizOpen=false"><X :size="20"/></button>
          </div>

          <BaseLoader v-if="quizLoading" style="padding:60px"/>

          <!-- No quiz for this module -->
          <div v-else-if="!quiz" class="quiz-empty">
            <HelpCircle :size="40" color="rgba(255,255,255,.25)"/>
            <p>No quiz has been added to this module yet.</p>
          </div>

          <!-- Result screen -->
          <div v-else-if="quizResult" class="quiz-result">
            <div class="result-ring" :class="quizResult.passed ? 'ring-pass' : 'ring-fail'">
              <span class="result-score">{{ quizResult.score }}%</span>
            </div>
            <h3 :style="{color: quizResult.passed ? 'var(--ma-green)' : '#ef4444'}">
              {{ quizResult.passed ? 'Passed! Masha\'Allah 🎉' : 'Not quite — try again' }}
            </h3>
            <p class="result-detail">
              {{ quizResult.correct_count }}/{{ quizResult.total }} correct ·
              Pass mark {{ quizResult.pass_score }}%
            </p>

            <!-- Review answers -->
            <div class="quiz-review">
              <div v-for="(q, qi) in quiz.questions" :key="q.id" class="review-q">
                <div class="review-q-header">
                  <component
                    :is="resultFor(q.id)?.correct ? CheckCircle : XCircle"
                    :size="16"
                    :color="resultFor(q.id)?.correct ? 'var(--ma-green)' : '#ef4444'"
                  />
                  <span>Q{{ qi+1 }}. {{ q.question }}</span>
                </div>
                <p class="review-ans" v-if="!resultFor(q.id)?.correct">
                  Correct answer: <strong>{{ q.options[resultFor(q.id)?.correct_index] }}</strong>
                </p>
              </div>
            </div>

            <div class="quiz-actions">
              <BaseButton v-if="!quizResult.passed" @click="retakeQuiz">Retake Quiz</BaseButton>
              <button class="btn btn--outline" @click="quizOpen=false" style="color:#fff;border-color:rgba(255,255,255,.3)">Close</button>
            </div>
          </div>

          <!-- Question form -->
          <div v-else class="quiz-form">
            <div v-if="quiz.has_passed" class="passed-banner">
              <CheckCircle :size="15" color="var(--ma-green)"/>
              You've already passed this quiz (best: {{ quiz.best_score }}%). You can retake it anytime.
            </div>

            <div v-for="(q, qi) in quiz.questions" :key="q.id" class="quiz-question">
              <p class="q-text">Q{{ qi+1 }}. {{ q.question }}</p>
              <label
                v-for="(opt, oi) in q.options" :key="oi"
                class="q-option"
                :class="{ selected: answers[q.id] === oi }"
              >
                <input type="radio" :name="`q-${q.id}`" :value="oi" v-model.number="answers[q.id]" />
                <span>{{ opt }}</span>
              </label>
            </div>

            <div class="quiz-actions">
              <span class="answered-count">
                {{ Object.keys(answers).length }}/{{ quiz.questions.length }} answered
              </span>
              <BaseButton :loading="submitting" :disabled="!allAnswered" @click="submitQuiz">
                Submit Quiz
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
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
.video-shield{position:relative;width:100%;height:100%}
.video-shield::after{content:'';position:absolute;top:0;right:0;width:60px;height:60px;z-index:2}/* covers Drive pop-out button */
.completion-card h3{font-family:var(--font-heading);color:var(--ma-gold);margin:16px 0 8px}
.completion-card p{color:rgba(255,255,255,.7)}
/* Quiz button in sidebar */
.quiz-btn{display:flex;align-items:center;gap:8px;width:100%;padding:8px;margin-top:2px;border-radius:6px;background:rgba(240,193,48,.1);color:var(--ma-gold);font-size:.8rem;font-weight:600;cursor:pointer;border:1px dashed rgba(240,193,48,.35);transition:background var(--trans-fast)}
.quiz-btn:hover{background:rgba(240,193,48,.2)}
/* Quiz overlay */
.quiz-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.quiz-panel{background:var(--ma-green-dark);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius-xl);width:100%;max-width:640px;max-height:88vh;overflow-y:auto;padding:28px;color:#fff}
.quiz-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.1)}
.quiz-header h3{font-family:var(--font-heading);font-size:1.2rem;color:#fff}
.quiz-sub{font-size:.8rem;color:rgba(255,255,255,.55);margin-top:4px}
.quiz-close{background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;padding:4px}
.quiz-close:hover{color:#fff}
.quiz-empty{text-align:center;padding:50px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;color:rgba(255,255,255,.55)}
/* Question form */
.passed-banner{display:flex;align-items:center;gap:8px;font-size:.82rem;background:rgba(118,196,66,.12);border:1px solid rgba(118,196,66,.3);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:18px;color:rgba(255,255,255,.85)}
.quiz-question{margin-bottom:22px}
.q-text{font-weight:600;font-size:.95rem;margin-bottom:10px;color:#fff;line-height:1.5}
.q-option{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid rgba(255,255,255,.15);border-radius:var(--radius-md);margin-bottom:6px;cursor:pointer;font-size:.88rem;color:rgba(255,255,255,.8);transition:all var(--trans-fast)}
.q-option:hover{border-color:var(--ma-green);background:rgba(118,196,66,.08)}
.q-option.selected{border-color:var(--ma-green);background:rgba(118,196,66,.15);color:#fff;font-weight:500}
.q-option input{accent-color:var(--ma-green)}
.quiz-actions{display:flex;justify-content:flex-end;align-items:center;gap:14px;margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1)}
.answered-count{font-size:.8rem;color:rgba(255,255,255,.55);margin-right:auto}
/* Result */
.quiz-result{text-align:center;padding:10px 0}
.result-ring{width:110px;height:110px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;border:5px solid}
.ring-pass{border-color:var(--ma-green);background:rgba(118,196,66,.1)}
.ring-fail{border-color:#ef4444;background:rgba(239,68,68,.1)}
.result-score{font-family:var(--font-heading);font-size:1.9rem;font-weight:700}
.quiz-result h3{font-family:var(--font-heading);margin-bottom:6px}
.result-detail{font-size:.85rem;color:rgba(255,255,255,.6);margin-bottom:22px}
.quiz-review{text-align:left;background:rgba(255,255,255,.04);border-radius:var(--radius-md);padding:16px;margin-bottom:8px}
.review-q{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07)}
.review-q:last-child{border-bottom:none}
.review-q-header{display:flex;align-items:flex-start;gap:8px;font-size:.85rem;color:rgba(255,255,255,.85);line-height:1.5}
.review-ans{font-size:.78rem;color:rgba(255,255,255,.55);margin:4px 0 0 24px}
.review-ans strong{color:var(--ma-green)}
</style>
