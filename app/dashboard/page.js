'use client'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import { impactBand } from '@/lib/constants'

const SORT_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'project_code', label: 'ID Project' },
  { value: 'title', label: 'Nama Project' },
  { value: 'project_type', label: 'Project Type' },
  { value: 'requestors', label: 'Nama Requestor' },
  { value: 'divisions', label: 'Divisi' },
  { value: 'status', label: 'Status Project' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'finish_date', label: 'Finish Date' },
  { value: 'priority', label: 'Priority Scoring' },
]

function getPriority(project) {
  const values = [project.q1_score, project.q2_score, project.q3_score, project.q4_score]
  if (values.some((v) => v === null || v === undefined || v === '')) return null
  const total = values.reduce((sum, v) => sum + Number(v), 0)
  return { total, ...impactBand(total) }
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h13" />
      <path d="M8 12h9" />
      <path d="M8 18h5" />
    </svg>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [savedRequestors, setSavedRequestors] = useState([])
  const [savedDivisions, setSavedDivisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ division: '', requestor: '', status: '', projectType: '', priority: [] })
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'no', direction: 'desc' })
  const [modalMode, setModalMode] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [editingLogs, setEditingLogs] = useState([])
  const sortRef = useRef(null)
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

  useEffect(() => {
    function handleOutsideClick(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) setSortMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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
      if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(getPriority(p)?.label)) return false
      if (search) {
        const q = search.toLowerCase()
        if (!String(p.project_code ?? '').toLowerCase().includes(q) && !String(p.title ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [projects, filters, search])

  const sortedProjects = useMemo(() => {
    const list = filteredProjects.map((project, index) => ({ project, originalIndex: index }))
    const getValue = ({ project, originalIndex }) => {
      const logs = logsByProject[project.id] ?? []
      const priority = getPriority(project)
      switch (sortConfig.key) {
        case 'no': return originalIndex
        case 'project_code': return String(project.project_code ?? '')
        case 'title': return String(project.title ?? '')
        case 'project_type': return String(project.project_type ?? '')
        case 'requestors': return (project.requestors ?? []).join(', ')
        case 'divisions': return (project.divisions ?? []).join(', ')
        case 'status': return String(project.status ?? '')
        case 'start_date': return computeStartDate(logs) ?? ''
        case 'finish_date': return computeFinishDate(logs) ?? ''
        case 'priority': return priority?.total ?? -1
        default: return ''
      }
    }

    return list.sort((a, b) => {
      const aValue = getValue(a)
      const bValue = getValue(b)
      const aEmpty = aValue === '' || aValue === null || aValue === undefined
      const bEmpty = bValue === '' || bValue === null || bValue === undefined
      if (aEmpty && !bEmpty) return 1
      if (!aEmpty && bEmpty) return -1
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      const result = String(aValue).localeCompare(String(bValue), 'id', { numeric: true, sensitivity: 'base' })
      return sortConfig.direction === 'asc' ? result : -result
    }).map(({ project }) => project)
  }, [filteredProjects, logsByProject, sortConfig])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, search, pageSize, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / pageSize))
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedProjects.slice(start, start + pageSize)
  }, [sortedProjects, currentPage, pageSize])

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

  function selectSort(key) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc',
    }))
    setSortMenuOpen(false)
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
            priorityMulti
          />
          <div className="dashboard-top-buttons">
            {!isGuest && (
              <button type="button" className="add-project-link" onClick={openAdd}>
                + Add New Project
              </button>
            )}
            {!isGuest && (
              <button type="button" className="export-excel-btn" onClick={handleExport}>
                Export Excel
              </button>
            )}
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
                  <th className="priority-scoring-header">Priority Scoring</th>
                  <th className="row-menu-header">
                    <div className="sort-control" ref={sortRef}>
                      <button
                        type="button"
                        className={`sort-icon-btn ${sortMenuOpen ? 'active' : ''}`}
                        onClick={() => setSortMenuOpen((v) => !v)}
                        title="Sort project"
                        aria-label="Sort project"
                      >
                        <SortIcon />
                      </button>
                      {sortMenuOpen && (
                        <div className="sort-dropdown">
                          <div className="sort-dropdown-section">
                            <div className="sort-dropdown-label">Sort by:</div>
                            {SORT_OPTIONS.map((option) => (
                              <button
                                type="button"
                                key={option.value}
                                className={`sort-option ${sortConfig.key === option.value ? 'selected' : ''}`}
                                onClick={() => selectSort(option.value)}
                              >
                                <span>{option.label}</span>
                                {sortConfig.key === option.value && <span className="sort-option-arrow">›</span>}
                              </button>
                            ))}
                          </div>
                          <div className="sort-dropdown-divider" />
                          <div className="sort-dropdown-section">
                            <div className="sort-dropdown-label">Sort order:</div>
                            <button type="button" className={`sort-option ${sortConfig.direction === 'desc' ? 'selected' : ''}`} onClick={() => setSortConfig((prev) => ({ ...prev, direction: 'desc' }))}>
                              Descending
                            </button>
                            <button type="button" className={`sort-option ${sortConfig.direction === 'asc' ? 'selected' : ''}`} onClick={() => setSortConfig((prev) => ({ ...prev, direction: 'asc' }))}>
                              Ascending
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((p, index) => {
                  const projLogs = logsByProject[p.id] ?? []
                  const startDate = computeStartDate(projLogs)
                  const finishDate = computeFinishDate(projLogs)
                  const priority = getPriority(p)
                  return (
                    <tr key={p.id} onDoubleClick={() => router.push(`/dashboard/project/${p.id}`)}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>#{p.project_code}</td>
                      <td>{p.title}</td>
                      <td className="cell-center">{p.project_type || '-'}</td>
                      <td className="cell-center"><RequestorTags names={p.requestors ?? []} /></td>
                      <td className="cell-center">{(p.divisions ?? []).join(', ')}</td>
                      <td className="cell-center"><StatusBadge status={p.status} /></td>
                      <td className="cell-center">{startDate ? format(parseISO(startDate), 'd MMM yyyy') : '-'}</td>
                      <td className="cell-center">{finishDate ? format(parseISO(finishDate), 'd MMM yyyy') : '-'}</td>
                      <td className="priority-scoring-cell">
                        {priority ? (
                          <span className="priority-table-value" style={{ color: priority.color, background: priority.bg }}>
                            {priority.label} ({priority.total})
                          </span>
                        ) : '-'}
                      </td>
                      <td className="row-menu-cell">
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
                    <td colSpan={11} className="empty-state">Tidak ada project.</td>
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
                Halaman {currentPage} dari {totalPages} ({sortedProjects.length} project)
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
