<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import api from '@/services/api'
import BaseInput  from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-vue-next'

const ui     = useUiStore()
const router = useRouter()

const step    = ref(1)
const email   = ref('')
const form    = ref({ otp: '', newPassword: '', confirm: '' })
const loading = ref(false)
const err     = ref('')
const showPw  = ref(false)
const showCf  = ref(false)
const resendCooldown = ref(0)

/* Password strength */
const pwStrength = computed(() => {
  const p = form.value.newPassword
  if (!p) return null
  let score = 0
  if (p.length >= 8)                         score++
  if (p.length >= 12)                        score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p))   score++
  if (/\d/.test(p))                          score++
  if (/[^A-Za-z0-9]/.test(p))               score++
  if (score <= 1) return { label: 'Weak',   color: '#e53e3e', width: '25%'  }
  if (score <= 2) return { label: 'Fair',   color: '#dd6b20', width: '50%'  }
  if (score <= 3) return { label: 'Good',   color: '#d69e2e', width: '75%'  }
  return              { label: 'Strong', color: '#38a169', width: '100%' }
})

const pwMatch = computed(() =>
  form.value.confirm && form.value.newPassword === form.value.confirm
)

/* ── Step 1: send OTP ── */
const sendOtp = async () => {
  err.value = ''
  if (!email.value.trim()) { err.value = 'Please enter your email address'; return }
  loading.value = true
  try {
    await api.post('/auth/forgot-password', { email: email.value.trim() })
    step.value = 2
    ui.toast(`Reset code sent to ${email.value.trim()}`)
    startResendCooldown()
  } catch (e) {
    err.value = e.response?.data?.message || 'Could not send reset code. Please try again.'
  } finally { loading.value = false }
}

/* ── Step 2: resend OTP ── */
const resend = async () => {
  if (resendCooldown.value > 0) return
  loading.value = true; err.value = ''
  try {
    await api.post('/auth/resend-otp', { email: email.value.trim(), type: 'reset_password' })
    ui.toast('New reset code sent')
    startResendCooldown()
  } catch (e) {
    err.value = e.response?.data?.message || 'Could not resend code. Please try again.'
  } finally { loading.value = false }
}

const startResendCooldown = () => {
  resendCooldown.value = 60
  const t = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(t)
  }, 1000)
}

