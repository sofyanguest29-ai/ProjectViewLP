'use client'
import { useState } from 'react'
import { DEV_LOG_STATUS } from '@/lib/constants'
import RichTextEditor from './RichTextEditor'

// logs: array of { id (temp or real), log_date, title, status, detail }
export default function DevelopmentLogEditor({ logs, onChange, allProjects = [] }) {
  const [expanded, setExpanded] = useState({})

  function updateLog(index, field, value) {
    const next = [...logs]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  function addLog() {
    onChange([
      ...logs,
      { id: `tmp-${Date.now()}`, log_date: '', title: '', status: DEV_LOG_STATUS[0], detail: '' },
    ])
  }

  function removeLog(index) {
    onChange(logs.filter((_, i) => i !== index))
  }

  function toggleExpand(index) {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="devlog-editor">
      {logs.map((log, index) => (
        <div key={log.id ?? index} className="devlog-block">
          <div className="devlog-row">
            <input
              type="date"
              value={log.log_date ?? ''}
              onChange={(e) => updateLog(index, 'log_date', e.target.value)}
            />
            <input
              type="text"
              placeholder="Judul (misal: MoM Product x Ops)"
              value={log.title ?? ''}
              onChange={(e) => updateLog(index, 'title', e.target.value)}
            />
            <select value={log.status ?? DEV_LOG_STATUS[0]} onChange={(e) => updateLog(index, 'status', e.target.value)}>
              {DEV_LOG_STATUS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              className={`devlog-toggle ${expanded[index] ? 'devlog-toggle-active' : ''}`}
              onClick={() => toggleExpand(index)}
              title="Tampilkan/sembunyikan detail"
            >
              &#10003;
            </button>
            <button type="button" className="devlog-remove" onClick={() => removeLog(index)} title="Hapus log ini">
              &times;
            </button>
          </div>
          {expanded[index] && (
            <div className="devlog-detail-field">
              <RichTextEditor
                value={log.detail ?? ''}
                onChange={(html) => updateLog(index, 'detail', html)}
                allProjects={allProjects}
                placeholder="Detail development log..."
              />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="devlog-add" onClick={addLog}>
        + Tambah Development Log
      </button>
    </div>
  )
}
