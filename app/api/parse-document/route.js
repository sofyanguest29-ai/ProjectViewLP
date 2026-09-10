import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

export const runtime = 'nodejs'

const HEADER_KEYWORDS = {
  objective: 'objective',
  expected_result: 'expected result',
  requirements: 'requirements',
  development_log: 'development log',
  impact_measurement: 'impact measurement',
}

function normalizeLine(line) {
  return line.trim().replace(/[:：]+$/, '').toLowerCase()
}

function matchHeader(line) {
  const norm = normalizeLine(line)
  for (const [key, keyword] of Object.entries(HEADER_KEYWORDS)) {
    if (norm === keyword) return key
  }
  return null
}

// Parse baris-baris "Development Log" jadi { log_date, title, status }
// Menerima format tanggal fleksibel: "21 September 2026 - Judul", "21/09/2026 Judul", dst.
function parseDevelopmentLogLines(lines) {
  const MONTHS = [
    'januari', 'february', 'februari', 'march', 'maret', 'april', 'may', 'mei', 'june', 'juni',
    'july', 'juli', 'august', 'agustus', 'september', 'october', 'oktober', 'november', 'december', 'desember',
  ]
  const monthMap = {
    januari: 0, january: 0, februari: 1, february: 1, maret: 2, march: 2, april: 3,
    mei: 4, may: 4, juni: 5, june: 5, juli: 6, july: 6, agustus: 7, august: 7,
    september: 8, oktober: 9, october: 9, november: 10, desember: 11, december: 11,
  }

  const logs = []
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Format: "21 September 2026 - Judul" atau "21 September 2026 Judul"
    const textDateMatch = line.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})\s*[-–—:]?\s*(.*)$/)
    if (textDateMatch) {
      const [, day, monthName, year, title] = textDateMatch
      const monthIdx = monthMap[monthName.toLowerCase()]
      if (monthIdx !== undefined && title.trim()) {
        const date = new Date(Number(year), monthIdx, Number(day))
        logs.push({
          id: `tmp-${logs.length}-${Date.now()}`,
          log_date: date.toISOString().slice(0, 10),
          title: title.trim(),
          status: 'Identify',
          detail: '',
        })
        continue
      }
    }

    // Format: "21/09/2026 - Judul" atau "21-09-2026 Judul"
    const numDateMatch = line.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*[-–—:]?\s*(.*)$/)
    if (numDateMatch) {
      const [, day, month, year, title] = numDateMatch
      if (title.trim()) {
        const date = new Date(Number(year), Number(month) - 1, Number(day))
        logs.push({
          id: `tmp-${logs.length}-${Date.now()}`,
          log_date: date.toISOString().slice(0, 10),
          title: title.trim(),
          status: 'Identify',
          detail: '',
        })
      }
    }
  }
  return logs
}

function parseImpactLines(lines) {
  const impacts = {}
  for (const rawLine of lines) {
    const line = rawLine.trim()
    const match = line.match(/^(cost|accuracy|speed)\s*[:：]\s*(.*)$/i)
    if (match) {
      const [, type, detail] = match
      const label = type[0].toUpperCase() + type.slice(1).toLowerCase()
      impacts[label] = detail.trim()
    }
  }
  return impacts
}

function extractStructuredFields(lines) {
  const nonEmptyLines = lines.map((l) => l.trim()).filter((l) => l.length > 0)
  const title = nonEmptyLines[0] || ''

  const sections = {}
  let currentKey = null
  let buffer = []

  function flush() {
    if (currentKey) {
      sections[currentKey] = buffer.join('\n')
    }
    buffer = []
  }

  for (let i = 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i]
    const headerKey = matchHeader(line)
    if (headerKey) {
      flush()
      currentKey = headerKey
    } else if (currentKey) {
      buffer.push(line)
    }
  }
  flush()

  const impacts = sections.impact_measurement ? parseImpactLines(sections.impact_measurement.split('\n')) : {}
  const developmentLogs = sections.development_log ? parseDevelopmentLogLines(sections.development_log.split('\n')) : []

  return {
    title,
    objective: sections.objective || '',
    expected_result: sections.expected_result || '',
    requirements: sections.requirements ? sections.requirements.replace(/\n/g, '<br/>') : '',
    impacts,
    developmentLogs,
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = file.name || ''
    const isDocx = fileName.toLowerCase().endsWith('.docx')
    const isPdf = fileName.toLowerCase().endsWith('.pdf')

    let rawText = ''

    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value || ''
    } else if (isPdf) {
      const pdfParse = (await import('pdf-parse')).default
      const result = await pdfParse(buffer)
      rawText = result.text || ''
    } else {
      return NextResponse.json({ error: 'Format file harus .docx atau .pdf' }, { status: 400 })
    }

    const lines = rawText.split('\n')
    const parsed = extractStructuredFields(lines)

    if (!parsed.title) {
      return NextResponse.json({ error: 'Tidak bisa membaca isi dokumen. Pastikan dokumen tidak kosong.' }, { status: 422 })
    }

    return NextResponse.json({ data: parsed })
  } catch (err) {
    console.error('parse-document error', err)
    return NextResponse.json({ error: 'Gagal memproses dokumen: ' + (err.message || 'unknown error') }, { status: 500 })
  }
}
