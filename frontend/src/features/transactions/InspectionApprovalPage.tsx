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
import { mapEntity, useMasterList } from '@/api/masters'
import {
  deleteTxn,
  fetchTxn,
  fetchTxnPrint,
  numOrUndef,
  syncInspectionApprovalsFromGrn,
  todayIso,
  updateTxn,
  useTxnList,
  type DocumentRequest,
  type TxnDocument,
  type TxnRow,
} from '@/api/transactions'
import { filterRowsByStatus, txnStatusFilterOptions } from '@/lib/listOrder'
import { useAuth } from '@/features/auth/AuthContext'
import { validateFields, areRequiredFieldsFilled, type ValidatableField } from '@/features/masters/validation'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import { AttachmentLink, AttachmentSection, attachmentPayload } from './AttachmentSection'
import { enrichLinesFromItems, toNum, wholeQtyStr } from './lineGrid'
import type { ApiMasterRow } from '@/api/masters'
import {
  emptyInspectionLine,
  InspectionItemLines,
  type InspectionLine,
} from './InspectionItemLines'
import {
  empLabel,
  locLabel,
  useTxnFormLookups,
} from './txnLookups'

const BASE = '/transactions/inspection-approvals'
const MENU = 'IAPR'
const RESOURCE = 'inspection-approvals'

type FormState = {
  approvalNo: string
  approvalDate: string
  orgId: string
  sourceQuarantineId: string
  refTxnHeaderId: string
  referenceNo: string
  initiatedByEmpId: string
  remark: string
  attachmentUrl: string
  attachmentName: string
  status: string
}

function blankForm(): FormState {
  return {
    approvalNo: AUTO_DOC_NO_LABEL,
    approvalDate: todayIso(),
    orgId: '',
    sourceQuarantineId: '',
    refTxnHeaderId: '',
    referenceNo: '',
    initiatedByEmpId: '',
    remark: '',
    attachmentUrl: '',
    attachmentName: '',
    status: '',
  }
}

export function InspectionApprovalPages() {
  return (
    <Routes>
      <Route index element={<InspectionApprovalList />} />
      <Route path="new" element={<Navigate to={BASE} replace />} />
      <Route path=":id" element={<InspectionApprovalForm />} />
    </Routes>
  )
}

function enrichInspectionLines(
  lines: InspectionLine[],
  items: ApiMasterRow[],
): InspectionLine[] {
  const enriched = enrichLinesFromItems(lines, items)
  let changed = enriched !== lines
  const next = enriched.map((line) => {
    if (!line.itemId) return line
    const item = items.find((i) => String(i.id) === String(line.itemId))
    if (!item) return line
    const homeId = String(item.store ?? '')
    if (!homeId) return line
    if (line.locationId === homeId) return line
    changed = true
    return { ...line, locationId: homeId }
  })
  return changed ? next : lines
}

function mapLoadedInspectionLines(
  docLines: NonNullable<Awaited<ReturnType<typeof fetchTxn>>['lines']>,
): InspectionLine[] {
  return docLines.map((line, i) => ({
    ...emptyInspectionLine(),
    key: `line-${i}`,
    itemId: line.itemId != null ? String(line.itemId) : '',
    itemCode: line.itemCode ?? '',
    itemName: line.itemName ?? '',
    uomId: line.uomId != null ? String(line.uomId) : '',
    locationId: line.locationId != null ? String(line.locationId) : '',
    approveQty: wholeQtyStr(line.qty),
    batchLotNo: line.batchLotNo ?? '',
    serialNo: line.serialNo ?? '',
    availableStock: wholeQtyStr(line.availableStock),
  }))
}

function resolveHeaderQuarantineId(sourceQuarantineId: string): string {
  return sourceQuarantineId || ''
}

const EDITABLE_STATUSES = ['', 'Pending', 'Draft']

