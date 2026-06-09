<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseInput    from '@/components/common/BaseInput.vue'
import { Mail, MapPin, MessageCircle, Send, Calendar } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const ui      = useUiStore()
const loading = ref(false)
const sent    = ref(false)
const form    = ref({ name:'', email:'', subject:'', message:'' })
const errors  = ref({})

const validate = () => {
  errors.value = {}
  if (!form.value.name.trim())    errors.value.name    = 'Name required'
  if (!form.value.email)          errors.value.email   = 'Email required'
  if (!form.value.subject.trim()) errors.value.subject = 'Subject required'
  if (!form.value.message.trim()) errors.value.message = 'Message required'
  return !Object.keys(errors.value).length
}

const submit = async () => {
  if (!validate()) return
  loading.value=true
  try {
    // Send to admin email via backend (uses Gmail SMTP)
    await api.post('/settings/contact', form.value)
    sent.value=true; ui.toast('Message sent! We will get back to you soon.')
  } catch {
    // fallback: compose email client
    const mailto = `mailto:madeenahsanni@gmail.com?subject=${encodeURIComponent(form.value.subject)}&body=${encodeURIComponent(`Name: ${form.value.name}\nEmail: ${form.value.email}\n\n${form.value.message}`)}`
    window.location.href = mailto
    ui.toast('Opening your email client…')
  } finally { loading.value=false }
}
</script>

<template>
  <PublicHeader />

  <div style="background:var(--ma-green-dark);padding:60px 0;color:var(--ma-white)">
    <div class="container">
      <span class="section-tag">Get in Touch</span>
      <h1 style="color:var(--ma-white);margin:8px 0 12px">Contact Us</h1>
      <p style="color:rgba(255,255,255,.75)">We would love to hear from you. Send us a message and we will respond shortly.</p>
    </div>
  </div>

  <section class="section">
    <div class="container contact-grid">
      <!-- Info -->
      <div>
        <h3 style="margin-bottom:24px;color:var(--ma-green-dark)">Reach Out</h3>
        <div class="contact-info">
          <div class="info-item">
            <div class="info-icon"><Mail :size="20"/></div>
            <div>
              <p style="font-weight:600;margin:0">Email</p>
              <a href="mailto:madeenahsanni@gmail.com" style="color:var(--ma-text-muted);font-size:.9rem">madeenahsanni@gmail.com</a>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon"><MessageCircle :size="20"/></div>
            <div>
              <p style="font-weight:600;margin:0">WhatsApp</p>
              <a href="https://wa.me/2348039632700" target="_blank" rel="noopener" style="color:var(--ma-text-muted);font-size:.9rem">Send us a WhatsApp message</a>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon"><MapPin :size="20"/></div>
            <div>
              <p style="font-weight:600;margin:0">Location</p>
              <p style="color:var(--ma-text-muted);font-size:.9rem;margin:0">Abuja, Nigeria</p>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon"><Calendar :size="20"/></div>
            <div>
              <p style="font-weight:600;margin:0">Book a Consultation</p>
              <RouterLink to="/consultation" style="color:var(--ma-green-deep);font-size:.9rem;font-weight:600">Schedule via Calendly →</RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="contact-form-card">
        <div v-if="sent" style="text-align:center;padding:40px">
          <Send :size="48" color="var(--ma-green)"/>
          <h3 style="margin:16px 0 8px;color:var(--ma-green-dark)">Message Sent!</h3>
          <p style="color:var(--ma-text-muted)">JazakAllahu Khairan. We will reply to your email as soon as possible.</p>
          <button @click="sent=false;form={name:'',email:'',subject:'',message:''}" class="btn btn--outline" style="margin-top:20px">Send Another</button>
        </div>
        <form v-else @submit.prevent="submit" novalidate>
          <h3 style="margin-bottom:20px;color:var(--ma-green-dark)">Send a Message</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <BaseInput v-model="form.name"    label="Your name"    :error="errors.name"    required/>
            <BaseInput v-model="form.email"   label="Email address" type="email" :error="errors.email"   required/>
          </div>
          <BaseInput v-model="form.subject" label="Subject" :error="errors.subject" placeholder="How can we help?" required/>
          <div class="form-group">
            <label class="form-label">Message <span style="color:#D32F2F">*</span></label>
            <textarea v-model="form.message" :class="['form-input',{' is-error':errors.message}]" rows="5" placeholder="Tell us more about what you need…"></textarea>
            <p v-if="errors.message" class="form-error">{{ errors.message }}</p>
          </div>
          <BaseButton type="submit" :loading="loading" class="w-full" style="justify-content:center">
            <Send :size="18"/> Send Message
          </BaseButton>
        </form>
      </div>
    </div>
  </section>

  <PublicFooter />
</template>

<style scoped>
.contact-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:60px;align-items:start}
@media(max-width:768px){.contact-grid{grid-template-columns:1fr}}
.contact-info{display:flex;flex-direction:column;gap:20px}
.info-item{display:flex;align-items:flex-start;gap:14px}
.info-icon{width:44px;height:44px;background:var(--ma-green-tint);color:var(--ma-green-deep);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.contact-form-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-xl);padding:36px;box-shadow:var(--shadow-sm)}
</style>
