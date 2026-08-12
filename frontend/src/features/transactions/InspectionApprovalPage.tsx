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
import { mapEntity, mapBusinessUnit, useMasterList } from '@/api/masters'
import {
  createTxn,
  fetchTxn,
  numOrUndef,
  todayIso,
  useTxnList,
  type DocumentRequest,
  type TxnRow,
} from '@/api/transactions'
import { useAuth } from '@/features/auth/AuthContext'
import { validateFields, areRequiredFieldsFilled, type ValidatableField } from '@/features/masters/validation'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import { enrichLinesFromItems, toNum } from './lineGrid'
import {
  emptyInspectionLine,
  InspectionItemLines,
  type InspectionLine,
} from './InspectionItemLines'
import {
  locLabel,
  locationOptions as toLocationOptions,
  useTxnFormLookups,
} from './txnLookups'

const BASE = '/transactions/inspection-approvals'
const MENU = 'IAPR'
const RESOURCE = 'inspection-approvals'

type FormState = {
  approvalNo: string
  approvalDate: string
  orgId: string
  ouId: string
  quarantineId: string
  remark: string
  status: string
}

function blankForm(): FormState {
  return {
    approvalNo: AUTO_DOC_NO_LABEL,
    approvalDate: todayIso(),
    orgId: '',
    ouId: '',
    quarantineId: '',
    remark: '',
    status: '',
  }
}

export function InspectionApprovalPages() {
  return (
    <Routes>
      <Route index element={<InspectionApprovalList />} />
      <Route path=":id" element={<InspectionApprovalForm />} />
    </Routes>
  )
}

function InspectionApprovalList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const { rows, loading, error } = useTxnList(RESOURCE)
  const { locations } = useTxnFormLookups()

  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Approval No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    { key: 'date', header: 'Date', searchText: (r) => r.docDate, render: (r) => r.docDate || '—' },
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
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Inspection Approval"
        description="Approve quarantined stock and move it to each item's home store."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading approvals…</div>}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search approvals…"
        onRowClick={(r) => navigate(`${BASE}/${r.id}`)}
        onAdd={canCreateMenu(MENU) ? () => navigate(`${BASE}/new`) : undefined}
        addLabel="New Approval"
        emptyMessage="No inspection approvals yet."
      />
    </FadeContent>
  )
}

