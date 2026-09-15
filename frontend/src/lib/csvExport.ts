/** Download tabular data as a CSV file (UTF-8 with BOM for Excel). */

function escapeCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown> | Record<string, unknown>>,
  keys?: string[],
) {
  const cols = keys ?? headers
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => {
      if (Array.isArray(row)) return row.map(escapeCell).join(',')
      return cols.map((k) => escapeCell((row as Record<string, unknown>)[k])).join(',')
    }),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Scroll the first invalid control into view after a failed save. */
export function scrollToFirstInvalid() {
  requestAnimationFrame(() => {
    const el =
      document.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      document.querySelector<HTMLElement>('.border-\\[var\\(--danger\\)\\]')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus?.()
  })
}

export function confirmClearForm(): boolean {
  return window.confirm('Clear all fields? Unsaved changes will be lost.')
}

export function confirmSubmit(label = 'Submit this document?'): boolean {
  return window.confirm(label)
}
