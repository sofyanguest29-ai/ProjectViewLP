'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Navbar from '@/components/Navbar'
import CalendarView from '@/components/CalendarView'
import LogDetailModal from '@/components/LogDetailModal'
import FilterBar from '@/components/FilterBar'
import SearchableSelect from '@/components/SearchableSelect'
import { createClient } from '@/lib/supabaseClient'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { DEV_LOG_STATUS } from '@/lib/constants'
import { slaOptions, getSla } from '@/lib/sla'

export default function CalendarPage() {
  const [logs,setLogs]=useState([]); const [projects,setProjects]=useState([]); const [loading,setLoading]=useState(true); const [selectedDate,setSelectedDate]=useState(new Date()); const [selectedLog,setSelectedLog]=useState(null); const [filters,setFilters]=useState({division:'',requestor:'',status:'',startDate:'',endDate:'',logStatus:''})
  const router=useRouter(); const supabase=createClient(); const {isGuest}=useCurrentUser()
  const load=useCallback(async()=>{setLoading(true); const [{data:l},{data:p}]=await Promise.all([supabase.from('development_logs').select('*'),supabase.from('projects').select('*')]); setLogs(l??[]); setProjects(p??[]); setLoading(false)},[])
  useEffect(()=>{load()},[load])
  const slaChoices=useMemo(()=>slaOptions(logs),[logs])
  const [sla,setSla]=useState({from:'',to:''})
  const requestorOptions=useMemo(()=>[...new Set(projects.flatMap(p=>String(p.requestor||'').split(',').map(n=>n.trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b)),[projects])
  const projectsById=useMemo(()=>projects.reduce((a,p)=>(a[p.id]=p,a),{}),[projects])
  const filteredLogs=useMemo(()=>logs.filter(l=>{const p=projectsById[l.project_id]; if(!p)return false; if(filters.division && !(p.divisions??[]).includes(filters.division))return false; if(filters.requestor && !String(p.requestor||'').split(',').map(x=>x.trim()).includes(filters.requestor))return false; if(filters.status&&p.status!==filters.status)return false; if(filters.logStatus&&l.status!==filters.logStatus)return false; if(filters.startDate&&l.log_date<filters.startDate)return false; if(filters.endDate&&l.log_date>filters.endDate)return false; if(sla.from||sla.to){if(!sla.from||!sla.to||getSla(logs.filter(x=>x.project_id===l.project_id),sla.from,sla.to)==null)return false} return true}),[logs,projectsById,filters,sla])
  const logsForSelectedDate=useMemo(()=>filteredLogs.filter(l=>l.log_date===format(selectedDate,'yyyy-MM-dd')),[filteredLogs,selectedDate])
  return <><Navbar/><main className="container container-wide"><div className="kanban-header"><div><h1>Calendar</h1><div className="calendar-filters"><FilterBar filters={filters} onChange={setFilters} requestorOptions={requestorOptions} showDateRange compact/><div className="filter-group"><label>Status Development Log</label><SearchableSelect value={filters.logStatus} onChange={v=>setFilters({...filters,logStatus:v})} options={DEV_LOG_STATUS} placeholder="Semua Status Log"/></div><div className="filter-group"><label>SLA Status</label><div className="sla-filter-fields"><SearchableSelect value={sla.from} onChange={v=>setSla({...sla,from:v})} options={slaChoices} placeholder="SLA dari"/><span>→</span><SearchableSelect value={sla.to} onChange={v=>setSla({...sla,to:v})} options={slaChoices} placeholder="SLA ke"/></div></div></div></div><button type="button" className="back-link" onClick={()=>router.push('/dashboard')}>&larr; Kembali ke List</button></div>{loading?<p>Memuat...</p>:<div className="calendar-page-layout"><div className="calendar-page-top"><CalendarView logs={filteredLogs} selectedDate={selectedDate} onSelectDate={setSelectedDate}/></div><div className="calendar-page-bottom"><h3>Project pada {format(selectedDate,'d MMMM yyyy')}</h3>{logsForSelectedDate.length===0&&<p className="empty-state">Tidak ada development log yang sesuai filter di tanggal ini.</p>}<div className="devlog-list">{logsForSelectedDate.map(log=><button type="button" key={log.id} className="devlog-list-item" onClick={()=>setSelectedLog(log)}><span className="devlog-date">#{projectsById[log.project_id]?.project_code??'-'}</span><span className="devlog-title">{projectsById[log.project_id]?.title??'Project dihapus'} — {log.title}</span><span className="devlog-status">{log.status} {log.status_count||''}</span></button>)}</div></div></div>}</main>{selectedLog&&<LogDetailModal log={selectedLog} isGuest={isGuest} allProjects={projects} onClose={()=>setSelectedLog(null)} onSaved={load}/>}</>
}
