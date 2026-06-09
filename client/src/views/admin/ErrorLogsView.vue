<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseModal    from '@/components/common/BaseModal.vue'
import BaseConfirm  from '@/components/common/BaseConfirm.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import { Bug, Trash2, Eye, Menu } from 'lucide-vue-next'

const ui=useUiStore();const logs=ref([]);const loading=ref(true);const sidebarOpen=ref(false)
const selected=ref(null);const showDel=ref(false);const purging=ref(false)

const fetchAll = async () => {
  loading.value=true
  try { const { data } = await api.get('/logs'); logs.value=data.data }
  finally { loading.value=false }
}
onMounted(fetchAll)

const purge = async () => {
  purging.value=true
  try { await api.delete('/logs/purge'); ui.toast('Old logs purged (30+ days)'); showDel.value=false; fetchAll() }
  finally { purging.value=false }
}

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-NG') : '—'
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Error Logs</h1>
        <button @click="showDel=true" class="btn btn--sm btn--outline" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;border-color:#D32F2F;color:#D32F2F">
          <Trash2 :size="16"/> Purge old logs
        </button>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:40px"/>
        <div v-else-if="!logs.length" style="text-align:center;padding:60px;background:var(--ma-white);border-radius:var(--radius-lg)">
          <Bug :size="48" color="var(--ma-border)"/>
          <p style="color:var(--ma-text-muted);margin-top:12px">No errors logged. The platform is running clean!</p>
        </div>
        <div v-else class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Route</th><th>Message</th><th>Time</th><th>View</th></tr></thead>
              <tbody>
                <tr v-for="log in logs" :key="log.id">
                  <td style="font-family:var(--font-mono);font-size:.78rem;color:var(--ma-green-deep)">{{ log.route||'—' }}</td>
                  <td style="font-size:.82rem;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ log.message }}</td>
                  <td style="white-space:nowrap;font-size:.78rem;color:var(--ma-text-muted)">{{ fmtDate(log.created_at) }}</td>
                  <td><button @click="selected=log" class="action-btn"><Eye :size="14"/> View</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <BaseModal title="Error Detail" size="lg" @close="selected=null" v-if="selected">
    <div style="font-family:var(--font-mono);font-size:.8rem;line-height:1.6">
      <p><strong>Route:</strong> {{ selected.route }}</p>
      <p><strong>Time:</strong> {{ fmtDate(selected.created_at) }}</p>
      <p><strong>Message:</strong> {{ selected.message }}</p>
      <pre v-if="selected.stack" style="background:var(--ma-off-white);padding:16px;border-radius:8px;overflow-x:auto;margin-top:12px;white-space:pre-wrap;font-size:.75rem">{{ selected.stack }}</pre>
    </div>
  </BaseModal>

  <BaseConfirm v-if="showDel" title="Purge old logs" message="This will delete all error logs older than 30 days. This cannot be undone." confirmText="Purge" :danger="true" :loading="purging" @confirm="purge" @cancel="showDel=false"/>
</template>

<style scoped>
.admin-layout{display:flex;min-height:100vh}.admin-main{flex:1;display:flex;flex-direction:column;min-width:0}
.admin-topbar{background:var(--ma-white);border-bottom:1px solid var(--ma-border);padding:0 24px;height:60px;display:flex;align-items:center;gap:16px;flex-shrink:0}
.topbar-toggle{color:var(--ma-text);display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px}.topbar-toggle:hover{background:var(--ma-green-tint)}
.topbar-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin:0}
.admin-content{flex:1;padding:24px;background:var(--ma-off-white);overflow-y:auto}
.table-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);overflow:hidden}.table-wrap{overflow-x:auto}
.data-table{width:100%;border-collapse:collapse;font-size:.875rem}
.data-table th{text-align:left;padding:12px 16px;font-size:.78rem;color:var(--ma-text-muted);border-bottom:2px solid var(--ma-border);font-weight:600}
.data-table td{padding:12px 16px;border-bottom:1px solid var(--ma-border);vertical-align:middle}
.data-table tr:last-child td{border-bottom:none}.data-table tr:hover td{background:var(--ma-off-white)}
.action-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:6px;font-size:.78rem;background:var(--ma-off-white);border:1px solid var(--ma-border);cursor:pointer;transition:all var(--trans-fast)}
.action-btn:hover{background:var(--ma-green-tint);color:var(--ma-green-deep)}
</style>
