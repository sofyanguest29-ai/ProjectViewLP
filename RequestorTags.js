'use client'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function RequestorTags({ names }) {
  const [hover, setHover] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef(null)

  if (!names || names.length === 0) return <span>-</span>
  if (names.length <= 3) return <span>{names.join(', ')}</span>

  function handleEnter() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left })
    }
    setHover(true)
  }

  return (
    <span ref={ref} className="requestor-tags-wrapper" onMouseEnter={handleEnter} onMouseLeave={() => setHover(false)}>
      {names.slice(0, 3).join(', ')}, <span className="requestor-more">...</span>
      {hover &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="requestor-tooltip" style={{ top: pos.top, left: pos.left }}>
            {names.join(', ')}
          </div>,
          document.body
        )}
    </span>
  )
}