/* ── Step 2: reset password ── */
const reset = async () => {
  err.value = ''
  if (!form.value.otp.trim())           { err.value = 'Please enter the reset code'; return }
  if (!form.value.newPassword)          { err.value = 'Please enter a new password'; return }
  if (form.value.newPassword.length < 8){ err.value = 'Password must be at least 8 characters'; return }
  if (form.value.newPassword !== form.value.confirm) { err.value = 'Passwords do not match'; return }

  loading.value = true
  try {
    await api.post('/auth/reset-password', {
      email:       email.value.trim(),
      otp:         form.value.otp.trim(),
      newPassword: form.value.newPassword,
    })
    step.value = 3
    /* Auto-redirect to login after 3 seconds */
    setTimeout(() => router.push('/login'), 3000)
  } catch (e) {
    err.value = e.response?.data?.message || 'Reset failed. Please try again.'
  } finally { loading.value = false }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:flex-start;justify-content:center;background:var(--ma-green-dark);padding:24px;padding-top:max(24px,5vh)">
    <div style="background:var(--ma-white);border-radius:var(--radius-xl);padding:clamp(24px,5vw,48px) clamp(20px,5vw,40px);width:100%;max-width:440px;box-shadow:var(--shadow-lg)">

      <!-- Header -->
      <div style="text-align:center;margin-bottom:28px">
        <KeyRound :size="36" color="var(--ma-green-deep)" />
        <h2 style="color:var(--ma-green-dark);margin:12px 0 4px">Reset password</h2>
        <p v-if="step===1" style="font-size:.875rem;color:var(--ma-text-muted);margin:0">
          Enter your email and we'll send a reset code
        </p>
        <p v-else-if="step===2" style="font-size:.875rem;color:var(--ma-text-muted);margin:0">
          Code sent to <strong>{{ email }}</strong>
          <button @click="step=1;err=''" style="background:none;border:none;color:var(--ma-green);cursor:pointer;font-size:.8rem;display:block;margin:4px auto 0">
            Wrong email? Change it
          </button>
        </p>
      </div>

      <!-- Step 1 — Email -->
      <div v-if="step===1">
        <BaseInput
          v-model="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          :error="err"
          @keyup.enter="sendOtp"
          required
        />
        <BaseButton @click="sendOtp" :loading="loading" class="w-full" style="justify-content:center;margin-top:4px">
          Send Reset Code
        </BaseButton>
      </div>

      <!-- Step 2 — OTP + new password -->
      <div v-else-if="step===2">
        <!-- OTP -->
        <BaseInput
          v-model="form.otp"
          label="6-digit reset code"
          type="text"
          inputmode="numeric"
          placeholder="Enter code from email"
          maxlength="6"
          style="letter-spacing:0.2em;font-size:1.1rem"
        />

        <!-- Resend -->
        <div style="text-align:right;margin:-8px 0 16px">
          <button
            @click="resend"
            :disabled="resendCooldown > 0 || loading"
            style="background:none;border:none;font-size:.82rem;cursor:pointer"
            :style="resendCooldown > 0 ? 'color:var(--ma-text-muted)' : 'color:var(--ma-green);text-decoration:underline'"
          >
            {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code' }}
          </button>
        </div>

        <!-- New password -->
        <div style="position:relative">
          <BaseInput
            v-model="form.newPassword"
            label="New password"
            :type="showPw ? 'text' : 'password'"
            placeholder="Min 8 characters"
          />
          <button
            @click="showPw=!showPw"
            style="position:absolute;right:12px;top:34px;background:none;border:none;cursor:pointer;color:var(--ma-text-muted)"
            type="button"
            tabindex="-1"
          >
            <EyeOff v-if="showPw" :size="16" />
            <Eye    v-else        :size="16" />
          </button>
        </div>

        <!-- Strength bar -->
        <div v-if="pwStrength" style="margin:-8px 0 12px">
          <div style="height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden">
            <div :style="`height:100%;width:${pwStrength.width};background:${pwStrength.color};transition:width .3s`" />
          </div>
          <span :style="`font-size:.75rem;color:${pwStrength.color}`">{{ pwStrength.label }}</span>
        </div>

        <!-- Confirm password -->
        <div style="position:relative">
          <BaseInput
            v-model="form.confirm"
            label="Confirm new password"
            :type="showCf ? 'text' : 'password'"
            placeholder="Repeat password"
          />
          <button
            @click="showCf=!showCf"
            style="position:absolute;right:12px;top:34px;background:none;border:none;cursor:pointer;color:var(--ma-text-muted)"
            type="button"
            tabindex="-1"
          >
            <EyeOff v-if="showCf" :size="16" />
            <Eye    v-else        :size="16" />
          </button>
          <span v-if="form.confirm && pwMatch" style="font-size:.75rem;color:#38a169;display:flex;align-items:center;gap:4px;margin-top:2px">
            <CheckCircle2 :size="12" /> Passwords match
          </span>
        </div>

        <p v-if="err" style="color:#e53e3e;font-size:.85rem;margin:8px 0 12px">{{ err }}</p>

        <BaseButton
          @click="reset"
          :loading="loading"
          :disabled="!pwMatch"
          class="w-full"
          style="justify-content:center;margin-top:8px"
        >
          Set New Password
        </BaseButton>
      </div>

      <!-- Step 3 — Success -->
      <div v-else style="text-align:center;padding:16px 0">
        <CheckCircle2 :size="52" color="#38a169" style="margin:0 auto 16px" />
        <h3 style="color:#38a169;margin:0 0 8px">Password updated!</h3>
        <p style="color:var(--ma-text-muted);font-size:.9rem;margin:0 0 24px">
          Redirecting you to sign in…
        </p>
        <RouterLink to="/login" class="btn btn--primary" style="display:inline-flex">
          Sign In Now
        </RouterLink>
      </div>

      <RouterLink
        v-if="step !== 3"
        to="/login"
        style="display:block;margin-top:24px;text-align:center;font-size:.85rem;color:var(--ma-text-muted)"
      >
        ← Back to sign in
      </RouterLink>

    </div>
  </div>
</template>
