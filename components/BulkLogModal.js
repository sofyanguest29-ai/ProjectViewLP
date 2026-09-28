'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import DevelopmentLogEditor from './DevelopmentLogEditor'
import ProjectMultiSelect from './ProjectMultiSelect'

// Modal 3/4 layar: tambah Development Log dan Estimated Date ke banyak project sekaligus.
// Setiap baris punya checklist project sendiri, jadi tiap log / tanggal bisa dikirim
// ke kumpulan project yang berbeda-beda.
export default function BulkLogModal({ projects = [], onClose, onSaved }) {
  const supabase = createClient()
  const [logs, setLogs] = useState([])
  const [estimatedRows, setEstimatedRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addEstimated() {
    setEstimatedRows((prev) => [...prev, { id: `est-${Date.now()}-${prev.length}`, date: '', project_ids: [] }])
  }
  function updateEstimated(index, field, value) {
    setEstimatedRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }
  function removeEstimated(index) {
    setEstimatedRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Baris yang setengah terisi dianggap salah, baris yang kosong total diabaikan
    const usedLogs = logs.filter((l) => l.log_date || l.title?.trim() || (l.project_ids ?? []).length > 0)
    const usedEstimated = estimatedRows.filter((r) => r.date || (r.project_ids ?? []).length > 0)

    if (usedLogs.length === 0 && usedEstimated.length === 0) {
      setError('Isi minimal 1 Development Log atau 1 Estimated Date')
      return
    }
    for (let i = 0; i < usedLogs.length; i++) {
      const l = usedLogs[i]
      if (!l.log_date || !l.title?.trim() || (l.project_ids ?? []).length === 0) {
        setError(`Development Log baris ${i + 1}: tanggal, judul, dan minimal 1 project wajib diisi`)
        return
      }
    }
    for (let i = 0; i < usedEstimated.length; i++) {
      const r = usedEstimated[i]
      if (!r.date || (r.project_ids ?? []).length === 0) {
        setError(`Estimated Date baris ${i + 1}: tanggal dan minimal 1 project wajib diisi`)
        return
      }
    }

    setSaving(true)
    try {
      if (usedLogs.length > 0) {
        const rows = usedLogs.flatMap((l) =>
          l.project_ids.map((projectId) => ({
            project_id: projectId,
            log_date: l.log_date,
            title: l.title,
            status: l.status,
            detail: l.detail ?? '',
          }))
        )
        const { error: logError } = await supabase.from('development_logs').insert(rows)
        if (logError) throw logError
      }

      if (usedEstimated.length > 0) {
        // 1 project hanya punya 1 estimated_finish_date. Kalau sebuah project muncul di
        // beberapa baris, baris paling bawah yang dipakai.
        const dateByProject = {}
        for (const r of usedEstimated) for (const pid of r.project_ids) dateByProject[pid] = r.date
        const idsByDate = {}
        for (const [pid, date] of Object.entries(dateByProject)) {
          if (!idsByDate[date]) idsByDate[date] = []
          idsByDate[date].push(pid)
        }
        for (const [date, ids] of Object.entries(idsByDate)) {
          const { error: dateError } = await supabase
            .from('projects')
            .update({ estimated_finish_date: date, updated_at: new Date().toISOString() })
            .in('id', ids)
          if (dateError) throw dateError
        }
      }

      onSaved?.()
      onClose?.()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-bulk">
        <div className="modal-header">
          <h2>Add Log Development</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-box">{error}</div>}

          <div className="field-block">
            <label>Log Development</label>
            <DevelopmentLogEditor logs={logs} onChange={setLogs} allProjects={projects} showProjectSelect />
          </div>

          <div className="field-block">
            <label>Estimated Date</label>
            <div className="devlog-editor">
              {estimatedRows.map((row, index) => (
                <div key={row.id} className="devlog-block">
                  <div className="bulk-estimated-row">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateEstimated(index, 'date', e.target.value)}
                    />
                    <ProjectMultiSelect
                      projects={projects}
                      selected={row.project_ids}
                      onChange={(ids) => updateEstimated(index, 'project_ids', ids)}
                    />
                    <button
                      type="button"
                      className="devlog-remove"
                      onClick={() => removeEstimated(index)}
                      title="Hapus baris ini"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="devlog-add" onClick={addEstimated}>
                + Estimated Finish Date
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
