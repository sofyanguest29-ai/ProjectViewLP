'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function RequestorSelect({ value, onChange, requestors, onAdd, onDelete }) {
  const selected = useMemo(() => String(value || '').split(',').map((x) => x.trim()).filter(Boolean), [value])
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const ref = useRef(null)
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  const filtered = requestors.filter((r) => r.toLowerCase().includes(query.trim().toLowerCase()))
  const exact = requestors.some((r) => r.toLowerCase() === query.trim().toLowerCase())
  function toggle(name) { const next = selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]; onChange(next.join(', ')) }
  async function addNew() { const name = query.trim(); if (!name) return; const ok = await onAdd?.(name); if (ok !== false) { if (!selected.includes(name)) onChange([...selected, name].join(', ')); setQuery('') } }
  function removeChip(name) { onChange(selected.filter((n) => n !== name).join(', ')) }

  return <div className="requestor-select" ref={ref}>
    <div className="requestor-input-wrap" onClick={() => setOpen(true)}>
      <div className="requestor-chips-input">
        {selected.map((name) => <span className="requestor-chip" key={name}>{name}<button type="button" onClick={(e) => { e.stopPropagation(); removeChip(name) }} aria-label={`Hapus ${name}`}>×</button></span>)}
        <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder={selected.length ? 'Tambah requestor...' : 'Ketik atau pilih nama requestor...'} required={selected.length === 0} />
      </div>
      <button type="button" className="requestor-caret" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}>⌄</button>
    </div>
    {open && <div className="requestor-dropdown">
      <div className="requestor-dropdown-head"><span>Requestor tersimpan</span><button type="button" onClick={addNew} disabled={!query.trim() || exact}>＋ Tambah nama</button></div>
      <div className="requestor-options">
        {filtered.map((name) => <div key={name} className="requestor-option"><button type="button" className={`requestor-option-name ${selected.includes(name) ? 'selected' : ''}`} onClick={() => toggle(name)}><span className="requestor-check">{selected.includes(name) ? '✓' : ''}</span>{name}</button><button type="button" className="requestor-delete" onClick={() => onDelete?.(name)} title={`Hapus ${name}`}>🗑</button></div>)}
        {filtered.length === 0 && <div className="requestor-empty">Belum ada nama yang cocok.</div>}
      </div>
    </div>}
  </div>
}
