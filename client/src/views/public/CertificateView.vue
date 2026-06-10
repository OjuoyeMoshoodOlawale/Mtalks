<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import BaseLoader from '@/components/common/BaseLoader.vue'
import { Printer, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-vue-next'

const route = useRoute()
const auth  = useAuthStore()
const cert  = ref(null)
const loading = ref(true)
const error   = ref('')

onMounted(async () => {
  try {
    // Verify the code — works for both owner and public verification
    const { data } = await api.get(`/certificates/verify/${route.params.code}`)
    cert.value = data.data
  } catch (e) {
    error.value = e.response?.data?.message || 'Certificate not found'
  } finally {
    loading.value = false
  }
})

const fmtDate = (d) => new Date(d).toLocaleDateString('en-NG', {
  day: 'numeric', month: 'long', year: 'numeric'
})

const print = () => window.print()
</script>

<template>
  <div class="cert-page">
    <!-- Toolbar (hidden on print) -->
    <div class="cert-toolbar no-print">
      <RouterLink :to="auth.isLoggedIn ? '/dashboard' : '/'" class="btn btn--outline btn--sm">
        <ArrowLeft :size="14"/> Back
      </RouterLink>
      <button v-if="cert" class="btn btn--primary btn--sm" @click="print">
        <Printer :size="14"/> Print / Save as PDF
      </button>
    </div>

    <div v-if="loading" class="cert-center"><BaseLoader/></div>

    <div v-else-if="error" class="cert-center cert-error">
      <AlertCircle :size="44" color="#ef4444"/>
      <h2>Invalid Certificate</h2>
      <p>{{ error }}</p>
    </div>

    <!--  The certificate  -->
    <div v-else class="cert-frame">
      <div class="cert-inner">
        <div class="cert-border">
          <!-- Header -->
          <div class="cert-brand">
            <div class="cert-logo">M</div>
            <div>
              <p class="cert-academy">Muhsinah Academy</p>
              <p class="cert-tagline">Life & Marriage Coaching</p>
            </div>
          </div>

          <p class="cert-label">Certificate of Completion</p>
          <p class="cert-presented">This certificate is proudly presented to</p>

          <h1 class="cert-name">{{ cert.student_name }}</h1>

          <div class="cert-divider"></div>

          <p class="cert-for">for successfully completing the course</p>
          <h2 class="cert-course">{{ cert.course_title }}</h2>

          <p class="cert-date">Issued on {{ fmtDate(cert.issued_at) }}</p>

          <!-- Footer -->
          <div class="cert-footer">
            <div class="cert-sign">
              <p class="sign-line">Madinah Sanni</p>
              <p class="sign-role">Founder & Lead Coach</p>
            </div>
            <div class="cert-seal">
              <ShieldCheck :size="34" color="var(--ma-green-deep)"/>
              <p>VERIFIED</p>
            </div>
            <div class="cert-verify">
              <p class="verify-code">{{ cert.cert_code }}</p>
              <p class="verify-hint">Verify at muhsinahacademy.com/certificate/{{ cert.cert_code }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cert-page{min-height:100vh;background:#e8ece5;padding:24px;display:flex;flex-direction:column;align-items:center;gap:20px}
.cert-toolbar{display:flex;gap:10px;width:100%;max-width:900px;justify-content:space-between}
.cert-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
.cert-error h2{font-family:var(--font-heading);color:#ef4444}
.cert-error p{color:var(--ma-text-muted)}
/* Certificate */
.cert-frame{width:100%;max-width:900px;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.12)}
.cert-inner{padding:14px}
.cert-border{border:3px double var(--ma-green-deep);padding:48px 56px;text-align:center;position:relative;background:
  radial-gradient(circle at 0% 0%,   rgba(118,196,66,.05) 0%, transparent 32%),
  radial-gradient(circle at 100% 100%, rgba(240,193,48,.06) 0%, transparent 32%)}
.cert-brand{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:28px}
.cert-logo{width:48px;height:48px;background:var(--ma-green-dark);color:var(--ma-green);font-family:var(--font-heading);font-size:1.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;border-radius:10px}
.cert-academy{font-family:var(--font-heading);font-size:1.15rem;font-weight:700;color:var(--ma-green-dark);text-align:left}
.cert-tagline{font-size:.72rem;color:var(--ma-text-muted);letter-spacing:.1em;text-transform:uppercase;text-align:left}
.cert-label{font-size:.8rem;letter-spacing:.3em;text-transform:uppercase;color:var(--ma-gold);font-weight:700;margin-bottom:18px}
.cert-presented{font-size:.9rem;color:var(--ma-text-muted);margin-bottom:8px}
.cert-name{font-family:var(--font-heading);font-size:clamp(1.8rem,5vw,2.8rem);color:var(--ma-green-dark);margin-bottom:14px}
.cert-divider{width:120px;height:2px;background:var(--ma-gold);margin:0 auto 18px}
.cert-for{font-size:.9rem;color:var(--ma-text-muted);margin-bottom:6px}
.cert-course{font-family:var(--font-heading);font-size:clamp(1.1rem,3vw,1.5rem);color:var(--ma-green-deep);margin-bottom:18px}
.cert-date{font-size:.85rem;color:var(--ma-text-muted);margin-bottom:40px}
.cert-footer{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}
.cert-sign{text-align:center}
.sign-line{font-family:var(--font-heading);font-style:italic;font-size:1.1rem;color:var(--ma-green-dark);border-top:1px solid var(--ma-border);padding-top:6px;min-width:160px}
.sign-role{font-size:.72rem;color:var(--ma-text-muted);margin-top:2px}
.cert-seal{display:flex;flex-direction:column;align-items:center;gap:2px}
.cert-seal p{font-size:.6rem;font-weight:700;letter-spacing:.15em;color:var(--ma-green-deep)}
.cert-verify{text-align:center}
.verify-code{font-family:monospace;font-size:.95rem;font-weight:700;color:var(--ma-green-dark);letter-spacing:.06em}
.verify-hint{font-size:.62rem;color:var(--ma-text-muted);max-width:200px;margin-top:2px}
/* Print */
@media print {
  .no-print{display:none !important}
  .cert-page{background:#fff;padding:0}
  .cert-frame{box-shadow:none;max-width:none}
  @page{size:landscape;margin:0.5cm}
}
@media(max-width:640px){.cert-border{padding:28px 20px}.cert-footer{flex-direction:column;align-items:center;gap:24px}}
</style>
