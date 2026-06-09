<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import { Menu, ArrowLeft, Users, CheckCircle, Clock, Search, Download, QrCode } from 'lucide-vue-next'

const route = useRoute()
const ui    = useUiStore()
const sidebarOpen = ref(false)
const loading     = ref(true)
const event       = ref(null)
const attendees   = ref([])
const search      = ref('')
const filterStatus = ref('all')  // all | attended | pending
const checkingIn  = ref(null)

onMounted(async () => {
  try {
    const [evRes, attRes] = await Promise.all([
      api.get(`/events/id/${route.params.id}`),
      api.get(`/registrations?event_id=${route.params.id}`)
    ])
    event.value    = evRes.data.data
    attendees.value = attRes.data.data || []
  } catch (e) {
    ui.toastError('Failed to load event data')
  } finally {
    loading.value = false
  }
})

async function checkIn (att) {
  checkingIn.value = att.id
  try {
    await api.patch(`/registrations/${att.id}/checkin`)
    att.attended_at = new Date().toISOString()
    ui.toast(`${att.student_name} checked in ✓`)
  } catch { ui.toastError('Check-in failed') }
  finally { checkingIn.value = null }
}

const filtered = computed(() => {
  let list = attendees.value
  if (filterStatus.value === 'attended') list = list.filter(a =>  a.attended_at)
  if (filterStatus.value === 'pending')  list = list.filter(a => !a.attended_at)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(a =>
      a.student_name?.toLowerCase().includes(q) ||
      a.student_email?.toLowerCase().includes(q) ||
      a.ticket_code?.toLowerCase().includes(q)
    )
  }
  return list
})

const totalCount    = computed(() => attendees.value.length)
const attendedCount = computed(() => attendees.value.filter(a => a.attended_at).length)
const pendingCount  = computed(() => totalCount.value - attendedCount.value)

