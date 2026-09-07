export const DIVISIONS = [
  'Operation Excellence',
  'Linehaul',
  'FLM',
  'Airfreight & RA',
  'Sortation',
  'Operation & Cost Quality',
]

export const IMPACT_TYPES = ['Cost', 'Accuracy', 'Speed']

export const PROJECT_STATUS = [
  { value: 'completed', label: 'Completed', color: '#16a34a', bg: '#dcfce7' },
  { value: 'in_progress', label: 'In Progress', color: '#1d4ed8', bg: '#dbeafe' },
  { value: 'hold', label: 'Hold', color: '#b45309', bg: '#fef3c7' },
  { value: 'cancel', label: 'Cancel', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'backlog', label: 'Backlog', color: '#374151', bg: '#f3f4f6' },
]

export const DEV_LOG_STATUS = ['Identify', 'Prioritize', 'Improve', 'Impact', 'Maintain']

export function statusMeta(value) {
  return PROJECT_STATUS.find((s) => s.value === value) ?? PROJECT_STATUS[PROJECT_STATUS.length - 1]
}

export function randomProjectCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}
