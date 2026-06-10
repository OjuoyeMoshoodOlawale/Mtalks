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

  <BaseModal title="Error Detail" size="lg" @close="selected=null" v-if="selected">
    <div style="font-family:var(--font-mono);font-size:.8rem;line-height:1.6">
      <p><strong>Route:</strong> {{ selected.route }}</p>
      <p><strong>Time:</strong> {{ fmtDate(selected.created_at) }}</p>
      <p><strong>Message:</strong> {{ selected.message }}</p>
      <pre v-if="selected.stack" style="background:var(--ma-off-white);padding:16px;border-radius:8px;overflow-x:auto;margin-top:12px;white-space:pre-wrap;font-size:.75rem">{{ selected.stack }}</pre>
    </div>
  </BaseModal>

  <BaseConfirm v-if="showDel" title="Purge old logs" message="This will delete all error logs older than 30 days. This cannot be undone." confirmText="Purge" :danger="true" :loading="purging" @confirm="purge" @cancel="showDel=false"/>
  </div>
</template>
