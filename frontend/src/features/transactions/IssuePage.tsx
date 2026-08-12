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
import { api, type PageResponse } from '@/api/client'
import {
  createTxn,
  fetchTxn,
  mapTxnListItem,
  todayIso,
  useTxnList,
  type DocumentRequest,
  type TxnListItem,
  type TxnRow,
} from '@/api/transactions'
import { useAuth } from '@/features/auth/AuthContext'
import { validateFields, areRequiredFieldsFilled, type ValidatableField } from '@/features/masters/validation'
import { IssueItemLines, emptyLine, type IssueLine } from './IssueItemLines'
import { enrichLinesFromItems } from './lineGrid'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import {
  empLabel,
  employeeOptions as toEmployeeOptions,
  itemsForLocation,
  locLabel,
  locationOptions as toLocationOptions,
  quickAddEmployee,
  quickAddLocation,
  useTxnFormLookups,
} from './txnLookups'
import { RequisitionPickerModal } from './IssueRequisitionPicker'

const BASE = '/transactions/issues'
const MENU = 'ISS'
const RESOURCE = 'material-issues'

/** Statuses where a brand-new document can still be edited (create-only API). */
const EDITABLE_STATUSES = ['', 'Pending', 'Draft']

type FormState = {
  issueNo: string
  issueDate: string
  requisitionId: string
  requisitionDisplay: string
  storeId: string
  issuedTo: string
  remark: string
  status: string
}

function blankForm(): FormState {
  return {
    issueNo: AUTO_DOC_NO_LABEL,
    issueDate: todayIso(),
    requisitionId: '',
    requisitionDisplay: '',
    storeId: '',
    issuedTo: '',
    remark: '',
    status: '',
  }
}

export function IssuesPages() {
  return (
    <Routes>
      <Route index element={<IssueList />} />
      <Route path="pick-requisition" element={<PickRequisitionRoute />} />
      <Route path="new/:requisitionId" element={<IssueForm />} />
      <Route path="new" element={<Navigate to="../pick-requisition" replace />} />
      <Route path=":id" element={<IssueForm />} />
    </Routes>
  )
}

function PickRequisitionRoute() {
  const navigate = useNavigate()
  return (
    <>
      <IssueList />
      <RequisitionPickerModal
        open
        onClose={() => navigate(BASE)}
        onSelect={(reqId) => navigate(`${BASE}/new/${reqId}`)}
      />
    </>
  )
}

export function IssueList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const { rows, loading, error } = useTxnList(RESOURCE)
  const { locations, employees } = useTxnFormLookups()
  const reqs = useTxnList('requisitions')

  const empById = useMemo(() => new Map(employees.rows.map((e) => [e.id, e])), [employees.rows])
  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])
  const reqById = useMemo(() => new Map(reqs.rows.map((r) => [r.id, r])), [reqs.rows])

  const text = {
    store: (r: TxnRow) => {
      const l = locById.get(String(r.locationId ?? ''))
      return l ? locLabel(l) : '—'
    },
    issuedTo: (r: TxnRow) => {
      const e = empById.get(String(r.initiatedByEmpId ?? ''))
      return e ? empLabel(e) : '—'
    },
    requisition: (r: TxnRow) => {
      const ref = String(r.refTxnHeaderId ?? '')
      return reqById.get(ref)?.docNo ?? (ref || '—')
    },
  }

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Issue No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    { key: 'date', header: 'Issue Date', searchText: (r) => r.docDate, render: (r) => r.docDate || '—' },
    { key: 'req', header: 'Requisition', searchText: text.requisition, render: text.requisition },
    { key: 'store', header: 'Store', searchText: text.store, render: text.store },
    { key: 'to', header: 'Issued To', searchText: text.issuedTo, render: text.issuedTo },
    {
      key: 'items',
      header: 'Items',
      searchText: (r) => String(r.totalItems ?? 0),
      render: (r) => <span className="tabular-nums">{Number(r.totalItems ?? 0)}</span>,
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <StatusPill status={r.status || '—'} /> },
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Store Issues"
        description="Issue material from a store against a requested requisition."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading issues…</div>}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search issues…"
        onRowClick={(r) => navigate(`${BASE}/${r.id}`)}
        onAdd={canCreateMenu(MENU) ? () => navigate(`${BASE}/pick-requisition`) : undefined}
        addLabel="New Issue"
        emptyMessage="No issues yet. Use New Issue to post one."
      />
    </FadeContent>
  )
}

