import { useMemo, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { StatusPill } from './Badge'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  searchText?: (row: T) => string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  searchPlaceholder?: string
  filters?: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }[]
  onRowClick?: (row: T) => void
  selectedRowId?: string
  onAdd?: () => void
  addLabel?: string
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  searchPlaceholder = 'Search…',
  filters = [],
  onRowClick,
  selectedRowId,
  onAdd,
  addLabel = 'Add New',
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      columns.some((col) => {
        const text = col.searchText?.(row)
        return text?.toLowerCase().includes(term)
      }),
    )
  }, [rows, q, columns])

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-[7px] border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,.1)]"
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.label}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="cursor-pointer rounded-[7px] border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text2)] outline-none"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        <span className="whitespace-nowrap text-[11px] text-[var(--text3)]">
          {filtered.length} record{filtered.length === 1 ? '' : 's'}
        </span>
        {onAdd && (
          <Button onClick={onAdd} className="ml-auto">
            {addLabel}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--surface2)]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="border-b-2 border-[var(--border)] px-[11px] py-[7px] text-left text-[9.5px] font-bold tracking-[0.6px] whitespace-nowrap text-[var(--text3)] uppercase"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-[12.5px] text-[var(--text3)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const selected = selectedRowId != null && row.id === selectedRowId
                return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`cursor-pointer transition ${
                    selected
                      ? 'bg-[#e8f0fe] ring-1 ring-inset ring-[var(--accent)]/40'
                      : 'hover:bg-[#f0f5ff]'
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="border-b border-[var(--border)] px-[11px] py-1.5 align-middle text-[var(--text)]"
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function statusColumn<T extends { status: string }>(): Column<T> {
  return {
    key: 'status',
    header: 'Status',
    searchText: (r) => r.status,
    render: (r) => <StatusPill status={r.status} />,
  }
}
