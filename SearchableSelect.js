'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function SearchableSelect({ value, onChange, options = [], placeholder = 'Pilih...', allowClear = true, className = '', renderOption, noResultsText = 'Tidak ada pilihan' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => {
      const label = typeof option === 'string' ? option : option.label
      const val = typeof option === 'string' ? option : option.value
      return `${label} ${val}`.toLowerCase().includes(q)
    })
  }, [options, query])

  const selectedOption = options.find((o) => (typeof o === 'string' ? o : o.value) === value)
  const selectedLabel = selectedOption ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label) : ''

  return (
    <div className={`searchable-select ${className}`} ref={ref}>
      <button type="button" className="searchable-select-trigger" onClick={() => { setOpen((v) => !v); setQuery('') }}>
        <span className={selectedLabel ? '' : 'searchable-select-placeholder'}>{selectedLabel || placeholder}</span>
        <span className="searchable-select-caret">⌄</span>
      </button>
      {open && (
        <div className="searchable-select-menu">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik untuk mencari..."
            className="searchable-select-search"
          />
          <div className="searchable-select-options">
            {allowClear && !query && (
              <button type="button" className={`searchable-select-option ${!value ? 'selected' : ''}`} onClick={() => { onChange(''); setOpen(false) }}>
                Semua / kosong
              </button>
            )}
            {filtered.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value
              const optionLabel = typeof option === 'string' ? option : option.label
              return (
                <button type="button" key={optionValue} className={`searchable-select-option ${value === optionValue ? 'selected' : ''}`} onClick={() => { onChange(optionValue); setOpen(false) }}>
                  {renderOption ? renderOption(option) : optionLabel}
                </button>
              )
            })}
            {filtered.length === 0 && <div className="searchable-select-empty">{noResultsText}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
