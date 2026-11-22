import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { LookupSelect } from '@/components/form/LookupSelect'
import { MasterEmployeeSearchLookup } from './MasterSearchLookup'
import { GEN_TYPE, mapDepartment, useMasterList } from '@/api/masters'
import {
  createTxn,
  fetchTxn,
  todayIso,
  updateTxn,
  useTxnList,
  type DocumentRequest,
  type TxnRow,
} from '@/api/transactions'
import { filterRowsByStatus, txnStatusFilterOptions } from '@/lib/listOrder'
import { useAuth } from '@/features/auth/AuthContext'
import { notBefore, validateFields, areRequiredFieldsFilled, type ValidatableField } from '@/features/masters/validation'
import { RequisitionItemLines, emptyLine, type RequisitionLine } from './RequisitionItemLines'
import { AttachmentLink, AttachmentSection, attachmentPayload } from './AttachmentSection'
import { enrichLinesFromItems, wholeQtyStr } from './lineGrid'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import {
  empLabel,
  employeeOptions as toEmployeeOptions,
  locLabel,
  nonSystemLocations,
  quickAddGenValue,
  useGenLookup,
  useTxnFormLookups,
} from './txnLookups'
import { useTxnDocSession } from './docWorkspace/useTxnDocSession'

const BASE = '/transactions/requisitions'
const MENU = 'SR'
const RESOURCE = 'requisitions'

/** Requisition raised for a whole department vs. for a named employee. */
type ReqType = 'DEPARTMENT' | 'EMPLOYEE'

const REQ_TYPES: { value: ReqType; label: string; caption: string }[] = [
  { value: 'DEPARTMENT', label: 'Department', caption: 'Raised for a Department' },
  { value: 'EMPLOYEE', label: 'Employee', caption: 'Raised for an Employee' },
]

/** Statuses in which the document body can still be edited (backend rule). */
const EDITABLE_STATUSES = ['', 'Pending', 'Draft', 'Rejected']

type FormState = {
  reqType: ReqType
  reqNo: string
  reqDate: string
  requiredDate: string
  departmentId: string
  departmentName: string
  requestedBy: string
  employeeCode: string
  designation: string
  deliverTo: string
  attachmentUrl: string
  attachmentName: string
  remark: string
  approvedBy: string
  approvedDate: string
  status: string
}

function blankForm(): FormState {
  return {
    reqType: 'DEPARTMENT',
    reqNo: AUTO_DOC_NO_LABEL,
    reqDate: todayIso(),
    requiredDate: todayIso(),
    departmentId: '',
    departmentName: '',
    requestedBy: '',
    employeeCode: '',
    designation: '',
    deliverTo: '',
    attachmentUrl: '',
    attachmentName: '',
    remark: '',
    approvedBy: '',
    approvedDate: '',
    status: '',
  }
}

type RequisitionBasket = {
  form: FormState
  lines: RequisitionLine[]
}

export function RequisitionsPages() {
  return (
    <Routes>
      <Route index element={<RequisitionList />} />
      <Route path=":id" element={<RequisitionForm />} />
    </Routes>
  )
}

/* -------------------------------------------------------------- list ---- */

