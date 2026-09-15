import * as XLSX from 'xlsx'
import { statusMeta } from './constants'
import { computeStartDate, computeFinishDate } from './projectDates'

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export function exportProjectsToExcel(projects, logsByProject) {
  const rows = projects.map((p, index) => {
    const logs = logsByProject[p.id] ?? []
    const startDate = computeStartDate(logs)
    const finishDate = computeFinishDate(logs)
    return {
      No: index + 1,
      'ID Project': p.project_code,
      'Nama Project': p.title,
      'Project Type': p.project_type || '-',
      'Nama Requestor': (p.requestors ?? []).join(', ') || '-',
      Divisi: (p.divisions ?? []).join(', ') || '-',
      'Status Project': statusMeta(p.status).label,
      'Start Date': startDate || '-',
      'Finish Date': finishDate || '-',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ]

  const logRows = []
  let no = 1
  for (const p of projects) {
    const logs = [...(logsByProject[p.id] ?? [])].sort((a, b) => a.log_date.localeCompare(b.log_date))
    for (const log of logs) {
      logRows.push({
        No: no++,
        'ID Project': p.project_code,
        'Nama Project': p.title,
        Tanggal: log.log_date,
        'Judul Log': log.title,
        Status: log.status,
        Detail: stripHtml(log.detail),
      })
    }
  }

  const logWorksheet = XLSX.utils.json_to_sheet(logRows)
  logWorksheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 30 },
    { wch: 14 },
    { wch: 30 },
    { wch: 14 },
    { wch: 50 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects')
  XLSX.utils.book_append_sheet(workbook, logWorksheet, 'Development Logs')

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `project-monitor-${today}.xlsx`)
}
