<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import PublicHeader from '@/components/layout/PublicHeader.vue'
import PublicFooter from '@/components/layout/PublicFooter.vue'
import BaseLoader   from '@/components/common/BaseLoader.vue'
import BaseButton   from '@/components/common/BaseButton.vue'
import { User, Mail, Lock, CheckCircle, AlertCircle, Shield, Calendar } from 'lucide-vue-next'

const auth   = useAuthStore()
const loading = ref(true)

/* Profile form */
const profile = reactive({ name: '', avatar: '' })
const profileSaving = ref(false)
const profileMsg    = ref({ type: '', text: '' })

/* Password form */
const passwords = reactive({ current: '', newPw: '', confirm: '' })
const pwSaving   = ref(false)
const pwMsg      = ref({ type: '', text: '' })

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/me')
    profile.name   = data.data?.name || auth.user?.name || ''
    profile.avatar = data.data?.avatar || ''
  } finally {
    loading.value = false
  }
})

/* Avatar initials */
const initials = (name) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

async function saveProfile () {
  if (!profile.name.trim()) {
    profileMsg.value = { type: 'error', text: 'Name cannot be empty.' }
    return
  }
  profileSaving.value = true
  profileMsg.value = { type: '', text: '' }
  try {
    const { data } = await api.put('/auth/update-profile', {
      name: profile.name.trim(),
      avatar: profile.avatar.trim() || null
    })
    // Update Pinia store
    if (auth.user) auth.user.name = data.data?.user?.name || profile.name
    profileMsg.value = { type: 'success', text: 'Profile updated successfully.' }
  } catch (err) {
    profileMsg.value = { type: 'error', text: err.response?.data?.message || 'Update failed.' }
  } finally {
    profileSaving.value = false
  }
}

async function changePassword () {
  if (!passwords.current || !passwords.newPw) {
    pwMsg.value = { type: 'error', text: 'Both fields are required.' }
    return
  }
  if (passwords.newPw.length < 8) {
    pwMsg.value = { type: 'error', text: 'New password must be at least 8 characters.' }
    return
  }
  if (passwords.newPw !== passwords.confirm) {
    pwMsg.value = { type: 'error', text: 'Passwords do not match.' }
    return
  }
  pwSaving.value = true
  pwMsg.value = { type: '', text: '' }
  try {
    await api.put('/auth/change-password', {
      currentPassword: passwords.current,
      newPassword:     passwords.newPw
    })
    passwords.current = ''
    passwords.newPw   = ''
    passwords.confirm = ''
    pwMsg.value = { type: 'success', text: 'Password changed successfully.' }
  } catch (err) {
    pwMsg.value = { type: 'error', text: err.response?.data?.message || 'Password change failed.' }
  } finally {
    pwSaving.value = false
  }
}

const memberSince = (date) =>
  date ? new Date(date).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : ''
</script>

<template>
  <div class="profile-page">
    <PublicHeader />

    <div class="page-hero">
      <div class="container">
        <h1>My Profile</h1>
        <p>Manage your account details and security</p>
      </div>
    </div>

    <div class="container page-body">
      <div v-if="loading" class="loader-wrap">
        <BaseLoader />
      </div>

      <div v-else class="profile-layout">
        <!-- Left: Account summary card -->
        <aside class="account-card">
          <div class="avatar-circle">{{ initials(profile.name || auth.user?.name) }}</div>
          <h3>{{ profile.name || auth.user?.name }}</h3>
          <p class="account-email"><Mail :size="13" /> {{ auth.user?.email }}</p>
          <div class="account-badges">
            <span class="role-badge">
              <Shield :size="12" />
              {{ auth.user?.role === 'admin' ? 'Administrator' : 'Student' }}
            </span>
          </div>
          <p class="member-since" v-if="auth.user?.created_at">
            <Calendar :size="13" /> Member since {{ memberSince(auth.user.created_at) }}
          </p>
        </aside>

        <!-- Right: Forms -->
        <div class="forms-col">
          <!-- Profile info -->
          <section class="form-card">
            <h2 class="form-card__title"><User :size="18" /> Personal Information</h2>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input v-model="profile.name" type="text" class="form-control" placeholder="Your full name" />
            </div>

            <div class="form-group">
              <label class="form-label">Avatar URL <span class="optional">(optional)</span></label>
              <input v-model="profile.avatar" type="url" class="form-control" placeholder="https://…" />
              <p class="form-hint">Paste a direct link to an image. Leave empty to use initials.</p>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input :value="auth.user?.email" type="email" class="form-control" disabled />
              <p class="form-hint">Email address cannot be changed.</p>
            </div>

            <!-- Feedback -->
            <div v-if="profileMsg.text" class="feedback-msg" :class="`feedback-msg--${profileMsg.type}`">
              <CheckCircle v-if="profileMsg.type === 'success'" :size="15" />
              <AlertCircle v-else :size="15" />
              {{ profileMsg.text }}
            </div>

            <BaseButton :loading="profileSaving" @click="saveProfile" class="btn--primary">
              Save Changes
            </BaseButton>
          </section>

          <!-- Change password -->
          <section class="form-card">
            <h2 class="form-card__title"><Lock :size="18" /> Change Password</h2>

            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input v-model="passwords.current" type="password" class="form-control" placeholder="Enter current password" />
            </div>

            <div class="form-group">
              <label class="form-label">New Password</label>
              <input v-model="passwords.newPw" type="password" class="form-control" placeholder="Min. 8 characters" />
            </div>

            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input v-model="passwords.confirm" type="password" class="form-control" placeholder="Repeat new password" />
            </div>

            <!-- Feedback -->
            <div v-if="pwMsg.text" class="feedback-msg" :class="`feedback-msg--${pwMsg.type}`">
              <CheckCircle v-if="pwMsg.type === 'success'" :size="15" />
              <AlertCircle v-else :size="15" />
              {{ pwMsg.text }}
            </div>

            <BaseButton :loading="pwSaving" @click="changePassword" class="btn--outline">
              Update Password
            </BaseButton>
          </section>
        </div>
      </div>
    </div>

    <PublicFooter />
  </div>
