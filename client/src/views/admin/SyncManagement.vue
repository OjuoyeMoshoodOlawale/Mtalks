<script setup>
import { ref, onMounted, computed } from 'vue'
import { Database, RefreshCw, Play, RotateCcw, CheckCircle,
         XCircle, Clock, Wifi, WifiOff, Settings, Table2, FileText } from 'lucide-vue-next'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

/* ── State ── */
const tab      = ref('overview')   // overview | settings | tables | logs
const status   = ref(null)
const settings = ref({})
const tables   = ref([])
const logs     = ref([])
const loading  = ref(true)
const saving   = ref(false)
const running  = ref(false)
const testing  = ref(false)
const resetting = ref(false)

const form = ref({
  remote_host: '', remote_port: 3306, remote_user: '',
  remote_password: '', remote_database: '',
  sync_interval: 30, sync_enabled: false
})

/* ── Load ── */
const loadStatus = async () => {
  const { data } = await api.get('/sync/status')
  status.value = data.data
}
const loadSettings = async () => {
  const { data } = await api.get('/sync/settings')
  const s = data.data || {}
  settings.value = s
  form.value = {
    remote_host:     s.remote_host     || '',
    remote_port:     s.remote_port     || 3306,
    remote_user:     s.remote_user     || '',
    remote_password: '',              // never pre-fill password
    remote_database: s.remote_database|| '',
    sync_interval:   s.sync_interval   || 30,
    sync_enabled:    !!s.sync_enabled
  }
}
const loadTables = async () => {
  const { data } = await api.get('/sync/tables')
  tables.value = data.data || []
}
const loadLogs = async () => {
  const { data } = await api.get('/sync/logs')
  logs.value = data.data || []
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadStatus(), loadSettings()])
  loading.value = false
})

/* ── Actions ── */
const save = async () => {
  saving.value = true
  try {
    await api.put('/sync/settings', form.value)
    ui.toast('Sync settings saved. Server will apply interval on next restart.')
    await loadSettings()
    await loadStatus()
  } catch (e) { ui.toastError(e.response?.data?.message || 'Save failed') }
  finally { saving.value = false }
}

const testConn = async () => {
  if (!form.value.remote_host) { ui.toastError('Enter a host first'); return }
  testing.value = true
  try {
    const { data } = await api.post('/sync/test-connection', form.value)
    if (data.data?.error) ui.toastError('Connection failed: ' + data.data.error)
    else ui.toast(data.data?.message || 'Connected!')
  } catch (e) { ui.toastError(e.response?.data?.message || 'Test failed') }
  finally { testing.value = false }
}

const runNow = async () => {
  running.value = true
  try {
    await api.post('/sync/run')
    ui.toast('Sync started in background. Refreshing status...')
    setTimeout(async () => { await loadStatus(); running.value = false }, 4000)
  } catch (e) { ui.toastError('Sync failed to start'); running.value = false }
}

const resetSync = async () => {
  if (!confirm('This will mark ALL rows as unsynced and trigger a full resync on next run. Continue?')) return
  resetting.value = true
  try {
    const { data } = await api.post('/sync/reset')
    ui.toast(data.data?.message || 'Reset complete')
    await loadStatus()
    await loadTables()
  } catch (e) { ui.toastError('Reset failed') }
  finally { resetting.value = false }
}

const switchTab = async (t) => {
  tab.value = t
  if (t === 'tables' && !tables.value.length) await loadTables()
  if (t === 'logs'   && !logs.value.length)   await loadLogs()
}

