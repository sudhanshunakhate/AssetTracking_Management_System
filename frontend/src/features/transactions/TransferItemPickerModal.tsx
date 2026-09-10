import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { ApiMasterRow } from '@/api/masters'
import {
  fetchAvailableSerialsAtLocation,
  fetchFreeStockSummary,
  type AvailableSerialUnit,
  type ItemLocationStock,
} from '@/api/transactions'
import { locLabel } from './txnLookups'
import {
  buildRequisitionPickerRows,
  type RequisitionPickerRow,
} from './RequisitionItemPickerModal'
import { formatStockQty, useCodeIndex, wholeQtyStr } from './lineGrid'
import type { ItemKind } from './TransferItemLines'

/** One unit / qty line produced by the picker. */
export type TransferPickerLine = {
  itemId: string
  locationId: string
  stock: number
  qty: string
  itemKind: ItemKind
  serial?: AvailableSerialUnit
}

export type TransferPickerBatch = {
  fromLocationId: string
  toLocationId: string
  lines: TransferPickerLine[]
}

/** @deprecated */
export type TransferPickerResult = TransferPickerBatch & {
  itemKind: ItemKind
  itemId: string
  locationId: string
  serial?: AvailableSerialUnit
  stock: number
}

type Step = 'from' | 'type' | 'item' | 'to'
type TypeFilter = 'all' | ItemKind

type RowPick = {
  row: RequisitionPickerRow
  kind: ItemKind
  /** Requested transfer qty (capped by stock). */
  qty: number
  /** Asset: chosen serials (length should equal qty). */
  serials: AvailableSerialUnit[]
}

const headCell =
  'sticky top-0 z-10 border-b-2 border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap'
const bodyCell = 'border-b border-[var(--border)] px-3 py-2 text-[12px] align-middle'

function kindOf(item: ApiMasterRow): ItemKind {
  return String(item.itemType ?? '').toLowerCase() === 'consumable' ? 'consumable' : 'asset'
}

function clampQty(qty: number, stock: number) {
  if (!Number.isFinite(qty) || qty < 0) return 0
  if (!Number.isFinite(stock) || stock <= 0) return 0
  return Math.min(Math.floor(qty), Math.floor(stock))
}

/**
 * Multi-step transfer picker:
 * From Location → Type filter → Items (qty ≤ stock; assets need matching serials) → To Location
 */
