<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseInput    from '@/components/common/BaseInput.vue'
import { Settings, Mail, Globe, Phone, Calendar, Save, Menu } from 'lucide-vue-next'

const ui=useUiStore();const loading=ref(true);const saving=ref(false);const sidebarOpen=ref(false)
const s = ref({
  site_name:'', site_tagline:'', site_email:'', whatsapp_number:'',
  calendly_url:'', instagram_url:'', facebook_url:'', twitter_url:'', youtube_url:'',
  gmail_test: ''
})

onMounted(async () => {
  try { const { data } = await api.get('/settings'); Object.assign(s.value, data.data) }
  finally { loading.value=false }
})

const save = async () => {
  saving.value=true
  try { await api.put('/settings', s.value); ui.toast('Settings saved successfully') }
  catch { ui.toastError('Save failed') }
  finally { saving.value=false }
}
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen=false"/>
    <div class="admin-main">
      <div class="admin-topbar">
        <button class="topbar-toggle hide-desktop" @click="sidebarOpen=true"><Menu :size="22"/></button>
        <h1 class="topbar-title">Settings</h1>
        <BaseButton @click="save" :loading="saving" style="margin-left:auto"><Save :size="16"/> Save All</BaseButton>
      </div>
      <div class="admin-content">
        <BaseLoader v-if="loading" style="padding:60px"/>
        <div v-else style="display:flex;flex-direction:column;gap:20px;max-width:760px">

          <div class="settings-card">
            <div class="card-section-title"><Globe :size="18"/> General</div>
            <BaseInput v-model="s.site_name"    label="Site name"    placeholder="Muhsinah Academy"/>
            <div class="form-group">
              <label class="form-label">Tagline</label>
              <textarea v-model="s.site_tagline" class="form-input" rows="2" placeholder="Helping Muslim Sisters and Couples…"/>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-section-title"><Mail :size="18"/> Contact</div>
            <BaseInput v-model="s.site_email"  label="Admin email"   placeholder="madeenahsanni@gmail.com"/>
            <div class="form-group">
              <label class="form-label">WhatsApp number (digits only — used for wa.me link, never displayed raw)</label>
              <input v-model="s.whatsapp_number" class="form-input" placeholder="2348039632700"/>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-section-title"><Calendar :size="18"/> Consultation (Calendly — Free)</div>
            <BaseInput v-model="s.calendly_url" label="Calendly URL" placeholder="https://calendly.com/madeenahsanni"/>
            <div style="background:var(--ma-green-tint);border-radius:8px;padding:12px;font-size:.82rem;color:var(--ma-green-deep)">
              Calendly free tier is sufficient — unlimited one-on-one sessions, 1 event type, no credit card needed.
              Just update the URL here whenever you create a new Calendly event type.
            </div>
          </div>

          <div class="settings-card">
            <div class="card-section-title"><Phone :size="18"/> Social Media</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <BaseInput v-model="s.instagram_url" label="Instagram URL" placeholder="https://instagram.com/…"/>
              <BaseInput v-model="s.facebook_url"  label="Facebook URL"  placeholder="https://facebook.com/…"/>
              <BaseInput v-model="s.twitter_url"   label="Twitter / X"   placeholder="https://twitter.com/…"/>
              <BaseInput v-model="s.youtube_url"   label="YouTube"       placeholder="https://youtube.com/…"/>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-section-title"><Mail :size="18"/> Email Setup (Gmail — Free)</div>
            <div style="background:#fff8e1;border:1px solid #f0c130;border-radius:8px;padding:16px;font-size:.875rem;line-height:1.7">
              <p style="font-weight:700;margin:0 0 8px;color:#7A5F00">How to set up free Gmail sending:</p>
              <ol style="padding-left:20px;color:#5A4500">
                <li>Go to your Gmail → Manage Google Account → Security</li>
                <li>Enable <strong>2-Step Verification</strong> (required)</li>
                <li>Go to Security → <strong>App Passwords</strong></li>
                <li>Generate a password for "Mail" → copy the 16-character code</li>
                <li>Add to your server <code style="background:#f5f5f5;padding:2px 6px;border-radius:4px">.env</code> file:<br/>
                  <code style="background:#f5f5f5;padding:4px 8px;border-radius:4px;display:block;margin-top:4px">GMAIL_USER=madeenahsanni@gmail.com<br/>GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx</code>
                </li>
              </ol>
              <p style="margin:8px 0 0;color:#7A5F00"><strong>Daily limit:</strong> ~500 emails/day — sufficient for this platform.</p>
            </div>
          </div>

          <BaseButton @click="save" :loading="saving" size="lg" style="width:200px"><Save :size="18"/> Save Settings</BaseButton>
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
.settings-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:24px}
.card-section-title{display:flex;align-items:center;gap:8px;font-family:var(--font-heading);font-size:.95rem;color:var(--ma-green-dark);margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--ma-border)}
</style>
