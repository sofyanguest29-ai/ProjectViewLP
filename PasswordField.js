'use client'
import { useState } from 'react'

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.8 10.8 0 0 1 12 5c5.2 0 9.1 4.1 10 7-.3 1-1.1 2.2-2.2 3.3M6.2 6.2C4.4 7.4 3.1 9.2 2 12c.9 2.9 4.8 7 10 7 1.1 0 2.1-.2 3.1-.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
  )
}

export default function PasswordField({ value, onChange, placeholder, required = false, minLength, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="password-field">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} required={required} minLength={minLength} autoComplete={autoComplete} />
      <button type="button" className="toggle-password" onClick={() => setShow((v) => !v)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} title={show ? 'Sembunyikan password' : 'Tampilkan password'}>
        <EyeIcon off={!show} />
      </button>
    </div>
  )
}
