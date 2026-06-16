<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import BaseModal    from '@/components/common/BaseModal.vue'
import { Calendar, MapPin, Monitor, Clock, Users, Tag, CheckCircle, Timer, Lock, CalendarOff } from 'lucide-vue-next'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { paystackGrossUp, paystackFeeBreakdown } from '@/utils/paystack'

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()
const ui      = useUiStore()
const event   = ref(null)
const loading = ref(true)
const showPkg = ref(false)
const selPkg  = ref(null)
const paying  = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get(`/events/${route.params.slug}`)
    event.value = data.data

    /* Auto-select package when returning from login with ?pkg=ID in the URL */
    if (route.query.pkg && event.value?.packages?.length) {
      const pkgFromUrl = event.value.packages.find(p => String(p.id) === String(route.query.pkg))
      if (pkgFromUrl) {
        selPkg.value = pkgFromUrl
        /* Clean the URL (remove ?pkg) without re-navigating */
        router.replace({ path: route.path, query: {} })
      }
    }
  } finally { loading.value = false }
})

// Dynamic SEO — updates when event data loads
watch(event, (e) => {
  if (!e) return
  useSeoMeta({
    title:       e.title,
    description: e.description?.slice(0, 160) || `Register for ${e.title} — Muhsinah Academy`,
    image:       e.banner,
    url:         `/events/${e.slug}`,
    type:        'article',
  })
}, { immediate: true })

const isEarlyBird = (pkg) => pkg.early_bird_price && new Date(pkg.early_bird_deadline) > new Date()
const pkgPrice    = (pkg) => isEarlyBird(pkg) ? pkg.early_bird_price : pkg.price

/* Guest form state — shown when user is not logged in */
const guestMode  = ref(false)
const guestName  = ref('')
const guestEmail = ref('')


/* Opens Paystack inline popup; falls back to authorization_url redirect if popup unavailable */
const openPaystackPopup = ({ key, email, amountNaira, reference, authorizationUrl, onSuccess, onCancel }) => {
  const amountKobo = Math.round(Number(amountNaira) * 100)

  const grossed  = paystackGrossUp(amountNaira)
  const { fee }  = paystackFeeBreakdown(amountNaira)
  const chargeKobo = grossed * 100
  console.log('[PAY] Public key loaded:', key ? key.slice(0,20)+'...' : 'MISSING — check client/.env.local')
  console.log('[PAY] window.PaystackPop:', typeof window.PaystackPop)
  console.log('[PAY] Amount breakdown: listed=₦' + amountNaira + ' | Paystack fee=₦' + fee + ' | customer pays=₦' + grossed)

  if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
    console.warn('[PAY] PaystackPop not available — using redirect fallback')
    if (authorizationUrl) { window.open(authorizationUrl, '_blank'); return }
    ui.toastError('Payment widget unavailable. Please refresh the page and try again.')
    return
  }

  try {
    console.log('[PAY] Calling PaystackPop.setup()...')
    const handler = window.PaystackPop.setup({
      key,
      email,
      amount:   chargeKobo,   // grossed up so merchant receives exact listed price
      ref:      reference,
      currency: 'NGN',
      callback: onSuccess,
      onClose:  onCancel
    })
    console.log('[PAY] handler:', handler, 'openIframe fn:', typeof handler?.openIframe)
    handler.openIframe()
    console.log('[PAY] openIframe() called')
  } catch (err) {
    console.error('[PAY] setup/openIframe error:', err)
    if (authorizationUrl) {
      ui.toast('Redirecting to payment page...')
      setTimeout(() => window.open(authorizationUrl, '_blank'), 300)
    } else {
      ui.toastError('Could not open payment. Check browser console for details.')
    }
  }
}

const guestFormRef = ref(null)

