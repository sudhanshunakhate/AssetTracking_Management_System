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
import { locLabel, blocksInspectionItemNewOutwardFrom, itemNeedsInspection } from './txnLookups'
import {
  buildRequisitionPickerRows,
  type RequisitionPickerRow,
} from './RequisitionItemPickerModal'
import { formatStockQty, useCodeIndex, wholeQtyStr } from './lineGrid'

export type OutwardPickerLine = {
  itemId: string
  locationId: string
  stock: number
  qty: string
  itemKind: 'asset' | 'consumable'
  serial?: AvailableSerialUnit
}

export type OutwardPickerBatch = {
  locationId: string
  lines: OutwardPickerLine[]
}

type Step = 'location' | 'type' | 'item'
type TypeFilter = 'all' | 'asset' | 'consumable'

type RowPick = {
  row: RequisitionPickerRow
  kind: 'asset' | 'consumable'
  qty: number
  serials: AvailableSerialUnit[]
}

const headCell =
  'sticky top-0 z-10 border-b-2 border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap'
const bodyCell = 'border-b border-[var(--border)] px-3 py-2 text-[12px] align-middle'

function kindOf(item: ApiMasterRow): 'asset' | 'consumable' {
  return String(item.itemType ?? '').toLowerCase() === 'consumable' ? 'consumable' : 'asset'
}

function clampQty(qty: number, stock: number) {
  if (!Number.isFinite(qty) || qty < 0) return 0
  if (!Number.isFinite(stock) || stock <= 0) return 0
  return Math.min(Math.floor(qty), Math.floor(stock))
}

/**
 * Normal outward: System location → type → items (qty / serials).
 * Only system-derived locations are listed; stock is free (not allotted) qty.
 */
