import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { ApiMasterRow } from '@/api/masters'
import type { ItemLocationStock } from '@/api/transactions'
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

export function RequisitionItemPickerModal({
  open,
  onClose,
  onSelect,
  rows,
  loading = false,
  selectedItemId = '',
  selectedLocationId = '',
  title = 'Select Item',
  subtitle = 'Choose an item and store location. Only locations with available stock are listed.',
}: {
  open: boolean
  onClose: () => void
  onSelect: (itemId: string, locationId: string) => void
  rows: RequisitionPickerRow[]
  loading?: boolean
  selectedItemId?: string
  selectedLocationId?: string
  title?: string
  subtitle?: string
}) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) =>
      `${r.itemCode} ${r.itemName} ${r.locationLabel} ${r.uomCode}`.toLowerCase().includes(term),
    )
  }, [rows, search])

  const selectedKey =
    selectedItemId && selectedLocationId ? `${selectedItemId}|${selectedLocationId}` : ''

  const totalRows = rows.length
  const showingRows = filtered.length
  const rowCountLabel = loading
    ? 'Loading stock…'
    : search.trim()
      ? `${showingRows} of ${totalRows} row${totalRows === 1 ? '' : 's'}`
      : `${totalRows} row${totalRows === 1 ? '' : 's'}`

  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width="max-w-5xl"
      offsetSidebar
      panelClassName="!h-[min(90vh,680px)]"
      bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0"
      footer={
        <>
          <span className="mr-auto text-[11px] text-[var(--text3)]">{rowCountLabel}</span>
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
          placeholder="Search by item code, name, or location…"
          autoFocus
          className="text-[12.5px]"
        />
      </div>

      <div className="h-[520px] min-h-[520px] shrink-0 overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className={`${headCell} w-[13%]`}>Item Code</th>
              <th className={`${headCell} w-[24%]`}>Item Name</th>
              <th className={`${headCell} w-[35%]`}>Location</th>
              <th className={`${headCell} w-[16%] text-right`}>Available Stock</th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-[468px] px-3 text-center align-middle text-[12px] text-[var(--text3)]">
                  {search.trim() ? 'No items match your search.' : 'No items available at operational locations.'}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isSelected = r.key === selectedKey
                return (
                  <tr
                    key={r.key}
                    className={`cursor-pointer transition hover:bg-[#f0f5ff] ${
                      isSelected ? 'bg-[#e8efff]' : ''
                    }`}
                    onClick={() => onSelect(r.itemId, r.locationId)}
                  >
                    <td className={`${bodyCell} truncate font-mono font-medium`}>{r.itemCode || '—'}</td>
                    <td className={`${bodyCell} truncate`} title={r.itemName}>
                      {r.itemName || '—'}
                    </td>
                    <td className={`${bodyCell} truncate`} title={r.locationLabel}>
                      {r.locationLabel}
                    </td>
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
        </table>
      </div>
    </Modal>
  )
}
