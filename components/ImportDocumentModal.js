'use client'
import { useState } from 'react'

export default function ImportDocumentModal({ onClose, onParsed }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload() {
    if (!file) {
      setError('Pilih file Word (.docx) atau PDF (.pdf) dulu')
      return
    }
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-document', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses dokumen')
      }
      onParsed(json.data)
    } catch (err) {
      setError(err.message || 'Gagal memproses dokumen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-medium">
        <div className="modal-header">
          <h2>Import Project dari Word/PDF</h2>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}
          <p className="import-doc-hint">
            Dokumen harus punya struktur: baris pertama/judul terbesar = Judul Project, lalu header
            (persis tertulis) <strong>Objective</strong>, <strong>Expected Result</strong>,{' '}
            <strong>Impact Measurement</strong> (isi per baris <em>Cost: ...</em>, <em>Accuracy: ...</em>,{' '}
            <em>Speed: ...</em>), <strong>Requirements</strong>, dan <strong>Development Log</strong> (baris
            format <em>21 September 2026 - Judul Log</em>). Teks di bawah tiap header akan otomatis masuk ke
            field yang sesuai. Setelah diimpor, kamu tetap bisa review & edit sebelum submit.
          </p>
          <div className="field-block">
            <label>Pilih File (.docx atau .pdf)</label>
            <input type="file" accept=".docx,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="submit-btn" onClick={handleUpload} disabled={loading}>
              {loading ? 'Memproses dokumen...' : 'Import & Isi Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
