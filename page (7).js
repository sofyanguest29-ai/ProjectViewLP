'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setMessage('Link reset password sudah dikirim ke email kamu.')
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleReset} className="auth-form">
        <h1>Reset Password</h1>
        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Link Reset'}</button>
        <Link href="/login" className="link">Kembali ke login</Link>
      </form>
    </div>
  )
}
