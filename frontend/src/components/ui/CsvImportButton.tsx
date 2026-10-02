import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { downloadCsvTemplate, readCsvFile } from '@/lib/csvImport'

type TemplateLink = {
  label: string
  filename: string
  headers: string[]
  sampleRow?: string[] | string[][]
}

type Props = {
  label?: string
  templateFilename: string
  templateHeaders: string[]
  sampleRow?: string[] | string[][]
  extraTemplates?: TemplateLink[]
  disabled?: boolean
  onRows: (rows: Record<string, string>[]) => void | Promise<void>
}

export function CsvImportButton({
  label = 'Import CSV',
  templateFilename,
  templateHeaders,
  sampleRow,
  extraTemplates = [],
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
      {extraTemplates.length === 0 ? (
        <Button
          type="button"
          variant="ghost"
          disabled={disabled || busy}
          onClick={() => downloadCsvTemplate(templateFilename, templateHeaders, sampleRow)}
        >
          Download template
        </Button>
      ) : (
        extraTemplates.map((t) => (
          <Button
            key={t.filename}
            type="button"
            variant="ghost"
            disabled={disabled || busy}
            onClick={() => downloadCsvTemplate(t.filename, t.headers, t.sampleRow)}
          >
            {t.label}
          </Button>
        ))
      )}
    </div>
  )
}
