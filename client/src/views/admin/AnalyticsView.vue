<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Menu, TrendingUp, Users, BookOpen, Calendar } from 'lucide-vue-next'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend)

const stats=ref(null); const loading=ref(true); const sidebarOpen=ref(false)
onMounted(async () => { try { const {data}=await api.get('/analytics/overview'); stats.value=data.data } finally { loading.value=false } })
const fmt=(n)=>`₦${Number(n||0).toLocaleString()}`

const revenueOpts = { responsive:true, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:(v)=>`₦${(v/1000).toFixed(0)}k`}}} }
const donutOpts   = { responsive:true, plugins:{legend:{position:'bottom'}} }
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Analytics</h1>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:60px"/>
        <div v-else-if="stats">
          <!-- Summary row -->
          <div class="kpi-grid" style="margin-bottom:24px">
            <div class="kpi"><TrendingUp :size="22" color="var(--ma-green-deep)"/><div><p class="kpi-l">Total Revenue</p><p class="kpi-v">{{ fmt(stats.overview.total_revenue) }}</p></div></div>
            <div class="kpi"><TrendingUp :size="22" color="var(--ma-green-mid)"/><div><p class="kpi-l">This Month</p><p class="kpi-v">{{ fmt(stats.overview.month_revenue) }}</p></div></div>
            <div class="kpi"><Users :size="22" color="#7A5F00"/><div><p class="kpi-l">Students</p><p class="kpi-v">{{ stats.overview.total_students }}</p></div></div>
            <div class="kpi"><BookOpen :size="22" color="var(--ma-green-deep)"/><div><p class="kpi-l">Enrolments</p><p class="kpi-v">{{ stats.overview.total_enrollments }}</p></div></div>
            <div class="kpi"><Calendar :size="22" color="#7A5F00"/><div><p class="kpi-l">Event Registrations</p><p class="kpi-v">{{ stats.overview.total_events }}</p></div></div>
          </div>

          <div class="charts-row">
            <div class="chart-card" v-if="stats.revenueByMonth?.length">
              <h3 class="chart-title">Revenue Trend (Last 6 Months)</h3>
              <Bar :data="{labels:stats.revenueByMonth.map(r=>r.month),datasets:[{label:'Revenue',data:stats.revenueByMonth.map(r=>r.revenue),backgroundColor:'#76C442',borderRadius:6}]}" :options="revenueOpts"/>
            </div>
            <div class="chart-card" v-if="stats.topCourses?.length">
              <h3 class="chart-title">Enrolments by Course</h3>
              <Doughnut :data="{labels:stats.topCourses.map(c=>c.title),datasets:[{data:stats.topCourses.map(c=>c.enrollments),backgroundColor:['#76C442','#1D6B1D','#F0C130','#4A9E2C','#EBF7DC']}]}" :options="donutOpts" style="max-height:260px"/>
            </div>
          </div>

          <div v-if="stats.eventStats?.length" class="chart-card" style="margin-top:20px">
            <h3 class="chart-title">Event Registrations</h3>
            <Bar :data="{labels:stats.eventStats.map(e=>e.title),datasets:[{label:'Registrations',data:stats.eventStats.map(e=>e.registrations),backgroundColor:'#F0C130',borderRadius:6}]}" :options="{responsive:true,plugins:{legend:{display:false}}}"/>
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
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
.kpi{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:18px;display:flex;align-items:center;gap:14px}
.kpi-l{font-size:.78rem;color:var(--ma-text-muted);margin:0 0 4px}
.kpi-v{font-family:var(--font-heading);font-size:1.3rem;font-weight:700;color:var(--ma-green-dark);margin:0}
.charts-row{display:grid;grid-template-columns:1.5fr 1fr;gap:20px}
@media(max-width:768px){.charts-row{grid-template-columns:1fr}}
.chart-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:24px}
.chart-title{font-family:var(--font-heading);font-size:.95rem;color:var(--ma-green-dark);margin-bottom:16px}
</style>
