import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import { fetchAvailableSerials, fetchItemLocationStock, type AvailableSerialUnit, type ItemLocationStock } from '@/api/transactions'
import {
  RequisitionItemPickerModal,
  buildRequisitionPickerRows,
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

export type IssueLine = BaseLine & {
  detailId?: number
  requestedQty: string
  issueQty: string
  batchLotNo: string
  serialNo: string
  ipAddress: string
  macAddress: string
  hostname: string
  itemType: string
}

export function emptyLine(): IssueLine {
  return {
    ...baseLine(),
    requestedQty: '',
    issueQty: '',
    batchLotNo: '',
    serialNo: '',
    ipAddress: '',
    macAddress: '',
    hostname: '',
    itemType: '',
  }
}

/**
 * Issue line grid — pick item + store location from a popup (same pattern as Store Requisition).
 * From Location on each line comes from the header / picker; To Location is header-driven.
 */
export function IssueItemLines({
  lines,
  onChange,
  items,
  units,
  locations,
  storeLocationId,
  toLocationId = '',
  readOnly = false,
  lockStockFields = false,
  headerReady = true,
  /** When set (issue against requisition), Search only lists these item IDs. */
  requestedItemIds,
  error,
}: {
  lines: IssueLine[]
  onChange: Dispatch<SetStateAction<IssueLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  storeLocationId: string
  toLocationId?: string
  readOnly?: boolean
  /** Locks item / qty / batch / remark while leaving asset identity fields editable. */
  lockStockFields?: boolean
  /** When false, item grid stays locked until required header fields are filled. */
  headerReady?: boolean
  requestedItemIds?: string[]
  error?: string
}) {
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const linesLocked = readOnly || lockStockFields || !headerReady
  const lineFieldsLocked = readOnly || lockStockFields
  const assetFieldsLocked = readOnly

  const allowedLocationIds = useMemo(() => {
    if (storeLocationId) return new Set([storeLocationId])
    return new Set(locations.map((l) => l.id))
  }, [storeLocationId, locations])

  const [globalStock, setGlobalStock] = useState<ItemLocationStock[]>([])
  const [stockListLoading, setStockListLoading] = useState(true)
  const [pickerLineKey, setPickerLineKey] = useState<string | null>(null)
  const [serialOptions, setSerialOptions] = useState<Record<string, AvailableSerialUnit[]>>({})

  const patch = useCallback(
    (key: string, changes: Partial<IssueLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStock = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: wholeQtyStr(qty) }),
    [patch],
  )
  const { loading: stockLoading, lookup } = useStockLookup(onStock)

  const refreshGlobalStock = useCallback(() => {
    let cancelled = false
    setStockListLoading(true)
    ;(async () => {
      try {
        const rows = await fetchItemLocationStock()
        const scoped =
          storeLocationId && /^\d+$/.test(storeLocationId)
            ? rows.filter((r) => r.locationId === storeLocationId)
            : rows
        if (!cancelled) {
          setGlobalStock(scoped)
          setStockListLoading(false)
        }
      } catch {
        if (!cancelled) {
          setGlobalStock([])
          setStockListLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [storeLocationId])

  useEffect(() => refreshGlobalStock(), [refreshGlobalStock])

  useEffect(() => {
    const onStockEvt = () => refreshGlobalStock()
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshGlobalStock()
    }
    window.addEventListener('caits:stock-changed', onStockEvt)
    window.addEventListener('focus', onStockEvt)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('caits:stock-changed', onStockEvt)
      window.removeEventListener('focus', onStockEvt)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refreshGlobalStock])

  const itemIdsKey = useMemo(() => lines.map((l) => `${l.key}:${l.itemId}:${l.locationId}`).join('|'), [lines])

  useEffect(() => {
    if (linesLocked) return
    for (const line of lines) {
      if (!line.itemId) continue
      const loc = line.locationId || storeLocationId
      if (loc) void lookup(line.key, Number(line.itemId), loc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeLocationId, itemIdsKey, linesLocked, lookup, globalStock])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next: Record<string, AvailableSerialUnit[]> = {}
      for (const line of lines) {
        if (!line.itemId) continue
        const kind = line.itemType || items.find((i) => i.id === line.itemId)?.itemType
        if (kind === 'consumable') continue
        try {
          const loc = line.locationId || storeLocationId
          const units = await fetchAvailableSerials(
            Number(line.itemId),
            loc && /^\d+$/.test(loc) ? Number(loc) : undefined,
          )
          if (!cancelled) next[line.key] = units
        } catch {
          if (!cancelled) next[line.key] = []
        }
      }
      if (!cancelled) setSerialOptions(next)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdsKey, storeLocationId, items])

  const pickerLine = lines.find((l) => l.key === pickerLineKey) ?? null

  /** Requisition-backed issue: only requested items (narrowed to the line's item when set). */
  const pickerItems = useMemo(() => {
    const reqIds = (requestedItemIds ?? []).filter(Boolean)
    let pool = items
    if (reqIds.length > 0) {
      const allowed = new Set(reqIds)
      pool = items.filter((i) => allowed.has(i.id))
    }
    if (pickerLine?.itemId) {
      const only = pool.filter((i) => i.id === pickerLine.itemId)
      if (only.length > 0) return only
      const hit = items.find((i) => i.id === pickerLine.itemId)
      return hit ? [hit] : only
    }
    return pool
  }, [items, requestedItemIds, pickerLine?.itemId])

  const pickerRows = useMemo(
    () =>
      buildRequisitionPickerRows(
        pickerItems,
        globalStock,
        allowedLocationIds,
        locationById,
        unitById,
        { stockedOnly: true },
      ),
    [pickerItems, globalStock, allowedLocationIds, locationById, unitById],
  )

  const applySerial = (line: IssueLine, serialNo: string) => {
    const hit = (serialOptions[line.key] ?? []).find(
      (u) => String(u.serialNo ?? '').toUpperCase() === serialNo.toUpperCase(),
    )
    patch(line.key, {
      serialNo,
      ipAddress: hit?.ipAddress ?? line.ipAddress,
      macAddress: hit?.macAddress ?? line.macAddress,
      hostname: hit?.hostname ?? line.hostname,
      batchLotNo: hit?.batchLotNo ?? line.batchLotNo,
    })
  }

  const applyItem = useCallback(
    async (line: IssueLine, itemId: string, locationId: string, serial?: AvailableSerialUnit) => {
      const item = items.find((i) => i.id === itemId)
      if (!item || !locationId) return
      const qty =
        globalStock
          .filter((r) => r.itemId === itemId && r.locationId === locationId)
          .reduce((sum, r) => sum + r.qty, 0) || 0
      const keepRequested =
        line.requestedQty !== ''
          ? { requestedQty: line.requestedQty, issueQty: line.issueQty || line.requestedQty }
          : {}
      patch(line.key, {
        ...applyItemMaster(item, locationId),
        itemType: String(item.itemType ?? ''),
        availableStock: wholeQtyStr(qty),
        serialNo: serial?.serialNo ?? '',
        ipAddress: serial?.ipAddress ?? '',
        macAddress: serial?.macAddress ?? '',
        hostname: serial?.hostname ?? '',
        batchLotNo: serial?.batchLotNo ?? '',
        ...keepRequested,
      })
      void lookup(line.key, Number(itemId), locationId)
    },
    [items, globalStock, patch, lookup],
  )

  const clearItem = (line: IssueLine) => {
    patch(line.key, {
      itemId: '',
      itemCode: '',
      itemName: '',
      uomId: '',
      locationId: '',
      availableStock: '',
      itemType: '',
      serialNo: '',
      ipAddress: '',
      macAddress: '',
      hostname: '',
      batchLotNo: '',
    })
  }

  const handlePickerSelect = (
    itemId: string,
    locationId: string,
    serial?: AvailableSerialUnit,
  ) => {
    if (!pickerLine) return
    void applyItem(pickerLine, itemId, locationId, serial)
    setPickerLineKey(null)
  }

  const addLine = () => onChange((prev) => [...prev, emptyLine()])
  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyLine()]
    })

  const displayStock = (line: IssueLine) => {
    if (stockLoading[line.key]) return '…'
    if (line.availableStock !== '') return formatStockQty(Number(line.availableStock))
    return ''
  }

  const toLoc = locationById.get(toLocationId)
  const fromStoreLabel = storeLocationId
    ? (() => {
        const loc = locationById.get(storeLocationId)
        return loc ? locLabel(loc) : storeLocationId
      })()
    : ''

  return (
    <>
      <Card>
        <CardHeader
          title="Item Details"
          subtitle={
            !headerReady
              ? 'Complete all required header fields before selecting items.'
              : storeLocationId
                ? `Search items with stock at ${fromStoreLabel || 'the From Location'}. Batch is optional (FIFO if blank).`
                : 'From Location is required before picking items.'
          }
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  <th className={`${gridHeadCell} w-[52px]`}>Sr No.</th>
                  <th className={`${gridHeadCell} min-w-[220px]`}>Item Code</th>
                  <th className={gridHeadCell}>Item Name</th>
                  <th className={`${gridHeadCell} w-[90px]`}>UOM</th>
                  <th className={`${gridHeadCell} w-[150px]`}>Serial No.</th>
                  <th className={`${gridHeadCell} w-[120px]`}>IP Address</th>
                  <th className={`${gridHeadCell} w-[130px]`}>MAC Address</th>
                  <th className={`${gridHeadCell} w-[140px]`}>Hostname</th>
                  <th className={`${gridHeadCell} w-[110px]`}>Requested Qty</th>
                  <th className={`${gridHeadCell} w-[110px]`}>Issue Qty</th>
                  <th className={`${gridHeadCell} w-[110px]`}>Available Stock</th>
                  <th className={`${gridHeadCell} w-[120px]`}>Batch / Lot</th>
                  <th className={`${gridHeadCell} w-[150px]`}>From Location</th>
                  <th className={`${gridHeadCell} w-[150px]`}>To Location</th>
                  <th className={`${gridHeadCell} w-[150px]`}>Remark</th>
                  <th className={`${gridHeadCell} w-[56px] text-center`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const unit = unitById.get(line.uomId)
                  const location = locationById.get(line.locationId || storeLocationId)
                  const isAsset =
                    line.itemType === 'asset' || items.find((i) => i.id === line.itemId)?.itemType === 'asset'
                  const shownStock = displayStock(line)
                  const shortfall =
                    line.itemId !== '' &&
                    shownStock !== '' &&
                    shownStock !== '…' &&
                    toNum(line.issueQty) > toNum(shownStock)
                  const itemDisplay =
                    line.itemCode && line.itemName
                      ? `${line.itemCode} – ${line.itemName}`
                      : line.itemCode || ''

                  return (
                    <tr key={line.key} className="border-b border-[var(--border)] align-middle">
                      <td className={`${gridCell} text-center text-[var(--text3)]`}>{idx + 1}</td>
                      <td className={gridCell}>
                        {readOnly || lockStockFields ? (
                          <Input value={line.itemCode} readOnly className={gridInput} />
                        ) : (
                          <div className="flex min-w-[200px] items-center gap-1">
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
                        <Input value={line.itemName} readOnly placeholder="—" className={gridInput} />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={unit ? String(unit.code ?? '') : ''}
                          readOnly
                          placeholder="—"
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        {isAsset ? (
                          <Select
                            value={line.serialNo}
                            onChange={(e) => applySerial(line, e.target.value)}
                            disabled={assetFieldsLocked || !line.itemId}
                            className={gridInput}
                            title={line.serialNo || undefined}
                          >
                            <option value="">— Select serial —</option>
                            {line.serialNo &&
                              !(serialOptions[line.key] ?? []).some(
                                (u) =>
                                  String(u.serialNo ?? '').toUpperCase() ===
                                  line.serialNo.toUpperCase(),
                              ) && <option value={line.serialNo}>{line.serialNo} (current)</option>}
                            {(serialOptions[line.key] ?? []).map((u) => (
                              <option key={u.blsId} value={String(u.serialNo ?? '')}>
                                {u.serialNo}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className="px-1 text-[11px] text-[var(--text3)]">—</span>
                        )}
                      </td>
                      <td className={gridCell}>
                        {isAsset ? (
                          <Input
                            value={line.ipAddress}
                            onChange={(e) => patch(line.key, { ipAddress: e.target.value })}
                            disabled={assetFieldsLocked}
                            maxLength={45}
                            className={gridInput}
                          />
                        ) : (
                          <span className="px-1 text-[11px] text-[var(--text3)]">—</span>
                        )}
                      </td>
                      <td className={gridCell}>
                        {isAsset ? (
                          <Input
                            value={line.macAddress}
                            onChange={(e) =>
                              patch(line.key, { macAddress: e.target.value.toUpperCase() })
                            }
                            disabled={assetFieldsLocked}
                            maxLength={17}
                            className={gridInput}
                          />
                        ) : (
                          <span className="px-1 text-[11px] text-[var(--text3)]">—</span>
                        )}
                      </td>
                      <td className={gridCell}>
                        {isAsset ? (
                          <Input
                            value={line.hostname}
                            onChange={(e) => patch(line.key, { hostname: e.target.value })}
                            disabled={assetFieldsLocked}
                            maxLength={150}
                            className={gridInput}
                          />
                        ) : (
                          <span className="px-1 text-[11px] text-[var(--text3)]">—</span>
                        )}
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.requestedQty}
                          readOnly
                          placeholder="—"
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={line.issueQty}
                          onChange={(e) => patch(line.key, { issueQty: e.target.value })}
                          disabled={lineFieldsLocked}
                          placeholder="0"
                          invalid={shortfall}
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={shownStock}
                          readOnly
                          placeholder="—"
                          title={
                            shortfall
                              ? 'Issue quantity exceeds available stock'
                              : line.itemId
                                ? 'Live stock at From Location'
                                : undefined
                          }
                          className={gridInputRight}
                          style={shortfall ? { color: 'var(--danger)' } : undefined}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.batchLotNo}
                          onChange={(e) => patch(line.key, { batchLotNo: e.target.value })}
                          disabled={lineFieldsLocked}
                          placeholder="Optional"
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={location ? locLabel(location) : ''}
                          readOnly
                          placeholder="—"
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={toLoc ? locLabel(toLoc) : ''}
                          readOnly
                          placeholder="—"
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.remark}
                          onChange={(e) => patch(line.key, { remark: e.target.value })}
                          disabled={lineFieldsLocked}
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

          <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
            <Button variant="ghost" onClick={addLine} disabled={linesLocked}>
              + Add Line
            </Button>
            {error && <span className="text-[11px] font-medium text-[var(--danger)]">{error}</span>}
            <div className="flex-1" />
            <span className="text-[11px] font-semibold text-[var(--text2)]">
              Total Items: {lines.filter((l) => l.itemId !== '').length}
            </span>
          </div>
        </CardBody>
      </Card>

      <RequisitionItemPickerModal
        open={pickerLineKey != null}
        onClose={() => setPickerLineKey(null)}
        onSelect={handlePickerSelect}
        rows={pickerRows}
        loading={stockListLoading}
        selectedItemId={pickerLine?.itemId ?? ''}
        selectedLocationId={pickerLine?.locationId || storeLocationId}
        showSerialColumn
        title="Select Item"
        subtitle={
          fromStoreLabel
            ? requestedItemIds && requestedItemIds.length > 0
              ? `Only items from the selected requisition with stock at ${fromStoreLabel}. For assets, pick a Serial No.`
              : `Items with stock at ${fromStoreLabel}. For assets, pick a Serial No. from the dropdown.`
            : 'Choose an item and store location with available stock.'
        }
      />
    </>
  )
}