const pay = async () => {
  if (!selPkg.value) { ui.toastError('Please select a package first'); return }

  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  if (!paystackKey || !paystackKey.trim() || paystackKey.startsWith('pk_test_xxx')) {
    ui.toastError('Payment key not configured. Set VITE_PAYSTACK_PUBLIC_KEY in client/.env.local')
    return
  }
  if (!window.PaystackPop) {
    ui.toastError('Payment script loading — please wait a moment and try again.')
    return
  }

  /* Guest (not logged in) — name/email fields always visible, validate here */
  if (!auth.isLoggedIn) {
    if (!guestName.value.trim()) { ui.toastError('Please enter your full name'); return }
    if (!guestEmail.value.trim() || !guestEmail.value.includes('@')) {
      ui.toastError('Please enter a valid email address'); return
    }
    await payAsGuest()
    return
  }

  paying.value = true
  try {
    const { data } = await api.post('/payments/initialize', {
      type: 'event', item_id: event.value.id, package_id: selPkg.value.id
    })
    const { reference, authorization_url } = data.data
    openPaystackPopup({
      key:              paystackKey,
      email:            auth.user.email,
      amountNaira:      pkgPrice(selPkg.value),
      reference,
      authorizationUrl: authorization_url,
      onSuccess: async () => {
        ui.toast('Payment confirmed! Your ticket has been sent to your email.')
        const res = await api.get(`/events/${route.params.slug}`)
        event.value = res.data.data
      },
      onCancel: () => { ui.toastError('Payment was cancelled.') }
    })
  } catch (e) {
    ui.toastError(e.response?.data?.message || e.message || 'Payment failed. Please try again.')
    console.error('[pay]', e)
  } finally { paying.value = false }
}

const payAsGuest = async () => {
  if (!guestName.value.trim())   { ui.toastError('Please enter your full name'); return }
  if (!guestEmail.value.trim())  { ui.toastError('Please enter your email address'); return }
  if (!guestEmail.value.includes('@')) { ui.toastError('Please enter a valid email address'); return }

  paying.value = true
  try {
    const { data } = await api.post('/payments/initialize-guest', {
      guest_name:  guestName.value.trim(),
      guest_email: guestEmail.value.trim().toLowerCase(),
      event_id:    event.value.id,
      package_id:  selPkg.value.id,
    })
    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
    const { reference, authorization_url } = data.data
    openPaystackPopup({
      key:              paystackKey,
      email:            guestEmail.value.trim().toLowerCase(),
      amountNaira:      pkgPrice(selPkg.value),
      reference,
      authorizationUrl: authorization_url,
      onSuccess: async () => {
        ui.toast('Payment confirmed! Your ticket has been sent to ' + guestEmail.value)
        const res = await api.get(`/events/${route.params.slug}`)
        event.value = res.data.data
        guestMode.value = false
      },
      onCancel: () => { ui.toastError('Payment was cancelled.') }
    })
  } catch (e) {
    const msg = e.response?.data?.message || e.message || 'Payment failed. Please try again.'
    ui.toastError(msg)
  } finally { paying.value = false }
}
</script>

