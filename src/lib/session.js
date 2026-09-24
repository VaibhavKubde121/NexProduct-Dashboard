const TOKEN_KEY = 'admin-dashboard-token'
const USER_KEY = 'admin-dashboard-user'
export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function saveSession(data) {
  localStorage.setItem(TOKEN_KEY, data.accessToken || data.token)
  const user = { id: data.id, username: data.username, firstName: data.firstName, lastName: data.lastName, image: data.image }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}
export function getStoredUser() {
  if (!getToken()) return null
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}
export function logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) }
