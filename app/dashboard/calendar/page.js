'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Navbar from '@/components/Navbar'
import CalendarView from '@/components/CalendarView'
import LogDetailModal from '@/components/LogDetailModal'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function CalendarPage() {
  const [logs, setLogs] = useState([])
  const [projectsById, setProjectsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedLog, setSelectedLog] = useState(null)
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from('development_logs').select('*'),
      supabase.from('projects').select('id, project_code, title'),
    ])
    setLogs(l ?? [])
    const map = {}
    for (const proj of p ?? []) map[proj.id] = proj
    setProjectsById(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const logsForSelectedDate = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd')
    return logs.filter((l) => l.log_date === key)
  }, [logs, selectedDate])

  return (
    <>
      <Navbar />
      <main className="container container-wide">
        <div className="kanban-header">
          <h1>Calendar</h1>
          <button type="button" className="back-link" onClick={() => router.push('/dashboard')}>&larr; Kembali ke List</button>
        </div>

        {loading ? (
          <p>Memuat...</p>
        ) : (
          <div className="calendar-page-layout">
            <div className="calendar-page-top">
              <CalendarView logs={logs} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>
            <div className="calendar-page-bottom">
              <h3>Project pada {format(selectedDate, 'd MMMM yyyy')}</h3>
              {logsForSelectedDate.length === 0 && <p className="empty-state">Tidak ada development log di tanggal ini.</p>}
              <div className="devlog-list">
                {logsForSelectedDate.map((log) => (
                  <button
                    type="button"
                    key={log.id}
                    className="devlog-list-item"
                    onClick={() => setSelectedLog(log)}
                  >
                    <span className="devlog-date">#{projectsById[log.project_id]?.project_code ?? '-'}</span>
                    <span className="devlog-title">
                      {projectsById[log.project_id]?.title ?? 'Project dihapus'} &mdash; {log.title}
                    </span>
                    <span className="devlog-status">{log.status}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedLog && (
        <LogDetailModal log={selectedLog} isGuest={isGuest} onClose={() => setSelectedLog(null)} onSaved={load} />
      )}
    </>
  )
}
