'use client'
import { DIVISIONS, PROJECT_STATUS } from '@/lib/constants'
import SearchableSelect from './SearchableSelect'

export default function FilterBar({ filters, onChange, requestorOptions }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  const divisionOptions = DIVISIONS.map((d) => ({ value: d, label: d }))
  const statusOptions = PROJECT_STATUS.map((s) => ({ value: s.value, label: s.label }))
  const requestorSelectOptions = requestorOptions.map((r) => ({ value: r, label: r }))

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Divisi</label>
        <SearchableSelect
          options={divisionOptions}
          value={filters.division}
          onChange={(v) => update('division', v)}
          allLabel="Semua Divisi"
          placeholder="Cari divisi..."
        />
      </div>
      <div className="filter-group">
        <label>Nama Requestor</label>
        <SearchableSelect
          options={requestorSelectOptions}
          value={filters.requestor}
          onChange={(v) => update('requestor', v)}
          allLabel="Semua Requestor"
          placeholder="Cari requestor..."
        />
      </div>
      <div className="filter-group">
        <label>Status Project</label>
        <SearchableSelect
          options={statusOptions}
          value={filters.status}
          onChange={(v) => update('status', v)}
          allLabel="Semua Status"
          placeholder="Cari status..."
        />
      </div>
    </div>
  )
}
