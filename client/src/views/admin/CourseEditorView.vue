<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import api from '@/services/api'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseModal    from '@/components/common/BaseModal.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseInput    from '@/components/common/BaseInput.vue'
import BaseConfirm  from '@/components/common/BaseConfirm.vue'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, GripVertical, Video, FileText, Menu, HelpCircle, X } from 'lucide-vue-next'

const route  = useRoute()
const ui     = useUiStore()
const course = ref(null)
const modules= ref([])
const loading= ref(true)
const sidebarOpen = ref(false)
const saving = ref(false)

/* Modal state */
const modModal = ref(false); const modForm = ref({ title:'', description:'' }); const modEdit = ref(null)
const lesModal = ref(false); const lesForm = ref({ title:'', drive_file_id:'', video_type:'drive', content:'', duration_min:0 }); const lesEdit = ref(null); const lesModId = ref(null)
const delTarget= ref(null); const delType = ref(null); const showDel = ref(false); const deleting = ref(false)
const openMod  = ref(null)

const fetchCourse = async () => {
  loading.value = true
  try {
    const { data: d } = await api.get('/enrollments/my')
    const { data } = await api.get(`/courses?page=1&limit=100`)
    course.value = data.data.find(c => c.id == route.params.id) || null
    if (!course.value) { const { data: d2 } = await api.get(`/courses/${route.params.id}`); course.value = d2.data }
    const { data: m } = await api.get(`/modules?course_id=${route.params.id}`)
    modules.value = m.data
  } finally { loading.value = false }
}
onMounted(fetchCourse)

/* Module */
const openModCreate = () => { modEdit.value=null; modForm.value={title:'',description:''}; modModal.value=true }
const openModEdit   = (m) => { modEdit.value=m; modForm.value={title:m.title,description:m.description||''}; modModal.value=true }
const saveModule = async () => {
  if (!modForm.value.title) { ui.toastError('Title required'); return }
  saving.value=true
  try {
    if (modEdit.value) { await api.put(`/modules/${modEdit.value.id}`, modForm.value); ui.toast('Module updated') }
    else { await api.post('/modules', { course_id: route.params.id, ...modForm.value }); ui.toast('Module added') }
    modModal.value=false; fetchCourse()
  } finally { saving.value=false }
}

/* Lesson */
const openLesCreate = (modId) => { lesModId.value=modId; lesEdit.value=null; lesForm.value={title:'',drive_file_id:'',video_type:'drive',content:'',duration_min:0}; lesModal.value=true }
const openLesEdit   = (l, modId) => { lesModId.value=modId; lesEdit.value=l; lesForm.value={title:l.title,drive_file_id:l.drive_file_id||'',video_type:l.video_type||'drive',content:l.content||'',duration_min:l.duration_min||0}; lesModal.value=true }
const saveLesson = async () => {
  if (!lesForm.value.title) { ui.toastError('Title required'); return }
  saving.value=true
  try {
    if (lesEdit.value) { await api.put(`/lessons/${lesEdit.value.id}`, lesForm.value); ui.toast('Lesson updated') }
    else { await api.post('/lessons', { module_id: lesModId.value, ...lesForm.value }); ui.toast('Lesson added') }
    lesModal.value=false; fetchCourse()
  } finally { saving.value=false }
}

/* Delete */
const confirmDelete = async () => {
  deleting.value=true
  try {
    if (delType.value==='module') await api.delete(`/modules/${delTarget.value.id}`)
    else await api.delete(`/lessons/${delTarget.value.id}`)
    ui.toast('Deleted'); showDel.value=false; fetchCourse()
  } finally { deleting.value=false }
}

