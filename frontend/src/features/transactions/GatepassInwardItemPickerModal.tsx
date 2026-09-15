import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { ApiMasterRow } from '@/api/masters'
import { locLabel } from './txnLookups'
import {
  applyItemMaster,
  gridInput,
  gridInputRight,
  toNum,
  useCodeIndex,
  wholeQtyStr,
} from './lineGrid'
import {
  emptyGatepassInwardLine,
  resolveInwardReceiveLocation,
  type GatepassInwardLine,
} from './GatepassInwardItemLines'

function isAssetItem(item: ApiMasterRow) {
  return Boolean(item.isSerialized || item.itemType === 'asset')
}

const headCell =
  'sticky top-0 z-10 border-b-2 border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap'
const bodyCell = 'border-b border-[var(--border)] px-3 py-2 text-[12px] align-middle'

/**
 * Popup for New Inward: pick item first, receive location from Item Master
 * (Quarantine when inspection is needed), then add line(s).
 * Fixed-size panel aligned with Transfer / Outward pickers.
 */
export function GatepassInwardItemPickerModal({
  open,
  onClose,
  onComplete,
  items,
  units,
  locations,
}: {
  open: boolean
  onClose: () => void
  onComplete: (lines: GatepassInwardLine[]) => void
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
}) {
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)

  const [search, setSearch] = useState('')
  const [pickItemId, setPickItemId] = useState('')
  const [pickQty, setPickQty] = useState('1')
  const [staged, setStaged] = useState<GatepassInwardLine[]>([])
  const [addError, setAddError] = useState('')

  useEffect(() => {
    if (!open) return
    setSearch('')
    setPickItemId('')
    setPickQty('1')
    setStaged([])
    setAddError('')
  }, [open])

  const activeItems = useMemo(
    () => items.filter((i) => i.status !== 'Inactive'),
    [items],
  )

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = !term
      ? activeItems
      : activeItems.filter((i) => {
          const blob = `${i.code ?? ''} ${i.name ?? ''}`.toLowerCase()
          return blob.includes(term)
        })
    return [...list].sort((a, b) =>
      String(a.code ?? '').localeCompare(String(b.code ?? ''), undefined, {
        sensitivity: 'base',
      }),
    )
  }, [activeItems, search])

  const pickPreview = useMemo(() => {
    if (!pickItemId) return null
    const item = items.find((i) => i.id === pickItemId)
    if (!item) return null
    return { item, ...resolveInwardReceiveLocation(item, locations) }
  }, [pickItemId, items, locations])

  const receiveLabel = (() => {
    if (!pickItemId) return 'Select an item from the list'
    if (pickPreview?.error) return pickPreview.error
    if (!pickPreview?.locationId) return '-'
    const loc = locationById.get(pickPreview.locationId)
    const base = loc ? locLabel(loc) : pickPreview.locationId
    return pickPreview.inspectionNeeded
      ? `${base} (Quarantine — pending inspection)`
      : base
  })()

  const addToStaged = () => {
    setAddError('')
    const item = items.find((i) => i.id === pickItemId)
    if (!item) {
      setAddError('Select an item from the list first')
      return
    }
    const resolved = resolveInwardReceiveLocation(item, locations)
    if (resolved.error) {
      setAddError(resolved.error)
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

    const buildOne = (qty: string): GatepassInwardLine => {
      const applied = applyItemMaster(item, resolved.locationId)
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
        locationId: resolved.locationId,
        homeStoreId: resolved.homeStoreId,
        inspectionNeeded: resolved.inspectionNeeded,
      }
    }

    const created = asset
      ? Array.from({ length: n }, () => buildOne('1'))
      : [buildOne(wholeQtyStr(n))]

    setStaged((prev) => [...prev, ...created])
    setPickItemId('')
    setPickQty('1')
    setAddError('')
  }

  const removeStaged = (key: string) =>
    setStaged((prev) => prev.filter((l) => l.key !== key))

  return (
    <Modal
      open={open}
      title="Select Inward Items"
      subtitle="Select item first — receive location comes from Item Master (Quarantine when inspection is needed)."
      onClose={onClose}
      width="max-w-5xl"
      offsetSidebar
      panelClassName="!h-[min(90vh,720px)]"
      bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0"
      footer={
        <>
          <div className="mr-auto text-[11px] text-[var(--text3)]">
            {staged.length > 0
              ? `${staged.length} line(s) ready to add`
              : 'Pick items, then Add to Inward'}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={staged.length === 0}
            onClick={() => {
              onComplete(staged)
              onClose()
            }}
          >
            Add to Inward ({staged.length})
          </Button>
        </>
      }
    >
      {/* Search — fixed height */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item code or name..."
          autoFocus
          className="text-[12.5px]"
        />
      </div>

      {/* Item catalog — fixed flex share */}
      <div className="flex min-h-0 flex-[1.15] flex-col border-b border-[var(--border)]">
        <div className="shrink-0 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
          Items ({filteredItems.length})
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className={headCell}>Item Code</th>
                <th className={headCell}>Item Name</th>
                <th className={`${headCell} w-[100px]`}>Type</th>
                <th className={`${headCell} w-[110px]`}>Inspection</th>
                <th className={headCell}>Home Store</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-[12.5px] text-[var(--text3)]">
                    {search.trim() ? 'No items match your search.' : 'No active items found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const selected = item.id === pickItemId
                  const home = item.store ? locationById.get(String(item.store)) : undefined
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setPickItemId(item.id)
                        setAddError('')
                      }}
                      className={`cursor-pointer transition ${
                        selected
                          ? 'bg-[var(--accent-lt)]'
                          : 'hover:bg-[var(--surface2)]'
                      }`}
                    >
                      <td className={`${bodyCell} font-mono text-[11.5px]`}>
                        {String(item.code ?? '')}
                      </td>
                      <td className={bodyCell}>{String(item.name ?? '')}</td>
                      <td className={bodyCell}>
                        {isAssetItem(item) ? 'Asset' : 'Consumable'}
                      </td>
                      <td className={bodyCell}>
                        {item.inspectionNeeded ? (
                          <span className="text-[11px] font-semibold text-[var(--accent-deep)]">
                            Required
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--text3)]">No</span>
                        )}
                      </td>
                      <td className={bodyCell}>
                        {home ? locLabel(home) : item.store ? String(item.store) : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selection strip — fixed */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-3">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,1.4fr)_88px_auto]">
          <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
            <span>Receive location</span>
            <Input value={receiveLabel} readOnly disabled className={gridInput} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
            <span>Qty</span>
            <Input
              type="number"
              min={1}
              step={1}
              value={pickQty}
              onChange={(e) => setPickQty(e.target.value)}
              disabled={!pickItemId}
              className={gridInputRight}
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              className="h-[34px] w-full md:w-auto"
              onClick={addToStaged}
              disabled={!pickItemId}
            >
              + Add Line
            </Button>
          </div>
        </div>
        {addError && <div className="mt-2 text-[12px] text-[var(--danger)]">{addError}</div>}
        {pickPreview?.inspectionNeeded && !pickPreview.error && (
          <div className="mt-2 text-[12px] text-[var(--text2)]">
            Inspection required — on submit stock posts to Quarantine until Inspection Approval.
          </div>
        )}
      </div>

      {/* Staged lines — fixed flex share */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
          Lines to add ({staged.length})
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className={`${headCell} w-10`}>#</th>
                <th className={headCell}>Item</th>
                <th className={`${headCell} w-[100px]`}>Inspection</th>
                <th className={headCell}>Receive Location</th>
                <th className={`${headCell} w-16 text-right`}>Qty</th>
                <th className={`${headCell} w-14`}>Unit</th>
                <th className={`${headCell} w-14 text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {staged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-[12.5px] text-[var(--text3)]"
                  >
                    Select an item above, set qty, then click + Add Line.
                  </td>
                </tr>
              ) : (
                staged.map((line, idx) => {
                  const unit = unitById.get(line.uomId)
                  const loc = line.locationId
                    ? locationById.get(line.locationId)
                    : undefined
                  return (
                    <tr key={line.key}>
                      <td className={`${bodyCell} tabular-nums text-[var(--text3)]`}>
                        {idx + 1}
                      </td>
                      <td className={bodyCell}>
                        {[line.itemCode, line.itemName].filter(Boolean).join(' - ') ||
                          line.itemId}
                      </td>
                      <td className={bodyCell}>
                        {line.inspectionNeeded ? (
                          <span className="text-[11px] font-semibold text-[var(--accent-deep)]">
                            Required
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--text3)]">No</span>
                        )}
                      </td>
                      <td className={bodyCell}>
                        {loc
                          ? locLabel(loc) +
                            (line.inspectionNeeded ? ' (Quarantine)' : '')
                          : line.locationId || '-'}
                      </td>
                      <td className={`${bodyCell} text-right tabular-nums`}>{line.qty}</td>
                      <td className={bodyCell}>
                        {unit ? String(unit.code ?? '') : '-'}
                      </td>
                      <td className={`${bodyCell} text-center`}>
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => removeStaged(line.key)}
                          className="rounded px-1 text-[14px] text-[var(--text3)] hover:text-[var(--danger)]"
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
