import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { downloadCsvTemplate, readCsvFile } from '@/lib/csvImport'

type Props = {
  label?: string
  templateFilename: string
  templateHeaders: string[]
  sampleRow?: string[]
  disabled?: boolean
  onRows: (rows: Record<string, string>[]) => void | Promise<void>
}

export function CsvImportButton({
  label = 'Import CSV',
  templateFilename,
  templateHeaders,
  sampleRow,
  disabled,
  onRows,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onPick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const rows = await readCsvFile(file)
      if (rows.length === 0) {
        alert('No data rows found in the file. Use the template and add rows below the header.')
        return
      }
      await onRows(rows)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to read CSV file')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
      <Button
        variant="ghost"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? 'Importing…' : label}
      </Button>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => downloadCsvTemplate(templateFilename, templateHeaders, sampleRow)}
        className="text-[11px] font-semibold text-[var(--accent)] underline disabled:opacity-40"
      >
        Download template
      </button>
    </div>
  )
}
