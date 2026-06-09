<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import BaseInput  from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { LogIn } from 'lucide-vue-next'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const ui     = useUiStore()

const form    = ref({ email: '', password: '' })
const errors  = ref({})
const loading = ref(false)

const validate = () => {
  errors.value = {}
  if (!form.value.email)    errors.value.email    = 'Email is required'
  if (!form.value.password) errors.value.password = 'Password is required'
  return !Object.keys(errors.value).length
}

const submit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const { user } = await auth.login(form.value.email, form.value.password)
    ui.toast(`Welcome back, ${user.name.split(' ')[0]}!`)
    const redirect = route.query.redirect || (user.role === 'admin' ? '/admin' : '/dashboard')
    router.push(redirect)
  } catch (err) {
    const msg = err.response?.data?.message || 'Login failed. Check your credentials.'
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
        <div class="auth-quote">
          <p>"And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them."</p>
          <span>— Surah Ar-Rum 30:21</span>
        </div>
      </div>
    </div>
    <div class="auth-right">
      <div class="auth-card">
        <div class="auth-header">
          <LogIn :size="32" color="var(--ma-green-deep)" />
          <h2>Welcome back</h2>
          <p>Sign in to access your courses and events</p>
        </div>
        <form @submit.prevent="submit" novalidate>
          <BaseInput v-model="form.email"    label="Email address" type="email" placeholder="you@example.com" :error="errors.email" required />
          <BaseInput v-model="form.password" label="Password"      type="password" placeholder="••••••••" :error="errors.password" required />
          <div class="auth-row">
            <RouterLink to="/forgot-password" class="forgot-link">Forgot password?</RouterLink>
          </div>
          <p v-if="errors.general" class="form-error" style="margin-bottom:12px">{{ errors.general }}</p>
          <BaseButton type="submit" :loading="loading" class="w-full" style="justify-content:center">Sign In</BaseButton>
        </form>
        <p class="auth-footer">No account yet? <RouterLink to="/register">Create one</RouterLink></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
@media(max-width:768px){.auth-page{grid-template-columns:1fr}}
.auth-left{background:var(--ma-green-dark);display:flex;flex-direction:column;justify-content:center;padding:48px;position:relative;overflow:hidden}
.auth-left::before{content:'';position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=60&auto=format') center/cover no-repeat;opacity:.15}
.auth-brand{position:relative;z-index:1;display:flex;flex-direction:column;gap:48px}
.brand-link{display:flex;align-items:center;gap:12px;text-decoration:none}
.brand-icon{width:48px;height:48px;background:var(--ma-green);color:var(--ma-green-dark);font-family:var(--font-heading);font-weight:700;font-size:1.6rem;display:flex;align-items:center;justify-content:center;border-radius:10px}
.brand-name{font-family:var(--font-heading);color:var(--ma-white);font-size:1.4rem}
.brand-name em{font-style:normal;color:var(--ma-green)}
.auth-quote p{font-family:var(--font-heading);color:rgba(255,255,255,.85);font-size:1.1rem;line-height:1.7;font-style:italic;margin-bottom:12px}
.auth-quote span{color:var(--ma-green);font-size:.875rem;font-weight:500}
.auth-right{display:flex;align-items:center;justify-content:center;padding:40px 24px;background:var(--ma-off-white)}
.auth-card{background:var(--ma-white);border-radius:var(--radius-xl);padding:40px;width:100%;max-width:420px;box-shadow:var(--shadow-md)}
.auth-header{text-align:center;margin-bottom:28px}
.auth-header h2{font-family:var(--font-heading);color:var(--ma-green-dark);margin:12px 0 6px}
.auth-header p{color:var(--ma-text-muted);font-size:.9rem}
.auth-row{display:flex;justify-content:flex-end;margin-bottom:16px;margin-top:-8px}
.forgot-link{font-size:.85rem;color:var(--ma-green-mid);font-weight:500}
.forgot-link:hover{text-decoration:underline}
.auth-footer{text-align:center;margin-top:20px;font-size:.875rem;color:var(--ma-text-muted)}
.auth-footer a{color:var(--ma-green-deep);font-weight:600}
@media(max-width:768px){.auth-left{display:none}}
</style>
