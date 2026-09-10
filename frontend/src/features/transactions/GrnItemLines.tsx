import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { CsvImportButton } from '@/components/ui/CsvImportButton'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import { fetchItemLocationStock, type ItemLocationStock } from '@/api/transactions'
import {
  RequisitionItemPickerModal,
  buildRequisitionPickerRows,
} from './RequisitionItemPickerModal'
import {
  applyItemMaster,
  baseLine,
  formatStockQty,
  gridCell,
  gridHeadCell,
  gridInput,
  gridInputRight,
  money,
  toNum,
  useCodeIndex,
  useStockLookup,
  gridHeadLabel,
  wholeQtyStr,
  type BaseLine,
} from './lineGrid'
import {
  LINE_IMPORT_HEADERS,
  LINE_IMPORT_SAMPLE,
  importGrnLines,
} from './lineCsvImport'
import type { ItemKind } from './OpeningStockItemLines'
import { locLabel, nonSystemLocations, rejectedForEntity, systemLocations } from './txnLookups'

export type GrnLine = BaseLine & {
  receivedQty: string
  acceptedQty: string
  rejectedQty: string
  amount: string
  serialNo: string
  ipAddress: string
  macAddress: string
  hostname: string
  itemCondition: string
  batch: string
}

export function emptyGrnLine(): GrnLine {
  return {
    ...baseLine(),
    receivedQty: '',
    acceptedQty: '',
    rejectedQty: '',
    amount: '',
    serialNo: '',
    ipAddress: '',
    macAddress: '',
    hostname: '',
    itemCondition: '',
    batch: '',
  }
}

function orgForLocations(locations: ApiMasterRow[], locationId: string) {
  const loc = locations.find((l) => String(l.id) === String(locationId))
  if (loc?.orgCode) return String(loc.orgCode)
  const sys = systemLocations(locations)[0]
  return sys?.orgCode ? String(sys.orgCode) : ''
}

function lockedLocationForLine(
  _item: ApiMasterRow | undefined,
  accepted: number,
  rejected: number,
  locations: ApiMasterRow[],
  currentLoc: string,
): { locationId: string; locked: boolean } {
  const org = orgForLocations(locations, currentLoc)
  // Fully rejected → lock to Rejected store. Accepted inspection lines keep the GRN
  // destination (or item default); stock still posts to Quarantine on the backend.
  if (rejected > 0 && accepted <= 0) {
    const id = rejectedForEntity(locations, org)
    return { locationId: id || currentLoc, locked: Boolean(id) }
  }
  return { locationId: currentLoc, locked: false }
}

/**
 * GRN Item Details — Item Type drives extra columns:
 * Asset → serial / network fields; each unit line has received 1 with editable accepted / rejected.
 * Consumable → batch + editable received / accepted / rejected.
 * Shared on every line: Received, Accepted, Rejected, Available Stock, Amount, Location, Remark.
 */
