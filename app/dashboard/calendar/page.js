'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/FilterBar'
import ProjectSearchInput from '@/components/ProjectSearchInput'
import CalendarView from '@/components/CalendarView'
import LogDetailModal from '@/components/LogDetailModal'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function CalendarPage() {
  const [logs, setLogs] = useState([])
  const [projects, setProjects] = useState([])
  const [savedRequestors, setSavedRequestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedLog, setSelectedLog] = useState(null)
  const [filters, setFilters] = useState({ division: '', requestor: '', status: '', projectType: '' })
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: l }, { data: p }, { data: r }] = await Promise.all([
      supabase.from('development_logs').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('requestors').select('*').order('name'),
    ])
    setLogs(l ?? [])
    setProjects(p ?? [])
    setSavedRequestors(r ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const requestorOptions = useMemo(() => savedRequestors.map((r) => r.name), [savedRequestors])
  const projectsById = useMemo(() => {
    const map = {}
    for (const proj of projects) map[proj.id] = proj
    return map
  }, [projects])

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const proj = projectsById[l.project_id]
      if (!proj) return false
      if (filters.division && !(proj.divisions ?? []).includes(filters.division)) return false
      if (filters.requestor && !(proj.requestors ?? []).includes(filters.requestor)) return false
      if (filters.status && proj.status !== filters.status) return false
      if (filters.projectType && proj.project_type !== filters.projectType) return false
      if (search) {
        const q = search.toLowerCase()
        if (!proj.project_code.includes(q) && !proj.title.toLowerCase().includes(q)) return false
      }
      if (dateRange.start && l.log_date < dateRange.start) return false
      if (dateRange.end && l.log_date > dateRange.end) return false
      return true
    })
  }, [logs, projectsById, filters, dateRange, search])

  const logsForSelectedDate = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd')
    return filteredLogs.filter((l) => l.log_date === key)
  }, [filteredLogs, selectedDate])

  return (
    <>
      <Navbar />
      <main className="container container-wide">
        <div className="kanban-header">
          <h1>Calendar</h1>
          <button type="button" className="back-link" onClick={() => router.push('/dashboard')}>&larr; Kembali ke List</button>
        </div>

        <div className="dashboard-top-row">
          <ProjectSearchInput projects={projects} value={search} onChange={setSearch} />
        </div>

        <div className="dashboard-top">
          <FilterBar filters={filters} onChange={setFilters} requestorOptions={requestorOptions} />
          <div className="filter-group">
            <label>Dari Tanggal</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>Sampai Tanggal</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
            />
          </div>
        </div>

        {loading ? (
          <p>Memuat...</p>
        ) : (
          <div className="calendar-page-layout">
            <div className="calendar-page-top">
              <CalendarView logs={filteredLogs} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>
            <div className="calendar-page-bottom">
              <h3>Project pada {format(selectedDate, 'd MMMM yyyy')}</h3>
              {logsForSelectedDate.length === 0 && <p className="empty-state">Tidak ada development log di tanggal ini.</p>}
              <div className="devlog-list">
                {logsForSelectedDate.map((log) => (
                  <button type="button" key={log.id} className="devlog-list-item" onClick={() => setSelectedLog(log)}>
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
