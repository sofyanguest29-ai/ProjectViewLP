'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { PROJECT_STATUS, PROJECT_TYPES, QUESTIONNAIRE, randomProjectCode, impactBand } from '@/lib/constants'
import DivisionSelect from './DivisionSelect'
import RequestorSelect from './RequestorSelect'
import ImpactSelect from './ImpactSelect'
import RichTextEditor from './RichTextEditor'
import DevelopmentLogEditor from './DevelopmentLogEditor'

export default function ProjectModal({
  mode = 'add',
  project = null,
  existingLogs = [],
  allProjects = [],
  savedRequestors = [],
  onRequestorsChanged,
  savedDivisions = [],
  onDivisionsChanged,
  onClose,
  onSaved,
}) {
  const supabase = createClient()
  const seed = project

  const [title, setTitle] = useState(seed?.title ?? '')
  const [projectType, setProjectType] = useState(seed?.project_type ?? '')
  const [objective, setObjective] = useState(seed?.objective ?? '')
  const [expectedResult, setExpectedResult] = useState(seed?.expected_result ?? '')
  const [requestors, setRequestors] = useState(seed?.requestors ?? [])
  const [divisions, setDivisions] = useState(seed?.divisions ?? [])
  const [impacts, setImpacts] = useState(seed?.impacts ?? {})
  const [requirements, setRequirements] = useState(seed?.requirements ?? '')
  const [status, setStatus] = useState(seed?.status ?? 'backlog')
  const [scores, setScores] = useState({
    q1_score: seed?.q1_score ?? null,
    q2_score: seed?.q2_score ?? null,
    q3_score: seed?.q3_score ?? null,
    q4_score: seed?.q4_score ?? null,
  })
  const [logs, setLogs] = useState(existingLogs.length > 0 ? existingLogs : [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalScore = useMemo(() => {
    const values = Object.values(scores)
    if (values.some((v) => v === null || v === undefined)) return null
    return values.reduce((sum, v) => sum + Number(v), 0)
  }, [scores])

  const band = totalScore !== null ? impactBand(totalScore) : null

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
    if (requestors.length === 0) {
      setError('Nama Requestor wajib diisi minimal 1')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title,
        project_type: projectType || null,
        objective,
        expected_result: expectedResult,
        requestors,
        divisions,
        impacts,
        requirements,
        status,
        q1_score: scores.q1_score,
        q2_score: scores.q2_score,
        q3_score: scores.q3_score,
        q4_score: scores.q4_score,
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
            <label>Project Type</label>
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              <option value="">Pilih project type...</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field-block">
            <label>Objective</label>
            <RichTextEditor value={objective} onChange={setObjective} allProjects={allProjects} placeholder="Tulis objective di sini..." />
          </div>

          <div className="field-block">
            <label>Expected Result</label>
            <RichTextEditor value={expectedResult} onChange={setExpectedResult} allProjects={allProjects} placeholder="Tulis expected result di sini..." />
          </div>

          <div className="field-block">
            <label>Nama Requestor</label>
            <RequestorSelect
              selected={requestors}
              onChange={setRequestors}
              savedRequestors={savedRequestors}
              onRequestorsChanged={onRequestorsChanged}
            />
          </div>

          <div className="field-block">
            <label>Divisi</label>
            <DivisionSelect
              selected={divisions}
              onChange={setDivisions}
              savedDivisions={savedDivisions}
              onDivisionsChanged={onDivisionsChanged}
            />
          </div>

          <div className="field-block">
            <label>Impact Measurement</label>
            <ImpactSelect impacts={impacts} onChange={setImpacts} allProjects={allProjects} />
          </div>

          <div className="field-block">
            <label>Requirements</label>
            <RichTextEditor value={requirements} onChange={setRequirements} allProjects={allProjects} placeholder="Tulis requirements di sini..." />
          </div>

          <div className="field-block">
            <label>Development Log</label>
            <DevelopmentLogEditor logs={logs} onChange={setLogs} allProjects={allProjects} />
          </div>

          <div className="field-block">
            <label>Status Project</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PROJECT_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="questionnaire-block">
            <h3>Priority Scoring</h3>
            {QUESTIONNAIRE.map((q) => (
              <div className="field-block" key={q.key}>
                <label>{q.question}</label>
                <select
                  value={scores[q.key] ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [q.key]: e.target.value ? Number(e.target.value) : null }))}
                >
                  <option value="">Pilih jawaban...</option>
                  {q.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.value} - {opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="field-block">
              <label>Priority</label>
              {band ? (
                <div className="impact-measurement-result" style={{ color: band.color, background: band.bg }}>
                  Total: {totalScore} &mdash; {band.label}
                </div>
              ) : (
                <p className="empty-state">Isi semua pertanyaan di atas untuk melihat hasil.</p>
              )}
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
