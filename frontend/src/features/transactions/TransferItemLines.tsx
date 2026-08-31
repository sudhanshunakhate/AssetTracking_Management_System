import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import { fetchAvailableSerials, type AvailableSerialUnit } from '@/api/transactions'
import {
  SearchableItemSelect,
  applyItemMaster,
  baseLine,
  gridCell,
  gridHeadCell,
  gridHeadLabel,
  gridInput,
  gridInputRight,
  toNum,
  useLocationStock,
  wholeQtyStr,
  type BaseLine,
} from './lineGrid'
import { itemsForLocation, locLabel } from './txnLookups'

export type TransferLine = BaseLine & {
  transferQty: string
  serialNo: string
  itemType: string
}

export function emptyTransferLine(): TransferLine {
  return { ...baseLine(), transferQty: '', serialNo: '', itemType: '' }
}

/** Multi-line Items to Transfer — item dropdown filtered by From Store. */
export function TransferItemLines({
  lines,
  onChange,
  items,
  units,
  locations = [],
  fromStoreId,
  readOnly = false,
  headerReady = true,
  error,
}: {
  lines: TransferLine[]
  onChange: Dispatch<SetStateAction<TransferLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations?: ApiMasterRow[]
  fromStoreId: string
  readOnly?: boolean
  headerReady?: boolean
  error?: string
}) {
  const allowedItems = useMemo(() => itemsForLocation(items, fromStoreId), [items, fromStoreId])
  const itemById = useMemo(() => new Map(allowedItems.map((i) => [i.id, i])), [allowedItems])
  const { stockByItemId } = useLocationStock(fromStoreId)
  const linesLocked = readOnly || !headerReady || !fromStoreId
  const locationByItemId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const i of allowedItems) {
      const loc = locations.find((l) => l.id === String(i.store ?? ''))
      if (loc) map[i.id] = locLabel(loc)
    }
    return map
  }, [allowedItems, locations])

  const showSerial = lines.some((l) => {
    if (!l.itemId) return false
    const kind = l.itemType || itemById.get(l.itemId)?.itemType
    return kind !== 'consumable'
  })

  const [serialOptions, setSerialOptions] = useState<Record<string, AvailableSerialUnit[]>>({})
  const itemIdsKey = useMemo(() => lines.map((l) => `${l.key}:${l.itemId}`).join('|'), [lines])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next: Record<string, AvailableSerialUnit[]> = {}
      for (const line of lines) {
        if (!line.itemId) continue
        const kind = line.itemType || itemById.get(line.itemId)?.itemType
        if (kind === 'consumable') continue
        try {
          const units = await fetchAvailableSerials(
            Number(line.itemId),
            fromStoreId && /^\d+$/.test(fromStoreId) ? Number(fromStoreId) : undefined,
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
  }, [itemIdsKey, fromStoreId])

  const patch = useCallback(
    (key: string, changes: Partial<TransferLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const selectItemById = (line: TransferLine, itemId: string) => {
    if (linesLocked) return
    if (!itemId) {
      patch(line.key, {
        itemId: '',
        itemCode: '',
        itemName: '',
        uomId: '',
        availableStock: '',
        serialNo: '',
        itemType: '',
      })
      return
    }
    const item = itemById.get(itemId)
    if (!item) {
      patch(line.key, {
        itemId: '',
        itemCode: '',
        itemName: '',
        uomId: '',
        availableStock: '',
        serialNo: '',
        itemType: '',
      })
      return
    }
    const avail = stockByItemId[item.id]
    const kind = String(item.itemType ?? '')
    patch(line.key, {
      ...applyItemMaster(item, fromStoreId),
      availableStock: avail != null ? wholeQtyStr(avail) : '',
      itemType: kind,
      serialNo: kind === 'consumable' ? '' : line.serialNo,
      transferQty: kind !== 'consumable' ? '1' : line.transferQty,
    })
  }

  const addLine = () => onChange((prev) => [...prev, emptyTransferLine()])
  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyTransferLine()]
    })

  return (
    <Card>
      <CardHeader
        title="Items to Transfer"
        subtitle={
          !headerReady
            ? 'Complete Transfer Type, Date, From Store and To Store before adding items.'
            : !fromStoreId
              ? 'Select From Store to load items for that location.'
              : 'Only items assigned to the From Store are listed. Qty moves From → To on save.'
        }
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} w-[40px]`}>#</th>
                <th className={`${gridHeadCell} min-w-[260px]`}>{gridHeadLabel('Item / Description', true)}</th>
                {showSerial && (
                  <th className={`${gridHeadCell} w-[150px]`}>{gridHeadLabel('Serial No.', true)}</th>
                )}
                <th className={`${gridHeadCell} w-[100px]`}>{gridHeadLabel('Qty', true)}</th>
                <th className={`${gridHeadCell} w-[100px]`}>Unit</th>
                <th className={gridHeadCell}>Remarks</th>
                <th className={`${gridHeadCell} w-[40px]`} />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const kind = line.itemType || itemById.get(line.itemId)?.itemType
                const isAsset = Boolean(line.itemId) && kind !== 'consumable'
                const opts = serialOptions[line.key] ?? []
                return (
                  <tr key={line.key} className="border-t border-[var(--border)]">
                    <td className={`${gridCell} text-center text-[11px] font-bold text-[var(--text3)]`}>
                      {idx + 1}
                    </td>
                    <td className={gridCell}>
                      <SearchableItemSelect
                        value={line.itemId}
                        onChange={(id) => selectItemById(line, id)}
                        items={allowedItems}
                        stockByItemId={stockByItemId}
                        locationByItemId={locationByItemId}
                        disabled={linesLocked}
                        placeholder={!fromStoreId ? '— Select From Store first —' : '— Select Item —'}
                      />
                      {line.itemId && stockByItemId[line.itemId] != null && (
                        <div className="mt-1 text-[10.5px] text-[var(--text3)]">
                          Available at From Store: {stockByItemId[line.itemId]}
                        </div>
                      )}
                    </td>
                    {showSerial && (
                      <td className={gridCell}>
                        {isAsset ? (
                          <Select
                            className={gridInput}
                            value={line.serialNo}
                            disabled={linesLocked}
                            onChange={(e) => patch(line.key, { serialNo: e.target.value.toUpperCase() })}
                          >
                            <option value="">— Select serial —</option>
                            {line.serialNo &&
                              !opts.some(
                                (u) =>
                                  String(u.serialNo ?? '').toUpperCase() === line.serialNo.toUpperCase(),
                              ) && <option value={line.serialNo}>{line.serialNo} (current)</option>}
                            {opts.map((u) => (
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
                    <td className={gridCell}>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        className={gridInputRight}
                        value={line.transferQty}
                        placeholder="0"
                        disabled={linesLocked || isAsset}
                        onChange={(e) => patch(line.key, { transferQty: e.target.value })}
                      />
                    </td>
                    <td className={gridCell}>
                      <Select
                        className={gridInput}
                        value={line.uomId}
                        disabled={linesLocked}
                        onChange={(e) => patch(line.key, { uomId: e.target.value })}
                      >
                        <option value="">—</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className={gridCell}>
                      <Input
                        className={gridInput}
                        value={line.remark}
                        placeholder="Remarks…"
                        disabled={linesLocked}
                        maxLength={200}
                        onChange={(e) => patch(line.key, { remark: e.target.value })}
                      />
                    </td>
                    <td className={`${gridCell} text-center`}>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          className="px-1.5 py-0.5 text-[11px]"
                          disabled={linesLocked}
                          onClick={() => removeLine(line.key)}
                        >
                          ✕
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2">
            <Button variant="ghost" disabled={linesLocked} onClick={addLine}>
              + Add line
            </Button>
            {error && <span className="text-[11px] font-medium text-[var(--danger)]">{error}</span>}
            <span className="text-[11px] text-[var(--text3)]">
              Lines: {lines.filter((l) => l.itemId).length} · Qty:{' '}
              {lines.reduce((s, l) => s + toNum(l.transferQty), 0)}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
