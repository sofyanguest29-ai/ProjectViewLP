'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/FilterBar'
import ProjectSearchInput from '@/components/ProjectSearchInput'
import { PROJECT_STATUS, impactBand } from '@/lib/constants'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'

function getPriority(project) {
  const values = [project.q1_score, project.q2_score, project.q3_score, project.q4_score]
  if (values.some((v) => v === null || v === undefined || v === '')) return null
  const total = values.reduce((sum, v) => sum + Number(v), 0)
  return { total, ...impactBand(total) }
}

export default function KanbanPage() {
  const [projects, setProjects] = useState([])
  const [savedRequestors, setSavedRequestors] = useState([])
  const [savedDivisions, setSavedDivisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ division: '', requestor: '', status: '', projectType: '', priority: '' })
  const [search, setSearch] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: r }, { data: d }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('requestors').select('*').order('name'),
      supabase.from('divisions').select('*').order('name'),
    ])
    setProjects(p ?? [])
    setSavedRequestors(r ?? [])
    setSavedDivisions(d ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const requestorOptions = useMemo(() => savedRequestors.map((r) => r.name), [savedRequestors])
  const divisionOptions = useMemo(() => savedDivisions.map((d) => d.name), [savedDivisions])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.division && !(p.divisions ?? []).includes(filters.division)) return false
      if (filters.requestor && !(p.requestors ?? []).includes(filters.requestor)) return false
      if (filters.status && p.status !== filters.status) return false
      if (filters.projectType && p.project_type !== filters.projectType) return false
      if (filters.priority && getPriority(p)?.label !== filters.priority) return false
      if (search) {
        const q = search.toLowerCase()
        if (!String(p.project_code ?? '').toLowerCase().includes(q) && !String(p.title ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [projects, filters, search])

  async function handleDragEnd(result) {
    if (isGuest) return
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId
    setProjects((prev) => prev.map((p) => (p.id === draggableId ? { ...p, status: newStatus } : p)))
    await supabase.from('projects').update({ status: newStatus }).eq('id', draggableId)
  }

  return (
    <>
      <Navbar />
      <main className="container container-wide">
        <div className="kanban-header">
          <h1>Kanban {isGuest && <span className="guest-badge">View Only</span>}</h1>
          <button type="button" className="back-link" onClick={() => router.push('/dashboard')}>&larr; Kembali ke List</button>
        </div>

        <div className="dashboard-top-row">
          <ProjectSearchInput projects={projects} value={search} onChange={setSearch} />
        </div>

        <div className="dashboard-top">
          <FilterBar filters={filters} onChange={setFilters} requestorOptions={requestorOptions} divisionOptions={divisionOptions} onClearExtra={() => setSearch('')} />
        </div>

        {loading ? (
          <p>Memuat...</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {PROJECT_STATUS.map((col) => (
                <Droppable droppableId={col.value} key={col.value}>
                  {(provided, snapshot) => (
                    <div
                      className={`kanban-column ${snapshot.isDraggingOver ? 'kanban-column-over' : ''}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div className="kanban-column-header" style={{ borderColor: col.color }}>
                        {col.label}
                        <span className="kanban-count">{filteredProjects.filter((p) => p.status === col.value).length}</span>
                      </div>
                      <div className="kanban-column-body">
                        {filteredProjects
                          .filter((p) => p.status === col.value)
                          .map((p, index) => {
                            const priority = getPriority(p)
                            return (
                              <Draggable draggableId={p.id} index={index} key={p.id} isDragDisabled={isGuest}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className={`kanban-card ${dragSnapshot.isDragging ? 'kanban-card-dragging' : ''}`}
                                    onClick={() => router.push(`/dashboard/project/${p.id}`)}
                                  >
                                    {priority && (
                                      <span className="kanban-priority-flag" style={{ color: priority.color, background: priority.bg }}>
                                        {priority.label}
                                      </span>
                                    )}
                                    <div className="kanban-card-code">#{p.project_code}</div>
                                    <div className="kanban-card-title">{p.title}</div>
                                    <div className="kanban-card-meta">{(p.requestors ?? []).join(', ')}</div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </>
  )
}
