<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import StudentNav from '@/components/layout/StudentNav.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import { Calendar, MapPin, Ticket, Clock, ChevronRight, AlertCircle, QrCode } from 'lucide-vue-next'

const auth        = useAuthStore()
const registrations = ref([])
const loading       = ref(true)
const error         = ref('')
const now           = new Date()

onMounted(async () => {
  try {
    const { data } = await api.get('/registrations/my')
    registrations.value = data.data || []
  } catch {
    error.value = 'Could not load your event tickets. Please try again.'
  } finally {
    loading.value = false
  }
})

const upcoming = computed(() =>
  registrations.value.filter(r => new Date(r.event_date) >= now)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
)
const past = computed(() =>
  registrations.value.filter(r => new Date(r.event_date) < now)
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
)

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

const daysUntil = (d) => {
  const diff = Math.ceil((new Date(d) - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today!'
  if (diff === 1) return 'Tomorrow'
  return `${diff} days away`
}
</script>

<template>
  <div class="my-events-page">
    <PublicHeader />
    <StudentNav />

    <div class="page-hero">
      <div class="container">
        <h1>My Event Tickets</h1>
        <p>{{ auth.user?.name?.split(' ')[0] }}'s registered events</p>
      </div>
    </div>

    <div class="container page-body">
      <!-- Loading -->
      <div v-if="loading" class="loader-wrap">
        <BaseLoader />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="empty-state">
        <AlertCircle :size="40" color="var(--ma-red,#e53e3e)" />
        <p>{{ error }}</p>
        <button class="btn btn--outline btn--sm" @click="$router.go(0)">Retry</button>
      </div>

      <!-- No tickets at all -->
      <div v-else-if="!registrations.length" class="empty-state">
        <Ticket :size="52" color="var(--ma-border)" />
        <h3>No event tickets yet</h3>
        <p>Register for an upcoming event and your ticket will appear here.</p>
        <RouterLink to="/events" class="btn btn--primary">Browse Events</RouterLink>
      </div>

      <template v-else>
        <!-- Upcoming -->
        <section v-if="upcoming.length" class="ticket-section">
          <h2 class="section-title">
            <Calendar :size="20" /> Upcoming ({{ upcoming.length }})
          </h2>

          <div class="tickets-list">
            <div v-for="r in upcoming" :key="r.id" class="ticket-card ticket-card--upcoming">
              <!-- Countdown ribbon -->
              <div class="countdown-ribbon">{{ daysUntil(r.event_date) }}</div>

              <div class="ticket-main">
                <div class="ticket-info">
                  <h3>{{ r.title }}</h3>
                  <div class="ticket-meta">
                    <span><Calendar :size="14" /> {{ formatDate(r.event_date) }}</span>
                    <span v-if="r.venue"><MapPin :size="14" /> {{ r.venue }}</span>
                    <span><Ticket :size="14" /> {{ r.package_name }}</span>
                  </div>
                </div>

                <!-- Ticket code block -->
                <div class="ticket-code-block">
                  <div class="qr-wrap">
                    <img
                      v-if="r.qr_data"
                      :src="r.qr_data"
                      alt="Event QR Code"
                      class="qr-img"
                    />
                    <div v-else class="qr-placeholder">
                      <QrCode :size="44" color="var(--ma-green-deep)" />
                      <p>Check email for QR</p>
                    </div>
                  </div>
                  <div class="ticket-code">{{ r.ticket_code }}</div>
                </div>
              </div>

              <div class="ticket-actions">
                <span class="attended-badge" v-if="r.attended_at">✓ Attended</span>
                <RouterLink to="/events" class="btn btn--outline btn--sm">
                  View Event <ChevronRight :size="14" />
                </RouterLink>
              </div>
            </div>
          </div>
        </section>

        <!-- Past -->
        <section v-if="past.length" class="ticket-section">
          <h2 class="section-title past-title">
            <Clock :size="20" /> Past Events ({{ past.length }})
          </h2>

          <div class="tickets-list">
            <div v-for="r in past" :key="r.id" class="ticket-card ticket-card--past">
              <div class="ticket-main">
                <div class="ticket-info">
                  <h3>{{ r.title }}</h3>
                  <div class="ticket-meta">
                    <span><Calendar :size="14" /> {{ formatDate(r.event_date) }}</span>
                    <span v-if="r.venue"><MapPin :size="14" /> {{ r.venue }}</span>
                    <span><Ticket :size="14" /> {{ r.package_name }}</span>
                  </div>
                </div>
                <div class="ticket-code-block past-code">
                  <div class="ticket-code">{{ r.ticket_code }}</div>
                  <span class="attended-badge" v-if="r.attended_at">✓ Attended</span>
                  <span class="missed-badge" v-else>Not attended</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <PublicFooter />
  </div>
</template>

<style scoped>
.my-events-page{background:var(--ma-off-white);min-height:100vh}
.page-hero{background:var(--ma-green-dark);color:var(--ma-white);padding:48px 0 36px}
.page-hero h1{font-family:var(--font-heading);font-size:2rem;margin-bottom:6px}
.page-hero p{opacity:.75;font-size:.95rem}
.page-body{padding:36px 0 64px}
.loader-wrap{padding:60px 0;display:flex;justify-content:center}
.empty-state{text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:14px}
.empty-state h3{color:var(--ma-green-dark);font-family:var(--font-heading)}
.empty-state p{color:var(--ma-text-muted)}
/* Sections */
.ticket-section{margin-bottom:44px}
.section-title{display:flex;align-items:center;gap:8px;font-family:var(--font-heading);color:var(--ma-green-dark);font-size:1.15rem;margin-bottom:16px}
.past-title{color:var(--ma-text-muted)}
/* Ticket cards */
.tickets-list{display:flex;flex-direction:column;gap:16px}
.ticket-card{background:var(--ma-white);border-radius:var(--radius-lg);border:1px solid var(--ma-border);overflow:hidden;position:relative}
.ticket-card--upcoming{border-left:4px solid var(--ma-green)}
.ticket-card--past{border-left:4px solid var(--ma-border);opacity:.8}
.countdown-ribbon{position:absolute;top:12px;right:12px;background:var(--ma-green-tint);color:var(--ma-green-deep);font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:10px}
.ticket-main{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:20px 20px 0}
.ticket-info{flex:1}
.ticket-info h3{font-family:var(--font-heading);color:var(--ma-green-dark);font-size:1.05rem;margin-bottom:10px}
.ticket-meta{display:flex;flex-direction:column;gap:6px}
.ticket-meta span{display:flex;align-items:center;gap:6px;font-size:.82rem;color:var(--ma-text-muted)}
/* Code block */
.ticket-code-block{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:120px}
.qr-wrap{background:var(--ma-green-tint);border-radius:var(--radius-md);padding:8px;display:flex;align-items:center;justify-content:center}
.qr-img{width:100px;height:100px;display:block;border-radius:4px}
.qr-placeholder{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px;background:var(--ma-green-tint);border-radius:var(--radius-md)}
.qr-placeholder p{font-size:.65rem;color:var(--ma-green-deep);text-align:center;max-width:80px}
.ticket-code{font-family:monospace;font-size:.75rem;background:var(--ma-off-white);border:1px dashed var(--ma-border);padding:5px 10px;border-radius:6px;letter-spacing:.08em;color:var(--ma-green-dark)}
.past-code{flex-direction:column;align-items:flex-end}
/* Actions bar */
.ticket-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:12px 20px;border-top:1px solid var(--ma-border);margin-top:16px}
.attended-badge{background:#d4edda;color:#155724;font-size:.75rem;font-weight:700;padding:3px 10px;border-radius:10px}
.missed-badge{background:var(--ma-off-white);color:var(--ma-text-muted);font-size:.75rem;padding:3px 10px;border-radius:10px}
@media(max-width:600px){.ticket-main{flex-direction:column}.ticket-code-block{align-items:flex-start}.past-code{align-items:flex-start}}
</style>
