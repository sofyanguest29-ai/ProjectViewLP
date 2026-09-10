'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'

// selected: array of requestor names for this project
// savedRequestors: [{ id, name }] - global reusable list from DB
export default function RequestorSelect({ selected, onChange, savedRequestors, onRequestorsChanged }) {
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

  async function addNewRequestor() {
    const name = query.trim()
    if (!name) return
    const { error } = await supabase.from('requestors').insert({ name })
    if (!error) {
      await onRequestorsChanged?.()
      toggleOption(name)
      setQuery('')
    }
  }

  async function deleteRequestor(name, e) {
    e.stopPropagation()
    if (!confirm(`Hapus "${name}" dari daftar requestor tersimpan?`)) return
    await supabase.from('requestors').delete().eq('name', name)
    onChange(selected.filter((s) => s !== name))
    await onRequestorsChanged?.()
  }

  const filtered = savedRequestors.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
  const exactMatch = savedRequestors.some((r) => r.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="multiselect" ref={wrapperRef}>
      <button type="button" className="multiselect-trigger" onClick={() => setOpen((v) => !v)}>
        {selected.length === 0 ? (
          <span className="multiselect-placeholder">Pilih atau tambah requestor...</span>
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
            placeholder="Cari atau ketik nama baru..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.map((r) => (
            <div key={r.id} className="multiselect-option requestor-option">
              <label>
                <input type="checkbox" checked={selected.includes(r.name)} onChange={() => toggleOption(r.name)} />
                {r.name}
              </label>
              <button
                type="button"
                className="requestor-delete-btn"
                onClick={(e) => deleteRequestor(r.name, e)}
                title="Hapus dari daftar tersimpan"
              >
                &#128465;
              </button>
            </div>
          ))}
          {filtered.length === 0 && !query && (
            <div className="tag-picker-empty">Belum ada requestor tersimpan.</div>
          )}
          {query.trim() && !exactMatch && (
            <button type="button" className="requestor-add-btn" onClick={addNewRequestor}>
              + Tambah &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
