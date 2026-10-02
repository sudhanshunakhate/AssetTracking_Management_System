import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export type MasterImportDraftBase = {
  key: string
  sourceRow: number
  error: string
}

export type MasterImportResult = {
  created: number
  failed: Array<{ row: number; message: string }>
}

type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
}

type Props<T extends MasterImportDraftBase> = {
  drafts: T[]
  columns: Column<T>[]
  saving?: boolean
  result?: MasterImportResult | null
  onRemove: (key: string) => void
  onClear: () => void
  onSave: () => void
}

export function MasterCsvImportPanel<T extends MasterImportDraftBase>({
  drafts,
  columns,
  saving = false,
  result = null,
  onRemove,
  onClear,
  onSave,
}: Props<T>) {
  if (drafts.length === 0 && !result) return null

  const validCount = drafts.filter((r) => !r.error).length
  const invalidCount = drafts.filter((r) => r.error).length

  return (
    <Card className="mb-3">
      {drafts.length > 0 && (
        <>
          <CardHeader
            title="CSV preview"
            subtitle={`${drafts.length} row(s) loaded — ${validCount} ready to save, ${invalidCount} with errors. Review and remove rows, then Save.`}
          />
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--surface2)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text2)]">
                    <th className="w-[54px] px-2 py-2 text-center">Action</th>
                    {columns.map((c) => (
                      <th key={c.key} className="px-2 py-2">
                        {c.header}
                      </th>
                    ))}
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((r) => (
                    <tr key={r.key} className="border-t border-[var(--border)] align-middle text-[12px]">
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          aria-label={`Remove row ${r.sourceRow}`}
                          disabled={saving}
                          onClick={() => onRemove(r.key)}
                          className="rounded px-1.5 text-[14px] leading-none text-[var(--text3)] transition hover:text-[var(--danger)] disabled:opacity-40"
                        >
                          ×
                        </button>
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className="px-2 py-1.5">
                          {c.render(r)}
                        </td>
                      ))}
                      <td className={`px-2 py-1.5 ${r.error ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
                        {r.error || 'Ready'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-3 py-2">
              <Button variant="ghost" disabled={saving} onClick={onClear}>
                Clear
              </Button>
              <Button disabled={saving || validCount === 0} onClick={() => void onSave()}>
                {saving ? 'Saving…' : `Save ${validCount} row${validCount === 1 ? '' : 's'}`}
              </Button>
            </div>
          </CardBody>
        </>
      )}
      {result && (
        <CardBody className={drafts.length > 0 ? 'border-t border-[var(--border)]' : undefined}>
          <div className="text-[12.5px] text-[var(--text2)]">
            Import finished — <span className="font-semibold text-[var(--accent)]">{result.created}</span> created
            {result.failed.length > 0 && (
              <>
                , <span className="font-semibold text-[var(--danger)]">{result.failed.length}</span> failed
              </>
            )}
            .
          </div>
          {result.failed.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-[12px] text-[var(--danger)]">
              {result.failed.slice(0, 8).map((f) => (
                <li key={`${f.row}-${f.message}`}>
                  Row {f.row}: {f.message}
                </li>
              ))}
              {result.failed.length > 8 && <li>…and {result.failed.length - 8} more</li>}
            </ul>
          )}
        </CardBody>
      )}
    </Card>
  )
}
