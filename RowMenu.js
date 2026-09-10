'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { PROJECT_STATUS } from '@/lib/constants'

export default function RowMenu({ onEdit, onDelete, onChangeStatus, isGuest }) {
  const [open, setOpen] = useState(false)
  const [statusSubmenu, setStatusSubmenu] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(e.target)
      const clickedMenu = menuRef.current && menuRef.current.contains(e.target)
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false)
        setStatusSubmenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isGuest) return null

  function handleToggle(e) {
    e.stopPropagation()
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, left: Math.max(8, rect.right - 160) })
    }
    setOpen((v) => !v)
  }

  return (
    <div className="row-menu">
      <button type="button" ref={triggerRef} className="row-menu-trigger" onClick={handleToggle}>
        &#8942;
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="row-menu-dropdown"
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => { setOpen(false); onEdit?.() }}>Edit</button>
            <button type="button" onClick={() => { setOpen(false); onDelete?.() }}>Delete</button>
            <div
              className="row-menu-status"
              onMouseEnter={() => setStatusSubmenu(true)}
              onMouseLeave={() => setStatusSubmenu(false)}
            >
              <button type="button" className="row-menu-status-trigger">Ubah Status &#9656;</button>
              {statusSubmenu && (
                <div className="row-menu-status-list">
                  {PROJECT_STATUS.map((s) => (
                    <button
                      type="button"
                      key={s.value}
                      onClick={() => { setOpen(false); setStatusSubmenu(false); onChangeStatus?.(s.value) }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
