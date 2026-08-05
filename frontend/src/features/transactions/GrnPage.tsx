import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { LookupSelect } from '@/components/form/LookupSelect'
import {
  createTxn,
  fetchTxn,
  todayIso,
  updateTxn,
  useTxnList,
  type DocumentRequest,
  type TxnRow,
} from '@/api/transactions'
import { useAuth } from '@/features/auth/AuthContext'
import { notBefore, validateFields, type ValidatableField } from '@/features/masters/validation'
import { GEN_TYPE, useGenValues } from '@/api/masters'
import { GrnItemLines, emptyGrnLine, type GrnLine } from './GrnItemLines'
import type { ItemKind } from './OpeningStockItemLines'
import { enrichLinesFromItems, money, toNum } from './lineGrid'
import {
  employeeOptions as toEmployeeOptions,
  itemsForLocation,
  locLabel,
  locationOptions as toLocationOptions,
  quickAddEmployee,
  quickAddLocation,
  quickAddVendor,
  useTxnFormLookups,
  vendorLabel,
  vendorOptions as toVendorOptions,
} from './txnLookups'

const BASE = '/transactions/grn'
const MENU = 'GRN'
const RESOURCE = 'grn'

/** A GRN posts stock on save; only draft (In Pending) stays editable. */
const EDITABLE_STATUSES = ['', 'In Pending', 'Draft']

type FormState = {
  grnNo: string
  grnDate: string
  supplier: string
  invoiceNo: string
  invoiceDate: string
  referenceDoc: string
  referenceDocDate: string
  store: string
  inspectedBy: string
  inspectionDate: string
  remarks: string
  preparedBy: string
  preparedDate: string
  approvedBy: string
  approvedDate: string
  status: string
}

function blankForm(): FormState {
  return {
    grnNo: '(auto)',
    grnDate: todayIso(),
    supplier: '',
    invoiceNo: '',
    invoiceDate: '',
    referenceDoc: '',
    referenceDocDate: '',
    store: '',
    inspectedBy: '',
    inspectionDate: '',
    remarks: '',
    preparedBy: '',
    preparedDate: '',
    approvedBy: '',
    approvedDate: '',
    status: '',
  }
}

export function GrnPages() {
  return (
    <Routes>
      <Route index element={<GrnList />} />
      <Route path=":id" element={<GrnForm />} />
    </Routes>
  )
}

/* -------------------------------------------------------------- list ---- */

function GrnList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const { rows, loading, error } = useTxnList(RESOURCE)
  const { locations, vendors } = useTxnFormLookups()

  const vendorById = useMemo(() => new Map(vendors.rows.map((v) => [v.id, v])), [vendors.rows])
  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])

  const text = {
    supplier: (r: TxnRow) => {
      const v = vendorById.get(String(r.partyId ?? ''))
      return v ? vendorLabel(v) : '—'
    },
    store: (r: TxnRow) => {
      const l = locById.get(String(r.locationId ?? ''))
      return l ? locLabel(l) : '—'
    },
  }

  const columns: Column<TxnRow>[] = [
    { key: 'no', header: 'GRN No.', searchText: (r) => r.docNo, render: (r) => <b className="font-mono">{r.docNo}</b> },
    { key: 'date', header: 'GRN Date', searchText: (r) => r.docDate, render: (r) => r.docDate || '—' },
    { key: 'supplier', header: 'Supplier', searchText: text.supplier, render: text.supplier },
    {
      key: 'invoice',
      header: 'Invoice No.',
      searchText: (r) => String(r.invoiceNo ?? ''),
      render: (r) => String(r.invoiceNo ?? '') || '—',
    },
    { key: 'store', header: 'Store / Location', searchText: text.store, render: text.store },
    {
      key: 'items',
      header: 'Items',
      searchText: (r) => String(r.totalItems ?? 0),
      render: (r) => <span className="tabular-nums">{Number(r.totalItems ?? 0)}</span>,
    },
    {
      key: 'amt',
      header: 'Total Amount (₹)',
      searchText: (r) => String(r.totalAmount ?? 0),
      render: (r) => <span className="tabular-nums">{money(Number(r.totalAmount ?? 0))}</span>,
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <StatusPill status={r.status || '—'} /> },
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Goods Receipt Note"
        description="Records material received from a supplier and receives the accepted quantity into stock — no approval workflow involved."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading GRNs…</div>}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search GRNs…"
        onRowClick={(r) => navigate(`${BASE}/${r.id}`)}
        onAdd={canCreateMenu(MENU) ? () => navigate(`${BASE}/new`) : undefined}
        addLabel="New GRN"
        emptyMessage="No goods receipt notes yet. Use New GRN to record one."
      />
    </FadeContent>
  )
}