const extractVideoId = (input) => {
  if (!input) return
  // Google Drive: /d/{id}/ or ?id={id}
  let m = input.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || input.match(/[?&]id=([a-zA-Z0-9_-]{20,})/)
  if (m) {
    lesForm.value.drive_file_id = m[1]
    lesForm.value.video_type = 'drive'
    ui.toast('Google Drive video ID extracted')
    return
  }
  // YouTube: watch?v=, youtu.be/, shorts/, embed/, live/
  m = input.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (m) {
    lesForm.value.drive_file_id = m[1]
    lesForm.value.video_type = 'youtube'
    ui.toast('YouTube video ID extracted')
    return
  }
  // Bare 11-char YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    lesForm.value.drive_file_id = input.trim()
    lesForm.value.video_type = 'youtube'
    ui.toast('Treated as YouTube video ID')
    return
  }
  ui.toastError('Could not recognise a Drive or YouTube link')
}

/*  Quiz builder  */
const quizModal   = ref(false)
const quizModule  = ref(null)
const quizLoading = ref(false)
const quizSaving  = ref(false)
const quizForm    = ref({ title: '', pass_score: 70, questions: [] })

const blankQuestion = () => ({ question: '', options: ['', '', '', ''], correct_index: 0 })

const openQuizBuilder = async (mod) => {
  quizModule.value = mod
  quizModal.value  = true
  quizLoading.value = true
  try {
    const { data } = await api.get(`/evaluations/module/${mod.id}`)
    if (data.data) {
      quizForm.value = {
        title:      data.data.title,
        pass_score: data.data.pass_score,
        questions:  data.data.questions.map(q => ({
          question: q.question, options: [...q.options], correct_index: q.correct_index
        }))
      }
    } else {
      quizForm.value = { title: `${mod.title} — Quiz`, pass_score: 70, questions: [blankQuestion()] }
    }
  } catch { ui.toastError('Failed to load quiz') }
  finally { quizLoading.value = false }
}

const addQuestion    = () => quizForm.value.questions.push(blankQuestion())
const removeQuestion = (qi) => quizForm.value.questions.splice(qi, 1)
const addOption      = (q)  => q.options.push('')
const removeOption   = (q, oi) => {
  q.options.splice(oi, 1)
  if (q.correct_index >= q.options.length) q.correct_index = 0
}

