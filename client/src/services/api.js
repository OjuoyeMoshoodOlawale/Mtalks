import axios from 'axios'

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' }
})

let _store = null
const getStore = async () => {
  if (!_store) {
    const { useAuthStore } = await import('@/stores/auth')
    _store = useAuthStore()
  }
  return _store
}

/* ── Request: attach Bearer token ── */
api.interceptors.request.use(async (config) => {
  const store = await getStore()
  if (store.accessToken) config.headers.Authorization = `Bearer ${store.accessToken}`
  return config
})

/*
 * ── Response: silent 401 handling ──
 *
 * Auth endpoints must NEVER trigger a refresh retry — doing so causes a loop:
 *   /auth/me fails → tries refresh → refresh fails → logout() → calls /auth/logout
 *   → /auth/logout fails → tries refresh again → ∞
 *
 * Rule: if ANY of these return 401, silently logout and stop.
 */
const AUTH_URLS = [
  '/auth/login', '/auth/register', '/auth/refresh',
  '/auth/logout', '/auth/me',
  '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email'
]

let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const url      = original?.url || ''
    const status   = err.response?.status

    /* ── Silent logout for all auth-endpoint 401s ── */
    if (status === 401 && AUTH_URLS.some(u => url.includes(u))) {
      const store = await getStore()
      store.clearSession()          // clear token locally — no API call
      return Promise.reject(err)    // caller handles it (e.g. fetchMe catch)
    }

    /* ── Refresh token for other 401s (expired access token mid-session) ── */
    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          failedQueue.push({ resolve, reject })
        ).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing    = true

      try {
        const { data } = await api.post('/auth/refresh')
        const token    = data.data.accessToken;
        (await getStore()).setToken(token)
        processQueue(null, token)
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        (await getStore()).clearSession()   // silent — no API call
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    /* ── Network error (server offline) ── */
    if (!err.response) {
      const netErr      = new Error('Cannot reach the server. Please check your connection.')
      netErr.isNetworkError = true
      return Promise.reject(netErr)
    }

    return Promise.reject(err)
  }
)

export default api