/* ── Computed ── */
const statusColor = computed(() => ({
  success: 'var(--ma-green)', failed: '#dc2626',
  partial: 'var(--ma-gold)', never: 'var(--ma-text-muted)'
}[status.value?.lastStatus || 'never']))

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'
const fmtDuration = (start, end) => {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title"><Database :size="22"/> Remote Sync</h1>
        <p class="admin-page-sub">Mirror your local database to a remote server for read-only access anywhere</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <div v-if="status" class="sync-status-pill" :class="status.enabled && status.configured ? 'pill--on' : 'pill--off'">
          <Wifi v-if="status.enabled && status.configured" :size="13"/>
          <WifiOff v-else :size="13"/>
          {{ status.enabled && status.configured ? 'Sync Active' : status.enabled ? 'Not Configured' : 'Sync Off' }}
        </div>
        <BaseButton v-if="status?.configured" :loading="running" @click="runNow" variant="outline" size="sm">
          <Play :size="14"/> Sync Now
        </BaseButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="sync-tabs">
      <button v-for="t in [['overview','Overview'],['settings','Settings'],['tables','Tables'],['logs','Logs']]"
        :key="t[0]" class="sync-tab" :class="{active: tab===t[0]}"
        @click="switchTab(t[0])">{{ t[1] }}</button>
    </div>

    <div v-if="loading" style="padding:40px;text-align:center;color:var(--ma-text-muted)">Loading...</div>

    <!-- ───────── OVERVIEW ───────── -->
    <div v-else-if="tab==='overview'" class="sync-grid">
      <!-- Status card -->
      <div class="sync-card">
        <p class="card-title"><CheckCircle :size="15"/> Sync Status</p>
        <div class="stat-row">
          <span>Last synced</span><strong>{{ fmtDate(status?.lastSynced) }}</strong>
        </div>
        <div class="stat-row">
          <span>Last result</span>
          <span :style="{color: statusColor, fontWeight: 700, textTransform:'uppercase', fontSize:'.82rem'}">
            {{ status?.lastStatus || 'Never' }}
          </span>
        </div>
        <div class="stat-row">
          <span>Remote host</span>
          <code>{{ status?.remoteHost || '—' }}</code>
        </div>
        <div class="stat-row">
          <span>Remote DB</span>
          <code>{{ status?.remoteDB || '—' }}</code>
        </div>
        <div class="stat-row">
          <span>Interval</span>
          <strong>Every {{ status?.interval || 30 }} min</strong>
        </div>
        <div v-if="status?.lastError" class="error-note">{{ status.lastError }}</div>
      </div>

      <!-- Pending card -->
      <div class="sync-card">
        <p class="card-title"><Clock :size="15"/> Pending Sync</p>
        <div class="pending-count">{{ status?.totalPending || 0 }}</div>
        <p style="margin:0;font-size:.82rem;color:var(--ma-text-muted)">rows awaiting sync</p>
        <div v-if="status?.pendingCounts && Object.keys(status.pendingCounts).length" style="margin-top:14px">
          <div v-for="(cnt, tbl) in status.pendingCounts" :key="tbl" class="stat-row">
            <code style="font-size:.75rem">{{ tbl }}</code><strong>{{ cnt }}</strong>
          </div>
        </div>
        <p v-else style="font-size:.82rem;color:var(--ma-green);margin-top:14px">All rows synced</p>
      </div>

      <!-- Actions card -->
      <div class="sync-card">
        <p class="card-title"><Settings :size="15"/> Actions</p>
        <BaseButton :loading="running" @click="runNow" class="w-full" style="margin-bottom:10px">
          <Play :size="14"/> Run Sync Now
        </BaseButton>
        <BaseButton variant="outline" :loading="resetting" @click="resetSync" class="w-full">
          <RotateCcw :size="14"/> Reset All (Full Resync)
        </BaseButton>
        <p style="font-size:.72rem;color:var(--ma-text-muted);margin-top:10px">
          "Reset All" marks every row as unsynced so the next run mirrors your entire database.
          Use when setting up a new remote DB.
        </p>
      </div>
    </div>

    <!-- ───────── SETTINGS ───────── -->
    <div v-else-if="tab==='settings'" class="sync-card" style="max-width:600px">
      <p class="card-title"><Settings :size="15"/> Remote Database Configuration</p>
      <p style="font-size:.84rem;color:var(--ma-text-muted);margin-bottom:20px">
        Enter your remote MySQL database credentials. The sync will push all data here.
        Create a <strong>separate database user</strong> on the remote with full privileges on the mirror DB,
        then give your customers read-only access.
      </p>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Remote Host *</label>
          <input v-model="form.remote_host" class="form-input" placeholder="db.example.com or IP address"/>
        </div>
        <div class="form-group">
          <label class="form-label">Port</label>
          <input v-model="form.remote_port" type="number" class="form-input" placeholder="3306"/>
        </div>
        <div class="form-group">
          <label class="form-label">Database Name *</label>
          <input v-model="form.remote_database" class="form-input" placeholder="muhsinah_mirror"/>
        </div>
        <div class="form-group">
          <label class="form-label">Username *</label>
          <input v-model="form.remote_user" class="form-input" placeholder="sync_user"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Password {{ settings.remote_password_set ? '(set — leave blank to keep)' : '' }}</label>
          <input v-model="form.remote_password" type="password" class="form-input" placeholder="Leave blank to keep current"/>
        </div>
      </div>

      <div class="form-grid" style="margin-top:16px">
        <div class="form-group">
          <label class="form-label">Sync Interval (minutes)</label>
          <input v-model="form.sync_interval" type="number" min="1" max="1440" class="form-input"/>
          <p style="font-size:.72rem;color:var(--ma-text-muted);margin-top:4px">Min 1 minute, max 1440 (24h). Restart server to apply change.</p>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:12px;padding-top:24px">
          <input type="checkbox" v-model="form.sync_enabled" id="syncEnabled" style="width:18px;height:18px;accent-color:var(--ma-green)"/>
          <label for="syncEnabled" style="font-weight:600;cursor:pointer">Enable automatic sync</label>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
        <BaseButton :loading="testing" @click="testConn" variant="outline">Test Connection</BaseButton>
        <BaseButton :loading="saving" @click="save">Save Settings</BaseButton>
      </div>

      <div class="info-box" style="margin-top:24px">
        <p style="font-weight:700;margin:0 0 8px">How to set up read-only customer access</p>
        <ol style="margin:0;padding-left:18px;font-size:.82rem;line-height:1.8">
          <li>Create a MySQL DB on your cloud host (PlanetScale, Railway, Aiven, or any shared host)</li>
          <li>Create a <code>sync_user</code> with full privileges on that DB (for the sync to write)</li>
          <li>Create a <code>readonly_user</code> with SELECT-only on that DB (share with your customer)</li>
          <li>Enter the <code>sync_user</code> credentials here and enable sync</li>
          <li>Click "Reset All + Run Now" to push the full database immediately</li>
          <li>Share the <code>readonly_user</code> credentials + host/DB name with your customer</li>
        </ol>
      </div>
    </div>

    <!-- ───────── TABLES ───────── -->
    <div v-else-if="tab==='tables'">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Table</th>
              <th class="text-right">Total rows</th>
              <th class="text-right">Synced</th>
              <th class="text-right">Pending</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tables" :key="t.table">
              <td><code>{{ t.table }}</code><span v-if="t.note" style="font-size:.7rem;color:var(--ma-text-muted);display:block">{{ t.note }}</span></td>
              <td class="text-right">{{ t.total.toLocaleString() }}</td>
              <td class="text-right" style="color:var(--ma-green)">{{ t.synced.toLocaleString() }}</td>
              <td class="text-right" :style="t.pending>0 ? 'color:var(--ma-gold);font-weight:700' : ''">
                {{ t.pending.toLocaleString() }}
              </td>
              <td>
                <span v-if="t.note" class="table-badge table-badge--grey">Migration needed</span>
                <span v-else-if="t.pending===0" class="table-badge table-badge--green">Synced</span>
                <span v-else class="table-badge table-badge--gold">{{ t.pending }} pending</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ───────── LOGS ───────── -->
    <div v-else-if="tab==='logs'">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Started</th>
              <th>Duration</th>
              <th class="text-right">Rows</th>
              <th class="text-right">Tables</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.id }}</td>
              <td style="font-size:.8rem">{{ fmtDate(log.started_at) }}</td>
              <td style="font-size:.8rem">{{ fmtDuration(log.started_at, log.finished_at) }}</td>
              <td class="text-right">{{ log.rows_synced }}</td>
              <td class="text-right">{{ log.tables_synced }}</td>
              <td>
                <span class="table-badge"
                  :class="log.status==='success'?'table-badge--green':log.status==='failed'?'table-badge--red':'table-badge--gold'">
                  {{ log.status }}
                </span>
              </td>
              <td style="font-size:.75rem;color:#dc2626;max-width:200px">{{ log.error || '—' }}</td>
            </tr>
            <tr v-if="!logs.length">
              <td colspan="7" style="text-align:center;color:var(--ma-text-muted);padding:32px">No sync runs yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sync-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; }
