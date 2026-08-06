import { useCallback, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { StatusPill } from '@/components/ui/Badge'
import { type Column } from '@/components/ui/DataTable'
import {
  createTxn,
  fetchAvailableStock,
  fetchTxn,
  numOrUndef,
  todayIso,
  useTxnList,
  type DocumentRequest,
  type TxnDocument,
} from '@/api/transactions'
import {
  itemsForLocation,
  mapEmployee,
  mapItem,
  mapLocation,
  mapUnit,
  useMasterList,
  type ApiMasterRow,
} from '@/api/masters'
import type {
  MaterialReturn,
  MaterialTransfer,
} from '@/types/transactions'
import { SimpleMasterModule, type FieldDef } from '@/features/masters/SimpleMasterModule'
import { itemOptionLabel, useLocationStock } from './lineGrid'

function opt(rows: ApiMasterRow[], label = (r: ApiMasterRow) => `${r.code} – ${r.name}`) {
  return rows.map((r) => ({ value: r.id, label: label(r) }))
}

function ListStatus({ loading, error, label }: { loading: boolean; error: string | null; label: string }) {
  return (
    <>
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading {label}…</div>}
    </>
  )
}

function TxnRoutes({
  base,
  title,
  description,
  rows,
  columns,
  fields,
  searchPlaceholder,
  saveLabel,
  draftLabel,
  formTitle,
  getDefaults,
  addLabel = 'Add New',
  onSave,
  onFieldChange,
  menuCode,
  listLoading = false,
  loadRecord,
  readOnlyFields,
  viewOnlyExisting = false,
}: {
  base: string
  title: string
  description: string
  rows: { id: string }[]
  columns: Column<{ id: string }>[]
  fields: FieldDef[]
  searchPlaceholder?: string
  saveLabel?: string
  draftLabel?: string
  formTitle?: string
  getDefaults?: () => Record<string, unknown>
  addLabel?: string
  onSave?: (
    id: string,
    values: Record<string, unknown>,
    action?: 'SAVE_DRAFT' | 'SUBMIT',
  ) => Promise<void>
  onFieldChange?: (
    name: string,
    value: unknown,
    values: Record<string, unknown>,
  ) => Partial<Record<string, unknown>> | void | Promise<Partial<Record<string, unknown>> | void>
  menuCode?: string
  listLoading?: boolean
  loadRecord?: (id: string) => Promise<Record<string, unknown> | null>
  readOnlyFields?: string[]
  viewOnlyExisting?: boolean
}) {
  const shared = {
    title,
    description,
    basePath: base,
    rows: rows as never,
    columns: columns as never,
    fields,
    searchPlaceholder,
    saveLabel,
    draftLabel,
    formTitle,
    getDefaults,
    addLabel,
    onSave,
    onFieldChange,
    menuCode,
    listLoading,
    loadRecord,
    readOnlyFields,
    viewOnlyExisting,
  }
  return (
    <Routes>
      <Route index element={<SimpleMasterModule {...shared} />} />
      <Route path=":id" element={<SimpleMasterModule {...shared} />} />
    </Routes>
  )
}

function useTxnLookups() {
  const mapLoc = useCallback(mapLocation, [])
  const mapEmp = useCallback(mapEmployee, [])
  const mapItm = useCallback(mapItem, [])
  const mapUnt = useCallback(mapUnit, [])
  const locations = useMasterList('locations', mapLoc)
  const employees = useMasterList('employees', mapEmp)
  const items = useMasterList('items', mapItm)
  const units = useMasterList('units', mapUnt)
  return { locations, employees, items, units }
}

function locLabel(locations: ApiMasterRow[], id: string) {
  const loc = locations.find((l) => l.id === id)
  return loc ? `${loc.code}` : id || '—'
}

function empLabel(employees: ApiMasterRow[], id: string) {
  const e = employees.find((x) => x.id === id)
  return e ? `${e.code} – ${e.firstName} ${e.lastName}` : id || '—'
}

