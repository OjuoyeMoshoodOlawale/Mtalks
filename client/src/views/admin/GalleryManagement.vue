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
import { Menu, Plus, Pencil, Trash2, Image, Eye, EyeOff } from 'lucide-vue-next'

const ui = useUiStore()
const sidebarOpen = ref(false)
const loading  = ref(true)
const images   = ref([])
const showAdd  = ref(false)
const showEdit = ref(false)
const saving   = ref(false)
const delTarget= ref(null)
const deleting = ref(false)
const addForm  = ref({ title: '', drive_file_id: '', category: 'General' })
const editForm = ref({ id: null, title: '', category: '', sort_order: 0, is_published: true })

onMounted(fetchAll)

async function fetchAll () {
  loading.value = true
  try {
    const { data } = await api.get('/gallery')
    images.value = data.data || []
  } finally { loading.value = false }
}

async function addImages () {
  if (!addForm.value.drive_file_id.trim()) { ui.toastError('Paste at least one Drive link or ID'); return }
  saving.value = true
  try {
    const { data } = await api.post('/gallery', addForm.value)
    ui.toast(data.data?.message || 'Added')
    showAdd.value = false
    addForm.value = { title: '', drive_file_id: '', category: 'General' }
    fetchAll()
  } catch (e) { ui.toastError(e.response?.data?.message || 'Failed to add') }
  finally { saving.value = false }
}

function openEdit (img) {
  editForm.value = { id: img.id, title: img.title || '', category: img.category || 'General',
    sort_order: img.sort_order || 0, is_published: !!img.is_published }
  showEdit.value = true
}

async function saveEdit () {
  saving.value = true
  try {
    await api.put(`/gallery/${editForm.value.id}`, editForm.value)
    ui.toast('Image updated')
    showEdit.value = false
    fetchAll()
  } finally { saving.value = false }
}

async function togglePublish (img) {
  await api.put(`/gallery/${img.id}`, { ...img, is_published: !img.is_published })
  img.is_published = img.is_published ? 0 : 1
}

async function confirmDelete () {
  deleting.value = true
  try {
    await api.delete(`/gallery/${delTarget.value.id}`)
    images.value = images.value.filter(i => i.id !== delTarget.value.id)
    ui.toast('Image removed')
  } finally { deleting.value = false; delTarget.value = null }
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false" />

    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Gallery</h1>
        <BaseButton @click="showAdd=true" style="margin-left:auto"><Plus :size="16"/> Add Images</BaseButton>
      </div>

      <div class="admin-content">
        <div class="info-banner">
          <strong>How it works:</strong> upload your photos to a Google Drive folder, set sharing to
          <em>"Anyone with the link → Viewer"</em>, then paste the share links (one per line, or comma-separated)
          here. The site displays them directly from Drive — no re-uploading needed.
        </div>

        <BaseLoader v-if="loading" style="padding:60px"/>

        <div v-else-if="!images.length" style="padding:60px;text-align:center;color:var(--ma-text-muted)">
          <Image :size="44" color="var(--ma-border)"/>
          <p style="margin-top:10px">No gallery images yet — add your first batch!</p>
        </div>

        <div v-else class="img-grid">
          <div v-for="img in images" :key="img.id" class="img-card" :class="{unpublished: !img.is_published}">
            <img :src="img.thumb" :alt="img.title || ''" loading="lazy"/>
            <div class="img-meta">
              <p class="img-title">{{ img.title || 'Untitled' }}</p>
              <p class="img-cat">{{ img.category }}</p>
            </div>
            <div class="img-actions">
              <button class="action-btn" :title="img.is_published ? 'Unpublish' : 'Publish'" @click="togglePublish(img)">
                <component :is="img.is_published ? Eye : EyeOff" :size="14"/>
              </button>
              <button class="action-btn" @click="openEdit(img)"><Pencil :size="14"/></button>
              <button class="action-btn danger" @click="delTarget=img"><Trash2 :size="14"/></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add modal -->
    <BaseModal v-if="showAdd" title="Add Gallery Images" size="lg" @close="showAdd=false">
      <div class="form-group">
        <label class="form-label">Google Drive links or file IDs</label>
        <textarea v-model="addForm.drive_file_id" class="form-input" rows="6"
          placeholder="Paste one or many — one per line:
https://drive.google.com/file/d/1AbCdEf.../view
https://drive.google.com/file/d/1XyZ.../view"></textarea>
        <p class="form-hint">Bulk paste supported. Full share URLs or raw IDs both work.</p>
      </div>
      <BaseInput v-model="addForm.title" label="Title (optional, applies to all in this batch)" placeholder="e.g. Marriage Summit 2025"/>
      <BaseInput v-model="addForm.category" label="Category" placeholder="e.g. Summit, Retreat, Coaching"/>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
        <button class="btn btn--outline" @click="showAdd=false">Cancel</button>
        <BaseButton :loading="saving" @click="addImages">Add to Gallery</BaseButton>
      </div>
    </BaseModal>

    <!-- Edit modal -->
    <BaseModal v-if="showEdit" title="Edit Image" @close="showEdit=false">
      <BaseInput v-model="editForm.title" label="Title" placeholder="Photo title"/>
      <BaseInput v-model="editForm.category" label="Category" placeholder="General"/>
      <BaseInput v-model="editForm.sort_order" label="Sort order" type="number"/>
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;margin:8px 0 16px;cursor:pointer">
        <input type="checkbox" v-model="editForm.is_published" style="accent-color:var(--ma-green)"/> Published
      </label>
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn--outline" @click="showEdit=false">Cancel</button>
        <BaseButton :loading="saving" @click="saveEdit">Save</BaseButton>
      </div>
    </BaseModal>

    <BaseConfirm v-if="delTarget"
      title="Remove Image"
      message="Remove this image from the gallery? (The original file stays in your Drive.)"
      confirmText="Remove" :danger="true" :loading="deleting"
      @confirm="confirmDelete" @cancel="delTarget=null"/>
  </div>
</template>

<style scoped>
.info-banner{background:var(--ma-green-tint);border:1px solid var(--ma-green);border-radius:var(--radius-md);padding:14px 18px;font-size:.85rem;line-height:1.6;color:var(--ma-green-dark);margin-bottom:20px}
.img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.img-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);overflow:hidden;position:relative}
.img-card.unpublished{opacity:.5}
.img-card img{width:100%;height:140px;object-fit:cover;display:block}
.img-meta{padding:10px 12px}
.img-title{font-size:.82rem;font-weight:600;color:var(--ma-green-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.img-cat{font-size:.72rem;color:var(--ma-text-muted)}
.img-actions{position:absolute;top:8px;right:8px;display:flex;gap:4px;background:rgba(255,255,255,.92);border-radius:8px;padding:3px}
</style>
