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

  const logout = () => {
    accessToken.value = ''
    user.value = null
    localStorage.removeItem('ma_token')
    api.post('/auth/logout').catch(() => {})
  }

  return { user, accessToken, isLoggedIn, isAdmin, setToken, setUser, fetchMe, login, logout }
})
