'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { DEV_LOG_STATUS } from '@/lib/constants'
import { format, parseISO } from 'date-fns'
import RichTextEditor from './RichTextEditor'

export default function LogDetailModal({ log, isGuest, allProjects = [], onClose, onSaved }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(log.title)
  const [status, setStatus] = useState(log.status)
  const [detail, setDetail] = useState(log.detail ?? '')
  const [logDate, setLogDate] = useState(log.log_date)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const statusLabel = useMemo(() => log.status_count ? `${log.status} ${log.status_count}` : log.status, [log.status, log.status_count])

  async function handleSave() {
    setSaving(true); setError('')
    const { error } = await supabase.from('development_logs').update({ title, status, detail, log_date: logDate }).eq('id', log.id)
    if (error) { setError(error.message); setSaving(false); return }
    const { data: allLogs, error: fetchError } = await supabase.from('development_logs').select('id,status,log_date,created_at').eq('project_id', log.project_id).order('log_date', { ascending: true }).order('created_at', { ascending: true })
    if (fetchError) { setError(fetchError.message); setSaving(false); return }
    const counters = {}
    for (const item of allLogs ?? []) { counters[item.status] = (counters[item.status] || 0) + 1; await supabase.from('development_logs').update({ status_count: counters[item.status] }).eq('id', item.id) }
    setSaving(false); setEditing(false); onSaved?.()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-medium">
        <div className="modal-header"><h2>Detail Development Log</h2><button className="modal-close" onClick={onClose} type="button">&times;</button></div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}
          <div className="field-block"><label>Tanggal</label>{editing ? <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} /> : <p>{format(parseISO(log.log_date), 'd MMMM yyyy')}</p>}</div>
          <div className="field-block"><label>Judul</label>{editing ? <input value={title} onChange={(e) => setTitle(e.target.value)} /> : <p>{log.title}</p>}</div>
          <div className="field-block"><label>Status</label>{editing ? <select value={status} onChange={(e) => setStatus(e.target.value)}>{DEV_LOG_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select> : <p>{statusLabel}</p>}</div>
          <div className="field-block"><label>Detail</label>{editing ? <RichTextEditor value={detail} onChange={setDetail} allProjects={allProjects} placeholder="Tulis detail development log..." /> : <div className="rte-readonly" dangerouslySetInnerHTML={{ __html: detail || '<span class="empty-state">Belum ada detail.</span>' }} />}</div>
          <div className="modal-footer modal-footer-split">
            {isGuest ? <span className="guest-badge">View Only</span> : editing ? <button type="button" className="submit-btn" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Save'}</button> : <button type="button" className="submit-btn" onClick={() => setEditing(true)}>Edit</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
