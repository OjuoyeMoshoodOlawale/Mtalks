<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink }    from 'vue-router'
import api from '@/services/api'
import { useUiStore }   from '@/stores/ui'
import AdminSidebar     from '@/components/layout/AdminSidebar.vue'
import BaseLoader       from '@/components/common/BaseLoader.vue'
import BaseModal        from '@/components/common/BaseModal.vue'
import BaseButton       from '@/components/common/BaseButton.vue'
import BaseInput        from '@/components/common/BaseInput.vue'
import BaseConfirm      from '@/components/common/BaseConfirm.vue'
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar, Menu, Users } from 'lucide-vue-next'

const ui          = useUiStore()
const events      = ref([])
const loading     = ref(true)
const sidebarOpen = ref(false)
const showForm    = ref(false)
const showDel     = ref(false)
const saving      = ref(false)
const deleting    = ref(false)
const editTarget  = ref(null)

const blankForm = () => ({ title:'', description:'', banner:'', type:'online', venue:'', meeting_link:'',
  whatsapp_link:'', event_date:'', deadline:'', is_published:false,
  packages: [{ name:'Standard', description:'', price:'', early_bird_price:'', early_bird_deadline:'', capacity:100 }]
})
const form = ref(blankForm())

const fetchAll = async () => {
  loading.value=true
  try { const { data } = await api.get('/events'); events.value = data.data }
  finally { loading.value=false }
}
onMounted(fetchAll)

const openCreate = () => { editTarget.value=null; form.value=blankForm(); showForm.value=true }
const openEdit   = (e) => {
  editTarget.value=e
  form.value={ ...e, event_date: e.event_date?.slice(0,16), deadline: e.deadline?.slice(0,16),
    packages: e.packages||[{ name:'Standard', description:'', price:'', early_bird_price:'', early_bird_deadline:'', capacity:100 }]
  }
  showForm.value=true
}

const addPackage = () => form.value.packages.push({ name:'', description:'', price:'', early_bird_price:'', early_bird_deadline:'', capacity:100 })
const removePackage = (i) => form.value.packages.splice(i, 1)

const save = async () => {
  if (!form.value.title || !form.value.event_date || !form.value.deadline) {
    ui.toastError('Title, event date and deadline are required'); return
  }
  saving.value=true
  try {
    if (editTarget.value) { await api.put(`/events/${editTarget.value.id}`, form.value); ui.toast('Event updated') }
    else { await api.post('/events', form.value); ui.toast('Event created') }
    showForm.value=false; fetchAll()
  } catch (e) { ui.toastError(e.response?.data?.message||'Save failed') }
  finally { saving.value=false }
}

const togglePublish = async (ev) => {
  await api.put(`/events/${ev.id}`, { is_published: ev.is_published ? 0 : 1 })
  ui.toast(ev.is_published ? 'Event unpublished' : 'Event published'); fetchAll()
}

