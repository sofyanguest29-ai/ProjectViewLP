'use client'
import { statusMeta } from '@/lib/constants'

export default function StatusBadge({ status }) {
  const meta = statusMeta(status)
  return (
    <span className="status-badge" style={{ color: meta.color, background: meta.bg }}>
      {meta.label}
    </span>
  )
}
