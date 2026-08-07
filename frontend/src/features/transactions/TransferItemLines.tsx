import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import {
  applyItemMaster,
  baseLine,
  gridCell,
  gridHeadCell,
  gridInput,
  gridInputRight,
  itemOptionLabel,
  toNum,
  useLocationStock,
  type BaseLine,
} from './lineGrid'
import { itemsForLocation } from './txnLookups'

export type TransferLine = BaseLine & {
  transferQty: string
}

export function emptyTransferLine(): TransferLine {
  return { ...baseLine(), transferQty: '' }
}

/** Multi-line Items to Transfer — item dropdown filtered by From Store. */
export function TransferItemLines({
  lines,
  onChange,
  items,
  units,
  fromStoreId,
  readOnly = false,
  headerReady = true,
  error,
}: {
  lines: TransferLine[]
  onChange: Dispatch<SetStateAction<TransferLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  fromStoreId: string
  readOnly?: boolean
  headerReady?: boolean
  error?: string
}) {
  const allowedItems = useMemo(() => itemsForLocation(items, fromStoreId), [items, fromStoreId])
  const itemById = useMemo(() => new Map(allowedItems.map((i) => [i.id, i])), [allowedItems])
  const { stockByItemId } = useLocationStock(fromStoreId)
  const linesLocked = readOnly || !headerReady || !fromStoreId

  const patch = useCallback(
    (key: string, changes: Partial<TransferLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const selectItemById = (line: TransferLine, itemId: string) => {
    if (linesLocked) return
    if (!itemId) {
      patch(line.key, { itemId: '', itemCode: '', itemName: '', uomId: '', availableStock: '' })
      return
    }
    const item = itemById.get(itemId)
    if (!item) {
      patch(line.key, { itemId: '', itemCode: '', itemName: '', uomId: '', availableStock: '' })
      return
    }
    const avail = stockByItemId[item.id]
    patch(line.key, {
      ...applyItemMaster(item, fromStoreId),
      availableStock: avail != null ? String(avail) : '',
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
                <th className={`${gridHeadCell} min-w-[240px]`}>Item / Description</th>
                <th className={`${gridHeadCell} w-[100px]`}>Qty</th>
                <th className={`${gridHeadCell} w-[100px]`}>Unit</th>
                <th className={gridHeadCell}>Remarks</th>
                <th className={`${gridHeadCell} w-[40px]`} />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={line.key} className="border-t border-[var(--border)]">
                  <td className={`${gridCell} text-center text-[11px] font-bold text-[var(--text3)]`}>
                    {idx + 1}
                  </td>
                  <td className={gridCell}>
                    <Select
                      className={gridInput}
                      value={line.itemId}
                      disabled={linesLocked}
                      onChange={(e) => selectItemById(line, e.target.value)}
                    >
                      <option value="">
                        {!fromStoreId ? '— Select From Store first —' : '— Select Item —'}
                      </option>
                      {allowedItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {itemOptionLabel(i, stockByItemId)}
                        </option>
                      ))}
                      {/* Keep current selection visible if it fell out of the filtered list (view-only). */}
                      {line.itemId && !itemById.has(line.itemId) && (
                        <option value={line.itemId}>
                          {line.itemCode
                            ? `${line.itemCode}${line.itemName ? ` – ${line.itemName}` : ''}`
                            : `Item #${line.itemId}`}
                        </option>
                      )}
                    </Select>
                    {line.itemId && stockByItemId[line.itemId] != null && (
                      <div className="mt-1 text-[10.5px] text-[var(--text3)]">
                        Available at From Store: {stockByItemId[line.itemId]}
                      </div>
                    )}
                  </td>
                  <td className={gridCell}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className={gridInputRight}
                      value={line.transferQty}
                      placeholder="0"
                      disabled={linesLocked}
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
              ))}
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
  )
}

export function transferLinesValid(lines: TransferLine[]) {
  const filled = lines.filter((l) => l.itemId)
  if (filled.length === 0) return 'Add at least one item line.'
  if (filled.some((l) => !(toNum(l.transferQty) > 0))) return 'Every item line needs qty greater than 0.'
  if (filled.some((l) => !l.uomId)) return 'Unit is required on every item line.'
  return ''
}