const confirmDelete = async () => {
  deleting.value=true
  try { await api.delete(`/events/${editTarget.value.id}`); ui.toast('Event deleted'); showDel.value=false; fetchAll() }
  finally { deleting.value=false }
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—'
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Events</h1>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> New Event</BaseButton>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:60px"/>
        <div v-else-if="!events.length" class="empty-state">
          <Calendar :size="48" color="var(--ma-border)"/>
          <p>No events yet. Create your first event!</p>
          <BaseButton @click="openCreate"><Plus :size="16"/> Create Event</BaseButton>
        </div>
        <div v-else class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Event</th><th>Date</th><th>Type</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="ev in events" :key="ev.id">
                  <td>
                    <p style="font-weight:600;color:var(--ma-green-dark);margin:0">{{ ev.title }}</p>
                    <p style="font-size:.75rem;color:var(--ma-text-muted);margin:2px 0 0">{{ ev.packages?.length||0 }} packages</p>
                  </td>
                  <td style="white-space:nowrap;font-size:.85rem">{{ fmtDate(ev.event_date) }}</td>
                  <td><span class="badge" :class="ev.type==='online'?'badge--green':'badge--gold'">{{ ev.type }}</span></td>
                  <td style="white-space:nowrap;font-size:.85rem">{{ fmtDate(ev.deadline) }}</td>
                  <td>
                    <button @click="togglePublish(ev)" class="status-toggle" :class="ev.is_published?'published':'draft'">
                      <Eye v-if="ev.is_published" :size="14"/> <EyeOff v-else :size="14"/>
                      {{ ev.is_published?'Published':'Draft' }}
                    </button>
                  </td>
                  <td>
                    <div style="display:flex;gap:8px">
                      <RouterLink :to="`/admin/events/${ev.id}/edit`" class="action-btn"><Users :size="16"/> Attendees</RouterLink>
                      <button @click="openEdit(ev)" class="action-btn"><Pencil :size="16"/> Edit</button>
                      <button @click="editTarget=ev;showDel=true" class="action-btn danger"><Trash2 :size="16"/></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Event form modal -->
  <BaseModal :title="editTarget?'Edit Event':'New Event'" size="lg" @close="showForm=false" v-if="showForm">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <BaseInput v-model="form.title" label="Event title" placeholder="The Muhsinah Summit 2026" required style="grid-column:span 2"/>
      <div class="form-group">
        <label class="form-label">Type</label>
        <select v-model="form.type" class="form-input">
          <option value="online">Online</option>
          <option value="offline">In-Person (Offline)</option>
        </select>
      </div>
      <BaseInput v-if="form.type==='offline'" v-model="form.venue" label="Venue" placeholder="Meethaq Hotels, Jabi, Abuja"/>
      <BaseInput v-else v-model="form.meeting_link" label="Meeting link (Zoom/Google Meet)" placeholder="https://…"/>
      <BaseInput v-model="form.event_date" label="Event date & time" type="datetime-local" required/>
      <BaseInput v-model="form.deadline" label="Registration deadline" type="datetime-local" required/>
    </div>
    <BaseInput v-model="form.banner" label="Banner image URL" placeholder="https://images.unsplash.com/…"/>
    <BaseInput v-model="form.whatsapp_link" label="WhatsApp group link (sent by email after payment — never public)" placeholder="https://chat.whatsapp.com/…"/>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea v-model="form.description" class="form-input" rows="3" placeholder="What participants will gain from this event…"></textarea>
    </div>

    <!-- Packages -->
    <div style="margin-top:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <label class="form-label" style="margin:0">Ticket Packages</label>
        <BaseButton variant="outline" size="sm" @click="addPackage"><Plus :size="14"/> Add Package</BaseButton>
      </div>
      <div v-for="(pkg, i) in form.packages" :key="i" class="package-form">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <p style="font-weight:600;font-size:.875rem;margin:0">Package {{ i+1 }}</p>
          <button v-if="form.packages.length>1" @click="removePackage(i)" style="color:#D32F2F;font-size:.8rem;cursor:pointer;background:none">Remove</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <BaseInput v-model="pkg.name" label="Name" placeholder="Standard / Early Bird / VIP"/>
          <BaseInput v-model="pkg.capacity" label="Capacity" type="number" placeholder="100"/>
          <BaseInput v-model="pkg.price" label="Price (₦)" type="number" placeholder="5000"/>
          <BaseInput v-model="pkg.early_bird_price" label="Early Bird Price (₦)" type="number" placeholder="3500"/>
          <BaseInput v-model="pkg.early_bird_deadline" label="Early Bird Deadline" type="datetime-local" style="grid-column:span 2"/>
        </div>
        <div class="form-group" style="margin-top:8px">
          <label class="form-label">Package description</label>
          <input v-model="pkg.description" class="form-input" placeholder="What's included…"/>
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:10px;margin-top:12px">
      <input type="checkbox" id="evpub" v-model="form.is_published" style="width:18px;height:18px;accent-color:var(--ma-green)"/>
      <label for="evpub" style="font-size:.875rem;font-weight:500;cursor:pointer">Publish immediately</label>
    </div>
    <template #footer>
      <BaseButton variant="outline" @click="showForm=false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="save">{{ editTarget?'Save Changes':'Create Event' }}</BaseButton>
    </template>
  </BaseModal>

  <BaseConfirm v-if="showDel" title="Delete event"
    :message="`Delete &quot;${editTarget?.title}&quot;? All registrations and packages will be removed.`"
    confirmText="Delete" :danger="true" :loading="deleting"
    @confirm="confirmDelete" @cancel="showDel=false"/>
</template>

<style scoped>
.admin-layout{display:flex;min-height:100vh}.admin-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.admin-topbar{background:var(--ma-white);border-bottom:1px solid var(--ma-border);padding:0 24px;height:60px;display:flex;align-items:center;gap:16px;flex-shrink:0}
.topbar-toggle{color:var(--ma-text);display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px}.topbar-toggle:hover{background:var(--ma-green-tint)}
.topbar-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin:0}
.admin-content{flex:1;padding:24px;background:var(--ma-off-white);overflow-y:auto}
.empty-state{text-align:center;padding:60px;display:flex;flex-direction:column;align-items:center;gap:16px;background:var(--ma-white);border-radius:var(--radius-lg)}
.table-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);overflow:hidden}
.table-wrap{overflow-x:auto}
.data-table{width:100%;border-collapse:collapse;font-size:.875rem}
.data-table th{text-align:left;padding:12px 16px;font-size:.78rem;color:var(--ma-text-muted);border-bottom:2px solid var(--ma-border);font-weight:600}
.data-table td{padding:14px 16px;border-bottom:1px solid var(--ma-border);vertical-align:middle}
.data-table tr:last-child td{border-bottom:none}.data-table tr:hover td{background:var(--ma-off-white)}
.status-toggle{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;cursor:pointer;border:none}
.status-toggle.published{background:var(--ma-green-tint);color:var(--ma-green-deep)}
.status-toggle.draft{background:var(--ma-off-white);color:var(--ma-text-muted);border:1px solid var(--ma-border)}
.action-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:6px;font-size:.78rem;background:var(--ma-off-white);color:var(--ma-text);border:1px solid var(--ma-border);cursor:pointer;transition:all var(--trans-fast)}
.action-btn:hover{background:var(--ma-green-tint);color:var(--ma-green-deep);border-color:var(--ma-green)}
.action-btn.danger:hover{background:#fce8e8;color:#D32F2F;border-color:#D32F2F}
.package-form{background:var(--ma-off-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);padding:16px;margin-bottom:12px}
</style>
