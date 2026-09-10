'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { DEV_LOG_STATUS } from '@/lib/constants'
import RichTextEditor from './RichTextEditor'

export default function QuickAddLogModal({ projectId, allProjects = [], onClose, onSaved }) {
  const supabase = createClient()
  const [logDate, setLogDate] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState(DEV_LOG_STATUS[0])
  const [detail, setDetail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!logDate || !title.trim()) {
      setError('Tanggal dan Judul wajib diisi')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('development_logs').insert({
      project_id: projectId,
      log_date: logDate,
      title,
      status,
      detail,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved?.()
    onClose?.()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-medium">
        <div className="modal-header">
          <h2>Tambah Development Log</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-box">{error}</div>}
          <div className="field-block">
            <label>Tanggal</label>
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
          </div>
          <div className="field-block">
            <label>Judul</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="misal: MoM Product x Ops" />
          </div>
          <div className="field-block">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {DEV_LOG_STATUS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <label>Detail</label>
            <RichTextEditor value={detail} onChange={setDetail} allProjects={allProjects} placeholder="Detail development log..." />
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
