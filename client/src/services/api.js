import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

let _store = null
const getStore = async () => {
  if (!_store) {
    const { useAuthStore } = await import('@/stores/auth')
    _store = useAuthStore()
  }
  return _store
}

/* ── Request: attach token ── */
api.interceptors.request.use(async (config) => {
  const store = await getStore()
  if (store.accessToken) config.headers.Authorization = `Bearer ${store.accessToken}`
  return config
})

/* ── Response: handle 401 with token refresh ──
 * ONLY retry requests that are NOT auth endpoints themselves.
 * Retrying /auth/login or /auth/refresh would cause an infinite loop.
 */
const NO_RETRY_URLS = ['/auth/login', '/auth/register', '/auth/refresh',
                       '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email']

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
    const url = original?.url || ''

    /* Don't attempt refresh on auth endpoints or already-retried requests */
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !NO_RETRY_URLS.some(u => url.includes(u))
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { original.headers.Authorization = `Bearer ${token}`; return api(original) })
          .catch(e => Promise.reject(e))
      }

      original._retry = true
      isRefreshing     = true

      try {
        const { data } = await api.post('/auth/refresh')
        const token = data.data.accessToken;
        (await getStore()).setToken(token)
        processQueue(null, token)
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (e) {
        processQueue(e, null);
        (await getStore()).logout()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
