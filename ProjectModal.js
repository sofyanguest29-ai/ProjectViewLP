'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { DIVISIONS, PROJECT_STATUS, randomProjectCode } from '@/lib/constants'
import MultiSelect from './MultiSelect'
import ImpactSelect from './ImpactSelect'
import RichTextEditor from './RichTextEditor'
import DevelopmentLogEditor from './DevelopmentLogEditor'
import RequestorSelect from './RequestorSelect'

const QUESTIONS = [
  { key: 'business_process', label: 'Seberapa besar dampaknya ke business process?', options: [[1, 'Tidak mengubah business process, hanya kenyamanan user'], [2, 'Mengubah business process, ada impact ke speed/cost/accuracy namun perubahan tidak signifikan'], [3, 'Mengubah business process, ada impact ke speed/cost/accuracy dengan perubahan signifikan']] },
  { key: 'scope', label: 'Berapa luas yang terdampak?', options: [[1, '1 user/1 team'], [2, 'multiple ops function'], [3, 'cross-function/directorate']] },
  { key: 'frequency', label: 'Seberapa sering terjadi?', options: [[1, 'One-off'], [2, 'Weekly'], [3, 'Daily/Continuous']] },
  { key: 'urgency', label: 'Seberapa urgent?', options: [[1, 'Nice to have'], [2, 'Important'], [3, 'Regulatory/Customer/Business Critical']] },
]

function impactMeasurement(scores) {
  const total = Object.values(scores).reduce((sum, value) => sum + Number(value || 0), 0)
  if (total >= 10) return { total, level: 'High' }
  if (total >= 7) return { total, level: 'Medium' }
  return { total, level: 'Low' }
}

export default function ProjectModal({ mode = 'add', project = null, existingLogs = [], allProjects = [], requestors = [], onRequestorAdd, onRequestorDelete, onClose, onSaved }) {
  const supabase = createClient()
  const [title, setTitle] = useState(project?.title ?? '')
  const [objective, setObjective] = useState(project?.objective ?? '')
  const [expectedResult, setExpectedResult] = useState(project?.expected_result ?? '')
  const [requestor, setRequestor] = useState(project?.requestor ?? '')
  const [divisions, setDivisions] = useState(project?.divisions ?? [])
  const [impacts, setImpacts] = useState(project?.impacts ?? {})
  const [requirements, setRequirements] = useState(project?.requirements ?? '')
  const [status, setStatus] = useState(project?.status ?? 'backlog')
  const [scores, setScores] = useState(project?.impact_measurement ?? { business_process: '', scope: '', frequency: '', urgency: '' })
  const [logs, setLogs] = useState(existingLogs.length ? existingLogs : [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const measurement = useMemo(() => impactMeasurement(scores), [scores])

  function setScore(key, value) { setScores((prev) => ({ ...prev, [key]: value })) }

  async function insertWithUniqueCode(payload, attemptsLeft = 8) {
    const code = randomProjectCode()
    const { data, error } = await supabase.from('projects').insert({ ...payload, project_code: code }).select().single()
    if (error) {
      if (error.code === '23505' && attemptsLeft > 0) return insertWithUniqueCode(payload, attemptsLeft - 1)
      throw error
    }
    return data
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    if (!title.trim()) return setError('Judul Project wajib diisi')
    if (!requestor.trim()) return setError('Nama Requestor wajib diisi')
    if (measurement.total < 4) return setError('Lengkapi 4 kuisioner impact measurement terlebih dahulu')
    setSaving(true)
    try {
      const payload = { title: title.trim(), objective, expected_result: expectedResult, requestor: requestor.trim(), divisions, impacts, requirements, status, impact_measurement: { ...scores, total: measurement.total, level: measurement.level } }
      let projectRow
      if (mode === 'edit' && project) {
        const { data, error } = await supabase.from('projects').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', project.id).select().single()
        if (error) throw error
        projectRow = data
        const { error: deleteError } = await supabase.from('development_logs').delete().eq('project_id', project.id)
        if (deleteError) throw deleteError
      } else projectRow = await insertWithUniqueCode(payload)

      const countByStatus = {}
      const logsToInsert = logs.filter((l) => l.log_date && l.title).sort((a, b) => String(a.log_date).localeCompare(String(b.log_date))).map((l) => {
        countByStatus[l.status] = (countByStatus[l.status] || 0) + 1
        return { project_id: projectRow.id, log_date: l.log_date, title: l.title.trim(), status: l.status, status_count: countByStatus[l.status], detail: l.detail ?? '' }
      })
      if (logsToInsert.length) {
        const { error: logError } = await supabase.from('development_logs').insert(logsToInsert)
        if (logError) throw logError
      }
      await onRequestorAdd?.(requestor.trim())
      onSaved?.(); onClose?.()
    } catch (err) { setError(err.message || 'Gagal menyimpan project') } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header"><h2>{mode === 'edit' ? 'Edit Project' : 'Add New Project'}</h2><button className="modal-close" onClick={onClose} type="button">&times;</button></div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-box">{error}</div>}
          <div className="field-block"><label>Judul Project</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="field-block"><label>Objective</label><textarea rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} /></div>
          <div className="field-block"><label>Expected Result</label><textarea rows={3} value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} /></div>
          <div className="field-block"><label>Nama Requestor</label><RequestorSelect value={requestor} onChange={setRequestor} requestors={requestors} onAdd={onRequestorAdd} onDelete={onRequestorDelete} /></div>
          <div className="field-block"><label>Divisi</label><MultiSelect options={DIVISIONS} selected={divisions} onChange={setDivisions} placeholder="Pilih divisi (bisa lebih dari 1)" searchable /></div>
          <div className="field-block"><label>Impact</label><ImpactSelect impacts={impacts} onChange={setImpacts} /></div>
          <div className="field-block"><label>Requirements</label><RichTextEditor value={requirements} onChange={setRequirements} allProjects={allProjects} placeholder="Tulis requirements di sini..." /></div>

          <div className="field-block">
            <label>Impact Measurement</label>
            <div className="question-grid">
              {QUESTIONS.map((q) => (
                <div className="question-card" key={q.key}>
                  <label>{q.label}</label>
                  <select value={scores[q.key] ?? ''} onChange={(e) => setScore(q.key, e.target.value)} required>
                    <option value="">Pilih nilai...</option>
                    {q.options.map(([value, text]) => <option key={value} value={value}>{value} — {text}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className={`impact-measurement ${measurement.level.toLowerCase()}`}>
              <span>Total Nilai: <strong>{measurement.total || 0}</strong></span>
              <span>Impact Measurement: <strong>{measurement.level}</strong></span>
            </div>
          </div>

          <div className="field-block"><label>Development Log</label><DevelopmentLogEditor logs={logs} onChange={setLogs} allProjects={allProjects} /></div>
          <div className="field-block"><label>Status Project</label><select value={status} onChange={(e) => setStatus(e.target.value)}>{PROJECT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div className="modal-footer"><button type="submit" className="submit-btn" disabled={saving}>{saving ? 'Menyimpan...' : 'Submit'}</button></div>
        </form>
      </div>
    </div>
  )
}