export function GatepassNormalOutwardPickerModal({
  open,
  onClose,
  onComplete,
  systemLocations,
  items,
  units,
  initialLocationId = '',
}: {
  open: boolean
  onClose: () => void
  onComplete: (batch: OutwardPickerBatch) => void
  systemLocations: ApiMasterRow[]
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  initialLocationId?: string
}) {
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(systemLocations)

  const [step, setStep] = useState<Step>('location')
  const [search, setSearch] = useState('')
  const [locationId, setLocationId] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [serialByKey, setSerialByKey] = useState<Record<string, AvailableSerialUnit[]>>({})
  const [serialsLoaded, setSerialsLoaded] = useState(false)
  const [allStock, setAllStock] = useState<ItemLocationStock[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [picks, setPicks] = useState<Record<string, RowPick>>({})

  useEffect(() => {
    if (!open) return
    setSearch('')
    setLocationId(initialLocationId)
    setTypeFilter('all')
    setPicks({})
    setSerialByKey({})
    setSerialsLoaded(false)
    setStep('location')
  }, [open, initialLocationId])

  const locationIdsKey = useMemo(
    () =>
      systemLocations
        .map((l) => String(l.id))
        .filter(Boolean)
        .sort()
        .join(','),
    [systemLocations],
  )

  useEffect(() => {
    if (!open) {
      setAllStock([])
      setSerialByKey({})
      setSerialsLoaded(false)
      return
    }
    const locIds = locationIdsKey
      ? locationIdsKey.split(',').map((id) => Number(id)).filter((n) => Number.isFinite(n))
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
  }, [open, locationIdsKey])

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
      const [locId, itemId] = key.split('|')
      const item = itemById.get(itemId)
      if (!item || item.status === 'Inactive') continue
      if (itemNeedsInspection(item) && blocksInspectionItemNewOutwardFrom(locationById.get(locId))) continue
      const label = String(item.name ?? item.code ?? itemId).trim() || itemId
      const withQty = `${label} (${formatStockQty(qty)})`
      const cur = map.get(locId) ?? { names: [], count: 0 }
      cur.names.push(withQty)
      cur.count += 1
      map.set(locId, cur)
    }
    for (const entry of map.values()) {
      entry.names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    }
    return map
  }, [allStock, itemById, locationById])

  const locationStock = useMemo(() => {
    const rows = locationId ? allStock.filter((r) => r.locationId === locationId) : []
    const loc = locationId ? locationById.get(locationId) : undefined
    if (!blocksInspectionItemNewOutwardFrom(loc)) return rows
    return rows.filter((r) => !itemNeedsInspection(itemById.get(r.itemId)))
  }, [allStock, locationId, locationById, itemById])

  const typeStockSummary = useMemo(() => {
    const assetIds = new Set<string>()
    const consumableIds = new Set<string>()
    let assetQty = 0
    let consumableQty = 0
    for (const r of locationStock) {
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
  }, [locationStock, itemById])

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
        locationStock,
        locationId ? new Set([locationId]) : new Set(),
        locationById,
        unitById,
        { stockedOnly: true },
      ).map((r) => {
        const item = itemById.get(r.itemId)
        return { ...r, itemType: item ? kindOf(item) : r.itemType }
      }),
    [scopedItems, locationStock, locationId, locationById, unitById, itemById],
  )

  const itemRows = useMemo(() => {
    return baseItemRows
      .map((r) => {
        const kind = String(r.itemType).toLowerCase() === 'consumable' ? 'consumable' : 'asset'
        if (kind !== 'asset') return r
        if (!(r.key in serialByKey)) return r
        return { ...r, stock: (serialByKey[r.key] ?? []).length }
      })
      .filter(
        (r) =>
          Number(r.stock) > 0 ||
          (String(r.itemType).toLowerCase() !== 'consumable' && !serialsLoaded),
      )
  }, [baseItemRows, serialByKey, serialsLoaded])

  useEffect(() => {
    if (!open || step !== 'item' || !locationId) return
    let cancelled = false
    setSerialsLoaded(false)
    ;(async () => {
      try {
        const unitsAtLoc = await fetchAvailableSerialsAtLocation(Number(locationId))
        if (cancelled) return
        const next: Record<string, AvailableSerialUnit[]> = {}
        for (const r of baseItemRows) {
          if (String(r.itemType).toLowerCase() === 'consumable') continue
          next[r.key] = unitsAtLoc.filter((u) => String(u.itemId) === String(r.itemId))
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
  }, [open, step, locationId, baseItemRows.map((r) => r.key).join('|')])

  const filteredLocations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return systemLocations
    return systemLocations.filter((l) => {
      const itemsLabel = (itemsByLocationId.get(l.id)?.names ?? []).join(' ')
      return `${l.code ?? ''} ${l.name ?? ''} ${itemsLabel}`.toLowerCase().includes(term)
    })
  }, [systemLocations, search, itemsByLocationId])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = itemRows.filter((r) => {
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
  const selectedUnitCount = useMemo(() => pickList.reduce((s, p) => s + p.qty, 0), [pickList])

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
      if (p.kind === 'asset' && p.serials.length !== p.qty) {
        errs.push(
          `${p.row.itemCode}: select exactly ${p.qty} serial number${p.qty === 1 ? '' : 's'} (selected ${p.serials.length})`,
        )
      }
    }
    return errs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickList, serialByKey])

  const canConfirm = pickList.length > 0 && selectionErrors.length === 0

  const locationLabel = locationId
    ? (() => {
        const loc = locationById.get(locationId)
        return loc ? locLabel(loc) : locationId
      })()
    : ''

  const buildLines = (): OutwardPickerLine[] => {
    const lines: OutwardPickerLine[] = []
    for (const p of pickList) {
      const stock = availableForPick(p)
      if (p.kind === 'asset') {
        for (const serial of p.serials) {
          lines.push({
            itemId: p.row.itemId,
            locationId: p.row.locationId || locationId,
            stock,
            qty: '1',
            itemKind: 'asset',
            serial,
          })
        }
      } else {
        lines.push({
          itemId: p.row.itemId,
          locationId: p.row.locationId || locationId,
          stock,
          qty: wholeQtyStr(p.qty),
          itemKind: 'consumable',
        })
      }
    }
    return lines
  }

  const confirm = () => {
    if (!locationId || !canConfirm) return
    onComplete({ locationId, lines: buildLines() })
  }

  const setRowQty = (row: RequisitionPickerRow, kind: 'asset' | 'consumable', raw: string) => {
    const stock = Math.floor(Number(row.stock) || 0)
    const qty = clampQty(Number(raw), stock)
    setPicks((prev) => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[row.key]
        return next
      }
      const existing = prev[row.key]
      let serials = existing?.serials ?? []
      if (kind === 'asset') {
        const pool = serialByKey[row.key] ?? []
        if (serials.length > qty) {
          serials = serials.slice(0, qty)
        } else if (serials.length < qty) {
          const taken = new Set(serials.map((s) => String(s.serialNo ?? '')))
          for (const u of pool) {
            if (serials.length >= qty) break
            const sn = String(u.serialNo ?? '')
            if (!taken.has(sn)) {
              serials = [...serials, u]
              taken.add(sn)
            }
          }
        }
      }
      next[row.key] = { row, kind, qty, serials }
      return next
    })
  }

  const toggleSerial = (
    row: RequisitionPickerRow,
    kind: 'asset' | 'consumable',
    serial: AvailableSerialUnit,
  ) => {
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
        serials = [...existing.serials, serial]
      }
      const qty = clampQty(serials.length, stock)
      if (qty <= 0) {
        const next = { ...prev }
        delete next[row.key]
        return next
      }
      return { ...prev, [row.key]: { row, kind, qty, serials: serials.slice(0, qty) } }
    })
  }

  const goBack = () => {
    setSearch('')
    if (step === 'type') setStep('location')
    else if (step === 'item') setStep('type')
  }

  const stepTitle: Record<Step, string> = {
    location: '1. Select System Location',
    type: '2. Select Item Type',
    item: '3. Select Items & Quantity',
  }

  const stepSubtitle: Record<Step, string> = {
    location:
      'Only system-derived locations. Free items column shows transferable qty (not allotted/issued).',
    type: locationLabel
      ? `From: ${locationLabel}. Choose All, Asset, or Consumable.`
      : 'Choose which item types to send outward.',
    item: locationLabel
      ? `From: ${locationLabel}. Type how many to send (1 or more). Asset serials fill in automatically.`
      : 'Enter quantity for each item (max = available free stock).',
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
            <StepPill active={step === 'location'} done={Boolean(locationId) && step !== 'location'} label="1. Location" />
            <StepPill active={step === 'type'} done={step === 'item'} label="2. Type" />
            <StepPill active={step === 'item'} done={false} label="3. Items" />
          </div>
          {step !== 'location' && (
            <Button variant="ghost" onClick={goBack}>
              ← Back
            </Button>
          )}
          {step === 'item' && (
            <Button onClick={confirm} disabled={!canConfirm}>
              Confirm {selectedUnitCount} unit{selectedUnitCount === 1 ? '' : 's'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      {locationId && (
        <div className="shrink-0 border-b border-[var(--border)] bg-[#f8fafc] px-3.5 py-2 text-[11.5px] text-[var(--text2)]">
          <b>System location:</b> {locationLabel}
          {pickList.length > 0 && (
            <span className="ml-3">
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
            placeholder={
              step === 'location'
                ? 'Search location, or item name in stock…'
                : 'Search item code, name, type, or serial…'
            }
            autoFocus
            className="text-[12.5px]"
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {step === 'location' && (
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${headCell} w-[16%]`}>Location code</th>
                <th className={`${headCell} w-[24%]`}>Location name</th>
                <th className={`${headCell} w-[12%]`}>Role</th>
                <th className={`${headCell} w-[48%]`}>Free items in stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-[400px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
                    {search.trim()
                      ? 'No system locations match your search.'
                      : 'No system-derived locations found.'}
                  </td>
                </tr>
              ) : (
                filteredLocations.map((l) => {
                  const selected = l.id === locationId
                  const stocked = itemsByLocationId.get(l.id)
                  const preview = stocked?.names.slice(0, 6).join(', ') ?? ''
                  const more = stocked && stocked.count > 6 ? ` +${stocked.count - 6} more` : ''
                  const role = String(l.systemRole ?? '').trim() || 'System'
                  return (
                    <tr
                      key={l.id}
                      className={`cursor-pointer transition hover:bg-[#f0f5ff] ${selected ? 'bg-[#e8efff]' : ''}`}
                      onClick={() => {
                        setLocationId(l.id)
                        setPicks({})
                        setSerialByKey({})
                        setSerialsLoaded(false)
                        setSearch('')
                        setStep('type')
                      }}
                    >
                      <td className={`${bodyCell} truncate font-mono font-medium`}>
                        {String(l.code ?? '—')}
                      </td>
                      <td className={`${bodyCell} truncate`} title={String(l.name ?? '')}>
                        {String(l.name ?? '—')}
                      </td>
                      <td className={`${bodyCell} text-[var(--text2)]`}>{role}</td>
                      <td
                        className={`${bodyCell} text-[11.5px] text-[var(--text2)]`}
                        title={stocked?.names.join(', ') || undefined}
                      >
                        {stockLoading ? (
                          <span className="text-[var(--text3)]">Loading…</span>
                        ) : stocked && stocked.count > 0 ? (
                          <>
                            <span className="line-clamp-2">
                              {preview}
                              {more}
                            </span>
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
        )}

        {step === 'type' && (
          <div className="flex flex-col gap-3 p-6">
            <div className="text-center text-[12px] text-[var(--text2)]">
              Available at <b className="text-[var(--text)]">{locationLabel}</b>:{' '}
              <b>{formatStockQty(typeStockSummary.totalQty)}</b> free units across{' '}
              <b>{typeStockSummary.totalItems}</b> items
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(
                [
                  ['all', 'All items', typeStockSummary.totalQty, typeStockSummary.totalItems],
                  ['asset', 'Asset', typeStockSummary.assetQty, typeStockSummary.assetItems],
                  [
                    'consumable',
                    'Consumable',
                    typeStockSummary.consumableQty,
                    typeStockSummary.consumableItems,
                  ],
                ] as const
              ).map(([value, title, qty, count]) => (
                <button
                  key={value}
                  type="button"
                  className="min-h-[120px] rounded-lg border-2 border-[var(--border)] px-4 py-4 text-left transition hover:border-[var(--accent)] hover:bg-[#f0f5ff]"
                  onClick={() => {
                    setTypeFilter(value)
                    setPicks({})
                    setSearch('')
                    setStep('item')
                  }}
                >
                  <div className="text-[15px] font-semibold text-[var(--text)]">{title}</div>
                  <div className="mt-2 text-[16px] font-bold tabular-nums text-[var(--accent)]">
                    {formatStockQty(qty)}
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--text3)]">
                    {count} item{count === 1 ? '' : 's'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'item' && (
          <div className="flex h-full min-h-0 flex-col">
            {selectionErrors.length > 0 && (
              <div className="border-b border-[var(--border)] bg-[#fff5f5] px-3.5 py-2 text-[11.5px] text-[var(--danger)]">
                {selectionErrors[0]}
              </div>
            )}
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr>
                  <th className={`${headCell} w-[10%]`}>Type</th>
                  <th className={`${headCell} w-[14%]`}>Item code</th>
                  <th className={`${headCell} w-[20%]`}>Item name</th>
                  <th className={`${headCell} w-[10%] text-right`}>Free stock</th>
                  <th className={`${headCell} w-[10%]`}>Outward qty</th>
                  <th className={`${headCell} w-[28%]`}>Serial no. (assets)</th>
                  <th className={`${headCell} w-[8%]`}>UOM</th>
                </tr>
              </thead>
              <tbody>
                {stockLoading || (!serialsLoaded && typeFilter !== 'consumable') ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="h-[360px] px-3 text-center align-middle text-[12px] text-[var(--text3)]"
                    >
                      Loading free stock and serials…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="h-[360px] px-3 text-center align-middle text-[12px] text-[var(--text3)]"
                    >
                      No free stock here for New Outward. Inspection-needed items cannot leave from Damaged, Scrap, or Quarantine — transfer them to Quarantine and complete Inspection Approval first.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((r) => {
                    const kind: 'asset' | 'consumable' =
                      String(r.itemType ?? '').toLowerCase() === 'consumable'
                        ? 'consumable'
                        : 'asset'
                    const pick = picks[r.key]
                    const stock = Math.floor(Number(r.stock) || 0)
                    const qty = pick?.qty ?? 0
                    const serials = serialByKey[r.key] ?? []
                    const over = qty > stock
                    return (
                      <tr
                        key={r.key}
                        className={`align-top transition ${qty > 0 ? 'bg-[#e8efff]' : 'hover:bg-[#f8fafc]'}`}
                      >
                        <td className={bodyCell}>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              kind === 'asset'
                                ? 'bg-[#e8efff] text-[var(--accent)]'
                                : 'bg-[#ecfdf5] text-emerald-700'
                            }`}
                          >
                            {kind === 'asset' ? 'Asset' : 'Consumable'}
                          </span>
                        </td>
                        <td className={`${bodyCell} truncate font-mono font-medium`}>
                          {r.itemCode || '—'}
                        </td>
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
                            className="w-full text-right text-[12px]"
                            onChange={(e) => setRowQty(r, kind, e.target.value)}
                            title={
                              kind === 'asset'
                                ? `Type 1 or more (max ${formatStockQty(stock)}). Serials are selected automatically.`
                                : `Max ${formatStockQty(stock)}`
                            }
                          />
                        </td>
                        <td className={bodyCell}>
                          {kind === 'asset' ? (
                            <div className="flex max-h-[88px] flex-wrap gap-1 overflow-y-auto">
                              {serials.length === 0 ? (
                                <span className="text-[11px] text-[var(--text3)]">No free serials</span>
                              ) : (
                                serials.map((u) => {
                                  const sn = String(u.serialNo ?? '')
                                  const on = (pick?.serials ?? []).some(
                                    (s) => String(s.serialNo ?? '') === sn,
                                  )
                                  return (
                                    <button
                                      key={u.blsId}
                                      type="button"
                                      className={`rounded border px-1.5 py-0.5 font-mono text-[10.5px] ${
                                        on
                                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                          : 'border-[var(--border)] bg-white text-[var(--text2)] hover:border-[var(--accent)]'
                                      }`}
                                      onClick={() => toggleSerial(r, kind, u)}
                                    >
                                      {sn}
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text3)]">—</span>
                          )}
                        </td>
                        <td className={`${bodyCell} text-[var(--text2)]`}>{r.uomCode || '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
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
