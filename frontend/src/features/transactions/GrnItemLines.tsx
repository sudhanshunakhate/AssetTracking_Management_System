import { useCallback, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import {
  ItemCodeOptions,
  baseLine,
  gridCell,
  gridHeadCell,
  gridInput,
  gridInputRight,
  money,
  toNum,
  useCodeIndex,
  useItemIndex,
  useStockLookup,
  type BaseLine,
} from './lineGrid'

export type GrnLine = BaseLine & {
  receivedQty: string
  acceptedQty: string
  rejectedQty: string
  amount: string
}

export function emptyGrnLine(): GrnLine {
  return { ...baseLine(), receivedQty: '', acceptedQty: '', rejectedQty: '', amount: '' }
}

const DATALIST_ID = 'grn-item-options'

/**
 * Editable GRN line grid. Picking an item fills name, UOM, receiving location
 * and live available stock; accepted/rejected are kept consistent with received
 * and the amount defaults to the item's standard cost.
 */
export function GrnItemLines({
  lines,
  onChange,
  items,
  units,
  locations,
  storeLocationId,
  readOnly = false,
  error,
}: {
  lines: GrnLine[]
  /** Functional setter so async stock lookups always patch the latest rows. */
  onChange: Dispatch<SetStateAction<GrnLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  storeLocationId: string
  readOnly?: boolean
  error?: string
}) {
  const itemByCode = useItemIndex(items)
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)

  const patch = useCallback(
    (key: string, changes: Partial<GrnLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStock = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: String(qty) }),
    [patch],
  )
  const { loading: stockLoading, lookup } = useStockLookup(onStock)

  const selectItem = (line: GrnLine, rawCode: string) => {
    const code = rawCode.toUpperCase()
    const item = itemByCode.get(code)
    if (!item) {
      patch(line.key, { itemCode: code, itemId: '', itemName: '', uomId: '', availableStock: '' })
      return
    }
    const location = storeLocationId || String(item.store ?? '')
    const received = toNum(line.receivedQty)
    patch(line.key, {
      itemCode: String(item.code ?? ''),
      itemId: item.id,
      itemName: String(item.name ?? ''),
      uomId: String(item.uom ?? ''),
      locationId: location,
      availableStock: '',
      amount: received > 0 ? String(received * toNum(item.standardCost as number)) : line.amount,
    })
    void lookup(line.key, Number(item.id), location)
  }

  /* Received drives accepted (default all-good) and the line amount. */
  const setReceived = (line: GrnLine, value: string) => {
    const received = toNum(value)
    const item = items.find((i) => i.id === line.itemId)
    const cost = item ? toNum(item.standardCost as number) : 0
    const accepted = line.acceptedQty === '' ? value : line.acceptedQty
    patch(line.key, {
      receivedQty: value,
      acceptedQty: accepted,
      rejectedQty: String(Math.max(received - toNum(accepted), 0)),
      amount: cost > 0 ? String(received * cost) : line.amount,
    })
  }

  const setAccepted = (line: GrnLine, value: string) => {
    patch(line.key, {
      acceptedQty: value,
      rejectedQty: String(Math.max(toNum(line.receivedQty) - toNum(value), 0)),
    })
  }

  const addLine = () => onChange((prev) => [...prev, emptyGrnLine()])
  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyGrnLine()]
    })

  const totalAmount = lines.reduce((sum, l) => sum + toNum(l.amount), 0)

  return (
    <Card>
      <CardHeader title="Item Details" subtitle="Received, accepted and rejected quantities per line" />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} w-[48px]`}>Sr No.</th>
                <th className={`${gridHeadCell} w-[150px]`}>Item Code</th>
                <th className={gridHeadCell}>Item Name</th>
                <th className={`${gridHeadCell} w-[90px]`}>UOM</th>
                <th className={`${gridHeadCell} w-[110px]`}>Received Qty</th>
                <th className={`${gridHeadCell} w-[110px]`}>Accepted Qty</th>
                <th className={`${gridHeadCell} w-[110px]`}>Rejected Qty</th>
                <th className={`${gridHeadCell} w-[115px]`}>Available Stock</th>
                <th className={`${gridHeadCell} w-[115px]`}>Amount (₹)</th>
                <th className={`${gridHeadCell} w-[130px]`}>Location</th>
                <th className={`${gridHeadCell} w-[150px]`}>Remark</th>
                <th className={`${gridHeadCell} w-[54px] text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const unit = unitById.get(line.uomId)
                const location = locationById.get(line.locationId)
                const received = toNum(line.receivedQty)
                const split = toNum(line.acceptedQty) + toNum(line.rejectedQty)
                const splitMismatch = line.itemId !== '' && received > 0 && Math.abs(split - received) > 0.0001
                return (
                  <tr key={line.key} className="border-b border-[var(--border)] align-middle">
                    <td className={`${gridCell} text-center text-[var(--text3)]`}>{idx + 1}</td>
                    <td className={gridCell}>
                      <Input
                        list={DATALIST_ID}
                        value={line.itemCode}
                        onChange={(e) => selectItem(line, e.target.value)}
                        disabled={readOnly}
                        placeholder="Select Item"
                        invalid={line.itemCode !== '' && line.itemId === ''}
                        className={gridInput}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input value={line.itemName} readOnly placeholder="Auto" className={gridInput} />
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
                        step="0.01"
                        value={line.receivedQty}
                        onChange={(e) => setReceived(line, e.target.value)}
                        disabled={readOnly}
                        placeholder="0.00"
                        className={gridInputRight}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.acceptedQty}
                        onChange={(e) => setAccepted(line, e.target.value)}
                        disabled={readOnly}
                        placeholder="0.00"
                        invalid={splitMismatch}
                        className={gridInputRight}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.rejectedQty}
                        onChange={(e) => patch(line.key, { rejectedQty: e.target.value })}
                        disabled={readOnly}
                        placeholder="0.00"
                        invalid={splitMismatch}
                        title={splitMismatch ? 'Accepted + Rejected must equal Received' : undefined}
                        className={gridInputRight}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        value={stockLoading[line.key] ? '…' : line.availableStock}
                        readOnly
                        placeholder="Auto"
                        className={gridInputRight}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.amount}
                        onChange={(e) => patch(line.key, { amount: e.target.value })}
                        disabled={readOnly}
                        placeholder="0.00"
                        className={gridInputRight}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        value={location ? String(location.code ?? '') : ''}
                        readOnly
                        placeholder="Auto"
                        className={gridInput}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        value={line.remark}
                        onChange={(e) => patch(line.key, { remark: e.target.value })}
                        disabled={readOnly}
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
                        disabled={readOnly}
                        className="rounded px-1.5 text-[14px] leading-none text-[var(--text3)] transition hover:text-[var(--danger)] disabled:opacity-40"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={8} className="px-2 py-1.5 text-right text-[11px] font-semibold text-[var(--accent)]">
                  Total Amount →
                </td>
                <td className="px-2 py-1.5 text-right text-[12px] font-bold text-[var(--accent)] tabular-nums">
                  {money(totalAmount)}
                </td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>

        <ItemCodeOptions id={DATALIST_ID} items={items} />

        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
          <Button variant="ghost" onClick={addLine} disabled={readOnly}>
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
