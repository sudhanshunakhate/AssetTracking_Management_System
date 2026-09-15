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
  useCodeIndex,
  useItemIndex,
  useStockLookup,
  wholeQtyStr,
  formatStockQty,
  type BaseLine,
} from './lineGrid'
import { locLabel } from './txnLookups'

export type InspectionLine = BaseLine & {
  approveQty: string
  batchLotNo: string
  serialNo: string
}

export function emptyInspectionLine(): InspectionLine {
  return { ...baseLine(), approveQty: '', batchLotNo: '', serialNo: '' }
}

const DATALIST_ID = 'inspection-item-options'

export function InspectionItemLines({
  lines,
  onChange,
  items,
  units,
  locations,
  sourceQuarantineId,
  quarantineLabel,
  readOnly = false,
  headerReady = true,
  error,
}: {
  lines: InspectionLine[]
  onChange: Dispatch<SetStateAction<InspectionLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  /** Header quarantine from GRN-linked approval; fallback when OU quarantine is resolved per line. */
  sourceQuarantineId: string
  quarantineLabel?: string
  readOnly?: boolean
  headerReady?: boolean
  error?: string
}) {
  const itemByCode = useItemIndex(items)
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const linesLocked = readOnly || !headerReady

  const patch = useCallback(
    (key: string, changes: Partial<InspectionLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const onStock = useCallback(
    (key: string, qty: number) => patch(key, { availableStock: wholeQtyStr(qty) }),
    [patch],
  )
  const { loading: stockLoading, lookup } = useStockLookup(onStock)

  const stockKey = useMemo(
    () =>
      lines
        .map(
          (l) =>
            `${l.key}:${l.itemId}:${l.batchLotNo}:${l.locationId}:${sourceQuarantineId}`,
        )
        .join('|'),
    [lines, sourceQuarantineId],
  )

  useEffect(() => {
    if (linesLocked) return
    for (const line of lines) {
      if (!line.itemId) continue
      if (!sourceQuarantineId) continue
      void lookup(line.key, Number(line.itemId), sourceQuarantineId, line.batchLotNo)
    }
    // lines intentionally omitted — stockKey covers item/batch/location without looping on stock patches
  }, [stockKey, linesLocked, lookup, sourceQuarantineId])

  const addLine = () => onChange((prev) => [...prev, emptyInspectionLine()])
  const removeLine = (key: string) =>
    onChange((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))

  const onItemCode = (key: string, code: string) => {
    const item = itemByCode.get(code.trim().toUpperCase())
    if (!item) {
      patch(key, { itemCode: code, itemId: '', itemName: '', uomId: '', locationId: '' })
      return
    }
    const homeId = String(item.store ?? '')
    patch(key, {
      ...applyItemMaster(item, homeId),
      itemCode: code,
    })
    const quar = sourceQuarantineId
    if (quar && item.id) void lookup(key, Number(item.id), quar)
  }

  const uomLabel = (uomId: string) => {
    const u = unitById.get(uomId)
    return u?.code ?? u?.name ?? '—'
  }

  const storeLabel = (locationId: string) => {
    const loc = locationById.get(locationId)
    return loc ? locLabel(loc) : locationId || '—'
  }

  const showSerial = lines.some((l) => l.serialNo.trim() !== '')

  return (
    <Card className="mt-3">
      <CardHeader
        title="Items in Quarantine"
        subtitle={
          quarantineLabel
            ? `Stock is read from quarantine: ${quarantineLabel}`
            : sourceQuarantineId
              ? 'Loading quarantine store…'
              : 'Quarantine store not resolved — sync from GRN or reopen the approval.'
        }
      />
      <CardBody>
        {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wide text-[var(--text3)]">
                <th className={gridHeadCell}>#</th>
                <th className={gridHeadCell}>Item Code</th>
                <th className={gridHeadCell}>Item Name</th>
                <th className={gridHeadCell}>UOM</th>
                <th className={gridHeadCell}>Available</th>
                <th className={gridHeadCell}>Approve Qty</th>
                <th className={gridHeadCell}>Batch / Lot</th>
                {showSerial && <th className={gridHeadCell}>Serial No.</th>}
                <th className={gridHeadCell}>Move to Store</th>
                <th className={gridHeadCell} />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={line.key} className="border-b border-[var(--border)]/60">
                  <td className={gridCell}>{idx + 1}</td>
                  <td className={gridCell}>
                    <Input
                      className={gridInput}
                      list={DATALIST_ID}
                      value={line.itemCode}
                      disabled={linesLocked}
                      onChange={(e) => onItemCode(line.key, e.target.value)}
                    />
                  </td>
                  <td className={gridCell}>{line.itemName || '—'}</td>
                  <td className={gridCell}>{uomLabel(line.uomId)}</td>
                  <td className={gridCell}>
                    <span className="tabular-nums">
                      {stockLoading[line.key] && line.itemId
                        ? '…'
                        : formatStockQty(Number(line.availableStock || 0))}
                    </span>
                  </td>
                  <td className={gridCell}>
                    <Input
                      className={gridInputRight}
                      type="number"
                      step="1"
                      value={line.approveQty}
                      disabled={linesLocked}
                      onChange={(e) => patch(line.key, { approveQty: e.target.value })}
                    />
                  </td>
                  <td className={gridCell}>
                    <Input
                      className={gridInput}
                      value={line.batchLotNo}
                      disabled={linesLocked}
                      onChange={(e) => patch(line.key, { batchLotNo: e.target.value })}
                    />
                  </td>
                  {showSerial && (
                    <td className={gridCell}>
                      <Input className={gridInput} value={line.serialNo} readOnly disabled />
                    </td>
                  )}
                  <td className={gridCell}>{storeLabel(line.locationId)}</td>
                  <td className={gridCell}>
                    {!linesLocked && (
                      <Button variant="ghost" className="text-xs" onClick={() => removeLine(line.key)}>
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!linesLocked && (
          <div className="mt-2">
            <Button variant="ghost" className="text-xs" onClick={addLine}>+ Add line</Button>
          </div>
        )}
        <ItemCodeOptions id={DATALIST_ID} items={items} />
      </CardBody>
    </Card>
  )
}
