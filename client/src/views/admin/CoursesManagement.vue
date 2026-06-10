<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink }    from 'vue-router'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import AdminSidebar  from '@/components/layout/AdminSidebar.vue'
import BaseLoader    from '@/components/common/BaseLoader.vue'
import BaseModal     from '@/components/common/BaseModal.vue'
import BaseButton    from '@/components/common/BaseButton.vue'
import BaseInput     from '@/components/common/BaseInput.vue'
import BaseConfirm   from '@/components/common/BaseConfirm.vue'
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Menu } from 'lucide-vue-next'

const ui          = useUiStore()
const courses     = ref([])
const loading     = ref(true)
const sidebarOpen = ref(false)
const showForm    = ref(false)
const showDel     = ref(false)
const deleting    = ref(false)
const saving      = ref(false)
const editTarget  = ref(null)

const form = ref({ title: '', description: '', thumbnail: '', price: 0, is_free: false, is_published: false })

const fetchAll = async () => {
  loading.value = true
  try { const { data } = await api.get('/courses'); courses.value = data.data }
  finally { loading.value = false }
}

onMounted(fetchAll)

const openCreate = () => { editTarget.value = null; form.value = { title:'', description:'', thumbnail:'', price:0, is_free:false, is_published:false }; showForm.value = true }
const openEdit   = (c) => { editTarget.value = c; form.value = { title:c.title, description:c.description||'', thumbnail:c.thumbnail||'', price:c.price||0, is_free:!!c.is_free, is_published:!!c.is_published }; showForm.value = true }
const openDelete = (c) => { editTarget.value = c; showDel.value = true }

const save = async () => {
  if (!form.value.title.trim()) { ui.toastError('Title is required'); return }
  saving.value = true
  try {
    if (editTarget.value) {
      await api.put(`/courses/${editTarget.value.id}`, form.value)
      ui.toast('Course updated')
    } else {
      await api.post('/courses', form.value)
      ui.toast('Course created')
    }
    showForm.value = false
    fetchAll()
  } catch (e) { ui.toastError(e.response?.data?.message || 'Save failed') }
  finally { saving.value = false }
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await api.delete(`/courses/${editTarget.value.id}`)
    ui.toast('Course deleted')
    showDel.value = false
    fetchAll()
  } catch (e) { ui.toastError('Delete failed') }
  finally { deleting.value = false }
}

const togglePublish = async (c) => {
  await api.put(`/courses/${c.id}`, { is_published: c.is_published ? 0 : 1 })
  ui.toast(c.is_published ? 'Course unpublished' : 'Course published')
  fetchAll()
}

const fmt = (n) => `₦${Number(n).toLocaleString()}`
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false" />
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Courses</h1>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> New Course</BaseButton>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:60px"/>
        <div v-else-if="!courses.length" class="empty-state">
          <BookOpen :size="48" color="var(--ma-border)"/>
          <p>No courses yet. Create your first one!</p>
          <BaseButton @click="openCreate"><Plus :size="16"/> Create Course</BaseButton>
        </div>
        <div v-else class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Title</th><th>Price</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="c in courses" :key="c.id">
                  <td>
                    <p style="font-weight:600;color:var(--ma-green-dark);margin:0">{{ c.title }}</p>
                    <p style="font-size:.78rem;color:var(--ma-text-muted);margin:2px 0 0">{{ c.description?.slice(0,60) }}</p>
                  </td>
                  <td>{{ c.is_free ? 'Free' : fmt(c.price) }}</td>
                  <td><span class="badge" :class="c.is_free?'badge--green':'badge--gold'">{{ c.is_free?'Free':'Paid' }}</span></td>
                  <td>
                    <button @click="togglePublish(c)" class="status-toggle" :class="c.is_published?'published':'draft'">
                      <Eye v-if="c.is_published" :size="14"/> <EyeOff v-else :size="14"/>
                      {{ c.is_published ? 'Published' : 'Draft' }}
                    </button>
                  </td>
                  <td>
                    <div style="display:flex;gap:8px">
                      <RouterLink :to="`/courses/${c.slug}`" target="_blank" class="action-btn" title="Preview as student"><Eye :size="14"/> Preview</RouterLink>
                      <RouterLink :to="`/admin/courses/${c.id}/edit`" class="action-btn" title="Edit curriculum"><Pencil :size="16"/> Curriculum</RouterLink>
                      <button @click="openEdit(c)" class="action-btn" title="Edit details"><Pencil :size="16"/> Info</button>
                      <button @click="openDelete(c)" class="action-btn danger" title="Delete"><Trash2 :size="16"/></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  <!-- Create/Edit modal -->
  <BaseModal :title="editTarget ? 'Edit Course' : 'New Course'" @close="showForm=false" v-if="showForm">
    <BaseInput v-model="form.title"       label="Course title"   placeholder="e.g. Foundations of a Healthy Marriage" required />
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea v-model="form.description" class="form-input" rows="3" placeholder="Brief description visible to students…"></textarea>
    </div>
    <BaseInput v-model="form.thumbnail" label="Thumbnail URL" placeholder="https://…" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Type</label>
        <select v-model="form.is_free" class="form-input">
          <option :value="false">Paid</option>
          <option :value="true">Free</option>
        </select>
      </div>
      <BaseInput v-if="!form.is_free" v-model="form.price" label="Price (₦)" type="number" placeholder="5000" />
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
      <input type="checkbox" id="pub" v-model="form.is_published" style="width:18px;height:18px;accent-color:var(--ma-green)"/>
      <label for="pub" style="font-size:.875rem;font-weight:500;cursor:pointer">Publish immediately</label>
    </div>
    <template #footer>
      <BaseButton variant="outline" @click="showForm=false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="save">{{ editTarget ? 'Save Changes' : 'Create Course' }}</BaseButton>
    </template>
  </BaseModal>

  <!-- Confirm delete -->
  <BaseConfirm v-if="showDel" title="Delete course"
    :message="`Delete &quot;${editTarget?.title}&quot;? All modules, lessons and enrolments will be permanently removed.`"
    confirmText="Delete" :danger="true" :loading="deleting"
    @confirm="confirmDelete" @cancel="showDel=false" />
  </div>
</template>
