'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { DIVISIONS, PROJECT_STATUS, randomProjectCode } from '@/lib/constants'
import MultiSelect from './MultiSelect'
import ImpactSelect from './ImpactSelect'
import RichTextEditor from './RichTextEditor'
import DevelopmentLogEditor from './DevelopmentLogEditor'

export default function ProjectModal({ mode = 'add', project = null, existingLogs = [], allProjects = [], onClose, onSaved }) {
  const supabase = createClient()
  const [title, setTitle] = useState(project?.title ?? '')
  const [objective, setObjective] = useState(project?.objective ?? '')
  const [expectedResult, setExpectedResult] = useState(project?.expected_result ?? '')
  const [requestor, setRequestor] = useState(project?.requestor ?? '')
  const [divisions, setDivisions] = useState(project?.divisions ?? [])
  const [impacts, setImpacts] = useState(project?.impacts ?? {})
  const [requirements, setRequirements] = useState(project?.requirements ?? '')
  const [status, setStatus] = useState(project?.status ?? 'backlog')
  const [logs, setLogs] = useState(
    existingLogs.length > 0
      ? existingLogs
      : []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function insertWithUniqueCode(payload, attemptsLeft = 5) {
    const code = randomProjectCode()
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...payload, project_code: code })
      .select()
      .single()
    if (error) {
      if (error.code === '23505' && attemptsLeft > 0) {
        return insertWithUniqueCode(payload, attemptsLeft - 1)
      }
      throw error
    }
    return data
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Judul Project wajib diisi')
      return
    }
    if (!requestor.trim()) {
      setError('Nama Requestor wajib diisi')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title,
        objective,
        expected_result: expectedResult,
        requestor,
        divisions,
        impacts,
        requirements,
        status,
      }

      let projectRow
      if (mode === 'edit' && project) {
        const { data, error } = await supabase
          .from('projects')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', project.id)
          .select()
          .single()
        if (error) throw error
        projectRow = data

        // Simplest sync strategy: replace all logs for this project
        await supabase.from('development_logs').delete().eq('project_id', project.id)
      } else {
        projectRow = await insertWithUniqueCode(payload)
      }

      const logsToInsert = logs
        .filter((l) => l.log_date && l.title)
        .map((l) => ({
          project_id: projectRow.id,
          log_date: l.log_date,
          title: l.title,
          status: l.status,
          detail: l.detail ?? '',
        }))

      if (logsToInsert.length > 0) {
        const { error: logError } = await supabase.from('development_logs').insert(logsToInsert)
        if (logError) throw logError
      }

      onSaved?.()
      onClose?.()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Project' : 'Add New Project'}</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-box">{error}</div>}

          <div className="field-block">
            <label>Judul Project</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="field-block">
            <label>Objective</label>
            <textarea rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} />
          </div>

          <div className="field-block">
            <label>Expected Result</label>
            <textarea rows={3} value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} />
          </div>

          <div className="field-block">
            <label>Nama Requestor</label>
            <input value={requestor} onChange={(e) => setRequestor(e.target.value)} required />
          </div>

          <div className="field-block">
            <label>Divisi</label>
            <MultiSelect options={DIVISIONS} selected={divisions} onChange={setDivisions} placeholder="Pilih divisi (bisa lebih dari 1)" />
          </div>

          <div className="field-block">
            <label>Impact</label>
            <ImpactSelect impacts={impacts} onChange={setImpacts} />
          </div>

          <div className="field-block">
            <label>Requirements</label>
            <RichTextEditor value={requirements} onChange={setRequirements} allProjects={allProjects} placeholder="Tulis requirements di sini..." />
          </div>

          <div className="field-block">
            <label>Development Log</label>
            <DevelopmentLogEditor logs={logs} onChange={setLogs} />
          </div>

          <div className="field-block">
            <label>Status Project</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PROJECT_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
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