function InspectionApprovalList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [view, setView] = useState<'all-pending' | 'my-pending' | 'all'>('my-pending')
  const [syncing, setSyncing] = useState(false)
  const myEmployeeId = user?.employeeId
  const listEnabled = view !== 'my-pending' || Boolean(myEmployeeId)
  const listOptions = {
    enabled: listEnabled,
    status: view === 'all' ? undefined : 'Pending',
    initiatedByEmpId: view === 'my-pending' && myEmployeeId ? myEmployeeId : undefined,
  }
  const { rows, loading, error, reload } = useTxnList(RESOURCE, listOptions)
  const [statusFilter, setStatusFilter] = useState('')
  const statusOptions = useMemo(() => txnStatusFilterOptions(rows), [rows])
  const filteredRows = useMemo(() => filterRowsByStatus(rows, statusFilter), [rows, statusFilter])
  const { locations, employees } = useTxnFormLookups()

  const onSyncFromGrn = async () => {
    setSyncing(true)
    try {
      await syncInspectionApprovalsFromGrn()
      await reload()
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(false)
    }
  }

  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])
  const empById = useMemo(() => new Map(employees.rows.map((e) => [e.id, e])), [employees.rows])

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Approval No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    { key: 'date', header: 'Date', searchText: (r) => r.docDate, render: (r) => r.docDate || '—' },
    {
      key: 'grn',
      header: 'GRN Ref.',
      searchText: (r) => String((r as { referenceNo?: string }).referenceNo ?? ''),
      render: (r) => String((r as { referenceNo?: string }).referenceNo ?? '') || '—',
    },
    {
      key: 'inspector',
      header: 'Assigned To',
      searchText: (r) => {
        const e = empById.get(r.initiatedByEmpId ?? '')
        return e ? empLabel(e) : ''
      },
      render: (r) => {
        const e = empById.get(r.initiatedByEmpId ?? '')
        return e ? empLabel(e) : '—'
      },
    },
    {
      key: 'store',
      header: 'Quarantine',
      searchText: (r) => String(r.locationId ?? ''),
      render: (r) => {
        const l = locById.get(String(r.locationId ?? ''))
        return l ? locLabel(l) : '—'
      },
    },
    {
      key: 'items',
      header: 'Items',
      searchText: (r) => String(r.totalItems ?? 0),
      render: (r) => <span className="tabular-nums">{Number(r.totalItems ?? 0)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      searchText: (r) => r.status,
      render: (r) => <StatusPill status={r.status || '—'} />,
    },
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
        title="Inspection Approval"
        description="GRN items flagged for inspection are posted to Quarantine on submit. A pending approval is auto-created for the GRN inspector — approve here to move stock to each item's home store."
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant={view === 'my-pending' ? 'primary' : 'ghost'}
          onClick={() => setView('my-pending')}
        >
          My Assigned
        </Button>
        <Button
          variant={view === 'all-pending' ? 'primary' : 'ghost'}
          onClick={() => setView('all-pending')}
        >
          All Pending
        </Button>
        <Button variant={view === 'all' ? 'primary' : 'ghost'} onClick={() => setView('all')}>
          All History
        </Button>
        <Button variant="ghost" disabled={syncing} onClick={() => void onSyncFromGrn()}>
          {syncing ? 'Syncing…' : 'Sync from GRN'}
        </Button>
      </div>
      {!myEmployeeId && view === 'my-pending' && (
        <div className="mb-2 text-[12px] text-[var(--text3)]">
          Your login is not linked to an employee record — use All Pending or ask an admin to link your user to the
          Inspected By employee.
        </div>
      )}
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading approvals…</div>}
      <DataTable
        columns={columns}
        rows={filteredRows}
        searchPlaceholder="Search approvals…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            options: statusOptions,
            onChange: setStatusFilter,
          },
        ]}
        onRowClick={(r) => navigate(`${BASE}/${r.id}`)}
        emptyMessage={
          view === 'my-pending'
            ? 'No pending inspections assigned to you. Tasks are created for the GRN Inspected By employee — try All Pending or log in as that inspector.'
            : view === 'all-pending'
              ? 'No pending inspections. Submit a GRN with Inspection needed items, accepted qty, and Inspected By filled in.'
              : 'No inspection approvals yet.'
        }
      />
    </FadeContent>
  )
}