.sync-card   { background:var(--ma-white);border-radius:var(--radius-lg);padding:24px;border:1px solid var(--ma-border); }
.card-title  { font-family:var(--font-heading);font-weight:700;color:var(--ma-green-dark);margin:0 0 16px;display:flex;align-items:center;gap:7px; }
.stat-row    { display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--ma-border);font-size:.85rem; }
.stat-row span:first-child { color:var(--ma-text-muted); }
.stat-row code { font-size:.78rem;background:var(--ma-off-white);padding:2px 7px;border-radius:5px; }
.pending-count { font-size:2.4rem;font-weight:800;font-family:var(--font-heading);color:var(--ma-green-dark);margin:8px 0; }
.error-note  { background:#fee2e2;border-radius:8px;padding:10px 12px;font-size:.78rem;color:#991b1b;margin-top:12px; }
.sync-tabs   { display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid var(--ma-border);padding-bottom:0; }
.sync-tab    { padding:8px 18px;border:none;background:none;cursor:pointer;font-weight:600;font-size:.85rem;color:var(--ma-text-muted);border-bottom:2px solid transparent;transition:all .15s; }
.sync-tab.active { color:var(--ma-green-deep);border-bottom-color:var(--ma-green); }
.sync-status-pill { display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:.78rem;font-weight:700; }
.pill--on  { background:var(--ma-green-tint);color:var(--ma-green-deep); }
.pill--off { background:var(--ma-off-white);color:var(--ma-text-muted); }
.form-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
.info-box  { background:var(--ma-off-white);border-radius:var(--radius-md);padding:16px;border:1px solid var(--ma-border); }
.text-right { text-align:right; }
.table-badge--red { background:#fee2e2;color:#dc2626; }
code { font-family:monospace;font-size:.82rem; }
@media(max-width:600px){
  .form-grid{grid-template-columns:1fr}
  .sync-grid{grid-template-columns:1fr}
}
</style>
