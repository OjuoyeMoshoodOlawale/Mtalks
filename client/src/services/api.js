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

api.interceptors.request.use(async (config) => {
  const store = await getStore()
  if (store.accessToken) config.headers.Authorization = `Bearer ${store.accessToken}`
  return config
})

let isRefreshing = false
let failedQueue = []
const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { original.headers.Authorization = `Bearer ${token}`; return api(original) })
      }
      original._retry = true
      isRefreshing = true
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
