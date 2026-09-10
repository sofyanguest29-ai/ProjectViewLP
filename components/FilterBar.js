'use client'
import { DIVISIONS, PROJECT_STATUS, PROJECT_TYPES } from '@/lib/constants'
import SearchableSelect from './SearchableSelect'

const EMPTY_FILTERS = { division: '', requestor: '', status: '', projectType: '' }

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export default function FilterBar({ filters, onChange, requestorOptions }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  function clearAll() {
    onChange({ ...EMPTY_FILTERS })
  }

  const divisionOptions = DIVISIONS.map((d) => ({ value: d, label: d }))
  const statusOptions = PROJECT_STATUS.map((s) => ({ value: s.value, label: s.label }))
  const requestorSelectOptions = requestorOptions.map((r) => ({ value: r, label: r }))
  const projectTypeOptions = PROJECT_TYPES.map((t) => ({ value: t, label: t }))

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
      <div className="filter-group">
        <label>Project Type</label>
        <SearchableSelect
          options={projectTypeOptions}
          value={filters.projectType}
          onChange={(v) => update('projectType', v)}
          allLabel="Semua Project Type"
          placeholder="Cari project type..."
        />
      </div>
      <div className="filter-group filter-clear-group">
        <label>&nbsp;</label>
        <button type="button" className="filter-clear-btn" onClick={clearAll} title="Hapus semua filter">
          <FilterIcon />
        </button>
      </div>
    </div>
  )
}
