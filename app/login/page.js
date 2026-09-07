'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGuest() {
    setError('')
    setGuestLoading(true)
    const { error } = await supabase.auth.signInAnonymously()
    setGuestLoading(false)
    if (error) {
      setError('Guest mode belum aktif di Supabase. Aktifkan dulu di Authentication > Sign In / Providers > Anonymous Sign-Ins.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <h1>Project Monitor</h1>
        <p className="subtitle">Login untuk masuk</p>
        {error && <div className="error-box">{error}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
        <button
          type="button"
          className="guest-btn"
          onClick={handleGuest}
          disabled={guestLoading}
        >
          {guestLoading ? 'Masuk sebagai guest...' : 'Masuk sebagai Guest'}
        </button>
        <Link href="/forgot-password" className="link">
          Lupa password?
        </Link>
      </form>
    </div>
  )
}
