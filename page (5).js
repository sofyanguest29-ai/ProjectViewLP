'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import LogDetailModal from '@/components/LogDetailModal'
import ProjectModal from '@/components/ProjectModal'
import QuickLogModal from '@/components/QuickLogModal'
import SearchableSelect from '@/components/SearchableSelect'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { DEV_LOG_STATUS } from '@/lib/constants'

export default function ProjectDetailPage() {
  const { id }=useParams(); const router=useRouter(); const supabase=createClient(); const {isGuest}=useCurrentUser()
  const [project,setProject]=useState(null); const [logs,setLogs]=useState([]); const [allProjects,setAllProjects]=useState([]); const [requestors,setRequestors]=useState([]); const [loading,setLoading]=useState(true); const [selectedLog,setSelectedLog]=useState(null); const [editing,setEditing]=useState(false); const [quickAdd,setQuickAdd]=useState(false)
  const [sortAsc,setSortAsc]=useState(false); const [logFilters,setLogFilters]=useState({status:'',startDate:'',endDate:''})
  const load=useCallback(async()=>{setLoading(true);const [{data:p},{data:l},{data:all},{data:r}]=await Promise.all([supabase.from('projects').select('*').eq('id',id).single(),supabase.from('development_logs').select('*').eq('project_id',id),supabase.from('projects').select('*'),supabase.from('requestors').select('name').order('name')]);setProject(p);setLogs(l??[]);setAllProjects(all??[]);setRequestors((r??[]).map(x=>x.name));setLoading(false)},[id])
  useEffect(()=>{load()},[load])
  const filteredLogs=useMemo(()=>logs.filter(l=>(!logFilters.status||l.status===logFilters.status)&&(!logFilters.startDate||l.log_date>=logFilters.startDate)&&(!logFilters.endDate||l.log_date<=logFilters.endDate)).sort((a,b)=>{const d=String(a.log_date).localeCompare(String(b.log_date));return sortAsc?d:-d}),[logs,logFilters,sortAsc])
  if(loading)return <><Navbar/><main className="container"><p>Memuat...</p></main></>
  if(!project)return <><Navbar/><main className="container"><p>Project tidak ditemukan.</p></main></>
  async function addRequestor(name){if(isGuest)return false;const clean=name.trim();if(!clean)return false;const {error}=await supabase.from('requestors').upsert({name:clean},{onConflict:'name'});if(error)return false;setRequestors(prev=>[...new Set([...prev,clean])].sort((a,b)=>a.localeCompare(b)));return true}
  async function deleteRequestor(name){if(isGuest)return;if(!confirm(`Hapus "${name}" dari dropdown requestor?`))return;await supabase.from('requestors').delete().eq('name',name);setRequestors(prev=>prev.filter(x=>x!==name))}
  const requestorNames=String(project.requestor||'').split(',').map(x=>x.trim()).filter(Boolean)
  return <><Navbar/><main className="container"><button type="button" className="back-link" onClick={()=>router.push('/dashboard')}>&larr; Kembali ke List</button><div className="detail-header"><div><span className="detail-code">#{project.project_code}</span><h1>{project.title}</h1><StatusBadge status={project.status}/></div>{isGuest?<span className="guest-badge">View Only</span>:<button type="button" className="submit-btn" onClick={()=>setEditing(true)}>Edit Project</button>}</div>
  <div className="detail-grid"><div className="field-block"><label>Objective</label><p>{project.objective||'-'}</p></div><div className="field-block"><label>Expected Result</label><p>{project.expected_result||'-'}</p></div><div className="field-block"><label>Nama Requestor</label><div className="requestor-chips detail-requestors">{requestorNames.map(n=><span className="requestor-chip" key={n}>{n}</span>)}</div></div><div className="field-block"><label>Divisi</label><p>{(project.divisions??[]).join(', ')||'-'}</p></div><div className="field-block"><label>Impact</label>{Object.keys(project.impacts??{}).length===0&&<p>-</p>}{Object.entries(project.impacts??{}).map(([type,detail])=><p key={type}><strong>{type}:</strong> {detail||'-'}</p>)}</div><div className="field-block"><label>Impact Measurement</label><p><strong>{project.impact_measurement?.total??'-'}</strong> — {project.impact_measurement?.level??'-'}</p></div><div className="field-block detail-requirements"><label>Requirements</label><div className="rte-readonly" dangerouslySetInnerHTML={{__html:project.requirements||'-'}}/></div></div>

  <div className="development-section"><div className="development-header"><div><label>Log Development</label><span className="log-count">{filteredLogs.length} log</span></div><div className="development-actions"><button type="button" className="sort-log-btn" onClick={()=>setSortAsc(v=>!v)} title={sortAsc?'Terbaru ke terlama':'Terlama ke terbaru'}>{sortAsc?'↑':'↓'} {sortAsc?'Terlama':'Terbaru'}</button><div className="inline-filter"><SearchableSelect value={logFilters.status} onChange={v=>setLogFilters({...logFilters,status:v})} options={DEV_LOG_STATUS} placeholder="Semua status"/></div><input type="date" value={logFilters.startDate} onChange={e=>setLogFilters({...logFilters,startDate:e.target.value})} title="Start date"/><span>→</span><input type="date" value={logFilters.endDate} onChange={e=>setLogFilters({...logFilters,endDate:e.target.value})} title="End date"/>{!isGuest&&<button type="button" className="add-log-icon" onClick={()=>setQuickAdd(true)} title="Tambah log development">＋</button>}</div></div>
  <div className="devlog-list">{filteredLogs.length===0&&<p className="empty-state">Tidak ada development log yang sesuai filter.</p>}{filteredLogs.map(log=><button type="button" key={log.id} className="devlog-list-item" onClick={()=>setSelectedLog(log)}><span className="devlog-date">{format(parseISO(log.log_date),'d MMM yyyy')}</span><span className="devlog-title">{log.title}</span><span className="devlog-status">{log.status} {log.status_count||''}</span></button>)}</div></div>
  <div className="detail-status-row"><span><strong>Status Project</strong></span><StatusBadge status={project.status}/></div>
  </main>
  {selectedLog&&<LogDetailModal log={selectedLog} isGuest={isGuest} allProjects={allProjects} onClose={()=>setSelectedLog(null)} onSaved={load}/>} {quickAdd&&<QuickLogModal projectId={project.id} allProjects={allProjects} onClose={()=>setQuickAdd(false)} onSaved={()=>{setQuickAdd(false);load()}}/>} {editing&&<ProjectModal mode="edit" project={project} existingLogs={logs} allProjects={allProjects} requestors={requestors} onRequestorAdd={addRequestor} onRequestorDelete={deleteRequestor} onClose={()=>setEditing(false)} onSaved={load}/>}</>
}
