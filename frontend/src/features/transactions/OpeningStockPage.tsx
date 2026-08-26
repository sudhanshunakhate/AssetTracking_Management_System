import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  createTxn,
  fetchTxn,
  numOrUndef,
  todayIso,
  updateTxn,
  useTxnList,
  type DocumentRequest,
  type TxnRow,
} from '@/api/transactions'
import { useGenValues, GEN_TYPE } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { validateFields, areRequiredFieldsFilled, type ValidatableField } from '@/features/masters/validation'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import { AttachmentLink, AttachmentSection, attachmentPayload } from './AttachmentSection'
import { enrichLinesFromItems, toNum } from './lineGrid'
import {
  emptyOpeningStockLine,
  isIssuedCondition,
  OpeningStockItemLines,
  type ItemKind,
  type OpeningStockLine,
} from './OpeningStockItemLines'
import {
  locationOptions as toLocationOptions,
  nonSystemLocations,
  resolveTxnHeaderFromLines,
  useTxnFormLookups,
} from './txnLookups'

const BASE = '/transactions/opening-stock'
const MENU = 'OPN'
const RESOURCE = 'opening-stock'
const EDITABLE_STATUSES = ['', 'In Pending', 'Draft', 'Rejected']

type FormState = {
  entryNo: string
  openingDate: string
  remarks: string
  attachmentUrl: string
  attachmentName: string
  status: string
}

function blankForm(): FormState {
  return {
    entryNo: AUTO_DOC_NO_LABEL,
    openingDate: todayIso(),
    remarks: '',
    attachmentUrl: '',
    attachmentName: '',
    status: '',
  }
}

export function OpeningStockPages() {
  return (
    <Routes>
      <Route index element={<OpeningStockList />} />
      <Route path=":id" element={<OpeningStockForm />} />
    </Routes>
  )
}

/* -------------------------------------------------------------- list ---- */

function OpeningStockList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const { rows, loading, error } = useTxnList(RESOURCE)
  const { locations, vendors } = useTxnFormLookups()

  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])
  const vendorById = useMemo(() => new Map(vendors.rows.map((v) => [v.id, v])), [vendors.rows])

  const text = {
    location: (r: TxnRow) => {
      const loc = locById.get(String(r.locationId ?? ''))
      return loc ? String(loc.code) : String(r.locationId || '—')
    },
    supplier: (r: TxnRow) => {
      const v = vendorById.get(String(r.partyId ?? ''))
      return v ? String(v.code) : String(r.partyId || '—')
    },
  }

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Entry No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    { key: 'date', header: 'Opening Date', searchText: (r) => r.docDate, render: (r) => r.docDate },
    { key: 'location', header: 'Location', searchText: text.location, render: text.location },
    { key: 'supplier', header: 'Supplier', searchText: text.supplier, render: text.supplier },
    {
      key: 'items',
      header: 'Items',
      searchText: (r) => String(r.totalItems ?? 0),
      render: (r) => String(r.totalItems ?? 0),
    },
    { key: 'status', header: 'Status', searchText: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
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
        title="Opening Stock"
        description="Record the starting quantity of items at a location, before any Inward, Issue or Transfer transactions are posted."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading opening stock…</div>}
      <DataTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search opening stock entries…"
        onRowClick={(r) => navigate(`${BASE}/${r.id}`)}
        onAdd={canCreateMenu(MENU) ? () => navigate(`${BASE}/new`) : undefined}
        addLabel="Add Opening Stock"
        emptyMessage="No opening stock entries yet. Use Add Opening Stock to record one."
      />
    </FadeContent>
  )
}

/* -------------------------------------------------------------- form ---- */

