import { useMemo, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
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
  wholeQtyStr,
  type BaseLine,
} from './lineGrid'
import type { OutwardPickerBatch } from './GatepassNormalOutwardPickerModal'

export type GatepassOutwardLine = BaseLine & {
  qty: string
  serialNo: string
  batchLotNo: string
  itemType: string
}

export function emptyGatepassOutwardLine(): GatepassOutwardLine {
  return {
    ...baseLine(),
    qty: '',
    serialNo: '',
    batchLotNo: '',
    itemType: '',
  }
}

export function linesFromOutwardPicker(
  batch: OutwardPickerBatch,
  items: ApiMasterRow[],
): GatepassOutwardLine[] {
  return batch.lines.map((l) => {
    const item = items.find((i) => i.id === l.itemId)
    const applied = item
      ? applyItemMaster(item, batch.locationId)
      : {
          itemId: l.itemId,
          itemCode: '',
          itemName: '',
          uomId: '',
          locationId: batch.locationId,
        }
    const serial = String(l.serial?.serialNo ?? '').trim().toUpperCase()
    return {
      ...emptyGatepassOutwardLine(),
      ...applied,
      qty: l.qty || '1',
      availableStock: wholeQtyStr(l.stock),
      serialNo: serial,
      batchLotNo: serial,
      itemType: l.itemKind,
      locationId: batch.locationId,
    }
  })
}

/**
 * Display grid for normal outward lines after system-location picker selection.
 * System location sits with the item grid (not in the header card).
 */
export function GatepassOutwardItemLines({
  lines,
  onChange,
  items,
  units,
  locations = [],
  storeLocationId,
  onOpenPicker,
  readOnly = false,
  error,
}: {
  lines: GatepassOutwardLine[]
  onChange: Dispatch<SetStateAction<GatepassOutwardLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations?: ApiMasterRow[]
  storeLocationId: string
  onOpenPicker: () => void
  readOnly?: boolean
  error?: string
}) {
  const unitById = useCodeIndex(units)
  const filled = lines.filter((l) => l.itemId)
  const storeLabel = useMemo(() => {
    if (!storeLocationId) return ''
    const loc = locations.find((l) => l.id === storeLocationId)
    return loc ? locLabel(loc) : storeLocationId
  }, [locations, storeLocationId])

  const patch = (key: string, changes: Partial<GatepassOutwardLine>) => {
    onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
  }

  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyGatepassOutwardLine()]
    })

  return (
    <Card>
      <CardHeader
        title="Item Details"
        subtitle={
          storeLocationId
            ? `${filled.length} line(s) selected — review qty / serial, then submit.`
            : 'Pick a system location and free items. Only system-derived locations are allowed.'
        }
      />
      <CardBody className="p-0">
        {error && (
          <div className="border-b border-[var(--border)] px-3.5 py-2 text-[12px] text-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-3">
          {!readOnly && (
            <Button type="button" onClick={onOpenPicker}>
              {storeLocationId ? 'Change Selection…' : 'Select From System Location…'}
            </Button>
          )}
          <div className="min-w-0 flex-1 text-[12.5px] text-[var(--text2)]">
            {storeLocationId ? (
              <>
                <b className="text-[var(--text)]">System location:</b> {storeLabel}
              </>
            ) : (
              <span className="text-[var(--text3)]">
                Opens a table of system locations with free stock, then item type and quantities.
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} w-[40px]`}>#</th>
                <th className={gridHeadCell}>{gridHeadLabel('Item', true)}</th>
                <th className={`${gridHeadCell} w-[90px]`}>Available</th>
                <th className={`${gridHeadCell} w-[80px]`}>{gridHeadLabel('Qty', true)}</th>
                <th className={`${gridHeadCell} w-[70px]`}>Unit</th>
                <th className={`${gridHeadCell} w-[160px]`}>Serial / Batch</th>
                <th className={gridHeadCell}>Remark</th>
                {!readOnly && <th className={`${gridHeadCell} w-[56px] text-center`}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filled.length === 0 ? (
                <tr>
                  <td
                    colSpan={readOnly ? 7 : 8}
                    className="px-3 py-10 text-center text-[12.5px] text-[var(--text3)]"
                  >
                    No items yet. Use <b className="text-[var(--text2)]">Select From System Location…</b>{' '}
                    to add lines.
                  </td>
                </tr>
              ) : (
                filled.map((line, idx) => {
                  const unit = unitById.get(line.uomId)
                  return (
                    <tr key={line.key} className="border-b border-[var(--border)]">
                      <td className={`${gridCell} tabular-nums text-[var(--text3)]`}>{idx + 1}</td>
                      <td className={gridCell}>
                        <Input
                          value={
                            [line.itemCode, line.itemName].filter(Boolean).join(' – ') || line.itemId
                          }
                          readOnly
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={formatStockQty(toNum(line.availableStock))}
                          readOnly
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input value={line.qty} readOnly className={gridInputRight} />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={unit ? String(unit.code ?? '') : '—'}
                          readOnly
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.serialNo || line.batchLotNo || '—'}
                          readOnly
                          className={`${gridInput} font-mono`}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.remark}
                          onChange={(e) => patch(line.key, { remark: e.target.value })}
                          disabled={readOnly}
                          placeholder="—"
                          className={gridInput}
                        />
                      </td>
                      {!readOnly && (
                        <td className={`${gridCell} text-center`}>
                          <button
                            type="button"
                            aria-label="Remove line"
                            onClick={() => removeLine(line.key)}
                            className="rounded px-1 text-[14px] text-[var(--text3)] hover:text-[var(--danger)]"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
