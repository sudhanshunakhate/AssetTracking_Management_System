import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import { fetchItemLocationStock, type ItemLocationStock } from '@/api/transactions'
import {
  RequisitionItemPickerModal,
  buildRequisitionPickerRows,
  locationsForItem,
} from './RequisitionItemPickerModal'
import { locLabel } from './txnLookups'
import {
  applyItemMaster,
  baseLine,
  formatStockQty,
  gridCell,
  gridHeadCell,
  gridInput,
  gridInputRight,
  toNum,
  useCodeIndex,
  useStockLookup,
  wholeQtyStr,
  type BaseLine,
} from './lineGrid'

export type RequisitionLine = BaseLine & {
  requestedQty: string
}

export function emptyLine(): RequisitionLine {
  return { ...baseLine(), requestedQty: '' }
}

function locationLabel(locationId: string, locationById: Map<string, ApiMasterRow>) {
  const row = locationById.get(locationId)
  return row ? locLabel(row) : locationId
}

/**
 * Editable requisition line grid. Pick an item from the search popup, then set qty.
 */
export function RequisitionItemLines({
  lines,
  onChange,
  items,
  units,
  locations,
  allLocations,
  readOnly = false,
  headerReady = true,
  error,
}: {
  lines: RequisitionLine[]
  onChange: Dispatch<SetStateAction<RequisitionLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  allLocations: ApiMasterRow[]
  readOnly?: boolean
  headerReady?: boolean
  error?: string
}) {
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(allLocations.length ? allLocations : locations)
  const allowedLocationIds = useMemo(() => new Set(locations.map((l) => l.id)), [locations])
  const linesLocked = readOnly || !headerReady

  const [globalStock, setGlobalStock] = useState<ItemLocationStock[]>([])
  const [stockLoading, setStockLoading] = useState(true)
  const [lineStock, setLineStock] = useState<Record<string, ItemLocationStock[]>>({})
  const [pickerLineKey, setPickerLineKey] = useState<string | null>(null)

  const refreshGlobalStock = useCallback(() => {
    let cancelled = false
    setStockLoading(true)
    ;(async () => {
      try {
        const rows = await fetchItemLocationStock()
        if (!cancelled) {
          setGlobalStock(rows)
          setStockLoading(false)
        }
      } catch {
        if (!cancelled) {
          setGlobalStock([])
          setStockLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => refreshGlobalStock(), [refreshGlobalStock])

  useEffect(() => {
    const onStock = () => refreshGlobalStock()
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshGlobalStock()
    }
    window.addEventListener('caits:stock-changed', onStock)
    window.addEventListener('focus', onStock)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('caits:stock-changed', onStock)
      window.removeEventListener('focus', onStock)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refreshGlobalStock])

  const pickerRows = useMemo(
    () =>
      buildRequisitionPickerRows(
        items,
        globalStock,
        allowedLocationIds,
        locationById,
        unitById,
      ),
    [items, globalStock, allowedLocationIds, locationById, unitById],
  )
  const patch = useCallback(
    (key: string, changes: Partial<RequisitionLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStockResolved = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: wholeQtyStr(qty) }),
    [patch],
  )
  const { loading: lineStockLoading, lookup } = useStockLookup(onStockResolved)

  const stockForItem = useCallback(
    (itemId: string) => lineStock[itemId] ?? globalStock.filter((r) => r.itemId === itemId),
    [lineStock, globalStock],
  )

  const ensureLineStock = useCallback(
    async (itemId: string) => {
      if (!itemId) return []
      if (lineStock[itemId]) return lineStock[itemId]
      const fetched = await fetchItemLocationStock(Number(itemId))
      setLineStock((prev) => ({ ...prev, [itemId]: fetched }))
      setGlobalStock((prev) => [...prev.filter((r) => r.itemId !== itemId), ...fetched])
      return fetched
    },
    [lineStock],
  )

  const applyItem = useCallback(
    async (line: RequisitionLine, itemId: string, locationId: string) => {
      const item = items.find((i) => i.id === itemId)
      if (!item || !locationId) return
      const rows = await ensureLineStock(itemId)
      const qty = rows.find((r) => r.locationId === locationId)?.qty ?? 0
      patch(line.key, {
        ...applyItemMaster(item, locationId),
        availableStock: wholeQtyStr(qty),
      })
      if (qty === 0) {
        void lookup(line.key, Number(itemId), locationId)
      }
    },
    [items, ensureLineStock, patch, lookup],
  )

  const clearItem = (line: RequisitionLine) => {
    patch(line.key, {
      itemId: '',
      itemCode: '',
      itemName: '',
      uomId: '',
      locationId: '',
      availableStock: '',
    })
  }

  const onLocationChange = (line: RequisitionLine, locationId: string) => {
    if (linesLocked || !line.itemId) return
    patch(line.key, { locationId, availableStock: '' })
    void lookup(line.key, Number(line.itemId), locationId)
  }

  const pickerLine = lines.find((l) => l.key === pickerLineKey) ?? null

  const handlePickerSelect = (itemId: string, locationId: string) => {
    if (!pickerLine) return
    void applyItem(pickerLine, itemId, locationId)
    setPickerLineKey(null)
  }

  useEffect(() => {
    if (linesLocked) return
    for (const line of lines) {
      if (!line.itemId || !line.locationId || line.availableStock !== '') continue
      void lookup(line.key, Number(line.itemId), line.locationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.map((l) => `${l.key}:${l.itemId}:${l.locationId}`).join('|'), linesLocked, lookup])

  const addLine = () => onChange((prev) => [...prev, emptyLine()])
  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyLine()]
    })

  return (
    <>
      <Card>
        <CardHeader
          title="Item Details"
          subtitle={
            !headerReady
              ? 'Complete all required header fields before selecting items.'
              : 'Click Search to pick an item and location from the list, then enter the requested quantity.'
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  <th className={`${gridHeadCell} w-[52px]`}>Sr No.</th>
                  <th className={`${gridHeadCell} min-w-[240px]`}>Item</th>
                  <th className={gridHeadCell}>Item Name</th>
                  <th className={`${gridHeadCell} w-[90px]`}>UOM</th>
                  <th className={`${gridHeadCell} w-[110px]`}>Requested Qty</th>
                  <th className={`${gridHeadCell} w-[110px]`}>Available Stock</th>
                  <th className={`${gridHeadCell} min-w-[200px]`}>Location</th>
                  <th className={`${gridHeadCell} w-[150px]`}>Remark</th>
                  <th className={`${gridHeadCell} w-[56px] text-center`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const unit = unitById.get(line.uomId)
                  const rows = line.itemId ? stockForItem(line.itemId) : []
                  const locOpts = line.itemId
                    ? locationsForItem(
                        line.itemId,
                        items,
                        rows,
                        allowedLocationIds,
                      )
                    : []
                  const shortfall =
                    line.itemId !== '' &&
                    line.availableStock !== '' &&
                    toNum(line.requestedQty) > toNum(line.availableStock)
                  const itemDisplay =
                    line.itemCode && line.itemName
                      ? `${line.itemCode} – ${line.itemName}`
                      : line.itemCode || ''

                  return (
                    <tr key={line.key} className="border-b border-[var(--border)] align-middle">
                      <td className={`${gridCell} text-center text-[var(--text3)]`}>{idx + 1}</td>
                      <td className={gridCell}>
                        {readOnly ? (
                          <Input value={line.itemCode} readOnly className={gridInput} />
                        ) : (
                          <div className="flex min-w-[220px] items-center gap-1">
                            <Input
                              value={itemDisplay}
                              readOnly
                              placeholder={!headerReady ? 'Fill header first' : '— Select Item —'}
                              title={itemDisplay}
                              className={`${gridInput} min-w-0 flex-1 cursor-pointer`}
                              onClick={() => !linesLocked && setPickerLineKey(line.key)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={linesLocked}
                              onClick={() => setPickerLineKey(line.key)}
                              className="shrink-0 px-2 py-1 text-[11px] font-semibold"
                            >
                              Search
                            </Button>
                            {line.itemId && (
                              <button
                                type="button"
                                aria-label="Clear item"
                                disabled={linesLocked}
                                onClick={() => clearItem(line)}
                                className="shrink-0 rounded px-1 text-[14px] text-[var(--text3)] hover:text-[var(--danger)] disabled:opacity-40"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.itemName}
                          readOnly
                          placeholder="Auto"
                          className={gridInput}
                          title={line.itemName}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={unit ? String(unit.code ?? '') : ''}
                          readOnly
                          placeholder="Auto"
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={line.requestedQty}
                          onChange={(e) => patch(line.key, { requestedQty: e.target.value })}
                          disabled={linesLocked || !line.itemId}
                          placeholder="0.00"
                          invalid={shortfall}
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={
                            lineStockLoading[line.key]
                              ? '…'
                              : line.availableStock !== ''
                                ? formatStockQty(Number(line.availableStock))
                                : ''
                          }
                          readOnly
                          placeholder="Auto"
                          title={shortfall ? 'Requested quantity exceeds available stock' : undefined}
                          className={gridInputRight}
                          style={shortfall ? { color: 'var(--danger)' } : undefined}
                        />
                      </td>
                      <td className={gridCell}>
                        <Select
                          value={line.locationId}
                          onChange={(e) => onLocationChange(line, e.target.value)}
                          disabled={linesLocked || !line.itemId}
                          className={gridInput}
                        >
                          <option value="">— Select Location —</option>
                          {locOpts.map((loc) => (
                            <option key={loc.locationId} value={loc.locationId}>
                              {locationLabel(loc.locationId, locationById)}
                            </option>
                          ))}
                          {line.locationId && !locOpts.some((l) => l.locationId === line.locationId) && (
                            <option value={line.locationId}>
                              {locationLabel(line.locationId, locationById)}
                            </option>
                          )}
                        </Select>
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.remark}
                          onChange={(e) => patch(line.key, { remark: e.target.value })}
                          disabled={linesLocked}
                          maxLength={200}
                          placeholder="Remark…"
                          className={gridInput}
                        />
                      </td>
                      <td className={`${gridCell} text-center`}>
                        <button
                          type="button"
                          aria-label={`Remove line ${idx + 1}`}
                          onClick={() => removeLine(line.key)}
                          disabled={linesLocked}
                          className="rounded px-1.5 text-[14px] leading-none text-[var(--text3)] transition hover:text-[var(--danger)] disabled:opacity-40"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3.5 py-2.5">
            {error ? <span className="text-[11px] font-medium text-[var(--danger)]">{error}</span> : <span />}
            {!readOnly && (
              <Button variant="ghost" onClick={addLine} disabled={linesLocked}>
                + Add Line
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <RequisitionItemPickerModal
        open={pickerLineKey != null}
        onClose={() => setPickerLineKey(null)}
        onSelect={handlePickerSelect}
        rows={pickerRows}
        loading={stockLoading}
        selectedItemId={pickerLine?.itemId ?? ''}
        selectedLocationId={pickerLine?.locationId ?? ''}
        subtitle="Choose an item from the list, then pick the store location. Each item is shown once."
      />
    </>
  )
}
