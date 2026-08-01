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
  toNum,
  useCodeIndex,
  useItemIndex,
  useStockLookup,
  type BaseLine,
} from './lineGrid'

export type RequisitionLine = BaseLine & {
  requestedQty: string
}

export function emptyLine(): RequisitionLine {
  return { ...baseLine(), requestedQty: '' }
}

const DATALIST_ID = 'requisition-item-options'

/**
 * Editable requisition line grid. Picking an item fills name, UOM, stocking
 * location and the live available quantity; only qty and remark are typed.
 */
export function RequisitionItemLines({
  lines,
  onChange,
  items,
  units,
  locations,
  deliverToLocationId,
  readOnly = false,
  error,
}: {
  lines: RequisitionLine[]
  /** Functional setter so async stock lookups always patch the latest rows. */
  onChange: Dispatch<SetStateAction<RequisitionLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  deliverToLocationId: string
  readOnly?: boolean
  error?: string
}) {
  const itemByCode = useItemIndex(items)
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)

  const patch = useCallback(
    (key: string, changes: Partial<RequisitionLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStock = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: String(qty) }),
    [patch],
  )
  const { loading: stockLoading, lookup } = useStockLookup(onStock)

  const selectItem = (line: RequisitionLine, rawCode: string) => {
    const code = rawCode.toUpperCase()
    const item = itemByCode.get(code)
    if (!item) {
      patch(line.key, { itemCode: code, itemId: '', itemName: '', uomId: '', availableStock: '' })
      return
    }
    const stockLocation = deliverToLocationId || String(item.store ?? '')
    patch(line.key, {
      itemCode: String(item.code ?? ''),
      itemId: item.id,
      itemName: String(item.name ?? ''),
      uomId: String(item.uom ?? ''),
      locationId: stockLocation,
      availableStock: '',
    })
    void lookup(line.key, Number(item.id), stockLocation)
  }

  const addLine = () => onChange((prev) => [...prev, emptyLine()])
  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyLine()]
    })

  return (
    <Card>
      <CardHeader
        title="Item Details"
        subtitle="Select item, enter requested quantity — stock and location fill in automatically"
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
                <th className={`${gridHeadCell} w-[120px]`}>Available Stock</th>
                <th className={`${gridHeadCell} w-[150px]`}>Location</th>
                <th className={`${gridHeadCell} w-[170px]`}>Remark</th>
                <th className={`${gridHeadCell} w-[56px] text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const unit = unitById.get(line.uomId)
                const location = locationById.get(line.locationId)
                const shortfall =
                  line.itemId !== '' &&
                  line.availableStock !== '' &&
                  toNum(line.requestedQty) > toNum(line.availableStock)
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
                        value={line.requestedQty}
                        onChange={(e) => patch(line.key, { requestedQty: e.target.value })}
                        disabled={readOnly}
                        placeholder="0.00"
                        invalid={shortfall}
                        className={gridInputRight}
                      />
                    </td>
                    <td className={gridCell}>
                      <Input
                        value={stockLoading[line.key] ? '…' : line.availableStock}
                        readOnly
                        placeholder="Auto"
                        title={shortfall ? 'Requested quantity exceeds available stock' : undefined}
                        className={gridInputRight}
                        style={shortfall ? { color: 'var(--danger)' } : undefined}
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
