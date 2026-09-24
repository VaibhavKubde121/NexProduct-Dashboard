import { useRef, useState } from 'react'
import { login } from '../api/auth.js'
import { saveSession } from '../lib/session.js'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const cleanUsername = username.trim()
    if (!cleanUsername || !password) {
      setError('Enter both your username and password.')
      return
    }
    lock.current = true; setBusy(true); setError('')
    try { onLogin(saveSession(await login({ username: cleanUsername, password }))) }
    catch (requestError) { setError(requestError.message || 'Sign in failed. Check your details and try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  return (
    <main className="login-shell">
      <div className="login-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-copy"><div className="art-brand"><img className="art-logo" src="/nexproduct-logo-light.svg" alt="NexProduct" /></div><h2>Make room<br />for better work.</h2><p>Your products, clearly in view.</p></div>
        <div className="art-card"><div className="art-card-top"><span>OVERVIEW</span><span className="live-dot">● LIVE</span></div><div className="art-bars">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div><div className="art-card-bottom"><span>Monthly revenue</span><strong>$24,680</strong></div></div>
      </div>
      <section className="login-panel"><form className="login-form" onSubmit={submit}>
        <span className="eyebrow">WELCOME BACK</span><h1>Sign in to your<br />workspace</h1>
        <p className="muted login-lead">Enter your details to continue to the admin dashboard.</p>
        <label className="field-label" htmlFor="username">Username</label><input id="username" name="username" autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); setError('') }} required aria-invalid={!!error} />
        <label className="field-label" htmlFor="password">Password</label><div className="password-field"><input id="password" name="password" type={hidePassword ? 'password' : 'text'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} required aria-invalid={!!error} /><button type="button" className="password-toggle" onClick={() => setHidePassword((hidden) => !hidden)} aria-label={hidePassword ? 'Show password' : 'Hide password'} aria-pressed={!hidePassword}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{hidePassword && <path d="m4 4 16 16"/>}</svg></button></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button login-button" type="submit" disabled={busy}>{busy ? <><span className="spinner" /> Signing in…</> : <>Sign in <span>→</span></>}</button>
        <p className="login-footer">Sign in securely to access your product dashboard.</p>
      </form></section>
    </main>
  )
}
