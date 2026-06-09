import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useCoursesStore = defineStore('courses', () => {
  const courses    = ref([])
  const current    = ref(null)
  const pagination = ref({})
  const loading    = ref(false)

  const fetchAll = async (params = {}) => {
    loading.value = true
    try {
      const { data } = await api.get('/courses', { params })
      courses.value    = data.data
      pagination.value = data.pagination || {}
    } finally { loading.value = false }
  }

  const fetchOne = async (slug) => {
    loading.value = true
    try {
      const { data } = await api.get(`/courses/${slug}`)
      current.value = data.data
      return data.data
    } finally { loading.value = false }
  }

  return { courses, current, pagination, loading, fetchAll, fetchOne }
})
