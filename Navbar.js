'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        Project Monitor
        {isGuest && <span className="guest-badge">Guest &middot; View Only</span>}
      </div>
      <div className="navbar-links">
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  )
}
