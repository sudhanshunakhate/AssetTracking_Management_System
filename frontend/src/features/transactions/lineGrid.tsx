import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ApiMasterRow } from '@/api/masters'
import { fetchAvailableStock, fetchStockMapForLocation } from '@/api/transactions'

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
export const gridInput = 'px-2 py-1 text-[12px]'
export const gridInputRight = 'px-2 py-1 text-right text-[12px]'

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
 */
export function useStockLookup(onResolved: (key: string, qty: number) => void) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const tokens = useRef<Record<string, number>>({})

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
        )
        if (tokens.current[key] === token) onResolved(key, qty)
      } catch {
        if (tokens.current[key] === token) onResolved(key, 0)
      } finally {
        setLoading((p) => ({ ...p, [key]: false }))
      }
    },
    [onResolved],
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

/** Loads available stock for every item at a store; used to annotate item pickers. */
export function useLocationStock(locationId: string | undefined | null) {
  const [stockByItemId, setStockByItemId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!locationId || !/^\d+$/.test(locationId)) {
      setStockByItemId({})
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const map = await fetchStockMapForLocation(Number(locationId))
        if (!cancelled) setStockByItemId(map)
      } catch {
        if (!cancelled) setStockByItemId({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [locationId])

  return { stockByItemId, loading }
}

export function formatStockQty(qty: number) {
  return qty.toLocaleString('en-IN', { maximumFractionDigits: 3 })
}

/** Label for item selects / datalist entries with on-hand at the chosen location. */
export function itemOptionLabel(item: ApiMasterRow, stockByItemId?: Record<string, number>) {
  const code = String(item.code ?? '')
  const name = String(item.name ?? '')
  const base = name ? `${code} – ${name}` : code
  if (!stockByItemId) return base
  const qty = stockByItemId[item.id]
  const shown = qty == null ? 0 : qty
  return `${base} (Stock: ${formatStockQty(shown)})`
}

/** Shared `<datalist>` of item codes so line grids get type-ahead search. */
export function ItemCodeOptions({
  id,
  items,
  stockByItemId,
}: {
  id: string
  items: ApiMasterRow[]
  stockByItemId?: Record<string, number>
}) {
  return (
    <datalist id={id}>
      {items.map((i) => (
        <option key={i.id} value={String(i.code ?? '')}>
          {itemOptionLabel(i, stockByItemId).replace(`${String(i.code ?? '')} – `, '')}
        </option>
      ))}
    </datalist>
  )
}
