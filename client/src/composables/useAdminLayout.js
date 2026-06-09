/**
 * Shared admin layout state
 * Use in every admin view to avoid repeating sidebar open/close logic
 */
import { ref } from 'vue'
export const useAdminLayout = () => {
  const sidebarOpen = ref(false)
  return { sidebarOpen }
}
