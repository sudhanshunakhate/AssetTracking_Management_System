import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { CsvImportButton } from '@/components/ui/CsvImportButton'
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
  toNum,
  useCodeIndex,
  useLocationStock,
  gridHeadLabel,
  type BaseLine,
} from './lineGrid'
import {
  OST_ASSET_IMPORT_HEADERS,
  OST_ASSET_IMPORT_SAMPLE,
  OST_CONSUMABLE_IMPORT_HEADERS,
  OST_CONSUMABLE_IMPORT_SAMPLE,
  importOpeningStockLines,
} from './lineCsvImport'

export type ItemKind = 'asset' | 'consumable'

export type OpeningStockLine = BaseLine & {
  batch: string
  qty: string
  supplierId: string
  mfgDate: string
  expiryDate: string
  serialNo: string
  ipAddress: string
  macAddress: string
  hostname: string
  itemCondition: string
  issuedToEmpId: string
}

export function emptyOpeningStockLine(): OpeningStockLine {
  return {
    ...baseLine(),
    batch: '',
    qty: '',
    supplierId: '',
    mfgDate: '',
    expiryDate: '',
    serialNo: '',
    ipAddress: '',
    macAddress: '',
    hostname: '',
    itemCondition: '',
    issuedToEmpId: '',
  }
}

/** True when the condition value/label/code means the unit is Issued. */
export function isIssuedCondition(
  value: string,
  options: { value: string; label: string; code?: string }[] = [],
) {
  const raw = value.trim()
  if (!raw) return false
  const lower = raw.toLowerCase()
  if (lower === 'issued' || lower.startsWith('issued')) return true
  const opt = options.find((o) => o.value === value || o.label === value || o.code === value)
  if (!opt) return false
  const code = (opt.code ?? '').toUpperCase()
  const label = (opt.label ?? '').toLowerCase()
  return code === 'AC-ISSUED' || label === 'issued' || label.startsWith('issued')
}

const DATALIST_ID = 'opening-stock-item-options'

/**
 * Opening Stock Item Details — pick Item Type, then Add Units.
 * Asset + qty N expands into N unit lines (qty 1) with instance fields
 * (serial / IP / MAC / hostname). Consumable stays one line with quantity.
 * When any asset line has Condition = Issued, an Issued To employee column appears.
 */
