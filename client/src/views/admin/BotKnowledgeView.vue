<script setup>
import { ref, onMounted } from 'vue'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseModal    from '@/components/common/BaseModal.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseInput    from '@/components/common/BaseInput.vue'
import BaseConfirm  from '@/components/common/BaseConfirm.vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import { Menu, Plus, Pencil, Trash2, Sparkles, Eye, EyeOff, Send } from 'lucide-vue-next'

const ui = useUiStore()
const sidebarOpen = ref(false)
const loading   = ref(true)
const entries   = ref([])
const showForm  = ref(false)
const editTarget= ref(null)
const saving    = ref(false)
const delTarget = ref(null)
const deleting  = ref(false)
const form      = ref({ topic: '', keywords: '', answer: '', is_active: true })

/* Test chat */
const testInput  = ref('')
const testResult = ref(null)
const testing    = ref(false)

onMounted(fetchAll)

async function fetchAll () {
  loading.value = true
  try {
    const { data } = await api.get('/bot/knowledge')
    entries.value = data.data || []
  } catch { ui.toastError('Failed to load knowledge base') }
  finally { loading.value = false }
}

const openCreate = () => {
  editTarget.value = null
  form.value = { topic: '', keywords: '', answer: '', is_active: true }
  showForm.value = true
}
const openEdit = (e) => {
  editTarget.value = e
  form.value = { topic: e.topic, keywords: e.keywords, answer: e.answer, is_active: !!e.is_active }
  showForm.value = true
}

async function save () {
  const f = form.value
  if (!f.topic.trim() || !f.keywords.trim() || !f.answer.trim()) {
    ui.toastError('Topic, keywords, and answer are all required'); return
  }
  saving.value = true
  try {
    if (editTarget.value) {
      await api.put(`/bot/knowledge/${editTarget.value.id}`, f)
      ui.toast('Knowledge updated')
    } else {
      await api.post('/bot/knowledge', f)
      ui.toast('Knowledge added — Muzzamil just got smarter! ')
    }
    showForm.value = false
    fetchAll()
  } catch (e) { ui.toastError(e.response?.data?.message || 'Save failed') }
  finally { saving.value = false }
}

async function toggleActive (e) {
  await api.put(`/bot/knowledge/${e.id}`, { ...e, is_active: !e.is_active })
  e.is_active = e.is_active ? 0 : 1
  ui.toast(e.is_active ? 'Entry activated' : 'Entry deactivated')
}

async function confirmDelete () {
  deleting.value = true
  try {
    await api.delete(`/bot/knowledge/${delTarget.value.id}`)
    entries.value = entries.value.filter(x => x.id !== delTarget.value.id)
    ui.toast('Knowledge deleted')
  } finally { deleting.value = false; delTarget.value = null }
}

