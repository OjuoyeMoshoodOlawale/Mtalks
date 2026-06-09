<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import api from '@/services/api'
import BaseButton from '@/components/common/BaseButton.vue'
import { Mail, CheckCircle } from 'lucide-vue-next'

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()
const ui      = useUiStore()
const email   = ref(route.query.email || '')
const otp     = ref('')
const loading = ref(false)
const err     = ref('')

const submit = async () => {
  if (!otp.value || otp.value.length !== 6) { err.value = 'Enter the 6-digit code'; return }
  loading.value = true; err.value = ''
  try {
    const { data } = await api.post('/auth/verify-email', { email: email.value, otp: otp.value })
    auth.setToken(data.data.accessToken)
    auth.setUser(data.data.user)
    ui.toast('Email verified! Welcome to MTalks Academy.')
    router.push(data.data.user.role === 'admin' ? '/admin' : '/dashboard')
  } catch (e) {
    err.value = e.response?.data?.message || 'Verification failed'
    ui.toastError(err.value)
  } finally { loading.value = false }
}

const resend = async () => {
  try {
    await api.post('/auth/resend-otp', { email: email.value })
    ui.toast('New code sent to your email')
  } catch (_) {}
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ma-green-dark);padding:24px">
    <div style="background:var(--ma-white);border-radius:var(--radius-xl);padding:48px 40px;width:100%;max-width:440px;text-align:center;box-shadow:var(--shadow-lg)">
      <div style="width:72px;height:72px;background:var(--ma-green-tint);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
        <Mail :size="32" color="var(--ma-green-deep)" />
      </div>
      <h2 style="color:var(--ma-green-dark);margin-bottom:8px">Check your email</h2>
      <p style="color:var(--ma-text-muted);margin-bottom:28px;font-size:.9rem">
        We sent a 6-digit code to <strong>{{ email }}</strong>
      </p>
      <form @submit.prevent="submit">
        <input
          v-model="otp"
          type="text"
          maxlength="6"
          placeholder="000000"
          :class="['form-input', { 'is-error': err }]"
          style="text-align:center;font-size:1.8rem;letter-spacing:.3em;font-weight:700;margin-bottom:8px"
        />
        <p v-if="err" class="form-error" style="margin-bottom:12px">{{ err }}</p>
        <BaseButton type="submit" :loading="loading" class="w-full" style="justify-content:center;margin-top:8px">
          <CheckCircle :size="18" /> Verify Email
        </BaseButton>
      </form>
      <p style="margin-top:20px;font-size:.85rem;color:var(--ma-text-muted)">
        Didn't receive it? <button @click="resend" style="color:var(--ma-green-deep);font-weight:600;background:none;cursor:pointer">Resend code</button>
      </p>
      <RouterLink to="/login" style="display:block;margin-top:16px;font-size:.85rem;color:var(--ma-text-muted)">← Back to sign in</RouterLink>
    </div>
  </div>
</template>