function RequisitionList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const { rows, loading, error } = useTxnList(RESOURCE)
  const [statusFilter, setStatusFilter] = useState('')
  const statusOptions = useMemo(() => txnStatusFilterOptions(rows), [rows])
  const filteredRows = useMemo(() => filterRowsByStatus(rows, statusFilter), [rows, statusFilter])
  const { locations, employees } = useTxnFormLookups()
  const mapDeptStable = useCallback(mapDepartment, [])
  const { rows: deptRows } = useMasterList('departments', mapDeptStable)
  const departments = useMemo(
    () => ({
      rows: deptRows,
      options: deptRows.map((d) => ({ value: d.id, label: `${d.code} · ${d.name}` })),
    }),
    [deptRows],
  )

  const empById = useMemo(() => new Map(employees.rows.map((e) => [e.id, e])), [employees.rows])
  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])
  const deptById = useMemo(
    () => new Map(departments.rows.map((d) => [d.id, d.name])),
    [departments.rows],
  )

  const text = {
    requestedBy: (r: TxnRow) => {
      const e = empById.get(String(r.initiatedByEmpId ?? ''))
      return e ? empLabel(e) : '—'
    },
    department: (r: TxnRow) => deptById.get(String(r.departmentId ?? '')) ?? '—',
    deliverTo: (r: TxnRow) => {
      const l = locById.get(String(r.locationId ?? ''))
      return l ? locLabel(l) : '—'
    },
  }

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Requisition No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    {
      key: 'type',
      header: 'Type',
      searchText: (r) => String(r.docSubtype ?? ''),
      render: (r) => (
        <span className="text-[var(--text2)]">
          {REQ_TYPES.find((t) => t.value === r.docSubtype)?.label ?? '—'}
        </span>
      ),
    },
    { key: 'date', header: 'Requisition Date', searchText: (r) => r.docDate, render: (r) => r.docDate || '—' },
    {
      key: 'required',
      header: 'Required Date',
      searchText: (r) => String(r.requiredByDate ?? ''),
      render: (r) => String(r.requiredByDate ?? '') || '—',
    },
    { key: 'dept', header: 'Request from Department', searchText: text.department, render: text.department },
    { key: 'by', header: 'Requested By', searchText: text.requestedBy, render: text.requestedBy },
    { key: 'deliver', header: 'Request from Location', searchText: text.deliverTo, render: text.deliverTo },
    {
      key: 'items',
      header: 'Items',
      searchText: (r) => String(r.totalItems ?? 0),
      render: (r) => <span className="tabular-nums">{Number(r.totalItems ?? 0)}</span>,
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <StatusPill status={r.status || '—'} /> },
    {
      key: 'attachment',
      header: 'Attachment',
      searchText: (r) => String(r.attachmentName ?? r.attachmentUrl ?? ''),
      render: (r) => <AttachmentLink url={String(r.attachmentUrl ?? '')} name={String(r.attachmentName ?? '')} />,
    },
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Store Requisitions"
        description="Requests raised by a department or an employee for material to be issued from a store."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading requisitions…</div>}
      <DataTable
        columns={columns}
        rows={filteredRows}
        searchPlaceholder="Search requisitions…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            options: statusOptions,
            onChange: setStatusFilter,
          },
        ]}
        onRowClick={(r) => navigate(`${BASE}/${r.id}`)}
        onAdd={canCreateMenu(MENU) ? () => navigate(`${BASE}/new`) : undefined}
        addLabel="New Requisition"
        emptyMessage="No requisitions yet. Use New Requisition to raise one."
      />
    </FadeContent>
  )
}

/* -------------------------------------------------------------- form ---- */

