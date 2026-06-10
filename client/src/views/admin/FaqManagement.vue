<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseModal    from '@/components/common/BaseModal.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseInput    from '@/components/common/BaseInput.vue'
import BaseConfirm  from '@/components/common/BaseConfirm.vue'
import { Plus, Pencil, Trash2, Eye, EyeOff, Menu } from 'lucide-vue-next'

const ui = useUiStore()
const items       = ref([])
const loading     = ref(true)
const sidebarOpen = ref(false)
const showForm    = ref(false)
const showDel     = ref(false)
const saving      = ref(false)
const deleting    = ref(false)
const editTarget  = ref(null)

const blank = () => ({ question:'', answer:'', category:'General', sort_order:0, is_published:true })
const form  = ref(blank())

const CATEGORIES = ['General', 'Courses', 'Events', 'Payments', 'Consultation', 'Technical']

const load = async () => {
  loading.value = true
  try { const { data } = await api.get('/faqs'); items.value = data.data || [] }
  catch { ui.toastError('Failed to load FAQs') }
  finally { loading.value = false }
}
onMounted(load)

const openCreate = () => { editTarget.value=null; form.value=blank(); showForm.value=true }
const openEdit   = (i) => { editTarget.value=i; form.value={...i}; showForm.value=true }

const togglePub = async (item) => {
  try {
    await api.put('/faqs/'+item.id, { is_published: item.is_published ? 0 : 1 })
    item.is_published = item.is_published ? 0 : 1
    ui.toast(item.is_published ? 'Published' : 'Hidden')
  } catch { ui.toastError('Failed to update status') }
}

const save = async () => {
  if (!form.value.question || !form.value.answer) { ui.toastError('Question and answer are required'); return }
  saving.value = true
  try {
    if (editTarget.value) { await api.put('/faqs/'+editTarget.value.id, form.value); ui.toast('FAQ updated') }
    else { await api.post('/faqs', form.value); ui.toast('FAQ added') }
    showForm.value = false; load()
  } catch (e) { ui.toastError(e.response?.data?.message || 'Save failed') }
  finally { saving.value = false }
}

const confirmDel = async () => {
  deleting.value = true
  try { await api.delete('/faqs/'+editTarget.value.id); ui.toast('Deleted'); showDel.value=false; load() }
  catch { ui.toastError('Delete failed') }
  finally { deleting.value = false }
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">FAQs</h1>
        <span style="font-size:.82rem;color:var(--ma-text-muted);margin-left:8px">{{ items.length }} total</span>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> Add FAQ</BaseButton>
      </div>

      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:60px;text-align:center"/>

        <div v-else-if="!items.length" style="background:var(--ma-white);border-radius:var(--radius-lg);padding:48px;text-align:center;color:var(--ma-text-muted)">
          No FAQs yet. Add your first one!
        </div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="td-num">#</th>
                <th>Question</th>
                <th>Answer preview</th>
                <th>Category</th>
                <th>Status</th>
                <th class="td-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in items" :key="item.id">
                <td class="td-num">{{ i + 1 }}</td>
                <td style="font-weight:600;color:var(--ma-green-dark);max-width:240px">{{ item.question }}</td>
                <td style="color:var(--ma-text-muted);font-size:.82rem;max-width:260px">
                  {{ item.answer?.slice(0,90) }}{{ item.answer?.length > 90 ? '…' : '' }}
                </td>
                <td><span class="table-badge table-badge--grey">{{ item.category }}</span></td>
                <td>
                  <button @click="togglePub(item)" class="status-toggle" :class="item.is_published?'published':'draft'">
                    <Eye v-if="item.is_published" :size="13"/>
                    <EyeOff v-else :size="13"/>
                    {{ item.is_published ? 'Live' : 'Hidden' }}
                  </button>
                </td>
                <td class="td-actions">
                  <div style="display:flex;gap:6px;justify-content:flex-end">
                    <button @click="openEdit(item)" class="action-btn"><Pencil :size="14"/> Edit</button>
                    <button @click="editTarget=item;showDel=true" class="action-btn danger"><Trash2 :size="14"/></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      <BaseModal title="FAQ" v-if="showForm" @close="showForm=false" size="lg">
        <div class="form-group">
          <label class="form-label">Question <span style="color:var(--ma-red,#e53e3e)">*</span></label>
          <textarea v-model="form.question" class="form-input" rows="2" required
            placeholder="What question are your clients asking?"/>
        </div>
        <div class="form-group">
          <label class="form-label">Answer <span style="color:var(--ma-red,#e53e3e)">*</span></label>
          <textarea v-model="form.answer" class="form-input" rows="5" required
            placeholder="Give a clear, complete answer..."/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select v-model="form.category" class="form-input">
              <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sort order</label>
            <input v-model.number="form.sort_order" type="number" class="form-input" placeholder="0"/>
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;cursor:pointer">
          <input type="checkbox" v-model="form.is_published" style="accent-color:var(--ma-green)"/>
          Publish immediately
        </label>
        <template #footer>
          <button class="btn btn--outline" @click="showForm=false">Cancel</button>
          <BaseButton :loading="saving" @click="save">{{ editTarget ? 'Update' : 'Add' }} FAQ</BaseButton>
        </template>
      </BaseModal>

      <BaseConfirm v-if="showDel"
        title="Delete FAQ"
        message="Delete this FAQ permanently?"
        confirmText="Delete" :danger="true" :loading="deleting"
        @confirm="confirmDel" @cancel="showDel=false"/>
    </div>
    </div>
  </div>
</template>

<style scoped>
.status-toggle{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:600;padding:4px 10px;border-radius:12px;border:1px solid;cursor:pointer;background:none;white-space:nowrap}
.status-toggle.published{color:#155724;border-color:#a3d9a5;background:#d4edda}
.status-toggle.draft{color:var(--ma-text-muted);border-color:var(--ma-border);background:var(--ma-off-white)}
</style>