function exportCSV () {
  const headers = ['Name','Email','Package','Ticket Code','Registered','Attended']
  const rows = attendees.value.map(a => [
    a.student_name, a.student_email, a.package_name, a.ticket_code,
    new Date(a.registered_at).toLocaleDateString('en-NG'),
    a.attended_at ? new Date(a.attended_at).toLocaleDateString('en-NG') : 'Pending'
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${event.value?.slug || 'event'}-attendees.csv`
  a.click()
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—'
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false" />

    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <RouterLink to="/admin/events" class="btn btn--sm btn--outline" style="display:flex;align-items:center;gap:5px">
          <ArrowLeft :size="14"/> Events
        </RouterLink>
        <h1 class="topbar-title" style="flex:1;margin-left:12px">
          {{ event?.title || 'Event Attendees' }}
        </h1>
        <button class="btn btn--sm btn--outline" @click="exportCSV" :disabled="!attendees.length">
          <Download :size="14"/> Export CSV
        </button>
      </div>

      <div class="admin-content">
        <div v-if="loading" style="padding:60px;text-align:center"><BaseLoader/></div>

        <template v-else>
          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <Users :size="20" color="var(--ma-green)"/>
              <div><span class="stat-num">{{ totalCount }}</span><span class="stat-label">Registered</span></div>
            </div>
            <div class="stat-card stat-card--green">
              <CheckCircle :size="20" color="#16a34a"/>
              <div><span class="stat-num">{{ attendedCount }}</span><span class="stat-label">Attended</span></div>
            </div>
            <div class="stat-card stat-card--gold">
              <Clock :size="20" color="#b45309"/>
              <div><span class="stat-num">{{ pendingCount }}</span><span class="stat-label">Pending</span></div>
            </div>
            <div class="stat-card">
              <div><span class="stat-num">
                {{ totalCount ? Math.round((attendedCount/totalCount)*100) : 0 }}%
              </span><span class="stat-label">Turnout</span></div>
            </div>
          </div>

          <!-- Toolbar -->
          <div class="att-toolbar">
            <div class="search-wrap">
              <Search :size="14" class="si"/>
              <input v-model="search" placeholder="Search name, email, ticket…" class="search-inp"/>
            </div>
            <div class="filter-tabs">
              <button v-for="f in ['all','attended','pending']" :key="f"
                class="ftab" :class="{active:filterStatus===f}" @click="filterStatus=f">
                {{ f.charAt(0).toUpperCase()+f.slice(1) }}
                <span v-if="f==='attended'" class="ftab-count">{{ attendedCount }}</span>
                <span v-if="f==='pending'"  class="ftab-count">{{ pendingCount }}</span>
              </button>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="!filtered.length" style="padding:60px;text-align:center;color:var(--ma-text-muted)">
            <Users :size="40" color="var(--ma-border)"/>
            <p style="margin-top:10px">No attendees found</p>
          </div>

          <!-- Attendees table -->
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Attendee</th>
                  <th>Package</th>
                  <th>Ticket</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(a, i) in filtered" :key="a.id" :class="{'row-attended': a.attended_at}">
                  <td class="td-num">{{ i+1 }}</td>
                  <td>
                    <div class="att-name">{{ a.student_name }}</div>
                    <div class="att-email">{{ a.student_email }}</div>
                  </td>
                  <td>{{ a.package_name }}</td>
                  <td>
                    <div class="ticket-code-cell">
                      <QrCode :size="13"/>
                      <span>{{ a.ticket_code }}</span>
                    </div>
                  </td>
                  <td>{{ fmtDate(a.registered_at) }}</td>
                  <td>
                    <span class="badge" :class="a.attended_at ? 'badge--green' : 'badge--gold'">
                      {{ a.attended_at ? `✓ ${fmtDate(a.attended_at)}` : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <button
                      v-if="!a.attended_at"
                      class="btn btn--sm btn--primary"
                      :disabled="checkingIn===a.id"
                      @click="checkIn(a)"
                    >
                      {{ checkingIn===a.id ? '…' : 'Check In' }}
                    </button>
                    <span v-else class="checked-in">Checked in</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.stat-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-md);padding:14px 20px;display:flex;align-items:center;gap:12px;min-width:140px}
.stat-card--green{border-left:3px solid #16a34a}
.stat-card--gold{border-left:3px solid var(--ma-gold)}
.stat-num{display:block;font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--ma-green-dark);line-height:1}
.stat-label{font-size:.75rem;color:var(--ma-text-muted);margin-top:2px}
/* Toolbar */
.att-toolbar{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.search-wrap{position:relative;flex:1;min-width:200px}
.si{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--ma-text-muted)}
.search-inp{width:100%;padding:7px 10px 7px 30px;border:1px solid var(--ma-border);border-radius:var(--radius-md);font-size:.83rem;background:var(--ma-white)}
.search-inp:focus{outline:none;border-color:var(--ma-green)}
.filter-tabs{display:flex;gap:4px}
.ftab{padding:6px 14px;border-radius:16px;border:1px solid var(--ma-border);background:var(--ma-white);font-size:.8rem;cursor:pointer;color:var(--ma-text-muted);display:flex;align-items:center;gap:5px}
.ftab.active{background:var(--ma-green);color:#fff;border-color:var(--ma-green)}
.ftab-count{background:rgba(0,0,0,.12);border-radius:8px;padding:1px 6px;font-size:.72rem}
/* Table */
.table-wrap{overflow-x:auto;background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg)}
.data-table{width:100%;border-collapse:collapse;font-size:.85rem}
.data-table th{padding:10px 14px;text-align:left;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--ma-text-muted);border-bottom:1px solid var(--ma-border);background:var(--ma-off-white)}
.data-table td{padding:11px 14px;border-bottom:1px solid var(--ma-border);vertical-align:middle}
.data-table tr:last-child td{border-bottom:none}
.row-attended{background:#f0fdf4}
.td-num{color:var(--ma-text-muted);font-size:.78rem}
.att-name{font-weight:600;color:var(--ma-green-dark)}
.att-email{font-size:.78rem;color:var(--ma-text-muted)}
.ticket-code-cell{display:flex;align-items:center;gap:5px;font-family:monospace;font-size:.78rem;color:var(--ma-text-muted)}
.checked-in{font-size:.78rem;color:#16a34a;font-weight:600}
</style>