function InspectionApprovalForm() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const isNew = id === 'new'

  const { locations, items, units } = useTxnFormLookups()
  const { rows: orgs } = useMasterList('entities', mapEntity)
  const { rows: ous } = useMasterList('business-units', mapBusinessUnit)

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

  const canEdit = isNew && canCreateMenu(MENU)
  const readOnly = !isNew || !canEdit

  const quarantineLocations = useMemo(
    () =>
      locations.rows.filter(
        (l) =>
          Boolean(l.isSystemLocation) &&
          String(l.systemRole ?? '').toUpperCase() === 'QUARANTINE' &&
          (!form.ouId || String(l.ouCode) === form.ouId) &&
          (!form.orgId || String(l.orgCode) === form.orgId),
      ),
    [locations.rows, form.orgId, form.ouId],
  )

  const orgOptions = useMemo(
    () => orgs.map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` })),
    [orgs],
  )

  const ouOptions = useMemo(
    () =>
      ous
        .filter((o) => !form.orgId || String(o.orgCode) === form.orgId)
        .map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` })),
    [ous, form.orgId],
  )

  const quarantineOptions = useMemo(
    () => toLocationOptions(quarantineLocations),
    [quarantineLocations],
  )

  useEffect(() => {
    if (!isNew) return
    if (!form.orgId && orgs.length === 1) set('orgId', orgs[0].id)
    const filteredOus = ous.filter((o) => !form.orgId || String(o.orgCode) === form.orgId)
    if (!form.ouId && filteredOus.length === 1) set('ouId', filteredOus[0].id)
    if (!form.quarantineId && quarantineLocations.length === 1) {
      set('quarantineId', quarantineLocations[0].id)
    }
  }, [isNew, form.orgId, form.ouId, form.quarantineId, orgs, ous, quarantineLocations])

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
          ouId: doc.locationId != null
            ? String(locations.rows.find((l) => l.id === String(doc.locationId))?.ouCode ?? '')
            : '',
          quarantineId: doc.locationId != null ? String(doc.locationId) : '',
          remark: doc.remarks ?? '',
          status: doc.status ?? '',
        })
        const loaded = (doc.lines ?? []).map((line, i) => ({
          ...emptyInspectionLine(),
          key: `line-${i}`,
          itemId: line.itemId != null ? String(line.itemId) : '',
          approveQty: line.qty != null ? String(line.qty) : '',
          batchLotNo: line.batchLotNo ?? '',
        }))
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
    setLines((prev) => enrichLinesFromItems(prev, items.rows))
  }, [items.rows])

  const headerFields: ValidatableField[] = [
    { name: 'approvalDate', label: 'Approval Date', required: true },
    { name: 'orgId', label: 'Organization', required: true },
    { name: 'ouId', label: 'Operating Unit', required: true },
    { name: 'quarantineId', label: 'Quarantine Location', required: true },
  ]

  const headerReady = areRequiredFieldsFilled(headerFields, form as unknown as Record<string, unknown>)

  const errors = useMemo(() => {
    const base = validateFields(headerFields, form as unknown as Record<string, unknown>)
    const lineErrors: Record<string, string> = {}
    const active = lines.filter((l) => l.itemId)
    if (active.length === 0) lineErrors.lines = 'Add at least one item line.'
    for (const line of active) {
      const qty = toNum(line.approveQty)
      const avail = toNum(line.availableStock)
      if (qty <= 0) lineErrors.lines = 'Approve quantity must be greater than zero.'
      if (qty > avail) lineErrors.lines = 'Approve quantity cannot exceed available quarantine stock.'
    }
    return { ...base, ...lineErrors }
  }, [form, lines])

  const err = (key: string) => (submitted || touched[key] ? (errors[key] ?? '') : '')

  const buildBody = (action: 'SAVE_DRAFT' | 'SUBMIT'): DocumentRequest => ({
    docDate: form.approvalDate,
    entityId: numOrUndef(form.orgId),
    locationId: Number(form.quarantineId),
    remarks: form.remark || undefined,
    docSubmitAction: action,
    lines: lines
      .filter((l) => l.itemId)
      .map((l, i) => ({
        srNo: i + 1,
        itemId: Number(l.itemId),
        uomId: l.uomId ? Number(l.uomId) : undefined,
        qty: toNum(l.approveQty),
        batchLotNo: l.batchLotNo || undefined,
      })),
  })

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
      const created = await createTxn(RESOURCE, buildBody(action))
      const docId = (created as { docId?: number })?.docId
      setMessage(action === 'SUBMIT' ? 'Inspection approved — stock moved to home stores.' : 'Saved as draft.')
      if (docId != null) navigate(`${BASE}/${docId}`, { replace: true })
      else navigate(BASE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (id !== 'new' && !/^\d+$/.test(id)) return <Navigate to={BASE} replace />

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
          {!isNew && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              Posted approvals are view-only.
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
              required
              value={form.orgId}
              onChange={(v) => {
                set('orgId', v)
                set('ouId', '')
                set('quarantineId', '')
              }}
              onBlur={() => touch('orgId')}
              options={orgOptions}
              placeholder="— Select Organization —"
              error={err('orgId')}
              disabled={readOnly}
            />
            <LookupSelect
              label="Operating Unit"
              required
              value={form.ouId}
              onChange={(v) => {
                set('ouId', v)
                set('quarantineId', '')
              }}
              onBlur={() => touch('ouId')}
              options={ouOptions}
              placeholder={form.orgId ? '— Select Operating Unit —' : '— Select Organization first —'}
              error={err('ouId')}
              disabled={readOnly || !form.orgId}
            />
            <LookupSelect
              label="Quarantine Location"
              required
              value={form.quarantineId}
              onChange={(v) => set('quarantineId', v)}
              onBlur={() => touch('quarantineId')}
              options={quarantineOptions}
              placeholder={form.ouId ? '— Select Quarantine —' : '— Select Operating Unit first —'}
              error={err('quarantineId')}
              disabled={readOnly || !form.ouId}
            />
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

      <InspectionItemLines
        lines={lines}
        onChange={setLines}
        items={items.rows}
        units={units.rows}
        locations={locations.rows}
        quarantineLocationId={form.quarantineId}
        readOnly={readOnly}
        headerReady={headerReady}
        error={submitted ? errors.lines : undefined}
      />

      {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
      {message && <div className="mt-3 text-sm text-[var(--success)]">{message}</div>}

      {!readOnly && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={saving} onClick={() => void save('SAVE_DRAFT')}>Save Draft</Button>
          <Button variant="primary" disabled={saving} onClick={() => void save('SUBMIT')}>
            Approve & Move Stock
          </Button>
        </div>
      )}
    </FadeContent>
  )
}
