import axios from 'axios'
import { getToken } from './session.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://dummyjson.com',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.message = error.response?.data?.message || error.response?.data?.error
      || (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Could not connect to DummyJSON. Please try again.')
    return Promise.reject(error)
  },
)

export default api