function RequisitionForm() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const { canCreateMenu, canEditMenu } = useAuth()
  const isNew = id === 'new'

  const { locations, employees, items, units } = useTxnFormLookups()
  const mapDeptStable = useCallback(mapDepartment, [])
  const { rows: deptRows } = useMasterList('departments', mapDeptStable)
  const departments = useMemo(
    () => ({
      rows: deptRows,
      options: deptRows.map((d) => ({ value: d.id, label: `${d.code} · ${d.name}` })),
    }),
    [deptRows],
  )
  const designations = useGenLookup(GEN_TYPE.DESIGNATION)

  const [form, setForm] = useState<FormState>(blankForm)
  const [lines, setLines] = useState<RequisitionLine[]>(() => [emptyLine()])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const basketApplied = useRef(false)
  const serverLoaded = useRef(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }))
  const touch = (key: string) => setTouched((p) => ({ ...p, [key]: true }))

  const canEdit = isNew ? canCreateMenu(MENU) : canEditMenu(MENU)
  const statusEditable = EDITABLE_STATUSES.includes(form.status)
  const readOnly = !canEdit || !statusEditable

  const employeeById = useMemo(() => new Map(employees.rows.map((e) => [e.id, e])), [employees.rows])

  const basketDirty = useMemo(
    () =>
      !readOnly &&
      (lines.some((l) => l.itemId !== '') ||
        Boolean(form.departmentId) ||
        Boolean(form.requestedBy) ||
        Boolean(form.remark.trim()) ||
        Boolean(form.attachmentUrl)),
    [readOnly, lines, form],
  )
  const basketData = useMemo<RequisitionBasket>(() => ({ form, lines }), [form, lines])

  useEffect(() => {
    basketApplied.current = false
    serverLoaded.current = false
  }, [id])

  /* ---- load existing document ---- */
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const doc = await fetchTxn(RESOURCE, id)
        if (cancelled) return
        const attachmentUrl = doc.attachmentUrl ?? ''
        setForm({
          reqType: doc.docSubtype === 'EMPLOYEE' ? 'EMPLOYEE' : 'DEPARTMENT',
          reqNo: doc.docNo ?? '',
          reqDate: doc.docDate ?? '',
          requiredDate: doc.requiredByDate ?? '',
          departmentId: doc.departmentId != null ? String(doc.departmentId) : '',
          departmentName: '',
          requestedBy: doc.initiatedByEmpId != null ? String(doc.initiatedByEmpId) : '',
          employeeCode: doc.employeeRefCode ?? '',
          designation: doc.designation ?? '',
          deliverTo: doc.locationId != null ? String(doc.locationId) : '',
          attachmentUrl,
          attachmentName: doc.attachmentName || (attachmentUrl.split('/').pop() ?? ''),
          remark: doc.remarks ?? '',
          approvedBy: doc.approvedByEmpId != null ? String(doc.approvedByEmpId) : '',
          approvedDate: doc.approvedDate ?? '',
          status: doc.status ?? '',
        })
        const mapped = (doc.lines ?? []).map((l) => ({
          ...emptyLine(),
          itemId: l.itemId != null ? String(l.itemId) : '',
          itemCode: l.itemCode ?? '',
          itemName: l.itemName ?? '',
          uomId: l.uomId != null ? String(l.uomId) : '',
          requestedQty: wholeQtyStr(l.requestedQty),
          availableStock: wholeQtyStr(l.availableStock),
          locationId: l.locationId != null ? String(l.locationId) : '',
          remark: l.remark ?? '',
        }))
        setLines(mapped.length ? mapped : [emptyLine()])
        serverLoaded.current = true
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load requisition')
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
    setLines((prev) => enrichLinesFromItems(prev, items.rows))
  }, [items.rows, lineItemKey])

  /* Employee variant auto-fills identity fields from the selected employee.
   * Designation is stored as the gen value name (free text on the txn header). */
  const designationOptions = useMemo(() => {
    const opts = designations.rows.map((r) => ({
      value: String(r.valueName ?? ''),
      label: String(r.valueName ?? ''),
    }))
    const current = String(form.designation ?? '').trim()
    if (current && !opts.some((o) => o.value === current)) {
      opts.unshift({ value: current, label: current })
    }
    return opts
  }, [designations.rows, form.designation])

  const resolveDesignationLabel = useCallback(
    (raw: string) => {
      const t = String(raw ?? '').trim()
      if (!t) return ''
      const byName = designations.rows.find(
        (r) =>
          String(r.valueName ?? '').localeCompare(t, undefined, { sensitivity: 'accent' }) === 0 ||
          String(r.valueCode ?? '').localeCompare(t, undefined, { sensitivity: 'accent' }) === 0 ||
          String(r.genmasterId ?? '').localeCompare(t, undefined, { sensitivity: 'accent' }) === 0,
      )
      return byName?.valueName ?? t
    },
    [designations.rows],
  )

  const onRequestedByChange = (empId: string, searchRow?: import('@/api/masters').ApiMasterRow) => {
    const catalogEmp = employeeById.get(empId)
    // Prefer non-empty fields from either the catalog row or the live search hit.
    const emp = catalogEmp ?? searchRow
    setForm((p) => {
      const next = { ...p, requestedBy: empId }
      if (!empId) {
        next.employeeCode = ''
        next.departmentName = ''
        next.departmentId = ''
        next.designation = ''
        return next
      }
      if (!emp && !searchRow) return next

      const code = String(searchRow?.code ?? catalogEmp?.code ?? emp?.code ?? '')
      next.employeeCode = code

      if (p.reqType === 'EMPLOYEE') {
        const deptId = String(
          (searchRow as { departmentId?: string } | undefined)?.departmentId ||
            (catalogEmp as { departmentId?: string } | undefined)?.departmentId ||
            '',
        )
        const dept = deptId ? departments.rows.find((d) => d.id === deptId) : undefined
        next.departmentId = deptId
        next.departmentName =
          dept?.name ??
          String(searchRow?.department ?? catalogEmp?.department ?? emp?.department ?? '')

        const rawDesignation = String(
          searchRow?.designation || catalogEmp?.designation || emp?.designation || '',
        )
        next.designation = resolveDesignationLabel(rawDesignation)
      }
      return next
    })
  }

  const onTypeChange = (reqType: ReqType) => {
    // Department and Designation belong to different variants — clear the stale one.
    setForm((p) => ({
      ...p,
      reqType,
      departmentId: reqType === 'EMPLOYEE' ? '' : p.departmentId,
      departmentName: '',
      designation: reqType === 'DEPARTMENT' ? '' : p.designation,
      requestedBy: reqType === 'DEPARTMENT' ? '' : p.requestedBy,
      employeeCode: reqType === 'DEPARTMENT' ? '' : p.employeeCode,
    }))
  }

  /* ---- validation ---- */
  const fieldDefs = useMemo<ValidatableField[]>(() => {
    const base: ValidatableField[] = [
      { name: 'reqDate', label: 'Requisition Date', type: 'date', required: true },
      {
        name: 'requiredDate',
        label: 'Required Date',
        type: 'date',
        required: true,
        validate: notBefore('reqDate', 'Requisition Date'),
      },
    ]
    if (form.reqType === 'DEPARTMENT') {
      base.push({ name: 'departmentId', label: 'Request from Department', required: true })
    } else {
      base.push({ name: 'requestedBy', label: 'Requested By', required: true })
    }
    return base
  }, [form.reqType])

  const errors = useMemo(() => {
    if (readOnly) return {} as Record<string, string>
    const bag = form as unknown as Record<string, unknown>
    const found = validateFields(fieldDefs, bag)
    const filled = lines.filter((l) => l.itemId !== '')
    if (filled.length === 0) {
      found.lines = 'Add at least one item line with an item and a requested quantity.'
    } else if (filled.some((l) => !(Number(l.requestedQty) > 0))) {
      found.lines = 'Every item line needs a requested quantity greater than 0.'
    } else if (filled.some((l) => !l.locationId)) {
      found.lines = 'Every item line needs a location.'
    } else if (lines.some((l) => l.itemCode !== '' && l.itemId === '')) {
      found.lines = 'One or more item codes do not match an item in the Item Master.'
    }
    return found
  }, [readOnly, form, fieldDefs, lines])

  const headerReady = useMemo(
    () => areRequiredFieldsFilled(fieldDefs, form as unknown as Record<string, unknown>),
    [fieldDefs, form],
  )

  const err = (key: string) => (submitted || touched[key] ? (errors[key] ?? '') : '')

  /* ---- actions ---- */
  const buildBody = (action: 'SAVE_DRAFT' | 'SUBMIT'): DocumentRequest => {
    const filled = lines.filter((l) => l.itemId !== '')
    const firstLoc = filled.find((l) => l.locationId)?.locationId
    const locationId = firstLoc ? Number(firstLoc) : undefined
    return {
      docDate: form.reqDate,
      requiredByDate: form.requiredDate,
      docSubtype: form.reqType,
      locationId,
      departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      initiatedByEmpId: form.requestedBy ? Number(form.requestedBy) : undefined,
      employeeRefCode: form.employeeCode || undefined,
      designation: form.reqType === 'EMPLOYEE' ? form.designation || undefined : undefined,
      ...attachmentPayload(form.attachmentUrl, form.attachmentName),
      remarks: form.remark || undefined,
      docSubmitAction: action,
      lines: lines
        .filter((l) => l.itemId !== '')
        .map((l, i) => {
          const qty = Number(l.requestedQty || 0)
          return {
            srNo: i + 1,
            itemId: Number(l.itemId),
            uomId: l.uomId ? Number(l.uomId) : undefined,
            requestedQty: qty,
            qty,
            availableStock: l.availableStock === '' ? undefined : Number(l.availableStock),
            locationId: l.locationId ? Number(l.locationId) : undefined,
            remark: l.remark || undefined,
          }
        }),
    }
  }

  const { restored, hydrateDone, clearRestored, clearBasket } = useTxnDocSession({
    data: basketData,
    enabled: !loading && !readOnly && !saving,
    dirty: basketDirty,
    kind: 'Requisition',
    title: isNew ? 'New Requisition' : form.reqNo ? `Requisition ${form.reqNo}` : `Requisition #${id}`,
    subtitle: basketDirty ? 'Basket unsaved' : 'Basket saved',
    silentDraft: {
      intervalMs: 15_000,
      canSave: () => {
        if (readOnly || saving || Object.keys(errors).length > 0) return false
        return lines.some((l) => l.itemId && l.locationId && Number(l.requestedQty) > 0)
      },
      save: async () => {
        const body = buildBody('SAVE_DRAFT')
        if (isNew) {
          const created = await createTxn(RESOURCE, body)
          return { id: String(created.docId), docNo: created.docNo }
        }
        await updateTxn(RESOURCE, id, body)
        return { id, docNo: form.reqNo }
      },
    },
  })

  useEffect(() => {
    if (!hydrateDone || basketApplied.current || !restored) return
    if (!isNew && (loading || !serverLoaded.current)) return
    setForm(restored.form)
    setLines(restored.lines.length ? restored.lines : [emptyLine()])
    basketApplied.current = true
    clearRestored()
    setMessage('Restored from basket')
  }, [hydrateDone, restored, isNew, loading, clearRestored])

  const save = async (action: 'SAVE_DRAFT' | 'SUBMIT') => {
    setSubmitted(true)
    setMessage(null)
    const keys = Object.keys(errors)
    if (keys.length > 0) {
      setError(errors.lines ?? 'Please correct the highlighted fields before saving.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body = buildBody(action)
      if (isNew) {
        await createTxn(RESOURCE, body)
      } else {
        await updateTxn(RESOURCE, id, body)
      }
      clearBasket()
      navigate(BASE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  /* ---- quick-add configs ---- */
  const addDesignationBase = quickAddGenValue('Add Designation', GEN_TYPE.DESIGNATION, designations)
  const addDesignation = {
    ...addDesignationBase,
    onCreate: async (values: Record<string, string>) => {
      const created = await addDesignationBase.onCreate(values)
      // Form stores designation by name (matches employee master / txn header).
      return { value: created.label, label: created.label }
    },
  }

  const employeeOptions = toEmployeeOptions(employees.rows)
  const lineLocations = nonSystemLocations(locations.rows)

  if (isNew && !canCreateMenu(MENU)) return <Navigate to={BASE} replace />
  if (loading) return <div className="text-sm text-[var(--text3)]">Loading requisition…</div>

  const typeCaption = REQ_TYPES.find((t) => t.value === form.reqType)?.caption

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            Store Requisition{' '}
            <span className="text-[13px] font-medium text-[var(--text3)]">
              — {readOnly ? 'View' : 'Add / Edit'}
            </span>
            {form.status && (
              <span className="ml-2 align-middle">
                <StatusPill status={form.status} />
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">
            Raise a request for material to be issued from a store. Saving returns you to the list.
          </div>
          {!canEdit && (
            <div className="mt-1 text-[12px] text-[var(--danger)]">
              You do not have {isNew ? 'Create' : 'Edit'} permission for this screen.
            </div>
          )}
          {canEdit && !statusEditable && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              A {form.status} requisition can no longer be edited. Only Pending and Rejected documents are editable.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(BASE)}>
          ← Back to List
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Requisition Type" required className="w-[220px]">
              <Select
                value={form.reqType}
                onChange={(e) => onTypeChange(e.target.value as ReqType)}
                disabled={readOnly}
              >
                {REQ_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <span className="pb-2 text-[11.5px] font-semibold text-[var(--accent)]">{typeCaption}</span>
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-visible">
        <CardHeader title="Requisition Details" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Requisition No." required hint={isNew ? 'Auto-generated on save (STRQ-2026-0001)' : undefined}>
              <Input value={form.reqNo} readOnly />
            </Field>

            <Field label="Requisition Date" required error={err('reqDate')}>
              <Input
                type="date"
                value={form.reqDate}
                onChange={(e) => set('reqDate', e.target.value)}
                onBlur={() => touch('reqDate')}
                disabled={readOnly}
                invalid={Boolean(err('reqDate'))}
              />
            </Field>

            <Field label="Required Date" required error={err('requiredDate')}>
              <Input
                type="date"
                value={form.requiredDate}
                min={form.reqDate || undefined}
                onChange={(e) => set('requiredDate', e.target.value)}
                onBlur={() => touch('requiredDate')}
                disabled={readOnly}
                invalid={Boolean(err('requiredDate'))}
              />
            </Field>

            {form.reqType === 'DEPARTMENT' ? (
              <LookupSelect
                label="Request from Department"
                required
                value={form.departmentId}
                onChange={(v) => set('departmentId', v)}
                onBlur={() => touch('departmentId')}
                options={departments.options}
                placeholder="— Select Department —"
                error={err('departmentId')}
                disabled={readOnly}
              />
            ) : (
              <Field label="Requested By" required error={err('requestedBy')}>
                <MasterEmployeeSearchLookup
                  value={form.requestedBy}
                  onChange={onRequestedByChange}
                  selectedLabel={employees.rows.find((e) => String(e.id) === String(form.requestedBy)) ? empLabel(employees.rows.find((e) => String(e.id) === String(form.requestedBy))!) : undefined}
                  placeholder="— Select Employee —"
                  disabled={readOnly}
                  invalid={Boolean(err('requestedBy'))}
                />
              </Field>
            )}

            {form.reqType === 'EMPLOYEE' && (
              <>
                <Field label="Employee Id">
                  <Input value={form.employeeCode} readOnly placeholder="Auto" />
                </Field>

                <Field label="Issued to Department">
                  <Input
                    value={
                      form.departmentName ||
                      departments.options.find((d) => d.value === form.departmentId)?.label ||
                      ''
                    }
                    readOnly
                    placeholder="Auto"
                  />
                </Field>

                <LookupSelect
                  label="Designation"
                  value={form.designation}
                  onChange={(v) => set('designation', v)}
                  options={designationOptions}
                  placeholder="— Select Designation —"
                  disabled={readOnly}
                  quickAdd={addDesignation}
                />
              </>
            )}

            <Field label="Remark" className="md:col-span-2 xl:col-span-3">
              <Textarea
                value={form.remark}
                onChange={(e) => set('remark', e.target.value)}
                disabled={readOnly}
                maxLength={500}
                rows={3}
                placeholder="Add a remark…"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <AttachmentSection
        url={form.attachmentUrl}
        name={form.attachmentName}
        readOnly={readOnly}
        onChange={({ url, name }) => setForm((p) => ({ ...p, attachmentUrl: url, attachmentName: name }))}
      />

      <RequisitionItemLines
        lines={lines}
        onChange={setLines}
        items={items.rows}
        units={units.rows}
        locations={lineLocations}
        allLocations={locations.rows}
        readOnly={readOnly}
        headerReady={headerReady}
        error={submitted ? errors.lines : undefined}
      />

      {error && <div className="mt-2 text-[12.5px] font-medium text-[var(--danger)]">{error}</div>}
      {message && <div className="mt-2 text-[12.5px] font-medium text-[var(--accent)]">{message}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex-1" />
        {!readOnly && (
          <Button
            variant="danger"
            onClick={() => {
              setForm((p) => ({ ...blankForm(), reqType: p.reqType, reqNo: p.reqNo, status: p.status }))
              setLines([emptyLine()])
              setSubmitted(false)
              setTouched({})
              clearBasket()
            }}
            disabled={saving}
          >
            Clear
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
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        )}
      </div>
    </FadeContent>
  )
}