/** When Item changes, patch UOM (and clear stale stock) from the item master. */
function itemFieldPatch(items: ApiMasterRow[]) {
  return (name: string, value: unknown): Partial<Record<string, unknown>> | void => {
    if (name !== 'item') return
    const item = items.find((i) => i.id === String(value ?? ''))
    if (!item) return { uom: '', availableStock: '' }
    return {
      uom: String(item.uom ?? ''),
      availableStock: '',
      itemCode: String(item.code ?? ''),
      itemName: String(item.name ?? ''),
      itemType: String(item.itemType ?? ''),
    }
  }
}

function lineFromForm(
  values: Record<string, unknown>,
  items: ApiMasterRow[],
): DocumentRequest['lines'] {
  const itemId = numOrUndef(values.item)
  if (itemId == null) {
    throw new Error('Item is required for transaction lines')
  }
  const item = items.find((i) => i.id === String(itemId))
  const qty = numOrUndef(values.qty) ?? 1
  const rate = numOrUndef(values.rate) ?? 0
  const uomId = numOrUndef(values.uom) ?? numOrUndef(item?.uom)
  const mfgDate = String(values.mfgDate ?? '').trim() || undefined
  const expiryDate = String(values.expiryDate ?? '').trim() || undefined
  const availableStock = numOrUndef(values.availableStock)
  return [
    {
      srNo: 1,
      itemId,
      uomId,
      qty,
      orderedQty: qty,
      receivedQty: qty,
      acceptedQty: qty,
      requestedQty: qty,
      availableStock: availableStock ?? undefined,
      rate,
      mrp: numOrUndef(values.mrp),
      amount: qty * rate,
      batchLotNo: String(values.batch ?? '') || undefined,
      mfgDate,
      expiryDate,
      locationId:
        numOrUndef(values.store) ?? numOrUndef(values.fromStore) ?? numOrUndef(values.toStore),
      locationBin: String(values.bin ?? '') || undefined,
      serialNo: String(values.serialNo ?? '') || undefined,
      ipAddress: String(values.ipAddress ?? '') || undefined,
      macAddress: String(values.macAddress ?? '') || undefined,
      hostname: String(values.hostname ?? '') || undefined,
      itemCondition: String(values.itemCondition ?? '') || undefined,
      remark: String(values.remarks ?? '') || undefined,
    },
  ]
}

function mapDocToFlatForm(doc: TxnDocument, extras: Record<string, unknown> = {}) {
  const line = doc.lines?.[0]
  return {
    date: doc.docDate ?? todayIso(),
    remarks: doc.remarks ?? '',
    item: line?.itemId != null ? String(line.itemId) : '',
    itemCode: line?.itemCode ?? '',
    itemName: line?.itemName ?? '',
    itemType: line?.itemType ?? '',
    uom: line?.uomId != null ? String(line.uomId) : '',
    qty: line?.qty != null ? String(line.qty) : line?.requestedQty != null ? String(line.requestedQty) : '1',
    batch: line?.batchLotNo ?? '',
    availableStock: line?.availableStock != null ? String(line.availableStock) : '',
    serialNo: line?.serialNo ?? '',
    ipAddress: line?.ipAddress ?? '',
    macAddress: line?.macAddress ?? '',
    hostname: line?.hostname ?? '',
    itemCondition: line?.itemCondition ?? '',
    ...extras,
  }
}