function OpeningStockForm() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { canCreateMenu, canEditMenu } = useAuth()
  const { locations, items, units, vendors, employees } = useTxnFormLookups()
  const { options: conditionOpts } = useGenValues(GEN_TYPE.ASSET_CONDITION)

  const [form, setForm] = useState<FormState>(blankForm)
  const [itemType, setItemType] = useState<ItemKind>('asset')
  const [lines, setLines] = useState<OpeningStockLine[]>([emptyOpeningStockLine()])
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
  const readOnly = !canEdit || (!isNew && !statusEditable)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const doc = await fetchTxn(RESOURCE, id)
        if (cancelled) return
        const headerSupplier = doc.partyId != null ? String(doc.partyId) : ''
        setForm({
          entryNo: doc.docNo ?? '',
          openingDate: doc.docDate ?? '',
          remarks: doc.remarks ?? '',
          attachmentUrl: doc.attachmentUrl ?? '',
          attachmentName: doc.attachmentName ?? '',
          status: doc.status ?? '',
        })
        const mapped = (doc.lines ?? []).map((l) => ({
          ...emptyOpeningStockLine(),
          itemId: l.itemId != null ? String(l.itemId) : '',
          itemCode: l.itemCode ?? '',
          itemName: l.itemName ?? '',
          uomId: l.uomId != null ? String(l.uomId) : '',
          qty: l.qty != null ? String(l.qty) : '',
          batch: l.batchLotNo ?? '',
          supplierId: headerSupplier,
          mfgDate: l.mfgDate ?? '',
          expiryDate: l.expiryDate ?? '',
          locationId: l.locationId != null ? String(l.locationId) : '',
          serialNo: l.serialNo ?? '',
          ipAddress: l.ipAddress ?? '',
          macAddress: l.macAddress ?? '',
          hostname: l.hostname ?? '',
          itemCondition: l.itemCondition ?? '',
          issuedToEmpId: l.issuedToEmpId != null ? String(l.issuedToEmpId) : '',
          remark: l.remark ?? '',
        }))
        setLines(mapped.length ? mapped : [emptyOpeningStockLine()])
        const firstType = doc.lines?.find((l) => l.itemType)?.itemType
        if (firstType === 'consumable' || firstType === 'asset') {
          setItemType(firstType)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load opening stock')
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

  const headerFields: ValidatableField[] = useMemo(
    () => [{ name: 'openingDate', label: 'Opening Date', required: true }],
    [],
  )

  const errors = useMemo(() => {
    if (readOnly) return {} as Record<string, string>
    const next = validateFields(headerFields, form as unknown as Record<string, unknown>)
    const filled = lines.filter((l) => l.itemId !== '')
    if (filled.length === 0) next.lines = 'Add at least one item line'
    else if (filled.some((l) => toNum(l.qty) <= 0)) next.lines = 'Quantity must be greater than 0 on every line'
    else if (itemType === 'asset' && filled.some((l) => !l.serialNo.trim())) {
      next.lines = 'Serial No. is required on every asset unit line'
    } else if (
      itemType === 'asset' &&
      filled.some((l) => isIssuedCondition(l.itemCondition, conditionOpts) && !l.issuedToEmpId)
    ) {
      next.lines = 'Custody employee is required when Condition is Issued'
    } else if (filled.some((l) => !l.locationId)) {
      next.lines = 'Location is required on every item line'
    }
    return next
  }, [form, headerFields, lines, readOnly, itemType, conditionOpts])

  const headerReady = useMemo(
    () => areRequiredFieldsFilled(headerFields, form as unknown as Record<string, unknown>),
    [headerFields, form],
  )

  const err = (name: string) => (submitted || touched[name] ? (errors[name] ?? '') : '')

  const locationOptions = useMemo(
    () => toLocationOptions(nonSystemLocations(locations.rows)),
    [locations.rows],
  )
  const lineLocations = useMemo(() => nonSystemLocations(locations.rows), [locations.rows])
  const allItemsForType = useMemo(
    () =>
      items.rows.filter(
        (i) => (i.itemType === 'consumable' ? 'consumable' : 'asset') === itemType,
      ),
    [items.rows, itemType],
  )

  const buildBody = (action: 'SAVE_DRAFT' | 'SUBMIT'): DocumentRequest => {
    const filled = lines.filter((l) => l.itemId !== '')
    const firstSupplier = filled.find((l) => l.supplierId)?.supplierId
    const header = resolveTxnHeaderFromLines(filled, locations.rows)
    return {
      docDate: form.openingDate || todayIso(),
      postingDate: form.openingDate || todayIso(),
      entityId: header.entityId,
      locationId: header.locationId,
      partyId: numOrUndef(firstSupplier),
      remarks: form.remarks,
      ...attachmentPayload(form.attachmentUrl, form.attachmentName),
      totalAmount: 0,
      docSubmitAction: action,
      lines: filled.map((l, i) => {
        const qty = itemType === 'asset' ? 1 : toNum(l.qty)
        return {
          srNo: i + 1,
          itemId: Number(l.itemId),
          uomId: numOrUndef(l.uomId),
          qty,
          orderedQty: qty,
          receivedQty: qty,
          acceptedQty: qty,
          requestedQty: qty,
          batchLotNo: l.batch || undefined,
          mfgDate: l.mfgDate || undefined,
          expiryDate: l.expiryDate || undefined,
          locationId: numOrUndef(l.locationId),
          serialNo: l.serialNo || undefined,
          ipAddress: l.ipAddress || undefined,
          macAddress: l.macAddress || undefined,
          hostname: l.hostname || undefined,
          itemCondition: l.itemCondition || undefined,
          issuedToEmpId: numOrUndef(l.issuedToEmpId),
          remark: l.remark || undefined,
        }
      }),
    }
  }

  const save = async (action: 'SAVE_DRAFT' | 'SUBMIT') => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      setError(errors.lines || 'Please correct the highlighted fields.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const body = buildBody(action)
      if (isNew) await createTxn(RESOURCE, body)
      else await updateTxn(RESOURCE, id, body)
      setMessage(action === 'SUBMIT' ? 'Opening stock saved and posted.' : 'Opening stock saved.')
      navigate(BASE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (isNew && !canCreateMenu(MENU)) return <Navigate to={BASE} replace />
  if (loading) return <div className="text-sm text-[var(--text3)]">Loading opening stock…</div>

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            Opening Stock{' '}
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
            Record starting stock for one or more items at a location.
          </div>
          {!canEdit && (
            <div className="mt-1 text-[12px] text-[var(--danger)]">
              You do not have {isNew ? 'Create' : 'Edit'} permission for this screen.
            </div>
          )}
          {canEdit && !isNew && !statusEditable && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              This entry is {form.status} and can no longer be edited.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(BASE)}>
          ← Back to List
        </Button>
      </div>

      <Card>
        <CardHeader title="Header" subtitle="Entry reference and opening date" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Entry No." hint={isNew ? 'Auto-generated on save (OST-2026-0001)' : undefined}>
              <Input value={form.entryNo} readOnly />
            </Field>

            <Field label="Opening Date" required error={err('openingDate')}>
              <Input
                type="date"
                value={form.openingDate}
                onChange={(e) => set('openingDate', e.target.value)}
                onBlur={() => touch('openingDate')}
                disabled={readOnly}
                invalid={Boolean(err('openingDate'))}
              />
            </Field>

            <Field label="Remarks" className="md:col-span-2 xl:col-span-4">
              <Textarea
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
                disabled={readOnly}
                maxLength={500}
                rows={2}
                placeholder="Optional notes…"
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

      <OpeningStockItemLines
        lines={lines}
        onChange={setLines}
        itemType={itemType}
        onItemTypeChange={setItemType}
        items={allItemsForType}
        allItems={items.rows}
        units={units.rows}
        vendors={vendors.rows}
        employees={employees.rows}
        locations={lineLocations}
        locationOptions={locationOptions}
        conditionOptions={conditionOpts}
        locationId=""
        readOnly={readOnly}
        headerReady={headerReady}
        showLineErrors={submitted}
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
              setForm((p) => ({ ...blankForm(), entryNo: p.entryNo, status: p.status }))
              setLines([emptyOpeningStockLine()])
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
              {saving ? 'Saving…' : 'Save Opening Stock'}
            </Button>
          </>
        )}
      </div>
    </FadeContent>
  )
}
