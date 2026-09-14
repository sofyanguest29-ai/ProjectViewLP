'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PasswordField from '@/components/PasswordField'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleUpdate(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    if (password !== confirm) {
      setError('New Password dan Confirm New Password harus sama')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setMessage('Password berhasil diubah. Mengalihkan ke login...')
    setTimeout(() => router.push('/login'), 1500)
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleUpdate} className="auth-form">
        <h1>Set Password Baru</h1>
        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}
        <PasswordField label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
        <PasswordField label="Confirm New Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} />
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? 'Menyimpan...' : 'Simpan Password'}
        </button>
      </form>
    </div>
  )
}