export function TransfersPages() {
  const { rows, loading, error, reload } = useTxnList('transfers')
  const { locations, items, units } = useTxnLookups()
  const patchItem = itemFieldPatch(items.rows)
  const [stockLoc, setStockLoc] = useState('')
  const { stockByItemId } = useLocationStock(stockLoc)

  const columns: Column<MaterialTransfer>[] = [
    { key: 'no', header: 'Transfer No.', searchText: (r) => r.transferNo, render: (r) => <b className="font-mono">{r.transferNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    {
      key: 'from',
      header: 'From Store',
      searchText: (r) => locLabel(locations.rows, String((r as { fromLocationId?: string }).fromLocationId ?? '')),
      render: (r) => locLabel(locations.rows, String((r as { fromLocationId?: string }).fromLocationId ?? '')),
    },
    {
      key: 'to',
      header: 'To Store',
      searchText: (r) => locLabel(locations.rows, String((r as { toLocationId?: string }).toLocationId ?? '')),
      render: (r) => locLabel(locations.rows, String((r as { toLocationId?: string }).toLocationId ?? '')),
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
  ]
  const fields: FieldDef[] = [
    { name: 'date', label: 'Transfer Date', required: true },
    { name: 'fromStore', label: 'From Store', type: 'select', required: true, options: opt(locations.rows) },
    { name: 'toStore', label: 'To Store', type: 'select', required: true, options: opt(locations.rows) },
    {
      name: 'item',
      label: 'Item',
      type: 'select',
      required: true,
      span: 2,
      lockedUntilHeader: true,
      options: (values) =>
        itemsForLocation(items.rows, String(values.fromStore ?? '')).map((i) => ({
          value: i.id,
          label: itemOptionLabel(i, String(values.fromStore ?? '') === stockLoc ? stockByItemId : undefined),
        })),
      placeholder: '— Select From Store first —',
      hint: 'Only items assigned to the From Store — stock shown for that store',
    },
    { name: 'itemName', label: 'Item Name', hint: 'Filled from item master', lockedUntilHeader: true },
    { name: 'qty', label: 'Transfer Qty', type: 'number', required: true, lockedUntilHeader: true },
    {
      name: 'uom',
      label: 'Unit',
      type: 'select',
      required: true,
      options: opt(units.rows, (u) => String(u.code)),
      lockedUntilHeader: true,
    },
    { name: 'availableStock', label: 'Available at From Store', lockedUntilHeader: true },
    { name: 'batch', label: 'Batch / Lot (optional)', hint: 'Leave blank to move FIFO', lockedUntilHeader: true },
    { name: 'remarks', label: 'Remarks', span: 3 },
  ]

  return (
    <>
      <ListStatus loading={loading} error={error} label="transfers" />
      <TxnRoutes
        listLoading={loading}
        base="/transactions/transfers"
        menuCode="TRF"
        title="Material Transfer"
        description="Move stock from one store to another within the organization — independent of the requisition flow."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        searchPlaceholder="Search transfers…"
        saveLabel="Submit Transfer"
        draftLabel="Save Draft"
        formTitle="Transfer Details"
        addLabel="New Transfer"
        viewOnlyExisting
        getDefaults={() => ({ date: todayIso(), qty: 1 })}
        readOnlyFields={['itemName', 'availableStock']}
        onFieldChange={async (name, value, values) => {
          const next = { ...values, [name]: value }
          let base = patchItem(name, value) ?? {}
          if (name === 'fromStore') {
            setStockLoc(String(value ?? ''))
            const allowed = itemsForLocation(items.rows, String(value ?? ''))
            if (next.item && !allowed.some((i) => i.id === String(next.item))) {
              base = { ...base, item: '', itemName: '', uom: '', availableStock: '' }
            }
          }
          if ((name === 'item' || name === 'fromStore') && next.item && next.fromStore) {
            try {
              const qty = await fetchAvailableStock(Number(next.item), Number(next.fromStore))
              return { ...base, availableStock: String(qty) }
            } catch {
              return { ...base, availableStock: '0' }
            }
          }
          return base
        }}
        loadRecord={async (id) => {
          const doc = await fetchTxn('transfers', id)
          const fromStore = doc.fromLocationId != null ? String(doc.fromLocationId) : ''
          setStockLoc(fromStore)
          return mapDocToFlatForm(doc, {
            fromStore,
            toStore: doc.toLocationId != null ? String(doc.toLocationId) : '',
            store: fromStore,
          })
        }}
        onSave={async (id, values, action = 'SUBMIT') => {
          const body: DocumentRequest = {
            docDate: String(values.date || todayIso()),
            fromLocationId: numOrUndef(values.fromStore),
            toLocationId: numOrUndef(values.toStore),
            locationId: numOrUndef(values.fromStore),
            remarks: String(values.remarks ?? ''),
            docSubmitAction: action,
            lines: lineFromForm({ ...values, store: values.fromStore }, items.rows),
          }
          if (id === 'new') await createTxn('transfers', body)
          else throw new Error('Transfer update is not supported by API')
          await reload()
        }}
      />
    </>
  )
}

export function ReturnsPages() {
  const { rows, loading, error, reload } = useTxnList('returns')
  const { locations, employees, items, units } = useTxnLookups()
  const patchItem = itemFieldPatch(items.rows)
  const [stockLoc, setStockLoc] = useState('')
  const { stockByItemId } = useLocationStock(stockLoc)

  const columns: Column<MaterialReturn>[] = [
    { key: 'no', header: 'Return No.', searchText: (r) => r.returnNo, render: (r) => <b className="font-mono">{r.returnNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    {
      key: 'by',
      header: 'Returned By',
      searchText: (r) => empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? '')),
      render: (r) => empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? '')),
    },
    {
      key: 'store',
      header: 'Store',
      searchText: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
      render: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
  ]
  const fields: FieldDef[] = [
    { name: 'date', label: 'Return Date', required: true },
    { name: 'returnedBy', label: 'Returned By', type: 'select', required: true, span: 2, options: opt(employees.rows, (e) => `${e.code} – ${e.firstName} ${e.lastName}`) },
    { name: 'store', label: 'Return to Store', type: 'select', required: true, options: opt(locations.rows) },
    {
      name: 'item',
      label: 'Item',
      type: 'select',
      required: true,
      span: 2,
      lockedUntilHeader: true,
      options: (values) =>
        itemsForLocation(items.rows, String(values.store ?? '')).map((i) => ({
          value: i.id,
          label: itemOptionLabel(i, String(values.store ?? '') === stockLoc ? stockByItemId : undefined),
        })),
      placeholder: '— Select Store first —',
      hint: 'Only items assigned to this store — stock shown for that store',
    },
    { name: 'itemName', label: 'Item Name', hint: 'Filled from item master', lockedUntilHeader: true },
    { name: 'qty', label: 'Return Qty', type: 'number', required: true, lockedUntilHeader: true },
    {
      name: 'uom',
      label: 'Unit',
      type: 'select',
      required: true,
      options: opt(units.rows, (u) => String(u.code)),
      lockedUntilHeader: true,
    },
    { name: 'batch', label: 'Batch / Lot (optional)', lockedUntilHeader: true },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]

  return (
    <>
      <ListStatus loading={loading} error={error} label="returns" />
      <TxnRoutes
        listLoading={loading}
        base="/transactions/returns"
        menuCode="RTN"
        title="Material Return"
        description="Return unused or excess material back into a store — from an employee, department, or another store."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        searchPlaceholder="Search returns…"
        saveLabel="Submit Return"
        draftLabel="Save Draft"
        formTitle="Return Details"
        addLabel="New Return"
        viewOnlyExisting
        getDefaults={() => ({ date: todayIso(), qty: 1 })}
        readOnlyFields={['itemName']}
        onFieldChange={(name, value, values) => {
          const base = patchItem(name, value) ?? {}
          if (name === 'store') {
            setStockLoc(String(value ?? ''))
            const allowed = itemsForLocation(items.rows, String(value ?? ''))
            if (values.item && !allowed.some((i) => i.id === String(values.item))) {
              return { ...base, item: '', itemName: '', uom: '' }
            }
          }
          return base
        }}
        loadRecord={async (id) => {
          const doc = await fetchTxn('returns', id)
          const store = doc.locationId != null ? String(doc.locationId) : ''
          setStockLoc(store)
          return mapDocToFlatForm(doc, {
            store,
            returnedBy: doc.initiatedByEmpId != null ? String(doc.initiatedByEmpId) : '',
          })
        }}
        onSave={async (id, values, action = 'SUBMIT') => {
          const body: DocumentRequest = {
            docDate: String(values.date || todayIso()),
            locationId: numOrUndef(values.store),
            initiatedByEmpId: numOrUndef(values.returnedBy),
            remarks: String(values.remarks ?? ''),
            docSubmitAction: action,
            lines: lineFromForm(values, items.rows),
          }
          if (id === 'new') await createTxn('returns', body)
          else throw new Error('Return update is not supported by API')
          await reload()
        }}
      />
    </>
  )
}
