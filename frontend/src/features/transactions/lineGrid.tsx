import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ApiMasterRow } from '@/api/masters'
import { fetchAvailableStock, fetchStockMap } from '@/api/transactions'
import { Input, Select } from '@/components/ui/Field'

/** Fields every document line grid shares. */
export type BaseLine = {
  /** Stable key for React; not sent to the API. */
  key: string
  itemId: string
  itemCode: string
  itemName: string
  uomId: string
  availableStock: string
  locationId: string
  remark: string
}

let lineSeq = 0
export function newLineKey() {
  lineSeq += 1
  return `ln-${Date.now()}-${lineSeq}`
}

export function baseLine(): BaseLine {
  return {
    key: newLineKey(),
    itemId: '',
    itemCode: '',
    itemName: '',
    uomId: '',
    availableStock: '',
    locationId: '',
    remark: '',
  }
}

export const gridCell = 'px-1.5 py-1 text-[12px]'
export const gridHeadCell =
  'border-b-2 border-[var(--border)] px-2 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase'

/** Table header label with optional required asterisk (item line grids). */
export function gridHeadLabel(label: string, required = false) {
  return required ? (
    <>
      {label}
      <span className="text-[var(--danger)]"> *</span>
    </>
  ) : (
    label
  )
}
export const gridInput = 'px-2 py-1 text-[12px] truncate'
export const gridInputRight = 'px-2 py-1 text-right text-[12px] truncate'

export function toNum(value: string | number | undefined | null) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Formats a numeric string for display without turning an empty cell into 0. */
export function money(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function useItemIndex(items: ApiMasterRow[]) {
  return useMemo(() => new Map(items.map((i) => [String(i.code ?? '').toUpperCase(), i])), [items])
}

export function useCodeIndex(rows: ApiMasterRow[]) {
  return useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])
}

/**
 * Per-line available-stock lookup. Each line keeps its own request token so a
 * slow response cannot overwrite a newer item selection on the same row.
 * Pass freeOnly for Transfer so allotted/issued assets are excluded.
 */
export function useStockLookup(
  onResolved: (key: string, qty: number) => void,
  opts?: { freeOnly?: boolean },
) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const tokens = useRef<Record<string, number>>({})
  const freeOnly = opts?.freeOnly === true

  const lookup = useCallback(
    async (key: string, itemId: number, locationId: string, batchLotNo?: string) => {
      const token = (tokens.current[key] ?? 0) + 1
      tokens.current[key] = token
      setLoading((p) => ({ ...p, [key]: true }))
      try {
        const qty = await fetchAvailableStock(
          itemId,
          locationId ? Number(locationId) : undefined,
          batchLotNo,
          freeOnly ? { freeOnly: true } : undefined,
        )
        if (tokens.current[key] === token) onResolved(key, qty)
      } catch {
        if (tokens.current[key] === token) onResolved(key, 0)
      } finally {
        setLoading((p) => ({ ...p, [key]: false }))
      }
    },
    [onResolved, freeOnly],
  )

  return { loading, lookup }
}

export function applyItemMaster(
  item: ApiMasterRow,
  locationId?: string,
): Pick<BaseLine, 'itemId' | 'itemCode' | 'itemName' | 'uomId' | 'locationId'> {
  return {
    itemId: item.id,
    itemCode: String(item.code ?? ''),
    itemName: String(item.name ?? ''),
    uomId: String(item.uom ?? ''),
    locationId: locationId || String(item.store ?? ''),
  }
}

/** Fill blank display fields on loaded lines from the item master (or API enrichment). */
export function enrichLinesFromItems<T extends BaseLine>(lines: T[], items: ApiMasterRow[]): T[] {
  if (items.length === 0) return lines
  let changed = false
  const next = lines.map((l) => {
    if (!l.itemId) return l
    const item = items.find((i) => String(i.id) === String(l.itemId))
    if (!item) return l
    const patch = {
      itemCode: l.itemCode || String(item.code ?? ''),
      itemName: l.itemName || String(item.name ?? ''),
      uomId: l.uomId || String(item.uom ?? ''),
    }
    if (patch.itemCode === l.itemCode && patch.itemName === l.itemName && patch.uomId === l.uomId) {
      return l
    }
    changed = true
    return { ...l, ...patch }
  })
  return changed ? next : lines
}

