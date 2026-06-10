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

const blank = () => ({ client_name: '', content: '', rating: 5, client_photo: '', source: 'manual', is_published: true })
const form  = ref(blank())

const fetchAll = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/testimonials')
    items.value = data.data || []
  } catch { ui.toastError('Failed to load testimonials') }
  finally { loading.value = false }
}
onMounted(fetchAll)

const openCreate = () => { editTarget.value = null; form.value = blank(); showForm.value = true }
const openEdit   = (i) => { editTarget.value = i; form.value = { ...i }; showForm.value = true }

const togglePub = async (item) => {
  try {
    await api.put('/testimonials/' + item.id, { is_published: item.is_published ? 0 : 1 })
    item.is_published = item.is_published ? 0 : 1
    ui.toast(item.is_published ? 'Published' : 'Hidden')
  } catch { ui.toastError('Failed to update status') }
}

const save = async () => {
  if (!form.value.client_name || !form.value.content) {
    ui.toastError('Client name and testimonial text are required'); return
  }
  saving.value = true
  try {
    if (editTarget.value) {
      await api.put('/testimonials/' + editTarget.value.id, form.value)
      ui.toast('Testimonial updated')
    } else {
      await api.post('/testimonials', form.value)
      ui.toast('Testimonial added')
    }
    showForm.value = false; fetchAll()
  } catch (e) { ui.toastError(e.response?.data?.message || 'Save failed') }
  finally { saving.value = false }
}

const confirmDel = async () => {
  deleting.value = true
  try {
    await api.delete('/testimonials/' + editTarget.value.id)
    ui.toast('Deleted')
    showDel.value = false; fetchAll()
  } catch { ui.toastError('Delete failed') }
  finally { deleting.value = false }
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Testimonials</h1>
        <span style="font-size:.82rem;color:var(--ma-text-muted);margin-left:8px">{{ items.length }} total</span>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> Add Testimonial</BaseButton>
      </div>

      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:60px;text-align:center"/>

        <div v-else-if="!items.length" style="background:var(--ma-white);border-radius:var(--radius-lg);padding:48px;text-align:center;color:var(--ma-text-muted)">
          No testimonials yet — add your first one!
        </div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="td-num">#</th>
                <th>Client</th>
                <th>Testimonial</th>
                <th>Rating</th>
                <th>Source</th>
                <th>Status</th>
                <th class="td-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in items" :key="item.id">
                <td class="td-num">{{ i + 1 }}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;min-width:140px">
                    <img v-if="item.client_photo"
                      :src="item.client_photo" :alt="item.client_name"
                      style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0"
                      loading="lazy"/>
                    <div v-else class="t-avatar">{{ item.client_name?.[0] }}</div>
                    <span style="font-weight:600;color:var(--ma-green-dark);font-size:.88rem">{{ item.client_name }}</span>
                  </div>
                </td>
                <td class="td-quote">"{{ item.content?.slice(0, 80) }}{{ item.content?.length > 80 ? '…' : '' }}"</td>
                <td class="td-center">
                  <span class="stars">{{ '★'.repeat(item.rating || 5) }}</span>
                </td>
                <td>
                  <span class="table-badge table-badge--grey">{{ item.source || 'manual' }}</span>
                </td>
                <td>
                  <button @click="togglePub(item)" class="status-toggle" :class="item.is_published ? 'published' : 'draft'">
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

      <BaseModal title="Testimonial" v-if="showForm" @close="showForm=false">
        <BaseInput v-model="form.client_name" label="Client name" required placeholder="e.g. Fatimah A."/>
        <div class="form-group">
          <label class="form-label">Testimonial text <span style="color:var(--ma-red,#e53e3e)">*</span></label>
          <textarea v-model="form.content" class="form-input" rows="4"
            placeholder="Write the client's testimonial in their own words…" required/>
        </div>
        <BaseInput v-model="form.client_photo" label="Client photo URL (optional)" placeholder="https://…"/>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label class="form-label">Rating</label>
            <select v-model="form.rating" class="form-input">
              <option v-for="n in 5" :key="n" :value="n">{{ n }} ★ — {{ ['','Poor','Fair','Good','Great','Excellent'][n] }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Source</label>
            <select v-model="form.source" class="form-input">
              <option value="course">Course</option>
              <option value="event">Event</option>
              <option value="manual">Manual / Direct</option>
            </select>
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;cursor:pointer;margin-top:4px">
          <input type="checkbox" v-model="form.is_published" style="accent-color:var(--ma-green)"/>
          Publish immediately
        </label>
        <template #footer>
          <button class="btn btn--outline" @click="showForm=false">Cancel</button>
          <BaseButton :loading="saving" @click="save">{{ editTarget ? 'Update' : 'Add' }} Testimonial</BaseButton>
        </template>
      </BaseModal>

      <BaseConfirm v-if="showDel"
        title="Delete Testimonial"
        :message="'Delete testimonial from ' + (editTarget?.client_name || 'this client') + '? This cannot be undone.'"
        confirmText="Delete" :danger="true" :loading="deleting"
        @confirm="confirmDel" @cancel="showDel=false"/>
    </div>
    </div>
  </div>
</template>

<style scoped>
.t-avatar{width:38px;height:38px;border-radius:50%;background:var(--ma-green-tint);color:var(--ma-green-deep);font-weight:700;font-size:.95rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.td-quote{color:var(--ma-text-muted);font-size:.82rem;max-width:280px;font-style:italic}
.stars{color:var(--ma-gold);font-size:.9rem;letter-spacing:1px}
.status-toggle{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:600;padding:4px 10px;border-radius:12px;border:1px solid;cursor:pointer;background:none;white-space:nowrap}
.status-toggle.published{color:#155724;border-color:#a3d9a5;background:#d4edda}
.status-toggle.draft{color:var(--ma-text-muted);border-color:var(--ma-border);background:var(--ma-off-white)}
</style>
