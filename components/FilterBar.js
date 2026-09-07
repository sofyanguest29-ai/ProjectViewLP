'use client'
import { DIVISIONS, PROJECT_STATUS } from '@/lib/constants'

export default function FilterBar({ filters, onChange, requestorOptions }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Divisi</label>
        <select value={filters.division} onChange={(e) => update('division', e.target.value)}>
          <option value="">Semua Divisi</option>
          {DIVISIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Nama Requestor</label>
        <select value={filters.requestor} onChange={(e) => update('requestor', e.target.value)}>
          <option value="">Semua Requestor</option>
          {requestorOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Status Project</label>
        <select value={filters.status} onChange={(e) => update('status', e.target.value)}>
          <option value="">Semua Status</option>
          {PROJECT_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
