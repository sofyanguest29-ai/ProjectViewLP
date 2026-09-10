'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { PROJECT_STATUS } from '@/lib/constants'
export default function RowMenu({ onEdit,onDelete,onChangeStatus,isGuest }){
  const [open,setOpen]=useState(false); const [statusSubmenu,setStatusSubmenu]=useState(false); const [mounted,setMounted]=useState(false); const [pos,setPos]=useState({top:0,right:0}); const ref=useRef(null); const triggerRef=useRef(null)
  useEffect(()=>setMounted(true),[])
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target)){setOpen(false);setStatusSubmenu(false)}};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])
  useEffect(()=>{if(!open)return;const update=()=>{const r=triggerRef.current?.getBoundingClientRect();if(r)setPos({top:r.bottom+4,right:window.innerWidth-r.right})};update();window.addEventListener('scroll',update,true);window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update,true);window.removeEventListener('resize',update)}},[open])
  if(isGuest)return null
  const menu= open&&mounted ? createPortal(<div className="row-menu-dropdown row-menu-portal" style={{top:pos.top,right:Math.max(8,pos.right)}} onMouseEnter={()=>setStatusSubmenu(statusSubmenu)}><button type="button" onClick={()=>{setOpen(false);onEdit?.()}}>Edit</button><button type="button" onClick={()=>{setOpen(false);onDelete?.()}}>Delete</button><div className="row-menu-status" onMouseEnter={()=>setStatusSubmenu(true)} onMouseLeave={()=>setStatusSubmenu(false)}><button type="button" className="row-menu-status-trigger">Ubah Status <span>›</span></button>{statusSubmenu&&<div className="row-menu-status-list row-menu-status-portal">{PROJECT_STATUS.map(s=><button type="button" key={s.value} onClick={()=>{setOpen(false);setStatusSubmenu(false);onChangeStatus?.(s.value)}}>{s.label}</button>)}</div>}</div></div>,document.body):null
  return <div className="row-menu" ref={ref} onClick={e=>e.stopPropagation()}><button ref={triggerRef} type="button" className="row-menu-trigger" onClick={()=>setOpen(v=>!v)} aria-label="Menu project">⋮</button>{menu}</div>
}
