import { DEV_LOG_STATUS } from './constants'

export function getSla(logs, fromKey, toKey) {
  if (!fromKey || !toKey) return null
  const [fromStatus, fromCountRaw] = fromKey.split('::')
  const [toStatus, toCountRaw] = toKey.split('::')
  const fromCount = Number(fromCountRaw)
  const toCount = Number(toCountRaw)
  const sorted = [...logs].sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)) || String(a.created_at || '').localeCompare(String(b.created_at || '')))
  const fromLog = sorted.filter((l) => l.status === fromStatus)[fromCount - 1]
  const toLog = sorted.filter((l) => l.status === toStatus)[toCount - 1]
  if (!fromLog || !toLog) return null
  return Math.max(0, Math.round((new Date(`${toLog.log_date}T00:00:00`) - new Date(`${fromLog.log_date}T00:00:00`)) / 86400000))
}

export function slaOptions(logs) {
  const groups = {}
  for (const log of logs) (groups[log.status] ||= []).push(log)
  return DEV_LOG_STATUS.flatMap((status) => (groups[status] || []).sort((a, b) => String(a.log_date).localeCompare(String(b.log_date))).map((_, i) => ({ value: `${status}::${i + 1}`, label: `${status} ${i + 1}` })))
}
