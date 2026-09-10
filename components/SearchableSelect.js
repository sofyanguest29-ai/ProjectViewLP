'use client'
import { useState, useRef, useEffect, useMemo } from 'react'

// options: [{ value, label }]
export default function SearchableSelect({ options, value, onChange, placeholder = 'Cari...', allLabel = 'Semua' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    if (!query) return options
    return options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
  }, [options, query])

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label ?? allLabel

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <input
        className="searchable-select-input"
        value={open ? query : (value ? selectedLabel : '')}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        placeholder={value ? selectedLabel : placeholder}
      />
      {open && (
        <div className="searchable-select-dropdown">
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
        </div>
      )}
    </div>
  )
}
