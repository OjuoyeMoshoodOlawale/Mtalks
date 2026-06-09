import { useUiStore } from '@/stores/ui'
export const useToast = () => {
  const ui = useUiStore()
  return {
    toast:        (msg) => ui.toast(msg),
    toastError:   (msg) => ui.toastError(msg),
    toastWarning: (msg) => ui.toastWarning(msg)
  }
}
