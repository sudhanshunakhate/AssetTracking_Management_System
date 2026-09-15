import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { ApiMasterRow } from '@/api/masters'
import {
  fetchAvailableSerials,
  type AvailableSerialUnit,
  type ItemLocationStock,
} from '@/api/transactions'
import { locLabel } from './txnLookups'
import { formatStockQty } from './lineGrid'

export type RequisitionPickerRow = {
  key: string
  itemId: string
  locationId: string
  itemCode: string
  itemName: string
  locationLabel: string
  stock: number
  uomCode: string
  itemType?: string
}

function locationLabel(locationId: string, locationById: Map<string, ApiMasterRow>) {
  const row = locationById.get(locationId)
  return row ? locLabel(row) : locationId
}

export function locationsForItem(
  itemId: string,
  items: ApiMasterRow[],
  stockRows: ItemLocationStock[],
  allowedLocationIds: Set<string>,
  opts?: { stockedOnly?: boolean },
): { locationId: string; qty: number }[] {
  const item = items.find((i) => i.id === itemId)
  if (!item) return []

  const qtyAt = (locationId: string) =>
    stockRows
      .filter((r) => r.itemId === itemId && r.locationId === locationId)
      .reduce((sum, r) => sum + r.qty, 0)

  const scope = String(item.locationScope ?? '').toUpperCase()
  const assigned = (item.locationIds as string[] | undefined)?.filter(Boolean) ?? []

  let locationIds: string[] = []
  if (scope === 'ALL' || assigned.length === 0) {
    locationIds = [...allowedLocationIds]
  } else {
    locationIds = assigned.filter((id) => allowedLocationIds.has(id))
  }

  for (const row of stockRows) {
    if (row.itemId === itemId && allowedLocationIds.has(row.locationId) && !locationIds.includes(row.locationId)) {
      locationIds.push(row.locationId)
    }
  }

  if (locationIds.length === 0 && item.store) {
    const storeId = String(item.store)
    if (allowedLocationIds.has(storeId)) locationIds = [storeId]
  }

  const stockedOnly = opts?.stockedOnly !== false
  return locationIds
    .map((locationId) => ({ locationId, qty: qtyAt(locationId) }))
    .filter((l) => (stockedOnly ? l.qty > 0 : true))
    .sort((a, b) => b.qty - a.qty)
}

export function buildRequisitionPickerRows(
  items: ApiMasterRow[],
  stockRows: ItemLocationStock[],
  allowedLocationIds: Set<string>,
  locationById: Map<string, ApiMasterRow>,
  unitById: Map<string, ApiMasterRow>,
  opts?: { stockedOnly?: boolean },
): RequisitionPickerRow[] {
  const rows: RequisitionPickerRow[] = []
  const seen = new Set<string>()
  const activeItems = items.filter((i) => i.status !== 'Inactive')

  for (const item of activeItems) {
    const locs = locationsForItem(item.id, items, stockRows, allowedLocationIds, opts)
    for (const loc of locs) {
      const key = `${item.id}|${loc.locationId}`
      if (seen.has(key)) continue
      seen.add(key)
      const uom = unitById.get(String(item.uom ?? ''))
      rows.push({
        key,
        itemId: item.id,
        locationId: loc.locationId,
        itemCode: String(item.code ?? ''),
        itemName: String(item.name ?? ''),
        locationLabel: locationLabel(loc.locationId, locationById),
        stock: loc.qty,
        uomCode: uom ? String(uom.code ?? '—') : '—',
        itemType: String(item.itemType ?? ''),
      })
    }
  }

  return rows.sort((a, b) => {
    const byCode = a.itemCode.localeCompare(b.itemCode, undefined, { sensitivity: 'base' })
    if (byCode !== 0) return byCode
    return a.locationLabel.localeCompare(b.locationLabel, undefined, { sensitivity: 'base' })
  })
}

const headCell =
  'sticky top-0 z-10 border-b-2 border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap'
const bodyCell = 'border-b border-[var(--border)] px-3 py-2 text-[12px] align-middle'

function isAssetRow(row: RequisitionPickerRow) {
  return String(row.itemType ?? '').toLowerCase() === 'asset'
}

