'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// options: [{ value, label }]
// selected: array of values
export default function MultiFilterSelect({ options, selected, onChange, placeholder = 'Semua' }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      const insideTrigger = triggerRef.current && triggerRef.current.contains(e.target)
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target)
      if (!insideTrigger && !insideDropdown) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleToggleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setOpen((v) => !v)
  }

  function toggleOption(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label)

  return (
    <div className="multiselect" ref={triggerRef}>
      <button type="button" className="multiselect-trigger" onClick={handleToggleOpen}>
        {selectedLabels.length === 0 ? (
          <span className="multiselect-placeholder">{placeholder}</span>
        ) : (
          <span className="multiselect-tags">
            {selectedLabels.map((l) => (
              <span key={l} className="multiselect-tag">{l}</span>
            ))}
          </span>
        )}
        <span className="multiselect-caret">&#9662;</span>
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="multiselect-dropdown"
            ref={dropdownRef}
            style={{ position: 'fixed', top: position.top, left: position.left, width: Math.max(position.width, 180) }}
          >
            {options.map((o) => (
              <label key={o.value} className="multiselect-option">
                <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggleOption(o.value)} />
                {o.label}
              </label>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}
