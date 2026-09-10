'use client'
import { useRef, useState, useEffect } from 'react'

export default function RichTextEditor({ value, onChange, placeholder, allProjects = [] }) {
  const ref = useRef(null)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const savedRange = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value || ''
      initialized.current = true
    }
  }, [value])

  function exec(command, arg) {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    handleInput()
  }

  function handleInput() { onChange(ref.current?.innerHTML || '') }

  function saveSelection() {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount || !ref.current) return
    const range = selection.getRangeAt(0)
    if (ref.current.contains(range.commonAncestorContainer)) savedRange.current = range.cloneRange()
  }

  function restoreSelection() {
    if (!savedRange.current) return
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(savedRange.current)
  }

  function insertTag(project) {
    ref.current?.focus()
    restoreSelection()
    const tagHtml = `<span class="project-tag" contenteditable="false">#${project.project_code} - ${escapeHtml(project.title)}</span>&nbsp;`
    document.execCommand('insertHTML', false, tagHtml)
    setShowTagPicker(false)
    setTagQuery('')
    handleInput()
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]))
  }

  const filteredProjects = allProjects.filter((p) => `${p.project_code} ${p.title}`.toLowerCase().includes(tagQuery.toLowerCase()))

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} title="Bold"><b>B</b></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} title="Italic"><i>I</i></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} title="Underline"><u>U</u></button>
        <span className="rte-sep" />
        <select onChange={(e) => exec('fontSize', e.target.value)} defaultValue="" title="Ukuran font">
          <option value="" disabled>Ukuran</option><option value="2">Kecil</option><option value="3">Normal</option><option value="5">Besar</option><option value="7">Sangat Besar</option>
        </select>
        <span className="rte-sep" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')} title="Align kiri">≡</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')} title="Align tengah">≡</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')} title="Align kanan">≡</button>
        <span className="rte-sep" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="Bullet list">• List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')} title="Numbered list">1. List</button>
        <span className="rte-sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); saveSelection() }} onClick={() => setShowTagPicker((v) => !v)} title="Tag project" className="rte-tag-btn">@ Tag Project</button>
      </div>
      {showTagPicker && (
        <div className="tag-picker">
          <input autoFocus placeholder="Cari ID atau nama project..." value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} />
          <div className="tag-picker-list">
            {filteredProjects.length === 0 && <div className="tag-picker-empty">Tidak ada project cocok</div>}
            {filteredProjects.slice(0, 12).map((p) => (
              <button type="button" key={p.id} onMouseDown={(e) => e.preventDefault()} onClick={() => insertTag(p)} className="tag-picker-item">
                <span className="tag-picker-code">#{p.project_code}</span> {p.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <div ref={ref} className="rte-content" contentEditable suppressContentEditableWarning onInput={() => { handleInput(); saveSelection() }} onKeyUp={saveSelection} onMouseUp={saveSelection} onBlur={handleInput} data-placeholder={placeholder} />
    </div>
  )
}
