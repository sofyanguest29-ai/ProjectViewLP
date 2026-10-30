// Start Date = tanggal PALING LAMA (terlama) dari log berstatus "Identify"
// Finish Date = tanggal PERTAMA (paling awal) dari log berstatus "Improve"
export function computeStartDate(logs) {
  const identifyLogs = (logs || []).filter((l) => l.status === 'Identify')
  if (identifyLogs.length === 0) return null
  return identifyLogs.reduce((min, l) => (l.log_date < min ? l.log_date : min), identifyLogs[0].log_date)
}

export function computeFinishDate(logs) {
  const improveLogs = (logs || []).filter((l) => l.status === 'Improve')
  if (improveLogs.length === 0) return null
  return improveLogs.reduce((min, l) => (l.log_date < min ? l.log_date : min), improveLogs[0].log_date)
}