const saveQuiz = async () => {
  const f = quizForm.value
  if (!f.title.trim())          { ui.toastError('Quiz title is required'); return }
  if (!f.questions.length)      { ui.toastError('Add at least one question'); return }
  for (const [i, q] of f.questions.entries()) {
    if (!q.question.trim())     { ui.toastError(`Question ${i+1} text is empty`); return }
    const filled = q.options.filter(o => o.trim())
    if (filled.length < 2)      { ui.toastError(`Question ${i+1} needs at least 2 options`); return }
    if (!q.options[q.correct_index]?.trim()) { ui.toastError(`Question ${i+1}: correct answer is empty`); return }
  }
  quizSaving.value = true
  try {
    await api.post('/evaluations', {
      module_id:  quizModule.value.id,
      title:      f.title.trim(),
      pass_score: Number(f.pass_score) || 70,
      questions:  f.questions.map(q => ({
        question: q.question.trim(),
        options:  q.options.filter(o => o.trim()),
        correct_index: q.options.filter(o => o.trim()).indexOf(q.options[q.correct_index])
      }))
    })
    ui.toast('Quiz saved')
    quizModal.value = false
  } catch (e) {
    ui.toastError(e.response?.data?.message || 'Save failed')
  } finally { quizSaving.value = false }
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">{{ course?.title || 'Course Editor' }}</h1>
        <BaseButton @click="openModCreate" style="margin-left:auto"><Plus :size="16"/> Add Module</BaseButton>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:60px"/>
        <div v-else>
          <div v-if="!modules.length" class="empty-state">
            <FileText :size="48" color="var(--ma-border)"/>
            <p>No modules yet. Add the first module to start building your course.</p>
            <BaseButton @click="openModCreate"><Plus :size="16"/> Add Module</BaseButton>
          </div>
          <div v-else class="modules-list">
            <div v-for="(mod, mi) in modules" :key="mod.id" class="module-card">
              <!-- Module header -->
              <div class="module-header">
                <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
                  <GripVertical :size="18" color="var(--ma-text-muted)" style="cursor:grab;flex-shrink:0"/>
                  <div>
                    <p style="font-weight:700;color:var(--ma-green-dark);margin:0">Module {{ mi+1 }}: {{ mod.title }}</p>
                    <p v-if="mod.description" style="font-size:.8rem;color:var(--ma-text-muted);margin:2px 0 0">{{ mod.description }}</p>
                  </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                  <span style="font-size:.78rem;color:var(--ma-text-muted)">{{ mod.lessons?.length||0 }} lessons</span>
                  <button @click="openQuizBuilder(mod)" class="action-btn" title="Module quiz"><HelpCircle :size="15"/> Quiz</button>
                  <button @click="openModEdit(mod)" class="action-btn"><Pencil :size="15"/></button>
                  <button @click="delTarget=mod;delType='module';showDel=true" class="action-btn danger"><Trash2 :size="15"/></button>
                  <button @click="openMod=openMod===mi?null:mi" class="action-btn">
                    <ChevronDown v-if="openMod!==mi" :size="15"/> <ChevronUp v-else :size="15"/>
                  </button>
                </div>
              </div>

              <!-- Lessons -->
              <div v-show="openMod===mi" class="lessons-area">
                <div v-for="lesson in mod.lessons" :key="lesson.id" class="lesson-row">
                  <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
                    <Video :size="16" color="var(--ma-green-mid)" style="flex-shrink:0"/>
                    <div>
                      <p style="font-weight:500;margin:0;font-size:.875rem">{{ lesson.title }}</p>
                      <p style="font-size:.75rem;color:var(--ma-text-muted);margin:0">
                        {{ lesson.drive_file_id ? (lesson.video_type === 'youtube' ? 'YouTube video attached' : 'Drive video attached') : 'No video yet' }}
                        {{ lesson.duration_min ? ' · '+lesson.duration_min+' min' : '' }}
                      </p>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px">
                    <button @click="openLesEdit(lesson, mod.id)" class="action-btn"><Pencil :size="14"/> Edit</button>
                    <button @click="delTarget=lesson;delType='lesson';showDel=true" class="action-btn danger"><Trash2 :size="14"/></button>
                  </div>
                </div>

                <button @click="openLesCreate(mod.id)" class="add-lesson-btn">
                  <Plus :size="16"/> Add Lesson to this Module
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Module modal -->
  <BaseModal :title="modEdit?'Edit Module':'New Module'" @close="modModal=false" v-if="modModal">
    <BaseInput v-model="modForm.title" label="Module title" placeholder="e.g. Understanding Communication" required/>
    <div class="form-group">
      <label class="form-label">Description (optional)</label>
      <textarea v-model="modForm.description" class="form-input" rows="2" placeholder="Brief overview…"></textarea>
    </div>
    <template #footer>
      <BaseButton variant="outline" @click="modModal=false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="saveModule">{{ modEdit?'Save':'Add Module' }}</BaseButton>
    </template>
  </BaseModal>

  <!-- Lesson modal -->
  <BaseModal :title="lesEdit?'Edit Lesson':'New Lesson'" size="lg" @close="lesModal=false" v-if="lesModal">
    <BaseInput v-model="lesForm.title" label="Lesson title" placeholder="e.g. The 5 Love Languages" required/>

    <div class="form-group">
      <label class="form-label">Lesson Video <span style="font-weight:400;color:var(--ma-text-muted)">(Google Drive or YouTube)</span></label>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <label class="vt-pill" :class="{active: lesForm.video_type==='drive'}">
          <input type="radio" value="drive" v-model="lesForm.video_type" style="display:none"/> Google Drive
        </label>
        <label class="vt-pill" :class="{active: lesForm.video_type==='youtube'}">
          <input type="radio" value="youtube" v-model="lesForm.video_type" style="display:none"/> YouTube
        </label>
      </div>
      <div style="display:flex;gap:8px">
        <input v-model="lesForm.drive_file_id" class="form-input" placeholder="Paste a Drive share link, YouTube link, or raw video ID"/>
        <BaseButton variant="outline" size="sm" @click="extractVideoId(lesForm.drive_file_id)" style="white-space:nowrap">Extract ID</BaseButton>
      </div>
      <p style="font-size:.78rem;color:var(--ma-text-muted);margin-top:4px">
        Drive: set the file to "Anyone with link → Viewer" and turn OFF download in share settings.
        YouTube: upload as <strong>Unlisted</strong> (not Public, not Private). The link is never exposed to non-enrolled visitors.
      </p>
      <div v-if="lesForm.drive_file_id && !lesForm.drive_file_id.includes('/')" style="margin-top:8px;border-radius:8px;overflow:hidden;aspect-ratio:16/9">
        <iframe
          :src="lesForm.video_type==='youtube'
            ? `https://www.youtube-nocookie.com/embed/${lesForm.drive_file_id}`
            : `https://drive.google.com/file/d/${lesForm.drive_file_id}/preview`"
          style="width:100%;height:100%;border:none" allowfullscreen/>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Lesson notes / transcript (optional)</label>
      <textarea v-model="lesForm.content" class="form-input" rows="4" placeholder="Additional reading material, key points…"></textarea>
    </div>
    <BaseInput v-model="lesForm.duration_min" label="Duration (minutes)" type="number" placeholder="15"/>
    <template #footer>
      <BaseButton variant="outline" @click="lesModal=false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="saveLesson">{{ lesEdit?'Save Lesson':'Add Lesson' }}</BaseButton>
    </template>
  </BaseModal>

  <!-- Delete confirm -->
  <BaseConfirm v-if="showDel"
    :title="`Delete ${delType}`"
    :message="`Delete &quot;${delTarget?.title}&quot;? This cannot be undone.`"
    confirmText="Delete" :danger="true" :loading="deleting"
    @confirm="confirmDelete" @cancel="showDel=false"/>

  <!-- Quiz builder -->
  <BaseModal v-if="quizModal" :title="`Quiz — ${quizModule?.title}`" size="lg" @close="quizModal=false">
    <BaseLoader v-if="quizLoading" style="padding:40px"/>
    <div v-else class="quiz-builder">
      <div style="display:grid;grid-template-columns:1fr 140px;gap:12px;margin-bottom:18px">
        <BaseInput v-model="quizForm.title" label="Quiz title" placeholder="Module Quiz" required/>
        <BaseInput v-model="quizForm.pass_score" label="Pass score (%)" type="number" placeholder="70"/>
      </div>

      <div v-for="(q, qi) in quizForm.questions" :key="qi" class="quiz-q-card">
        <div class="quiz-q-header">
          <span class="quiz-q-num">Q{{ qi+1 }}</span>
          <button v-if="quizForm.questions.length>1" @click="removeQuestion(qi)" class="action-btn danger" title="Remove question">
            <Trash2 :size="14"/>
          </button>
        </div>

        <div class="form-group" style="margin-bottom:12px">
          <textarea v-model="q.question" class="form-input" rows="2" placeholder="Type the question…"></textarea>
        </div>

        <div class="quiz-options">
          <div v-for="(opt, oi) in q.options" :key="oi" class="quiz-opt-row">
            <input
              type="radio"
              :name="`correct-${qi}`"
              :checked="q.correct_index===oi"
              @change="q.correct_index=oi"
              title="Mark as correct answer"
            />
            <input
              v-model="q.options[oi]"
              class="form-input"
              :placeholder="`Option ${oi+1}${q.correct_index===oi ? ' (correct)' : ''}`"
              :class="{ 'opt-correct': q.correct_index===oi }"
            />
            <button v-if="q.options.length>2" @click="removeOption(q, oi)" class="action-btn danger" title="Remove option">
              <X :size="13"/>
            </button>
          </div>
          <button @click="addOption(q)" class="add-opt-btn" v-if="q.options.length<6">
            <Plus :size="13"/> Add option
          </button>
        </div>
      </div>

      <button @click="addQuestion" class="add-lesson-btn" style="margin-top:4px">
        <Plus :size="16"/> Add Question
      </button>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--ma-border)">
        <button class="btn btn--outline" @click="quizModal=false">Cancel</button>
        <BaseButton :loading="quizSaving" @click="saveQuiz">Save Quiz</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.admin-layout{display:flex;min-height:100vh}
