<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink }      from 'vue-router'
import api from '@/services/api'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { TrendingUp, Users, BookOpen, Calendar, CreditCard, Menu } from 'lucide-vue-next'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)

const sidebarOpen = ref(false)
const loading     = ref(true)
const stats       = ref(null)

onMounted(async () => {
  try { const { data } = await api.get('/analytics/overview'); stats.value = data.data }
  finally { loading.value = false }
})

const fmt = (n) => Number(n).toLocaleString('en-NG')

const revenueChart = () => ({
  labels: stats.value.revenueByMonth.map(r => r.month),
  datasets: [{
    label: 'Revenue (₦)',
    data: stats.value.revenueByMonth.map(r => r.revenue),
    backgroundColor: '#76C442', borderRadius: 6
  }]
})

const coursesChart = () => ({
  labels: stats.value.topCourses.map(c => c.title),
  datasets: [{
    data: stats.value.topCourses.map(c => c.enrollments),
    backgroundColor: ['#76C442','#1D6B1D','#F0C130','#4A9E2C','#EBF7DC']
  }]
})
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false" />
    <div class="admin-main">
      <!-- Top bar -->
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true" aria-label="Open menu"><Menu :size="22" /></button>
        <h1 class="topbar-title">Dashboard</h1>
        <RouterLink to="/" class="btn btn--sm btn--outline" style="margin-left:auto">View Site</RouterLink>
      </div>

      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:80px" />
        <div v-else-if="stats">
          <!-- KPI cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon green"><CreditCard :size="22" /></div>
              <div><p class="kpi-label">Total Revenue</p><p class="kpi-value">₦{{ fmt(stats.overview.total_revenue) }}</p></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green-light"><CreditCard :size="22" /></div>
              <div><p class="kpi-label">This Month</p><p class="kpi-value">₦{{ fmt(stats.overview.month_revenue) }}</p></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon gold"><Users :size="22" /></div>
              <div><p class="kpi-label">Total Students</p><p class="kpi-value">{{ stats.overview.total_students }}</p></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green"><BookOpen :size="22" /></div>
              <div><p class="kpi-label">Enrollments</p><p class="kpi-value">{{ stats.overview.total_enrollments }}</p></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon gold"><Calendar :size="22" /></div>
              <div><p class="kpi-label">Event Registrations</p><p class="kpi-value">{{ stats.overview.total_events }}</p></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green-light"><TrendingUp :size="22" /></div>
              <div><p class="kpi-label">New Users (7d)</p><p class="kpi-value">{{ stats.overview.new_users }}</p></div>
            </div>
          </div>

          <!-- Charts -->
          <div class="charts-row">
            <div class="chart-card" v-if="stats.revenueByMonth?.length">
              <h3 class="chart-title">Revenue (Last 6 Months)</h3>
              <Bar :data="revenueChart()" :options="{responsive:true,plugins:{legend:{display:false}}}" />
            </div>
            <div class="chart-card" v-if="stats.topCourses?.length">
              <h3 class="chart-title">Enrollments by Course</h3>
              <Doughnut :data="coursesChart()" :options="{responsive:true,plugins:{legend:{position:'bottom'}}}" style="max-height:260px" />
            </div>
          </div>

          <!-- Recent Payments -->
          <div class="recent-table-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h3 class="chart-title" style="margin:0">Recent Payments</h3>
              <RouterLink to="/admin/payments" class="btn btn--sm btn--outline">View All</RouterLink>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Student</th><th>Type</th><th>Amount</th><th>Reference</th><th>Date</th></tr></thead>
                <tbody>
                  <tr v-for="p in stats.recentPayments" :key="p.id">
                    <td>{{ p.user_name }}</td>
                    <td><span class="badge" :class="p.type==='course'?'badge--green':'badge--gold'">{{ p.type }}</span></td>
                    <td>₦{{ fmt(p.amount) }}</td>
                    <td style="font-family:var(--font-mono);font-size:.78rem">{{ p.reference }}</td>
                    <td style="white-space:nowrap;font-size:.82rem;color:var(--ma-text-muted)">{{ new Date(p.paid_at).toLocaleDateString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-layout{display:flex;min-height:100vh}
.admin-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.admin-topbar{background:var(--ma-white);border-bottom:1px solid var(--ma-border);padding:0 24px;height:60px;display:flex;align-items:center;gap:16px;flex-shrink:0}
.topbar-toggle{color:var(--ma-text);display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;transition:background var(--trans-fast)}
.topbar-toggle:hover{background:var(--ma-green-tint)}
.topbar-title{font-family:var(--font-heading);font-size:1.15rem;color:var(--ma-green-dark);margin:0}
.admin-content{flex:1;padding:24px;overflow-y:auto;background:var(--ma-off-white)}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.kpi-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:20px;display:flex;align-items:center;gap:16px}
.kpi-icon{width:44px;height:44px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.kpi-icon.green{background:var(--ma-green-tint);color:var(--ma-green-deep)}
.kpi-icon.green-light{background:#e8f5e9;color:var(--ma-green-mid)}
.kpi-icon.gold{background:var(--ma-gold-tint);color:#7A5F00}
.kpi-label{font-size:.78rem;color:var(--ma-text-muted);margin-bottom:4px}
.kpi-value{font-family:var(--font-heading);font-size:1.4rem;font-weight:700;color:var(--ma-green-dark)}
.charts-row{display:grid;grid-template-columns:1.5fr 1fr;gap:20px;margin-bottom:24px}
@media(max-width:768px){.charts-row{grid-template-columns:1fr}}
.chart-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:24px}
.chart-title{font-family:var(--font-heading);font-size:1rem;color:var(--ma-green-dark);margin-bottom:16px}
.recent-table-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:24px}
.table-wrap{overflow-x:auto}
.data-table{width:100%;border-collapse:collapse;font-size:.875rem}
.data-table th{text-align:left;padding:10px 12px;font-size:.78rem;color:var(--ma-text-muted);border-bottom:2px solid var(--ma-border);font-weight:600;white-space:nowrap}
.data-table td{padding:11px 12px;border-bottom:1px solid var(--ma-border);color:var(--ma-text)}
.data-table tr:last-child td{border-bottom:none}
.data-table tr:hover td{background:var(--ma-off-white)}
</style>
