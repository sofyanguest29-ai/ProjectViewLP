'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/FilterBar'
import RowMenu from '@/components/RowMenu'
import StatusBadge from '@/components/StatusBadge'
import ProjectModal from '@/components/ProjectModal'
import RequestorTags from '@/components/RequestorTags'
import ProjectSearchInput from '@/components/ProjectSearchInput'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { computeStartDate, computeFinishDate } from '@/lib/projectDates'
import { exportProjectsToExcel } from '@/lib/exportExcel'

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [savedRequestors, setSavedRequestors] = useState([])
  const [savedDivisions, setSavedDivisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ division: '', requestor: '', status: '', projectType: '' })
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [editingLogs, setEditingLogs] = useState([])
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()

  const loadProjects = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: l }, { data: r }, { data: d }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('development_logs').select('*'),
      supabase.from('requestors').select('*').order('name'),
      supabase.from('divisions').select('*').order('name'),
    ])
    setProjects(p ?? [])
    setAllLogs(l ?? [])
    setSavedRequestors(r ?? [])
    setSavedDivisions(d ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const requestorOptions = useMemo(() => savedRequestors.map((r) => r.name), [savedRequestors])
  const divisionOptions = useMemo(() => savedDivisions.map((d) => d.name), [savedDivisions])

  const logsByProject = useMemo(() => {
    const map = {}
    for (const log of allLogs) {
      if (!map[log.project_id]) map[log.project_id] = []
      map[log.project_id].push(log)
    }
    return map
  }, [allLogs])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.division && !(p.divisions ?? []).includes(filters.division)) return false
      if (filters.requestor && !(p.requestors ?? []).includes(filters.requestor)) return false
      if (filters.status && p.status !== filters.status) return false
      if (filters.projectType && p.project_type !== filters.projectType) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.project_code.includes(q) && !p.title.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [projects, filters, search])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, search, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize))
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProjects.slice(start, start + pageSize)
  }, [filteredProjects, currentPage, pageSize])

  async function handleDelete(project) {
    if (!confirm(`Hapus project "${project.title}"?`)) return
    await supabase.from('projects').delete().eq('id', project.id)
    loadProjects()
  }

  async function handleChangeStatus(project, status) {
    await supabase.from('projects').update({ status }).eq('id', project.id)
    loadProjects()
  }

  async function openEdit(project) {
    const { data: logs } = await supabase
      .from('development_logs')
      .select('*')
      .eq('project_id', project.id)
      .order('log_date', { ascending: true })
    setEditingProject(project)
    setEditingLogs(logs ?? [])
    setModalMode('edit')
  }

  function openAdd() {
    setEditingProject(null)
    setEditingLogs([])
    setModalMode('add')
  }

  function closeModal() {
    setModalMode(null)
    setEditingProject(null)
    setEditingLogs([])
  }

  function handleExport() {
    exportProjectsToExcel(filteredProjects, logsByProject)
  }

  return (
    <>
      <Navbar />
      <main className="container container-wide">
        <div className="dashboard-top-row">
          <ProjectSearchInput projects={projects} value={search} onChange={setSearch} />
          <div className="view-switcher">
            <button type="button" onClick={() => setViewMenuOpen((v) => !v)}>
              Kanban / Calendar &#9662;
            </button>
            {viewMenuOpen && (
              <div className="view-switcher-dropdown">
                <Link href="/dashboard/kanban">Kanban View</Link>
                <Link href="/dashboard/calendar">Calendar View</Link>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-top-row">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            requestorOptions={requestorOptions}
            divisionOptions={divisionOptions}
            onClearExtra={() => setSearch('')}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
          <div className="dashboard-top-buttons">
            {!isGuest && (
              <button type="button" className="add-project-link" onClick={openAdd}>
                + Add New Project
              </button>
            )}
            <button type="button" className="export-excel-btn" onClick={handleExport}>
              Export Excel
            </button>
          </div>
        </div>

        {loading ? (
          <p>Memuat...</p>
        ) : (
          <>
            <table className="project-table full-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID Project</th>
                  <th>Nama Project</th>
                  <th>Project Type</th>
                  <th>Nama Requestor</th>
                  <th>Divisi</th>
                  <th>Status Project</th>
                  <th>Start Date</th>
                  <th>Finish Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((p, index) => {
                  const projLogs = logsByProject[p.id] ?? []
                  const startDate = computeStartDate(projLogs)
                  const finishDate = computeFinishDate(projLogs)
                  return (
                    <tr key={p.id} onDoubleClick={() => router.push(`/dashboard/project/${p.id}`)}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>#{p.project_code}</td>
                      <td>{p.title}</td>
                      <td>{p.project_type || '-'}</td>
                      <td><RequestorTags names={p.requestors ?? []} /></td>
                      <td>{(p.divisions ?? []).join(', ')}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>{startDate ? format(parseISO(startDate), 'd MMM yyyy') : '-'}</td>
                      <td>{finishDate ? format(parseISO(finishDate), 'd MMM yyyy') : '-'}</td>
                      <td>
                        <RowMenu
                          isGuest={isGuest}
                          onEdit={() => openEdit(p)}
                          onDelete={() => handleDelete(p)}
                          onChangeStatus={(status) => handleChangeStatus(p, status)}
                        />
                      </td>
                    </tr>
                  )
                })}
                {paginatedProjects.length === 0 && (
                  <tr>
                    <td colSpan={10} className="empty-state">Tidak ada project.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pagination-bar">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                &larr; Prev
              </button>
              <span className="pagination-info">
                Halaman {currentPage} dari {totalPages} ({filteredProjects.length} project)
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next &rarr;
              </button>
            </div>
          </>
        )}
      </main>

      {modalMode && (
        <ProjectModal
          mode={modalMode}
          project={editingProject}
          existingLogs={editingLogs}
          allProjects={projects}
          savedRequestors={savedRequestors}
          onRequestorsChanged={loadProjects}
          savedDivisions={savedDivisions}
          onDivisionsChanged={loadProjects}
          onClose={closeModal}
          onSaved={loadProjects}
        />
      )}
    </>
  )
}
