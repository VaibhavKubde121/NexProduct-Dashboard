import { useEffect, useState } from 'react'
import LoginPage from './components/LoginPage.jsx'
import ProductPage from './components/ProductPage.jsx'
import ProductDetailsPage from './components/ProductDetailsPage.jsx'
import { getStoredUser, logout } from './lib/session.js'

function go(path, replace = false) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState(getStoredUser)
  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  useEffect(() => {
    if (!user && path !== '/login') go('/login', true)
    if (user && (path === '/login' || (path !== '/products' && !/^\/products\/[^/]+\/?$/.test(path)))) go('/products', true)
  }, [path, user])
  function handleLogin(profile) { setUser(profile); go('/products', true) }
  function handleLogout() { logout(); setUser(null); go('/login', true) }
  if (!user) return <LoginPage onLogin={handleLogin} />
  if (path === '/products') return <ProductPage user={user} onLogout={handleLogout} />
  const detailMatch = path.match(/^\/products\/([^/]+)\/?$/)
  if (detailMatch) return <ProductDetailsPage id={detailMatch[1]} onLogout={handleLogout} />
  return <ProductPage user={user} onLogout={handleLogout} />
}
