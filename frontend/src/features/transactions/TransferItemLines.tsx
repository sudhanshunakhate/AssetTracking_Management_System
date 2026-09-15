import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import { fetchAvailableSerialsAtLocation, type AvailableSerialUnit } from '@/api/transactions'
import { TransferItemPickerModal, type TransferPickerBatch } from './TransferItemPickerModal'
import { locLabel } from './txnLookups'
import {
  applyItemMaster,
  baseLine,
  formatStockQty,
  gridCell,
  gridHeadCell,
  gridHeadLabel,
  gridInput,
  gridInputRight,
  toNum,
  useCodeIndex,
  useStockLookup,
  wholeQtyStr,
  type BaseLine,
} from './lineGrid'

export type ItemKind = 'asset' | 'consumable'

export type TransferLine = BaseLine & {
  transferQty: string
  serialNo: string
  itemType: string
}

export function emptyTransferLine(): TransferLine {
  return { ...baseLine(), transferQty: '', serialNo: '', itemType: '' }
}

function kindOf(item: ApiMasterRow | undefined, fallback = ''): ItemKind | '' {
  const t = String(item?.itemType ?? fallback ?? '').toLowerCase()
  if (t === 'consumable') return 'consumable'
  if (t === 'asset' || t) return 'asset'
  return ''
}

/**
 * Items to Transfer — open the multi-step popup (From → Type → Item → To).
 * Document From/To locations are set from the popup result.
 */
