import { useCallback, useMemo } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Pill } from '@/components/ui/Badge'
import { statusColumn, type Column } from '@/components/ui/DataTable'
import {
  createTxn,
  numOrUndef,
  todayIso,
  updateTxn,
  useTxnList,
  type DocumentRequest,
} from '@/api/transactions'
import {
  mapEmployee,
  mapEntity,
  mapItem,
  mapLocation,
  mapUnit,
  mapVendor,
  useMasterList,
  type ApiMasterRow,
} from '@/api/masters'
import type {
  Grn,
  MaterialReturn,
  MaterialTransfer,
  OpeningStock,
  StoreIssue,
  StoreRequisition,
} from '@/types/transactions'
import { SimpleMasterModule, type FieldDef } from '@/features/masters/SimpleMasterModule'

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
  formTitle,
  getDefaults,
  addLabel = 'Add New',
  onSave,
  menuCode,
  listLoading = false,
}: {
  base: string
  title: string
  description: string
  rows: { id: string }[]
  columns: Column<{ id: string }>[]
  fields: FieldDef[]
  searchPlaceholder?: string
  saveLabel?: string
  formTitle?: string
  getDefaults?: () => Record<string, unknown>
  addLabel?: string
  onSave?: (id: string, values: Record<string, unknown>) => Promise<void>
  menuCode?: string
  listLoading?: boolean
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
    formTitle,
    getDefaults,
    addLabel,
    onSave,
    menuCode,
    listLoading,
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
  const mapVend = useCallback(mapVendor, [])
  const mapItm = useCallback(mapItem, [])
  const mapUnt = useCallback(mapUnit, [])
  const mapEnt = useCallback(mapEntity, [])
  const locations = useMasterList('locations', mapLoc)
  const employees = useMasterList('employees', mapEmp)
  const vendors = useMasterList('vendors', mapVend)
  const items = useMasterList('items', mapItm)
  const units = useMasterList('units', mapUnt)
  const entities = useMasterList('entities', mapEnt)
  return { locations, employees, vendors, items, units, entities }
}

function locLabel(locations: ApiMasterRow[], id: string) {
  const loc = locations.find((l) => l.id === id)
  return loc ? `${loc.code}` : id || '—'
}

function empLabel(employees: ApiMasterRow[], id: string) {
  const e = employees.find((x) => x.id === id)
  return e ? `${e.code} – ${e.firstName} ${e.lastName}` : id || '—'
}

function vendorLabel(vendors: ApiMasterRow[], id: string) {
  const v = vendors.find((x) => x.id === id)
  return v ? `${v.code} – ${v.name}` : id || '—'
}

function lineFromForm(values: Record<string, unknown>): DocumentRequest['lines'] {
  const itemId = numOrUndef(values.item)
  if (itemId == null) {
    throw new Error('Item is required for transaction lines')
  }
  const qty = numOrUndef(values.qty) ?? 1
  const rate = numOrUndef(values.rate) ?? 0
  return [
    {
      srNo: 1,
      itemId,
      uomId: numOrUndef(values.uom),
      qty,
      orderedQty: qty,
      receivedQty: qty,
      acceptedQty: qty,
      requestedQty: qty,
      rate,
      mrp: numOrUndef(values.mrp),
      amount: qty * rate,
      batchLotNo: String(values.batch ?? '') || undefined,
      locationId: numOrUndef(values.store) ?? numOrUndef(values.toStore) ?? numOrUndef(values.deliverTo),
      locationBin: String(values.bin ?? '') || undefined,
      remark: String(values.remarks ?? '') || undefined,
    },
  ]
}