export function TransferItemPickerModal({
  open,
  onClose,
  onComplete,
  fromLocations,
  toLocations,
  items,
  units,
  locations,
  initialFromId = '',
  initialToId = '',
}: {
  open: boolean
  onClose: () => void
  onComplete: (batch: TransferPickerBatch) => void
  fromLocations: ApiMasterRow[]
  toLocations: ApiMasterRow[]
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  initialFromId?: string
  initialToId?: string
  initialKind?: ItemKind
}) {
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)

  const [step, setStep] = useState<Step>('from')
  const [search, setSearch] = useState('')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [serialByKey, setSerialByKey] = useState<Record<string, AvailableSerialUnit[]>>({})
  const [serialsLoaded, setSerialsLoaded] = useState(false)
  const [allStock, setAllStock] = useState<ItemLocationStock[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [picks, setPicks] = useState<Record<string, RowPick>>({})

  useEffect(() => {
    if (!open) return
    setSearch('')
    setFromId(initialFromId)
    setToId(initialToId)
    setTypeFilter('all')
    setPicks({})
    setSerialByKey({})
    setSerialsLoaded(false)
    setStep('from')
  }, [open, initialFromId, initialToId])

  const pickerLocationIdsKey = useMemo(
    () =>
      [...fromLocations, ...toLocations]
        .map((l) => String(l.id))
        .filter(Boolean)
        .sort()
        .join(','),
    [fromLocations, toLocations],
  )

  useEffect(() => {
    if (!open) {
      setAllStock([])
      setSerialByKey({})
      setSerialsLoaded(false)
      return
    }
    const locIds = pickerLocationIdsKey
      ? pickerLocationIdsKey.split(',').map((id) => Number(id)).filter((n) => Number.isFinite(n))
      : []
    let cancelled = false
    setStockLoading(true)
    ;(async () => {
      try {
        const rows = await fetchFreeStockSummary(locIds.length ? locIds : undefined)
        if (!cancelled) {
          setAllStock(rows)
          setStockLoading(false)
        }
      } catch {
        if (!cancelled) {
          setAllStock([])
          setStockLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, pickerLocationIdsKey])

  const globalStock = useMemo(
    () => (fromId ? allStock.filter((r) => r.locationId === fromId) : []),
    [allStock, fromId],
  )

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const itemsByLocationId = useMemo(() => {
    const map = new Map<string, { names: string[]; count: number }>()
    const qtyByLocItem = new Map<string, number>()
    for (const r of allStock) {
      if (r.qty <= 0) continue
      const key = `${r.locationId}|${r.itemId}`
      qtyByLocItem.set(key, (qtyByLocItem.get(key) ?? 0) + r.qty)
    }
    for (const [key, qty] of qtyByLocItem) {
      const [locationId, itemId] = key.split('|')
      const item = itemById.get(itemId)
      if (!item || item.status === 'Inactive') continue
      const label = String(item.name ?? item.code ?? itemId).trim() || itemId
      const withQty = `${label} (${formatStockQty(qty)})`
      const cur = map.get(locationId) ?? { names: [], count: 0 }
      cur.names.push(withQty)
      cur.count += 1
      map.set(locationId, cur)
    }
    for (const entry of map.values()) {
      entry.names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    }
    return map
  }, [allStock, itemById])

  const typeStockSummary = useMemo(() => {
    const assetIds = new Set<string>()
    const consumableIds = new Set<string>()
    let assetQty = 0
    let consumableQty = 0
    for (const r of globalStock) {
      if (r.qty <= 0) continue
      const item = itemById.get(r.itemId)
      if (!item || item.status === 'Inactive') continue
      if (kindOf(item) === 'consumable') {
        consumableIds.add(r.itemId)
        consumableQty += r.qty
      } else {
        assetIds.add(r.itemId)
        assetQty += r.qty
      }
    }
    return {
      assetItems: assetIds.size,
      assetQty,
      consumableItems: consumableIds.size,
      consumableQty,
      totalItems: assetIds.size + consumableIds.size,
      totalQty: assetQty + consumableQty,
    }
  }, [globalStock, itemById])

  const scopedItems = useMemo(() => {
    return items.filter((i) => {
      if (i.status === 'Inactive') return false
      if (typeFilter === 'all') return true
      return kindOf(i) === typeFilter
    })
  }, [items, typeFilter])

  const baseItemRows = useMemo(
    () =>
      buildRequisitionPickerRows(
        scopedItems,
        globalStock,
        fromId ? new Set([fromId]) : new Set(),
        locationById,
        unitById,
        { stockedOnly: true },
      ).map((r) => {
        const item = itemById.get(r.itemId)
        return { ...r, itemType: item ? kindOf(item) : r.itemType }
      }),
    [scopedItems, globalStock, fromId, locationById, unitById, itemById],
  )

  /** Asset available qty = serials with on-hand stock at From (after serials load). */
  const itemRows = useMemo(() => {
    return baseItemRows
      .map((r) => {
        const kind = String(r.itemType).toLowerCase() === 'consumable' ? 'consumable' : 'asset'
        if (kind !== 'asset') return r
        if (!(r.key in serialByKey)) return r
        return { ...r, stock: (serialByKey[r.key] ?? []).length }
      })
      .filter((r) => Number(r.stock) > 0 || (String(r.itemType).toLowerCase() !== 'consumable' && !serialsLoaded))
  }, [baseItemRows, serialByKey, serialsLoaded])

  useEffect(() => {
    if (!open || step !== 'item' || !fromId) return
    let cancelled = false
    setSerialsLoaded(false)
    ;(async () => {
      try {
        const units = await fetchAvailableSerialsAtLocation(Number(fromId))
        if (cancelled) return
        const next: Record<string, AvailableSerialUnit[]> = {}
        for (const r of baseItemRows) {
          if (String(r.itemType).toLowerCase() === 'consumable') continue
          next[r.key] = units.filter((u) => String(u.itemId) === String(r.itemId))
        }
        setSerialByKey(next)
        setSerialsLoaded(true)
      } catch {
        if (!cancelled) {
          setSerialByKey({})
          setSerialsLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, fromId, baseItemRows.map((r) => r.key).join('|')])

  const filteredLocations = useMemo(() => {
    const list = step === 'to' ? toLocations.filter((l) => l.id !== fromId) : fromLocations
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((l) => {
      const itemsLabel = (itemsByLocationId.get(l.id)?.names ?? []).join(' ')
      return `${l.code ?? ''} ${l.name ?? ''} ${itemsLabel}`.toLowerCase().includes(term)
    })
  }, [step, fromLocations, toLocations, fromId, search, itemsByLocationId])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = itemRows.filter((r) => {
      // Hide assets with no transferable serials once serials are known.
      if (String(r.itemType).toLowerCase() !== 'consumable' && serialsLoaded && Number(r.stock) <= 0) {
        return false
      }
      return true
    })
    if (!term) return rows
    return rows.filter((r) => {
      const serials = (serialByKey[r.key] ?? []).map((u) => String(u.serialNo ?? '')).join(' ')
      return `${r.itemCode} ${r.itemName} ${r.uomCode} ${r.itemType} ${serials}`
        .toLowerCase()
        .includes(term)
    })
  }, [itemRows, search, serialByKey, serialsLoaded])

  const pickList = useMemo(() => Object.values(picks).filter((p) => p.qty > 0), [picks])

  const selectedUnitCount = useMemo(
    () => pickList.reduce((s, p) => s + p.qty, 0),
    [pickList],
  )

  const availableForPick = (p: RowPick) => {
    if (p.kind === 'asset' && p.row.key in serialByKey) {
      return (serialByKey[p.row.key] ?? []).length
    }
    return Math.floor(Number(p.row.stock) || 0)
  }

  const selectionErrors = useMemo(() => {
    const errs: string[] = []
    for (const p of pickList) {
      const stock = availableForPick(p)
      if (p.qty > stock) {
        errs.push(`${p.row.itemCode}: qty exceeds available stock (${formatStockQty(stock)})`)
      }
      if (p.kind === 'asset') {
        if (p.serials.length !== p.qty) {
          errs.push(
            `${p.row.itemCode}: select exactly ${p.qty} serial number${p.qty === 1 ? '' : 's'} (selected ${p.serials.length})`,
          )
        }
      }
    }
    return errs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickList, serialByKey])

  const canContinueItems = pickList.length > 0 && selectionErrors.length === 0

  const fromLabel = fromId
    ? (() => {
        const loc = locationById.get(fromId)
        return loc ? locLabel(loc) : fromId
      })()
    : ''

  const buildLines = (): TransferPickerLine[] => {
    const lines: TransferPickerLine[] = []
    for (const p of pickList) {
      const stock = availableForPick(p)
      if (p.kind === 'asset') {
        for (const serial of p.serials) {
          lines.push({
            itemId: p.row.itemId,
            locationId: p.row.locationId || fromId,
            stock,
            qty: '1',
            itemKind: 'asset',
            serial,
          })
        }
      } else {
        lines.push({
          itemId: p.row.itemId,
          locationId: p.row.locationId || fromId,
          stock,
          qty: wholeQtyStr(p.qty),
          itemKind: 'consumable',
        })
      }
    }
    return lines
  }

  const complete = (destinationId: string) => {
    if (!fromId || !canContinueItems) return
    onComplete({
      fromLocationId: fromId,
      toLocationId: destinationId,
      lines: buildLines(),
    })
  }

  const setRowQty = (row: RequisitionPickerRow, kind: ItemKind, raw: string) => {
    const stock = Math.floor(Number(row.stock) || 0)
    const qty = clampQty(Number(raw), stock)
    setPicks((prev) => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[row.key]
        return next
      }
      const existing = prev[row.key]
      const serials = (existing?.serials ?? []).slice(0, qty)
      next[row.key] = { row, kind, qty, serials }
      return next
    })
  }

  const toggleSerial = (row: RequisitionPickerRow, kind: ItemKind, serial: AvailableSerialUnit) => {
    const stock = Math.floor(Number(row.stock) || 0)
    const sn = String(serial.serialNo ?? '')
    setPicks((prev) => {
      const existing = prev[row.key] ?? { row, kind, qty: 0, serials: [] as AvailableSerialUnit[] }
      const has = existing.serials.some((s) => String(s.serialNo ?? '') === sn)
      let serials: AvailableSerialUnit[]
      if (has) {
        serials = existing.serials.filter((s) => String(s.serialNo ?? '') !== sn)
      } else {
        if (existing.serials.length >= stock) return prev
        // If qty not set yet, grow qty with each serial (capped by stock)
        const maxQty = existing.qty > 0 ? existing.qty : stock
        if (existing.serials.length >= maxQty && existing.qty > 0) {
          // allow growing qty up to stock when adding another serial
          if (existing.qty >= stock) return prev
          serials = [...existing.serials, serial]
          return {
            ...prev,
            [row.key]: { row, kind, qty: serials.length, serials },
          }
        }
        serials = [...existing.serials, serial]
      }
      const qty = Math.max(serials.length, existing.qty > 0 && !has ? existing.qty : serials.length)
      const cappedQty = clampQty(qty, stock)
      const cappedSerials = serials.slice(0, cappedQty)
      if (cappedQty <= 0) {
        const next = { ...prev }
        delete next[row.key]
        return next
      }
      return {
        ...prev,
        [row.key]: { row, kind, qty: cappedQty, serials: cappedSerials },
      }
    })
  }

  const goBack = () => {
    setSearch('')
    if (step === 'type') setStep('from')
    else if (step === 'item') setStep('type')
    else if (step === 'to') setStep('item')
  }

  const searchPlaceholder =
    step === 'from' || step === 'to'
      ? 'Search location, or item name in stock…'
      : step === 'item'
        ? 'Search item code, name, type, or serial…'
        : ''

  const stepTitle: Record<Step, string> = {
    from: '1. Select From Location',
    type: '2. Select Item Type',
    item: '3. Select Items & Quantity',
    to: '4. Select To Location',
  }

  const stepSubtitle: Record<Step, string> = {
    from: 'Operational and system locations for this OU. Free items column shows only transferable qty (not allotted).',
    type: fromLabel
      ? `From location: ${fromLabel}. Choose All, Asset, or Consumable — stock quantities shown below.`
      : 'Choose which item types to transfer.',
    item: fromLabel
      ? `From: ${fromLabel}. Only free (not allotted/issued) stock and serials at this location. Qty cannot exceed Available.`
      : 'Enter quantity for each item (max = available free stock).',
    to: `Transfer ${selectedUnitCount} unit${selectedUnitCount === 1 ? '' : 's'} from ${fromLabel}. Choose any operational or system location (including Damaged / Scrap / Quarantine).`,
  }

  return (
    <Modal
      open={open}
      title={stepTitle[step]}
      subtitle={stepSubtitle[step]}
      onClose={onClose}
      width="max-w-5xl"
      offsetSidebar
      panelClassName="!h-[min(90vh,720px)]"
      bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0"
      footer={
        <>
          <div className="mr-auto flex flex-wrap items-center gap-2 text-[11px] text-[var(--text3)]">
            <StepPill active={step === 'from'} done={Boolean(fromId) && step !== 'from'} label="1. From" />
            <StepPill active={step === 'type'} done={step === 'item' || step === 'to'} label="2. Type" />
            <StepPill active={step === 'item'} done={step === 'to'} label="3. Items" />
            <StepPill active={step === 'to'} done={false} label="4. To" />
          </div>
          {step !== 'from' && (
            <Button variant="ghost" onClick={goBack}>
              ← Back
            </Button>
          )}
          {step === 'item' && (
            <Button onClick={() => { setSearch(''); setStep('to') }} disabled={!canContinueItems}>
              Continue with {selectedUnitCount} unit{selectedUnitCount === 1 ? '' : 's'} →
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      {(fromId || pickList.length > 0) && (
        <div className="shrink-0 border-b border-[var(--border)] bg-[#f8fafc] px-3.5 py-2 text-[11.5px] text-[var(--text2)]">
          {fromId && (
            <span className="mr-3">
              <b>From location:</b> {fromLabel}
            </span>
          )}
          {pickList.length > 0 && (
            <span>
              <b>Selected:</b> {pickList.length} line{pickList.length === 1 ? '' : 's'} ·{' '}
              {selectedUnitCount} unit{selectedUnitCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      {step !== 'type' && (
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            autoFocus
            className="text-[12.5px]"
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {(step === 'from' || step === 'to') && (
          <LocationTable
            rows={filteredLocations}
            selectedId={step === 'from' ? fromId : toId}
            itemsByLocationId={itemsByLocationId}
            loading={stockLoading}
            emptyText={
              search.trim()
                ? 'No locations match your search.'
                : 'No locations found for this Operating Unit.'
            }
            onSelect={(id) => {
              if (step === 'from') {
                setFromId(id)
                setPicks({})
                setSerialByKey({})
                setSerialsLoaded(false)
                setToId((prev) => (prev === id ? '' : prev))
                setSearch('')
                setStep('type')
              } else {
                setToId(id)
                complete(id)
              }
            }}
          />
        )}

        {step === 'type' && (
          <div className="flex flex-col gap-3 p-6">
            {stockLoading ? (
              <div className="text-center text-[12px] text-[var(--text3)]">
                Loading available stock at From location…
              </div>
            ) : (
              <div className="text-center text-[12px] text-[var(--text2)]">
                Available at <b className="text-[var(--text)]">{fromLabel}</b>:{' '}
                <b>{formatStockQty(typeStockSummary.totalQty)}</b> total units across{' '}
                <b>{typeStockSummary.totalItems}</b> items
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TypeCard
                title="All items"
                qtyLabel={formatStockQty(typeStockSummary.totalQty)}
                qtyHint="units in stock"
                detail={
                  stockLoading
                    ? 'Loading…'
                    : `${typeStockSummary.totalItems} item${typeStockSummary.totalItems === 1 ? '' : 's'} (assets + consumables)`
                }
                onClick={() => {
                  setTypeFilter('all')
                  setPicks({})
                  setSearch('')
                  setStep('item')
                }}
              />
              <TypeCard
                title="Asset"
                qtyLabel={stockLoading ? '…' : formatStockQty(typeStockSummary.assetQty)}
                qtyHint="units in stock"
                detail={
                  stockLoading
                    ? 'Loading…'
                    : typeStockSummary.assetItems === 0
                      ? 'No assets with stock here.'
                      : `${typeStockSummary.assetItems} asset item${typeStockSummary.assetItems === 1 ? '' : 's'} — set qty and pick serials`
                }
                onClick={() => {
                  setTypeFilter('asset')
                  setPicks({})
                  setSearch('')
                  setStep('item')
                }}
              />
              <TypeCard
                title="Consumable"
                qtyLabel={stockLoading ? '…' : formatStockQty(typeStockSummary.consumableQty)}
                qtyHint="qty in stock"
                detail={
                  stockLoading
                    ? 'Loading…'
                    : typeStockSummary.consumableItems === 0
                      ? 'No consumables with stock here.'
                      : `${typeStockSummary.consumableItems} consumable item${typeStockSummary.consumableItems === 1 ? '' : 's'} — set qty ≤ stock`
                }
                onClick={() => {
                  setTypeFilter('consumable')
                  setPicks({})
                  setSearch('')
                  setStep('item')
                }}
              />
            </div>
          </div>
        )}

        {step === 'item' && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3.5 py-2">
              <span className="text-[11px] font-semibold text-[var(--text3)]">Show:</span>
              {([
                ['all', 'All'],
                ['asset', 'Asset'],
                ['consumable', 'Consumable'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    typeFilter === value
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface2)] text-[var(--text2)] hover:bg-[#e8efff]'
                  }`}
                  onClick={() => setTypeFilter(value)}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-[var(--text3)]">
                Qty cannot exceed Available Stock
              </span>
            </div>
            {selectionErrors.length > 0 && (
              <div className="border-b border-[var(--danger)]/30 bg-red-50 px-3.5 py-2 text-[11px] text-[var(--danger)]">
                {selectionErrors[0]}
                {selectionErrors.length > 1 ? ` (+${selectionErrors.length - 1} more)` : ''}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ItemQtyTable
                rows={filteredItems}
                loading={stockLoading || !serialsLoaded}
                serialByKey={serialByKey}
                picks={picks}
                onQty={setRowQty}
                onToggleSerial={toggleSerial}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function TypeCard({
  title,
  qtyLabel,
  qtyHint,
  detail,
  onClick,
}: {
  title: string
  qtyLabel: string
  qtyHint: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="min-h-[130px] rounded-lg border-2 border-[var(--border)] px-4 py-4 text-left transition hover:border-[var(--accent)] hover:bg-[#f0f5ff]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[15px] font-semibold text-[var(--text)]">{title}</div>
        <div className="rounded-md bg-[#e8efff] px-2 py-1 text-right">
          <div className="text-[16px] font-bold tabular-nums text-[var(--accent)]">{qtyLabel}</div>
          <div className="text-[9.5px] font-semibold uppercase tracking-wide text-[var(--text3)]">
            {qtyHint}
          </div>
        </div>
      </div>
      <div className="mt-2 text-[12px] text-[var(--text3)]">{detail}</div>
    </button>
  )
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-semibold ${
        active
          ? 'bg-[var(--accent)] text-white'
          : done
            ? 'bg-[#e8efff] text-[var(--accent)]'
            : 'bg-[var(--surface)] text-[var(--text3)]'
      }`}
    >
      {label}
    </span>
  )
}

function LocationTable({
  rows,
  selectedId,
  itemsByLocationId,
  loading,
  emptyText,
  onSelect,
}: {
  rows: ApiMasterRow[]
  selectedId: string
  itemsByLocationId: Map<string, { names: string[]; count: number }>
  loading?: boolean
  emptyText: string
  onSelect: (id: string) => void
}) {
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          <th className={`${headCell} w-[14%]`}>Location code</th>
          <th className={`${headCell} w-[22%]`}>Location name</th>
          <th className={`${headCell} w-[12%]`}>Kind</th>
          <th className={`${headCell} w-[52%]`}>Free items in stock</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={4} className="h-[400px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((l) => {
            const selected = l.id === selectedId
            const kind = l.isSystemLocation ? 'System' : 'Operational'
            const stocked = itemsByLocationId.get(l.id)
            const preview = stocked?.names.slice(0, 6).join(', ') ?? ''
            const more = stocked && stocked.count > 6 ? ` +${stocked.count - 6} more` : ''
            const fullTitle = stocked?.names.join(', ') ?? ''
            return (
              <tr
                key={l.id}
                className={`cursor-pointer transition hover:bg-[#f0f5ff] ${selected ? 'bg-[#e8efff]' : ''}`}
                onClick={() => onSelect(l.id)}
              >
                <td className={`${bodyCell} truncate font-mono font-medium`}>{String(l.code ?? '—')}</td>
                <td className={`${bodyCell} truncate`} title={String(l.name ?? '')}>
                  {String(l.name ?? '—')}
                </td>
                <td className={`${bodyCell} text-[var(--text2)]`}>{kind}</td>
                <td className={`${bodyCell} text-[11.5px] text-[var(--text2)]`} title={fullTitle || undefined}>
                  {loading ? (
                    <span className="text-[var(--text3)]">Loading…</span>
                  ) : stocked && stocked.count > 0 ? (
                    <>
                      <span className="line-clamp-2">{preview}{more}</span>
                      <span className="mt-0.5 block text-[10.5px] font-semibold text-[var(--text3)]">
                        {stocked.count} item{stocked.count === 1 ? '' : 's'}
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--text3)]">No stock</span>
                  )}
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}

function ItemQtyTable({
  rows,
  loading,
  serialByKey,
  picks,
  onQty,
  onToggleSerial,
}: {
  rows: RequisitionPickerRow[]
  loading: boolean
  serialByKey: Record<string, AvailableSerialUnit[]>
  picks: Record<string, RowPick>
  onQty: (row: RequisitionPickerRow, kind: ItemKind, qty: string) => void
  onToggleSerial: (row: RequisitionPickerRow, kind: ItemKind, serial: AvailableSerialUnit) => void
}) {
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          <th className={`${headCell} w-[10%]`}>Type</th>
          <th className={`${headCell} w-[14%]`}>Item code</th>
          <th className={`${headCell} w-[20%]`}>Item name</th>
          <th className={`${headCell} w-[10%] text-right`}>Free stock</th>
          <th className={`${headCell} w-[10%]`}>Transfer qty</th>
          <th className={`${headCell} w-[28%]`}>Serial no. (assets)</th>
          <th className={`${headCell} w-[8%]`}>UOM</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={7} className="h-[400px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
              Loading stock and available serials at From location…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={7} className="h-[400px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
              No items with transferable stock at this From location for the selected type.
            </td>
          </tr>
        ) : (
          rows.map((r) => {
            const kind: ItemKind =
              String(r.itemType ?? '').toLowerCase() === 'consumable' ? 'consumable' : 'asset'
            const pick = picks[r.key]
            const stock = Math.floor(Number(r.stock) || 0)
            const qty = pick?.qty ?? 0
            const serials = serialByKey[r.key] ?? []
            const over = qty > stock
            const serialOk = kind !== 'asset' || qty === 0 || (pick?.serials.length ?? 0) === qty

            return (
              <tr
                key={r.key}
                className={`align-top transition ${qty > 0 ? 'bg-[#e8efff]' : 'hover:bg-[#f8fafc]'}`}
              >
                <td className={bodyCell}>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      kind === 'asset' ? 'bg-[#e8efff] text-[var(--accent)]' : 'bg-[#ecfdf5] text-emerald-700'
                    }`}
                  >
                    {kind === 'asset' ? 'Asset' : 'Consumable'}
                  </span>
                </td>
                <td className={`${bodyCell} truncate font-mono font-medium`}>{r.itemCode || '—'}</td>
                <td className={`${bodyCell} truncate`} title={r.itemName}>
                  {r.itemName || '—'}
                </td>
                <td className={`${bodyCell} text-right tabular-nums font-semibold`}>
                  {formatStockQty(stock)}
                </td>
                <td className={bodyCell}>
                  <Input
                    type="number"
                    min={0}
                    max={stock}
                    step="1"
                    value={qty > 0 ? String(qty) : ''}
                    placeholder="0"
                    invalid={over}
                    title={`Max ${formatStockQty(stock)}`}
                    className="w-full text-right text-[12px]"
                    onChange={(e) => onQty(r, kind, e.target.value)}
                  />
                  {over && (
                    <div className="mt-0.5 text-[10px] text-[var(--danger)]">Max {formatStockQty(stock)}</div>
                  )}
                </td>
                <td className={bodyCell}>
                  {kind === 'asset' ? (
                    serials.length === 0 ? (
                      <span className="text-[11px] text-[var(--text3)]">No serials available</span>
                    ) : (
                      <>
                        <div
                          className={`max-h-[120px] overflow-y-auto rounded border px-1.5 py-1 ${
                            serialOk ? 'border-[var(--border)]' : 'border-[var(--danger)]'
                          } bg-[var(--surface)]`}
                        >
                          {serials.map((u) => {
                            const sn = String(u.serialNo ?? '')
                            const checked = Boolean(
                              pick?.serials.some((s) => String(s.serialNo ?? '') === sn),
                            )
                            return (
                              <label
                                key={u.blsId}
                                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[11.5px] hover:bg-[#f0f5ff]"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!checked && qty > 0 && (pick?.serials.length ?? 0) >= qty}
                                  onChange={() => onToggleSerial(r, kind, u)}
                                />
                                <span className="font-mono">{sn || '—'}</span>
                              </label>
                            )
                          })}
                        </div>
                        <div
                          className={`mt-0.5 text-[10px] ${
                            serialOk ? 'text-[var(--text3)]' : 'font-medium text-[var(--danger)]'
                          }`}
                        >
                          {qty > 0
                            ? `Select ${qty} serial${qty === 1 ? '' : 's'} · chosen ${pick?.serials.length ?? 0}`
                            : 'Enter transfer qty first (or tick serials)'}
                        </div>
                      </>
                    )
                  ) : (
                    <span className="text-[11px] text-[var(--text3)]">— Not required —</span>
                  )}
                </td>
                <td className={`${bodyCell} text-[var(--text2)]`}>{r.uomCode}</td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}
