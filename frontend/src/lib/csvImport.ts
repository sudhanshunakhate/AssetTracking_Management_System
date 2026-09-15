import { downloadCsv } from '@/lib/csvExport'

/** Normalize CSV header keys: lowercase, strip BOM / punctuation / trailing *. */
export function normalizeCsvKey(key: string) {
  return key
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\*$/, '')
    .replace(/[^a-z0-9]/g, '')
}

function countUnquoted(line: string, delimiter: string) {
  let n = 0
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuotes = !inQuotes
    else if (!inQuotes && ch === delimiter) n++
  }
  return n
}

function detectDelimiter(headerLine: string) {
  const candidates: Array<[string, number]> = [
    [',', countUnquoted(headerLine, ',')],
    [';', countUnquoted(headerLine, ';')],
    ['\t', countUnquoted(headerLine, '\t')],
  ]
  candidates.sort((a, b) => b[1] - a[1])
  return candidates[0][1] > 0 ? candidates[0][0] : ','
}

/** Parse CSV text into row objects (first row = headers). */
export function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return []

  const delimiter = detectDelimiter(lines[0])
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeCsvKey)
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter)
    if (cells.every((c) => c.trim() === '')) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      if (h) row[h] = (cells[idx] ?? '').trim()
    })
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line: string, delimiter = ','): string[] {
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
    } else if (ch === delimiter) {
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
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    throw new Error(
      'This is an Excel workbook (.xlsx), not a CSV. In Excel use File → Save As → CSV UTF-8 (Comma delimited).',
    )
  }
  return parseCsvText(new TextDecoder('utf-8').decode(bytes))
}

export function downloadCsvTemplate(filename: string, headers: string[], sampleRow?: string[]) {
  downloadCsv(filename, headers, sampleRow ? [sampleRow] : [])
}