export function GrnItemLines({
  lines,
  onChange,
  itemType,
  onItemTypeChange,
  items,
  units,
  locations,
  vendors: _vendors,
  locationOptions = [],
  allItems,
  readOnly = false,
  headerReady = true,
  showLineErrors = false,
  error,
}: {
  lines: GrnLine[]
  onChange: Dispatch<SetStateAction<GrnLine[]>>
  itemType: ItemKind
  onItemTypeChange: (next: ItemKind) => void
  items: ApiMasterRow[]
  allItems?: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  vendors?: ApiMasterRow[]
  locationOptions?: { value: string; label: string }[]
  readOnly?: boolean
  headerReady?: boolean
  showLineErrors?: boolean
  error?: string
}) {
  void _vendors
  const isAsset = itemType === 'asset'
  const linesLocked = readOnly || !headerReady
  const filteredItems = useMemo(
    () => items.filter((i) => (i.itemType === 'consumable' ? 'consumable' : 'asset') === itemType),
    [items, itemType],
  )
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const importPool = allItems ?? items
  const operationalLocs = useMemo(() => nonSystemLocations(locations), [locations])
  const allowedLocationIds = useMemo(() => new Set(operationalLocs.map((l) => l.id)), [operationalLocs])

  const [pickItemId, setPickItemId] = useState('')
  const [pickLocationId, setPickLocationId] = useState('')
  const [pickQty, setPickQty] = useState('1')
  const [addError, setAddError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [globalStock, setGlobalStock] = useState<ItemLocationStock[]>([])
  const [stockLoading, setStockLoading] = useState(true)

  const patch = useCallback(
    (key: string, changes: Partial<GrnLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStock = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: wholeQtyStr(qty) }),
    [patch],
  )
  const { loading: lineStockLoading, lookup } = useStockLookup(onStock)

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

  /* Keep Available Stock column in sync when line location / ledger stock changes. */
  useEffect(() => {
    lines.forEach((l) => {
      if (!l.itemId || !l.locationId) return
      void lookup(l.key, Number(l.itemId), l.locationId)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalStock, lookup])

  const pickerRows = useMemo(
    () =>
      buildRequisitionPickerRows(
        filteredItems,
        globalStock,
        allowedLocationIds,
        locationById,
        unitById,
        { stockedOnly: false },
      ),
    [filteredItems, globalStock, allowedLocationIds, locationById, unitById],
  )

  const pickItem = filteredItems.find((i) => i.id === pickItemId)
  const pickLocationLabel = pickLocationId
    ? (() => {
        const loc = locationById.get(pickLocationId)
        return loc ? locLabel(loc) : pickLocationId
      })()
    : ''
  const pickDisplay =
    pickItem && pickLocationId
      ? `${pickItem.code} – ${pickItem.name} @ ${pickLocationLabel}`
      : ''

  const buildLine = (item: ApiMasterRow, qty: number, locationId: string): GrnLine => {
    const cost = toNum(item.standardCost as number)
    const accepted = qty
    const rejected = 0
    // Prefer picker location; fall back to item default (ideal) store.
    const destination = locationId || String(item.store ?? '')
    const locked = lockedLocationForLine(item, accepted, rejected, locations, destination)
    return {
      ...emptyGrnLine(),
      ...applyItemMaster(item, locked.locationId || destination),
      receivedQty: wholeQtyStr(qty),
      acceptedQty: wholeQtyStr(qty),
      rejectedQty: '0',
      amount: cost > 0 ? String(qty * cost) : '',
    }
  }

  const addUnits = () => {
    if (linesLocked) return
    setAddError('')
    const item = filteredItems.find((i) => i.id === pickItemId)
    if (!item || !pickLocationId) {
      setAddError('Select an item and location from the popup first')
      return
    }
    const n = Math.floor(toNum(pickQty))
    if (n <= 0) {
      setAddError('Quantity must be greater than 0')
      return
    }
    if (isAsset && n > 200) {
      setAddError('Max 200 asset units at a time')
      return
    }

    if (isAsset) {
      const created = Array.from({ length: n }, () => buildLine(item, 1, pickLocationId))
      onChange((prev) => {
        const keep = prev.filter((l) => l.itemId !== '')
        return [...keep, ...created]
      })
      created.forEach((l) => void lookup(l.key, Number(item.id), pickLocationId))
    } else {
      const line = buildLine(item, n, pickLocationId)
      onChange((prev) => {
        const keep = prev.filter((l) => l.itemId !== '')
        return [...keep, line]
      })
      void lookup(line.key, Number(item.id), pickLocationId)
    }
    setPickQty('1')
    setPickItemId('')
    setPickLocationId('')
  }

  const changeType = (next: ItemKind) => {
    onItemTypeChange(next)
    onChange([emptyGrnLine()])
    setPickItemId('')
    setPickLocationId('')
    setPickQty('1')
    setAddError('')
  }

  const onPickerSelect = (itemId: string, locationId: string) => {
    setPickItemId(itemId)
    setPickLocationId(locationId)
    setPickerOpen(false)
    setAddError('')
  }

  const onLocationChange = (line: GrnLine, locationId: string) => {
    patch(line.key, { locationId })
    if (line.itemId) void lookup(line.key, Number(line.itemId), locationId)
  }

  const defaultImportLocation =
    pickLocationId || lines.find((l) => l.locationId)?.locationId || operationalLocs[0]?.id || ''

  const onImport = (rows: Record<string, string>[]) => {
    const imported = importGrnLines(rows, {
      items: importPool,
      locations,
      vendors: [],
      defaultLocationId: defaultImportLocation,
      activeItemType: itemType,
      docKind: 'grn',
    }).map((l) => {
      const item = items.find((i) => i.id === l.itemId)
      const locked = lockedLocationForLine(item, toNum(l.acceptedQty), toNum(l.rejectedQty), locations, l.locationId)
      return { ...l, locationId: locked.locationId }
    })
    imported.forEach((l) => {
      if (l.itemId && l.locationId) void lookup(l.key, Number(l.itemId), l.locationId)
    })
    onChange((prev) => {
      const keep = prev.filter((l) => l.itemId !== '')
      return [...keep, ...imported]
    })
  }

  const applyQtyLocation = (line: GrnLine, acceptedQty: string, rejectedQty: string) => {
    const item = items.find((i) => i.id === line.itemId)
    const locked = lockedLocationForLine(item, toNum(acceptedQty), toNum(rejectedQty), locations, line.locationId)
    return { acceptedQty, rejectedQty, locationId: locked.locationId }
  }

  const setReceived = (line: GrnLine, value: string) => {
    if (isAsset) return
    const received = toNum(value)
    const item = items.find((i) => i.id === line.itemId)
    const cost = item ? toNum(item.standardCost as number) : 0
    const accepted = line.acceptedQty === '' ? value : line.acceptedQty
    const rejected = String(Math.max(received - toNum(accepted), 0))
    patch(line.key, {
      receivedQty: value,
      ...applyQtyLocation(line, accepted, rejected),
      amount: cost > 0 ? String(received * cost) : line.amount,
    })
  }

  const setAccepted = (line: GrnLine, value: string) => {
    const rejected = String(Math.max(toNum(line.receivedQty) - toNum(value), 0))
    const locPatch = applyQtyLocation(line, value, rejected)
    patch(line.key, locPatch)
  }

  const setRejected = (line: GrnLine, value: string) => {
    if (isAsset) {
      const accepted = String(Math.max(toNum(line.receivedQty) - toNum(value), 0))
      patch(line.key, applyQtyLocation(line, accepted, value))
      return
    }
    patch(line.key, applyQtyLocation(line, line.acceptedQty, value))
  }

  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyGrnLine()]
    })

  const filled = lines.filter((l) => l.itemId !== '')
  const totalAmount = filled.reduce((sum, l) => sum + toNum(l.amount), 0)
  const typeColSpan = isAsset ? 4 : 1
  const emptyColSpan = 4 + typeColSpan + 7

  return (
    <>
    <Card>
      <CardHeader
        title="Item Details"
        subtitle={
          !headerReady
            ? 'Complete GRN date and supplier before selecting items.'
            : isAsset
              ? 'Asset qty expands into unit lines — mark each unit accepted or rejected (received stays 1 per unit)'
              : 'Received, accepted and rejected quantities per line'
        }
      />
      <CardBody className="p-0">
        {!readOnly && (
          <div className="flex flex-wrap items-end gap-2 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
            <label className="flex min-w-[140px] flex-col gap-0.5 text-[11px] font-semibold text-[var(--text2)]">
              Item Type
              <Select
                value={itemType}
                onChange={(e) => changeType(e.target.value as ItemKind)}
                disabled={linesLocked}
                className={gridInput}
              >
                <option value="asset">Asset</option>
                <option value="consumable">Consumable</option>
              </Select>
            </label>
            <label className="flex min-w-[260px] flex-1 flex-col gap-0.5 text-[11px] font-semibold text-[var(--text2)]">
              Item / Location
              <div className="flex items-center gap-1">
                <Input
                  value={pickDisplay}
                  readOnly
                  placeholder={!headerReady ? '— Fill header first —' : '— Select item & location —'}
                  title={pickDisplay}
                  className={`${gridInput} min-w-0 flex-1 cursor-pointer`}
                  onClick={() => !linesLocked && setPickerOpen(true)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  disabled={linesLocked}
                  onClick={() => setPickerOpen(true)}
                  className="shrink-0 px-2 py-1 text-[11px] font-semibold"
                >
                  Search
                </Button>
                {pickItemId && (
                  <button
                    type="button"
                    aria-label="Clear selection"
                    disabled={linesLocked}
                    onClick={() => {
                      setPickItemId('')
                      setPickLocationId('')
                    }}
                    className="shrink-0 rounded px-1 text-[14px] text-[var(--text3)] hover:text-[var(--danger)] disabled:opacity-40"
                  >
                    ×
                  </button>
                )}
              </div>
            </label>
            <label className="flex w-[100px] flex-col gap-0.5 text-[11px] font-semibold text-[var(--text2)]">
              Qty
              <Input
                type="number"
                min={1}
                step={1}
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
                disabled={linesLocked}
                className={gridInputRight}
              />
            </label>
            <Button onClick={addUnits} disabled={linesLocked}>
              {isAsset ? '+ Add Units' : '+ Add Line'}
            </Button>
            {!readOnly && (
              <CsvImportButton
                templateFilename="grn_item_lines_template.csv"
                templateHeaders={LINE_IMPORT_HEADERS}
                sampleRow={LINE_IMPORT_SAMPLE}
                disabled={linesLocked}
                onRows={onImport}
              />
            )}
            {(addError || error) && (
              <span className="text-[11px] font-medium text-[var(--danger)]">{addError || error}</span>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-max min-w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} min-w-[52px] whitespace-nowrap`}>Sr No.</th>
                <th className={`${gridHeadCell} min-w-[140px] whitespace-nowrap`}>{gridHeadLabel('Item Code', true)}</th>
                <th className={`${gridHeadCell} min-w-[180px] whitespace-nowrap`}>{gridHeadLabel('Item Name', true)}</th>
                <th className={`${gridHeadCell} min-w-[70px] whitespace-nowrap`}>UOM</th>
                {isAsset ? (
                  <>
                    <th className={`${gridHeadCell} min-w-[150px] whitespace-nowrap`}>{gridHeadLabel('Serial No.', true)}</th>
                    <th className={`${gridHeadCell} min-w-[130px] whitespace-nowrap`}>IP Address</th>
                    <th className={`${gridHeadCell} min-w-[140px] whitespace-nowrap`}>MAC Address</th>
                    <th className={`${gridHeadCell} min-w-[140px] whitespace-nowrap`}>Hostname</th>
                  </>
                ) : (
                  <th className={`${gridHeadCell} min-w-[120px] whitespace-nowrap`}>Batch / Lot</th>
                )}
                <th className={`${gridHeadCell} min-w-[110px] whitespace-nowrap`}>{gridHeadLabel('Received Qty', !isAsset)}</th>
                <th className={`${gridHeadCell} min-w-[110px] whitespace-nowrap`}>Accepted Qty</th>
                <th className={`${gridHeadCell} min-w-[110px] whitespace-nowrap`}>Rejected Qty</th>
                <th className={`${gridHeadCell} min-w-[120px] whitespace-nowrap`}>Available Stock</th>
                <th className={`${gridHeadCell} min-w-[110px] whitespace-nowrap`}>Amount (₹)</th>
                <th className={`${gridHeadCell} min-w-[170px] whitespace-nowrap`}>{gridHeadLabel('Location', true)}</th>
                <th className={`${gridHeadCell} min-w-[140px] whitespace-nowrap`}>Remark</th>
                <th className={`${gridHeadCell} min-w-[56px] whitespace-nowrap text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filled.length === 0 ? (
                <tr>
                  <td colSpan={emptyColSpan} className="px-3 py-6 text-center text-[12px] text-[var(--text3)]">
                    {isAsset
                      ? 'No units yet — search an item & location, set qty, then Add Units.'
                      : 'No lines yet — search an item & location, set qty, then Add Line.'}
                  </td>
                </tr>
              ) : (
                filled.map((line, idx) => {
                  const unit = unitById.get(line.uomId)
                  const serialMissing = isAsset && !line.serialNo.trim()
                  const locationMissing = !line.locationId
                  const received = toNum(line.receivedQty)
                  const split = toNum(line.acceptedQty) + toNum(line.rejectedQty)
                  const splitMismatch =
                    line.itemId !== '' &&
                    received > 0 &&
                    Math.abs(split - received) > 0.0001
                  const item = items.find((i) => i.id === line.itemId)
                  const locLock = lockedLocationForLine(
                    item,
                    toNum(line.acceptedQty),
                    toNum(line.rejectedQty),
                    locations,
                    line.locationId,
                  )
                  const locOptions =
                    locLock.locationId && !locationOptions.some((o) => o.value === locLock.locationId)
                      ? [
                          ...locationOptions,
                          {
                            value: locLock.locationId,
                            label:
                              locations.find((l) => l.id === locLock.locationId)
                                ? `${locations.find((l) => l.id === locLock.locationId)?.code} – ${locations.find((l) => l.id === locLock.locationId)?.name}`
                                : locLock.locationId,
                          },
                        ]
                      : locationOptions
                  return (
                    <tr key={line.key} className="border-b border-[var(--border)] align-middle">
                      <td className={`${gridCell} text-center text-[var(--text3)]`}>{idx + 1}</td>
                      <td className={gridCell}>
                        <Input value={line.itemCode} readOnly className={gridInput} />
                      </td>
                      <td className={gridCell}>
                        <Input value={line.itemName} readOnly className={gridInput} />
                      </td>
                      <td className={gridCell}>
                        <Input value={unit ? String(unit.code ?? '') : ''} readOnly className={gridInput} />
                      </td>
                      {isAsset ? (
                        <>
                          <td className={gridCell}>
                            <Input
                              value={line.serialNo}
                              onChange={(e) => patch(line.key, { serialNo: e.target.value.toUpperCase() })}
                              disabled={linesLocked}
                              maxLength={100}
                              placeholder="SN-…"
                              invalid={showLineErrors && serialMissing}
                              className={gridInput}
                            />
                          </td>
                          <td className={gridCell}>
                            <Input
                              value={line.ipAddress}
                              onChange={(e) => patch(line.key, { ipAddress: e.target.value })}
                              disabled={linesLocked}
                              maxLength={45}
                              placeholder="192.168.0.25"
                              className={gridInput}
                            />
                          </td>
                          <td className={gridCell}>
                            <Input
                              value={line.macAddress}
                              onChange={(e) =>
                                patch(line.key, { macAddress: e.target.value.toUpperCase() })
                              }
                              disabled={linesLocked}
                              maxLength={17}
                              placeholder="AA-BB-…"
                              className={gridInput}
                            />
                          </td>
                          <td className={gridCell}>
                            <Input
                              value={line.hostname}
                              onChange={(e) => patch(line.key, { hostname: e.target.value })}
                              disabled={linesLocked}
                              maxLength={150}
                              placeholder="host.local"
                              className={gridInput}
                            />
                          </td>
                        </>
                      ) : (
                        <td className={gridCell}>
                          <Input
                            value={line.batch}
                            onChange={(e) => patch(line.key, { batch: e.target.value })}
                            disabled={linesLocked}
                            placeholder="Batch / lot"
                            className={gridInput}
                          />
                        </td>
                      )}
                      <td className={gridCell}>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={line.receivedQty}
                          onChange={(e) => setReceived(line, e.target.value)}
                          disabled={linesLocked || isAsset}
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={line.acceptedQty}
                          onChange={(e) => setAccepted(line, e.target.value)}
                          disabled={linesLocked}
                          invalid={splitMismatch}
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={line.rejectedQty}
                          onChange={(e) => setRejected(line, e.target.value)}
                          disabled={linesLocked}
                          invalid={splitMismatch}
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
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={line.amount}
                          onChange={(e) => patch(line.key, { amount: e.target.value })}
                          disabled={linesLocked}
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Select
                          value={locLock.locationId || line.locationId}
                          onChange={(e) => onLocationChange(line, e.target.value)}
                          disabled={linesLocked || locLock.locked}
                          invalid={showLineErrors && locationMissing}
                          className={gridInput}
                        >
                          <option value="">— Select —</option>
                          {locOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
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
                })
              )}
              {filled.length > 0 && (
                <tr>
                  <td
                    colSpan={4 + typeColSpan + 3}
                    className="px-2 py-1.5 text-right text-[11px] font-semibold text-[var(--accent)]"
                  >
                    Total Amount →
                  </td>
                  <td className="px-2 py-1.5 text-right text-[12px] font-bold text-[var(--accent)] tabular-nums">
                    {money(totalAmount)}
                  </td>
                  <td colSpan={3} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
          <div className="flex-1" />
          <span className="text-[11px] font-semibold text-[var(--text2)]">
            Total {isAsset ? 'Units' : 'Items'}: {filled.length}
          </span>
        </div>
      </CardBody>
    </Card>

      <RequisitionItemPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickerSelect}
        rows={pickerRows}
        loading={stockLoading}
        selectedItemId={pickItemId}
        selectedLocationId={pickLocationId}
        title="Select Item"
        subtitle="Choose an item, then pick the store location to receive into. Stock shown is on hand at that location."
      />
    </>
  )
}
