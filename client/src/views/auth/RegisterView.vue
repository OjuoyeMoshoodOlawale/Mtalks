<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import api from '@/services/api'
import BaseInput  from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { UserPlus } from 'lucide-vue-next'

const router  = useRouter()
const ui      = useUiStore()
const form    = ref({ name: '', email: '', password: '', confirm: '' })
const errors  = ref({})
const loading = ref(false)

const validate = () => {
  errors.value = {}
  if (!form.value.name.trim())   errors.value.name     = 'Full name is required'
  if (!form.value.email)         errors.value.email    = 'Email is required'
  if (form.value.password.length < 8) errors.value.password = 'Password must be at least 8 characters'
  if (form.value.password !== form.value.confirm) errors.value.confirm = 'Passwords do not match'
  return !Object.keys(errors.value).length
}

const submit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    await api.post('/auth/register', {
      name: form.value.name.trim(), email: form.value.email, password: form.value.password
    })
    router.push({ name: 'VerifyEmail', query: { email: form.value.email } })
  } catch (err) {
    const msg = err.response?.data?.message || 'Registration failed'
    ui.toastError(msg)
    errors.value.general = msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <RouterLink to="/" class="brand-link">
          <span class="brand-icon">M</span>
          <span class="brand-name">Muhsinah <em>Academy</em></span>
        </RouterLink>
        <div class="auth-perks">
          <div class="perk" v-for="p in ['Access to all online courses','Event registration & QR tickets','Consultation booking','Progress tracking']" :key="p">
            <span class="perk-dot"></span> {{ p }}
          </div>
        </div>
      </div>
    </div>
    <div class="auth-right">
      <div class="auth-card">
        <div class="auth-header">
          <UserPlus :size="32" color="var(--ma-green-deep)" />
          <h2>Create your account</h2>
          <p>Join hundreds of people transforming their relationships</p>
        </div>
        <form @submit.prevent="submit" novalidate>
          <BaseInput v-model="form.name"     label="Full name"    type="text"     placeholder="Your full name" :error="errors.name"     required />
          <BaseInput v-model="form.email"    label="Email address" type="email"   placeholder="you@example.com" :error="errors.email"   required />
          <BaseInput v-model="form.password" label="Password"     type="password" placeholder="Min 8 characters" :error="errors.password" required />
          <BaseInput v-model="form.confirm"  label="Confirm password" type="password" placeholder="Repeat password" :error="errors.confirm" required />
          <p v-if="errors.general" class="form-error" style="margin-bottom:12px">{{ errors.general }}</p>
          <BaseButton type="submit" :loading="loading" class="w-full" style="justify-content:center">Create Account</BaseButton>
          <p style="font-size:.78rem;color:var(--ma-text-muted);margin-top:12px;text-align:center">
            By registering you agree to our <RouterLink to="/privacy-policy">Privacy Policy</RouterLink>
          </p>
        </form>
        <p class="auth-footer">Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
.auth-left{background:var(--ma-green-dark);display:flex;flex-direction:column;justify-content:center;padding:48px;position:relative;overflow:hidden}
.auth-left::before{content:'';position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=60&auto=format') center/cover no-repeat;opacity:.12}
.auth-brand{position:relative;z-index:1;display:flex;flex-direction:column;gap:40px}
.brand-link{display:flex;align-items:center;gap:12px}
.brand-icon{width:48px;height:48px;background:var(--ma-green);color:var(--ma-green-dark);font-family:var(--font-heading);font-weight:700;font-size:1.6rem;display:flex;align-items:center;justify-content:center;border-radius:10px}
.brand-name{font-family:var(--font-heading);color:var(--ma-white);font-size:1.4rem}
.brand-name em{font-style:normal;color:var(--ma-green)}
.auth-perks{display:flex;flex-direction:column;gap:14px}
.perk{color:rgba(255,255,255,.85);display:flex;align-items:center;gap:10px;font-size:.95rem}
.perk-dot{width:8px;height:8px;border-radius:50%;background:var(--ma-green);flex-shrink:0}
.auth-right{display:flex;align-items:center;justify-content:center;padding:40px 24px;background:var(--ma-off-white)}
.auth-card{background:var(--ma-white);border-radius:var(--radius-xl);padding:36px;width:100%;max-width:440px;box-shadow:var(--shadow-md)}
.auth-header{text-align:center;margin-bottom:24px}
.auth-header h2{margin:10px 0 6px;color:var(--ma-green-dark)}
.auth-header p{color:var(--ma-text-muted);font-size:.875rem}
.auth-footer{text-align:center;margin-top:18px;font-size:.875rem;color:var(--ma-text-muted)}
.auth-footer a{color:var(--ma-green-deep);font-weight:600}
@media(max-width:768px){.auth-left{display:none}}
</style>
