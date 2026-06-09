<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseModal    from '@/components/common/BaseModal.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseConfirm  from '@/components/common/BaseConfirm.vue'
import { Plus, Pencil, Trash2, Eye, EyeOff, Menu } from 'lucide-vue-next'

const ui=useUiStore(); const items=ref([]); const loading=ref(true); const sidebarOpen=ref(false)
const showForm=ref(false); const showDel=ref(false); const saving=ref(false); const deleting=ref(false); const editTarget=ref(null)
const blank = () => ({ question:'', answer:'', category:'General' })
const form  = ref(blank())

const fetchAll = async () => { loading.value=true; try { const {data}=await api.get('/faqs'); items.value=data.data } finally { loading.value=false } }
onMounted(fetchAll)

const openCreate = () => { editTarget.value=null; form.value=blank(); showForm.value=true }
const openEdit   = (i) => { editTarget.value=i; form.value={...i}; showForm.value=true }
const togglePub  = async (i) => { await api.put('/faqs/'+i.id, { is_published: i.is_published?0:1 }); ui.toast('Updated'); fetchAll() }
const save = async () => {
  if (!form.value.question || !form.value.answer) { ui.toastError('Question and answer required'); return }
  saving.value=true
  try {
    if (editTarget.value) { await api.put('/faqs/'+editTarget.value.id, form.value); ui.toast('Updated') }
    else { await api.post('/faqs', form.value); ui.toast('FAQ added') }
    showForm.value=false; fetchAll()
  } finally { saving.value=false }
}
const confirmDel = async () => { deleting.value=true; try { await api.delete('/faqs/'+editTarget.value.id); ui.toast('Deleted'); showDel.value=false; fetchAll() } finally { deleting.value=false } }
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">FAQs</h1>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> Add FAQ</BaseButton>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:40px"/>
        <div v-else class="items-list">
          <div v-if="!items.length" style="text-align:center;padding:40px;background:var(--ma-white);border-radius:var(--radius-lg)"><p style="color:var(--ma-text-muted)">No FAQs yet.</p></div>
          <div v-for="item in items" :key="item.id" class="item-row">
            <div style="flex:1;min-width:0">
              <p style="font-weight:600;color:var(--ma-green-dark);margin:0">{{ item.question }}</p>
              <p style="font-size:.82rem;color:var(--ma-text-muted);margin:3px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.answer }}</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="badge badge--green" style="font-size:.72rem">{{ item.category }}</span>
              <button @click="togglePub(item)" class="status-toggle" :class="item.is_published?'published':'draft'">
                <Eye v-if="item.is_published" :size="14"/> <EyeOff v-else :size="14"/>
              </button>
              <button @click="openEdit(item)" class="action-btn"><Pencil :size="14"/></button>
              <button @click="editTarget=item;showDel=true" class="action-btn danger"><Trash2 :size="14"/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <BaseModal title="FAQ" size="lg" @close="showForm=false" v-if="showForm">
    <div class="form-group"><label class="form-label">Question</label><textarea v-model="form.question" class="form-input" rows="2" required/></div>
    <div class="form-group"><label class="form-label">Answer</label><textarea v-model="form.answer" class="form-input" rows="5" required/></div>
    <div class="form-group">
      <label class="form-label">Category</label>
      <select v-model="form.category" class="form-input"><option>General</option><option>Courses</option><option>Events</option><option>Payments</option></select>
    </div>
    <template #footer>
      <BaseButton variant="outline" @click="showForm=false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="save">Save FAQ</BaseButton>
    </template>
  </BaseModal>
  <BaseConfirm v-if="showDel" title="Delete FAQ" message="Delete this FAQ permanently?" confirmText="Delete" :danger="true" :loading="deleting" @confirm="confirmDel" @cancel="showDel=false"/>
</template>
<style scoped>
.admin-layout{display:flex;min-height:100vh}.admin-main{flex:1;display:flex;flex-direction:column;min-width:0}
.admin-topbar{background:var(--ma-white);border-bottom:1px solid var(--ma-border);padding:0 24px;height:60px;display:flex;align-items:center;gap:16px;flex-shrink:0}
.topbar-toggle{color:var(--ma-text);display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px}.topbar-toggle:hover{background:var(--ma-green-tint)}
.topbar-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin:0}
.admin-content{flex:1;padding:24px;background:var(--ma-off-white);overflow-y:auto}
.items-list{display:flex;flex-direction:column;gap:10px}
.item-row{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);padding:14px 16px;display:flex;align-items:center;gap:16px}
.status-toggle{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:.78rem;font-weight:600;cursor:pointer;border:none}
.status-toggle.published{background:var(--ma-green-tint);color:var(--ma-green-deep)}.status-toggle.draft{background:var(--ma-off-white);color:var(--ma-text-muted);border:1px solid var(--ma-border)}
.action-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:6px;font-size:.78rem;background:var(--ma-off-white);border:1px solid var(--ma-border);cursor:pointer;transition:all var(--trans-fast)}
.action-btn:hover{background:var(--ma-green-tint);color:var(--ma-green-deep)}.action-btn.danger:hover{background:#fce8e8;color:#D32F2F;border-color:#D32F2F}
</style>
