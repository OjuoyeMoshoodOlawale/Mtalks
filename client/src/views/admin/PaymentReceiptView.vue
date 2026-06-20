<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Printer, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-vue-next'
import api from '@/services/api'

const route  = useRoute()
const router = useRouter()
const p      = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get(`/payments/${route.params.id}`)
    p.value = data.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

const fmt      = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })
const fmtDate  = (d) => d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'full', timeStyle: 'short' }) : '—'
const statusIcon = computed(() =>
  p.value?.status === 'success' ? 'paid' : p.value?.status === 'failed' ? 'failed' : 'pending'
)
</script>

<template>
  <div class="receipt-page">
    <!-- Toolbar (hidden on print) -->
    <div class="receipt-toolbar no-print">
      <button @click="router.back()" class="btn btn--outline btn--sm">
        <ArrowLeft :size="14"/> Back
      </button>
      <h1 style="margin:0;font-size:1.1rem;color:var(--ma-green-dark)">Payment Receipt</h1>
      <button @click="window.print()" class="btn btn--primary btn--sm">
        <Printer :size="14"/> Print / Save PDF
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;height:60vh">
      <div class="spinner" style="width:36px;height:36px;border-width:3px"/>
    </div>

    <!-- Receipt card -->
    <div v-else-if="p" class="receipt-card">

      <!-- Header -->
      <div class="receipt-head">
        <div class="receipt-logo">M</div>
        <div>
          <h2 class="receipt-brand">Muhsinah Academy</h2>
          <p class="receipt-sub">muhsinahacademy.com · Abuja, Nigeria</p>
        </div>
        <div class="receipt-status" :class="'status--' + statusIcon">
          <CheckCircle v-if="statusIcon==='paid'"    :size="20"/>
          <XCircle     v-else-if="statusIcon==='failed'" :size="20"/>
          <Clock       v-else :size="20"/>
          {{ p.status === 'success' ? 'PAID' : p.status === 'failed' ? 'FAILED' : 'PENDING' }}
        </div>
      </div>

      <div class="receipt-divider"/>

      <!-- Receipt reference + date -->
      <div class="receipt-meta">
        <div>
          <p class="meta-label">Receipt No.</p>
          <p class="meta-value code">{{ p.reference }}</p>
        </div>
        <div style="text-align:right">
          <p class="meta-label">Date</p>
          <p class="meta-value">{{ fmtDate(p.paid_at || p.created_at) }}</p>
        </div>
      </div>

      <div class="receipt-divider"/>

      <!-- Payer -->
      <div class="receipt-section">
        <p class="section-title">Bill To</p>
        <div class="row-grid">
          <div>
            <p class="cell-label">Name</p>
            <p class="cell-val">{{ p.user_name }}</p>
          </div>
          <div>
            <p class="cell-label">Email</p>
            <p class="cell-val">{{ p.user_email }}</p>
          </div>
          <div v-if="!p.user_id">
            <p class="cell-label">Account type</p>
            <p class="cell-val" style="color:var(--ma-text-muted)">Guest (no account)</p>
          </div>
        </div>
      </div>

      <div class="receipt-divider"/>

      <!-- Line items -->
      <div class="receipt-section">
        <p class="section-title">Service</p>
        <table class="line-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{{ p.item_title }}</strong>
                <span v-if="p.package_name" style="display:block;font-size:.78rem;color:var(--ma-text-muted);margin-top:2px">
                  Package: {{ p.package_name }}
                </span>
              </td>
              <td>
                <span class="badge">{{ p.type }}</span>
              </td>
              <td class="text-right amount">{{ fmt(p.amount) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="total-label">Total Paid</td>
              <td class="text-right total-amount">{{ fmt(p.amount) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="receipt-divider"/>

      <!-- Footer -->
      <div class="receipt-footer">
        <p>Thank you for your trust in Muhsinah Academy.</p>
        <p style="font-size:.72rem;color:var(--ma-text-muted);margin-top:4px">
          This is an automatically generated receipt. For inquiries: info@muhsinahacademy.com
        </p>
        <p style="font-size:.72rem;color:var(--ma-text-muted);margin-top:2px">
          Reference: {{ p.reference }} · Generated: {{ new Date().toLocaleDateString('en-NG') }}
        </p>
      </div>

    </div>

    <div v-else style="text-align:center;padding:60px;color:var(--ma-text-muted)">
      Payment not found.
    </div>
  </div>
</template>

<style scoped>
.receipt-page { background: var(--ma-off-white); min-height: 100vh; padding: 24px; }

/* Toolbar */
.receipt-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 720px; margin: 0 auto 24px; gap: 16px;
}

/* Card */
.receipt-card {
  max-width: 720px; margin: 0 auto;
  background: var(--ma-white); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md); overflow: hidden;
  border: 1px solid var(--ma-border);
}

/* Header */
.receipt-head {
  display: flex; align-items: center; gap: 16px;
  padding: 28px 36px; background: var(--ma-green-dark);
}
.receipt-logo {
  width: 48px; height: 48px; border-radius: 12px;
  background: #76C442; color: var(--ma-white);
  font-size: 1.6rem; font-weight: 900; font-family: var(--font-heading);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.receipt-brand { color: var(--ma-white); font-family: var(--font-heading); margin: 0; font-size: 1.15rem; }
.receipt-sub   { color: rgba(255,255,255,.55); font-size: .75rem; margin: 2px 0 0; }
.receipt-status {
  margin-left: auto; display: flex; align-items: center; gap: 7px;
  font-weight: 800; font-size: .85rem; letter-spacing: .06em;
  padding: 8px 18px; border-radius: 24px;
}
.status--paid    { background: rgba(118,196,66,.2); color: #76C442; }
.status--failed  { background: rgba(220,38,38,.2);  color: #fca5a5; }
.status--pending { background: rgba(212,160,23,.2); color: #D4A017; }

/* Divider */
.receipt-divider { height: 1px; background: var(--ma-border); margin: 0 36px; }

/* Meta row */
.receipt-meta {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 36px;
}
.meta-label { font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--ma-text-muted); margin: 0 0 4px; }
.meta-value { margin: 0; font-size: .9rem; font-weight: 600; color: var(--ma-text); }
.meta-value.code { font-family: monospace; font-size: .82rem; }

/* Sections */
.receipt-section { padding: 20px 36px; }
.section-title {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--ma-text-muted); margin: 0 0 14px;
}
.row-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.cell-label { font-size: .72rem; font-weight: 700; color: var(--ma-text-muted); margin: 0 0 3px; }
.cell-val { font-size: .88rem; color: var(--ma-text); margin: 0; }

/* Table */
.line-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.line-table th {
  text-align: left; padding: 8px 12px; font-size: .72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  color: var(--ma-text-muted); border-bottom: 1px solid var(--ma-border);
}
.line-table td { padding: 14px 12px; border-bottom: 1px dashed var(--ma-border); vertical-align: top; }
.line-table tfoot td { border-bottom: none; padding-top: 16px; }
.text-right   { text-align: right; }
.amount       { font-weight: 600; color: var(--ma-green-dark); }
.total-label  { font-weight: 700; color: var(--ma-text-muted); font-size: .82rem;
  text-transform: uppercase; letter-spacing: .06em; }
.total-amount { font-size: 1.15rem; font-weight: 800; color: var(--ma-green-dark); }
.badge {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  background: var(--ma-green-tint); color: var(--ma-green-deep);
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
}

/* Footer */
.receipt-footer {
  padding: 20px 36px 28px; text-align: center;
  background: var(--ma-off-white); border-top: 1px solid var(--ma-border);
}
.receipt-footer p { margin: 0; font-size: .82rem; color: var(--ma-text-muted); }

/* Print styles */
@media print {
  .no-print { display: none !important; }
  .receipt-page { background: white; padding: 0; }
  .receipt-card {
    max-width: 100%; box-shadow: none; border: 1px solid #ccc;
    border-radius: 0;
  }
  .receipt-head { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
@media (max-width: 600px) {
  .receipt-head { padding: 20px; flex-wrap: wrap; }
  .receipt-section, .receipt-meta { padding: 16px 20px; }
  .receipt-divider { margin: 0 20px; }
  .row-grid { grid-template-columns: 1fr 1fr; }
}
</style>
