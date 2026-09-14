'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

// selected: array of division names for this project
// savedDivisions: [{ id, name }] - global reusable list from DB
export default function DivisionSelect({ selected, onChange, savedDivisions, onDivisionsChanged }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)
  const supabase = createClient()

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

  function toggleOption(name) {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name))
    } else {
      onChange([...selected, name])
    }
  }

  async function addNewDivision() {
    const name = query.trim()
    if (!name) return
    const { error } = await supabase.from('divisions').insert({ name })
    if (!error) {
      await onDivisionsChanged?.()
      toggleOption(name)
      setQuery('')
    }
  }

  const filtered = savedDivisions.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
  const exactMatch = savedDivisions.some((d) => d.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="multiselect" ref={wrapperRef}>
      <button type="button" className="multiselect-trigger" onClick={() => setOpen((v) => !v)}>
        {selected.length === 0 ? (
          <span className="multiselect-placeholder">Pilih atau tambah divisi...</span>
        ) : (
          <span className="multiselect-tags">
            {selected.map((s) => (
              <span key={s} className="multiselect-tag">{s}</span>
            ))}
          </span>
        )}
        <span className="multiselect-caret">&#9662;</span>
      </button>
      {open && (
        <div className="multiselect-dropdown">
          <input
            autoFocus
            className="requestor-search-input"
            placeholder="Cari atau ketik divisi baru..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.map((d) => (
            <label key={d.id} className="multiselect-option">
              <input type="checkbox" checked={selected.includes(d.name)} onChange={() => toggleOption(d.name)} />
              {d.name}
            </label>
          ))}
          {filtered.length === 0 && !query && (
            <div className="tag-picker-empty">Belum ada divisi tersimpan.</div>
          )}
          {query.trim() && !exactMatch && (
            <button type="button" className="requestor-add-btn" onClick={addNewDivision}>
              + Tambah &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