</template>

<style scoped>
.profile-page{background:var(--ma-off-white);min-height:100vh}
.page-hero{background:var(--ma-green-dark);color:var(--ma-white);padding:48px 0 36px}
.page-hero h1{font-family:var(--font-heading);font-size:2rem;margin-bottom:6px}
.page-hero p{opacity:.75;font-size:.95rem}
.page-body{padding:36px 0 64px}
.loader-wrap{padding:60px 0;display:flex;justify-content:center}
/* Layout */
.profile-layout{display:grid;grid-template-columns:260px 1fr;gap:28px;align-items:start}
@media(max-width:768px){.profile-layout{grid-template-columns:1fr}}
/* Account card */
.account-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:28px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;position:sticky;top:90px}
.avatar-circle{width:80px;height:80px;border-radius:50%;background:var(--ma-green-deep);color:var(--ma-white);font-family:var(--font-heading);font-size:1.8rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-bottom:4px}
.account-card h3{font-family:var(--font-heading);color:var(--ma-green-dark);font-size:1.1rem}
.account-email{display:flex;align-items:center;gap:5px;font-size:.82rem;color:var(--ma-text-muted)}
.account-badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.role-badge{display:inline-flex;align-items:center;gap:4px;background:var(--ma-green-tint);color:var(--ma-green-deep);font-size:.75rem;font-weight:600;padding:3px 10px;border-radius:10px}
.member-since{display:flex;align-items:center;gap:5px;font-size:.78rem;color:var(--ma-text-muted);margin-top:6px}
/* Forms */
.forms-col{display:flex;flex-direction:column;gap:20px}
.form-card{background:var(--ma-white);border:1px solid var(--ma-border);border-radius:var(--radius-lg);padding:28px}
.form-card__title{display:flex;align-items:center;gap:8px;font-family:var(--font-heading);color:var(--ma-green-dark);font-size:1.05rem;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--ma-border)}
.form-group{margin-bottom:16px}
.form-label{display:block;font-size:.82rem;font-weight:600;color:var(--ma-green-dark);margin-bottom:5px}
.optional{font-weight:400;color:var(--ma-text-muted)}
.form-control{width:100%;padding:9px 12px;border:1px solid var(--ma-border);border-radius:var(--radius-md);font-size:.9rem;transition:border-color var(--trans-fast);background:var(--ma-white)}
.form-control:focus{outline:none;border-color:var(--ma-green)}
.form-control:disabled{background:var(--ma-off-white);color:var(--ma-text-muted);cursor:not-allowed}
.form-hint{font-size:.75rem;color:var(--ma-text-muted);margin-top:4px}
/* Feedback */
.feedback-msg{display:flex;align-items:center;gap:6px;font-size:.85rem;padding:8px 12px;border-radius:var(--radius-md);margin-bottom:14px}
.feedback-msg--success{background:#d4edda;color:#155724}
.feedback-msg--error{background:#f8d7da;color:#721c24}
</style>
