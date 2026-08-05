import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import {
  ItemCodeOptions,
  applyItemMaster,
  baseLine,
  gridCell,
  gridHeadCell,
  gridInput,
  gridInputRight,
  itemOptionLabel,
  money,
  toNum,
  useCodeIndex,
  useLocationStock,
  useStockLookup,
  type BaseLine,
} from './lineGrid'
import type { ItemKind } from './OpeningStockItemLines'

export type GrnLine = BaseLine & {
  receivedQty: string
  acceptedQty: string
  rejectedQty: string
  amount: string
  serialNo: string
  ipAddress: string
  macAddress: string
  hostname: string
  itemCondition: string
  batch: string
}

export function emptyGrnLine(): GrnLine {
  return {
    ...baseLine(),
    receivedQty: '',
    acceptedQty: '',
    rejectedQty: '',
    amount: '',
    serialNo: '',
    ipAddress: '',
    macAddress: '',
    hostname: '',
    itemCondition: '',
    batch: '',
  }
}

const DATALIST_ID = 'grn-item-options'

/**
 * GRN Item Details — Item Type drives extra columns:
 * Asset → serial / network fields (qty columns stay visible, locked to 1).
 * Consumable → batch + editable received / accepted / rejected.
 * Shared on every line: Received, Accepted, Rejected, Available Stock, Amount, Location, Remark.
 */
