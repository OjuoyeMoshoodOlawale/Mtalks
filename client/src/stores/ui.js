import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts  = ref([])
  const loading = ref(false)

  const addToast = (message, type = 'success', duration = 3500) => {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, duration)
  }

  const toast   = (msg)              => addToast(msg, 'success')
  const toastError = (msg)           => addToast(msg, 'error')
  const toastWarning = (msg)         => addToast(msg, 'warning')
  const setLoading  = (val)          => { loading.value = val }

  return { toasts, loading, toast, toastError, toastWarning, setLoading }
})
