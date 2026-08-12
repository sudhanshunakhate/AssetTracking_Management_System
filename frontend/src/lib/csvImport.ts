import { downloadCsv } from '@/lib/csvExport'

/** Normalize CSV header keys: lowercase, strip BOM, trim, remove trailing * */
export function normalizeCsvKey(key: string) {
  return key.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\*$/, '')
}

/** Parse CSV text into row objects (first row = headers). */
export function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map(normalizeCsvKey)
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    if (cells.every((c) => c.trim() === '')) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      if (h) row[h] = (cells[idx] ?? '').trim()
    })
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export async function readCsvFile(file: File): Promise<Record<string, string>[]> {
  const text = await file.text()
  return parseCsvText(text)
}

export function downloadCsvTemplate(filename: string, headers: string[], sampleRow?: string[]) {
  downloadCsv(filename, headers, sampleRow ? [sampleRow] : [])
}