export function TransferItemLines({
  lines,
  onChange,
  items,
  units,
  locations = [],
  fromStoreId,
  toStoreId,
  onFromStoreChange,
  onToStoreChange,
  fromLocationRows,
  toLocationRows,
  fromStoreError,
  toStoreError,
  detailsReady = true,
  readOnly = false,
  error,
}: {
  lines: TransferLine[]
  onChange: Dispatch<SetStateAction<TransferLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations?: ApiMasterRow[]
  fromStoreId: string
  toStoreId: string
  onFromStoreChange: (id: string) => void
  onToStoreChange: (id: string) => void
  fromLocationRows: ApiMasterRow[]
  toLocationRows: ApiMasterRow[]
  fromStoreError?: string
  toStoreError?: string
  detailsReady?: boolean
  readOnly?: boolean
  error?: string
}) {
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTargetKey, setPickerTargetKey] = useState<string | null>(null)
  const [serialOptions, setSerialOptions] = useState<Record<string, AvailableSerialUnit[]>>({})

  const patch = useCallback(
    (key: string, changes: Partial<TransferLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStock = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: wholeQtyStr(qty) }),
    [patch],
  )
  const { loading: stockLoading, lookup } = useStockLookup(onStock, { freeOnly: true })

  const itemIdsKey = useMemo(
    () => lines.map((l) => `${l.key}:${l.itemId}:${fromStoreId}`).join('|'),
    [lines, fromStoreId],
  )

  useEffect(() => {
    if (readOnly || !fromStoreId) return
    for (const line of lines) {
      if (!line.itemId) continue
      void lookup(line.key, Number(line.itemId), fromStoreId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromStoreId, itemIdsKey, readOnly, lookup])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!fromStoreId || !/^\d+$/.test(fromStoreId)) {
        if (!cancelled) setSerialOptions({})
        return
      }
      try {
        const units = await fetchAvailableSerialsAtLocation(Number(fromStoreId))
        if (cancelled) return
        const next: Record<string, AvailableSerialUnit[]> = {}
        for (const line of lines) {
          if (!line.itemId) continue
          if (kindOf(undefined, line.itemType) === 'consumable') continue
          next[line.key] = units.filter((u) => String(u.itemId) === String(line.itemId))
        }
        setSerialOptions(next)
      } catch {
        if (!cancelled) setSerialOptions({})
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdsKey, fromStoreId])

  const openPicker = (lineKey?: string) => {
    if (!detailsReady || readOnly) return
    setPickerTargetKey(lineKey ?? null)
    setPickerOpen(true)
  }

  const applyPickerResult = (batch: TransferPickerBatch) => {
    onFromStoreChange(batch.fromLocationId)
    onToStoreChange(batch.toLocationId)

    const newLines: TransferLine[] = []
    for (const entry of batch.lines) {
      const item = items.find((i) => i.id === entry.itemId)
      if (!item) continue
      const isAsset = entry.itemKind === 'asset'
      const qtyNum = Number(entry.qty) || (isAsset ? 1 : 0)
      if (qtyNum <= 0) continue
      if (qtyNum > entry.stock) continue
      newLines.push({
        ...emptyTransferLine(),
        ...applyItemMaster(item, entry.locationId),
        itemType: entry.itemKind,
        availableStock: wholeQtyStr(entry.stock),
        serialNo: entry.serial?.serialNo ?? '',
        transferQty: isAsset ? '1' : wholeQtyStr(qtyNum),
      })
    }

    if (newLines.length === 0) {
      setPickerOpen(false)
      setPickerTargetKey(null)
      return
    }

    onChange((prev) => {
      const blankKeys = prev.filter((l) => !l.itemId).map((l) => l.key)
      const keep = prev.filter((l) => l.itemId)
      const orderedBlanks = pickerTargetKey
        ? [pickerTargetKey, ...blankKeys.filter((k) => k !== pickerTargetKey)]
        : blankKeys
      const filled: TransferLine[] = []
      let i = 0
      for (const key of orderedBlanks) {
        if (i >= newLines.length) break
        const existing = prev.find((l) => l.key === key)
        if (!existing || existing.itemId) continue
        filled.push({ ...newLines[i], key })
        i += 1
      }
      const rest = newLines.slice(i)
      const next = [...keep, ...filled, ...rest]
      return next.length ? next : [emptyTransferLine()]
    })

    setPickerOpen(false)
    setPickerTargetKey(null)
  }

  const clearItem = (line: TransferLine) => {
    patch(line.key, {
      itemId: '',
      itemCode: '',
      itemName: '',
      uomId: '',
      locationId: '',
      availableStock: '',
      itemType: '',
      serialNo: '',
      transferQty: '',
    })
  }

  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyTransferLine()]
    })

  const addLine = () => {
    onChange((prev) => [...prev, emptyTransferLine()])
    openPicker()
  }

  const fromLabel = fromStoreId
    ? (() => {
        const loc = locationById.get(fromStoreId)
        return loc ? locLabel(loc) : fromStoreId
      })()
    : ''
  const toLabel = toStoreId
    ? (() => {
        const loc = locationById.get(toStoreId)
        return loc ? locLabel(loc) : toStoreId
      })()
    : ''

  const subtitle = !detailsReady
    ? 'Complete Transfer Type, Date and Operating Unit first.'
    : 'Click Select From Location: From → type → set qty (≤ stock) / serials → To Location.'

  return (
    <>
      <Card>
        <CardHeader title="Items to Transfer" subtitle={subtitle} />
        <CardBody className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-3">
            <Button
              type="button"
              disabled={readOnly || !detailsReady}
              onClick={() => openPicker(lines.find((l) => !l.itemId)?.key)}
            >
              {fromStoreId ? 'Add Item…' : 'Select From Location…'}
            </Button>
            <div className="min-w-0 flex-1 text-[12px] text-[var(--text2)]">
              {fromStoreId ? (
                <>
                  <span className="mr-3">
                    <b className="text-[var(--text)]">From:</b> {fromLabel}
                  </span>
                  {toStoreId && (
                    <span>
                      <b className="text-[var(--text)]">To:</b> {toLabel}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[var(--text3)]">
                  Opens a searchable popup with all locations for this OU, then item type, stocked
                  items, and To Location.
                </span>
              )}
            </div>
            {(fromStoreError || toStoreError) && (
              <span className="text-[11px] font-medium text-[var(--danger)]">
                {fromStoreError || toStoreError}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  <th className={`${gridHeadCell} w-[40px]`}>#</th>
                  <th className={`${gridHeadCell} w-[100px]`}>Type</th>
                  <th className={`${gridHeadCell} min-w-[200px]`}>{gridHeadLabel('Item', true)}</th>
                  <th className={gridHeadCell}>Item Name</th>
                  <th className={`${gridHeadCell} w-[80px]`}>UOM</th>
                  <th className={`${gridHeadCell} w-[140px]`}>Serial No.</th>
                  <th className={`${gridHeadCell} w-[90px]`}>{gridHeadLabel('Qty', true)}</th>
                  <th className={`${gridHeadCell} w-[100px]`}>Available</th>
                  <th className={`${gridHeadCell} w-[130px]`}>From</th>
                  <th className={`${gridHeadCell} w-[130px]`}>To</th>
                  <th className={gridHeadCell}>Remarks</th>
                  <th className={`${gridHeadCell} w-[56px] text-center`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const unit = unitById.get(line.uomId)
                  const lineKind =
                    kindOf(items.find((i) => i.id === line.itemId), line.itemType) || 'asset'
                  const isAsset = lineKind === 'asset'
                  const shownStock = stockLoading[line.key]
                    ? '…'
                    : line.availableStock !== ''
                      ? formatStockQty(Number(line.availableStock))
                      : ''
                  const shortfall =
                    line.itemId !== '' &&
                    shownStock !== '' &&
                    shownStock !== '…' &&
                    toNum(line.transferQty) > toNum(shownStock)
                  const itemDisplay =
                    line.itemCode && line.itemName
                      ? `${line.itemCode} – ${line.itemName}`
                      : line.itemCode || ''
                  const opts = serialOptions[line.key] ?? []

                  return (
                    <tr key={line.key} className="border-b border-[var(--border)] align-middle">
                      <td className={`${gridCell} text-center text-[var(--text3)]`}>{idx + 1}</td>
                      <td className={gridCell}>
                        <Input
                          value={line.itemId ? (isAsset ? 'Asset' : 'Consumable') : '—'}
                          readOnly
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        {readOnly ? (
                          <Input value={line.itemCode} readOnly className={gridInput} />
                        ) : (
                          <div className="flex min-w-[180px] items-center gap-1">
                            <Input
                              value={itemDisplay}
                              readOnly
                              placeholder="— Use Add Item —"
                              title={itemDisplay}
                              className={`${gridInput} min-w-0 flex-1 cursor-pointer`}
                              onClick={() => openPicker(line.key)}
                            />
                            {line.itemId && (
                              <button
                                type="button"
                                aria-label="Clear item"
                                onClick={() => clearItem(line)}
                                className="shrink-0 rounded px-1 text-[14px] text-[var(--text3)] hover:text-[var(--danger)]"
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
                        {isAsset && line.itemId ? (
                          <Select
                            className={gridInput}
                            value={line.serialNo}
                            disabled={readOnly}
                            title={line.serialNo || undefined}
                            onChange={(e) =>
                              patch(line.key, {
                                serialNo: e.target.value,
                                transferQty: e.target.value ? '1' : line.transferQty,
                              })
                            }
                          >
                            <option value="">— Select serial —</option>
                            {line.serialNo &&
                              !opts.some(
                                (u) =>
                                  String(u.serialNo ?? '').toUpperCase() ===
                                  line.serialNo.toUpperCase(),
                              ) && (
                                <option value={line.serialNo}>{line.serialNo} (current)</option>
                              )}
                            {opts.map((u) => (
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
                        <Input
                          type="number"
                          min={0}
                          max={line.availableStock !== '' ? Number(line.availableStock) : undefined}
                          step="1"
                          className={gridInputRight}
                          value={line.transferQty}
                          placeholder="0"
                          disabled={readOnly || isAsset}
                          invalid={shortfall}
                          onChange={(e) => {
                            const raw = e.target.value
                            const avail = Number(line.availableStock)
                            if (raw !== '' && Number.isFinite(avail) && avail >= 0) {
                              const n = Number(raw)
                              if (Number.isFinite(n) && n > avail) {
                                patch(line.key, { transferQty: wholeQtyStr(avail) })
                                return
                              }
                            }
                            patch(line.key, { transferQty: raw })
                          }}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={shownStock}
                          readOnly
                          placeholder="—"
                          className={gridInputRight}
                          style={shortfall ? { color: 'var(--danger)' } : undefined}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input value={fromLabel} readOnly placeholder="—" className={gridInput} title={fromLabel} />
                      </td>
                      <td className={gridCell}>
                        <Input value={toLabel} readOnly placeholder="—" className={gridInput} title={toLabel} />
                      </td>
                      <td className={gridCell}>
                        <Input
                          className={gridInput}
                          value={line.remark}
                          placeholder="Remarks…"
                          disabled={readOnly}
                          maxLength={200}
                          onChange={(e) => patch(line.key, { remark: e.target.value })}
                        />
                      </td>
                      <td className={`${gridCell} text-center`}>
                        {!readOnly && (
                          <button
                            type="button"
                            aria-label="Remove line"
                            onClick={() => removeLine(line.key)}
                            className="rounded px-1.5 text-[14px] leading-none text-[var(--text3)] hover:text-[var(--danger)]"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
              <Button variant="ghost" disabled={!detailsReady} onClick={addLine}>
                + Add Line
              </Button>
              {error && <span className="text-[11px] font-medium text-[var(--danger)]">{error}</span>}
              <div className="flex-1" />
              <span className="text-[11px] font-semibold text-[var(--text2)]">
                Lines: {lines.filter((l) => l.itemId).length} · Qty:{' '}
                {lines.reduce((s, l) => s + toNum(l.transferQty), 0)}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      <TransferItemPickerModal
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
          setPickerTargetKey(null)
        }}
        onComplete={applyPickerResult}
        fromLocations={fromLocationRows}
        toLocations={toLocationRows}
        items={items}
        units={units}
        locations={locations}
        initialFromId={fromStoreId}
        initialToId={toStoreId}
      />
    </>
  )
}
