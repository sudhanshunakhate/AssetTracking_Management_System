import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import type { ApiMasterRow } from '@/api/masters'
import { locLabel, quarantineForEntity, quarantineForLocation } from './txnLookups'
import {
  applyItemMaster,
  FilterableLookup,
  gridCell,
  gridHeadCell,
  gridHeadLabel,
  gridInput,
  gridInputRight,
  toNum,
  useCodeIndex,
  wholeQtyStr,
} from './lineGrid'

export type GatepassInwardLine = {
  key: string
  itemId: string
  itemCode: string
  itemName: string
  qty: string
  uomId: string
  serialNo: string
  remark: string
  itemType: string
  /** Where stock lands on submit (home store, or Quarantine when inspection needed). */
  locationId: string
  /** Item Master home / current store — used after inspection approval. */
  homeStoreId: string
  inspectionNeeded: boolean
}

export function emptyGatepassInwardLine(): GatepassInwardLine {
  return {
    key: `in-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemId: '',
    itemCode: '',
    itemName: '',
    qty: '1',
    uomId: '',
    serialNo: '',
    remark: '',
    itemType: '',
    locationId: '',
    homeStoreId: '',
    inspectionNeeded: false,
  }
}

function isAssetItem(item: ApiMasterRow | undefined, fallbackType = '') {
  if (item?.isSerialized || item?.itemType === 'asset') return true
  return String(fallbackType).toLowerCase() === 'asset'
}

/** Resolve receive location from Item Master: home store, or Quarantine when inspection is needed. */
export function resolveInwardReceiveLocation(
  item: ApiMasterRow,
  locations: ApiMasterRow[],
): { locationId: string; homeStoreId: string; inspectionNeeded: boolean; error?: string } {
  const homeStoreId = String(item.store ?? '').trim()
  if (!homeStoreId) {
    return {
      locationId: '',
      homeStoreId: '',
      inspectionNeeded: Boolean(item.inspectionNeeded),
      error: `Item ${item.code || item.id} has no home store in Item Master`,
    }
  }
  const inspectionNeeded = Boolean(item.inspectionNeeded)
  if (!inspectionNeeded) {
    return { locationId: homeStoreId, homeStoreId, inspectionNeeded: false }
  }
  const entityId = String(item.orgCode ?? '')
  const quarantineId =
    (entityId ? quarantineForEntity(locations, entityId) : '') ||
    quarantineForLocation(homeStoreId, locations)
  if (!quarantineId) {
    return {
      locationId: '',
      homeStoreId,
      inspectionNeeded: true,
      error: `Quarantine location could not be resolved for item ${item.code || item.id}`,
    }
  }
  return { locationId: quarantineId, homeStoreId, inspectionNeeded: true }
}

/**
 * Inward item grid — aligned toolbar + table (Transfer / Outward style).
 * New inward: open item picker popup (item first; location from Item Master / Quarantine).
 */
export function GatepassInwardItemLines({
  lines,
  onChange,
  items,
  units,
  locations = [],
  storeLocationId,
  systemStores = [],
  onStoreChange,
  allowAddItems = true,
  locked = false,
  itemFirst = false,
  onOpenPicker,
  onChangeOutward,
  error,
}: {
  lines: GatepassInwardLine[]
  onChange: Dispatch<SetStateAction<GatepassInwardLine[]>>
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations?: ApiMasterRow[]
  storeLocationId: string
  systemStores?: ApiMasterRow[]
  onStoreChange?: (id: string) => void
  /** When false, hide the add-item controls (e.g. returnable before outward selected). */
  allowAddItems?: boolean
  locked?: boolean
  /** New inward: select items via popup. */
  itemFirst?: boolean
  onOpenPicker?: () => void
  onChangeOutward?: () => void
  error?: string
}) {
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations.length ? locations : systemStores)
  const filled = lines.filter((l) => l.itemId)

  const [pickItemId, setPickItemId] = useState('')
  const [pickQty, setPickQty] = useState('1')
  const [addError, setAddError] = useState('')

  const storeLabel = useMemo(() => {
    if (!storeLocationId) return ''
    const loc =
      locations.find((l) => l.id === storeLocationId) ??
      systemStores.find((l) => l.id === storeLocationId)
    return loc ? locLabel(loc) : storeLocationId
  }, [locations, systemStores, storeLocationId])

  const itemOptions = useMemo(
    () =>
      items
        .filter((i) => i.status !== 'Inactive')
        .map((i) => {
          const code = String(i.code ?? '').trim()
          const name = String(i.name ?? '').trim()
          const label = code && name ? `${code} - ${name}` : code || name || i.id
          return { value: i.id, label, searchText: label }
        })
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    [items],
  )

  const patch = (key: string, changes: Partial<GatepassInwardLine>) => {
    onChange((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)))
  }

  const removeLine = (key: string) =>
    onChange((prev) => {
      const next = prev.filter((l) => l.key !== key)
      return next.length ? next : [emptyGatepassInwardLine()]
    })

  const addFromPicker = () => {
    setAddError('')
    if (locked || !allowAddItems || itemFirst) return

    if (!storeLocationId) {
      setAddError('Select a system store first')
      return
    }

    const item = items.find((i) => i.id === pickItemId)
    if (!item) {
      setAddError('Select an item first')
      return
    }
    const n = Math.floor(toNum(pickQty))
    if (n <= 0) {
      setAddError('Quantity must be greater than 0')
      return
    }
    const asset = isAssetItem(item)
    if (asset && n > 200) {
      setAddError('Max 200 asset units at a time')
      return
    }

    const receiveLoc = storeLocationId
    const buildOne = (qty: string): GatepassInwardLine => {
      const applied = applyItemMaster(item, receiveLoc)
      return {
        ...emptyGatepassInwardLine(),
        itemId: applied.itemId,
        itemCode: applied.itemCode,
        itemName: applied.itemName,
        uomId: applied.uomId,
        qty,
        itemType: String(item.itemType ?? (asset ? 'asset' : 'consumable')),
        serialNo: '',
        remark: '',
        locationId: receiveLoc,
        homeStoreId: receiveLoc,
        inspectionNeeded: Boolean(item.inspectionNeeded),
      }
    }

    if (asset) {
      const created = Array.from({ length: n }, () => buildOne('1'))
      onChange((prev) => [...prev.filter((l) => l.itemId), ...created])
    } else {
      onChange((prev) => [...prev.filter((l) => l.itemId), buildOne(wholeQtyStr(n))])
    }
    setPickItemId('')
    setPickQty('1')
  }

  const showAddBar = !locked && allowAddItems && !itemFirst
  const showPickerBar = !locked && allowAddItems && itemFirst
  const storeReady = Boolean(storeLocationId)
  const showLocationCol = itemFirst || filled.some((l) => l.locationId)

  const subtitle = (() => {
    if (locked) {
      return filled.length
        ? `${filled.length} line(s) from returnable outward`
        : 'Select a returnable outward to load item lines.'
    }
    if (itemFirst) {
      return filled.length
        ? `${filled.length} line(s) — receive location from Item Master (Quarantine when inspection needed).`
        : 'Open the picker to select items. Receive location comes from Item Master.'
    }
    return storeReady
      ? `Receiving into ${storeLabel}`
      : 'Choose system store, then add items to the grid.'
  })()

  const emptyHint = (() => {
    if (locked) return 'No lines yet. Select a returnable outward above.'
    if (!allowAddItems) return 'Select a returnable outward to load item lines.'
    if (itemFirst) {
      return (
        <>
          No items yet. Use <b className="text-[var(--text2)]">Select Items…</b> to add lines.
        </>
      )
    }
    if (storeReady) return 'No items yet. Select an item and click + Add Line.'
    return 'Select a system store above, then add items.'
  })()

  const colCount = (locked ? 6 : 7) + (showLocationCol ? 1 : 0) + (itemFirst ? 1 : 0)

  return (
    <Card>
      <CardHeader
        title="Item Details"
        subtitle={subtitle}
        actions={
          locked && onChangeOutward ? (
            <Button variant="ghost" className="text-xs" onClick={onChangeOutward}>
              Change Outward
            </Button>
          ) : undefined
        }
      />
      <CardBody className="p-0">
        {error && (
          <div className="border-b border-[var(--border)] px-3.5 py-2 text-[12px] text-[var(--danger)]">
            {error}
          </div>
        )}

        {showPickerBar && (
          <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-3">
            <Button type="button" onClick={() => onOpenPicker?.()}>
              {filled.length ? 'Add More Items…' : 'Select Items…'}
            </Button>
            <div className="min-w-0 flex-1 text-[12.5px] text-[var(--text2)]">
              <span className="text-[var(--text3)]">
                Popup: pick item first — location fills from Item Master (Quarantine when inspection
                is needed).
              </span>
            </div>
          </div>
        )}

        {showAddBar ? (
          <div className="border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-3">
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1.1fr)_minmax(260px,1.6fr)_88px_auto]">
              <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
                <span>
                  System Store <span className="text-[var(--danger)]">*</span>
                </span>
                {onStoreChange ? (
                  <Select
                    value={storeLocationId}
                    onChange={(e) => {
                      onStoreChange(e.target.value)
                      setPickItemId('')
                      setAddError('')
                    }}
                    className={gridInput}
                  >
                    <option value="">- Select Store -</option>
                    {systemStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {locLabel(s)}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input value={storeLabel || '-'} readOnly disabled className={gridInput} />
                )}
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
                <span>Item</span>
                <FilterableLookup
                  value={pickItemId}
                  onChange={setPickItemId}
                  options={itemOptions}
                  disabled={!storeReady}
                  placeholder={storeReady ? '- Select Item -' : '- Select store first -'}
                  searchPlaceholder="Search item code or name..."
                  className={gridInput}
                />
              </label>

              <label className="flex w-full flex-col gap-1 text-[11px] font-semibold text-[var(--text2)] sm:w-auto">
                <span>Qty</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={pickQty}
                  onChange={(e) => setPickQty(e.target.value)}
                  disabled={!storeReady}
                  className={gridInputRight}
                />
              </label>

              <div className="flex items-end">
                <Button
                  type="button"
                  className="h-[34px] w-full lg:w-auto"
                  onClick={addFromPicker}
                  disabled={!storeReady}
                >
                  + Add Line
                </Button>
              </div>
            </div>
            {addError && (
              <div className="mt-2 text-[12px] text-[var(--danger)]">{addError}</div>
            )}
          </div>
        ) : !showPickerBar ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5 text-[12.5px] text-[var(--text2)]">
            <span>
              <b className="text-[var(--text)]">System store:</b> {storeLabel || '-'}
            </span>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className={`${gridHeadCell} w-[40px]`}>#</th>
                <th className={gridHeadCell}>{gridHeadLabel('Item', true)}</th>
                {itemFirst && (
                  <th className={`${gridHeadCell} w-[100px]`}>Inspection</th>
                )}
                {showLocationCol && (
                  <th className={`${gridHeadCell} min-w-[160px]`}>Receive Location</th>
                )}
                <th className={`${gridHeadCell} w-[80px]`}>{gridHeadLabel('Qty', true)}</th>
                <th className={`${gridHeadCell} w-[70px]`}>Unit</th>
                <th className={`${gridHeadCell} w-[160px]`}>Serial / Batch</th>
                <th className={gridHeadCell}>Remark</th>
                {!locked && <th className={`${gridHeadCell} w-[56px] text-center`}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filled.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-3 py-10 text-center text-[12.5px] text-[var(--text3)]"
                  >
                    {emptyHint}
                  </td>
                </tr>
              ) : (
                filled.map((line, idx) => {
                  const item = items.find((i) => i.id === line.itemId)
                  const asset = isAssetItem(item, line.itemType)
                  const unit = unitById.get(line.uomId)
                  const receiveLoc = line.locationId
                    ? locationById.get(line.locationId)
                    : undefined
                  return (
                    <tr key={line.key} className="border-b border-[var(--border)]">
                      <td className={`${gridCell} tabular-nums text-[var(--text3)]`}>{idx + 1}</td>
                      <td className={gridCell}>
                        <Input
                          value={
                            [line.itemCode, line.itemName].filter(Boolean).join(' - ') ||
                            line.itemId
                          }
                          readOnly
                          className={gridInput}
                        />
                      </td>
                      {itemFirst && (
                        <td className={gridCell}>
                          <span
                            className={
                              line.inspectionNeeded
                                ? 'text-[11px] font-semibold text-[var(--accent-deep)]'
                                : 'text-[11px] text-[var(--text3)]'
                            }
                          >
                            {line.inspectionNeeded ? 'Required' : 'No'}
                          </span>
                        </td>
                      )}
                      {showLocationCol && (
                        <td className={gridCell}>
                          <Input
                            value={
                              receiveLoc
                                ? locLabel(receiveLoc) +
                                  (line.inspectionNeeded ? ' (Quarantine)' : '')
                                : line.locationId || '-'
                            }
                            readOnly
                            className={gridInput}
                          />
                        </td>
                      )}
                      <td className={gridCell}>
                        <Input
                          type="number"
                          step="1"
                          min={0}
                          value={line.qty}
                          onChange={(e) => patch(line.key, { qty: e.target.value })}
                          disabled={locked || asset}
                          className={gridInputRight}
                        />
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={unit ? String(unit.code ?? '') : '-'}
                          readOnly
                          className={gridInput}
                        />
                      </td>
                      <td className={gridCell}>
                        {asset || line.serialNo ? (
                          <Input
                            value={line.serialNo}
                            onChange={(e) =>
                              patch(line.key, { serialNo: e.target.value.toUpperCase() })
                            }
                            placeholder="Serial number"
                            className={`${gridInput} font-mono`}
                          />
                        ) : (
                          <Input
                            value={line.serialNo}
                            onChange={(e) => patch(line.key, { serialNo: e.target.value })}
                            placeholder="Optional batch"
                            disabled={locked}
                            className={gridInput}
                          />
                        )}
                      </td>
                      <td className={gridCell}>
                        <Input
                          value={line.remark}
                          onChange={(e) => patch(line.key, { remark: e.target.value })}
                          disabled={locked}
                          placeholder="-"
                          className={gridInput}
                        />
                      </td>
                      {!locked && (
                        <td className={`${gridCell} text-center`}>
                          <button
                            type="button"
                            aria-label="Remove line"
                            onClick={() => removeLine(line.key)}
                            className="rounded px-1 text-[14px] text-[var(--text3)] hover:text-[var(--danger)]"
                          >
                            x
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