export function GrnItemLines({
  lines,
  onChange,
  itemType,
  onItemTypeChange,
  items,
  units,
  locations,
  vendors: _vendors,
  conditionOptions = [],
  storeLocationId,
  readOnly = false,
  headerReady = true,
  error,
}: {
  lines: GrnLine[]
  onChange: Dispatch<SetStateAction<GrnLine[]>>
  itemType: ItemKind
  onItemTypeChange: (next: ItemKind) => void
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  vendors?: ApiMasterRow[]
  conditionOptions?: { value: string; label: string; code?: string }[]
  storeLocationId: string
  readOnly?: boolean
  headerReady?: boolean
  error?: string
}) {
  void _vendors
  const isAsset = itemType === 'asset'
  const linesLocked = readOnly || !headerReady
  const filteredItems = useMemo(
    () => items.filter((i) => (i.itemType === 'consumable' ? 'consumable' : 'asset') === itemType),
    [items, itemType],
  )
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const { stockByItemId } = useLocationStock(storeLocationId)

  const [pickItemId, setPickItemId] = useState('')
  const [pickQty, setPickQty] = useState('1')
  const [addError, setAddError] = useState('')

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

  const buildLine = (item: ApiMasterRow, qty: number): GrnLine => {
    const location = storeLocationId || String(item.store ?? '')
    const cost = toNum(item.standardCost as number)
    return {
      ...emptyGrnLine(),
      ...applyItemMaster(item, location),
      receivedQty: String(qty),
      acceptedQty: String(qty),
      rejectedQty: '0',
      amount: cost > 0 ? String(qty * cost) : '',
    }
  }

  const addUnits = () => {
    if (linesLocked) return
    setAddError('')
    const item = filteredItems.find((i) => i.id === pickItemId)
    if (!item) {
      setAddError('Select an item first')
      return
    }
    const n = Math.floor(toNum(pickQty))
    if (n <= 0) {
      setAddError('Quantity must be greater than 0')
      return
    }
    if (isAsset && n > 200) {
      setAddError('Max 200 asset units at a time')
      return
    }

    const location = storeLocationId || String(item.store ?? '')
    if (isAsset) {
      const created = Array.from({ length: n }, () => buildLine(item, 1))
      onChange((prev) => {
        const keep = prev.filter((l) => l.itemId !== '')
        return [...keep, ...created]
      })
      created.forEach((l) => void lookup(l.key, Number(item.id), location))
    } else {
      const line = buildLine(item, n)
      onChange((prev) => {
        const keep = prev.filter((l) => l.itemId !== '')
        return [...keep, line]
      })
      void lookup(line.key, Number(item.id), location)
    }
    setPickQty('1')
    setPickItemId('')
  }

  const changeType = (next: ItemKind) => {
    onItemTypeChange(next)
    onChange([emptyGrnLine()])
    setPickItemId('')
    setPickQty('1')
    setAddError('')
  }

  const setReceived = (line: GrnLine, value: string) => {
    if (isAsset) return
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
    if (isAsset) return
    patch(line.key, {
      acceptedQty: value,
      rejectedQty: String(Math.max(toNum(line.receivedQty) - toNum(value), 0)),
    })
  }

  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyGrnLine()]
    })

  const filled = lines.filter((l) => l.itemId !== '')
  const totalAmount = filled.reduce((sum, l) => sum + toNum(l.amount), 0)
  const typeColSpan = isAsset ? 5 : 1
  const emptyColSpan = 4 + typeColSpan + 7

  return (
    <Card>
      <CardHeader
        title="Item Details"
        subtitle={
          !headerReady
            ? 'Complete all required header fields before selecting items.'
            : isAsset
              ? 'Asset qty expands into unit lines — fill serial / network details; qty columns stay on each unit'
              : 'Received, accepted and rejected quantities per line'
        }
      />
      <CardBody className="p-0">
        {!readOnly && (
          <div className="flex flex-wrap items-end gap-2 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
            <label className="flex min-w-[140px] flex-col gap-0.5 text-[11px] font-semibold text-[var(--text2)]">
              Item Type
              <Select
                value={itemType}
                onChange={(e) => changeType(e.target.value as ItemKind)}
                disabled={linesLocked}
                className={gridInput}
              >
                <option value="asset">Asset</option>
                <option value="consumable">Consumable</option>
              </Select>
            </label>
            <label className="flex min-w-[220px] flex-1 flex-col gap-0.5 text-[11px] font-semibold text-[var(--text2)]">
              Item
              <Select
                value={pickItemId}
                onChange={(e) => setPickItemId(e.target.value)}
                disabled={linesLocked}
                className={gridInput}
              >
                <option value="">
                  {!headerReady
                    ? '— Fill header first —'
                    : `— Select ${isAsset ? 'Asset' : 'Consumable'} —`}
                </option>
                {filteredItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {itemOptionLabel(i, stockByItemId)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex w-[100px] flex-col gap-0.5 text-[11px] font-semibold text-[var(--text2)]">
              Qty
              <Input
                type="number"
                min={1}
                step={1}
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
                disabled={linesLocked}
                className={gridInputRight}
              />
            </label>
            <Button onClick={addUnits} disabled={linesLocked}>
              {isAsset ? '+ Add Units' : '+ Add Line'}
            </Button>
            {(addError || error) && (
              <span className="text-[11px] font-medium text-[var(--danger)]">{addError || error}</span>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} w-[48px]`}>Sr No.</th>
                <th className={`${gridHeadCell} w-[130px]`}>Item Code</th>
                <th className={gridHeadCell}>Item Name</th>
                <th className={`${gridHeadCell} w-[70px]`}>UOM</th>
                {isAsset ? (
                  <>
                    <th className={`${gridHeadCell} w-[130px]`}>Serial No.</th>
                    <th className={`${gridHeadCell} w-[120px]`}>IP Address</th>
                    <th className={`${gridHeadCell} w-[130px]`}>MAC Address</th>
                    <th className={`${gridHeadCell} w-[140px]`}>Hostname</th>
                    <th className={`${gridHeadCell} w-[120px]`}>Condition</th>
                  </>
                ) : (
                  <th className={`${gridHeadCell} w-[110px]`}>Batch / Lot</th>
                )}
                <th className={`${gridHeadCell} w-[100px]`}>Received Qty</th>
                <th className={`${gridHeadCell} w-[100px]`}>Accepted Qty</th>
                <th className={`${gridHeadCell} w-[100px]`}>Rejected Qty</th>
                <th className={`${gridHeadCell} w-[115px]`}>Available Stock</th>
                <th className={`${gridHeadCell} w-[110px]`}>Amount (₹)</th>
                <th className={`${gridHeadCell} w-[110px]`}>Location</th>
                <th className={`${gridHeadCell} w-[130px]`}>Remark</th>
                <th className={`${gridHeadCell} w-[54px] text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filled.length === 0 ? (
                <tr>
                  <td colSpan={emptyColSpan} className="px-3 py-6 text-center text-[12px] text-[var(--text3)]">
                    {isAsset
                      ? 'No units yet — choose an asset and qty, then click Add Units.'
                      : 'No lines yet — choose a consumable and qty, then click Add Line.'}
                  </td>
                </tr>
              ) : (
                filled.map((line, idx) => {
                  const unit = unitById.get(line.uomId)
                  const location = locationById.get(line.locationId)
                  const received = toNum(line.receivedQty)
                  const split = toNum(line.acceptedQty) + toNum(line.rejectedQty)
                  const splitMismatch =
                    !isAsset && line.itemId !== '' && received > 0 && Math.abs(split - received) > 0.0001
                  return (
                    <tr key={line.key} className="border-b border-[var(--border)] align-middle">
                      <td className={`${gridCell} text-center text-[var(--text3)]`}>{idx + 1}</td>
                      <td className={gridCell}>
                        <Input value={line.itemCode} readOnly className={gridInput} />
                      </td>
                      <td className={gridCell}>
                        <Input value={line.itemName} readOnly className={gridInput} />
                      </td>
                      <td className={gridCell}>
                        <Input value={unit ? String(unit.code ?? '') : ''} readOnly className={gridInput} />
                      </td>
                      {isAsset ? (
                        <>
                          <td className={gridCell}>
                            <Input
                              value={line.serialNo}
                              onChange={(e) => patch(line.key, { serialNo: e.target.value.toUpperCase() })}
                              disabled={linesLocked}
                              maxLength={100}
                              placeholder="SN-…"
                              className={gridInput}
                            />
                          </td>
                          <td className={gridCell}>
                            <Input
                              value={line.ipAddress}
                              onChange={(e) => patch(line.key, { ipAddress: e.target.value })}
                              disabled={linesLocked}
                              maxLength={45}
                              placeholder="192.168.0.25"
                              className={gridInput}
                            />
                          </td>
                          <td className={gridCell}>
                            <Input
                              value={line.macAddress}
                              onChange={(e) =>
                                patch(line.key, { macAddress: e.target.value.toUpperCase() })
                              }
                              disabled={linesLocked}
                              maxLength={17}
                              placeholder="AA-BB-…"
                              className={gridInput}
                            />
                          </td>
                          <td className={gridCell}>
                            <Input
                              value={line.hostname}
                              onChange={(e) => patch(line.key, { hostname: e.target.value })}
                              disabled={linesLocked}
                              maxLength={150}
                              placeholder="host.local"
                              className={gridInput}
                            />
                          </td>
                          <td className={gridCell}>
                            <Select
                              value={line.itemCondition}
                              onChange={(e) => patch(line.key, { itemCondition: e.target.value })}
                              disabled={linesLocked}
                              className={gridInput}
                            >
                              <option value="">— Select —</option>
                              {conditionOptions.map((c) => (
                                <option key={c.code ?? c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </Select>
                          </td>
                        </>
                      ) : (
                        <td className={gridCell}>
                          <Input
                            value={line.batch}
                            onChange={(e) => patch(line.key, { batch: e.target.value })}
                            disabled={linesLocked}
                            placeholder="Batch / lot"
                            className={gridInput}
                          />
                        </td>
                      )}
                      <td className={gridCell}>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.receivedQty}
                          onChange={(e) => setReceived(line, e.target.value)}
                          disabled={linesLocked || isAsset}
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
                          disabled={linesLocked || isAsset}
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
                          disabled={linesLocked || isAsset}
                          invalid={splitMismatch}
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={stockLoading[line.key] ? '…' : line.availableStock}
                          readOnly
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
                          disabled={linesLocked}
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
                })
              )}
              {filled.length > 0 && (
                <tr>
                  <td
                    colSpan={4 + typeColSpan + 3}
                    className="px-2 py-1.5 text-right text-[11px] font-semibold text-[var(--accent)]"
                  >
                    Total Amount →
                  </td>
                  <td className="px-2 py-1.5 text-right text-[12px] font-bold text-[var(--accent)] tabular-nums">
                    {money(totalAmount)}
                  </td>
                  <td colSpan={3} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ItemCodeOptions id={DATALIST_ID} items={filteredItems} stockByItemId={stockByItemId} />

        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
          <div className="flex-1" />
          <span className="text-[11px] font-semibold text-[var(--text2)]">
            Total {isAsset ? 'Units' : 'Items'}: {filled.length}
          </span>
        </div>
      </CardBody>
    </Card>
  )
}
