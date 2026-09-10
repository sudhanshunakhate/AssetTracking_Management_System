import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Pill, StatusPill, toneForLabel } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
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
  mapDepartment,
  useMasterList,
  type ApiMasterRow,
  type LocationApi,
} from '@/api/masters'
import { http } from '@/api/client'
import type { MaterialReturn } from '@/types/transactions'
import { SimpleMasterModule, type FieldDef } from '@/features/masters/SimpleMasterModule'
import { AttachmentLink, AttachmentSection, attachmentPayload } from './AttachmentSection'
import { wholeQtyStr } from './lineGrid'
import { filterRowsByStatus, txnStatusFilterOptions } from '@/lib/listOrder'
import { ReturnAllottedPickerModal } from './ReturnAllottedPickerModal'

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
  filters,
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
  readOnlyFields?: string[] | ((values: Record<string, unknown>, recordId: string) => string[])
  viewOnlyExisting?: boolean
  renderExtraForm?: (
    values: Record<string, unknown>,
    set: (k: string, v: unknown) => void,
    recordId: string,
  ) => ReactNode
  filters?: {
    label: string
    value: string
    options: { value: string; label: string }[]
    onChange: (v: string) => void
  }[]
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
    filters,
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
  const mapDept = useCallback(mapDepartment, [])
  const locations = useMasterList('locations', mapLoc)
  const employees = useMasterList('employees', mapEmp)
  const items = useMasterList('items', mapItm)
  const units = useMasterList('units', mapUnt)
  const departments = useMasterList('departments', mapDept)
  return { locations, employees, items, units, departments }
}

function locLabel(locations: ApiMasterRow[], id: string) {
  const loc = locations.find((l) => String(l.id) === String(id))
  return loc ? `${loc.code}` : id || '—'
}

function empLabel(employees: ApiMasterRow[], id: string) {
  const e = employees.find((x) => x.id === id)
  return e ? `${e.code} – ${e.firstName} ${e.lastName}` : id || '—'
}

function deptLabel(departments: ApiMasterRow[], id: string) {
  const d = departments.find((x) => x.id === id)
  return d ? `${d.code} – ${d.name}` : id || '—'
}

function returnPartyKey(returnType: string, empId: string, deptId: string) {
  if (returnType === 'DEPARTMENT') return deptId ? `dept:${deptId}` : ''
  return empId ? `emp:${empId}` : ''
}

