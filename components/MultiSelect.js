'use client'
import { useState, useRef, useEffect } from 'react'

export default function MultiSelect({ options, selected, onChange, placeholder = 'Pilih...' }) {
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

  function toggleOption(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="multiselect" ref={wrapperRef}>
      <button type="button" className="multiselect-trigger" onClick={() => setOpen((v) => !v)}>
        {selected.length === 0 ? (
          <span className="multiselect-placeholder">{placeholder}</span>
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
          {options.map((option) => (
            <label key={option} className="multiselect-option">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