.admin-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.admin-topbar{background:var(--ma-white);border-bottom:1px solid var(--ma-border);padding:0 24px;height:60px;display:flex;align-items:center;gap:16px;flex-shrink:0}
.topbar-toggle{color:var(--ma-text);display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px}
.topbar-toggle:hover{background:var(--ma-green-tint)}
.topbar-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.admin-content{flex:1;padding:24px;background:var(--ma-off-white);overflow-y:auto}
.empty-state{text-align:center;padding:60px;display:flex;flex-direction:column;align-items:center;gap:16px}
.modules-list{display:flex;flex-direction:column;gap:16px}
.module-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);overflow:hidden}
.module-header{display:flex;align-items:center;padding:16px 20px;gap:12px;background:var(--ma-green-tint)}
.lessons-area{padding:12px 16px;border-top:1px solid var(--ma-border);display:flex;flex-direction:column;gap:4px}
.lesson-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;transition:background var(--trans-fast)}
.lesson-row:hover{background:var(--ma-off-white)}
.add-lesson-btn{display:flex;align-items:center;gap:8px;margin-top:8px;padding:10px 16px;border:2px dashed var(--ma-border);border-radius:8px;background:none;color:var(--ma-text-muted);font-size:.875rem;cursor:pointer;width:100%;justify-content:center;transition:all var(--trans-fast)}
.add-lesson-btn:hover{border-color:var(--ma-green);color:var(--ma-green-deep);background:var(--ma-green-tint)}
.action-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:6px;font-size:.78rem;background:var(--ma-white);color:var(--ma-text);border:1px solid var(--ma-border);cursor:pointer;transition:all var(--trans-fast)}
.action-btn:hover{background:var(--ma-green-tint);color:var(--ma-green-deep);border-color:var(--ma-green)}
.action-btn.danger:hover{background:#fce8e8;color:#D32F2F;border-color:#D32F2F}
.vt-pill{padding:5px 16px;border-radius:16px;border:1px solid var(--ma-border);font-size:.8rem;cursor:pointer;color:var(--ma-text-muted);transition:all .15s}
.vt-pill.active{background:var(--ma-green);color:#fff;border-color:var(--ma-green);font-weight:600}
/* Quiz builder */
.quiz-q-card{background:var(--ma-off-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);padding:16px;margin-bottom:14px}
.quiz-q-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.quiz-q-num{font-weight:700;font-size:.85rem;color:var(--ma-green-deep);background:var(--ma-green-tint);padding:2px 10px;border-radius:10px}
.quiz-options{display:flex;flex-direction:column;gap:8px}
.quiz-opt-row{display:flex;align-items:center;gap:8px}
.quiz-opt-row input[type=radio]{accent-color:var(--ma-green);width:16px;height:16px;flex-shrink:0;cursor:pointer}
.opt-correct{border-color:var(--ma-green) !important;background:#f0fdf4}
.add-opt-btn{display:inline-flex;align-items:center;gap:4px;font-size:.78rem;color:var(--ma-green-deep);background:none;border:1px dashed var(--ma-border);border-radius:var(--radius-md);padding:6px 12px;cursor:pointer;align-self:flex-start}
.add-opt-btn:hover{border-color:var(--ma-green);background:var(--ma-green-tint)}
</style>