async function runTest () {
  if (!testInput.value.trim()) return
  testing.value = true
  testResult.value = null
  try {
    const { data } = await api.post('/bot/ask', { message: testInput.value })
    testResult.value = data.data
  } catch { ui.toastError('Test failed') }
  finally { testing.value = false }
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false" />

    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title" style="display:flex;align-items:center;gap:8px">
          <Sparkles :size="20" color="var(--ma-green)"/> Muzzamil Knowledge Base
        </h1>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> Add Knowledge</BaseButton>
      </div>

      <div class="admin-content">
        <!-- How it works -->
        <div class="info-banner">
          <strong>How Muzzamil works:</strong> when a visitor asks a question, Muzzamil matches their
          message against the <em>keywords</em> of each entry below and replies with the best-matching
          <em>answer</em>. If nothing matches, it falls back to searching your published FAQs.
          Keywords are comma-separated — include synonyms and common misspellings for better matches.
        </div>

        <!-- Live test -->
        <div class="test-card">
          <p class="test-title"> Test Muzzamil</p>
          <form class="test-row" @submit.prevent="runTest">
            <input v-model="testInput" class="form-input" placeholder="Type a question a visitor might ask…" style="flex:1"/>
            <BaseButton :loading="testing" type="submit"><Send :size="14"/> Test</BaseButton>
          </form>
          <div v-if="testResult" class="test-result">
            <p class="test-meta">
              Matched: <strong>{{ testResult.topic || '— no match —' }}</strong>
              <span class="source-tag" :class="`source-${testResult.source}`">{{ testResult.source }}</span>
            </p>
            <p class="test-answer">{{ testResult.answer }}</p>
          </div>
        </div>

        <BaseLoader v-if="loading" style="padding:60px"/>

        <div v-else-if="!entries.length" style="padding:60px;text-align:center;color:var(--ma-text-muted)">
          <Sparkles :size="40" color="var(--ma-border)"/>
          <p style="margin-top:10px">No knowledge yet. Add your first entry to bring Muzzamil to life!</p>
        </div>

        <!-- Knowledge table -->
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Topic</th><th>Keywords</th><th>Answer Preview</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="e in entries" :key="e.id" :class="{'row-inactive': !e.is_active}">
                <td class="td-topic">{{ e.topic }}</td>
                <td class="td-keywords">
                  <span v-for="(kw, i) in e.keywords.split(',').slice(0,5)" :key="i" class="kw-chip">{{ kw.trim() }}</span>
                  <span v-if="e.keywords.split(',').length > 5" class="kw-more">+{{ e.keywords.split(',').length - 5 }}</span>
                </td>
                <td class="td-answer">{{ e.answer.slice(0, 90) }}…</td>
                <td>
                  <button class="status-toggle" :class="e.is_active ? 'on' : 'off'" @click="toggleActive(e)">
                    <component :is="e.is_active ? Eye : EyeOff" :size="13"/>
                    {{ e.is_active ? 'Active' : 'Off' }}
                  </button>
                </td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="action-btn" @click="openEdit(e)"><Pencil :size="14"/></button>
                    <button class="action-btn danger" @click="delTarget=e"><Trash2 :size="14"/></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit modal -->
    <BaseModal v-if="showForm" :title="editTarget ? 'Edit Knowledge' : 'Add Knowledge'" size="lg" @close="showForm=false">
      <BaseInput v-model="form.topic" label="Topic" placeholder="e.g. Refund Policy" required/>
      <div class="form-group">
        <label class="form-label">Trigger keywords <span style="font-weight:400;color:var(--ma-text-muted)">(comma-separated)</span></label>
        <textarea v-model="form.keywords" class="form-input" rows="2"
          placeholder="refund,money back,return,cancel,guarantee"></textarea>
        <p class="form-hint">When a visitor's message contains any of these words, this answer is a candidate. More specific multi-word keywords rank higher.</p>
      </div>
      <div class="form-group">
        <label class="form-label">Muzzamil's answer</label>
        <textarea v-model="form.answer" class="form-input" rows="5"
          placeholder="Write the reply Muzzamil should give…"></textarea>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;margin-bottom:16px;cursor:pointer">
        <input type="checkbox" v-model="form.is_active" style="accent-color:var(--ma-green)"/> Active
      </label>
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn--outline" @click="showForm=false">Cancel</button>
        <BaseButton :loading="saving" @click="save">{{ editTarget ? 'Update' : 'Add Knowledge' }}</BaseButton>
      </div>
    </BaseModal>

    <BaseConfirm v-if="delTarget"
      title="Delete Knowledge"
      :message="`Delete '${delTarget.topic}'? Muzzamil will no longer answer questions on this topic.`"
      confirmText="Delete" :danger="true" :loading="deleting"
      @confirm="confirmDelete" @cancel="delTarget=null"/>
  </div>
</template>

<style scoped>
.info-banner{background:var(--ma-green-tint);border:1px solid var(--ma-green);border-radius:var(--radius-md);padding:14px 18px;font-size:.85rem;line-height:1.6;color:var(--ma-green-dark);margin-bottom:20px}
/* Test card */
.test-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:18px;margin-bottom:24px}
.test-title{font-weight:700;color:var(--ma-green-dark);margin-bottom:10px;font-size:.9rem}
.test-row{display:flex;gap:10px}
.test-result{margin-top:14px;padding:12px 16px;background:var(--ma-off-white);border-radius:var(--radius-md);border-left:3px solid var(--ma-green)}
.test-meta{font-size:.78rem;color:var(--ma-text-muted);margin-bottom:6px;display:flex;align-items:center;gap:8px}
.source-tag{font-size:.68rem;font-weight:700;padding:1px 8px;border-radius:8px;text-transform:uppercase}
.source-knowledge{background:#d4edda;color:#155724}
.source-faq{background:#fff3cd;color:#856900}
.source-fallback{background:#f8d7da;color:#721c24}
.test-answer{font-size:.88rem;line-height:1.6;white-space:pre-line}
/* Table */
.table-wrap{overflow-x:auto;background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg)}
.data-table{width:100%;border-collapse:collapse;font-size:.85rem}
.data-table th{padding:10px 14px;text-align:left;font-size:.74rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--ma-text-muted);border-bottom:1px solid var(--ma-border);background:var(--ma-off-white)}
.data-table td{padding:12px 14px;border-bottom:1px solid var(--ma-border);vertical-align:top}
.data-table tr:last-child td{border-bottom:none}
.row-inactive{opacity:.5}
.td-topic{font-weight:600;color:var(--ma-green-dark);white-space:nowrap}
.td-keywords{max-width:240px}
.kw-chip{display:inline-block;font-size:.7rem;background:var(--ma-green-tint);color:var(--ma-green-deep);padding:1px 8px;border-radius:8px;margin:0 3px 3px 0}
.kw-more{font-size:.7rem;color:var(--ma-text-muted)}
.td-answer{color:var(--ma-text-muted);font-size:.8rem;max-width:300px}
.status-toggle{display:inline-flex;align-items:center;gap:4px;font-size:.74rem;font-weight:600;padding:3px 10px;border-radius:12px;border:1px solid;cursor:pointer;background:none}
.status-toggle.on{color:#155724;border-color:#a3d9a5;background:#d4edda}
.status-toggle.off{color:var(--ma-text-muted);border-color:var(--ma-border);background:var(--ma-off-white)}
</style>
