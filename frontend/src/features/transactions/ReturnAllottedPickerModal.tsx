import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { ApiMasterRow } from '@/api/masters'
import type { AllottedUnit } from '@/api/transactions'
import { locLabel } from './txnLookups'
import { formatStockQty, gridInput, gridInputRight, toNum, useCodeIndex, wholeQtyStr } from './lineGrid'

const headCell =
  'sticky top-0 z-10 border-b-2 border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap'
const bodyCell = 'border-b border-[var(--border)] px-3 py-2 text-[12px] align-middle'

export type ReturnPickerSelection = {
  itemId: string
  itemCode: string
  itemName: string
  itemType: string
  uomId: string
  storeId: string
  /** Resolved "CODE - Name" for the read-only Return to Store field. */
  storeLabel: string
  uomLabel: string
  qty: string
  serialNo: string
  batchLotNo: string
  ipAddress: string
  macAddress: string
  hostname: string
  allottedQty: number
}

/**
 * Fixed-size popup: pick an item allotted to the selected employee.
 * Shows allotted qty (not store free stock). Assets require picking a serial from custody.
 */
export function ReturnAllottedPickerModal({
  open,
  onClose,
  onSelect,
  items,
  units,
  locations,
  itemIds,
  unitsAllotted,
  qtyByItemId,
  loading = false,
  partyLabel = '',
  partyKind = 'employee',
  /** @deprecated use partyLabel */
  employeeLabel,
}: {
  open: boolean
  onClose: () => void
  onSelect: (sel: ReturnPickerSelection) => void
  items: ApiMasterRow[]
  units: ApiMasterRow[]
  locations: ApiMasterRow[]
  itemIds: string[]
  unitsAllotted: AllottedUnit[]
  qtyByItemId: Record<string, number>
  loading?: boolean
  partyLabel?: string
  partyKind?: 'employee' | 'department'
  employeeLabel?: string
}) {
  const resolvedPartyLabel = partyLabel || employeeLabel || ''
  const partyNoun = partyKind === 'department' ? 'department' : 'employee'
  const unitById = useCodeIndex(units)
  const locationById = useCodeIndex(locations)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [serialKey, setSerialKey] = useState('')
  const [qty, setQty] = useState('1')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedId('')
    setSerialKey('')
    setQty('1')
    setError('')
  }, [open])

  const rows = useMemo(() => {
    const idSet = new Set(itemIds)
    return items
      .filter((i) => idSet.has(i.id) && i.status !== 'Inactive')
      .map((i) => {
        const allotted = Number(qtyByItemId[i.id] ?? 0)
        const unitCount = unitsAllotted.filter((u) => String(u.itemId) === i.id).length
        const qtyShown = allotted > 0 ? allotted : unitCount
        const home = i.store ? locationById.get(String(i.store)) : undefined
        return {
          item: i,
          allottedQty: qtyShown,
          homeLabel: home ? locLabel(home) : '-',
          isAsset: Boolean(i.isSerialized || i.itemType === 'asset'),
        }
      })
      .sort((a, b) =>
        String(a.item.code ?? '').localeCompare(String(b.item.code ?? ''), undefined, {
          sensitivity: 'base',
        }),
      )
  }, [items, itemIds, qtyByItemId, unitsAllotted, locationById])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) =>
      `${r.item.code} ${r.item.name} ${r.homeLabel}`.toLowerCase().includes(term),
    )
  }, [rows, search])

  const selected = rows.find((r) => r.item.id === selectedId)
  const serialOptions = useMemo(() => {
    if (!selectedId) return []
    return unitsAllotted
      .filter((u) => String(u.itemId) === selectedId)
      .map((u, idx) => ({
        key: `${u.itemId}|${u.serialNo ?? ''}|${u.batchLotNo ?? ''}|${idx}`,
        unit: u,
        label:
          [u.serialNo, u.batchLotNo ? `Batch ${u.batchLotNo}` : '']
            .filter(Boolean)
            .join(' · ') || `Unit ${idx + 1}`,
      }))
  }, [selectedId, unitsAllotted])

  useEffect(() => {
    if (!selected) {
      setSerialKey('')
      setQty('1')
      return
    }
    setQty(selected.isAsset ? '1' : wholeQtyStr(Math.min(1, selected.allottedQty) || 1))
    if (serialOptions.length === 1) {
      setSerialKey(serialOptions[0].key)
    } else {
      setSerialKey('')
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = () => {
    setError('')
    if (!selected) {
      setError('Select an allotted item')
      return
    }
    const maxQty = selected.allottedQty
    if (selected.isAsset || serialOptions.length > 0) {
      if (!serialKey && serialOptions.length > 0) {
        setError('Select the serial / unit to return')
        return
      }
      if (selected.isAsset && serialOptions.length === 0) {
        setError('No serial units in custody for this asset — check Issue / BLS data')
        return
      }
    }
    const n = Math.floor(toNum(qty))
    if (n <= 0) {
      setError('Return qty must be greater than 0')
      return
    }
    if (n > maxQty) {
      setError(`Return qty cannot exceed allotted qty (${formatStockQty(maxQty)})`)
      return
    }
    if (selected.isAsset && n !== 1) {
      setError('Assets return one serial unit at a time')
      return
    }

    const picked = serialOptions.find((o) => o.key === serialKey)?.unit
    const homeStore = String(selected.item.store ?? '')
    const uomId = String(selected.item.uom ?? '')
    onSelect({
      itemId: selected.item.id,
      itemCode: String(selected.item.code ?? ''),
      itemName: String(selected.item.name ?? ''),
      itemType: String(selected.item.itemType ?? (selected.isAsset ? 'asset' : 'consumable')),
      uomId,
      storeId: homeStore,
      storeLabel: selected.homeLabel !== '-' ? selected.homeLabel : '',
      uomLabel: String(unitById.get(uomId)?.code ?? ''),
      qty: wholeQtyStr(n),
      serialNo: String(picked?.serialNo ?? '').trim().toUpperCase(),
      batchLotNo: String(picked?.batchLotNo ?? ''),
      ipAddress: String(picked?.ipAddress ?? ''),
      macAddress: String(picked?.macAddress ?? ''),
      hostname: String(picked?.hostname ?? ''),
      allottedQty: maxQty,
    })
    onClose()
  }

  const unitCode = selected
    ? String(unitById.get(String(selected.item.uom ?? ''))?.code ?? '')
    : ''

  return (
    <Modal
      open={open}
      title="Select Allotted Item"
      subtitle={
        resolvedPartyLabel
          ? `Items currently with ${resolvedPartyLabel}. Qty is allotted to this ${partyNoun} (not store free stock).`
          : `Items currently allotted to the selected ${partyNoun}.`
      }
      onClose={onClose}
      width="max-w-5xl"
      offsetSidebar
      panelClassName="!h-[min(90vh,720px)]"
      bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selectedId || loading} onClick={confirm}>
            Use This Item
          </Button>
        </>
      }
    >
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search allotted item code or name..."
          autoFocus
          className="text-[12.5px]"
        />
      </div>

      <div className="min-h-0 flex-[1.2] overflow-auto">
        {loading && (
          <div className="px-3 py-8 text-center text-[12.5px] text-[var(--text3)]">
            Loading allotted items...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-[12.5px] text-[var(--text3)]">
            {itemIds.length === 0
              ? `No items are currently allotted to this ${partyNoun}.`
              : 'No items match your search.'}
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                <th className={headCell}>Item Code</th>
                <th className={headCell}>Item Name</th>
                <th className={`${headCell} w-[90px]`}>Type</th>
                <th className={`${headCell} w-[110px] text-right`}>Allotted Qty</th>
                <th className={headCell}>Home Store</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const selectedRow = r.item.id === selectedId
                return (
                  <tr
                    key={r.item.id}
                    onClick={() => {
                      setSelectedId(r.item.id)
                      setError('')
                    }}
                    className={`cursor-pointer transition ${
                      selectedRow ? 'bg-[var(--accent-lt)]' : 'hover:bg-[var(--surface2)]'
                    }`}
                  >
                    <td className={`${bodyCell} font-mono text-[11.5px]`}>
                      {String(r.item.code ?? '')}
                    </td>
                    <td className={bodyCell}>{String(r.item.name ?? '')}</td>
                    <td className={bodyCell}>{r.isAsset ? 'Asset' : 'Consumable'}</td>
                    <td className={`${bodyCell} text-right tabular-nums font-medium`}>
                      {formatStockQty(r.allottedQty)}
                    </td>
                    <td className={bodyCell}>{r.homeLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface2)] px-3.5 py-3">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_88px_70px]">
          <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
            <span>Serial / Unit {selected?.isAsset ? '*' : ''}</span>
            {serialOptions.length > 0 ? (
              <Select
                value={serialKey}
                onChange={(e) => setSerialKey(e.target.value)}
                disabled={!selectedId}
                className={gridInput}
              >
                <option value="">- Select serial -</option>
                {serialOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={selected?.isAsset ? 'No serials in custody' : 'Optional for consumables'}
                readOnly
                disabled
                className={gridInput}
              />
            )}
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
            <span>Return to store</span>
            <Input
              value={selected?.homeLabel || 'Select item first'}
              readOnly
              disabled
              className={gridInput}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
            <span>Qty</span>
            <Input
              type="number"
              min={1}
              step={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              disabled={!selectedId || Boolean(selected?.isAsset)}
              className={gridInputRight}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text2)]">
            <span>Unit</span>
            <Input value={unitCode || '-'} readOnly disabled className={gridInput} />
          </label>
        </div>
        {selected && (
          <div className="mt-2 text-[12px] text-[var(--text2)]">
            Allotted to {partyNoun}: <b>{formatStockQty(selected.allottedQty)}</b>
            {selected.isAsset
              ? ' — pick the exact serial in custody, then continue.'
              : ' — return qty cannot exceed this.'}
          </div>
        )}
        {error && <div className="mt-2 text-[12px] text-[var(--danger)]">{error}</div>}
      </div>
    </Modal>
  )
}