/** Keeps Return-to-Store / Unit text fields showing names after location masters load. */
function ReturnDisplayLabelSync({
  storeId,
  storeLabel,
  uomId,
  uomLabel,
  locations,
  units,
  set,
}: {
  storeId: string
  storeLabel: string
  uomId: string
  uomLabel: string
  locations: ApiMasterRow[]
  units: ApiMasterRow[]
  set: (k: string, v: unknown) => void
}) {
  useEffect(() => {
    const sid = String(storeId ?? '').trim()
    if (!sid) return

    const formatLoc = (code: string, name: string) => {
      const c = code.trim()
      const n = name.trim()
      if (c && n) return `${c} – ${n}`
      return c || n
    }

    const loc = locations.find((l) => String(l.id) === sid)
    if (loc) {
      const next = formatLoc(String(loc.code ?? ''), String(loc.name ?? ''))
      if (next && next !== storeLabel) set('store', next)
      return
    }

    // List may omit this location (scope / paging); resolve by id so we never leave a bare number.
    if (storeLabel && !/^\d+$/.test(storeLabel.trim())) return

    let cancelled = false
    void http
      .get<LocationApi>(`/locations/${sid}`)
      .then((row) => {
        if (cancelled) return
        const next = formatLoc(String(row.locationCode ?? ''), String(row.locationName ?? ''))
        if (next) set('store', next)
      })
      .catch(() => {
        /* keep current label */
      })
    return () => {
      cancelled = true
    }
  }, [storeId, storeLabel, locations, set])

  useEffect(() => {
    const uid = String(uomId ?? '').trim()
    if (!uid) return
    const u = units.find((x) => String(x.id) === uid)
    const next = u ? String(u.code ?? '').trim() : ''
    if (next && next !== uomLabel) set('uom', next)
  }, [uomId, uomLabel, units, set])

  return null
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
    qty:
      line?.qty != null
        ? wholeQtyStr(line.qty)
        : line?.requestedQty != null
          ? wholeQtyStr(line.requestedQty)
          : '1',
    batch: line?.batchLotNo ?? '',
    availableStock: wholeQtyStr(line?.availableStock),
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
  const { locations, employees, items, units, departments } = useTxnLookups()
  const patchItem = itemFieldPatch(items.rows)
  const [allottedByParty, setAllottedByParty] = useState<Record<string, string[]>>({})
  const [allottedUnitsByParty, setAllottedUnitsByParty] = useState<Record<string, AllottedUnit[]>>({})
  const [allottedQtyByParty, setAllottedQtyByParty] = useState<Record<string, Record<string, number>>>({})
  const [allottedLoading, setAllottedLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerPartyKey, setPickerPartyKey] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const statusOptions = useMemo(() => txnStatusFilterOptions(rows), [rows])
  const filteredRows = useMemo(() => filterRowsByStatus(rows, statusFilter), [rows, statusFilter])

  const clearItemFields = (): Record<string, unknown> => ({
    item: '',
    itemName: '',
    itemCode: '',
    itemType: '',
    uom: '',
    uomId: '',
    store: '',
    storeId: '',
    availableStock: '',
    qty: '1',
    serialNo: '',
    batch: '',
    ipAddress: '',
    macAddress: '',
    hostname: '',
  })

  /** Resolve location id → "CODE – Name" for read-only display (never show bare id). */
  const storeDisplay = (storeId: string | number | null | undefined) => {
    const sid = String(storeId ?? '').trim()
    if (!sid) return ''
    const loc = locations.rows.find((l) => String(l.id) === sid)
    if (!loc) return ''
    const code = String(loc.code ?? '').trim()
    const name = String(loc.name ?? '').trim()
    if (code && name) return `${code} – ${name}`
    return code || name || ''
  }

  const uomDisplay = (uomId: string | number | null | undefined) => {
    const uid = String(uomId ?? '').trim()
    if (!uid) return ''
    const u = units.rows.find((x) => String(x.id) === uid)
    return u ? String(u.code ?? '').trim() || uid : ''
  }

  const applyStoreFields = (storeIdRaw: string | number | null | undefined) => {
    const storeId = String(storeIdRaw ?? '').trim()
    return {
      storeId,
      store: storeDisplay(storeId),
    }
  }

  const applyUomFields = (uomIdRaw: string | number | null | undefined) => {
    const uomId = String(uomIdRaw ?? '').trim()
    return {
      uomId,
      uom: uomDisplay(uomId),
    }
  }

  const loadAllottedFor = async (returnType: string, empId: string, deptId: string) => {
    const key = returnPartyKey(returnType, empId, deptId)
    if (!key) {
      return { itemIds: [] as string[], units: [] as AllottedUnit[], qtyByItemId: {} as Record<string, number> }
    }
    setAllottedLoading(true)
    try {
      const allotted =
        returnType === 'DEPARTMENT'
          ? await fetchAllottedItems({ departmentId: deptId })
          : await fetchAllottedItems({ employeeId: empId })
      setAllottedByParty((prev) => ({ ...prev, [key]: allotted.itemIds }))
      setAllottedUnitsByParty((prev) => ({ ...prev, [key]: allotted.units }))
      setAllottedQtyByParty((prev) => ({ ...prev, [key]: allotted.qtyByItemId }))
      return allotted
    } catch {
      setAllottedByParty((prev) => ({ ...prev, [key]: [] }))
      setAllottedUnitsByParty((prev) => ({ ...prev, [key]: [] }))
      setAllottedQtyByParty((prev) => ({ ...prev, [key]: {} }))
      return { itemIds: [] as string[], units: [] as AllottedUnit[], qtyByItemId: {} as Record<string, number> }
    } finally {
      setAllottedLoading(false)
    }
  }

  const partyFromValues = (values: Record<string, unknown>) => {
    const returnType = String(values.returnType ?? 'EMPLOYEE')
    const empId = String(values.returnedBy ?? '')
    const deptId = String(values.departmentId ?? '')
    const key = returnPartyKey(returnType, empId, deptId)
    return { returnType, empId, deptId, key }
  }

  const applySingleUnitPatch = (
    allotted: { units: AllottedUnit[]; qtyByItemId: Record<string, number> },
  ): Record<string, unknown> => {
    if (allotted.units.length !== 1) return {}
    const u = allotted.units[0]
    const itemId = String(u.itemId)
    const item = items.rows.find((i) => i.id === itemId)
    const homeStore = String(item?.store ?? '')
    return {
      item: itemId,
      ...applyUomFields(item?.uom as string | number | null | undefined),
      itemCode: String(item?.code ?? ''),
      itemName: String(item?.name ?? ''),
      itemType: String(item?.itemType ?? ''),
      ...applyStoreFields(homeStore),
      qty: '1',
      serialNo: String(u.serialNo ?? '').trim().toUpperCase(),
      ipAddress: u.ipAddress ?? '',
      macAddress: u.macAddress ?? '',
      hostname: u.hostname ?? '',
      batch: u.batchLotNo ?? '',
      availableStock: String(allotted.qtyByItemId[itemId] ?? 1),
    }
  }

  const columns: Column<MaterialReturn>[] = [
    { key: 'no', header: 'Return No.', searchText: (r) => r.returnNo, render: (r) => <b className="font-mono">{r.returnNo}</b> },
    { key: 'date', header: 'Date', searchText: (r) => r.date, render: (r) => r.date },
    {
      key: 'party',
      header: 'From',
      searchText: (r) => {
        const deptId = String((r as { departmentId?: string }).departmentId ?? '')
        if (deptId) return deptLabel(departments.rows, deptId)
        return empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? ''))
      },
      render: (r) => {
        const deptId = String((r as { departmentId?: string }).departmentId ?? '')
        if (deptId) return deptLabel(departments.rows, deptId)
        return empLabel(employees.rows, String((r as { initiatedByEmpId?: string }).initiatedByEmpId ?? ''))
      },
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
    {
      name: 'returnType',
      label: 'Return From',
      type: 'select',
      required: true,
      options: [
        { value: 'EMPLOYEE', label: 'Employee' },
        { value: 'DEPARTMENT', label: 'Department' },
      ],
      hint: 'Employee returns custody from Issue / Opening Stock. Department returns what was issued to that department.',
    },
    {
      name: 'returnedBy',
      label: 'Returned By (Employee)',
      type: 'select',
      required: true,
      span: 2,
      options: opt(employees.rows, (e) => `${e.code} – ${e.firstName} ${e.lastName}`),
      hint: 'Loads items currently allotted to this employee from Issue / Opening Stock / BLS.',
      visibleWhen: (v) => String(v.returnType ?? 'EMPLOYEE') !== 'DEPARTMENT',
    },
    {
      name: 'departmentId',
      label: 'Return From Department',
      type: 'select',
      required: true,
      span: 2,
      options: opt(departments.rows.filter((d) => d.status !== 'Inactive')),
      hint: 'Loads items still allotted from department Issues (Issue − prior Returns).',
      visibleWhen: (v) => String(v.returnType ?? '') === 'DEPARTMENT',
    },
    {
      name: 'item',
      label: 'Item',
      type: 'select',
      required: true,
      span: 2,
      lockedUntilHeader: true,
      options: (values) => {
        const { key } = partyFromValues(values)
        const current = String(values.item ?? '')
        if (!key) return []
        const loaded = allottedByParty[key]
        const allowed = new Set(loaded ?? [])
        if (current) allowed.add(current)
        if (!loaded && !current) return []
        return items.rows
          .filter((i) => allowed.has(i.id))
          .map((i) => ({
            value: i.id,
            label: `${i.code} – ${i.name}`,
          }))
      },
      placeholder: '— Select allotted item —',
      hint: 'Choose an allotted item, or use Select Allotted Item… for serial pick.',
      selectSelectedContent: (values) => {
        const id = String(values.item ?? '')
        if (!id) return null
        const item = items.rows.find((i) => i.id === id)
        if (!item) return null
        const loc = locations.rows.find((l) => l.id === String(item.store ?? ''))
        const locLbl = loc ? `${loc.code} – ${loc.name}` : ''
        return (
          <>
            <span className="min-w-0 truncate text-[12.5px] text-[var(--text)]">
              {`${item.code} – ${item.name}`}
            </span>
            {locLbl ? (
              <Pill tone={toneForLabel(loc?.code ?? locLbl)}>{locLbl}</Pill>
            ) : null}
          </>
        )
      },
    },
    {
      name: 'itemName',
      label: 'Item Name',
      hint: 'Filled from item master (read-only)',
    },
    {
      name: 'store',
      label: 'Return to Store',
      type: 'text',
      required: true,
      lockedUntilHeader: true,
      hint: 'Auto-filled from Item Master (read-only after selection)',
    },
    {
      name: 'qty',
      label: 'Return Qty',
      type: 'number',
      required: true,
      lockedUntilHeader: true,
      hint: 'Set in allotted picker (read-only after selection)',
    },
    {
      name: 'uom',
      label: 'Unit',
      type: 'text',
      required: true,
      lockedUntilHeader: true,
      hint: 'From item master (read-only)',
    },
    {
      name: 'serialNo',
      label: 'Serial No.',
      type: 'select',
      lockedUntilHeader: true,
      options: (values) => {
        const { key } = partyFromValues(values)
        const itemId = String(values.item ?? '')
        if (!key || !itemId) return []
        const list = (allottedUnitsByParty[key] ?? []).filter((u) => String(u.itemId) === itemId)
        return list.map((u, idx) => ({
          value: String(u.serialNo ?? '').trim().toUpperCase(),
          label:
            [u.serialNo, u.batchLotNo ? `Batch ${u.batchLotNo}` : '']
              .filter(Boolean)
              .join(' · ') || `Unit ${idx + 1}`,
        }))
      },
      placeholder: '— Select serial in custody —',
      hint: 'Select the serial currently allotted for the selected item. Required for assets.',
    },
    {
      name: 'batch',
      label: 'Batch / Lot (optional)',
      lockedUntilHeader: true,
      hint: 'Filled from the selected serial when available',
    },
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
        description="Return unused or excess material back into a store — from an employee or a department."
        rows={filteredRows as never}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search returns…"
        saveLabel="Submit Return"
        draftLabel="Save Draft"
      formTitle="Return Details"
      addLabel="New Return"
        viewOnlyExisting
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            options: statusOptions,
            onChange: setStatusFilter,
          },
        ]}
        getDefaults={() => ({
          date: todayIso(),
          returnType: 'EMPLOYEE',
          qty: 1,
          attachmentUrl: '',
          attachmentName: '',
        })}
        readOnlyFields={(values) => {
          const locked = ['itemName']
          if (String(values.item ?? '').trim()) {
            locked.push('store', 'qty', 'uom', 'batch')
          }
          return locked
        }}
        renderExtraForm={(values, set, recordId) => {
          const { returnType, empId, deptId, key } = partyFromValues(values)
          const partyLabel =
            returnType === 'DEPARTMENT'
              ? deptLabel(departments.rows, deptId)
              : empLabel(employees.rows, empId)
          const readOnly = recordId !== 'new'
          const hasSelection = Boolean(String(values.item ?? '').trim())
          const partyReady = Boolean(key)
          return (
            <>
              <ReturnDisplayLabelSync
                storeId={String(values.storeId ?? '')}
                storeLabel={String(values.store ?? '')}
                uomId={String(values.uomId ?? '')}
                uomLabel={String(values.uom ?? '')}
                locations={locations.rows}
                units={units.rows}
                set={set}
              />
              {!readOnly && (
                <Card className="mt-3">
                  <CardBody className="flex flex-wrap items-center gap-2.5 py-3">
                    <Button
                      type="button"
                      disabled={!partyReady || allottedLoading}
                      onClick={() => {
                        setPickerPartyKey(key)
                        setPickerOpen(true)
                        void loadAllottedFor(returnType, empId, deptId)
                      }}
                    >
                      {allottedLoading
                        ? 'Loading…'
                        : hasSelection
                          ? 'Change Allotted Item…'
                          : 'Select Allotted Item…'}
                    </Button>
                    <span className="text-[12.5px] text-[var(--text3)]">
                      {partyReady
                        ? hasSelection
                          ? 'Store / qty / unit stay locked. Change Item here or use this button for serial pick.'
                          : returnType === 'DEPARTMENT'
                            ? 'Opens items still allotted from department Issues.'
                            : 'Opens allotted items with correct qty and serials in this employee’s custody.'
                        : returnType === 'DEPARTMENT'
                          ? 'Pick a department first, then open the allotted-item popup.'
                          : 'Pick Returned By first, then open the allotted-item popup.'}
                    </span>
                  </CardBody>
                </Card>
              )}
              <AttachmentSection
                url={String(values.attachmentUrl ?? '')}
                name={String(values.attachmentName ?? '')}
                readOnly={readOnly}
                onChange={({ url, name }) => {
                  set('attachmentUrl', url)
                  set('attachmentName', name)
                }}
              />
              <ReturnAllottedPickerModal
                open={pickerOpen && pickerPartyKey === key}
                onClose={() => setPickerOpen(false)}
                partyLabel={partyLabel}
                partyKind={returnType === 'DEPARTMENT' ? 'department' : 'employee'}
                loading={allottedLoading}
                items={items.rows}
                units={units.rows}
                locations={locations.rows}
                itemIds={allottedByParty[key] ?? []}
                unitsAllotted={allottedUnitsByParty[key] ?? []}
                qtyByItemId={allottedQtyByParty[key] ?? {}}
                onSelect={(sel) => {
                  const storeId = String(sel.storeId ?? '').trim()
                  const storeLabel =
                    String(sel.storeLabel ?? '').trim() &&
                    !/^\d+$/.test(String(sel.storeLabel ?? '').trim())
                      ? String(sel.storeLabel).trim()
                      : storeDisplay(storeId)
                  const uomId = String(sel.uomId ?? '').trim()
                  const uomLabel =
                    String(sel.uomLabel ?? '').trim() || uomDisplay(uomId)
                  set('item', sel.itemId)
                  set('itemCode', sel.itemCode)
                  set('itemName', sel.itemName)
                  set('itemType', sel.itemType)
                  set('qty', sel.qty)
                  set('serialNo', sel.serialNo)
                  set('batch', sel.batchLotNo)
                  set('ipAddress', sel.ipAddress)
                  set('macAddress', sel.macAddress)
                  set('hostname', sel.hostname)
                  set('availableStock', String(sel.allottedQty))
                  set('storeId', storeId)
                  set('store', storeLabel)
                  set('uomId', uomId)
                  set('uom', uomLabel)
                  window.setTimeout(() => {
                    set('storeId', storeId)
                    set('store', storeLabel || storeDisplay(storeId))
                    set('uomId', uomId)
                    set('uom', uomLabel || uomDisplay(uomId))
                  }, 0)
                }}
              />
            </>
          )
        }}
        onFieldChange={async (name, value, values) => {
          if (name === 'returnType') {
            const nextType = String(value ?? 'EMPLOYEE')
            return {
              ...clearItemFields(),
              returnedBy: '',
              departmentId: '',
              returnType: nextType,
            }
          }
          if (name === 'returnedBy' || name === 'departmentId') {
            const returnType =
              name === 'departmentId' ? 'DEPARTMENT' : String(values.returnType ?? 'EMPLOYEE')
            const empId = name === 'returnedBy' ? String(value ?? '') : String(values.returnedBy ?? '')
            const deptId = name === 'departmentId' ? String(value ?? '') : String(values.departmentId ?? '')
            const partyId = returnType === 'DEPARTMENT' ? deptId : empId
            if (!partyId) return clearItemFields()
            const allotted = await loadAllottedFor(returnType, empId, deptId)
            return {
              ...clearItemFields(),
              ...applySingleUnitPatch(allotted),
            }
          }
          if (name === 'item') {
            const item = items.rows.find((i) => i.id === String(value ?? ''))
            if (!item) return clearItemFields()
            const homeStore = String(item.store ?? '')
            const { key } = partyFromValues(values)
            const match = (allottedUnitsByParty[key] ?? []).filter(
              (u) => String(u.itemId) === item.id,
            )
            const qtyMap = allottedQtyByParty[key] ?? {}
            const allottedQty = qtyMap[item.id]
            const isAsset = Boolean(item.isSerialized || item.itemType === 'asset')
            const serialPatch =
              match.length === 1
                ? {
                    serialNo: String(match[0].serialNo ?? '').trim().toUpperCase(),
                    ipAddress: match[0].ipAddress ?? '',
                    macAddress: match[0].macAddress ?? '',
                    hostname: match[0].hostname ?? '',
                    batch: match[0].batchLotNo ?? values.batch,
                    qty: '1',
                  }
                : {
                    serialNo: '',
                    ipAddress: '',
                    macAddress: '',
                    hostname: '',
                    qty: isAsset ? '1' : String(values.qty ?? '1'),
                  }
            return {
              ...applyUomFields(item.uom as string | number | null | undefined),
              availableStock: allottedQty != null ? String(allottedQty) : '',
              itemCode: String(item.code ?? ''),
              itemName: String(item.name ?? ''),
              itemType: String(item.itemType ?? ''),
              ...applyStoreFields(homeStore),
              ...serialPatch,
            }
          }
          if (name === 'serialNo') {
            const { key } = partyFromValues(values)
            const itemId = String(values.item ?? '')
            const serial = String(value ?? '').trim().toUpperCase()
            const match = (allottedUnitsByParty[key] ?? []).find(
              (u) =>
                String(u.itemId) === itemId &&
                String(u.serialNo ?? '').trim().toUpperCase() === serial,
            )
            if (!match) return { serialNo: serial }
            return {
              serialNo: serial,
              ipAddress: match.ipAddress ?? '',
              macAddress: match.macAddress ?? '',
              hostname: match.hostname ?? '',
              batch: match.batchLotNo ?? values.batch,
              qty: '1',
            }
          }
          if (name === 'store') {
            return patchItem(name, value) ?? {}
          }
          return patchItem(name, value) ?? {}
        }}
        loadRecord={async (id) => {
          const doc = await fetchTxn('returns', id)
          const storeId = doc.locationId != null ? String(doc.locationId) : ''
          const line = doc.lines?.[0]
          const uomId = line?.uomId != null ? String(line.uomId) : ''
          const isDept = doc.departmentId != null
          return mapDocToFlatForm(doc, {
            ...applyStoreFields(storeId),
            ...applyUomFields(uomId),
            returnType: isDept ? 'DEPARTMENT' : 'EMPLOYEE',
            departmentId: isDept ? String(doc.departmentId) : '',
            returnedBy: doc.initiatedByEmpId != null ? String(doc.initiatedByEmpId) : '',
          })
        }}
        onSave={async (id, values, action = 'SUBMIT') => {
          const itemType = String(values.itemType ?? '')
          const item = items.rows.find((i) => i.id === String(values.item ?? ''))
          const isAsset = Boolean(
            itemType === 'asset' || item?.isSerialized || item?.itemType === 'asset',
          )
          if (isAsset && !String(values.serialNo ?? '').trim()) {
            throw new Error('Serial No. is required when returning an asset')
          }
          const { returnType, empId, deptId, key } = partyFromValues(values)
          const itemId = String(values.item ?? '')
          const allottedQty = allottedQtyByParty[key]?.[itemId]
          const qty = Number(values.qty ?? 0)
          if (allottedQty != null && qty > allottedQty) {
            throw new Error(
              `Return qty (${qty}) exceeds allotted qty (${allottedQty}) for this ${
                returnType === 'DEPARTMENT' ? 'department' : 'employee'
              }`,
            )
          }
          let storeId = String(values.storeId ?? '').trim()
          if (!storeId || !/^\d+$/.test(storeId)) {
            storeId = String(item?.store ?? '').trim()
          }
          let uomId = String(values.uomId ?? '').trim()
          if (!uomId || !/^\d+$/.test(uomId)) {
            uomId = String(item?.uom ?? '').trim()
          }
          if (!storeId) {
            throw new Error('Return to Store could not be resolved from Item Master')
          }

          const isDept = returnType === 'DEPARTMENT'
          const dept = departments.rows.find((d) => d.id === deptId)
          const emp = employees.rows.find((e) => e.id === empId)
          const fromLocationId = isDept
            ? numOrUndef(dept?.locationId)
            : numOrUndef(emp?.baseStore)
          if (isDept && fromLocationId == null) {
            throw new Error(
              'Selected department has no mapped location. Set Location on the Department master first.',
            )
          }

          const body: DocumentRequest = {
            docDate: String(values.date || todayIso()),
            locationId: numOrUndef(storeId),
            fromLocationId,
            docSubtype: isDept ? 'DEPARTMENT' : 'EMPLOYEE',
            departmentId: isDept ? numOrUndef(deptId) : undefined,
            initiatedByEmpId: isDept ? undefined : numOrUndef(empId),
            remarks: String(values.remarks ?? ''),
            ...attachmentPayload(String(values.attachmentUrl ?? ''), String(values.attachmentName ?? '')),
            docSubmitAction: action,
            lines: lineFromForm({ ...values, store: storeId, uom: uomId }, items.rows),
          }
          if (id === 'new') await createTxn('returns', body)
          else throw new Error('Return update is not supported by API')
          await reload()
        }}
      />
    </>
  )
}
