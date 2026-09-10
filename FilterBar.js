'use client'
import { DIVISIONS, PROJECT_STATUS } from '@/lib/constants'
import SearchableSelect from './SearchableSelect'

export default function FilterBar({ filters, onChange, requestorOptions, showDateRange = false, compact = false }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  const statusOptions = PROJECT_STATUS.map((s) => ({ value: s.value, label: s.label }))

  return (
    <div className={`filter-bar ${compact ? 'filter-bar-compact' : ''}`}>
      <div className="filter-group">
        <label>Divisi</label>
        <SearchableSelect value={filters.division || ''} onChange={(v) => update('division', v)} options={DIVISIONS} placeholder="Semua Divisi" />
      </div>
      <div className="filter-group">
        <label>Nama Requestor</label>
        <SearchableSelect value={filters.requestor || ''} onChange={(v) => update('requestor', v)} options={requestorOptions} placeholder="Semua Requestor" />
      </div>
      <div className="filter-group">
        <label>Status Project</label>
        <SearchableSelect value={filters.status || ''} onChange={(v) => update('status', v)} options={statusOptions} placeholder="Semua Status" />
      </div>
      {showDateRange && (
        <>
          <div className="filter-group">
            <label>Start Date</label>
            <input type="date" value={filters.startDate || ''} onChange={(e) => update('startDate', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input type="date" value={filters.endDate || ''} onChange={(e) => update('endDate', e.target.value)} />
          </div>
        </>
      )}
    </div>
  )
}
