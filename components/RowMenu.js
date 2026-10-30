'use client'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { PROJECT_STATUS } from '@/lib/constants'

export default function RowMenu({ onEdit, onDuplicate, onDelete, onChangeStatus, isGuest }) {
  const [open, setOpen] = useState(false)
  const [statusSubmenu, setStatusSubmenu] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [subPlacement, setSubPlacement] = useState({ side: 'right', vertical: 'top' })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const statusRef = useRef(null)

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

  // Setelah menu muncul, ukur lalu geser supaya tidak ketutup window browser
  useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return
    const trigger = triggerRef.current.getBoundingClientRect()
    const menu = menuRef.current.getBoundingClientRect()
    const margin = 8
    let top = trigger.bottom + 4
    if (top + menu.height > window.innerHeight - margin) {
      top = Math.max(margin, trigger.top - menu.height - 4)
    }
    let left = trigger.right - menu.width
    left = Math.max(margin, Math.min(left, window.innerWidth - menu.width - margin))
    setPosition({ top, left })
  }, [open])

  if (isGuest) return null

  function handleToggle(e) {
    e.stopPropagation()
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, left: Math.max(8, rect.right - 160) })
      setStatusSubmenu(false)
    }
    setOpen((v) => !v)
  }

  // Submenu status: buka ke kiri kalau kanan tidak muat, naik ke atas kalau bawah tidak muat
  function openStatusSubmenu() {
    if (statusRef.current) {
      const rect = statusRef.current.getBoundingClientRect()
      const subWidth = 150
      const subHeight = PROJECT_STATUS.length * 34 + 12
      const side = rect.right + subWidth + 8 > window.innerWidth ? 'left' : 'right'
      const vertical = rect.top + subHeight > window.innerHeight - 8 ? 'bottom' : 'top'
      setSubPlacement({ side, vertical })
    }
    setStatusSubmenu(true)
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
            <button type="button" onClick={() => { setOpen(false); onDuplicate?.() }}>Duplicate</button>
            <button type="button" onClick={() => { setOpen(false); onDelete?.() }}>Delete</button>
            <div
              className="row-menu-status"
              ref={statusRef}
              onMouseEnter={openStatusSubmenu}
              onMouseLeave={() => setStatusSubmenu(false)}
            >
              <button type="button" className="row-menu-status-trigger">Ubah Status &#9656;</button>
              {statusSubmenu && (
                <div className={`row-menu-status-list sub-${subPlacement.side} sub-${subPlacement.vertical}`}>
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
