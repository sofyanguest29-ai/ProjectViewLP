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

export const QUESTIONNAIRE = [
  {
    key: 'q1_score',
    question: 'Seberapa besar dampaknya ke business process?',
    options: [
      { value: 1, label: 'Tidak mengubah business process, hanya kenyamanan user' },
      { value: 2, label: 'Mengubah business process, ada impact ke speed/cost/accuracy namun perubahan tidak signifikan' },
      { value: 3, label: 'Mengubah business process, ada impact ke speed/cost/accuracy dengan perubahan signifikan' },
    ],
  },
  {
    key: 'q2_score',
    question: 'Berapa luas yang terdampak?',
    options: [
      { value: 1, label: '1 user/1 team' },
      { value: 2, label: 'Multiple ops function' },
      { value: 3, label: 'Cross-function/directorate' },
    ],
  },
  {
    key: 'q3_score',
    question: 'Seberapa sering terjadi?',
    options: [
      { value: 1, label: 'One-off' },
      { value: 2, label: 'Weekly' },
      { value: 3, label: 'Daily/Continuous' },
    ],
  },
  {
    key: 'q4_score',
    question: 'Seberapa urgent?',
    options: [
      { value: 1, label: 'Nice to have' },
      { value: 2, label: 'Important' },
      { value: 3, label: 'Regulatory/Customer/Business Critical' },
    ],
  },
]

export function statusMeta(value) {
  return PROJECT_STATUS.find((s) => s.value === value) ?? PROJECT_STATUS[PROJECT_STATUS.length - 1]
}

export function randomProjectCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export function impactBand(total) {
  if (total >= 10 && total <= 12) return { label: 'High', color: '#b91c1c', bg: '#fee2e2' }
  if (total >= 7 && total <= 9) return { label: 'Medium', color: '#b45309', bg: '#fef3c7' }
  if (total >= 4 && total <= 6) return { label: 'Low', color: '#15803d', bg: '#dcfce7' }
  return { label: '-', color: '#6b7280', bg: '#f3f4f6' }
}
