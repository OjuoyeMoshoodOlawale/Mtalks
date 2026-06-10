<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseConfirm  from '@/components/common/BaseConfirm.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import { Search, UserCheck, UserX, ShieldCheck, ShieldOff, Menu } from 'lucide-vue-next'

const ui=useUiStore();const users=ref([]);const loading=ref(true);const sidebarOpen=ref(false)
const search=ref('');const roleFilter=ref('');const confirmTarget=ref(null);const confirmAction=ref('');const showConfirm=ref(false)

const fetchAll = async () => {
  loading.value=true
  try { const { data } = await api.get('/users', { params: { search: search.value, role: roleFilter.value } }); users.value=data.data }
  finally { loading.value=false }
}
onMounted(fetchAll)

const doAction = async () => {
  try {
    if (confirmAction.value==='role') await api.put(`/users/${confirmTarget.value.id}/role`, { role: confirmTarget.value.role==='admin'?'student':'admin' })
    else await api.put(`/users/${confirmTarget.value.id}/toggle`)
    ui.toast('User updated'); showConfirm.value=false; fetchAll()
  } catch { ui.toastError('Action failed') }
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—'
</script>
<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Users</h1>
      </div>
      <div class="admin-content">
        <div class="filters-row">
          <div class="search-wrap">
            <Search :size="16" class="search-icon"/>
            <input v-model="search" placeholder="Search name or email…" class="search-input" @keyup.enter="fetchAll"/>
          </div>
          <select v-model="roleFilter" class="form-input" style="width:140px" @change="fetchAll">
            <option value="">All roles</option><option value="student">Students</option><option value="admin">Admins</option>
          </select>
          <BaseButton variant="outline" @click="fetchAll" size="sm">Search</BaseButton>
        </div>
        <BaseLoader v-if="loading" style="padding:40px"/>
        <div v-else class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar">{{ u.name?.[0] }}</div><span style="font-weight:600;font-size:.875rem">{{ u.name }}</span></div></td>
                  <td style="font-size:.82rem;color:var(--ma-text-muted)">{{ u.email }}</td>
                  <td><span class="badge" :class="u.role==='admin'?'badge--dark':'badge--green'">{{ u.role }}</span></td>
                  <td style="font-size:.82rem">{{ fmtDate(u.created_at) }}</td>
                  <td><span class="badge" :class="u.is_active?'badge--green':'badge--dark'">{{ u.is_active?'Active':'Disabled' }}</span></td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button @click="confirmTarget=u;confirmAction='role';showConfirm=true" class="action-btn" :title="u.role==='admin'?'Demote to student':'Promote to admin'">
                        <ShieldCheck v-if="u.role==='student'" :size="14"/> <ShieldOff v-else :size="14"/>
                        {{ u.role==='admin'?'Demote':'Promote' }}
                      </button>
                      <button @click="confirmTarget=u;confirmAction='toggle';showConfirm=true" class="action-btn" :class="u.is_active?'danger':''">
                        <UserX v-if="u.is_active" :size="14"/> <UserCheck v-else :size="14"/>
                        {{ u.is_active?'Disable':'Enable' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  <BaseConfirm v-if="showConfirm"
    :title="confirmAction==='role'?'Change role':'Toggle account'"
    :message="confirmAction==='role'?`Change ${confirmTarget?.name}'s role to ${confirmTarget?.role==='admin'?'student':'admin'}?`:`${confirmTarget?.is_active?'Disable':'Enable'} ${confirmTarget?.name}'s account?`"
    :confirmText="confirmAction==='role'?(confirmTarget?.role==='admin'?'Demote':'Promote'):(confirmTarget?.is_active?'Disable':'Enable')"
    :danger="confirmTarget?.is_active&&confirmAction==='toggle'"
    @confirm="doAction" @cancel="showConfirm=false"/>
  </div>
</template>
