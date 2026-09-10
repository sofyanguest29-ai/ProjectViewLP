'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/FilterBar'
import { PROJECT_STATUS } from '@/lib/constants'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function KanbanPage() {
  const [projects, setProjects] = useState([])
  const [savedRequestors, setSavedRequestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ division: '', requestor: '', status: '', projectType: '' })
  const [search, setSearch] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { isGuest } = useCurrentUser()

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('requestors').select('*').order('name'),
    ])
    setProjects(p ?? [])
    setSavedRequestors(r ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const requestorOptions = useMemo(() => savedRequestors.map((r) => r.name), [savedRequestors])

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
          <input
            className="search-input"
            placeholder="Cari ID atau nama project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="dashboard-top">
          <FilterBar filters={filters} onChange={setFilters} requestorOptions={requestorOptions} />
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
                          .map((p, index) => (
                            <Draggable draggableId={p.id} index={index} key={p.id} isDragDisabled={isGuest}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={`kanban-card ${dragSnapshot.isDragging ? 'kanban-card-dragging' : ''}`}
                                  onClick={() => router.push(`/dashboard/project/${p.id}`)}
                                >
                                  <div className="kanban-card-code">#{p.project_code}</div>
                                  <div className="kanban-card-title">{p.title}</div>
                                  <div className="kanban-card-meta">{(p.requestors ?? []).join(', ')}</div>
                                </div>
                              )}
                            </Draggable>
                          ))}
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
