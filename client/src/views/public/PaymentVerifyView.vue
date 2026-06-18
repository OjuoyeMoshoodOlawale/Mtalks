<script setup>
/**
 * PaymentVerifyView — handles Paystack callback_url redirect
 *
 * Paystack redirects here after payment with ?reference=xxx&trxref=xxx
 * We call POST /api/payments/verify and redirect to the right page.
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const status  = ref('verifying') // verifying | success | failed
const message = ref('')

onMounted(async () => {
  const reference = route.query.reference || route.query.trxref
  console.log('[PaymentVerify] reference from URL:', reference)

  if (!reference) {
    status.value  = 'failed'
    message.value = 'No payment reference found in URL.'
    setTimeout(() => router.replace('/events'), 3000)
    return
  }

  try {
    const { data } = await api.post('/payments/verify', { reference })
    console.log('[PaymentVerify] server response:', data)

    status.value  = 'success'
    message.value = data.emailSent
      ? `Registration confirmed! Ticket sent to your email. 🎉`
      : data.emailNote || 'Registration confirmed!'

    ui.toast(message.value)
    setTimeout(() => router.replace('/dashboard/events'), 2500)
  } catch (err) {
    console.error('[PaymentVerify] error:', err)
    status.value  = 'failed'
    message.value = err.response?.data?.message ||
      `Payment received but verification failed. Reference: ${reference}. Please contact support.`
    setTimeout(() => router.replace('/events'), 4000)
  }
})
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ma-green-dark)">
    <div style="background:#fff;border-radius:16px;padding:48px 40px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)">

      <!-- Verifying -->
      <div v-if="status==='verifying'">
        <div style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:var(--ma-green);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px" />
        <h3 style="color:var(--ma-green-dark);margin:0 0 8px">Verifying payment…</h3>
        <p style="color:#64748b;font-size:.9rem;margin:0">Please wait, do not close this page</p>
      </div>

      <!-- Success -->
      <div v-else-if="status==='success'">
        <div style="font-size:3rem;margin-bottom:16px">🎉</div>
        <h3 style="color:#16a34a;margin:0 0 8px">Payment Confirmed!</h3>
        <p style="color:#475569;font-size:.9rem;margin:0 0 24px">{{ message }}</p>
        <p style="color:#94a3b8;font-size:.8rem">Redirecting to your events…</p>
      </div>

      <!-- Failed -->
      <div v-else>
        <div style="font-size:3rem;margin-bottom:16px">⚠️</div>
        <h3 style="color:#dc2626;margin:0 0 8px">Verification Issue</h3>
        <p style="color:#475569;font-size:.9rem;margin:0 0 24px">{{ message }}</p>
        <p style="color:#94a3b8;font-size:.8rem">Redirecting you back…</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg) } }
</style>