<template>
  <div class="page-view">
  <PublicHeader />
  <BaseLoader v-if="loading" style="padding:80px 0" />
  <div v-else-if="event">
    <div class="event-hero" :style="event.banner ? `background-image:url(${event.banner})` : ''">
      <div class="event-hero-overlay" />
      <div class="container event-hero-content">
        <div class="event-type-pill">
          <Monitor v-if="event.type==='online'" :size="14" /> <MapPin v-else :size="14" />
          {{ event.type === 'online' ? 'Online Event' : 'In-Person Event' }}
        </div>
        <h1>{{ event.title }}</h1>
        <div class="event-meta-row">
          <span><Calendar :size="16" /> {{ new Date(event.event_date).toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) }}</span>
          <span><Clock :size="16" /> {{ new Date(event.event_date).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}) }}</span>
          <span v-if="event.type==='offline'"><MapPin :size="16" /> {{ event.venue }}</span>
        </div>
      </div>
    </div>

    <section class="section">
      <div class="container ev-content-grid">
        <div>
          <h2 style="margin-bottom:16px">About This Event</h2>
          <p style="white-space:pre-line;line-height:1.8;color:var(--ma-text-muted)">{{ event.description }}</p>

        </div>

        <!-- Registration card -->
        <div class="register-card">

          <!-- Already registered -->
          <template v-if="event.registered">
            <div style="text-align:center;padding:12px 0">
              <CheckCircle :size="40" color="var(--ma-green)" />
              <p style="font-weight:700;color:var(--ma-green-dark);margin-top:10px">You are registered!</p>
              <p style="font-size:.85rem;color:var(--ma-text-muted);margin-top:6px">Check your email for your ticket and WhatsApp group link.</p>
            </div>
          </template>

          <template v-else>

            <!-- No packages yet -->
            <div v-if="!event.packages?.length" style="color:var(--ma-text-muted);font-size:.88rem;padding:12px 0">
              No packages available yet.
            </div>

            <div v-else class="reg-form">

              <!-- ── Step 1: Choose package ── -->
              <p class="reg-step-label">1. Choose a package</p>
              <div class="reg-pkg-list">
                <label
                  v-for="pkg in event.packages" :key="pkg.id"
                  class="reg-pkg-option"
                  :class="{ selected: selPkg?.id === pkg.id }"
                >
                  <input type="radio" :value="pkg" v-model="selPkg" style="accent-color:var(--ma-green);margin-top:2px;flex-shrink:0" />
                  <div class="reg-pkg-info">
                    <p class="reg-pkg-name">{{ pkg.name }}</p>
                    <p class="reg-pkg-price">
                      ₦{{ Number(pkgPrice(pkg)).toLocaleString() }}
                      <s v-if="isEarlyBird(pkg)" class="reg-pkg-strike">₦{{ Number(pkg.price).toLocaleString() }}</s>
                    </p>
                    <p v-if="isEarlyBird(pkg)" class="reg-pkg-early">
                      Early-bird ends {{ new Date(pkg.early_bird_deadline).toLocaleDateString('en-NG',{day:'numeric',month:'short'}) }}
                    </p>
                    <p v-if="pkg.description" class="reg-pkg-desc">{{ pkg.description }}</p>
                  </div>
                </label>
              </div>

              <!-- ── Step 2: Your details ── -->
              <template v-if="!auth.isLoggedIn">
                <div class="reg-divider"/>
                <p class="reg-step-label">2. Your details</p>
                <div class="reg-fields">
                  <div class="reg-field">
                    <label class="reg-field-label">Full name <span class="reg-required">*</span></label>
                    <input
                      v-model="guestName"
                      type="text"
                      class="reg-input"
                      placeholder="e.g. Fatima Abdullahi"
                      autocomplete="name"
                    />
                  </div>
                  <div class="reg-field">
                    <label class="reg-field-label">Email address <span class="reg-required">*</span></label>
                    <input
                      v-model="guestEmail"
                      type="email"
                      class="reg-input"
                      placeholder="your@email.com"
                      autocomplete="email"
                    />
                    <p class="reg-field-hint">Your QR-coded ticket will be sent here</p>
                  </div>
                </div>
                <p class="reg-signin-hint">
                  Already have an account?
                  <RouterLink :to="{ name: 'Login', query: { redirect: route.path + (selPkg ? '?pkg=' + selPkg.id : '') } }" style="color:var(--ma-green-deep);font-weight:600">Sign in</RouterLink>
                  for faster checkout
                </p>
              </template>

              <!-- Logged-in summary -->
              <template v-else>
                <div class="reg-divider"/>
                <div class="reg-user-badge">
                  <div class="reg-user-avatar">{{ auth.user?.name?.[0] }}</div>
                  <div>
                    <p style="font-weight:700;font-size:.88rem;color:var(--ma-green-dark)">{{ auth.user?.name }}</p>
                    <p style="font-size:.78rem;color:var(--ma-text-muted)">{{ auth.user?.email }}</p>
                  </div>
                </div>
              </template>

              <!-- ── Pay button ── -->
              <div class="reg-divider"/>
              <BaseButton
                @click="pay"
                :loading="paying"
                :disabled="!selPkg || (!auth.isLoggedIn && (!guestName.trim() || !guestEmail.trim()))"
                class="w-full"
                style="justify-content:center;font-size:1rem;padding:14px"
              >
                <template v-if="selPkg">
                  Pay &#8358;{{ paystackGrossUp(Number(pkgPrice(selPkg))).toLocaleString() }} Now
                </template>
                <template v-else>Select a package above</template>
              </BaseButton>

              <p v-if="selPkg" style="font-size:.72rem;color:var(--ma-text-muted);text-align:center;margin-top:4px">
                Listed &#8358;{{ Number(pkgPrice(selPkg)).toLocaleString() }} + &#8358;{{ (paystackGrossUp(Number(pkgPrice(selPkg))) - Number(pkgPrice(selPkg))).toLocaleString() }} Paystack fee
              </p>
              <p class="reg-secure-note">
                <Lock :size="12"/> Secured by Paystack &middot; Ticket sent to your email instantly
              </p>

            </div>

            <!-- Deadline -->
            <div class="reg-deadline">
              <CalendarOff :size="13"/>
              Registration closes {{ new Date(event.deadline).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'}) }}
            </div>

          </template>
        </div>
      </div>
    </section>
  </div>
  <PublicFooter />
  </div>
</template>

<style scoped>
.event-hero{min-height:380px;background:var(--ma-green-dark) center/cover no-repeat;position:relative;display:flex;align-items:flex-end}
.event-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,59,21,.9) 0%,rgba(13,59,21,.5) 60%,rgba(13,59,21,.2) 100%)}
.event-hero-content{position:relative;z-index:1;padding-bottom:48px;padding-top:80px}
.event-hero-content h1{color:var(--ma-white);margin:12px 0 20px;max-width:700px}
.event-type-pill{display:inline-flex;align-items:center;gap:6px;background:var(--ma-green);color:#fff;padding:5px 14px;border-radius:20px;font-size:.8rem;font-weight:600}
.event-meta-row{display:flex;flex-wrap:wrap;gap:20px;color:rgba(255,255,255,.8);font-size:.9rem}
.event-meta-row span{display:flex;align-items:center;gap:6px}
.packages-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.pkg-card{border:2px solid var(--ma-border);border-radius:var(--radius-lg);padding:20px;cursor:pointer;transition:all var(--trans-base);position:relative}
.pkg-card:hover,.pkg-card.selected{border-color:var(--ma-green);background:var(--ma-green-tint)}
.pkg-name{font-weight:700;color:var(--ma-green-dark);margin-bottom:8px}
.pkg-price{font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--ma-green-dark)}
.pkg-original{font-size:.85rem;color:var(--ma-text-muted);text-decoration:line-through;margin-top:2px}
.pkg-desc{font-size:.82rem;color:var(--ma-text-muted);margin-top:8px;line-height:1.5}
.pkg-deadline{display:flex;align-items:center;gap:4px;font-size:.75rem;color:#7A5F00;margin-top:8px}
.early-bird-badge{position:absolute;top:-10px;right:10px;background:var(--ma-gold);color:#000;padding:2px 10px;border-radius:10px;font-size:.72rem;font-weight:700}
/* Register card internals */
.reg-form{display:flex;flex-direction:column;gap:0}
.reg-step-label{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ma-text-muted);margin-bottom:10px}
.reg-divider{height:1px;background:var(--ma-border);margin:16px 0}
.reg-fields{display:flex;flex-direction:column;gap:12px}
.reg-field{display:flex;flex-direction:column;gap:5px}
.reg-field-label{font-size:.83rem;font-weight:600;color:var(--ma-text)}
.reg-required{color:#e53e3e}
.reg-input{width:100%;padding:10px 12px;border:1.5px solid var(--ma-border);border-radius:var(--radius-md);font-size:.9rem;font-family:var(--font-body);color:var(--ma-text);background:var(--ma-white);transition:border-color .15s;box-sizing:border-box}
.reg-input:focus{outline:none;border-color:var(--ma-green);box-shadow:0 0 0 3px var(--ma-green-tint)}
.reg-input::placeholder{color:var(--ma-text-muted)}
.reg-field-hint{font-size:.72rem;color:var(--ma-text-muted)}
.reg-signin-hint{font-size:.78rem;color:var(--ma-text-muted);margin-top:10px}
.reg-user-badge{display:flex;align-items:center;gap:10px;padding:10px;background:var(--ma-green-tint);border-radius:var(--radius-md)}
.reg-user-avatar{width:34px;height:34px;border-radius:50%;background:var(--ma-green-deep);color:#fff;font-family:var(--font-heading);font-size:.88rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.reg-secure-note{display:flex;align-items:center;justify-content:center;gap:5px;font-size:.72rem;color:var(--ma-text-muted);margin-top:8px}
.reg-deadline{display:flex;align-items:center;gap:6px;margin-top:16px;padding-top:14px;border-top:1px solid var(--ma-border);font-size:.78rem;color:var(--ma-text-muted)}
.reg-pkg-strike{color:var(--ma-text-muted);font-size:.8rem;font-weight:400;margin-left:6px}
.reg-pkg-list{display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;padding-right:4px}
.reg-pkg-option{display:flex;align-items:flex-start;gap:10px;padding:12px;border:2px solid var(--ma-border);border-radius:var(--radius-md);cursor:pointer;transition:all .15s}
.reg-pkg-option.selected{border-color:var(--ma-green);background:var(--ma-green-tint)}
.reg-pkg-info{flex:1}
.reg-pkg-name{font-weight:700;color:var(--ma-green-dark);font-size:.9rem;margin-bottom:2px}
.reg-pkg-price{font-family:var(--font-heading);font-size:1.15rem;font-weight:700;color:var(--ma-green-dark);display:flex;align-items:center;gap:8px}
.reg-pkg-early{font-size:.72rem;color:var(--ma-gold);font-weight:600;margin-top:2px}
.reg-pkg-desc{font-size:.78rem;color:var(--ma-text-muted);margin-top:4px}
.ev-content-grid{display:grid;grid-template-columns:1fr 360px;gap:48px;align-items:start}
.register-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:28px;position:sticky;top:80px;box-shadow:var(--shadow-md)}
.packages-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
@media(max-width:960px){
  /* Register card internals */
.reg-form{display:flex;flex-direction:column;gap:0}
.reg-step-label{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ma-text-muted);margin-bottom:10px}
.reg-divider{height:1px;background:var(--ma-border);margin:16px 0}
.reg-fields{display:flex;flex-direction:column;gap:12px}
.reg-field{display:flex;flex-direction:column;gap:5px}
.reg-field-label{font-size:.83rem;font-weight:600;color:var(--ma-text)}
.reg-required{color:#e53e3e}
.reg-input{width:100%;padding:10px 12px;border:1.5px solid var(--ma-border);border-radius:var(--radius-md);font-size:.9rem;font-family:var(--font-body);color:var(--ma-text);background:var(--ma-white);transition:border-color .15s;box-sizing:border-box}
.reg-input:focus{outline:none;border-color:var(--ma-green);box-shadow:0 0 0 3px var(--ma-green-tint)}
.reg-input::placeholder{color:var(--ma-text-muted)}
.reg-field-hint{font-size:.72rem;color:var(--ma-text-muted)}
.reg-signin-hint{font-size:.78rem;color:var(--ma-text-muted);margin-top:10px}
.reg-user-badge{display:flex;align-items:center;gap:10px;padding:10px;background:var(--ma-green-tint);border-radius:var(--radius-md)}
.reg-user-avatar{width:34px;height:34px;border-radius:50%;background:var(--ma-green-deep);color:#fff;font-family:var(--font-heading);font-size:.88rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.reg-secure-note{display:flex;align-items:center;justify-content:center;gap:5px;font-size:.72rem;color:var(--ma-text-muted);margin-top:8px}
.reg-deadline{display:flex;align-items:center;gap:6px;margin-top:16px;padding-top:14px;border-top:1px solid var(--ma-border);font-size:.78rem;color:var(--ma-text-muted)}
.reg-pkg-strike{color:var(--ma-text-muted);font-size:.8rem;font-weight:400;margin-left:6px}
.reg-pkg-list{display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;padding-right:4px}
.reg-pkg-option{display:flex;align-items:flex-start;gap:10px;padding:12px;border:2px solid var(--ma-border);border-radius:var(--radius-md);cursor:pointer;transition:all .15s}
.reg-pkg-option.selected{border-color:var(--ma-green);background:var(--ma-green-tint)}
.reg-pkg-info{flex:1}
.reg-pkg-name{font-weight:700;color:var(--ma-green-dark);font-size:.9rem;margin-bottom:2px}
.reg-pkg-price{font-family:var(--font-heading);font-size:1.15rem;font-weight:700;color:var(--ma-green-dark);display:flex;align-items:center;gap:8px}
.reg-pkg-early{font-size:.72rem;color:var(--ma-gold);font-weight:600;margin-top:2px}
.reg-pkg-desc{font-size:.78rem;color:var(--ma-text-muted);margin-top:4px}
.ev-content-grid{grid-template-columns:1fr}
  .register-card{position:static;margin-top:32px}
}
@media(max-width:480px){
  .event-hero{min-height:280px}
  .event-hero-content{padding-bottom:28px;padding-top:60px}
  .event-hero-content h1{font-size:1.5rem}
  .packages-grid{grid-template-columns:1fr}
  .pkg-price{font-size:1.25rem}
}
</style>