/** Loads available stock for item pickers; refreshes on store change, focus, and after stock posts. */
export function useLocationStock(locationId: string | undefined | null, refreshMs = 20_000) {
  const [stockByItemId, setStockByItemId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  const scopedId =
    locationId && /^\d+$/.test(String(locationId)) ? Number(locationId) : undefined

  useEffect(() => {
    // Never pull the full stock table — only fetch when a store is selected.
    if (scopedId == null) {
      setStockByItemId({})
      setReady(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const map = await fetchStockMap({ locationId: scopedId })
        if (!cancelled) {
          setStockByItemId(map)
          setReady(true)
        }
      } catch {
        if (!cancelled) {
          setStockByItemId({})
          setReady(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [scopedId, tick])

  useEffect(() => {
    if (scopedId == null) return
    const onStock = () => refresh()
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('caits:stock-changed', onStock)
    window.addEventListener('focus', onStock)
    document.addEventListener('visibilitychange', onVis)
    const id = window.setInterval(refresh, refreshMs)
    return () => {
      window.removeEventListener('caits:stock-changed', onStock)
      window.removeEventListener('focus', onStock)
      document.removeEventListener('visibilitychange', onVis)
      window.clearInterval(id)
    }
  }, [refresh, refreshMs, scopedId])

  return { stockByItemId, loading, ready, refresh }
}

/** Item / stock counts are always whole units — never show decimals. */
export function formatStockQty(qty: number) {
  if (!Number.isFinite(qty)) return '0'
  return Math.round(qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

/** Plain whole-number string for form state / number inputs (no grouping). */
export function wholeQtyStr(qty: number | string | null | undefined): string {
  if (qty === '' || qty == null) return ''
  const n = Number(qty)
  if (!Number.isFinite(n)) return ''
  return String(Math.round(n))
}

/** Label for item selects / datalist entries with on-hand and home location. */
export function itemOptionLabel(
  item: ApiMasterRow,
  stockByItemId?: Record<string, number>,
  ready = true,
  locationLabel?: string,
) {
  const code = String(item.code ?? '')
  const name = String(item.name ?? '')
  let base = name ? `${code} – ${name}` : code
  if (locationLabel) base = `${base} @ ${locationLabel}`
  if (!stockByItemId || !ready) return base
  const qty = stockByItemId[item.id]
  const shown = qty == null ? 0 : qty
  return `${base} (Stock: ${formatStockQty(shown)})`
}

/** Shared `<datalist>` of item codes so line grids get type-ahead search. */
export function ItemCodeOptions({
  id,
  items,
  stockByItemId,
  locationByItemId,
}: {
  id: string
  items: ApiMasterRow[]
  stockByItemId?: Record<string, number>
  locationByItemId?: Record<string, string>
}) {
  return (
    <datalist id={id}>
      {items.map((i) => (
        <option key={i.id} value={String(i.code ?? '')}>
          {itemOptionLabel(i, stockByItemId, true, locationByItemId?.[i.id]).replace(
            `${String(i.code ?? '')} – `,
            '',
          )}
        </option>
      ))}
    </datalist>
  )
}

/**
 * Filterable item `<Select>` for pick bars (GRN / Opening / Gatepass / Transfer).
 * Search matches code, name, and optional home-location label.
 */
export function SearchableItemSelect({
  value,
  onChange,
  items,
  options,
  stockByItemId,
  stockReady = true,
  locationByItemId,
  disabled,
  invalid,
  placeholder = '— Select Item —',
  className,
}: {
  value: string
  onChange: (itemId: string) => void
  items?: ApiMasterRow[]
  /** When set, drives the dropdown instead of building labels from `items`. */
  options?: { value: string; label: string }[]
  stockByItemId?: Record<string, number>
  stockReady?: boolean
  locationByItemId?: Record<string, string>
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  className?: string
}) {
  const [filter, setFilter] = useState('')
  const catalog = useMemo(() => {
    if (options) return options
    return (items ?? []).map((i) => ({
      value: i.id,
      label: itemOptionLabel(i, stockByItemId, stockReady, locationByItemId?.[i.id]),
    }))
  }, [options, items, stockByItemId, stockReady, locationByItemId])
  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase()
    if (!term) return catalog
    return catalog.filter((o) => o.label.toLowerCase().includes(term))
  }, [catalog, filter])
  const selected = catalog.find((o) => o.value === value)

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search item / location…"
        disabled={disabled}
        className={className ?? gridInput}
      />
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        invalid={invalid}
        className={className ?? gridInput}
      >
        <option value="">{placeholder}</option>
        {filtered.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {value && selected && !filtered.some((o) => o.value === value) && (
          <option value={value}>{selected.label}</option>
        )}
      </Select>
    </div>
  )
}

export type FilterableOption = {
  value: string
  label: string
  /** Extra text included in search matching (defaults to label). */
  searchText?: string
}

/**
 * Compact searchable dropdown — one control with a filterable panel (works inside table cells).
 */
export function FilterableLookup({
  value,
  onChange,
  options,
  disabled,
  invalid,
  placeholder = '— Select —',
  searchPlaceholder = 'Search…',
  className,
  maxVisible = 80,
}: {
  value: string
  onChange: (value: string) => void
  options: FilterableOption[]
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  maxVisible?: number
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = term
      ? options.filter((o) => (o.searchText ?? o.label).toLowerCase().includes(term))
      : options
    return list.slice(0, maxVisible)
  }, [options, query, maxVisible])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative min-w-[200px]">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen((v) => !v)
        }}
        className={`flex w-full items-center justify-between gap-1 rounded border bg-[var(--surface)] px-2 py-1 text-left text-[12px] truncate ${
          invalid ? 'border-[var(--danger)]' : 'border-[var(--border)]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[var(--accent)]'} ${className ?? ''}`}
      >
        <span className={`truncate ${selected ? 'text-[var(--text)]' : 'text-[var(--text3)]'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="shrink-0 text-[10px] text-[var(--text3)]">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-0.5 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          <div className="border-b border-[var(--border)] p-1.5">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="px-2 py-1 text-[12px]"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
                if (e.key === 'Enter' && filtered[0]) pick(filtered[0].value)
              }}
            />
          </div>
          <ul
            role="listbox"
            className="max-h-[220px] overflow-y-auto py-0.5 text-[12px]"
          >
            {filtered.length === 0 ? (
              <li className="px-2.5 py-2 text-[var(--text3)]">No matches</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value} role="option" aria-selected={o.value === value}>
                  <button
                    type="button"
                    className={`block w-full truncate px-2.5 py-1.5 text-left hover:bg-[var(--surface2)] ${
                      o.value === value ? 'bg-[#f0f5ff] font-medium text-[var(--accent)]' : ''
                    }`}
                    onClick={() => pick(o.value)}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
          {options.length > maxVisible && !query.trim() && (
            <div className="border-t border-[var(--border)] px-2.5 py-1 text-[10px] text-[var(--text3)]">
              Showing {filtered.length} of {options.length} — type to search
            </div>
          )}
          {query.trim() && filtered.length >= maxVisible && (
            <div className="border-t border-[var(--border)] px-2.5 py-1 text-[10px] text-[var(--text3)]">
              First {maxVisible} matches — refine your search
            </div>
          )}
        </div>
      )}
    </div>
  )
}
