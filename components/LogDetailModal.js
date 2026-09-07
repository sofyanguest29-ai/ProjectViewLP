'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { DEV_LOG_STATUS } from '@/lib/constants'
import { format, parseISO } from 'date-fns'

export default function LogDetailModal({ log, isGuest, onClose, onSaved }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(log.title)
  const [status, setStatus] = useState(log.status)
  const [detail, setDetail] = useState(log.detail ?? '')
  const [logDate, setLogDate] = useState(log.log_date)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('development_logs')
      .update({ title, status, detail, log_date: logDate })
      .eq('id', log.id)
    setSaving(false)
    setEditing(false)
    onSaved?.()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-medium">
        <div className="modal-header">
          <h2>Detail Development Log</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="field-block">
            <label>Tanggal</label>
            {editing ? (
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            ) : (
              <p>{format(parseISO(log.log_date), 'd MMMM yyyy')}</p>
            )}
          </div>
          <div className="field-block">
            <label>Judul</label>
            {editing ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            ) : (
              <p>{log.title}</p>
            )}
          </div>
          <div className="field-block">
            <label>Status</label>
            {editing ? (
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {DEV_LOG_STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p>{log.status}</p>
            )}
          </div>
          <div className="field-block">
            <label>Detail</label>
            {editing ? (
              <textarea rows={5} value={detail} onChange={(e) => setDetail(e.target.value)} />
            ) : (
              <p>{log.detail || <span className="empty-state">Belum ada detail.</span>}</p>
            )}
          </div>

          <div className="modal-footer modal-footer-split">
            {isGuest ? (
              <span className="guest-badge">View Only</span>
            ) : editing ? (
              <button type="button" className="submit-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Save'}
              </button>
            ) : (
              <button type="button" className="submit-btn" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
