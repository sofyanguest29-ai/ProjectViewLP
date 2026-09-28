'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

// Multiple checklist project (tampil "#no - judul"), dropdown-nya dirender lewat portal
// supaya tidak terpotong oleh area scroll modal.
export default function ProjectMultiSelect({ projects = [], selected = [], onChange, placeholder = 'Pilih project...' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 340 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      const inTrigger = triggerRef.current && triggerRef.current.contains(e.target)
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target)
      if (!inTrigger && !inDropdown) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sorted = useMemo(
    () => [...projects].sort((a, b) => String(a.project_code).localeCompare(String(b.project_code), 'id', { numeric: true })),
    [projects]
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((p) => `${p.project_code} ${p.title}`.toLowerCase().includes(q))
  }, [sorted, query])

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.includes(p.id))

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const width = Math.max(340, rect.width)
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow < 320 ? Math.max(8, rect.top - 316) : rect.bottom + 4
      setPos({ top, left, width })
      setQuery('')
    }
    setOpen((v) => !v)
  }

  function toggleProject(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  function toggleAllVisible() {
    const ids = visible.map((p) => p.id)
    onChange(allVisibleSelected ? selected.filter((id) => !ids.includes(id)) : Array.from(new Set([...selected, ...ids])))
  }

  const selectedProjects = selected.map((id) => projects.find((p) => p.id === id)).filter(Boolean)

  return (
    <div className="pms">
      <button type="button" ref={triggerRef} className="pms-trigger" onClick={toggle}>
        {selectedProjects.length === 0 ? (
          <span className="pms-placeholder">{placeholder}</span>
        ) : (
          <span className="pms-chips">
            {selectedProjects.slice(0, 2).map((p) => (
              <span key={p.id} className="pms-chip">#{p.project_code}</span>
            ))}
            {selectedProjects.length > 2 && <span className="pms-chip pms-chip-more">+{selectedProjects.length - 2}</span>}
          </span>
        )}
        <span className="pms-caret">&#9662;</span>
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="pms-dropdown" ref={dropdownRef} style={{ top: pos.top, left: pos.left, width: pos.width }}>
            <div className="pms-toolbar">
              <input
                autoFocus
                type="text"
                placeholder="Cari no project atau judul..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <label className="pms-all">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                Semua
              </label>
            </div>
            <div className="pms-list">
              {visible.map((p) => (
                <label key={p.id} className={`pms-item ${selected.includes(p.id) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleProject(p.id)} />
                  <span className="pms-code">#{p.project_code}</span>
                  <span className="pms-title">{p.title}</span>
                </label>
              ))}
              {visible.length === 0 && <div className="pms-empty">Project tidak ditemukan</div>}
            </div>
            <div className="pms-footer">{selected.length} project dipilih</div>
          </div>,
          document.body
        )}
    </div>
  )
}
