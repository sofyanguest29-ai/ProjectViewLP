'use client'
import { useState, useRef, useEffect, useMemo } from 'react'

export default function ProjectSearchInput({ projects, value, onChange, placeholder = 'Cari ID atau nama project...' }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    if (!value) return []
    const q = value.toLowerCase()
    return projects
      .filter((p) => p.project_code.includes(q) || p.title.toLowerCase().includes(q))
      .slice(0, 8)
  }, [projects, value])

  return (
    <div className="searchable-select project-search-wrapper" ref={wrapperRef}>
      <input
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open && value && (
        <div className="searchable-select-dropdown">
          {filtered.length === 0 && <div className="searchable-select-empty">Tidak ditemukan</div>}
          {filtered.map((p) => (
            <button
              type="button"
              key={p.id}
              className="searchable-select-option"
              onClick={() => {
                onChange(p.title)
                setOpen(false)
              }}
            >
              #{p.project_code} - {p.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
