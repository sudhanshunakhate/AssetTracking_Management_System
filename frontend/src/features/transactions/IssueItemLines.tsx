import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import { fetchAvailableSerials, type AvailableSerialUnit } from '@/api/transactions'
import { locLabel } from './txnLookups'
import {
  ItemCodeOptions,
  applyItemMaster,
  baseLine,
  gridCell,
  gridHeadCell,
  gridInput,
  gridInputRight,
  toNum,
  useCodeIndex,
  useItemIndex,
  useLocationStock,
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

const DATALIST_ID = 'issue-item-options'

/**
 * Editable issue line grid. Picking an item fills name, UOM and available
 * stock for the header store; qty, batch and remark are typed.
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
  error?: string
}) {
  const itemByCode = useItemIndex(items)
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const { stockByItemId } = useLocationStock(storeLocationId)
  const linesLocked = readOnly || lockStockFields || !headerReady
  const lineFieldsLocked = readOnly || lockStockFields
  const assetFieldsLocked = readOnly

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
  const [serialOptions, setSerialOptions] = useState<Record<string, AvailableSerialUnit[]>>({})

  /** Re-fetch available qty whenever store or line items change (e.g. after requisition load). */
  const itemIdsKey = useMemo(() => lines.map((l) => `${l.key}:${l.itemId}`).join('|'), [lines])
  useEffect(() => {
    if (linesLocked || !storeLocationId) return
    for (const line of lines) {
      if (!line.itemId) continue
      void lookup(line.key, Number(line.itemId), storeLocationId)
    }
    // lines intentionally omitted — itemIdsKey covers item identity without looping on stock patches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeLocationId, itemIdsKey, linesLocked, lookup])

  /* Load non-issued serials for asset lines. */
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

  const selectItem = (line: IssueLine, rawCode: string) => {
    if (linesLocked) return
    const code = rawCode.toUpperCase()
    const item = itemByCode.get(code)
    if (!item) {
      patch(line.key, { itemCode: code, itemId: '', itemName: '', uomId: '', availableStock: '' })
      return
    }
    const stockLocation = storeLocationId || String(item.store ?? '')
    const cached = stockByItemId[item.id]
    patch(line.key, {
      ...applyItemMaster(item, stockLocation),
      itemType: String(item.itemType ?? ''),
      availableStock: cached != null ? wholeQtyStr(cached) : '',
    })
    void lookup(line.key, Number(item.id), stockLocation)
  }

  const addLine = () => onChange((prev) => [...prev, emptyLine()])
  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyLine()]
    })

  const displayStock = (line: IssueLine) => {
    if (stockLoading[line.key]) return '…'
    if (line.itemId && stockByItemId[line.itemId] != null) return String(stockByItemId[line.itemId])
    return line.availableStock
  }

  const showAssetFields = lines.some((l) => {
    if (!l.itemId) return false
    if (l.itemType === 'asset') return true
    return items.find((i) => i.id === l.itemId)?.itemType === 'asset'
  })
  const toLoc = locationById.get(toLocationId)

  return (
    <Card>
      <CardHeader
        title="Item Details"
        subtitle={
          !headerReady
            ? 'Complete all required header fields before selecting items.'
            : 'Select Store first — then pick an item assigned to that store; batch is optional (FIFO if blank)'
        }
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} w-[52px]`}>Sr No.</th>
                <th className={`${gridHeadCell} w-[170px]`}>Item Code</th>
                <th className={gridHeadCell}>Item Name</th>
                <th className={`${gridHeadCell} w-[110px]`}>UOM</th>
                {showAssetFields && (
                  <>
                    <th className={`${gridHeadCell} w-[130px]`}>Serial No.</th>
                    <th className={`${gridHeadCell} w-[120px]`}>IP Address</th>
                    <th className={`${gridHeadCell} w-[130px]`}>MAC Address</th>
                    <th className={`${gridHeadCell} w-[140px]`}>Hostname</th>
                  </>
                )}
                <th className={`${gridHeadCell} w-[120px]`}>Requested Qty</th>
                <th className={`${gridHeadCell} w-[120px]`}>Issue Qty</th>
                <th className={`${gridHeadCell} w-[120px]`}>Available Stock</th>
                <th className={`${gridHeadCell} w-[130px]`}>Batch / Lot</th>
                <th className={`${gridHeadCell} w-[150px]`}>From Location</th>
                <th className={`${gridHeadCell} w-[150px]`}>To Location</th>
                <th className={`${gridHeadCell} w-[170px]`}>Remark</th>
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
                return (
                  <tr key={line.key} className="border-b border-[var(--border)] align-middle">
                    <td className={`${gridCell} text-center text-[var(--text3)]`}>{idx + 1}</td>
                    <td className={gridCell}>
                      <Input
                        list={DATALIST_ID}
                        value={line.itemCode}
                        onChange={(e) => selectItem(line, e.target.value)}
                        disabled={linesLocked}
                        placeholder={!headerReady ? 'Fill header first' : 'Select Item'}
                        invalid={line.itemCode !== '' && line.itemId === ''}
                        className={gridInput}
                      />
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
                    {showAssetFields && (
                      <>
                        <td className={gridCell}>
                          {isAsset ? (
                            <Select
                              value={line.serialNo}
                              onChange={(e) => applySerial(line, e.target.value)}
                              disabled={assetFieldsLocked}
                              className={gridInput}
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
                              onChange={(e) => patch(line.key, { macAddress: e.target.value.toUpperCase() })}
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
                      </>
                    )}
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
                        placeholder="0.00"
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
                              ? 'Live stock at selected store'
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

        <ItemCodeOptions id={DATALIST_ID} items={items} stockByItemId={stockByItemId} />

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
  )
}
