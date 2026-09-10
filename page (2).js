'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/FilterBar'
import RowMenu from '@/components/RowMenu'
import StatusBadge from '@/components/StatusBadge'
import ProjectModal from '@/components/ProjectModal'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { slaOptions, getSla } from '@/lib/sla'
import SearchableSelect from '@/components/SearchableSelect'

function formatDays(value) { return value == null ? '-' : `${value} ${value === 1 ? 'hari' : 'hari'}` }

export default function DashboardPage() {
  const [projects, setProjects] = useState([]); const [logs, setLogs] = useState([]); const [requestors, setRequestors] = useState([]); const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(''); const [filters, setFilters] = useState({ division:'', requestor:'', status:'', slaFrom:'', slaTo:'' }); const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [modalMode, setModalMode] = useState(null); const [editingProject, setEditingProject] = useState(null); const [editingLogs, setEditingLogs] = useState([])
  const router = useRouter(); const supabase = createClient(); const { isGuest } = useCurrentUser()

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: l }, { data: r }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('development_logs').select('*'),
      supabase.from('requestors').select('name').order('name', { ascending: true }),
    ])
    setProjects(p ?? []); setLogs(l ?? []); setRequestors((r ?? []).map((x) => x.name)); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const requestorOptions = useMemo(() => [...new Set([...requestors, ...projects.flatMap((p) => String(p.requestor || '').split(',').map((n) => n.trim()).filter(Boolean))])].sort((a,b) => a.localeCompare(b)), [requestors, projects])
  const logsByProject = useMemo(() => logs.reduce((acc, l) => { (acc[l.project_id] ||= []).push(l); return acc }, {}), [logs])
  const slaChoices = useMemo(() => slaOptions(logs), [logs])

  const filteredProjects = useMemo(() => projects.filter((p) => {
    if (filters.division && !(p.divisions ?? []).includes(filters.division)) return false
    if (filters.requestor && !String(p.requestor || '').split(',').map((n) => n.trim()).includes(filters.requestor)) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.slaFrom || filters.slaTo) {
      if (!filters.slaFrom || !filters.slaTo) return false
      if (getSla(logsByProject[p.id] ?? [], filters.slaFrom, filters.slaTo) == null) return false
    }
    if (search) { const q = search.toLowerCase(); if (!String(p.project_code).includes(q) && !p.title.toLowerCase().includes(q)) return false }
    return true
  }), [projects, filters, search, logsByProject])

  async function addRequestor(name) {
    if (!name || isGuest) return false
    const clean = name.trim(); if (!clean) return false
    const { error } = await supabase.from('requestors').upsert({ name: clean }, { onConflict: 'name' })
    if (error) return false
    setRequestors((prev) => [...new Set([...prev, clean])].sort((a,b) => a.localeCompare(b)))
    return true
  }
  async function deleteRequestor(name) {
    if (isGuest) return
    if (!confirm(`Hapus "${name}" dari dropdown requestor? Data project yang sudah ada tidak akan dihapus.`)) return
    await supabase.from('requestors').delete().eq('name', name)
    setRequestors((prev) => prev.filter((r) => r !== name))
  }
  async function handleDelete(project) { if (!confirm(`Hapus project "${project.title}"?`)) return; await supabase.from('projects').delete().eq('id', project.id); load() }
  async function handleChangeStatus(project, status) { await supabase.from('projects').update({ status }).eq('id', project.id); load() }
  async function openEdit(project) { const { data } = await supabase.from('development_logs').select('*').eq('project_id', project.id).order('log_date', { ascending: true }); setEditingProject(project); setEditingLogs(data ?? []); setModalMode('edit') }
  function openAdd() { setEditingProject(null); setEditingLogs([]); setModalMode('add') }
  function closeModal() { setModalMode(null); setEditingProject(null); setEditingLogs([]) }

  return <>
    <Navbar />
    <main className="container container-wide">
      <div className="dashboard-top">
        <div className="dashboard-top-left">
          <FilterBar filters={filters} onChange={setFilters} requestorOptions={requestorOptions} />
          <div className="sla-filter-group">
            <label>SLA Status</label>
            <div className="sla-filter-fields">
              <SearchableSelect value={filters.slaFrom} onChange={(v) => setFilters({ ...filters, slaFrom: v })} options={slaChoices} placeholder="Dari status" />
              <span>→</span>
              <SearchableSelect value={filters.slaTo} onChange={(v) => setFilters({ ...filters, slaTo: v })} options={slaChoices} placeholder="Ke status" />
            </div>
          </div>
          {!isGuest && <button type="button" className="add-project-link" onClick={openAdd}>＋ Add New Project</button>}
        </div>
        <div className="dashboard-top-right">
          <input className="search-input" placeholder="Cari ID atau nama project..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="view-switcher"><button type="button" onClick={() => setViewMenuOpen((v) => !v)}>Kanban / Calendar ▾</button>{viewMenuOpen && <div className="view-switcher-dropdown"><Link href="/dashboard/kanban">Kanban View</Link><Link href="/dashboard/calendar">Calendar View</Link></div>}</div>
        </div>
      </div>

      {loading ? <p>Memuat...</p> : <table className="project-table full-table"><thead><tr><th>No</th><th>ID Project</th><th>Nama Project</th><th>Nama Requestor</th><th>Divisi</th><th>Status Project</th><th>SLA Status</th><th></th></tr></thead><tbody>
        {filteredProjects.map((p, index) => {
          const names = (p.requestor || '').split(',').map((n) => n.trim()).filter(Boolean)
          const visibleNames = names.slice(0,3); const extra = names.slice(3)
          const sla = getSla(logsByProject[p.id] ?? [], filters.slaFrom, filters.slaTo)
          return <tr key={p.id} onDoubleClick={() => router.push(`/dashboard/project/${p.id}`)}>
            <td>{index + 1}</td><td>#{p.project_code}</td><td>{p.title}</td>
            <td><div className="requestor-chips">{visibleNames.map((n) => <span key={n} className="requestor-chip">{n}</span>)}{extra.length > 0 && <span className="requestor-more" tabIndex={0} title={names.join(', ')}>...</span>}</div></td>
            <td>{(p.divisions ?? []).join(', ')}</td><td><StatusBadge status={p.status} /></td>
            <td>{filters.slaFrom && filters.slaTo ? <span className="sla-value">{formatDays(sla)}</span> : <span className="muted">Pilih status</span>}</td>
            <td><RowMenu isGuest={isGuest} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} onChangeStatus={(status) => handleChangeStatus(p, status)} /></td>
          </tr>
        })}
        {filteredProjects.length === 0 && <tr><td colSpan={8} className="empty-state">Tidak ada project.</td></tr>}
      </tbody></table>}
    </main>
    {modalMode && <ProjectModal mode={modalMode} project={editingProject} existingLogs={editingLogs} allProjects={projects} requestors={requestorOptions} onRequestorAdd={addRequestor} onRequestorDelete={deleteRequestor} onClose={closeModal} onSaved={load} />}
  </>
}
