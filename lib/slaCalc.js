import { differenceInCalendarDays, parseISO } from 'date-fns'

// Hitung berapa hari dari kemunculan PERTAMA status "fromStatus" ke kemunculan
// PERTAMA status "toStatus" sesudahnya (berdasarkan tanggal log), untuk satu project.
export function computeSlaDays(logs, fromStatus, toStatus) {
  if (!fromStatus || !toStatus || !logs || logs.length === 0) return null
  const sorted = [...logs].sort((a, b) => (a.log_date || '').localeCompare(b.log_date || ''))
  const fromLog = sorted.find((l) => l.status === fromStatus)
  if (!fromLog) return null
  const toLog = sorted.find((l) => l.status === toStatus && l.log_date >= fromLog.log_date)
  if (!toLog) return null
  const days = differenceInCalendarDays(parseISO(toLog.log_date), parseISO(fromLog.log_date))
  return days
}
