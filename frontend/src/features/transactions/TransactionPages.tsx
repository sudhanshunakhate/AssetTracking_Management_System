import { useCallback, useState, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { StatusPill } from '@/components/ui/Badge'
import { type Column } from '@/components/ui/DataTable'
import {
  createTxn,
  fetchAllottedItems,
  fetchTxn,
  numOrUndef,
  todayIso,
  useTxnList,
  type DocumentRequest,
  type TxnDocument,
  type AllottedUnit,
} from '@/api/transactions'
import {
  mapEmployee,
  mapItem,
  mapLocation,
  mapUnit,
  useMasterList,
  type ApiMasterRow,
} from '@/api/masters'
import type { MaterialReturn } from '@/types/transactions'
import { SimpleMasterModule, type FieldDef } from '@/features/masters/SimpleMasterModule'
import { AttachmentLink, AttachmentSection, attachmentPayload } from './AttachmentSection'
import { itemOptionLabel, useLocationStock } from './lineGrid'
import { operationalLocations } from './txnLookups'

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
  renderExtraForm,
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
  renderExtraForm?: (
    values: Record<string, unknown>,
    set: (k: string, v: unknown) => void,
    recordId: string,
  ) => ReactNode
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
    renderExtraForm,
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
    attachmentUrl: doc.attachmentUrl ?? '',
    attachmentName: doc.attachmentName ?? '',
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

export function ReturnsPages() {
  const { rows, loading, error, reload } = useTxnList('returns')
  const { locations, employees, items, units } = useTxnLookups()
  const patchItem = itemFieldPatch(items.rows)
  const [stockLoc, setStockLoc] = useState('')
  const { stockByItemId } = useLocationStock(stockLoc)
  const [allottedByEmp, setAllottedByEmp] = useState<Record<string, string[]>>({})
  const [allottedUnitsByEmp, setAllottedUnitsByEmp] = useState<Record<string, AllottedUnit[]>>({})

  const clearItemFields = (): Record<string, unknown> => {
    setStockLoc('')
    return { item: '', itemName: '', itemCode: '', itemType: '', uom: '', store: '', availableStock: '' }
  }

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
    {
      key: 'attachment',
      header: 'Attachment',
      searchText: (r) => String((r as { attachmentName?: string; attachmentUrl?: string }).attachmentName ?? (r as { attachmentUrl?: string }).attachmentUrl ?? ''),
      render: (r) => (
        <AttachmentLink
          url={String((r as { attachmentUrl?: string }).attachmentUrl ?? '')}
          name={String((r as { attachmentName?: string }).attachmentName ?? '')}
        />
      ),
    },
  ]
  const fields: FieldDef[] = [
    { name: 'date', label: 'Return Date', required: true },
    { name: 'returnedBy', label: 'Returned By', type: 'select', required: true, span: 2, options: opt(employees.rows, (e) => `${e.code} – ${e.firstName} ${e.lastName}`) },
    {
      name: 'item',
      label: 'Item',
      type: 'select',
      required: true,
      span: 2,
      lockedUntilHeader: true,
      options: (values) => {
        const empId = String(values.returnedBy ?? '')
        const current = String(values.item ?? '')
        if (!empId) return []
        const loaded = allottedByEmp[empId]
        const allowed = new Set(loaded ?? [])
        if (current) allowed.add(current)
        if (!loaded && !current) return []
        return items.rows
          .filter((i) => allowed.has(i.id))
          .map((i) => ({
            value: i.id,
            label: itemOptionLabel(i, stockByItemId),
          }))
      },
      placeholder: '— Select allotted item —',
      hint: 'Pick Returned By first. Only items currently allotted to that employee appear here.',
    },
    { name: 'itemName', label: 'Item Name', hint: 'Filled from item master' },
    {
      name: 'store',
      label: 'Return to Store',
      type: 'select',
      required: true,
      lockedUntilHeader: true,
      options: opt(operationalLocations(locations.rows)),
      placeholder: '— Select Item first —',
      hint: 'Auto-filled from Item Master — change only if returning to a different store',
    },
    { name: 'qty', label: 'Return Qty', type: 'number', required: true, lockedUntilHeader: true },
    {
      name: 'uom',
      label: 'Unit',
      type: 'select',
      required: true,
      options: opt(units.rows, (u) => String(u.code)),
      lockedUntilHeader: true,
    },
    {
      name: 'serialNo',
      label: 'Serial No.',
      lockedUntilHeader: true,
      hint: 'Imported from units in this employee’s custody when you pick Returned By / Item. Required for assets.',
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
        getDefaults={() => ({ date: todayIso(), qty: 1, attachmentUrl: '', attachmentName: '' })}
        readOnlyFields={['itemName']}
        renderExtraForm={(values, set, recordId) => (
          <AttachmentSection
            url={String(values.attachmentUrl ?? '')}
            name={String(values.attachmentName ?? '')}
            readOnly={recordId !== 'new'}
            onChange={({ url, name }) => {
              set('attachmentUrl', url)
              set('attachmentName', name)
            }}
          />
        )}
        onFieldChange={async (name, value, values) => {
          if (name === 'returnedBy') {
            const empId = String(value ?? '')
            const currentItem = String(values.item ?? '')
            if (!empId) return { ...clearItemFields(), serialNo: '', ipAddress: '', macAddress: '', hostname: '' }
            let ids = allottedByEmp[empId]
            let units = allottedUnitsByEmp[empId]
            if (ids === undefined || units === undefined) {
              try {
                const allotted = await fetchAllottedItems(empId)
                ids = allotted.itemIds
                units = allotted.units
              } catch {
                ids = []
                units = []
              }
              setAllottedByEmp((prev) => ({ ...prev, [empId]: ids }))
              setAllottedUnitsByEmp((prev) => ({ ...prev, [empId]: units ?? [] }))
            }
            const patch: Record<string, unknown> = { serialNo: '', ipAddress: '', macAddress: '', hostname: '' }
            if (currentItem && !ids.includes(currentItem)) {
              Object.assign(patch, clearItemFields())
            }
            const empUnits = units ?? []
            if (empUnits.length === 1) {
              const u = empUnits[0]
              const itemId = String(u.itemId)
              const item = items.rows.find((i) => i.id === itemId)
              const homeStore = String(item?.store ?? '')
              const storeOk = operationalLocations(locations.rows).some((l) => l.id === homeStore)
              setStockLoc(storeOk ? homeStore : '')
              Object.assign(patch, {
                item: itemId,
                uom: String(item?.uom ?? ''),
                itemCode: String(item?.code ?? ''),
                itemName: String(item?.name ?? ''),
                itemType: String(item?.itemType ?? ''),
                store: storeOk ? homeStore : '',
                serialNo: u.serialNo ?? '',
                ipAddress: u.ipAddress ?? '',
                macAddress: u.macAddress ?? '',
                hostname: u.hostname ?? '',
                batch: u.batchLotNo ?? '',
              })
            }
            return patch
          }
          if (name === 'item') {
            const item = items.rows.find((i) => i.id === String(value ?? ''))
            if (!item) {
              setStockLoc('')
              return { uom: '', availableStock: '', itemCode: '', itemName: '', itemType: '', store: '', serialNo: '' }
            }
            const homeStore = String(item.store ?? '')
            const storeOk = operationalLocations(locations.rows).some((l) => l.id === homeStore)
            const store = storeOk ? homeStore : ''
            setStockLoc(store)
            const empId = String(values.returnedBy ?? '')
            const match = (allottedUnitsByEmp[empId] ?? []).filter((u) => String(u.itemId) === item.id)
            const serialPatch =
              match.length === 1
                ? {
                    serialNo: match[0].serialNo ?? '',
                    ipAddress: match[0].ipAddress ?? '',
                    macAddress: match[0].macAddress ?? '',
                    hostname: match[0].hostname ?? '',
                    batch: match[0].batchLotNo ?? values.batch,
                  }
                : { serialNo: '', ipAddress: '', macAddress: '', hostname: '' }
            return {
              uom: String(item.uom ?? ''),
              availableStock: '',
              itemCode: String(item.code ?? ''),
              itemName: String(item.name ?? ''),
              itemType: String(item.itemType ?? ''),
              store,
              ...serialPatch,
            }
          }
          if (name === 'store') {
            setStockLoc(String(value ?? ''))
            return patchItem(name, value) ?? {}
          }
          return patchItem(name, value) ?? {}
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
            ...attachmentPayload(String(values.attachmentUrl ?? ''), String(values.attachmentName ?? '')),
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