function InspectionApprovalForm() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const {
    canEditMenu,
    canApproveMenu,
    canRejectMenu,
    canDeleteMenu,
    user,
  } = useAuth()
  const isNew = id === 'new'

  const { locations, items, units, employees } = useTxnFormLookups()
  const { rows: orgs } = useMasterList('entities', mapEntity)

  const [form, setForm] = useState<FormState>(blankForm)
  const [lines, setLines] = useState<InspectionLine[]>(() => [emptyInspectionLine()])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }))
  const touch = (key: string) => setTouched((p) => ({ ...p, [key]: true }))

  const statusEditable = EDITABLE_STATUSES.includes(form.status)
  const canEdit = canEditMenu(MENU)
  const canApprove = canApproveMenu(MENU) || canEdit
  const canReject = canRejectMenu(MENU) || canEdit
  const canDelete = canDeleteMenu(MENU) || canEdit
  const readOnly = !canEdit || (!isNew && !statusEditable)
  const assigneeMismatch =
    form.initiatedByEmpId &&
    user?.employeeId &&
    String(form.initiatedByEmpId) !== String(user.employeeId)

  const locById = useMemo(
    () => new Map(locations.rows.map((l) => [l.id, l])),
    [locations.rows],
  )
  const empById = useMemo(
    () => new Map(employees.rows.map((e) => [e.id, e])),
    [employees.rows],
  )
  const quarantineLabel = useMemo(() => {
    const loc = locById.get(form.sourceQuarantineId)
    return loc ? locLabel(loc) : form.sourceQuarantineId || '—'
  }, [form.sourceQuarantineId, locById])
  const assigneeLabel = useMemo(() => {
    const e = empById.get(form.initiatedByEmpId)
    return e ? empLabel(e) : form.initiatedByEmpId || '—'
  }, [form.initiatedByEmpId, empById])

  const orgOptions = useMemo(
    () => orgs.map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` })),
    [orgs],
  )

  useEffect(() => {
    if (!isNew) return
    if (!form.orgId && orgs.length === 1) set('orgId', orgs[0].id)
  }, [isNew, form.orgId, orgs])

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const doc = await fetchTxn(RESOURCE, id)
        if (cancelled) return
        setForm({
          approvalNo: doc.docNo ?? '',
          approvalDate: doc.docDate ?? '',
          orgId: doc.entityId != null ? String(doc.entityId) : '',
          sourceQuarantineId: doc.locationId != null ? String(doc.locationId) : '',
          refTxnHeaderId: doc.refTxnHeaderId != null ? String(doc.refTxnHeaderId) : '',
          referenceNo: doc.referenceNo ?? '',
          initiatedByEmpId: doc.initiatedByEmpId != null ? String(doc.initiatedByEmpId) : '',
          remark: doc.remarks ?? '',
          attachmentUrl: doc.attachmentUrl ?? '',
          attachmentName: doc.attachmentName ?? '',
          status: doc.status ?? '',
        })
        const loaded = mapLoadedInspectionLines(doc.lines ?? [])
        setLines(loaded.length > 0 ? loaded : [emptyInspectionLine()])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  useEffect(() => {
    if (items.rows.length === 0) return
    setLines((prev) => {
      const next = enrichInspectionLines(prev, items.rows)
      return next === prev ? prev : next
    })
  }, [items.rows])

  const headerFields: ValidatableField[] = [
    { name: 'approvalDate', label: 'Approval Date', required: true },
    { name: 'orgId', label: 'Organization', required: isNew },
  ]

  const headerReady =
    areRequiredFieldsFilled(headerFields, form as unknown as Record<string, unknown>) &&
    lines.some((l) => l.itemId)

  const errors = useMemo(() => {
    const base = validateFields(headerFields, form as unknown as Record<string, unknown>)
    const lineErrors: Record<string, string> = {}
    const active = lines.filter((l) => l.itemId)
    if (active.length === 0) lineErrors.lines = 'Add at least one item line.'
    for (const line of active) {
      const qty = toNum(line.approveQty)
      const avail = toNum(line.availableStock)
      if (!line.locationId) lineErrors.lines = 'Each line needs a home store from Item Master.'
      if (qty <= 0) lineErrors.lines = 'Approve quantity must be greater than zero.'
      if (avail > 0 && qty !== avail) {
        lineErrors.lines = 'Approve the full quarantine quantity (partial approval is not allowed).'
      }
    }
    return { ...base, ...lineErrors }
  }, [form, lines])

  const err = (key: string) => (submitted || touched[key] ? (errors[key] ?? '') : '')

  const buildBody = (action: 'SAVE_DRAFT' | 'SUBMIT' | 'REJECT'): DocumentRequest => {
    const headerQuarantine = resolveHeaderQuarantineId(form.sourceQuarantineId)
    return {
      docDate: form.approvalDate,
      entityId: numOrUndef(form.orgId),
      locationId: headerQuarantine ? Number(headerQuarantine) : undefined,
      refTxnHeaderId: form.refTxnHeaderId ? Number(form.refTxnHeaderId) : undefined,
      referenceNo: form.referenceNo || undefined,
      initiatedByEmpId: form.initiatedByEmpId ? Number(form.initiatedByEmpId) : undefined,
      remarks: form.remark || undefined,
      ...attachmentPayload(form.attachmentUrl, form.attachmentName),
      docSubmitAction: action,
      lines: lines
        .filter((l) => l.itemId)
        .map((l, i) => ({
          srNo: i + 1,
          itemId: Number(l.itemId),
          uomId: l.uomId ? Number(l.uomId) : undefined,
          qty: toNum(l.approveQty),
          batchLotNo: l.batchLotNo || undefined,
          serialNo: l.serialNo || undefined,
          locationId: l.locationId ? Number(l.locationId) : undefined,
        })),
    }
  }

  const save = async (action: 'SAVE_DRAFT' | 'SUBMIT' | 'REJECT') => {
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
      if (!body.locationId && !form.refTxnHeaderId) {
        setError('Could not resolve quarantine store for stock release. Set move-to store on each line.')
        setSaving(false)
        return
      }
      if (isNew) {
        setError('Inspection approvals are created automatically from GRN submit.')
        setSaving(false)
        return
      } else {
        const updated = await updateTxn(RESOURCE, id, body) as TxnDocument
        if (action === 'SUBMIT' && updated.status !== 'Approved') {
          setError(`Approval did not complete — status is still ${updated.status ?? 'Pending'}.`)
          setForm((p) => ({ ...p, status: updated.status ?? p.status }))
          return
        }
        if (action === 'REJECT' && updated.status !== 'Rejected') {
          setError(`Rejection did not complete — status is still ${updated.status ?? 'Pending'}.`)
          setForm((p) => ({ ...p, status: updated.status ?? p.status }))
          return
        }
        setForm((p) => ({ ...p, status: updated.status ?? p.status }))
        setMessage(
          action === 'SUBMIT'
            ? 'Inspection approved — stock moved to home stores.'
            : action === 'REJECT'
              ? 'Inspection rejected — stock moved to Rejected store.'
              : 'Saved as draft.',
        )
        if (action === 'SUBMIT' || action === 'REJECT') navigate(BASE)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!canDelete || isNew) return
    if (!window.confirm('Delete this pending inspection approval? Stock stays in quarantine.')) return
    setSaving(true)
    setError(null)
    try {
      await deleteTxn(RESOURCE, id)
      navigate(BASE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const onPrint = async () => {
    if (isNew) return
    try {
      const doc = await fetchTxnPrint(RESOURCE, id)
      const text = JSON.stringify(doc, null, 2)
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(`<pre>${text.replace(/</g, '&lt;')}</pre>`)
        w.document.close()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Print failed')
    }
  }

  if (id !== 'new' && !/^\d+$/.test(id)) return <Navigate to={BASE} replace />
  if (isNew) return <Navigate to={BASE} replace />

  if (loading) {
    return (
      <FadeContent>
        <div className="text-sm text-[var(--text3)]">Loading approval…</div>
      </FadeContent>
    )
  }

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeader
            title={isNew ? 'New Inspection Approval' : `Approval ${form.approvalNo}`}
            description="Approve quarantined stock and move it to each item's home store."
          />
          {form.status && (
            <div className="mt-1">
              <StatusPill status={form.status} />
            </div>
          )}
          {!isNew && !statusEditable && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              Approved inspections are view-only.
            </div>
          )}
          {!isNew && statusEditable && canEdit && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              Open a GRN-linked pending approval, then Approve & Move Stock to release items from Quarantine.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(BASE)}>← Back to List</Button>
      </div>

      <Card>
        <CardHeader title="Approval Details" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Approval No." required hint={isNew ? 'Auto-generated on save (INSP-2026-0001)' : undefined}>
              <Input value={form.approvalNo} readOnly />
            </Field>
            <Field label="Approval Date" required error={err('approvalDate')}>
              <Input
                type="date"
                value={form.approvalDate}
                onChange={(e) => set('approvalDate', e.target.value)}
                onBlur={() => touch('approvalDate')}
                disabled={readOnly}
                invalid={Boolean(err('approvalDate'))}
              />
            </Field>
            <LookupSelect
              label="Organization"
              required={isNew}
              value={form.orgId}
              onChange={(v) => set('orgId', v)}
              onBlur={() => touch('orgId')}
              options={orgOptions}
              placeholder="— Select Organization —"
              error={err('orgId')}
              disabled={readOnly || !isNew}
            />
            <Field label="GRN Reference">
              <Input value={form.referenceNo || '—'} readOnly />
            </Field>
            <Field label="Quarantine Store">
              <Input value={quarantineLabel} readOnly />
            </Field>
            <Field label="Assigned Inspector">
              <Input value={assigneeLabel} readOnly />
            </Field>
            {assigneeMismatch && statusEditable && (
              <Field label="Note" className="md:col-span-2">
                <div className="text-[12px] text-[var(--warning)]">
                  This task is assigned to another inspector. Only they (or ADMIN) can approve or reject.
                </div>
              </Field>
            )}
            <Field label="Remark" className="md:col-span-2 xl:col-span-3">
              <Textarea
                value={form.remark}
                onChange={(e) => set('remark', e.target.value)}
                disabled={readOnly}
                rows={2}
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
        subtitle="GRN supporting file is copied here — add or replace the inspection report if needed"
      />

      <InspectionItemLines
        lines={lines}
        onChange={setLines}
        items={items.rows}
        units={units.rows}
        locations={locations.rows}
        sourceQuarantineId={form.sourceQuarantineId}
        quarantineLabel={quarantineLabel !== '—' ? quarantineLabel : undefined}
        readOnly={readOnly}
        headerReady={headerReady}
        error={submitted ? errors.lines : undefined}
      />

      {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
      {message && <div className="mt-3 text-sm text-[var(--success)]">{message}</div>}

      {!readOnly && (canApprove || canReject) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canApprove && (
            <Button variant="primary" disabled={saving} onClick={() => void save('SUBMIT')}>
              Approve & Move Stock
            </Button>
          )}
          {canReject && (
            <Button variant="ghost" disabled={saving} onClick={() => void save('REJECT')}>
              Reject & Move to Rejected Store
            </Button>
          )}
        </div>
      )}
      {!readOnly && canDelete && form.refTxnHeaderId && (
        <div className="mt-2">
          <Button variant="ghost" disabled={saving} onClick={() => void onDelete()}>
            Delete Pending Approval
          </Button>
        </div>
      )}
      {!isNew && (form.status === 'Approved' || form.status === 'Rejected') && (
        <div className="mt-4">
          <Button variant="ghost" onClick={() => void onPrint()}>Print</Button>
        </div>
      )}
    </FadeContent>
  )
}
