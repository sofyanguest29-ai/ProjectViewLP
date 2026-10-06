'use client'
import { useMemo, useState } from 'react'
import { PROJECT_TYPES, PROJECT_STATUS } from '@/lib/constants'
import { priorityLabel, PRIORITY_NOT_SCORED } from '@/lib/exportExcel'

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low', PRIORITY_NOT_SCORED]

// Grup checklist: judul + tombol "Pilih semua" + daftar checkbox
function CheckGroup({ title, options, selected, onChange, searchable = false }) {
  const [query, setQuery] = useState('')
  const visible = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options
  const allSelected = options.length > 0 && selected.length === options.length

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <div className="export-group">
      <div className="export-group-header">
        <h3>
          {title} <span className="export-count">({selected.length}/{options.length})</span>
        </h3>
        <label className="export-select-all">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onChange(allSelected ? [] : options.map((o) => o.value))}
          />
          Pilih semua
        </label>
      </div>
      {searchable && (
        <input
          type="text"
          className="export-search"
          placeholder="Cari project..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <div className={`export-options ${searchable ? 'export-options-scroll' : ''}`}>
        {visible.length === 0 ? (
          <p className="export-empty">Tidak ada data</p>
        ) : (
          visible.map((o) => (
            <label key={o.value} className="export-option">
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
              <span>{o.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

// Modal 3/4 layar: filter data sebelum download Excel
export default function ExportExcelModal({ projects = [], onClose, onExport }) {
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: `${p.project_code} - ${p.title}` })),
    [projects]
  )
  const typeOptions = useMemo(() => {
    const extra = [...new Set(projects.map((p) => p.project_type).filter(Boolean))].filter(
      (t) => !PROJECT_TYPES.includes(t)
    )
    return [...PROJECT_TYPES, ...extra].map((t) => ({ value: t, label: t }))
  }, [projects])
  const priorityOptions = PRIORITY_OPTIONS.map((p) => ({ value: p, label: p }))
  const statusOptions = PROJECT_STATUS.map((s) => ({ value: s.value, label: s.label }))

  // Default: semua dipilih
  const [selProjects, setSelProjects] = useState(projectOptions.map((o) => o.value))
  const [selTypes, setSelTypes] = useState(typeOptions.map((o) => o.value))
  const [selPriorities, setSelPriorities] = useState(PRIORITY_OPTIONS)
  const [selStatuses, setSelStatuses] = useState(statusOptions.map((o) => o.value))
  const [includeLogs, setIncludeLogs] = useState(true)
  const [includeProjectId, setIncludeProjectId] = useState(true)

  const matched = useMemo(
    () =>
      projects.filter(
        (p) =>
          selProjects.includes(p.id) &&
          (p.project_type ? selTypes.includes(p.project_type) : selTypes.length === typeOptions.length) &&
          selPriorities.includes(priorityLabel(p)) &&
          selStatuses.includes(p.status)
      ),
    [projects, selProjects, selTypes, selPriorities, selStatuses, typeOptions.length]
  )

  function handleSubmit(e) {
    e.preventDefault()
    if (matched.length === 0) return
    onExport(matched, { includeLogs, includeProjectId })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-export">
        <div className="modal-header">
          <h2>Export Excel</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body export-body">
          <div className="export-grid">
            <CheckGroup title="Project" options={projectOptions} selected={selProjects} onChange={setSelProjects} searchable />
            <div className="export-col">
              <CheckGroup title="Project Type" options={typeOptions} selected={selTypes} onChange={setSelTypes} />
              <CheckGroup title="Priority Scoring" options={priorityOptions} selected={selPriorities} onChange={setSelPriorities} />
              <CheckGroup title="Status Project" options={statusOptions} selected={selStatuses} onChange={setSelStatuses} />
            </div>
          </div>

          <div className="export-toggles">
            <label className="export-option">
              <input type="checkbox" checked={includeLogs} onChange={(e) => setIncludeLogs(e.target.checked)} />
              <span>Sertakan Log Development di hasil tarikan data</span>
            </label>
            <label className="export-option">
              <input type="checkbox" checked={includeProjectId} onChange={(e) => setIncludeProjectId(e.target.checked)} />
              <span>Sertakan ID Project di hasil tarikan data</span>
            </label>
          </div>

          <div className="modal-footer export-footer">
            <span className="export-summary">{matched.length} project akan di-export</span>
            <div className="export-actions">
              <button type="button" className="detail-project-btn" onClick={onClose}>Batal</button>
              <button type="submit" className="export-excel-btn" disabled={matched.length === 0}>
                Download Excel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
