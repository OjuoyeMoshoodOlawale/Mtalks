<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import { Calendar, Clock, Shield, Video } from 'lucide-vue-next'

const calendlyUrl = ref('https://calendly.com/madeenahsanni')
onMounted(async () => {
  try { const { data } = await api.get('/settings'); if (data.data.calendly_url) calendlyUrl.value = data.data.calendly_url } catch {}
})
</script>

<template>
  <PublicHeader />
  <div style="background:var(--ma-green-dark);padding:60px 0;color:var(--ma-white)">
    <div class="container text-center">
      <Calendar :size="40" color="var(--ma-green)" style="margin-bottom:16px"/>
      <h1 style="color:var(--ma-white);margin-bottom:12px">Book a Consultation</h1>
      <p style="color:rgba(255,255,255,.75);max-width:520px;margin-inline:auto">Choose a time that works for you. Your session is private, confidential, and tailored to your needs.</p>
    </div>
  </div>

  <section class="section">
    <div class="container">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:48px">
        <div v-for="f in [{icon:Clock,t:'Flexible Timing',d:'Morning, afternoon or evening slots available'},{icon:Video,t:'Online or In-Person',d:'Zoom sessions or face-to-face in Abuja'},{icon:Shield,t:'100% Confidential',d:'Your privacy is fully protected'}]" :key="f.t" style="background:var(--ma-green-tint);border-radius:var(--radius-lg);padding:20px;display:flex;gap:14px;align-items:flex-start">
          <component :is="f.icon" :size="22" color="var(--ma-green-deep)" style="flex-shrink:0;margin-top:2px"/>
          <div><p style="font-weight:700;color:var(--ma-green-dark);margin:0 0 4px">{{ f.t }}</p><p style="font-size:.82rem;color:var(--ma-text-muted);margin:0">{{ f.d }}</p></div>
        </div>
      </div>
      <!-- Calendly inline embed — completely free -->
      <div style="border:1px solid var(--ma-border);border-radius:var(--radius-xl);overflow:hidden;min-height:700px">
        <iframe
          :src="`${calendlyUrl}?embed_domain=${encodeURIComponent('www.muhsinahacademy.com')}&embed_type=Inline&hide_event_type_details=0&hide_gdpr_banner=1`"
          style="width:100%;height:700px;border:none"
          title="Book a consultation with Coach Madinah"
          loading="lazy"
        />
      </div>
      <p style="text-align:center;margin-top:16px;font-size:.8rem;color:var(--ma-text-muted)">
        Scheduling powered by Calendly (free) — No account required to book
      </p>
    </div>
  </section>
  <PublicFooter />
</template>
