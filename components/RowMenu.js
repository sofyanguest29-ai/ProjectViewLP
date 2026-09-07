'use client'
import { useState, useRef, useEffect } from 'react'
import { PROJECT_STATUS } from '@/lib/constants'

export default function RowMenu({ onEdit, onDelete, onChangeStatus, isGuest }) {
  const [open, setOpen] = useState(false)
  const [statusSubmenu, setStatusSubmenu] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setStatusSubmenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isGuest) return null

  return (
    <div className="row-menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="row-menu-trigger" onClick={() => setOpen((v) => !v)}>
        &#8942;
      </button>
      {open && (
        <div className="row-menu-dropdown">
          <button type="button" onClick={() => { setOpen(false); onEdit?.() }}>Edit</button>
          <button type="button" onClick={() => { setOpen(false); onDelete?.() }}>Delete</button>
          <div className="row-menu-status" onMouseEnter={() => setStatusSubmenu(true)} onMouseLeave={() => setStatusSubmenu(false)}>
            <button type="button" className="row-menu-status-trigger">Ubah Status &#9656;</button>
            {statusSubmenu && (
              <div className="row-menu-status-list">
                {PROJECT_STATUS.map((s) => (
                  <button type="button" key={s.value} onClick={() => { setOpen(false); setStatusSubmenu(false); onChangeStatus?.(s.value) }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