export function OpeningStockPages() {
  const { rows, loading, error, reload } = useTxnList('opening-stock')
  const { locations, items, units, entities } = useTxnLookups()
  const locById = useMemo(
    () => Object.fromEntries(locations.rows.map((l) => [l.id, l])),
    [locations.rows],
  )

  const columns: Column<OpeningStock & { locationId?: string; totalAmount?: number }>[] = [
    { key: 'no', header: 'Entry No.', searchText: (r) => r.entryNo, render: (r) => <b className="font-mono">{r.entryNo}</b> },
    { key: 'date', header: 'Opening Date', searchText: (r) => r.openingDate, render: (r) => r.openingDate },
    {
      key: 'store',
      header: 'Store',
      searchText: (r) => locById[String(r.locationId ?? r.store)]?.code ?? String(r.store ?? ''),
      render: (r) => locById[String(r.locationId ?? r.store)]?.code ?? r.store ?? '—',
    },
    {
      key: 'amt',
      header: 'Amount (₹)',
      searchText: (r) => String(r.totalAmount ?? r.rate ?? 0),
      render: (r) => Number(r.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'openingDate', label: 'Opening Date', required: true },
    { name: 'org', label: 'Entity (Organization)', type: 'select', required: true, options: opt(entities.rows) },
    { name: 'store', label: 'Store', type: 'select', required: true, options: opt(locations.rows) },
    { name: 'bin', label: 'Location / Bin', uppercase: true, hint: 'Rack A-12-B3' },
    { name: 'item', label: 'Item', type: 'select', required: true, span: 2, options: opt(items.rows) },
    { name: 'batch', label: 'Batch / Lot No.', uppercase: true },
    { name: 'qty', label: 'Opening Quantity', type: 'number', required: true },
    { name: 'uom', label: 'Unit', type: 'select', options: opt(units.rows, (u) => String(u.code)) },
    { name: 'rate', label: 'Rate (₹)', type: 'number' },
    { name: 'mrp', label: 'MRP (₹)', type: 'number' },
    { name: 'remarks', label: 'Remarks', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="opening stock" />
      <TxnRoutes
        listLoading={loading}
        base="/transactions/opening-stock"
        menuCode="OPN"
        title="Opening Stock"
        description="First inventory transaction — establishes the starting stock position for an item at a store before any other movement."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        searchPlaceholder="Search opening stock entries…"
        saveLabel="Save Opening Stock"
        formTitle="Opening Stock Details"
        addLabel="Add Opening Stock"
        getDefaults={() => ({ openingDate: todayIso(), qty: 1, status: true })}
        onSave={async (id, values) => {
          const qty = numOrUndef(values.qty) ?? 1
          const rate = numOrUndef(values.rate) ?? 0
          const body: DocumentRequest = {
            docDate: String(values.openingDate || todayIso()),
            postingDate: String(values.openingDate || todayIso()),
            entityId: numOrUndef(values.org),
            locationId: numOrUndef(values.store),
            remarks: String(values.remarks ?? ''),
            totalAmount: qty * rate,
            docSubmitAction: 'SAVE_DRAFT',
            lines: lineFromForm(values),
          }
          if (id === 'new') await createTxn('opening-stock', body)
          else await updateTxn('opening-stock', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function RequisitionsPages() {
  const { rows, loading, error, reload } = useTxnList('requisitions')
  const { locations, employees, items, units } = useTxnLookups()

  const columns: Column<StoreRequisition>[] = [
    { key: 'no', header: 'Requisition No.', searchText: (r) => r.reqNo, render: (r) => <b className="font-mono">{r.reqNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    {
      key: 'by',
      header: 'Requested By',
      searchText: (r) => empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? '')),
      render: (r) => empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? '')),
    },
    {
      key: 'deliver',
      header: 'Deliver To',
      searchText: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
      render: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'date', label: 'Requisition Date', required: true },
    { name: 'requiredDate', label: 'Required Date', required: true },
    { name: 'requestedBy', label: 'Requested By', type: 'select', required: true, options: opt(employees.rows, (e) => `${e.code} – ${e.firstName} ${e.lastName}`) },
    { name: 'deliverTo', label: 'Deliver to Location', type: 'select', required: true, options: opt(locations.rows) },
    { name: 'item', label: 'Item', type: 'select', required: true, span: 2, options: opt(items.rows) },
    { name: 'qty', label: 'Requested Qty', type: 'number', required: true },
    { name: 'uom', label: 'Unit', type: 'select', options: opt(units.rows, (u) => String(u.code)) },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="requisitions" />
      <TxnRoutes
        listLoading={loading}
        base="/transactions/requisitions"
        menuCode="SR"
        title="Store Requisitions"
        description="Requests raised by employees / departments for material to be issued from stock, approved directly by the store on submission."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        searchPlaceholder="Search requisitions…"
        saveLabel="Save Requisition"
        formTitle="Requisition Details"
        addLabel="New Requisition"
        getDefaults={() => ({ date: todayIso(), requiredDate: todayIso(), qty: 1 })}
        onSave={async (id, values) => {
          const body: DocumentRequest = {
            docDate: String(values.date || todayIso()),
            requiredByDate: String(values.requiredDate || todayIso()),
            locationId: numOrUndef(values.deliverTo),
            initiatedByEmpId: numOrUndef(values.requestedBy),
            remarks: String(values.remarks ?? ''),
            docSubmitAction: 'SAVE_DRAFT',
            lines: lineFromForm({ ...values, store: values.deliverTo }),
          }
          if (id === 'new') await createTxn('requisitions', body)
          else await updateTxn('requisitions', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function GrnPages() {
  const { rows, loading, error, reload } = useTxnList('grn')
  const { locations, vendors, employees, items, units } = useTxnLookups()

  const columns: Column<Grn>[] = [
    { key: 'no', header: 'GRN No.', searchText: (r) => r.grnNo, render: (r) => <b className="font-mono">{r.grnNo}</b> },
    { key: 'date', header: 'GRN Date', searchText: (r) => r.grnDate, render: (r) => r.grnDate },
    {
      key: 'supplier',
      header: 'Supplier',
      searchText: (r) => vendorLabel(vendors.rows, String((r as { partyId?: string }).partyId ?? '')),
      render: (r) => vendorLabel(vendors.rows, String((r as { partyId?: string }).partyId ?? '')),
    },
    {
      key: 'store',
      header: 'Store / Location',
      searchText: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
      render: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
    },
    {
      key: 'amt',
      header: 'Total Amount (₹)',
      searchText: (r) => String(r.totalAmount),
      render: (r) => Number(r.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'grnDate', label: 'GRN Date', required: true },
    { name: 'supplier', label: 'Supplier', type: 'select', required: true, span: 2, options: opt(vendors.rows) },
    { name: 'invoiceNo', label: 'Invoice No.', uppercase: true },
    { name: 'invoiceDate', label: 'Invoice Date' },
    { name: 'store', label: 'Store / Location', type: 'select', required: true, span: 2, options: opt(locations.rows) },
    { name: 'inspectedBy', label: 'Inspected By', type: 'select', options: opt(employees.rows, (e) => `${e.code} – ${e.firstName} ${e.lastName}`) },
    { name: 'inspectionDate', label: 'Inspection Date' },
    { name: 'item', label: 'Item', type: 'select', required: true, span: 2, options: opt(items.rows) },
    { name: 'qty', label: 'Received Qty', type: 'number', required: true },
    { name: 'uom', label: 'Unit', type: 'select', options: opt(units.rows, (u) => String(u.code)) },
    { name: 'rate', label: 'Rate (₹)', type: 'number' },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="GRNs" />
      <TxnRoutes
        listLoading={loading}
        base="/transactions/grn"
        menuCode="GRN"
        title="Goods Receipt Note"
        description="Goods receipt entries recording material received from suppliers against a purchase order — no approval workflow involved."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        searchPlaceholder="Search GRNs…"
        saveLabel="Save GRN"
        formTitle="Header"
        addLabel="New GRN"
        getDefaults={() => ({ grnDate: todayIso(), qty: 1 })}
        onSave={async (id, values) => {
          const qty = numOrUndef(values.qty) ?? 1
          const rate = numOrUndef(values.rate) ?? 0
          const body: DocumentRequest = {
            docDate: String(values.grnDate || todayIso()),
            locationId: numOrUndef(values.store),
            partyId: numOrUndef(values.supplier),
            invoiceNo: String(values.invoiceNo ?? '') || undefined,
            invoiceDate: String(values.invoiceDate ?? '') || undefined,
            inspectedByEmpId: numOrUndef(values.inspectedBy),
            inspectionDate: String(values.inspectionDate ?? '') || undefined,
            remarks: String(values.remarks ?? ''),
            totalAmount: qty * rate,
            docSubmitAction: 'SAVE_DRAFT',
            lines: lineFromForm(values),
          }
          if (id === 'new') await createTxn('grn', body)
          else await updateTxn('grn', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function IssuesPages() {
  const { rows, loading, error, reload } = useTxnList('material-issues')
  const { locations, employees, items, units } = useTxnLookups()
  const reqs = useTxnList('requisitions')

  const columns: Column<StoreIssue>[] = [
    { key: 'no', header: 'Issue No.', searchText: (r) => r.issueNo, render: (r) => <b className="font-mono">{r.issueNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    {
      key: 'req',
      header: 'Requisition',
      searchText: (r) => String((r as { refTxnHeaderId?: string }).refTxnHeaderId ?? r.requisitionNo ?? ''),
      render: (r) => {
        const ref = String((r as { refTxnHeaderId?: string }).refTxnHeaderId ?? '')
        const hit = reqs.rows.find((x) => x.id === ref)
        return hit?.docNo ?? (ref || '—')
      },
    },
    {
      key: 'store',
      header: 'Store',
      searchText: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
      render: (r) => locLabel(locations.rows, String((r as { locationId?: string }).locationId ?? '')),
    },
    {
      key: 'to',
      header: 'Issued To',
      searchText: (r) => empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? '')),
      render: (r) => empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? '')),
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'date', label: 'Issue Date', required: true },
    { name: 'requisitionNo', label: 'Against Requisition', type: 'select', options: reqs.rows.map((r) => ({ value: r.id, label: r.docNo })) },
    { name: 'store', label: 'Store', type: 'select', required: true, options: opt(locations.rows) },
    { name: 'issuedTo', label: 'Issued To', type: 'select', required: true, span: 2, options: opt(employees.rows, (e) => `${e.code} – ${e.firstName} ${e.lastName}`) },
    { name: 'item', label: 'Item', type: 'select', required: true, span: 2, options: opt(items.rows) },
    { name: 'qty', label: 'Issue Qty', type: 'number', required: true },
    { name: 'uom', label: 'Unit', type: 'select', options: opt(units.rows, (u) => String(u.code)) },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="issues" />
      <TxnRoutes
        listLoading={loading}
        base="/transactions/issues"
        menuCode="ISS"
        title="Store Issue"
        description="Issue material from a store against a requisition."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        searchPlaceholder="Search issues…"
        saveLabel="Save Issue"
        formTitle="Issue Details"
        addLabel="New Issue"
        getDefaults={() => ({ date: todayIso(), qty: 1 })}
        onSave={async (id, values) => {
          const body: DocumentRequest = {
            docDate: String(values.date || todayIso()),
            locationId: numOrUndef(values.store),
            initiatedByEmpId: numOrUndef(values.issuedTo),
            refTxnHeaderId: numOrUndef(values.requisitionNo),
            remarks: String(values.remarks ?? ''),
            docSubmitAction: 'SAVE_DRAFT',
            lines: lineFromForm(values),
          }
          if (id === 'new') await createTxn('material-issues', body)
          else throw new Error('Material issue update is not supported by API')
          await reload()
        }}
      />
    </>
  )
}

export function TransfersPages() {
  const { rows, loading, error, reload } = useTxnList('transfers')
  const { locations, items, units } = useTxnLookups()

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
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'date', label: 'Transfer Date', required: true },
    { name: 'fromStore', label: 'From Store', type: 'select', required: true, options: opt(locations.rows) },
    { name: 'toStore', label: 'To Store', type: 'select', required: true, options: opt(locations.rows) },
    { name: 'item', label: 'Item', type: 'select', required: true, span: 2, options: opt(items.rows) },
    { name: 'qty', label: 'Transfer Qty', type: 'number', required: true },
    { name: 'uom', label: 'Unit', type: 'select', options: opt(units.rows, (u) => String(u.code)) },
    { name: 'remarks', label: 'Remarks', span: 4 },
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
        saveLabel="Save Transfer"
        formTitle="Transfer Details"
        addLabel="New Transfer"
        getDefaults={() => ({ date: todayIso(), qty: 1 })}
        onSave={async (id, values) => {
          const body: DocumentRequest = {
            docDate: String(values.date || todayIso()),
            fromLocationId: numOrUndef(values.fromStore),
            toLocationId: numOrUndef(values.toStore),
            locationId: numOrUndef(values.fromStore),
            remarks: String(values.remarks ?? ''),
            docSubmitAction: 'SAVE_DRAFT',
            lines: lineFromForm(values),
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
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'date', label: 'Return Date', required: true },
    { name: 'returnedBy', label: 'Returned By', type: 'select', required: true, span: 2, options: opt(employees.rows, (e) => `${e.code} – ${e.firstName} ${e.lastName}`) },
    { name: 'store', label: 'Return to Store', type: 'select', required: true, options: opt(locations.rows) },
    { name: 'item', label: 'Item', type: 'select', required: true, span: 2, options: opt(items.rows) },
    { name: 'qty', label: 'Return Qty', type: 'number', required: true },
    { name: 'uom', label: 'Unit', type: 'select', options: opt(units.rows, (u) => String(u.code)) },
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
        saveLabel="Save Return"
        formTitle="Return Details"
        addLabel="New Return"
        getDefaults={() => ({ date: todayIso(), qty: 1 })}
        onSave={async (id, values) => {
          const body: DocumentRequest = {
            docDate: String(values.date || todayIso()),
            locationId: numOrUndef(values.store),
            initiatedByEmpId: numOrUndef(values.returnedBy),
            remarks: String(values.remarks ?? ''),
            docSubmitAction: 'SAVE_DRAFT',
            lines: lineFromForm(values),
          }
          if (id === 'new') await createTxn('returns', body)
          else throw new Error('Return update is not supported by API')
          await reload()
        }}
      />
    </>
  )
}
