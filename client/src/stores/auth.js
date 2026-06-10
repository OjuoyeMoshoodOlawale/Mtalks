import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user        = ref(null)
  const accessToken = ref(localStorage.getItem('ma_token') || '')

  const isLoggedIn = computed(() => !!accessToken.value)
  const isAdmin    = computed(() => user.value?.role === 'admin')

  const setToken = (token) => {
    accessToken.value = token
    localStorage.setItem('ma_token', token)
  }

  const setUser = (u) => { user.value = u }

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.data
    } catch (_) { logout() }
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.data.accessToken)
    user.value = data.data.user
    return data.data
  }

  /* clearSession — local only, never calls the API (avoids refresh loop) */
  const clearSession = () => {
    accessToken.value = ''
    user.value        = null
    localStorage.removeItem('ma_token')
  }

  /* logout — clears session then tells server (fire-and-forget, non-critical) */
  const logout = () => {
    clearSession()
    // Tell server to invalidate the httpOnly refresh cookie.
    // We use plain fetch so it bypasses the Axios interceptor entirely.
    fetch('/api/auth/logout', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' }
    }).catch(() => {})   // ignore errors — local session is already cleared
  }

  return { user, accessToken, isLoggedIn, isAdmin, setToken, setUser, fetchMe, login, logout, clearSession }
})
