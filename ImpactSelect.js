'use client'
import MultiSelect from './MultiSelect'
import RichTextEditor from './RichTextEditor'
import { IMPACT_TYPES } from '@/lib/constants'

// impacts: object { Cost: "<html>", Speed: "<html>" }
export default function ImpactSelect({ impacts, onChange, allProjects = [] }) {
  const selectedTypes = Object.keys(impacts)

  function handleTypesChange(newTypes) {
    const newImpacts = {}
    for (const type of newTypes) {
      newImpacts[type] = impacts[type] ?? ''
    }
    onChange(newImpacts)
  }

  function handleDetailChange(type, html) {
    onChange({ ...impacts, [type]: html })
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
              <RichTextEditor
                value={impacts[type] ?? ''}
                onChange={(html) => handleDetailChange(type, html)}
                allProjects={allProjects}
                placeholder={`Detail dampak untuk ${type}...`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
