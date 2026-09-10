// Hitung urutan ke-berapa suatu status muncul untuk project yang sama,
// diurutkan berdasarkan tanggal log (lalu created_at sebagai tie-breaker).
// Return: { [log.id]: count }
export function computeStatusCounts(logs) {
  const sorted = [...logs].sort((a, b) => {
    const dateCompare = (a.log_date || '').localeCompare(b.log_date || '')
    if (dateCompare !== 0) return dateCompare
    return (a.created_at || '').localeCompare(b.created_at || '')
  })
  const counts = {}
  const result = {}
  for (const log of sorted) {
    const key = log.status
    counts[key] = (counts[key] || 0) + 1
    result[log.id] = counts[key]
  }
  return result
}

export function statusLabelWithCount(log, countsMap) {
  const count = countsMap[log.id]
  return count ? `${log.status} ${count}` : log.status
}