export function OpeningStockItemLines({
  lines,
  onChange,
  itemType,
  onItemTypeChange,
  items,
  units,
  vendors,
  employees = [],
  locations = [],
  locationOptions = [],
  allItems,
  conditionOptions = [],
  locationId,
  readOnly = false,
  headerReady = true,
  showLineErrors = false,
  error,
}: {
  lines: OpeningStockLine[]
  onChange: Dispatch<SetStateAction<OpeningStockLine[]>>
  itemType: ItemKind
  onItemTypeChange: (next: ItemKind) => void
  items: ApiMasterRow[]
  allItems?: ApiMasterRow[]
  units: ApiMasterRow[]
  vendors: ApiMasterRow[]
  employees?: ApiMasterRow[]
  locations?: ApiMasterRow[]
  locationOptions?: { value: string; label: string }[]
  conditionOptions?: { value: string; label: string; code?: string }[]
  locationId: string
  readOnly?: boolean
  headerReady?: boolean
  showLineErrors?: boolean
  error?: string
}) {
  const isAsset = itemType === 'asset'
  const linesLocked = readOnly || !headerReady
  const filteredItems = useMemo(
    () => items.filter((i) => (i.itemType === 'consumable' ? 'consumable' : 'asset') === itemType),
    [items, itemType],
  )
  const unitById = useCodeIndex(units)
  const importPool = allItems ?? items
  const { stockByItemId } = useLocationStock(locationId)

  const showIssuedTo = isAsset

  const colCount = isAsset ? 14 : 12

  const [pickItemId, setPickItemId] = useState('')
  const [pickQty, setPickQty] = useState('1')
  const [addError, setAddError] = useState('')

  const patch = useCallback(
    (key: string, changes: Partial<OpeningStockLine>) => {
      onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    },
    [onChange],
  )

  const setCondition = (key: string, itemCondition: string) => {
    patch(key, { itemCondition })
  }

  const buildLineFromItem = (item: ApiMasterRow, qty: number): OpeningStockLine => ({
    ...emptyOpeningStockLine(),
    ...applyItemMaster(item, locationId),
    qty: String(qty),
  })

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

    if (isAsset) {
      // One physical unit per line — common catalog fields copied, unique fields blank.
      const created = Array.from({ length: n }, () => buildLineFromItem(item, 1))
      onChange((prev) => {
        const keep = prev.filter((l) => l.itemId !== '')
        return [...keep, ...created]
      })
    } else {
      onChange((prev) => {
        const keep = prev.filter((l) => l.itemId !== '')
        return [...keep, buildLineFromItem(item, n)]
      })
    }
    setPickQty('1')
    setPickItemId('')
  }

  const changeType = (next: ItemKind) => {
    onItemTypeChange(next)
    onChange([emptyOpeningStockLine()])
    setPickItemId('')
    setPickQty('1')
    setAddError('')
  }

  const onImport = (rows: Record<string, string>[]) => {
    setAddError('')
    const imported = importOpeningStockLines(rows, {
      items: importPool,
      locations,
      vendors,
      employees,
      defaultLocationId: locationId,
      activeItemType: itemType,
      docKind: 'opening',
    })
    if (imported.itemType !== itemType) {
      const filled = lines.filter((l) => l.itemId !== '')
      if (filled.length > 0) {
        const ok = window.confirm(
          `This file is ${imported.itemType}. The form currently has ${itemType} lines, which will be replaced. Continue?`,
        )
        if (!ok) return
      }
      onItemTypeChange(imported.itemType)
      onChange(imported.lines.length ? imported.lines : [emptyOpeningStockLine()])
      return
    }
    onChange((prev) => {
      const keep = prev.filter((l) => l.itemId !== '')
      return [...keep, ...imported.lines]
    })
  }

  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyOpeningStockLine()]
    })

  return (
    <Card>
      <CardHeader
        title="Item Details"
        subtitle={
          !headerReady
            ? 'Complete opening date before selecting items.'
            : isAsset
              ? 'Select Asset, enter qty, then Add Units — each unit becomes its own line for serial / network details'
              : 'Select Consumable and quantity, then Add Line'
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
            {!readOnly && (
              <CsvImportButton
                templateFilename="opening_stock_asset_lines.csv"
                templateHeaders={OST_ASSET_IMPORT_HEADERS}
                extraTemplates={[
                  {
                    label: 'Asset template',
                    filename: 'opening_stock_asset_lines.csv',
                    headers: OST_ASSET_IMPORT_HEADERS,
                    sampleRow: OST_ASSET_IMPORT_SAMPLE,
                  },
                  {
                    label: 'Consumable template',
                    filename: 'opening_stock_consumable_lines.csv',
                    headers: OST_CONSUMABLE_IMPORT_HEADERS,
                    sampleRow: OST_CONSUMABLE_IMPORT_SAMPLE,
                  },
                ]}
                disabled={linesLocked}
                onRows={onImport}
              />
            )}
            <span className="basis-full text-[10px] text-[var(--text3)]">
              Import detects Asset vs Consumable from the CSV (itemType or Item Master). One file = one type.
            </span>
            {(addError || error) && (
              <span className="whitespace-pre-wrap text-[11px] font-medium text-[var(--danger)]">
                {addError || error}
              </span>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} w-[48px]`}>Sr No.</th>
                <th className={`${gridHeadCell} w-[130px]`}>{gridHeadLabel('Item Code', true)}</th>
                <th className={gridHeadCell}>{gridHeadLabel('Item Name', true)}</th>
                <th className={`${gridHeadCell} w-[70px]`}>UOM</th>
                {isAsset ? (
                  <>
                    <th className={`${gridHeadCell} w-[130px]`}>{gridHeadLabel('Serial No.', true)}</th>
                    <th className={`${gridHeadCell} w-[120px]`}>IP Address</th>
                    <th className={`${gridHeadCell} w-[130px]`}>MAC Address</th>
                    <th className={`${gridHeadCell} w-[140px]`}>Hostname</th>
                    <th className={`${gridHeadCell} w-[120px]`}>Condition</th>
                    {showIssuedTo && (
                      <th className={`${gridHeadCell} w-[160px]`}>{gridHeadLabel('Custody', true)}</th>
                    )}
                  </>
                ) : (
                  <>
                    <th className={`${gridHeadCell} w-[120px]`}>Batch / Lot</th>
                    <th className={`${gridHeadCell} w-[100px]`}>{gridHeadLabel('Opening Qty', true)}</th>
                    <th className={`${gridHeadCell} w-[120px]`}>Mfg Date</th>
                    <th className={`${gridHeadCell} w-[120px]`}>Expiry Date</th>
                  </>
                )}
                <th className={`${gridHeadCell} w-[130px]`}>{gridHeadLabel('Location', true)}</th>
                <th className={`${gridHeadCell} w-[150px]`}>Supplier</th>
                <th className={`${gridHeadCell} w-[130px]`}>Remark</th>
                <th className={`${gridHeadCell} w-[54px] text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.filter((l) => l.itemId !== '').length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-3 py-6 text-center text-[12px] text-[var(--text3)]"
                  >
                    {isAsset
                      ? 'No units yet — choose an asset and qty, then click Add Units.'
                      : 'No lines yet — choose a consumable and qty, then click Add Line.'}
                  </td>
                </tr>
              ) : (
                lines
                  .filter((l) => l.itemId !== '')
                  .map((line, idx) => {
                    const unit = unitById.get(line.uomId)
                    const serialMissing = isAsset && !line.serialNo.trim()
                    const locationMissing = !line.locationId
                    const qtyMissing = !isAsset && toNum(line.qty) <= 0
                    const issuedToMissing = isAsset && !line.issuedToEmpId
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
                          <Input
                            value={unit ? String(unit.code ?? '') : ''}
                            readOnly
                            className={gridInput}
                          />
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
                              invalid={showLineErrors && serialMissing}
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
                                onChange={(e) => setCondition(line.key, e.target.value)}
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
                            {showIssuedTo && (
                              <td className={gridCell}>
                                <Select
                                  value={line.issuedToEmpId}
                                  onChange={(e) => patch(line.key, { issuedToEmpId: e.target.value })}
                                  disabled={linesLocked}
                                  invalid={showLineErrors && issuedToMissing}
                                  className={gridInput}
                                >
                                  <option value="">— Select Employee —</option>
                                  {employees.map((e) => (
                                    <option key={e.id} value={e.id}>
                                      {e.code} – {e.firstName} {e.lastName}
                                    </option>
                                  ))}
                                </Select>
                              </td>
                            )}
                          </>
                        ) : (
                          <>
                            <td className={gridCell}>
                              <Input
                                value={line.batch}
                                onChange={(e) => patch(line.key, { batch: e.target.value.toUpperCase() })}
                                disabled={linesLocked}
                                maxLength={40}
                                placeholder="BATCH-001"
                                className={gridInput}
                              />
                            </td>
                            <td className={gridCell}>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={line.qty}
                                onChange={(e) => patch(line.key, { qty: e.target.value })}
                                disabled={linesLocked}
                                invalid={showLineErrors && qtyMissing}
                                className={gridInputRight}
                              />
                            </td>
                            <td className={gridCell}>
                              <Input
                                type="date"
                                value={line.mfgDate}
                                onChange={(e) => patch(line.key, { mfgDate: e.target.value })}
                                disabled={linesLocked}
                                className={gridInput}
                              />
                            </td>
                            <td className={gridCell}>
                              <Input
                                type="date"
                                value={line.expiryDate}
                                onChange={(e) => patch(line.key, { expiryDate: e.target.value })}
                                disabled={linesLocked}
                                className={gridInput}
                              />
                            </td>
                          </>
                        )}
                        <td className={gridCell}>
                          <Select
                            value={line.locationId}
                            onChange={(e) => patch(line.key, { locationId: e.target.value })}
                            disabled={linesLocked}
                            invalid={showLineErrors && locationMissing}
                            className={gridInput}
                          >
                            <option value="">— Select —</option>
                            {locationOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className={gridCell}>
                          <Select
                            value={line.supplierId}
                            onChange={(e) => patch(line.key, { supplierId: e.target.value })}
                            disabled={linesLocked}
                            className={gridInput}
                          >
                            <option value="">— Select —</option>
                            {vendors.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.code} – {v.name}
                              </option>
                            ))}
                          </Select>
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
            </tbody>
          </table>
        </div>

        <ItemCodeOptions id={DATALIST_ID} items={filteredItems} stockByItemId={stockByItemId} />

        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
          <div className="flex-1" />
          <span className="text-[11px] font-semibold text-[var(--text2)]">
            Total {isAsset ? 'Units' : 'Items'}: {lines.filter((l) => l.itemId !== '').length}
          </span>
        </div>
      </CardBody>
    </Card>
  )
}
