// Start Date = tanggal PALING LAMA (terlama) dari log berstatus "Identify"
// Finish Date = tanggal PALING BARU (terbaru) dari log berstatus "Improve"
export function computeStartDate(logs) {
  const identifyLogs = (logs || []).filter((l) => l.status === 'Identify')
  if (identifyLogs.length === 0) return null
  return identifyLogs.reduce((min, l) => (l.log_date < min ? l.log_date : min), identifyLogs[0].log_date)
}

export function computeFinishDate(logs) {
  const improveLogs = (logs || []).filter((l) => l.status === 'Improve')
  if (improveLogs.length === 0) return null
  return improveLogs.reduce((max, l) => (l.log_date > max ? l.log_date : max), improveLogs[0].log_date)
}
