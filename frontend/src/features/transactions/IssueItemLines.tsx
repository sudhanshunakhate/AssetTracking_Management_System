import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
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
  type BaseLine,
} from './lineGrid'

export type IssueLine = BaseLine & {
  requestedQty: string
  issueQty: string
  batchLotNo: string
}

export function emptyLine(): IssueLine {
  return { ...baseLine(), requestedQty: '', issueQty: '', batchLotNo: '' }
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
  readOnly = false,
  headerReady = true,
  error,
}: {
  lines: IssueLine[]
  onChange: Dispatch<SetStateAction<IssueLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  storeLocationId: string
  readOnly?: boolean
  /** When false, item grid stays locked until required header fields are filled. */
  headerReady?: boolean
  error?: string
}) {
  const itemByCode = useItemIndex(items)
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const { stockByItemId } = useLocationStock(storeLocationId)
  const linesLocked = readOnly || !headerReady

  const patch = useCallback(
    (key: string, changes: Partial<IssueLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStock = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: String(qty) }),
    [patch],
  )
  const { loading: stockLoading, lookup } = useStockLookup(onStock)

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
      availableStock: cached != null ? String(cached) : '',
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
                <th className={`${gridHeadCell} w-[120px]`}>Requested Qty</th>
                <th className={`${gridHeadCell} w-[120px]`}>Issue Qty</th>
                <th className={`${gridHeadCell} w-[120px]`}>Available Stock</th>
                <th className={`${gridHeadCell} w-[130px]`}>Batch / Lot</th>
                <th className={`${gridHeadCell} w-[150px]`}>Location</th>
                <th className={`${gridHeadCell} w-[170px]`}>Remark</th>
                <th className={`${gridHeadCell} w-[56px] text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const unit = unitById.get(line.uomId)
                const location = locationById.get(line.locationId || storeLocationId)
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
                        step="0.01"
                        value={line.issueQty}
                        onChange={(e) => patch(line.key, { issueQty: e.target.value })}
                        disabled={linesLocked}
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
                        disabled={linesLocked}
                        placeholder="Optional"
                        className={gridInput}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        value={location ? String(location.code ?? '') : ''}
                        readOnly
                        placeholder="—"
                        className={gridInput}
                      />
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
