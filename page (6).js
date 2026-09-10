'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PasswordField from '@/components/PasswordField'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const router = useRouter(); const supabase = createClient()
  async function handleUpdate(e) { e.preventDefault(); setError(''); if (password.length < 8) return setError('Password minimal 8 karakter'); if (password !== confirm) return setError('New Password dan Confirm New Password harus sama'); setLoading(true); const { error } = await supabase.auth.updateUser({ password }); setLoading(false); if (error) return setError(error.message); setMessage('Password berhasil diubah. Mengalihkan ke login...'); setTimeout(() => router.push('/login'), 1500) }
  return <div className="auth-container"><form onSubmit={handleUpdate} className="auth-form auth-form-polished"><h1>Set Password Baru</h1><p className="subtitle">Buat password baru untuk akun kamu</p>{error && <div className="error-box">{error}</div>}{message && <div className="success-box">{message}</div>}<label>New Password</label><PasswordField value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /><label>Confirm New Password</label><PasswordField value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" /><button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Password'}</button></form></div>
}
