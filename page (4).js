'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Navbar from '@/components/Navbar'
import FilterBar from '@/components/FilterBar'
import { PROJECT_STATUS } from '@/lib/constants'
import { slaOptions, getSla } from '@/lib/sla'
import SearchableSelect from '@/components/SearchableSelect'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function KanbanPage() {
  const [projects, setProjects] = useState([]); const [logs, setLogs] = useState([]); const [requestors, setRequestors] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filters, setFilters] = useState({ division:'', requestor:'', status:'' })
  const router = useRouter(); const supabase = createClient(); const { isGuest } = useCurrentUser()
  const load = useCallback(async () => { setLoading(true); const [{ data:p }, { data:l }, { data:r }] = await Promise.all([supabase.from('projects').select('*').order('created_at', { ascending:false }), supabase.from('development_logs').select('*'), supabase.from('requestors').select('name').order('name')]); setProjects(p ?? []); setLogs(l ?? []); setRequestors((r ?? []).map(x=>x.name)); setLoading(false) }, [])
  useEffect(() => { load() }, [load])
  const requestorOptions = useMemo(() => [...new Set([...requestors, ...projects.flatMap(p=>String(p.requestor||'').split(',').map(n=>n.trim()).filter(Boolean))])].sort((a,b)=>a.localeCompare(b)), [requestors,projects])
  const logsByProject = useMemo(() => logs.reduce((a,l)=>(a[l.project_id] ||= []).push(l), a), [logs]); const slaChoices = useMemo(() => slaOptions(logs), [logs])
  const [sla, setSla] = useState({from:'',to:''})
  const filtered = useMemo(() => projects.filter(p => { if(filters.division && !(p.divisions??[]).includes(filters.division)) return false; if(filters.requestor && !String(p.requestor||'').split(',').map(x=>x.trim()).includes(filters.requestor)) return false; if(filters.status && p.status!==filters.status) return false; if(sla.from || sla.to){ if(!sla.from || !sla.to || getSla(logsByProject[p.id]||[], sla.from, sla.to)==null) return false; } if(search){const q=search.toLowerCase(); if(!String(p.project_code).includes(q)&&!p.title.toLowerCase().includes(q)&&!String(p.requestor).toLowerCase().includes(q)) return false} return true }), [projects,filters,search,sla,logsByProject])
  async function handleDragEnd(result){ if(isGuest)return; const {source,destination,draggableId}=result; if(!destination||source.droppableId===destination.droppableId)return; const newStatus=destination.droppableId; setProjects(prev=>prev.map(p=>p.id===draggableId?{...p,status:newStatus}:p)); await supabase.from('projects').update({status:newStatus}).eq('id',draggableId) }
  return <><Navbar/><main className="container container-wide"><div className="kanban-header"><div><h1>Kanban {isGuest&&<span className="guest-badge">View Only</span>}</h1><div className="kanban-filters"><FilterBar filters={filters} onChange={setFilters} requestorOptions={requestorOptions} compact/><div className="sla-filter-fields"><SearchableSelect value={sla.from} onChange={v=>setSla({...sla,from:v})} options={slaChoices} placeholder="SLA dari"/><span>→</span><SearchableSelect value={sla.to} onChange={v=>setSla({...sla,to:v})} options={slaChoices} placeholder="SLA ke"/></div><input className="search-input" placeholder="Cari project/requestor..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div><button type="button" className="back-link" onClick={()=>router.push('/dashboard')}>&larr; Kembali ke List</button></div>
  {loading?<p>Memuat...</p>:<DragDropContext onDragEnd={handleDragEnd}><div className="kanban-board">{PROJECT_STATUS.map(col=><Droppable droppableId={col.value} key={col.value}>{(provided,snapshot)=><div className={`kanban-column ${snapshot.isDraggingOver?'kanban-column-over':''}`} ref={provided.innerRef} {...provided.droppableProps}><div className="kanban-column-header" style={{borderColor:col.color}}>{col.label}<span className="kanban-count">{filtered.filter(p=>p.status===col.value).length}</span></div><div className="kanban-column-body">{filtered.filter(p=>p.status===col.value).map((p,index)=><Draggable draggableId={p.id} index={index} key={p.id} isDragDisabled={isGuest}>{(dp,ds)=><div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps} className={`kanban-card ${ds.isDragging?'kanban-card-dragging':''}`} onClick={()=>router.push(`/dashboard/project/${p.id}`)}><div className="kanban-card-code">#{p.project_code}</div><div className="kanban-card-title">{p.title}</div><div className="kanban-card-meta">{String(p.requestor||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,3).join(', ')}{String(p.requestor||'').split(',').filter(x=>x.trim()).length>3?' ...':''}</div></div>}</Draggable>)}{provided.placeholder}</div></div>}</Droppable>)}</div></DragDropContext>}
  </main></>
}
