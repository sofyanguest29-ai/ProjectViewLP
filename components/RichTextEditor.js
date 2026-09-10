'use client'
import { useRef, useState, useEffect } from 'react'

// Editor teks sederhana dengan toolbar dasar (bold, italic, underline, align, list)
// plus fitur tag project (insert tag "#kode - judul" dari project yang sudah ada).
export default function RichTextEditor({ value, onChange, placeholder, allProjects = [] }) {
  const ref = useRef(null)
  const savedRange = useRef(null)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const initialized = useRef(false)

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value || ''
      initialized.current = true
    }
  }, [value])

  function handleInput() {
    onChange(ref.current?.innerHTML || '')
  }

  // Simpan posisi cursor terakhir di dalam editor, dipanggil tiap kali user
  // klik/ketik di dalam contentEditable, supaya bisa dikembalikan lagi
  // setelah fokus sempat pindah ke elemen lain (misal search box tag picker).
  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && ref.current && ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }

  function restoreSelection() {
    const sel = window.getSelection()
    ref.current?.focus()
    if (savedRange.current) {
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    } else {
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  // preventDefault di mousedown supaya klik tombol toolbar TIDAK memindahkan
  // fokus/selection keluar dari editor (trik standar rich-text toolbar).
  function handleToolbarMouseDown(e) {
    e.preventDefault()
  }

  function exec(command, arg) {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    handleInput()
  }

  function openTagPicker() {
    saveSelection()
    setShowTagPicker(true)
  }

  function insertTag(project) {
    restoreSelection()
    const tagHtml = `<span class="project-tag" contenteditable="false">#${project.project_code} - ${project.title}</span>&nbsp;`
    document.execCommand('insertHTML', false, tagHtml)
    setShowTagPicker(false)
    setTagQuery('')
    handleInput()
  }

  const filteredProjects = allProjects.filter((p) =>
    `${p.project_code} ${p.title}`.toLowerCase().includes(tagQuery.toLowerCase())
  )

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar" onMouseDown={handleToolbarMouseDown}>
        <button type="button" onClick={() => exec('bold')} title="Bold"><b>B</b></button>
        <button type="button" onClick={() => exec('italic')} title="Italic"><i>I</i></button>
        <button type="button" onClick={() => exec('underline')} title="Underline"><u>U</u></button>
        <span className="rte-sep" />
        <select onChange={(e) => exec('fontSize', e.target.value)} defaultValue="" title="Ukuran font">
          <option value="" disabled>Ukuran</option>
          <option value="2">Kecil</option>
          <option value="3">Normal</option>
          <option value="5">Besar</option>
          <option value="7">Sangat Besar</option>
        </select>
        <span className="rte-sep" />
        <button type="button" onClick={() => exec('justifyLeft')} title="Align kiri">&#8676;</button>
        <button type="button" onClick={() => exec('justifyCenter')} title="Align tengah">&#8596;</button>
        <button type="button" onClick={() => exec('justifyRight')} title="Align kanan">&#8677;</button>
        <span className="rte-sep" />
        <button type="button" onClick={() => exec('insertUnorderedList')} title="Bullet list">&bull; List</button>
        <button type="button" onClick={() => exec('insertOrderedList')} title="Numbered list">1. List</button>
        <span className="rte-sep" />
        <button type="button" onClick={openTagPicker} title="Tag project" className="rte-tag-btn">
          @ Tag Project
        </button>
      </div>

      {showTagPicker && (
        <div className="tag-picker">
          <input
            autoFocus
            placeholder="Cari ID atau nama project..."
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
          />
          <div className="tag-picker-list">
            {filteredProjects.length === 0 && <div className="tag-picker-empty">Tidak ada project cocok</div>}
            {filteredProjects.slice(0, 8).map((p) => (
              <button type="button" key={p.id} onClick={() => insertTag(p)} className="tag-picker-item">
                <span className="tag-picker-code">#{p.project_code}</span> {p.title}
              </button>
            ))}
          </div>
          <button type="button" className="tag-picker-close" onClick={() => setShowTagPicker(false)}>Tutup</button>
        </div>
      )}

      <div
        ref={ref}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={() => { saveSelection(); handleInput() }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        data-placeholder={placeholder}
      />
    </div>
  )
}
