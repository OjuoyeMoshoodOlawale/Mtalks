<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { CreditCard, Download, Search, Menu } from 'lucide-vue-next'

const payments    = ref([])
const loading     = ref(true)
const sidebarOpen = ref(false)
const search      = ref('')
const filterType  = ref('')
const filterStatus= ref('success')
const page        = ref(1)
const total       = ref(0)

const fetchAll = async () => {
  loading.value=true
  try {
    const params = { page: page.value, limit: 25 }
    if (filterType.value)   params.type   = filterType.value
    if (filterStatus.value) params.status = filterStatus.value
    const { data } = await api.get('/payments', { params })
    payments.value = data.data
    total.value    = data.pagination?.total || 0
  } finally { loading.value=false }
}
onMounted(fetchAll)

const filtered = computed(() => {
  if (!search.value.trim()) return payments.value
  const q = search.value.toLowerCase()
  return payments.value.filter(p =>
    p.user_name?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q))
})

const fmt    = (n)  => `₦${Number(n).toLocaleString()}`
const fmtDate= (d)  => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—'

const exportCSV = () => {
  const rows = [['Name','Email','Type','Amount','Reference','Date','Status'],
    ...payments.value.map(p => [p.user_name, p.user_email, p.type, p.amount, p.reference, fmtDate(p.paid_at), p.status])]
  const csv = rows.map(r => r.join(',')).join('\n')
  const a   = document.createElement('a')
  a.href    = 'data:text/csv,' + encodeURIComponent(csv)
  a.download= `payments-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Payments</h1>
        <button @click="exportCSV" class="btn btn--sm btn--outline" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">
          <Download :size="16"/> Export CSV
        </button>
      </div>
      <div class="admin-content">
        <div class="filters-row">
          <div class="search-wrap">
            <Search :size="16" class="search-icon"/>
            <input v-model="search" placeholder="Search by name or reference…" class="search-input"/>
          </div>
          <select v-model="filterType" class="form-input" style="width:140px" @change="fetchAll">
            <option value="">All types</option>
            <option value="course">Courses</option>
            <option value="event">Events</option>
          </select>
          <select v-model="filterStatus" class="form-input" style="width:140px" @change="fetchAll">
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <p style="font-size:.82rem;color:var(--ma-text-muted);margin-bottom:16px">{{ total }} total records</p>
        <BaseLoader v-if="loading" style="padding:40px"/>
        <div v-else class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Student</th><th>Type</th><th>Amount</th><th>Reference</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="p in filtered" :key="p.id">
                  <td><p style="font-weight:600;margin:0;font-size:.875rem">{{ p.user_name }}
                    <span v-if="!p.user_id" class="table-badge table-badge--grey" style="margin-left:4px;font-size:.68rem">Guest</span></p><p style="font-size:.75rem;color:var(--ma-text-muted);margin:0">{{ p.user_email }}</p></td>
                  <td><span class="badge" :class="p.type==='course'?'badge--green':'badge--gold'">{{ p.type }}</span></td>
                  <td style="font-weight:600">{{ fmt(p.amount) }}</td>
                  <td style="font-family:var(--font-mono);font-size:.75rem;color:var(--ma-text-muted)">{{ p.reference }}</td>
                  <td style="white-space:nowrap;font-size:.82rem">{{ fmtDate(p.paid_at) }}</td>
                  <td><span class="badge" :class="{'badge--green':p.status==='success','badge--dark':p.status==='pending'}">{{ p.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-layout{display:flex;min-height:100vh}.admin-main{flex:1;display:flex;flex-direction:column;min-width:0}
.admin-topbar{background:var(--ma-white);border-bottom:1px solid var(--ma-border);padding:0 24px;height:60px;display:flex;align-items:center;gap:16px;flex-shrink:0}
.topbar-toggle{color:var(--ma-text);display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px}.topbar-toggle:hover{background:var(--ma-green-tint)}
.topbar-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin:0}
.admin-content{flex:1;padding:24px;background:var(--ma-off-white);overflow-y:auto}
.filters-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px}
.search-wrap{position:relative;flex:1;min-width:200px}.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ma-text-muted)}
.search-input{width:100%;padding:10px 12px 10px 36px;border:1.5px solid var(--ma-border);border-radius:var(--radius-md);font-size:.875rem}
.search-input:focus{border-color:var(--ma-green);outline:none}
.table-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);overflow:hidden}
.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;font-size:.875rem}
.data-table th{text-align:left;padding:12px 16px;font-size:.78rem;color:var(--ma-text-muted);border-bottom:2px solid var(--ma-border);font-weight:600}
.data-table td{padding:12px 16px;border-bottom:1px solid var(--ma-border);vertical-align:middle}
.data-table tr:last-child td{border-bottom:none}.data-table tr:hover td{background:var(--ma-off-white)}
</style>
