import { Route, Routes } from 'react-router-dom'
import { Pill } from '@/components/ui/Badge'
import { statusColumn, type Column } from '@/components/ui/DataTable'
import {
  grns,
  openingStocks,
  organizations,
  requisitions,
  returns,
  storeIssues,
  stores,
  transfers,
  vendors,
  employees,
  items,
  units,
} from '@/data/mock'
import type {
  Grn,
  MaterialReturn,
  MaterialTransfer,
  OpeningStock,
  StoreIssue,
  StoreRequisition,
} from '@/types/transactions'
import { SimpleMasterModule, type FieldDef } from '@/features/masters/SimpleMasterModule'

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
  }
  return (
    <Routes>
      <Route index element={<SimpleMasterModule {...shared} />} />
      <Route path=":id" element={<SimpleMasterModule {...shared} />} />
    </Routes>
  )
}

export function OpeningStockPages() {
  const columns: Column<OpeningStock>[] = [
    { key: 'no', header: 'Entry No.', searchText: (r) => r.entryNo, render: (r) => <b className="font-mono">{r.entryNo}</b> },
    { key: 'item', header: 'Item', searchText: (r) => r.item, render: (r) => r.item },
    { key: 'store', header: 'Store', searchText: (r) => r.store, render: (r) => r.store },
    { key: 'batch', header: 'Batch', searchText: (r) => r.batch, render: (r) => r.batch || '—' },
    { key: 'qty', header: 'Opening Qty', searchText: (r) => String(r.qty), render: (r) => `${r.qty} ${r.uom}` },
    { key: 'rate', header: 'Rate (₹)', searchText: (r) => String(r.rate), render: (r) => r.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
    { key: 'date', header: 'Opening Date', searchText: (r) => r.openingDate, render: (r) => r.openingDate },
  ]
  const fields: FieldDef[] = [
    { name: 'entryNo', label: 'Entry No.', required: true, uppercase: true, hint: 'OPN-2026-002' },
    { name: 'openingDate', label: 'Opening Date', required: true },
    { name: 'org', label: 'Entity (Organization)', type: 'select', required: true, options: organizations.map((o) => ({ value: o.code, label: `${o.code} – ${o.name}` })) },
    { name: 'store', label: 'Store', type: 'select', required: true, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'bin', label: 'Location / Bin', uppercase: true, hint: 'Rack A-12-B3' },
    { name: 'item', label: 'Item', type: 'select', required: true, span: 2, options: items.map((i) => ({ value: i.code, label: `${i.code} – ${i.name}` })) },
    { name: 'batch', label: 'Batch / Lot No.', uppercase: true },
    { name: 'qty', label: 'Opening Quantity', type: 'number', required: true },
    { name: 'uom', label: 'Unit', type: 'select', options: units.map((u) => ({ value: u.code, label: u.code })) },
    { name: 'rate', label: 'Rate (₹)', type: 'number' },
    { name: 'mrp', label: 'MRP (₹)', type: 'number' },
    { name: 'remarks', label: 'Remarks', span: 4 },
  ]
  return (
    <TxnRoutes
      base="/transactions/opening-stock"
      title="Opening Stock"
      description="First inventory transaction — establishes the starting stock position for an item at a store before any other movement."
      rows={openingStocks}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search opening stock entries…"
      saveLabel="Save Opening Stock"
      formTitle="Opening Stock Details"
      addLabel="Add Opening Stock"
    />
  )
}

export function RequisitionsPages() {
  const columns: Column<StoreRequisition>[] = [
    { key: 'no', header: 'Requisition No.', searchText: (r) => r.reqNo, render: (r) => <b className="font-mono">{r.reqNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    { key: 'by', header: 'Requested By', searchText: (r) => r.requestedBy, render: (r) => r.requestedBy },
    { key: 'dept', header: 'Department', searchText: (r) => r.department, render: (r) => r.department },
    { key: 'deliver', header: 'Deliver To', searchText: (r) => r.deliverTo, render: (r) => r.deliverTo },
    { key: 'desig', header: 'Designation', searchText: (r) => r.designation, render: (r) => <Pill>{r.designation}</Pill> },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'reqType', label: 'Requisition Type', type: 'select', required: true, options: [{ value: 'department', label: 'Department' }, { value: 'employee', label: 'Employee' }] },
    { name: 'reqNo', label: 'Requisition No.', hint: 'Auto-generated' },
    { name: 'date', label: 'Requisition Date', required: true },
    { name: 'requiredDate', label: 'Required Date', required: true },
    { name: 'department', label: 'Department', type: 'select', options: ['Stores', 'IT', 'Operations', 'Finance'].map((v) => ({ value: v, label: v })) },
    { name: 'requestedBy', label: 'Requested By', type: 'select', required: true, options: employees.map((e) => ({ value: e.code, label: `${e.code} – ${e.firstName} ${e.lastName}` })) },
    { name: 'deliverTo', label: 'Deliver to Location', type: 'select', required: true, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]
  return (
    <TxnRoutes
      base="/transactions/requisitions"
      title="Store Requisitions"
      description="Requests raised by employees / departments for material to be issued from stock, approved directly by the store on submission."
      rows={requisitions}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search requisitions…"
      saveLabel="Save Requisition"
      formTitle="Requisition Details"
      addLabel="New Requisition"
      getDefaults={() => ({ reqType: 'department', status: 'Draft' })}
    />
  )
}

export function GrnPages() {
  const columns: Column<Grn>[] = [
    { key: 'no', header: 'GRN No.', searchText: (r) => r.grnNo, render: (r) => <b className="font-mono">{r.grnNo}</b> },
    { key: 'date', header: 'GRN Date', searchText: (r) => r.grnDate, render: (r) => r.grnDate },
    { key: 'supplier', header: 'Supplier', searchText: (r) => r.supplier, render: (r) => r.supplier },
    { key: 'store', header: 'Store / Location', searchText: (r) => r.store, render: (r) => r.store },
    { key: 'items', header: 'Total Items', searchText: (r) => String(r.totalItems), render: (r) => r.totalItems },
    { key: 'amt', header: 'Total Amount (₹)', searchText: (r) => String(r.totalAmount), render: (r) => r.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'grnNo', label: 'GRN No.', required: true, uppercase: true },
    { name: 'grnDate', label: 'GRN Date', required: true },
    { name: 'supplier', label: 'Supplier', type: 'select', required: true, span: 2, options: vendors.map((v) => ({ value: v.code, label: `${v.code} – ${v.name}` })) },
    { name: 'invoiceNo', label: 'Invoice No.', uppercase: true },
    { name: 'invoiceDate', label: 'Invoice Date' },
    { name: 'refDoc', label: 'Reference Document', uppercase: true },
    { name: 'refDocDate', label: 'Reference Document Date' },
    { name: 'store', label: 'Store / Location', type: 'select', required: true, span: 2, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'inspectedBy', label: 'Inspected By', type: 'select', options: employees.map((e) => ({ value: e.code, label: `${e.code} – ${e.firstName} ${e.lastName}` })) },
    { name: 'inspectionDate', label: 'Inspection Date' },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]
  return (
    <TxnRoutes
      base="/transactions/grn"
      title="Goods Receipt Note"
      description="Goods receipt entries recording material received from suppliers against a purchase order — no approval workflow involved."
      rows={grns}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search GRNs…"
      saveLabel="Save GRN"
      formTitle="Header"
      addLabel="New GRN"
    />
  )
}

export function IssuesPages() {
  const columns: Column<StoreIssue>[] = [
    { key: 'no', header: 'Issue No.', searchText: (r) => r.issueNo, render: (r) => <b className="font-mono">{r.issueNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    { key: 'req', header: 'Requisition', searchText: (r) => r.requisitionNo, render: (r) => r.requisitionNo },
    { key: 'store', header: 'Store', searchText: (r) => r.store, render: (r) => r.store },
    { key: 'to', header: 'Issued To', searchText: (r) => r.issuedTo, render: (r) => r.issuedTo },
    { key: 'items', header: 'Items', searchText: (r) => String(r.totalItems), render: (r) => r.totalItems },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'issueNo', label: 'Issue No.', required: true, uppercase: true },
    { name: 'date', label: 'Issue Date', required: true },
    { name: 'requisitionNo', label: 'Against Requisition', type: 'select', options: requisitions.map((r) => ({ value: r.reqNo, label: r.reqNo })) },
    { name: 'store', label: 'Store', type: 'select', required: true, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'issuedTo', label: 'Issued To', type: 'select', required: true, span: 2, options: employees.map((e) => ({ value: e.code, label: `${e.code} – ${e.firstName} ${e.lastName}` })) },
    { name: 'department', label: 'Department', type: 'select', options: ['Stores', 'IT', 'Operations', 'Finance'].map((v) => ({ value: v, label: v })) },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]
  return (
    <TxnRoutes
      base="/transactions/issues"
      title="Store Issue"
      description="Issue material from a store against a requisition."
      rows={storeIssues}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search issues…"
      saveLabel="Save Issue"
      formTitle="Issue Details"
      addLabel="New Issue"
    />
  )
}

export function TransfersPages() {
  const columns: Column<MaterialTransfer>[] = [
    { key: 'no', header: 'Transfer No.', searchText: (r) => r.transferNo, render: (r) => <b className="font-mono">{r.transferNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    { key: 'from', header: 'From Store', searchText: (r) => r.fromStore, render: (r) => r.fromStore },
    { key: 'to', header: 'To Store', searchText: (r) => r.toStore, render: (r) => r.toStore },
    { key: 'items', header: 'Items', searchText: (r) => String(r.totalItems), render: (r) => r.totalItems },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'transferNo', label: 'Transfer No.', required: true, uppercase: true },
    { name: 'date', label: 'Transfer Date', required: true },
    { name: 'fromStore', label: 'From Store', type: 'select', required: true, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'toStore', label: 'To Store', type: 'select', required: true, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'remarks', label: 'Remarks', span: 4 },
  ]
  return (
    <TxnRoutes
      base="/transactions/transfers"
      title="Material Transfer"
      description="Move stock from one store to another within the organization — independent of the requisition flow."
      rows={transfers}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search transfers…"
      saveLabel="Save Transfer"
      formTitle="Transfer Details"
      addLabel="New Transfer"
    />
  )
}

export function ReturnsPages() {
  const columns: Column<MaterialReturn>[] = [
    { key: 'no', header: 'Return No.', searchText: (r) => r.returnNo, render: (r) => <b className="font-mono">{r.returnNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    { key: 'by', header: 'Returned By', searchText: (r) => r.returnedBy, render: (r) => r.returnedBy },
    { key: 'store', header: 'Store', searchText: (r) => r.store, render: (r) => r.store },
    { key: 'items', header: 'Items', searchText: (r) => String(r.totalItems), render: (r) => r.totalItems },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <Pill>{r.status}</Pill> },
  ]
  const fields: FieldDef[] = [
    { name: 'returnNo', label: 'Return No.', required: true, uppercase: true },
    { name: 'date', label: 'Return Date', required: true },
    { name: 'returnedBy', label: 'Returned By', type: 'select', required: true, span: 2, options: employees.map((e) => ({ value: e.code, label: `${e.code} – ${e.firstName} ${e.lastName}` })) },
    { name: 'store', label: 'Return to Store', type: 'select', required: true, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'remarks', label: 'Remarks', span: 2 },
  ]
  return (
    <TxnRoutes
      base="/transactions/returns"
      title="Material Return"
      description="Return unused or excess material back into a store — from an employee, department, or another store."
      rows={returns}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search returns…"
      saveLabel="Save Return"
      formTitle="Return Details"
      addLabel="New Return"
    />
  )
}
