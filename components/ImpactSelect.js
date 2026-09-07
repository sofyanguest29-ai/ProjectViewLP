'use client'
import MultiSelect from './MultiSelect'
import { IMPACT_TYPES } from '@/lib/constants'

// impacts: object { Cost: "detail text", Speed: "detail text" }
export default function ImpactSelect({ impacts, onChange }) {
  const selectedTypes = Object.keys(impacts)

  function handleTypesChange(newTypes) {
    const newImpacts = {}
    for (const type of newTypes) {
      newImpacts[type] = impacts[type] ?? ''
    }
    onChange(newImpacts)
  }

  function handleDetailChange(type, detail) {
    onChange({ ...impacts, [type]: detail })
  }

  return (
    <div className="impact-select">
      <MultiSelect
        options={IMPACT_TYPES}
        selected={selectedTypes}
        onChange={handleTypesChange}
        placeholder="Pilih impact..."
      />
      {selectedTypes.length > 0 && (
        <div className="impact-details">
          {selectedTypes.map((type) => (
            <div key={type} className="impact-detail-row">
              <label>{type}</label>
              <textarea
                rows={2}
                value={impacts[type] ?? ''}
                onChange={(e) => handleDetailChange(type, e.target.value)}
                placeholder={`Detail dampak untuk ${type}...`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
