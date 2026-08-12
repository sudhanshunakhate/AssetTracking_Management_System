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
  type BaseLine,
} from './lineGrid'

export type InspectionLine = BaseLine & {
  approveQty: string
  batchLotNo: string
  homeStore: string
}

export function emptyInspectionLine(): InspectionLine {
  return { ...baseLine(), approveQty: '', batchLotNo: '', homeStore: '' }
}

const DATALIST_ID = 'inspection-item-options'

export function InspectionItemLines({
  lines,
  onChange,
  items,
  units,
  locations,
  quarantineLocationId,
  readOnly = false,
  headerReady = true,
  error,
}: {
  lines: InspectionLine[]
  onChange: Dispatch<SetStateAction<InspectionLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  quarantineLocationId: string
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
    (key: string, qty: number) => patch(key, { availableStock: String(qty) }),
    [patch],
  )
  const { loading: stockLoading, lookup } = useStockLookup(onStock)

  const itemIdsKey = useMemo(() => lines.map((l) => `${l.key}:${l.itemId}`).join('|'), [lines])

  useEffect(() => {
    if (!quarantineLocationId || linesLocked) return
    for (const line of lines) {
      if (!line.itemId) continue
      void lookup(line.key, Number(line.itemId), quarantineLocationId)
    }
  }, [quarantineLocationId, itemIdsKey, linesLocked, lookup, lines])

  const addLine = () => onChange((prev) => [...prev, emptyInspectionLine()])
  const removeLine = (key: string) => onChange((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))

  const onItemCode = (key: string, code: string) => {
    const item = itemByCode.get(code.trim().toUpperCase())
    if (!item) {
      patch(key, { itemCode: code, itemId: '', itemName: '', uomId: '', homeStore: '' })
      return
    }
    const homeId = String(item.store ?? '')
    const home = homeId ? locationById.get(homeId) : undefined
    patch(key, {
      ...applyItemMaster(item),
      itemCode: code,
      homeStore: home ? `${home.code} · ${home.name}` : homeId || '—',
    })
    if (quarantineLocationId && item.id) void lookup(key, Number(item.id), quarantineLocationId)
  }

  const uomLabel = (uomId: string) => {
    const u = unitById.get(uomId)
    return u?.code ?? u?.name ?? '—'
  }

  return (
    <Card className="mt-3">
      <CardHeader title="Items in Quarantine" />
      <CardBody>
        {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wide text-[var(--text3)]">
                <th className={gridHeadCell}>#</th>
                <th className={gridHeadCell}>Item Code</th>
                <th className={gridHeadCell}>Item Name</th>
                <th className={gridHeadCell}>UOM</th>
                <th className={gridHeadCell}>Available</th>
                <th className={gridHeadCell}>Approve Qty</th>
                <th className={gridHeadCell}>Batch / Lot</th>
                <th className={gridHeadCell}>Home Store</th>
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
                      {stockLoading[line.key] && line.itemId ? '…' : line.availableStock || '0'}
                    </span>
                  </td>
                  <td className={gridCell}>
                    <Input
                      className={gridInputRight}
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
                  <td className={gridCell}>{line.homeStore || '—'}</td>
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
