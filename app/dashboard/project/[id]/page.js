'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import LogDetailModal from '@/components/LogDetailModal'
import QuickAddLogModal from '@/components/QuickAddLogModal'
import ProjectModal from '@/components/ProjectModal'
import SearchableSelect from '@/components/SearchableSelect'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { DEV_LOG_STATUS, QUESTIONNAIRE, impactBand } from '@/lib/constants'
import { computeStartDate, computeFinishDate } from '@/lib/projectDates'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()
  const [project, setProject] = useState(null)
  const [logs, setLogs] = useState([])
  const [allProjects, setAllProjects] = useState([])
  const [savedRequestors, setSavedRequestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)
  const [editing, setEditing] = useState(false)
  const [addingLog, setAddingLog] = useState(false)
  const [sortAsc, setSortAsc] = useState(false)
  const [logFilters, setLogFilters] = useState({ status: '', date: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: l }, { data: all }, { data: reqs }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('development_logs').select('*').eq('project_id', id).order('log_date', { ascending: false }),
      supabase.from('projects').select('*'),
      supabase.from('requestors').select('*').order('name'),
    ])
    setProject(p)
    setLogs(l ?? [])
    setAllProjects(all ?? [])
    setSavedRequestors(reqs ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (logFilters.status && l.status !== logFilters.status) return false
      if (logFilters.date && l.log_date !== logFilters.date) return false
      return true
    })
  }, [logs, logFilters])

  const sortedLogs = useMemo(() => {
    const copy = [...filteredLogs]
    copy.sort((a, b) => (sortAsc ? a.log_date.localeCompare(b.log_date) : b.log_date.localeCompare(a.log_date)))
    return copy
  }, [filteredLogs, sortAsc])

  const statusFilterOptions = DEV_LOG_STATUS.map((s) => ({ value: s, label: s }))

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container"><p>Memuat...</p></main>
      </>
    )
  }

  if (!project) {
    return (
      <>
        <Navbar />
        <main className="container"><p>Project tidak ditemukan.</p></main>
      </>
    )
  }

  const totalScore = [project.q1_score, project.q2_score, project.q3_score, project.q4_score].every(
    (v) => v !== null && v !== undefined
  )
    ? project.q1_score + project.q2_score + project.q3_score + project.q4_score
    : null
  const band = totalScore !== null ? impactBand(totalScore) : null

  const startDate = computeStartDate(logs)
  const finishDate = computeFinishDate(logs)

  return (
    <>
      <Navbar />
      <main className="container">
        <button type="button" className="back-link" onClick={() => router.push('/dashboard')}>&larr; Kembali ke List</button>

        <div className="detail-header">
          <div>
            <span className="detail-code">#{project.project_code}</span>
            <h1>{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          {isGuest ? (
            <span className="guest-badge">View Only</span>
          ) : (
            <button type="button" className="submit-btn" onClick={() => setEditing(true)}>Edit Project</button>
          )}
        </div>

        <div className="detail-grid">
          <div className="field-block">
            <label>Project Type</label>
            <p>{project.project_type || '-'}</p>
          </div>
          <div className="field-block" />

          <div className="field-block">
            <label>Objective</label>
            <div className="rte-readonly" dangerouslySetInnerHTML={{ __html: project.objective || '-' }} />
          </div>
          <div className="field-block" />

          <div className="field-block">
            <label>Start Date</label>
            <p>{startDate ? format(parseISO(startDate), 'd MMMM yyyy') : '-'}</p>
          </div>
          <div className="field-block">
            <label>Finish Date</label>
            <p>{finishDate ? format(parseISO(finishDate), 'd MMMM yyyy') : '-'}</p>
          </div>

          <div className="field-block">
            <label>Expected Result</label>
            <div className="rte-readonly" dangerouslySetInnerHTML={{ __html: project.expected_result || '-' }} />
          </div>
          <div className="field-block" />

          <div className="field-block">
            <label>Nama Requestor</label>
            <p>{(project.requestors ?? []).join(', ') || '-'}</p>
          </div>
          <div className="field-block">
            <label>Divisi</label>
            <p>{(project.divisions ?? []).join(', ') || '-'}</p>
          </div>

          <div className="field-block detail-grid-full">
            <label>Impact Measurement</label>
            {Object.keys(project.impacts ?? {}).length === 0 && <p>-</p>}
            {Object.entries(project.impacts ?? {}).map(([type, detail]) => (
              <div key={type} className="impact-readonly-row">
                <strong>{type}:</strong>
                <div className="rte-readonly" dangerouslySetInnerHTML={{ __html: detail || '-' }} />
              </div>
            ))}
          </div>

          <div className="field-block detail-grid-full">
            <label>Requirements</label>
            <div className="rte-readonly" dangerouslySetInnerHTML={{ __html: project.requirements || '-' }} />
          </div>
        </div>

        <div className="questionnaire-block questionnaire-block-readonly">
          <h3>Priority Scoring</h3>
          <div className="detail-grid">
            {QUESTIONNAIRE.map((q, idx) => {
              const scoreKey = `q${idx + 1}_score`
              const scoreVal = project[scoreKey]
              const optLabel = q.options.find((o) => o.value === scoreVal)?.label
              return (
                <div className="field-block" key={q.key}>
                  <label>{q.question}</label>
                  <p>{scoreVal ? `${scoreVal} - ${optLabel}` : '-'}</p>
                </div>
              )
            })}
          </div>
          <div className="field-block">
            <label>Priority</label>
            {band ? (
              <div className="impact-measurement-result" style={{ color: band.color, background: band.bg }}>
                Total: {totalScore} &mdash; {band.label}
              </div>
            ) : (
              <p className="empty-state">Belum lengkap.</p>
            )}
          </div>
        </div>

        <div className="field-block">
          <div className="devlog-section-header">
            <label>Development Log</label>
            <div className="devlog-header-actions">
              <div className="devlog-filter-inline">
                <SearchableSelect
                  options={statusFilterOptions}
                  value={logFilters.status}
                  onChange={(v) => setLogFilters((f) => ({ ...f, status: v }))}
                  allLabel="Semua Status"
                  placeholder="Filter status..."
                />
              </div>
              <input
                type="date"
                className="devlog-filter-date"
                value={logFilters.date}
                onChange={(e) => setLogFilters((f) => ({ ...f, date: e.target.value }))}
              />
              {!isGuest && (
                <button type="button" className="devlog-add-icon-btn" onClick={() => setAddingLog(true)} title="Tambah Development Log">
                  +
                </button>
              )}
            </div>
          </div>
          <div className="devlog-sort-row">
            <button
              type="button"
              className="sort-arrow-btn"
              onClick={() => setSortAsc((v) => !v)}
              title={sortAsc ? 'Urutkan terbaru ke terlama' : 'Urutkan terlama ke terbaru'}
            >
              &#8645; {sortAsc ? 'Terlama' : 'Terbaru'}
            </button>
          </div>
          <div className="devlog-list">
            {sortedLogs.length === 0 && <p className="empty-state">Belum ada development log.</p>}
            {sortedLogs.map((log) => (
              <button type="button" key={log.id} className="devlog-list-item" onClick={() => setSelectedLog(log)}>
                <span className="devlog-date">{format(parseISO(log.log_date), 'd MMM yyyy')}</span>
                <span className="devlog-title">{log.title}</span>
                <span className="devlog-status">{log.status}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          isGuest={isGuest}
          allProjects={allProjects}
          onClose={() => setSelectedLog(null)}
          onSaved={load}
        />
      )}

      {addingLog && (
        <QuickAddLogModal
          projectId={project.id}
          allProjects={allProjects}
          onClose={() => setAddingLog(false)}
          onSaved={load}
        />
      )}

      {editing && (
        <ProjectModal
          mode="edit"
          project={project}
          existingLogs={logs}
          allProjects={allProjects}
          savedRequestors={savedRequestors}
          onRequestorsChanged={load}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}
    </>
  )
}