/* -------------------------------------------------------------- form ---- */

function IssueForm() {
  const { id, requisitionId: requisitionIdParam } = useParams()
  const navigate = useNavigate()
  const { canCreateMenu, canEditMenu } = useAuth()
  const isNew = Boolean(requisitionIdParam)
  const issueId = id && !requisitionIdParam ? id : undefined

  const { locations, employees, items, units } = useTxnFormLookups()

  const [form, setForm] = useState<FormState>(blankForm)
  const [lines, setLines] = useState<IssueLine[]>(() => [emptyLine()])
  const [pendingReqs, setPendingReqs] = useState<TxnRow[]>([])
  const [loading, setLoading] = useState(isNew || Boolean(issueId))
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
  // Material issue API is create-only; existing docs are view-only.
  const readOnly = !isNew || !canEdit || !statusEditable

  const requisitionLabel = form.requisitionDisplay || (() => {
    if (!form.requisitionId) return ''
    const hit = pendingReqs.find((r) => r.id === form.requisitionId)
    return hit ? `${hit.docNo} · ${hit.docDate || ''}` : `Req #${form.requisitionId}`
  })()

  const locationOptions = useMemo(() => toLocationOptions(locations.rows), [locations.rows])
  const employeeOptions = useMemo(() => toEmployeeOptions(employees.rows), [employees.rows])

  const addLocation = quickAddLocation(locations.reload)
  const addEmployee = quickAddEmployee(employees.reload)

  /* ---- pending requisitions for display labels on existing issues ---- */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const page = await api<PageResponse<TxnListItem>>('/material-issues/pending-requisitions')
        if (!cancelled) setPendingReqs((page.data ?? []).map(mapTxnListItem))
      } catch {
        if (!cancelled) setPendingReqs([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /* ---- load requisition for new issue from route ---- */
  useEffect(() => {
    if (!isNew || !requisitionIdParam) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        await onRequisitionChange(requisitionIdParam)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isNew, requisitionIdParam])

  /* ---- load existing document ---- */
  useEffect(() => {
    if (!issueId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const doc = await fetchTxn(RESOURCE, issueId)
        if (cancelled) return
        setForm({
          issueNo: doc.docNo ?? '',
          issueDate: doc.docDate ?? '',
          requisitionId: doc.refTxnHeaderId != null ? String(doc.refTxnHeaderId) : '',
          requisitionDisplay: '',
          storeId: doc.locationId != null ? String(doc.locationId) : '',
          issuedTo: doc.initiatedByEmpId != null ? String(doc.initiatedByEmpId) : '',
          remark: doc.remarks ?? '',
          status: doc.status ?? '',
        })
        const mapped = (doc.lines ?? []).map((l) => ({
          ...emptyLine(),
          itemId: l.itemId != null ? String(l.itemId) : '',
          itemCode: l.itemCode ?? '',
          itemName: l.itemName ?? '',
          uomId: l.uomId != null ? String(l.uomId) : '',
          requestedQty: l.requestedQty != null ? String(l.requestedQty) : '',
          issueQty: l.qty != null ? String(l.qty) : '',
          availableStock: l.availableStock != null ? String(l.availableStock) : '',
          batchLotNo: l.batchLotNo ?? '',
          locationId: l.locationId != null ? String(l.locationId) : '',
          remark: l.remark ?? '',
        }))
        setLines(mapped.length ? mapped : [emptyLine()])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [issueId])

  const onRequisitionChange = async (reqId: string) => {
    set('requisitionId', reqId)
    if (!reqId) return
    try {
      const doc = await fetchTxn('requisitions', reqId)
      setForm((p) => ({
        ...p,
        requisitionId: reqId,
        requisitionDisplay: `${doc.docNo ?? ''} · ${doc.docDate || ''}`.trim(),
        storeId: doc.locationId != null ? String(doc.locationId) : p.storeId,
        issuedTo: doc.initiatedByEmpId != null ? String(doc.initiatedByEmpId) : p.issuedTo,
      }))
      const storeLoc = doc.locationId != null ? String(doc.locationId) : ''
      const mapped = (doc.lines ?? []).map((l) => {
        const reqQty =
          l.requestedQty != null ? String(l.requestedQty) : l.qty != null ? String(l.qty) : ''
        return {
          ...emptyLine(),
          itemId: l.itemId != null ? String(l.itemId) : '',
          itemCode: l.itemCode ?? '',
          itemName: l.itemName ?? '',
          uomId: l.uomId != null ? String(l.uomId) : '',
          requestedQty: reqQty,
          issueQty: reqQty,
          availableStock: l.availableStock != null ? String(l.availableStock) : '',
          locationId: l.locationId != null ? String(l.locationId) : storeLoc,
          remark: l.remark ?? '',
        }
      })
      setLines(mapped.length ? enrichLinesFromItems(mapped, items.rows) : [emptyLine()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load requisition')
    }
  }

  /* ---- enrich lines once item master arrives ---- */
  useEffect(() => {
    if (!items.rows.length) return
    setLines((prev) => enrichLinesFromItems(prev, items.rows))
  }, [items.rows])

  /* ---- refresh stock when store changes ---- */
  useEffect(() => {
    if (readOnly || !form.storeId) return
    setLines((prev) =>
      prev.map((l) => ({
        ...l,
        locationId: l.itemId ? form.storeId : l.locationId,
      })),
    )
  }, [form.storeId, readOnly])

  const fieldDefs: ValidatableField[] = [
    { name: 'issueDate', label: 'Issue Date', required: true },
    { name: 'requisitionId', label: 'Against Requisition', required: true },
    { name: 'storeId', label: 'Store', required: true },
    { name: 'issuedTo', label: 'Issued To', required: true },
  ]

  const headerReady = useMemo(
    () => areRequiredFieldsFilled(fieldDefs, form as unknown as Record<string, unknown>),
    [form],
  )

  const errors = useMemo(() => {
    const e = validateFields(fieldDefs, form as unknown as Record<string, unknown>)
    const filled = lines.filter((l) => l.itemId !== '')
    if (filled.length === 0) e.lines = 'Add at least one item line.'
    else if (filled.some((l) => !l.issueQty || Number(l.issueQty) <= 0)) {
      e.lines = 'Every item line needs a positive issue quantity.'
    } else if (filled.some((l) => !l.uomId)) {
      e.lines = 'Every item line needs a UOM (pick a valid item).'
    }
    return e
  }, [form, lines])

  const err = (name: string) => (submitted || touched[name] ? errors[name] : undefined)

  const buildBody = (action: 'SAVE_DRAFT' | 'SUBMIT'): DocumentRequest => {
    const locationId = Number(form.storeId)
    return {
      docDate: form.issueDate,
      locationId,
      initiatedByEmpId: form.issuedTo ? Number(form.issuedTo) : undefined,
      refTxnHeaderId: form.requisitionId ? Number(form.requisitionId) : undefined,
      remarks: form.remark || undefined,
      docSubmitAction: action,
      lines: lines
        .filter((l) => l.itemId !== '')
        .map((l, i) => {
          const qty = Number(l.issueQty || 0)
          return {
            srNo: i + 1,
            itemId: Number(l.itemId),
            uomId: l.uomId ? Number(l.uomId) : undefined,
            requestedQty: l.requestedQty === '' ? undefined : Number(l.requestedQty),
            qty,
            availableStock: l.availableStock === '' ? undefined : Number(l.availableStock),
            batchLotNo: l.batchLotNo || undefined,
            locationId: l.locationId ? Number(l.locationId) : locationId,
            remark: l.remark || undefined,
          }
        }),
    }
  }

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
      const created = await createTxn(RESOURCE, body)
      const docId = (created as { docId?: number })?.docId
      setMessage(action === 'SUBMIT' ? 'Issue submitted — stock posted.' : 'Issue saved as draft.')
      if (docId != null) navigate(`${BASE}/${docId}`, { replace: true })
      else navigate(BASE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (isNew && !requisitionIdParam) return <Navigate to={`${BASE}/pick-requisition`} replace />
  if (issueId && !/^\d+$/.test(issueId)) return <Navigate to={BASE} replace />
  if (isNew && !canCreateMenu(MENU)) return <Navigate to={BASE} replace />

  if (loading) {
    return (
      <FadeContent>
        <div className="text-sm text-[var(--text3)]">Loading issue…</div>
      </FadeContent>
    )
  }

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeader
            title={isNew ? 'New Store Issue' : `Issue ${form.issueNo}`}
            description="Issue material from a store against a requested requisition."
          />
          {form.status && (
            <div className="mt-1">
              <StatusPill status={form.status} />
            </div>
          )}
          {!isNew && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              Posted issues are view-only. Create a new issue to post further stock.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(BASE)}>
          ← Back to List
        </Button>
      </div>

      <Card>
        <CardHeader title="Issue Details" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Issue No." required hint={isNew ? 'Auto-generated on save (STIS-2026-0001)' : undefined}>
              <Input value={form.issueNo} readOnly />
            </Field>

            <Field label="Issue Date" required error={err('issueDate')}>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) => set('issueDate', e.target.value)}
                onBlur={() => touch('issueDate')}
                disabled={readOnly}
                invalid={Boolean(err('issueDate'))}
              />
            </Field>

            <Field label="Against Requisition" required error={err('requisitionId')}>
              <Input value={requisitionLabel} readOnly placeholder="—" />
            </Field>

            <LookupSelect
              label="Store"
              required
              value={form.storeId}
              onChange={(v) => set('storeId', v)}
              onBlur={() => touch('storeId')}
              options={locationOptions}
              placeholder="— Select Store —"
              error={err('storeId')}
              disabled={readOnly}
              quickAdd={addLocation}
            />

            <LookupSelect
              label="Issued To"
              required
              value={form.issuedTo}
              onChange={(v) => set('issuedTo', v)}
              onBlur={() => touch('issuedTo')}
              options={employeeOptions}
              placeholder="— Select Employee —"
              error={err('issuedTo')}
              disabled={readOnly}
              quickAdd={addEmployee}
            />

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

      <div className="mt-3">
        <IssueItemLines
          lines={lines}
          onChange={setLines}
          items={itemsForLocation(items.rows, form.storeId)}
          units={units.rows}
          locations={locations.rows}
          storeLocationId={form.storeId}
          readOnly={readOnly}
          headerReady={headerReady}
          error={submitted ? errors.lines : undefined}
        />
      </div>

      {error && <div className="mt-2 text-[12.5px] font-medium text-[var(--danger)]">{error}</div>}
      {message && <div className="mt-2 text-[12.5px] font-medium text-[var(--accent)]">{message}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex-1" />
        {!readOnly && (
          <Button
            variant="danger"
            onClick={() => {
              setForm(blankForm())
              setLines([emptyLine()])
              setSubmitted(false)
              setTouched({})
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
              {saving ? 'Saving…' : 'Submit Issue'}
            </Button>
          </>
        )}
      </div>
    </FadeContent>
  )
}
