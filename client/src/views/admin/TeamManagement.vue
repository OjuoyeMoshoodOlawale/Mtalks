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
import { Plus, Pencil, Trash2, Users, Menu } from 'lucide-vue-next'

const ui=useUiStore();const team=ref([]);const loading=ref(true);const sidebarOpen=ref(false)
const showForm=ref(false);const showDel=ref(false);const saving=ref(false);const deleting=ref(false);const editTarget=ref(null)
const blank = () => ({ name:'',role:'',bio:'',photo:'',social_links:{instagram:'',linkedin:'',twitter:''} })
const form = ref(blank())

const fetchAll = async () => { loading.value=true; try { const {data}=await api.get('/team'); team.value=data.data } finally { loading.value=false } }
onMounted(fetchAll)
const openCreate = () => { editTarget.value=null; form.value=blank(); showForm.value=true }
const openEdit   = (m) => { editTarget.value=m; form.value={...m,social_links:m.social_links||{instagram:'',linkedin:'',twitter:''}}; showForm.value=true }

const save = async () => {
  if (!form.value.name) { ui.toastError('Name required'); return }
  saving.value=true
  try {
    if (editTarget.value) { await api.put(`/team/${editTarget.value.id}`, form.value); ui.toast('Updated') }
    else { await api.post('/team', form.value); ui.toast('Team member added') }
    showForm.value=false; fetchAll()
  } finally { saving.value=false }
}
const confirmDel = async () => { deleting.value=true; try { await api.delete(`/team/${editTarget.value.id}`); ui.toast('Removed'); showDel.value=false; fetchAll() } finally { deleting.value=false } }
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Team</h1>
        <BaseButton @click="openCreate" style="margin-left:auto"><Plus :size="16"/> Add Member</BaseButton>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:40px"/>
        <div v-if="!team.length" style="background:var(--ma-white);border-radius:var(--radius-lg);padding:48px;text-align:center;color:var(--ma-text-muted)">
            No team members yet.
          </div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="td-num">#</th>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Bio</th>
                  <th class="td-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in team" :key="m.id">
                  <td class="td-num">{{ i + 1 }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <img :src="m.photo || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=70&auto=format'"
                        :alt="m.name"
                        style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0"/>
                      <span style="font-weight:700;color:var(--ma-green-dark)">{{ m.name }}</span>
                    </div>
                  </td>
                  <td><span class="table-badge table-badge--green">{{ m.role }}</span></td>
                  <td style="color:var(--ma-text-muted);font-size:.82rem;max-width:240px">
                    {{ m.bio?.slice(0,80) }}{{ m.bio?.length > 80 ? '…' : '' }}
                  </td>
                  <td class="td-actions">
                    <div style="display:flex;gap:6px;justify-content:flex-end">
                      <button @click="openEdit(m)" class="action-btn"><Pencil :size="14"/> Edit</button>
                      <button @click="editTarget=m;showDel=true" class="action-btn danger"><Trash2 :size="14"/></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </div>
  <BaseModal :title="editTarget?'Edit Member':'New Team Member'" size="lg" @close="showForm=false" v-if="showForm">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <BaseInput v-model="form.name" label="Full name" required style="grid-column:span 2"/>
      <BaseInput v-model="form.role" label="Role/position" placeholder="Marriage Coach"/>
      <BaseInput v-model="form.photo" label="Photo URL" placeholder="https://…"/>
    </div>
    <div class="form-group"><label class="form-label">Bio</label><textarea v-model="form.bio" class="form-input" rows="3"/></div>
    <label class="form-label">Social links</label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
      <BaseInput v-model="form.social_links.instagram" label="Instagram" placeholder="https://instagram.com/…"/>
      <BaseInput v-model="form.social_links.linkedin"  label="LinkedIn"  placeholder="https://linkedin.com/in/…"/>
      <BaseInput v-model="form.social_links.twitter"   label="Twitter/X" placeholder="https://twitter.com/…"/>
    </div>
    <template #footer>
      <BaseButton variant="outline" @click="showForm=false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="save">{{ editTarget?'Save':'Add Member' }}</BaseButton>
    </template>
  </BaseModal>
  <BaseConfirm v-if="showDel" title="Remove team member" :message="`Remove ${editTarget?.name}?`" confirmText="Remove" :danger="true" :loading="deleting" @confirm="confirmDel" @cancel="showDel=false"/>
  </div>
</template>
