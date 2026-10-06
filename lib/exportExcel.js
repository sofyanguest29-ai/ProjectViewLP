import * as XLSX from 'xlsx'
import { statusMeta, impactBand } from './constants'
import { computeStartDate, computeFinishDate } from './projectDates'

// Ubah HTML rich text jadi teks biasa; paragraf & list tetap dipisah baris baru
function stripHtml(html) {
  if (!html) return ''
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

export const PRIORITY_NOT_SCORED = 'Belum Dinilai'

// Label priority (High / Medium / Low) dari 4 skor kuesioner
export function priorityLabel(project) {
  const values = [project.q1_score, project.q2_score, project.q3_score, project.q4_score]
  if (values.some((v) => v === null || v === undefined || v === '')) return PRIORITY_NOT_SCORED
  const total = values.reduce((sum, v) => sum + Number(v), 0)
  const label = impactBand(total).label
  return label === '-' ? PRIORITY_NOT_SCORED : label
}

/**
 * @param projects      project yang sudah difilter di modal
 * @param logsByProject map project_id -> array log
 * @param options       { includeLogs: boolean, includeProjectId: boolean }
 */
export function exportProjectsToExcel(projects, logsByProject, options = {}) {
  const { includeLogs = true, includeProjectId = true } = options

  const rows = projects.map((p, index) => {
    const logs = logsByProject[p.id] ?? []
    const row = { No: index + 1 }
    if (includeProjectId) row['ID Project'] = p.project_code
    row['Nama Project'] = p.title
    row['Project Type'] = p.project_type || '-'
    row['Priority Scoring'] = priorityLabel(p)
    row['Objective'] = stripHtml(p.objective) || '-'
    row['Requirement'] = stripHtml(p.requirements) || '-'
    row['Nama Requestor'] = (p.requestors ?? []).join(', ') || '-'
    row['Divisi'] = (p.divisions ?? []).join(', ') || '-'
    row['Status Project'] = statusMeta(p.status).label
    row['Start Date'] = computeStartDate(logs) || '-'
    row['Finish Date'] = computeFinishDate(logs) || '-'
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 5 },
    ...(includeProjectId ? [{ wch: 12 }] : []),
    { wch: 30 }, // Nama Project
    { wch: 20 }, // Project Type
    { wch: 16 }, // Priority Scoring
    { wch: 50 }, // Objective
    { wch: 50 }, // Requirement
    { wch: 25 },
    { wch: 25 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects')

  if (includeLogs) {
    const logRows = []
    let no = 1
    for (const p of projects) {
      const logs = [...(logsByProject[p.id] ?? [])].sort((a, b) => a.log_date.localeCompare(b.log_date))
      for (const log of logs) {
        const row = { No: no++ }
        if (includeProjectId) row['ID Project'] = p.project_code
        row['Nama Project'] = p.title
        row['Tanggal'] = log.log_date
        row['Judul Log'] = log.title
        row['Status'] = log.status
        row['Detail'] = stripHtml(log.detail)
        logRows.push(row)
      }
    }
    const logWorksheet = XLSX.utils.json_to_sheet(logRows)
    logWorksheet['!cols'] = [
      { wch: 5 },
      ...(includeProjectId ? [{ wch: 12 }] : []),
      { wch: 30 },
      { wch: 14 },
      { wch: 30 },
      { wch: 14 },
      { wch: 50 },
    ]
    XLSX.utils.book_append_sheet(workbook, logWorksheet, 'Development Logs')
  }

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `project-monitor-${today}.xlsx`)
}
