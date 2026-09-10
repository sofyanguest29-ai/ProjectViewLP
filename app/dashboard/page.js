'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/FilterBar'
import RowMenu from '@/components/RowMenu'
import StatusBadge from '@/components/StatusBadge'
import ProjectModal from '@/components/ProjectModal'
import SearchableSelect from '@/components/SearchableSelect'
import RequestorTags from '@/components/RequestorTags'
import ImportDocumentModal from '@/components/ImportDocumentModal'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { DEV_LOG_STATUS } from '@/lib/constants'
import { computeSlaDays } from '@/lib/slaCalc'

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [savedRequestors, setSavedRequestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ division: '', requestor: '', status: '' })
  const [slaFilter, setSlaFilter] = useState({ from: 'Identify', to: 'Maintain' })
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [modalMode, setModalMode] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [editingLogs, setEditingLogs] = useState([])
  const [importOpen, setImportOpen] = useState(false)
  const [prefillData, setPrefillData] = useState(null)
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()

  const loadProjects = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: l }, { data: r }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('development_logs').select('*'),
      supabase.from('requestors').select('*').order('name'),
    ])
    setProjects(p ?? [])
    setAllLogs(l ?? [])
    setSavedRequestors(r ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const requestorOptions = useMemo(() => savedRequestors.map((r) => r.name), [savedRequestors])

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
      if (search) {
        const q = search.toLowerCase()
        if (!p.project_code.includes(q) && !p.title.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [projects, filters, search])

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
    setPrefillData(null)
    setModalMode('edit')
  }

  function openAdd() {
    setEditingProject(null)
    setEditingLogs([])
    setPrefillData(null)
    setModalMode('add')
  }

  function closeModal() {
    setModalMode(null)
    setEditingProject(null)
    setEditingLogs([])
    setPrefillData(null)
  }

  function handleImported(data) {
    setImportOpen(false)
    setPrefillData(data)
    setEditingProject(null)
    setEditingLogs([])
    setModalMode('add')
  }

  const devStatusOptions = DEV_LOG_STATUS.map((s) => ({ value: s, label: s }))

  return (
    <>
      <Navbar />
      <main className="container container-wide">
        <div className="dashboard-top">
          <div className="dashboard-top-left">
            <FilterBar filters={filters} onChange={setFilters} requestorOptions={requestorOptions} />
            <div className="filter-group">
              <label>SLA: dari status</label>
              <SearchableSelect
                options={devStatusOptions}
                value={slaFilter.from}
                onChange={(v) => setSlaFilter((f) => ({ ...f, from: v }))}
                allLabel="Pilih status"
                placeholder="Dari status..."
              />
            </div>
            <div className="filter-group">
              <label>SLA: ke status</label>
              <SearchableSelect
                options={devStatusOptions}
                value={slaFilter.to}
                onChange={(v) => setSlaFilter((f) => ({ ...f, to: v }))}
                allLabel="Pilih status"
                placeholder="Ke status..."
              />
            </div>
            {!isGuest && (
              <div className="dashboard-add-buttons">
                <button type="button" className="add-project-link" onClick={openAdd}>
                  + Add New Project
                </button>
                <button type="button" className="import-doc-link" onClick={() => setImportOpen(true)}>
                  Import dari Word/PDF
                </button>
              </div>
            )}
          </div>
          <div className="dashboard-top-right">
            <input
              className="search-input"
              placeholder="Cari ID atau nama project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
        </div>

        {loading ? (
          <p>Memuat...</p>
        ) : (
          <table className="project-table full-table">
            <thead>
              <tr>
                <th>No</th>
                <th>ID Project</th>
                <th>Nama Project</th>
                <th>Nama Requestor</th>
                <th>Divisi</th>
                <th>Status Project</th>
                <th>SLA Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, index) => {
                const slaDays = computeSlaDays(logsByProject[p.id] ?? [], slaFilter.from, slaFilter.to)
                return (
                  <tr key={p.id} onDoubleClick={() => router.push(`/dashboard/project/${p.id}`)}>
                    <td>{index + 1}</td>
                    <td>#{p.project_code}</td>
                    <td>{p.title}</td>
                    <td><RequestorTags names={p.requestors ?? []} /></td>
                    <td>{(p.divisions ?? []).join(', ')}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>{slaDays !== null ? `${slaDays} hari` : '-'}</td>
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
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">Tidak ada project.</td>
                </tr>
              )}
            </tbody>
          </table>
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
          prefill={prefillData}
          onClose={closeModal}
          onSaved={loadProjects}
        />
      )}

      {importOpen && (
        <ImportDocumentModal onClose={() => setImportOpen(false)} onParsed={handleImported} />
      )}
    </>
  )
}
