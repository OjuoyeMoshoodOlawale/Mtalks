<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import api from '@/services/api'
import BaseInput  from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { KeyRound } from 'lucide-vue-next'

const ui      = useUiStore()
const step    = ref(1)
const email   = ref('')
const form    = ref({ otp: '', newPassword: '', confirm: '' })
const loading = ref(false)
const err     = ref('')

const sendOtp = async () => {
  if (!email.value) { err.value = 'Email required'; return }
  loading.value = true; err.value = ''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    step.value = 2
    ui.toast('Reset code sent to your email')
  } catch (e) { err.value = e.response?.data?.message || 'Failed' }
  finally { loading.value = false }
}

const reset = async () => {
  if (form.value.newPassword !== form.value.confirm) { err.value = 'Passwords do not match'; return }
  loading.value = true; err.value = ''
  try {
    await api.post('/auth/reset-password', { email: email.value, otp: form.value.otp, newPassword: form.value.newPassword })
    step.value = 3
    ui.toast('Password reset successfully. Please log in.')
  } catch (e) { err.value = e.response?.data?.message || 'Failed' }
  finally { loading.value = false }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ma-green-dark);padding:24px">
    <div style="background:var(--ma-white);border-radius:var(--radius-xl);padding:48px 40px;width:100%;max-width:420px;box-shadow:var(--shadow-lg)">
      <div style="text-align:center;margin-bottom:28px">
        <KeyRound :size="36" color="var(--ma-green-deep)" />
        <h2 style="color:var(--ma-green-dark);margin:12px 0 6px">Reset password</h2>
      </div>

      <!-- Step 1 -->
      <div v-if="step === 1">
        <BaseInput v-model="email" label="Your email address" type="email" placeholder="you@example.com" :error="err" required />
        <BaseButton @click="sendOtp" :loading="loading" class="w-full" style="justify-content:center">Send Reset Code</BaseButton>
      </div>

      <!-- Step 2 -->
      <div v-else-if="step === 2">
        <BaseInput v-model="form.otp"         label="6-digit code" type="text"     placeholder="Enter code from email" />
        <BaseInput v-model="form.newPassword" label="New password" type="password" placeholder="Min 8 characters" />
        <BaseInput v-model="form.confirm"     label="Confirm"      type="password" placeholder="Repeat password" />
        <p v-if="err" class="form-error" style="margin-bottom:12px">{{ err }}</p>
        <BaseButton @click="reset" :loading="loading" class="w-full" style="justify-content:center">Set New Password</BaseButton>
      </div>

      <!-- Step 3 -->
      <div v-else style="text-align:center">
        <p style="margin-bottom:20px;color:var(--ma-green-deep);font-weight:600">Password reset successfully!</p>
        <RouterLink to="/login" class="btn btn--primary" style="display:inline-flex">Sign In Now</RouterLink>
      </div>

      <RouterLink to="/login" style="display:block;margin-top:20px;text-align:center;font-size:.85rem;color:var(--ma-text-muted)">← Back to sign in</RouterLink>
    </div>
  </div>
</template>
