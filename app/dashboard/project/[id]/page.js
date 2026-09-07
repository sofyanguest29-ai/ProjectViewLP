'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import LogDetailModal from '@/components/LogDetailModal'
import ProjectModal from '@/components/ProjectModal'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()
  const [project, setProject] = useState(null)
  const [logs, setLogs] = useState([])
  const [allProjects, setAllProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: l }, { data: all }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('development_logs').select('*').eq('project_id', id).order('log_date', { ascending: false }),
      supabase.from('projects').select('*'),
    ])
    setProject(p)
    setLogs(l ?? [])
    setAllProjects(all ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

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
            <label>Objective</label>
            <p>{project.objective || '-'}</p>
          </div>
          <div className="field-block">
            <label>Expected Result</label>
            <p>{project.expected_result || '-'}</p>
          </div>
          <div className="field-block">
            <label>Nama Requestor</label>
            <p>{project.requestor}</p>
          </div>
          <div className="field-block">
            <label>Divisi</label>
            <p>{(project.divisions ?? []).join(', ') || '-'}</p>
          </div>
          <div className="field-block">
            <label>Impact</label>
            {Object.keys(project.impacts ?? {}).length === 0 && <p>-</p>}
            {Object.entries(project.impacts ?? {}).map(([type, detail]) => (
              <p key={type}><strong>{type}:</strong> {detail || '-'}</p>
            ))}
          </div>
          <div className="field-block">
            <label>Requirements</label>
            <div className="rte-readonly" dangerouslySetInnerHTML={{ __html: project.requirements || '-' }} />
          </div>
        </div>

        <div className="field-block">
          <label>Development Log</label>
          <div className="devlog-list">
            {logs.length === 0 && <p className="empty-state">Belum ada development log.</p>}
            {logs.map((log) => (
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
        <LogDetailModal log={selectedLog} isGuest={isGuest} onClose={() => setSelectedLog(null)} onSaved={load} />
      )}

      {editing && (
        <ProjectModal
          mode="edit"
          project={project}
          existingLogs={logs}
          allProjects={allProjects}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}
    </>
  )
}
