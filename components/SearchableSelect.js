'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

// options: [{ value, label }]
export default function SearchableSelect({ options, value, onChange, placeholder = 'Cari...', allLabel = 'Semua' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      const insideWrapper = wrapperRef.current && wrapperRef.current.contains(e.target)
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target)
      if (!insideWrapper && !insideDropdown) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openDropdown() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setOpen(true)
    setQuery('')
  }

  const filtered = useMemo(() => {
    if (!query) return options
    return options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
  }, [options, query])

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label ?? allLabel

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <input
        ref={inputRef}
        className="searchable-select-input"
        value={open ? query : (value ? selectedLabel : '')}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!open) openDropdown()
        }}
        onFocus={openDropdown}
        placeholder={value ? selectedLabel : placeholder}
      />
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="searchable-select-dropdown"
            ref={dropdownRef}
            style={{ position: 'fixed', top: position.top, left: position.left, width: Math.max(position.width, 150) }}
          >
            <button
              type="button"
              className="searchable-select-option"
              onClick={() => {
                onChange('')
                setOpen(false)
                setQuery('')
              }}
            >
              {allLabel}
            </button>
            {filtered.map((o) => (
              <button
                type="button"
                key={o.value}
                className="searchable-select-option"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setQuery('')
                }}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && <div className="searchable-select-empty">Tidak ditemukan</div>}
          </div>,
          document.body
        )}
    </div>
  )
}
