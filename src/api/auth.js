import api from '../lib/axios.js'
export async function login(credentials) {
  const { data } = await api.post('/auth/login', { ...credentials, expiresInMins: 60 })
  return data
}