/* -------------------------------------------------------------- form ---- */

function GrnForm() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const { canCreateMenu, canEditMenu } = useAuth()
  const isNew = id === 'new'

  const { locations, employees, vendors, items, units } = useTxnFormLookups()
  const { options: conditionOpts } = useGenValues(GEN_TYPE.ASSET_CONDITION)

  const [form, setForm] = useState<FormState>(blankForm)
  const [itemType, setItemType] = useState<ItemKind>('asset')
  const [lines, setLines] = useState<GrnLine[]>(() => [emptyGrnLine()])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }))
  const touch = (key: string) => setTouched((p) => ({ ...p, [key]: true }))

  const canEdit = isNew ? canCreateMenu(MENU) : canEditMenu(MENU)
  const statusEditable = EDITABLE_STATUSES.includes(form.status)
  const readOnly = !canEdit || !statusEditable

  /* ---- load existing document ---- */
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const doc = await fetchTxn(RESOURCE, id)
        if (cancelled) return
        setForm({
          grnNo: doc.docNo ?? '',
          grnDate: doc.docDate ?? '',
          supplier: doc.partyId != null ? String(doc.partyId) : '',
          invoiceNo: doc.invoiceNo ?? '',
          invoiceDate: doc.invoiceDate ?? '',
          referenceDoc: doc.poNo ?? '',
          referenceDocDate: doc.poDate ?? '',
          store: doc.locationId != null ? String(doc.locationId) : '',
          inspectedBy: doc.inspectedByEmpId != null ? String(doc.inspectedByEmpId) : '',
          inspectionDate: doc.inspectionDate ?? '',
          remarks: doc.remarks ?? '',
          preparedBy: doc.preparedByEmpId != null ? String(doc.preparedByEmpId) : '',
          preparedDate: doc.preparedDate ?? '',
          approvedBy: doc.approvedByEmpId != null ? String(doc.approvedByEmpId) : '',
          approvedDate: doc.approvedDate ?? '',
          status: doc.status ?? '',
        })
        const mapped = (doc.lines ?? []).map((l) => ({
          ...emptyGrnLine(),
          itemId: l.itemId != null ? String(l.itemId) : '',
          itemCode: l.itemCode ?? '',
          itemName: l.itemName ?? '',
          uomId: l.uomId != null ? String(l.uomId) : '',
          receivedQty: l.receivedQty != null ? String(l.receivedQty) : '',
          acceptedQty: l.acceptedQty != null ? String(l.acceptedQty) : '',
          rejectedQty: l.rejectedQty != null ? String(l.rejectedQty) : '',
          availableStock: l.availableStock != null ? String(l.availableStock) : '',
          amount: l.amount != null ? String(l.amount) : '',
          batch: l.batchLotNo ?? '',
          locationId: l.locationId != null ? String(l.locationId) : '',
          serialNo: l.serialNo ?? '',
          ipAddress: l.ipAddress ?? '',
          macAddress: l.macAddress ?? '',
          hostname: l.hostname ?? '',
          itemCondition: l.itemCondition ?? '',
          remark: l.remark ?? '',
        }))
        setLines(mapped.length ? mapped : [emptyGrnLine()])
        const firstType = doc.lines?.find((l) => l.itemType)?.itemType
        if (firstType === 'consumable' || firstType === 'asset') {
          setItemType(firstType)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load GRN')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  const lineItemKey = lines.map((l) => l.itemId).join('|')
  useEffect(() => {
    if (items.rows.length === 0) return
    setLines((prev) => {
      const enriched = enrichLinesFromItems(prev, items.rows)
      if (!isNew) {
        const firstId = enriched.find((l) => l.itemId)?.itemId
        const hit = firstId ? items.rows.find((i) => i.id === firstId) : undefined
        if (hit) setItemType(hit.itemType === 'consumable' ? 'consumable' : 'asset')
      }
      return enriched
    })
  }, [items.rows, lineItemKey, isNew])

  /* ---- quantity summary, auto-calculated from the lines ---- */
  const totals = useMemo(
    () =>
      lines.reduce(
        (acc, l) => ({
          received: acc.received + toNum(l.receivedQty),
          accepted: acc.accepted + toNum(l.acceptedQty),
          rejected: acc.rejected + toNum(l.rejectedQty),
          amount: acc.amount + toNum(l.amount),
        }),
        { received: 0, accepted: 0, rejected: 0, amount: 0 },
      ),
    [lines],
  )

  /* ---- validation ---- */
  const fieldDefs = useMemo<ValidatableField[]>(
    () => [
      { name: 'grnDate', label: 'GRN Date', type: 'date', required: true },
      { name: 'supplier', label: 'Supplier', required: true },
      { name: 'store', label: 'Store / Location', required: true },
      {
        name: 'inspectionDate',
        label: 'Inspection Date',
        type: 'date',
        validate: notBefore('grnDate', 'GRN Date'),
      },
      {
        name: 'approvedDate',
        label: 'Approved Date',
        type: 'date',
        validate: notBefore('grnDate', 'GRN Date'),
      },
    ],
    [],
  )

  const errors = useMemo(() => {
    if (readOnly) return {} as Record<string, string>
    const found = validateFields(fieldDefs, form as unknown as Record<string, unknown>)
    const filled = lines.filter((l) => l.itemId !== '')
    if (filled.length === 0) {
      found.lines = 'Add at least one item line.'
    } else if (filled.some((l) => !(toNum(l.receivedQty) > 0))) {
      found.lines = 'Every item line needs a received quantity greater than 0.'
    } else if (
      itemType === 'consumable' &&
      filled.some(
        (l) => Math.abs(toNum(l.acceptedQty) + toNum(l.rejectedQty) - toNum(l.receivedQty)) > 0.0001,
      )
    ) {
      found.lines = 'On every line, Accepted Qty plus Rejected Qty must equal Received Qty.'
    } else if (itemType === 'asset' && filled.some((l) => !l.serialNo.trim())) {
      found.lines = 'Serial No. is required on every asset unit line.'
    } else if (lines.some((l) => l.itemCode !== '' && l.itemId === '')) {
      found.lines = 'One or more item codes do not match an item in the Item Master.'
    }
    if (form.inspectionDate && !form.inspectedBy) {
      found.inspectedBy = 'Select who inspected the goods.'
    }
    if (form.approvedDate && !form.approvedBy) found.approvedBy = 'Select who approved the GRN.'
    if (form.preparedDate && !form.preparedBy) found.preparedBy = 'Select who prepared the GRN.'
    return found
  }, [readOnly, form, fieldDefs, lines, itemType])

  const err = (key: string) => (submitted || touched[key] ? (errors[key] ?? '') : '')

  /* ---- actions ---- */
  const buildBody = (action: 'SAVE_DRAFT' | 'SUBMIT'): DocumentRequest => {
    const locationId = Number(form.store)
    return {
      docDate: form.grnDate,
      partyId: Number(form.supplier),
      locationId,
      invoiceNo: form.invoiceNo || undefined,
      invoiceDate: form.invoiceDate || undefined,
      poNo: form.referenceDoc || undefined,
      poDate: form.referenceDocDate || undefined,
      inspectedByEmpId: form.inspectedBy ? Number(form.inspectedBy) : undefined,
      inspectionDate: form.inspectionDate || undefined,
      preparedByEmpId: form.preparedBy ? Number(form.preparedBy) : undefined,
      preparedDate: form.preparedDate || undefined,
      approvedByEmpId: form.approvedBy ? Number(form.approvedBy) : undefined,
      approvedDate: form.approvedDate || undefined,
      remarks: form.remarks || undefined,
      totalReceivedQty: totals.received,
      totalAcceptedQty: totals.accepted,
      totalRejectedQty: totals.rejected,
      totalAmount: totals.amount,
      docSubmitAction: action,
      lines: lines
        .filter((l) => l.itemId !== '')
        .map((l, i) => {
          const received = itemType === 'asset' ? 1 : toNum(l.receivedQty)
          const accepted = itemType === 'asset' ? 1 : toNum(l.acceptedQty)
          const rejected = itemType === 'asset' ? 0 : toNum(l.rejectedQty)
          return {
            srNo: i + 1,
            itemId: Number(l.itemId),
            uomId: l.uomId ? Number(l.uomId) : undefined,
            receivedQty: received,
            acceptedQty: accepted,
            rejectedQty: rejected,
            qty: accepted,
            availableStock: l.availableStock === '' ? undefined : toNum(l.availableStock),
            amount: l.amount === '' ? undefined : toNum(l.amount),
            batchLotNo: l.batch || undefined,
            locationId: l.locationId ? Number(l.locationId) : locationId,
            serialNo: l.serialNo || undefined,
            ipAddress: l.ipAddress || undefined,
            macAddress: l.macAddress || undefined,
            hostname: l.hostname || undefined,
            itemCondition: l.itemCondition || undefined,
            remark: l.remark || undefined,
          }
        }),
    }
  }

  const save = async (action: 'SAVE_DRAFT' | 'SUBMIT') => {
    setSubmitted(true)
    setMessage(null)
    if (Object.keys(errors).length > 0) {
      setError(errors.lines ?? 'Please correct the highlighted fields before saving.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body = buildBody(action)
      if (isNew) {
        const created = await createTxn(RESOURCE, body)
        const docId = (created as { docId?: number })?.docId
        if (action === 'SUBMIT') {
          navigate(BASE)
        } else {
          setMessage('GRN saved as draft.')
          if (docId != null) navigate(`${BASE}/${docId}`, { replace: true })
          else navigate(BASE)
        }
      } else {
        await updateTxn(RESOURCE, id, body)
        if (action === 'SUBMIT') navigate(BASE)
        else setMessage('GRN updated.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ---- quick-add configs ---- */
  const addEmployee = quickAddEmployee(employees.reload)
  const addLocation = quickAddLocation(locations.reload)
  const addSupplier = quickAddVendor(vendors.reload)

  const employeeOptions = toEmployeeOptions(employees.rows)
  const locationOptions = toLocationOptions(locations.rows)
  const supplierOptions = toVendorOptions(vendors.rows)

  if (isNew && !canCreateMenu(MENU)) return <Navigate to={BASE} replace />
  if (loading) return <div className="text-sm text-[var(--text3)]">Loading GRN…</div>

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            Goods Receipt Note{' '}
            <span className="text-[13px] font-medium text-[var(--text3)]">
              — {readOnly ? 'View' : 'Form'}
            </span>
            {form.status && (
              <span className="ml-2 align-middle">
                <StatusPill status={form.status} />
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">
            Fill in the goods receipt entry form and save — no approval workflow involved.
          </div>
          {!canEdit && (
            <div className="mt-1 text-[12px] text-[var(--danger)]">
              You do not have {isNew ? 'Create' : 'Edit'} permission for this screen.
            </div>
          )}
          {canEdit && !statusEditable && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              This GRN is {form.status} and its quantities are already in stock, so it can no longer be edited.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(BASE)}>
          ← Back to List
        </Button>
      </div>

      <Card>
        <CardHeader title="Header" subtitle="Reference numbers, supplier, purchase order and inspection details" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="GRN No." required hint={isNew ? 'Auto-generated on save (GRN-2026-0001)' : undefined}>
              <Input value={form.grnNo} readOnly />
            </Field>

            <Field label="GRN Date" required error={err('grnDate')}>
              <Input
                type="date"
                value={form.grnDate}
                onChange={(e) => set('grnDate', e.target.value)}
                onBlur={() => touch('grnDate')}
                disabled={readOnly}
                invalid={Boolean(err('grnDate'))}
              />
            </Field>

            <LookupSelect
              label="Supplier"
              required
              value={form.supplier}
              onChange={(v) => set('supplier', v)}
              onBlur={() => touch('supplier')}
              options={supplierOptions}
              placeholder="— Select Supplier —"
              error={err('supplier')}
              disabled={readOnly}
              quickAdd={addSupplier}
            />

            <Field label="Invoice No.">
              <Input
                value={form.invoiceNo}
                onChange={(e) => set('invoiceNo', e.target.value.toUpperCase())}
                disabled={readOnly}
                maxLength={30}
                placeholder="INV-001"
              />
            </Field>

            <Field label="Invoice Date">
              <Input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => set('invoiceDate', e.target.value)}
                disabled={readOnly}
              />
            </Field>

            <Field label="Reference Document" hint="Purchase order or other source document">
              <Input
                value={form.referenceDoc}
                onChange={(e) => set('referenceDoc', e.target.value.toUpperCase())}
                disabled={readOnly}
                maxLength={30}
                placeholder="ORD-001"
              />
            </Field>

            <Field label="Reference Document Date">
              <Input
                type="date"
                value={form.referenceDocDate}
                onChange={(e) => set('referenceDocDate', e.target.value)}
                disabled={readOnly}
              />
            </Field>

            <LookupSelect
              label="Store / Location"
              required
              value={form.store}
              onChange={(v) => set('store', v)}
              onBlur={() => touch('store')}
              options={locationOptions}
              placeholder="— Select Store / Location —"
              error={err('store')}
              hint="Where the accepted quantity is received"
              disabled={readOnly}
              quickAdd={addLocation}
            />

            <LookupSelect
              label="Inspected By"
              value={form.inspectedBy}
              onChange={(v) => set('inspectedBy', v)}
              onBlur={() => touch('inspectedBy')}
              options={employeeOptions}
              placeholder="— Select —"
              error={err('inspectedBy')}
              disabled={readOnly}
              quickAdd={addEmployee}
            />

            <Field label="Inspection Date" error={err('inspectionDate')}>
              <Input
                type="date"
                value={form.inspectionDate}
                min={form.grnDate || undefined}
                onChange={(e) => set('inspectionDate', e.target.value)}
                onBlur={() => touch('inspectionDate')}
                disabled={readOnly}
                invalid={Boolean(err('inspectionDate'))}
              />
            </Field>

            <Field label="Remarks" className="md:col-span-2 xl:col-span-3">
              <Textarea
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
                disabled={readOnly}
                maxLength={500}
                rows={3}
                placeholder="Any additional notes…"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Quantity Summary" subtitle="Auto-calculated from the item lines below" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            <Field label="Total Received Qty">
              <Input value={money(totals.received)} readOnly className="font-semibold" />
            </Field>
            <Field label="Total Accepted Qty">
              <Input
                value={money(totals.accepted)}
                readOnly
                className="font-semibold"
                style={{ color: 'var(--accent)' }}
              />
            </Field>
            <Field label="Total Rejected Qty">
              <Input
                value={money(totals.rejected)}
                readOnly
                className="font-semibold"
                style={{ color: 'var(--danger)' }}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <GrnItemLines
        lines={lines}
        onChange={setLines}
        itemType={itemType}
        onItemTypeChange={setItemType}
        items={itemsForLocation(items.rows, form.store)}
        units={units.rows}
        locations={locations.rows}
        conditionOptions={conditionOpts}
        storeLocationId={form.store}
        readOnly={readOnly}
        error={submitted ? errors.lines : undefined}
      />

      <Card>
        <CardHeader title="Other Details" subtitle="Sign-off before GRN is finalised" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <LookupSelect
              label="GRN Prepared By"
              value={form.preparedBy}
              onChange={(v) => set('preparedBy', v)}
              onBlur={() => touch('preparedBy')}
              options={employeeOptions}
              placeholder="— Select —"
              error={err('preparedBy')}
              disabled={readOnly}
              quickAdd={addEmployee}
            />

            <Field label="Prepared Date">
              <Input
                type="date"
                value={form.preparedDate}
                onChange={(e) => set('preparedDate', e.target.value)}
                disabled={readOnly}
              />
            </Field>

            <LookupSelect
              label="Approved By"
              value={form.approvedBy}
              onChange={(v) => set('approvedBy', v)}
              onBlur={() => touch('approvedBy')}
              options={employeeOptions}
              placeholder="— Select —"
              error={err('approvedBy')}
              disabled={readOnly}
              quickAdd={addEmployee}
            />

            <Field label="Approved Date" error={err('approvedDate')}>
              <Input
                type="date"
                value={form.approvedDate}
                min={form.grnDate || undefined}
                onChange={(e) => set('approvedDate', e.target.value)}
                onBlur={() => touch('approvedDate')}
                disabled={readOnly}
                invalid={Boolean(err('approvedDate'))}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      {error && <div className="mt-2 text-[12.5px] font-medium text-[var(--danger)]">{error}</div>}
      {message && <div className="mt-2 text-[12.5px] font-medium text-[var(--accent)]">{message}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex-1" />
        {!readOnly && (
          <Button
            variant="danger"
            onClick={() => {
              setForm((p) => ({ ...blankForm(), grnNo: p.grnNo, status: p.status }))
              setLines([emptyGrnLine()])
              setItemType('asset')
              setSubmitted(false)
              setTouched({})
              setError(null)
              setMessage(null)
            }}
            disabled={saving}
          >
            Reset
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate(BASE)}>
          Back to List
        </Button>
        {!readOnly && (
          <>
            <Button variant="ghost" onClick={() => void save('SAVE_DRAFT')} disabled={saving}>
              Save Draft
            </Button>
            <Button onClick={() => void save('SUBMIT')} disabled={saving}>
              {saving ? 'Saving…' : 'Save Record'}
            </Button>
          </>
        )}
      </div>
    </FadeContent>
  )
}
