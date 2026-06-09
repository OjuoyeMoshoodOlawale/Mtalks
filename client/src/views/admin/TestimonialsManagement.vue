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

const ui=useUiStore(); const items=ref([]); const loading=ref(true); const sidebarOpen=ref(false)
const showForm=ref(false); const showDel=ref(false); const saving=ref(false); const deleting=ref(false); const editTarget=ref(null)
const blank = () => ({ client_name:'', content:'', rating:5, client_photo:'', source:'manual' })
const form  = ref(blank())

const fetchAll = async () => { loading.value=true; try { const {data}=await api.get('/testimonials'); items.value=data.data } finally { loading.value=false } }
onMounted(fetchAll)

const openCreate = () => { editTarget.value=null; form.value=blank(); showForm.value=true }
const openEdit   = (i) => { editTarget.value=i; form.value={...i}; showForm.value=true }
const togglePub  = async (i) => { await api.put('/testimonials/'+i.id, { is_published: i.is_published?0:1 }); ui.toast('Updated'); fetchAll() }
const save = async () => {
  if (!form.value.client_name || !form.value.content) { ui.toastError('Name and testimonial required'); return }
  saving.value=true
  try {
    if (editTarget.value) { await api.put('/testimonials/'+editTarget.value.id, form.value); ui.toast('Updated') }
    else { await api.post('/testimonials', form.value); ui.toast('Added') }
    showForm.value=false; fetchAll()
  } finally { saving.value=false }
}
const confirmDel = async () => { deleting.value=true; try { await api.delete('/testimonials/'+editTarget.value.id); ui.toast('Deleted'); showDel.value=false; fetchAll() } finally { deleting.value=false } }
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Testimonials</h1>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> Add Testimonial</BaseButton>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:40px"/>
        <div v-else class="items-list">
          <div v-if="!items.length" style="text-align:center;padding:40px;background:var(--ma-white);border-radius:var(--radius-lg)"><p style="color:var(--ma-text-muted)">No testimonials yet.</p></div>
          <div v-for="item in items" :key="item.id" class="item-row">
            <div style="flex:1;min-width:0">
              <p style="font-weight:600;color:var(--ma-green-dark);margin:0">{{ item.client_name }}</p>
              <p style="font-size:.82rem;color:var(--ma-text-muted);margin:3px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">"{{ item.content }}"</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <button @click="togglePub(item)" class="status-toggle" :class="item.is_published?'published':'draft'">
                <Eye v-if="item.is_published" :size="14"/> <EyeOff v-else :size="14"/>
                {{ item.is_published?'Live':'Hidden' }}
              </button>
              <button @click="openEdit(item)" class="action-btn"><Pencil :size="14"/></button>
              <button @click="editTarget=item;showDel=true" class="action-btn danger"><Trash2 :size="14"/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <BaseModal title="Testimonial" @close="showForm=false" v-if="showForm">
    <BaseInput v-model="form.client_name" label="Client name" required/>
    <div class="form-group"><label class="form-label">Testimonial text</label><textarea v-model="form.content" class="form-input" rows="4" required/></div>
    <BaseInput v-model="form.client_photo" label="Client photo URL (optional)" placeholder="https://…"/>
    <div class="form-group">
      <label class="form-label">Rating</label>
      <select v-model="form.rating" class="form-input"><option v-for="n in 5" :key="n" :value="n">{{ n }} star{{ n>1?'s':'' }}</option></select>
    </div>
    <template #footer>
      <BaseButton variant="outline" @click="showForm=false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="save">Save</BaseButton>
    </template>
  </BaseModal>
  <BaseConfirm v-if="showDel" title="Delete testimonial" message="Delete this testimonial permanently?" confirmText="Delete" :danger="true" :loading="deleting" @confirm="confirmDel" @cancel="showDel=false"/>
</template>

<style scoped>
.admin-layout{display:flex;min-height:100vh}.admin-main{flex:1;display:flex;flex-direction:column;min-width:0}
.admin-topbar{background:var(--ma-white);border-bottom:1px solid var(--ma-border);padding:0 24px;height:60px;display:flex;align-items:center;gap:16px;flex-shrink:0}
.topbar-toggle{color:var(--ma-text);display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px}.topbar-toggle:hover{background:var(--ma-green-tint)}
.topbar-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin:0}
.admin-content{flex:1;padding:24px;background:var(--ma-off-white);overflow-y:auto}
.items-list{display:flex;flex-direction:column;gap:10px}
.item-row{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);padding:14px 16px;display:flex;align-items:center;gap:16px}
.status-toggle{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;cursor:pointer;border:none}
.status-toggle.published{background:var(--ma-green-tint);color:var(--ma-green-deep)}.status-toggle.draft{background:var(--ma-off-white);color:var(--ma-text-muted);border:1px solid var(--ma-border)}
.action-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:6px;font-size:.78rem;background:var(--ma-off-white);border:1px solid var(--ma-border);cursor:pointer;transition:all var(--trans-fast)}
.action-btn:hover{background:var(--ma-green-tint);color:var(--ma-green-deep)}.action-btn.danger:hover{background:#fce8e8;color:#D32F2F;border-color:#D32F2F}
</style>