export function RequisitionItemPickerModal({
  open,
  onClose,
  onSelect,
  rows,
  loading = false,
  selectedItemId = '',
  selectedLocationId = '',
  title = 'Select Item',
  subtitle = 'Choose an item, then pick the store location. Each item is listed once.',
  showSerialColumn = false,
}: {
  open: boolean
  onClose: () => void
  onSelect: (itemId: string, locationId: string, serial?: AvailableSerialUnit) => void
  rows: RequisitionPickerRow[]
  loading?: boolean
  selectedItemId?: string
  selectedLocationId?: string
  title?: string
  subtitle?: string
  /** Issue picker: show Serial No. dropdown for asset rows. */
  showSerialColumn?: boolean
}) {
  const [search, setSearch] = useState('')
  const [focusItemId, setFocusItemId] = useState('')
  const [serialByKey, setSerialByKey] = useState<Record<string, AvailableSerialUnit[]>>({})
  const [serialLoading, setSerialLoading] = useState(false)
  const [pickedSerialByKey, setPickedSerialByKey] = useState<Record<string, string>>({})

  const itemSummaries = useMemo(() => {
    const byId = new Map<
      string,
      {
        itemId: string
        itemCode: string
        itemName: string
        uomCode: string
        itemType: string
        stock: number
        locationCount: number
        locationLabels: string[]
        rows: RequisitionPickerRow[]
      }
    >()
    for (const r of rows) {
      const existing = byId.get(r.itemId)
      if (existing) {
        existing.stock += r.stock
        existing.locationCount += 1
        existing.rows.push(r)
        if (r.locationLabel && !existing.locationLabels.includes(r.locationLabel)) {
          existing.locationLabels.push(r.locationLabel)
        }
      } else {
        byId.set(r.itemId, {
          itemId: r.itemId,
          itemCode: r.itemCode,
          itemName: r.itemName,
          uomCode: r.uomCode,
          itemType: String(r.itemType ?? ''),
          stock: r.stock,
          locationCount: 1,
          locationLabels: r.locationLabel ? [r.locationLabel] : [],
          rows: [r],
        })
      }
    }
    return [...byId.values()].sort((a, b) =>
      a.itemCode.localeCompare(b.itemCode, undefined, { sensitivity: 'base' }),
    )
  }, [rows])

  const focusedItem = itemSummaries.find((i) => i.itemId === focusItemId)
  const locationRows = focusedItem?.rows ?? []
  const onLocations = Boolean(focusItemId)

  useEffect(() => {
    if (open) {
      setSearch('')
      setFocusItemId('')
      setPickedSerialByKey({})
      setSerialByKey({})
    }
  }, [open])

  useEffect(() => {
    if (!open || !showSerialColumn || !focusItemId) {
      setSerialLoading(false)
      return
    }
    const assetKeys = locationRows.filter(isAssetRow)
    if (assetKeys.length === 0) {
      setSerialByKey({})
      setSerialLoading(false)
      return
    }
    let cancelled = false
    setSerialLoading(true)
    ;(async () => {
      const next: Record<string, AvailableSerialUnit[]> = {}
      const batchSize = 8
      for (let i = 0; i < assetKeys.length; i += batchSize) {
        if (cancelled) return
        const batch = assetKeys.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (r) => {
            try {
              const units = await fetchAvailableSerials(
                Number(r.itemId),
                /^\d+$/.test(r.locationId) ? Number(r.locationId) : undefined,
              )
              if (!cancelled) next[r.key] = units
            } catch {
              if (!cancelled) next[r.key] = []
            }
          }),
        )
      }
      if (!cancelled) {
        setSerialByKey((prev) => ({ ...prev, ...next }))
        setSerialLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, showSerialColumn, focusItemId, locationRows.map((r) => r.key).sort().join('|')])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return itemSummaries
    return itemSummaries.filter((i) =>
      `${i.itemCode} ${i.itemName} ${i.uomCode} ${i.locationLabels.join(' ')}`
        .toLowerCase()
        .includes(term),
    )
  }, [itemSummaries, search])

  const filteredLocations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return locationRows
    return locationRows.filter((r) => {
      const serials = (serialByKey[r.key] ?? []).map((u) => String(u.serialNo ?? '')).join(' ')
      return `${r.locationLabel} ${r.uomCode} ${serials} ${formatStockQty(r.stock)}`
        .toLowerCase()
        .includes(term)
    })
  }, [locationRows, search, serialByKey])

  const selectedKey =
    selectedItemId && selectedLocationId ? `${selectedItemId}|${selectedLocationId}` : ''

  const locColCount = showSerialColumn ? 4 : 3
  const totalItems = itemSummaries.length
  const showingItems = filteredItems.length
  const rowCountLabel = loading
    ? 'Loading stock…'
    : onLocations
      ? `${filteredLocations.length} location${filteredLocations.length === 1 ? '' : 's'}`
      : search.trim()
        ? `${showingItems} of ${totalItems} item${totalItems === 1 ? '' : 's'}`
        : `${totalItems} item${totalItems === 1 ? '' : 's'}`

  const applyRow = (r: RequisitionPickerRow, serialNo?: string) => {
    if (!showSerialColumn || !isAssetRow(r)) {
      onSelect(r.itemId, r.locationId)
      return
    }
    const want = (serialNo ?? pickedSerialByKey[r.key] ?? '').trim()
    const hit = want
      ? (serialByKey[r.key] ?? []).find(
          (u) => String(u.serialNo ?? '').toUpperCase() === want.toUpperCase(),
        )
      : undefined
    onSelect(r.itemId, r.locationId, hit)
  }

  const openItem = (itemId: string) => {
    setFocusItemId(itemId)
    setSearch('')
  }

  return (
    <Modal
      open={open}
      title={title}
      subtitle={
        onLocations && focusedItem
          ? `${focusedItem.itemCode} – ${focusedItem.itemName}. Pick a location${
              showSerialColumn ? ' (and serial for assets)' : ''
            }.`
          : subtitle
      }
      onClose={onClose}
      width="max-w-5xl"
      offsetSidebar
      panelClassName="!h-[min(90vh,680px)]"
      bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0"
      footer={
        <>
          <span className="mr-auto text-[11px] text-[var(--text3)]">{rowCountLabel}</span>
          {onLocations && (
            <Button variant="ghost" onClick={() => { setFocusItemId(''); setSearch('') }}>
              ← All items
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            onLocations
              ? showSerialColumn
                ? 'Search location or serial…'
                : 'Search location…'
              : 'Search by item code, name, or location…'
          }
          autoFocus
          className="text-[12.5px]"
        />
      </div>

      <div className="h-[520px] min-h-[520px] shrink-0 overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          {!onLocations ? (
            <>
              <thead>
                <tr>
                  <th className={`${headCell} w-[16%]`}>Item Code</th>
                  <th className={`${headCell} w-[38%]`}>Item Name</th>
                  <th className={`${headCell} w-[16%]`}>Locations</th>
                  <th className={`${headCell} w-[18%] text-right`}>Available Stock</th>
                  <th className={`${headCell} w-[12%]`}>UOM</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="h-[468px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
                      Loading items and stock…
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-[468px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
                      {search.trim() ? 'No items match your search.' : 'No items available at operational locations.'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((i) => (
                    <tr
                      key={i.itemId}
                      className={`cursor-pointer transition hover:bg-[#f0f5ff] ${
                        i.itemId === selectedItemId ? 'bg-[#e8efff]' : ''
                      }`}
                      onClick={() => openItem(i.itemId)}
                    >
                      <td className={`${bodyCell} truncate font-mono font-medium`}>{i.itemCode || '—'}</td>
                      <td className={`${bodyCell} truncate`} title={i.itemName}>
                        {i.itemName || '—'}
                      </td>
                      <td className={`${bodyCell} text-[var(--text2)]`}>
                        {i.locationCount} location{i.locationCount === 1 ? '' : 's'}
                      </td>
                      <td
                        className={`${bodyCell} text-right tabular-nums font-medium ${
                          i.stock <= 0 ? 'text-[var(--text3)]' : 'text-[var(--text)]'
                        }`}
                      >
                        {formatStockQty(i.stock)}
                      </td>
                      <td className={`${bodyCell} text-[var(--text2)]`}>{i.uomCode}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th className={`${headCell} ${showSerialColumn ? 'w-[40%]' : 'w-[58%]'}`}>Location</th>
                  {showSerialColumn && <th className={`${headCell} w-[22%]`}>Serial No.</th>}
                  <th className={`${headCell} w-[20%] text-right`}>Available Stock</th>
                  <th className={`${headCell} w-[18%]`}>UOM</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={locColCount} className="h-[468px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
                      {search.trim() ? 'No locations match your search.' : 'No locations with stock for this item.'}
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((r) => {
                    const isSelected = r.key === selectedKey
                    const asset = showSerialColumn && isAssetRow(r)
                    const serials = serialByKey[r.key] ?? []
                    return (
                      <tr
                        key={r.key}
                        className={`cursor-pointer transition hover:bg-[#f0f5ff] ${
                          isSelected ? 'bg-[#e8efff]' : ''
                        }`}
                        onClick={() => applyRow(r)}
                      >
                        <td className={`${bodyCell} truncate`} title={r.locationLabel}>
                          {r.locationLabel}
                        </td>
                        {showSerialColumn && (
                          <td className={bodyCell} onClick={(e) => e.stopPropagation()}>
                            {asset ? (
                              <Select
                                value={pickedSerialByKey[r.key] ?? ''}
                                disabled={serialLoading}
                                title={pickedSerialByKey[r.key] || undefined}
                                className="w-full min-w-0 text-[11.5px]"
                                onChange={(e) => {
                                  const serialNo = e.target.value
                                  setPickedSerialByKey((prev) => ({ ...prev, [r.key]: serialNo }))
                                  if (serialNo) applyRow(r, serialNo)
                                }}
                              >
                                <option value="">
                                  {serialLoading
                                    ? 'Loading…'
                                    : serials.length
                                      ? '— Select serial —'
                                      : 'No serials'}
                                </option>
                                {serials.map((u) => (
                                  <option key={u.blsId} value={String(u.serialNo ?? '')}>
                                    {u.serialNo}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              <span className="text-[11px] text-[var(--text3)]">—</span>
                            )}
                          </td>
                        )}
                        <td
                          className={`${bodyCell} text-right tabular-nums font-medium ${
                            r.stock <= 0 ? 'text-[var(--text3)]' : 'text-[var(--text)]'
                          }`}
                        >
                          {formatStockQty(r.stock)}
                        </td>
                        <td className={`${bodyCell} text-[var(--text2)]`}>{r.uomCode}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
    </Modal>
  )
}
