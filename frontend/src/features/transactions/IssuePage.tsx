import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { LookupSelect } from '@/components/form/LookupSelect'
import { api, type PageResponse } from '@/api/client'
import { fetchDepartmentMappedLocation, mapDepartment, useMasterList } from '@/api/masters'
import {
  createTxn,
  fetchTxn,
  mapTxnListItem,
  todayIso,
  updateTxn,
  useTxnList,
  type DocumentRequest,
  type TxnListItem,
  type TxnRow,
} from '@/api/transactions'
import { filterRowsByStatus, txnStatusFilterOptions } from '@/lib/listOrder'
import { useAuth } from '@/features/auth/AuthContext'
import { validateFields, areRequiredFieldsFilled, type ValidatableField } from '@/features/masters/validation'
import { IssueItemLines, emptyLine, type IssueLine } from './IssueItemLines'
import { enrichLinesFromItems, wholeQtyStr } from './lineGrid'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import { AttachmentLink, AttachmentSection, attachmentPayload } from './AttachmentSection'
import {
  empLabel,
  employeeOptions as toEmployeeOptions,
  itemsForLocation,
  locLabel,
  locationOptions as toLocationOptions,
  nonSystemLocations,
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
  toLocationId: string
  reqSubtype: string
  departmentId: string
  departmentName: string
  remark: string
  attachmentUrl: string
  attachmentName: string
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
    toLocationId: '',
    reqSubtype: '',
    departmentId: '',
    departmentName: '',
    remark: '',
    attachmentUrl: '',
    attachmentName: '',
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
  const [statusFilter, setStatusFilter] = useState('')
  const statusOptions = useMemo(() => txnStatusFilterOptions(rows), [rows])
  const filteredRows = useMemo(() => filterRowsByStatus(rows, statusFilter), [rows, statusFilter])
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
        title="Store Issues"
        description="Issue material from a store against a requested requisition."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading issues…</div>}
      <DataTable
        columns={columns}
        rows={filteredRows}
        searchPlaceholder="Search issues…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            options: statusOptions,
            onChange: setStatusFilter,
          },
        ]}
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
  const { rows: deptRows } = useMasterList('departments', mapDepartment)
  const deptById = useMemo(() => new Map(deptRows.map((d) => [d.id, d])), [deptRows])

  const [form, setForm] = useState<FormState>(blankForm)
  const [lines, setLines] = useState<IssueLine[]>(() => [emptyLine()])
  const [pendingReqs, setPendingReqs] = useState<TxnRow[]>([])
  const [loading, setLoading] = useState(isNew || Boolean(issueId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  /** Shown for 5s after a successful issue submit before navigating away. */
  const [issuedPopup, setIssuedPopup] = useState<{ docId?: number; docNo?: string } | null>(null)
  /** Mapped department location injected into To Location options when not in the user's location list. */
  const [deptToLocationOption, setDeptToLocationOption] = useState<{
    value: string
    label: string
  } | null>(null)
  /** Item IDs from the selected requisition — Issue picker only lists these. */
  const [requestedItemIds, setRequestedItemIds] = useState<string[]>([])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }))
  const touch = (key: string) => setTouched((p) => ({ ...p, [key]: true }))

  const canEdit = isNew ? canCreateMenu(MENU) : canEditMenu(MENU)
  const statusEditable = EDITABLE_STATUSES.includes(form.status)
  const headerLocked = !isNew || !canEdit || (!isNew && !statusEditable)
  const readOnly = headerLocked
  const lockStockFields = !isNew
  const assetReadOnly = !isNew && !canEdit

  const requisitionLabel = form.requisitionDisplay || (() => {
    if (!form.requisitionId) return ''
    const hit = pendingReqs.find((r) => r.id === form.requisitionId)
    return hit ? `${hit.docNo} · ${hit.docDate || ''}` : `Req #${form.requisitionId}`
  })()

  const locationOptions = useMemo(() => {
    const base = toLocationOptions(nonSystemLocations(locations.rows))
    if (deptToLocationOption && !base.some((o) => o.value === deptToLocationOption.value)) {
      return [deptToLocationOption, ...base]
    }
    if (form.toLocationId && !base.some((o) => o.value === form.toLocationId)) {
      const loc = locations.rows.find((l) => l.id === form.toLocationId)
      if (loc) return [{ value: loc.id, label: locLabel(loc) }, ...base]
    }
    return base
  }, [locations.rows, deptToLocationOption, form.toLocationId])
  const lineLocations = useMemo(() => nonSystemLocations(locations.rows), [locations.rows])
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

  const issueItems = useMemo(() => {
    const atStore = itemsForLocation(items.rows, form.storeId)
    if (requestedItemIds.length === 0) return atStore
    const idSet = new Set(requestedItemIds)
    const matched = atStore.filter((i) => idSet.has(i.id))
    const missing = requestedItemIds
      .filter((id) => !matched.some((i) => i.id === id))
      .map((id) => items.rows.find((i) => i.id === id))
      .filter((row): row is (typeof items.rows)[number] => Boolean(row))
    return [...matched, ...missing]
  }, [items.rows, form.storeId, requestedItemIds])

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
          toLocationId: doc.toLocationId != null ? String(doc.toLocationId) : '',
          reqSubtype: doc.docSubtype ?? '',
          departmentId: doc.departmentId != null ? String(doc.departmentId) : '',
          departmentName:
            doc.departmentId != null
              ? String(deptById.get(String(doc.departmentId))?.name ?? '')
              : '',
          remark: doc.remarks ?? '',
          attachmentUrl: doc.attachmentUrl ?? '',
          attachmentName: doc.attachmentName ?? '',
          status: doc.status ?? '',
        })
        if (
          (doc.docSubtype ?? '').toUpperCase() === 'DEPARTMENT' &&
          doc.departmentId != null
        ) {
          void applyDepartmentToLocation(String(doc.departmentId), doc.departmentLocationId).then(
            (locId) => {
              if (locId) setForm((p) => (p.toLocationId ? p : { ...p, toLocationId: locId }))
            },
          )
        } else {
          setDeptToLocationOption(null)
        }
        const mapped = (doc.lines ?? []).map((l) => ({
          ...emptyLine(),
          detailId: l.detailId,
          itemId: l.itemId != null ? String(l.itemId) : '',
          itemCode: l.itemCode ?? '',
          itemName: l.itemName ?? '',
          uomId: l.uomId != null ? String(l.uomId) : '',
          requestedQty: wholeQtyStr(l.requestedQty),
          issueQty: wholeQtyStr(l.qty),
          availableStock: wholeQtyStr(l.availableStock),
          batchLotNo: l.batchLotNo ?? '',
          serialNo: l.serialNo ?? '',
          ipAddress: l.ipAddress ?? '',
          macAddress: l.macAddress ?? '',
          hostname: l.hostname ?? '',
          itemType: l.itemType ?? '',
          locationId: l.locationId != null ? String(l.locationId) : '',
          remark: l.remark ?? '',
        }))
        setLines(mapped.length ? mapped : [emptyLine()])
        setRequestedItemIds(
          mapped.map((l) => l.itemId).filter((id): id is string => Boolean(id)),
        )
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [issueId, deptById])

  /** Keep To Location aligned with the department's mapped location (department master). */
  useEffect(() => {
    if (!isNew || !form.departmentId) return
    if ((form.reqSubtype ?? '').toUpperCase() !== 'DEPARTMENT') return
    let cancelled = false
    ;(async () => {
      const mapped = await fetchDepartmentMappedLocation(form.departmentId, deptById)
      if (cancelled || !mapped?.locationId) return
      const loc = locations.rows.find((l) => l.id === mapped.locationId)
      const label =
        loc != null
          ? locLabel(loc)
          : mapped.locationCode && mapped.locationName
            ? `${mapped.locationCode} – ${mapped.locationName}`
            : mapped.locationCode || mapped.locationName || mapped.locationId
      setDeptToLocationOption({ value: mapped.locationId, label })
      setForm((p) =>
        p.toLocationId === mapped.locationId ? p : { ...p, toLocationId: mapped.locationId },
      )
    })()
    return () => {
      cancelled = true
    }
  }, [form.departmentId, form.reqSubtype, isNew, deptRows, deptById, locations.rows])

  const applyDepartmentToLocation = async (
    departmentId: string,
    docDepartmentLocationId?: number | null,
  ): Promise<string> => {
    const mapped = await fetchDepartmentMappedLocation(departmentId, deptById)
    const targetId =
      mapped?.locationId ||
      (docDepartmentLocationId != null ? String(docDepartmentLocationId) : '')
    if (!targetId) return ''

    const loc = locations.rows.find((l) => l.id === targetId)
    const code = String(loc?.code ?? mapped?.locationCode ?? '')
    const name = String(loc?.name ?? mapped?.locationName ?? '')
    const label = code && name ? `${code} – ${name}` : code || name || targetId
    setDeptToLocationOption({ value: targetId, label })
    return targetId
  }

  const onRequisitionChange = async (reqId: string) => {
    set('requisitionId', reqId)
    if (!reqId) return
    try {
      const doc = await fetchTxn('requisitions', reqId)
      const subtype = (doc.docSubtype ?? '').toUpperCase()
      let toLocationId = ''
      if (subtype === 'EMPLOYEE' && doc.initiatedByEmpId != null) {
        const emp = employees.rows.find((e) => e.id === String(doc.initiatedByEmpId))
        toLocationId = String(emp?.baseStore ?? '')
        setDeptToLocationOption(null)
      }
      const deptId = doc.departmentId != null ? String(doc.departmentId) : ''
      if (!toLocationId && deptId && subtype !== 'EMPLOYEE') {
        toLocationId = await applyDepartmentToLocation(deptId, doc.departmentLocationId)
      }
      if (!toLocationId && doc.locationId != null) {
        toLocationId = String(doc.locationId)
      }
      const deptRow = deptId ? deptById.get(deptId) : undefined
      setForm((p) => ({
        ...p,
        requisitionId: reqId,
        requisitionDisplay: `${doc.docNo ?? ''} · ${doc.docDate || ''}`.trim(),
        storeId: doc.locationId != null ? String(doc.locationId) : p.storeId,
        issuedTo: doc.initiatedByEmpId != null ? String(doc.initiatedByEmpId) : p.issuedTo,
        reqSubtype: subtype || p.reqSubtype,
        departmentId: deptId || p.departmentId,
        departmentName: deptRow?.name ? String(deptRow.name) : p.departmentName,
        toLocationId: toLocationId || p.toLocationId,
      }))
      const storeLoc = doc.locationId != null ? String(doc.locationId) : ''
      const mapped = (doc.lines ?? []).map((l) => {
        const reqQty =
          l.requestedQty != null
            ? wholeQtyStr(l.requestedQty)
            : l.qty != null
              ? wholeQtyStr(l.qty)
              : ''
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
          itemType: l.itemType ?? '',
          remark: l.remark ?? '',
        }
      })
      setRequestedItemIds(
        mapped.map((l) => l.itemId).filter((id): id is string => Boolean(id)),
      )
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

  const fieldDefs = useMemo<ValidatableField[]>(() => {
    const base: ValidatableField[] = [
      { name: 'issueDate', label: 'Issue Date', required: true },
      { name: 'requisitionId', label: 'Against Requisition', required: true },
      { name: 'storeId', label: 'From Location', required: true },
      { name: 'toLocationId', label: 'To Location', required: true },
    ]
    if (form.reqSubtype !== 'DEPARTMENT') {
      base.push({ name: 'issuedTo', label: 'Issued To', required: true })
    }
    return base
  }, [form.reqSubtype])

  const headerReady = useMemo(
    () => areRequiredFieldsFilled(fieldDefs, form as unknown as Record<string, unknown>),
    [form, fieldDefs],
  )

  const errors = useMemo(() => {
    const e = validateFields(fieldDefs, form as unknown as Record<string, unknown>)
    const filled = lines.filter((l) => l.itemId !== '')
    if (filled.length === 0) e.lines = 'Add at least one item line.'
    else if (filled.some((l) => !l.issueQty || Number(l.issueQty) <= 0)) {
      e.lines = 'Every item line needs a positive issue quantity.'
    } else if (filled.some((l) => !l.uomId)) {
      e.lines = 'Every item line needs a UOM (pick a valid item).'
    } else if (
      filled.some((l) => {
        const kind = l.itemType || items.rows.find((i) => i.id === l.itemId)?.itemType
        return kind === 'asset' && !String(l.serialNo ?? '').trim()
      })
    ) {
      e.lines = 'Serial No. is required on every asset line.'
    }
    return e
  }, [form, lines, items.rows, fieldDefs])

  const err = (name: string) => (submitted || touched[name] ? errors[name] : undefined)

  const buildBody = (action: 'SAVE_DRAFT' | 'SUBMIT'): DocumentRequest => {
    const locationId = Number(form.storeId)
    return {
      docDate: form.issueDate,
      locationId,
      fromLocationId: locationId,
      toLocationId: form.toLocationId ? Number(form.toLocationId) : undefined,
      initiatedByEmpId: form.issuedTo ? Number(form.issuedTo) : undefined,
      departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      docSubtype: form.reqSubtype || undefined,
      refTxnHeaderId: form.requisitionId ? Number(form.requisitionId) : undefined,
      remarks: form.remark || undefined,
      ...attachmentPayload(form.attachmentUrl, form.attachmentName),
      docSubmitAction: action,
      lines: lines
        .filter((l) => l.itemId !== '')
        .map((l, i) => {
          const qty = Number(l.issueQty || 0)
          return {
            srNo: i + 1,
            detailId: l.detailId,
            itemId: Number(l.itemId),
            uomId: l.uomId ? Number(l.uomId) : undefined,
            requestedQty: l.requestedQty === '' ? undefined : Number(l.requestedQty),
            qty,
            availableStock: l.availableStock === '' ? undefined : Number(l.availableStock),
            batchLotNo: l.batchLotNo || undefined,
            serialNo: l.serialNo || undefined,
            ipAddress: l.ipAddress || undefined,
            macAddress: l.macAddress || undefined,
            hostname: l.hostname || undefined,
            locationId: l.locationId ? Number(l.locationId) : locationId,
            issuedToEmpId: form.issuedTo ? Number(form.issuedTo) : undefined,
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
      const docNo = (created as { docNo?: string })?.docNo
      if (action === 'SUBMIT') {
        setIssuedPopup({ docId, docNo })
        setMessage('Issue submitted — stock posted.')
        return
      }
      setMessage('Issue saved as draft.')
      if (docId != null) navigate(`${BASE}/${docId}`, { replace: true })
      else navigate(BASE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!issuedPopup) return
    const t = window.setTimeout(() => {
      const id = issuedPopup.docId
      setIssuedPopup(null)
      if (id != null) navigate(`${BASE}/${id}`, { replace: true })
      else navigate(BASE)
    }, 5000)
    return () => window.clearTimeout(t)
  }, [issuedPopup, navigate])

  const saveIdentity = async () => {
    if (!issueId) return
    setSubmitted(true)
    setMessage(null)
    const filled = lines.filter((l) => l.itemId !== '')
    if (
      filled.some((l) => {
        const kind = l.itemType || items.rows.find((i) => i.id === l.itemId)?.itemType
        return kind === 'asset' && !String(l.serialNo ?? '').trim()
      })
    ) {
      setError('Serial No. is required on every asset line.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateTxn(RESOURCE, issueId, {
        lines: filled.map((l, i) => ({
          srNo: i + 1,
          detailId: l.detailId,
          itemId: Number(l.itemId),
          serialNo: l.serialNo || undefined,
          ipAddress: l.ipAddress || undefined,
          macAddress: l.macAddress || undefined,
          hostname: l.hostname || undefined,
        })),
      })
      setMessage('Serial / network fields saved.')
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
              Header and quantities are locked after submit. Serial, IP, MAC and hostname can still be updated.
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

            <Field
              label="From Location"
              hint="Taken from the requisition — shown on each item line"
            >
              <Input
                value={(() => {
                  const loc = locations.rows.find((l) => l.id === form.storeId)
                  return loc ? locLabel(loc) : form.storeId || ''
                })()}
                readOnly
                placeholder="From requisition"
              />
            </Field>

            {form.reqSubtype === 'DEPARTMENT' ? (
              <Field label="Request from Department">
                <Input
                  value={
                    form.departmentName ||
                    (form.departmentId ? String(deptById.get(form.departmentId)?.name ?? form.departmentId) : '')
                  }
                  readOnly
                  placeholder="From requisition"
                />
              </Field>
            ) : (
              <LookupSelect
                label="Issued To"
                required
                value={form.issuedTo}
                onChange={(v) => {
                  setForm((p) => {
                    const emp = employees.rows.find((e) => e.id === v)
                    const next = { ...p, issuedTo: v }
                    if (p.reqSubtype === 'EMPLOYEE' && emp?.baseStore) {
                      next.toLocationId = String(emp.baseStore)
                    }
                    return next
                  })
                }}
                onBlur={() => touch('issuedTo')}
                options={employeeOptions}
                placeholder="— Select Employee —"
                error={err('issuedTo')}
                disabled={readOnly}
                quickAdd={addEmployee}
              />
            )}

            {(form.reqSubtype ?? '').toUpperCase() === 'DEPARTMENT' ? (
              <Field
                label="To Location"
                required
                error={err('toLocationId')}
                hint="Taken from the department master — cannot be changed"
              >
                <Input
                  value={
                    deptToLocationOption?.value === form.toLocationId
                      ? deptToLocationOption.label
                      : (() => {
                          const loc = locations.rows.find((l) => l.id === form.toLocationId)
                          return loc ? locLabel(loc) : form.toLocationId || ''
                        })()
                  }
                  readOnly
                  placeholder="From department mapping"
                  invalid={Boolean(err('toLocationId'))}
                />
              </Field>
            ) : (
              <LookupSelect
                label="To Location"
                required
                value={form.toLocationId}
                onChange={(v) => set('toLocationId', v)}
                onBlur={() => touch('toLocationId')}
                options={locationOptions}
                placeholder="— Select Location —"
                error={err('toLocationId')}
                disabled={readOnly}
                hint="Defaults to the employee’s base location"
                quickAdd={addLocation}
              />
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

      <div className="mt-3">
        <IssueItemLines
          lines={lines}
          onChange={setLines}
          items={issueItems}
          units={units.rows}
          locations={lineLocations}
          storeLocationId={form.storeId}
          toLocationId={form.toLocationId}
          readOnly={assetReadOnly}
          lockStockFields={lockStockFields}
          headerReady={headerReady}
          requestedItemIds={requestedItemIds}
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
              setRequestedItemIds([])
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
        {!isNew && canEdit && (
          <Button onClick={() => void saveIdentity()} disabled={saving}>
            {saving ? 'Saving…' : 'Save serial / network'}
          </Button>
        )}
      </div>

      <Modal
        open={issuedPopup != null}
        title="Issued"
        subtitle="Stock has been posted successfully."
        onClose={() => {
          const id = issuedPopup?.docId
          setIssuedPopup(null)
          if (id != null) navigate(`${BASE}/${id}`, { replace: true })
          else navigate(BASE)
        }}
        offsetSidebar
        footer={
          <Button
            onClick={() => {
              const id = issuedPopup?.docId
              setIssuedPopup(null)
              if (id != null) navigate(`${BASE}/${id}`, { replace: true })
              else navigate(BASE)
            }}
          >
            OK
          </Button>
        }
      >
        <div className="space-y-2 py-1 text-center">
          <div className="text-[15px] font-semibold text-[var(--text)]">
            Material issued successfully
          </div>
          {issuedPopup?.docNo && (
            <div className="font-mono text-[13px] font-semibold text-[var(--accent-deep)]">
              {issuedPopup.docNo}
            </div>
          )}
          <p className="text-[12.5px] text-[var(--text2)]">
            This message will close automatically in 5 seconds.
          </p>
        </div>
      </Modal>
    </FadeContent>
  )
}
