import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { LookupSelect } from '@/components/form/LookupSelect'
import {
  createTxn,
  fetchTxn,
  todayIso,
  useTxnList,
  type DocumentRequest,
  type TxnRow,
} from '@/api/transactions'
import { mapBusinessUnit, useMasterList, type ApiMasterRow } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { validateFields, areRequiredFieldsFilled, type ValidatableField } from '@/features/masters/validation'
import { TransferItemLines, emptyTransferLine, type TransferLine } from './TransferItemLines'
import { enrichLinesFromItems } from './lineGrid'
import { locLabel, locationOptions as toLocationOptions, systemLocationsForOu, useTxnFormLookups } from './txnLookups'

import { AUTO_DOC_NO_LABEL } from './txnConstants'
import { AttachmentLink, AttachmentSection, attachmentPayload } from './AttachmentSection'
import {
  buildGatepassPrefillFromTransfer,
  buildGatepassPrefillFromTxnDoc,
  gatepassOutwardHint,
  needsGatepassOutward,
  PENDING_FOR_OUTWARD_STATUS,
} from './transferGatepassBridge'
import { GATEPASS_OUTWARD_PREFILL_KEY } from './gatepassNavigation'

const GATEPASS_BASE = '/transactions/gatepass'
const BASE = '/transactions/transfers'
const MENU = 'TRF'
const RESOURCE = 'transfers'

const EDITABLE_STATUSES = ['', 'Pending', 'Draft']

type TransferType = 'INTERNAL' | 'OU'

type FormState = {
  transferNo: string
  transferDate: string
  transferType: TransferType
  /** Internal: single OU that scopes both From/To stores. */
  operatingUnitId: string
  /** OU transfer: source OU. */
  fromOuId: string
  /** OU transfer: destination OU. */
  toOuId: string
  fromStoreId: string
  toStoreId: string
  remarks: string
  attachmentUrl: string
  attachmentName: string
  status: string
}

function blankForm(): FormState {
  return {
    transferNo: AUTO_DOC_NO_LABEL,
    transferDate: todayIso(),
    transferType: 'INTERNAL',
    operatingUnitId: '',
    fromOuId: '',
    toOuId: '',
    fromStoreId: '',
    toStoreId: '',
    remarks: '',
    attachmentUrl: '',
    attachmentName: '',
    status: '',
  }
}

/** Prefer a "general" store under the OU; otherwise the first location mapped to it. */
function defaultStoreForOu(locations: ApiMasterRow[], ouId: string, ous: ApiMasterRow[]): string {
  const underOu = systemStoresForOu(locations, ouId, ous)
  if (!underOu.length) return ''
  const main = underOu.find((l) => String(l.systemRole ?? '').toUpperCase() === 'MAIN_STORE')
  return (main ?? underOu[0]).id
}

function systemStoresForOu(
  locations: ApiMasterRow[],
  ouId: string,
  ous: ApiMasterRow[],
) {
  return systemLocationsForOu(locations, ouId, ous)
}

/** Persist OU context on the header `purpose` field. */
function encodePurpose(form: FormState): string | undefined {
  if (form.transferType === 'INTERNAL') return form.operatingUnitId || undefined
  if (!form.fromOuId && !form.toOuId) return undefined
  return `${form.fromOuId}|${form.toOuId}`
}

function decodePurpose(
  transferType: TransferType,
  purpose: string | undefined | null,
): Pick<FormState, 'operatingUnitId' | 'fromOuId' | 'toOuId'> {
  const raw = String(purpose ?? '').trim()
  if (transferType === 'INTERNAL') {
    return { operatingUnitId: raw.includes('|') ? raw.split('|')[0] : raw, fromOuId: '', toOuId: '' }
  }
  const [fromOuId = '', toOuId = ''] = raw.split('|')
  return { operatingUnitId: '', fromOuId, toOuId }
}

export function TransfersPages() {
  return (
    <Routes>
      <Route index element={<TransferList />} />
      <Route path=":id" element={<TransferForm />} />
    </Routes>
  )
}

/* -------------------------------------------------------------- list ---- */

function TransferList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const [view, setView] = useState<'all' | 'pending-outward'>('all')
  const { rows, loading, error } = useTxnList(
    RESOURCE,
    view === 'pending-outward' ? { status: PENDING_FOR_OUTWARD_STATUS } : undefined,
  )
  const { locations } = useTxnFormLookups()
  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])

  const fromLabel = (r: TxnRow) => {
    const l = locById.get(String(r.fromLocationId ?? ''))
    return l ? locLabel(l) : '—'
  }
  const toLabel = (r: TxnRow) => {
    const l = locById.get(String(r.toLocationId ?? ''))
    return l ? locLabel(l) : '—'
  }
  const typeLabel = (r: TxnRow) => {
    const t = String(r.docSubtype ?? '').toUpperCase()
    if (t === 'OU' || t === 'OPR') return 'OU Transfer'
    if (t === 'INTERNAL' || t === '') return 'Internal Transfer'
    return t
  }

  const openOutwardForRow = async (r: TxnRow) => {
    try {
      const doc = await fetchTxn(RESOURCE, r.id)
      const prefill = buildGatepassPrefillFromTxnDoc(doc, locations.rows)
      if (!prefill) return
      navigate(GATEPASS_BASE, { state: { [GATEPASS_OUTWARD_PREFILL_KEY]: prefill } })
    } catch (e) {
      console.error(e)
    }
  }

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Transfer No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    { key: 'date', header: 'Date', searchText: (r) => r.docDate, render: (r) => r.docDate || '—' },
    { key: 'type', header: 'Type', searchText: typeLabel, render: typeLabel },
    { key: 'from', header: 'From Store', searchText: fromLabel, render: fromLabel },
    { key: 'to', header: 'To Store', searchText: toLabel, render: toLabel },
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
    {
      key: 'action',
      header: '',
      render: (r) =>
        r.status === PENDING_FOR_OUTWARD_STATUS ? (
          <Button variant="ghost" className="text-xs" onClick={() => void openOutwardForRow(r)}>
            Prepare Outward
          </Button>
        ) : null,
    },
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Material Transfer"
        description="Store-to-store stock movement. Transfers needing a gatepass stay Pending for Outward until outward is submitted."
      />
      <div className="mb-3 flex gap-2">
        <Button variant={view === 'all' ? 'primary' : 'ghost'} onClick={() => setView('all')}>
          All Transfers
        </Button>
        <Button variant={view === 'pending-outward' ? 'primary' : 'ghost'} onClick={() => setView('pending-outward')}>
          Pending for Outward
        </Button>
      </div>
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading transfers…</div>}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search transfers…"
        onRowClick={(r) => navigate(`${BASE}/${r.id}`)}
        onAdd={canCreateMenu(MENU) ? () => navigate(`${BASE}/new`) : undefined}
        addLabel="New Transfer"
        emptyMessage={
          view === 'pending-outward'
            ? 'No transfers pending outward gatepass.'
            : 'No transfers yet. Use New Transfer to post one.'
        }
      />
    </FadeContent>
  )
}

/* -------------------------------------------------------------- form ---- */

function TransferForm() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const { canCreateMenu, canEditMenu } = useAuth()
  const canCreateGatepass = canCreateMenu('GP')
  const isNew = id === 'new'

  const { locations, items, units } = useTxnFormLookups()
  const mapBu = useCallback(mapBusinessUnit, [])
  const ous = useMasterList('business-units', mapBu)

  const [form, setForm] = useState<FormState>(blankForm)
  const [lines, setLines] = useState<TransferLine[]>(() => [emptyTransferLine()])
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
  const readOnly = !isNew || !canEdit || !statusEditable

  const ouOptions = useMemo(
    () => ous.rows.map((o) => ({ value: o.id, label: `${o.code} – ${o.name}` })),
    [ous.rows],
  )

  const isOu = form.transferType === 'OU'
  const isInternal = form.transferType === 'INTERNAL'

  /** Internal: both store lists = selected OU. OU transfer: From list = From OU, To list = To OU. */
  const fromStoreOptions = useMemo(() => {
    if (isInternal) {
      return toLocationOptions(systemStoresForOu(locations.rows, form.operatingUnitId, ous.rows))
    }
    return toLocationOptions(systemStoresForOu(locations.rows, form.fromOuId, ous.rows))
  }, [isInternal, locations.rows, form.operatingUnitId, form.fromOuId, ous.rows])

  const toStoreOptions = useMemo(() => {
    if (isInternal) {
      return toLocationOptions(systemStoresForOu(locations.rows, form.operatingUnitId, ous.rows))
    }
    return toLocationOptions(systemStoresForOu(locations.rows, form.toOuId, ous.rows))
  }, [isInternal, locations.rows, form.operatingUnitId, form.toOuId, ous.rows])

  /* ---- load existing ---- */
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const doc = await fetchTxn(RESOURCE, id)
        if (cancelled) return
        const subtype = String(doc.docSubtype ?? '').toUpperCase()
        const transferType: TransferType =
          subtype === 'OU' || subtype === 'OPR' ? 'OU' : 'INTERNAL'
        const ousDecoded = decodePurpose(transferType, doc.purpose)
        // Fallback: infer OUs from store → location.ouCode when purpose blank
        const fromLoc = locations.rows.find((l) => l.id === String(doc.fromLocationId ?? ''))
        const toLoc = locations.rows.find((l) => l.id === String(doc.toLocationId ?? ''))
        setForm({
          transferNo: doc.docNo ?? '',
          transferDate: doc.docDate ?? '',
          transferType,
          operatingUnitId:
            ousDecoded.operatingUnitId ||
            (transferType === 'INTERNAL' ? String(fromLoc?.ouCode ?? '') : ''),
          fromOuId:
            ousDecoded.fromOuId ||
            (transferType === 'OU' ? String(fromLoc?.ouCode ?? '') : ''),
          toOuId:
            ousDecoded.toOuId || (transferType === 'OU' ? String(toLoc?.ouCode ?? '') : ''),
          fromStoreId: doc.fromLocationId != null ? String(doc.fromLocationId) : '',
          toStoreId: doc.toLocationId != null ? String(doc.toLocationId) : '',
          remarks: doc.remarks ?? '',
          attachmentUrl: doc.attachmentUrl ?? '',
          attachmentName: doc.attachmentName ?? '',
          status: doc.status ?? '',
        })
        const mapped = (doc.lines ?? []).map((l) => ({
          ...emptyTransferLine(),
          itemId: l.itemId != null ? String(l.itemId) : '',
          itemCode: l.itemCode ?? '',
          itemName: l.itemName ?? '',
          uomId: l.uomId != null ? String(l.uomId) : '',
          transferQty: l.qty != null ? String(l.qty) : '',
          availableStock: l.availableStock != null ? String(l.availableStock) : '',
          locationId: l.locationId != null ? String(l.locationId) : '',
          remark: l.remark ?? '',
        }))
        setLines(mapped.length ? mapped : [emptyTransferLine()])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew, locations.rows])

  useEffect(() => {
    if (!items.rows.length) return
    setLines((prev) => enrichLinesFromItems(prev, items.rows))
  }, [items.rows])

  const clearInvalidStores = (
    p: FormState,
    fromOu: string,
    toOu: string,
  ): Pick<FormState, 'fromStoreId' | 'toStoreId'> => {
    const fromOk = fromOu && systemStoresForOu(locations.rows, fromOu, ous.rows).some((l) => l.id === p.fromStoreId)
    const toOk = toOu && systemStoresForOu(locations.rows, toOu, ous.rows).some((l) => l.id === p.toStoreId)
    return {
      fromStoreId: fromOk ? p.fromStoreId : '',
      toStoreId: toOk ? p.toStoreId : '',
    }
  }

  const onTransferTypeChange = (value: string) => {
    const transferType: TransferType = value === 'OU' ? 'OU' : 'INTERNAL'
    setForm((p) => ({
      ...blankForm(),
      transferNo: p.transferNo,
      transferDate: p.transferDate,
      transferType,
      remarks: p.remarks,
      status: p.status,
    }))
    setLines([emptyTransferLine()])
  }

  /** Internal: one OU filters both From/To store lists. */
  const onInternalOuChange = (ouId: string) => {
    setForm((p) => {
      const stores = clearInvalidStores(p, ouId, ouId)
      if (stores.fromStoreId !== p.fromStoreId) {
        setLines([emptyTransferLine()])
      }
      return { ...p, operatingUnitId: ouId, fromOuId: '', toOuId: '', ...stores }
    })
  }

  /** OU transfer: From OU → default From Store; filter From Store list. */
  const onFromOuChange = (ouId: string) => {
    const defaultFrom = ouId ? defaultStoreForOu(locations.rows, ouId, ous.rows) : ''
    setForm((p) => {
      const fromOk = ouId && systemStoresForOu(locations.rows, ouId, ous.rows).some((l) => l.id === p.fromStoreId)
      const nextFrom = fromOk ? p.fromStoreId : defaultFrom
      if (nextFrom !== p.fromStoreId) {
        const allowed = new Set(
          items.rows
            .filter((i) => !nextFrom || String(i.store ?? '') === nextFrom)
            .map((i) => i.id),
        )
        setLines((prev) => {
          const next = prev.map((l) =>
            l.itemId && !allowed.has(l.itemId) ? { ...emptyTransferLine(), key: l.key } : l,
          )
          return next.length ? next : [emptyTransferLine()]
        })
      }
      return {
        ...p,
        fromOuId: ouId,
        fromStoreId: nextFrom,
      }
    })
  }

  /** OU transfer: To OU → default To Store; filter To Store list. */
  const onToOuChange = (ouId: string) => {
    const defaultTo = ouId ? defaultStoreForOu(locations.rows, ouId, ous.rows) : ''
    setForm((p) => {
      const toOk = ouId && systemStoresForOu(locations.rows, ouId, ous.rows).some((l) => l.id === p.toStoreId)
      return {
        ...p,
        toOuId: ouId,
        toStoreId: toOk ? p.toStoreId : defaultTo,
      }
    })
  }

  const onFromStoreChange = (fromStoreId: string) => {
    setForm((p) => ({ ...p, fromStoreId }))
    setLines((prev) => {
      const allowed = new Set(
        items.rows
          .filter((i) => !fromStoreId || String(i.store ?? '') === fromStoreId)
          .map((i) => i.id),
      )
      const next = prev.map((l) =>
        l.itemId && !allowed.has(l.itemId) ? { ...emptyTransferLine(), key: l.key } : l,
      )
      return next.length ? next : [emptyTransferLine()]
    })
  }

  const fieldDefs: ValidatableField[] = useMemo(() => {
    const defs: ValidatableField[] = [
      { name: 'transferDate', label: 'Date', required: true },
      { name: 'transferType', label: 'Transfer Type', required: true },
      { name: 'fromStoreId', label: 'From Store', required: true },
      { name: 'toStoreId', label: 'To Store', required: true },
    ]
    if (isInternal) defs.push({ name: 'operatingUnitId', label: 'Operating Unit', required: true })
    if (isOu) {
      defs.push({ name: 'fromOuId', label: 'From Operating Unit', required: true })
      defs.push({ name: 'toOuId', label: 'To Operating Unit', required: true })
    }
    return defs
  }, [isInternal, isOu])

  const headerReady = useMemo(
    () => areRequiredFieldsFilled(fieldDefs, form as unknown as Record<string, unknown>),
    [fieldDefs, form],
  )

  const errors = useMemo(() => {
    const e = validateFields(fieldDefs, form as unknown as Record<string, unknown>)
    if (form.fromStoreId && form.toStoreId && form.fromStoreId === form.toStoreId) {
      e.toStoreId = 'From Store and To Store cannot be the same.'
    }
    if (isOu && form.fromOuId && form.toOuId && form.fromOuId === form.toOuId) {
      e.toOuId = 'From OU and To OU must be different for an OU transfer.'
    }
    const lineErr = (() => {
      const filled = lines.filter((l) => l.itemId)
      if (filled.length === 0) return 'Add at least one item line.'
      if (filled.some((l) => !l.transferQty || Number(l.transferQty) <= 0)) {
        return 'Every item line needs a positive quantity.'
      }
      if (filled.some((l) => !l.uomId)) return 'Every item line needs a Unit (pick a valid item).'
      return ''
    })()
    if (lineErr) e.lines = lineErr
    return e
  }, [fieldDefs, form, lines, isOu])

  const err = (name: string) => (submitted || touched[name] ? errors[name] : undefined)

  const gatepassNeeded = useMemo(
    () => needsGatepassOutward(form.transferType, form.fromStoreId, form.toStoreId, locations.rows),
    [form.transferType, form.fromStoreId, form.toStoreId, locations.rows],
  )

  const gatepassHint = useMemo(
    () => gatepassOutwardHint(form.transferType, form.fromStoreId, form.toStoreId, locations.rows),
    [form.transferType, form.fromStoreId, form.toStoreId, locations.rows],
  )

  const canOpenGatepass =
    canCreateGatepass &&
    gatepassNeeded &&
    (!isNew || headerReady) &&
    lines.some((l) => l.itemId) &&
    !lines.some((l) => l.itemId && (!l.transferQty || Number(l.transferQty) <= 0))

  const openGatepassOutward = (transferDocId: string) => {
    const prefill = buildGatepassPrefillFromTransfer(
      transferDocId,
      form.transferType,
      form.transferDate,
      form.fromStoreId,
      form.toStoreId,
      form.remarks,
      form.transferNo,
      lines,
      locations.rows,
    )
    if (!prefill) return
    navigate(GATEPASS_BASE, { state: { [GATEPASS_OUTWARD_PREFILL_KEY]: prefill } })
  }

  const isPendingOutward = form.status === PENDING_FOR_OUTWARD_STATUS

  const buildBody = (): DocumentRequest => {
    const fromId = Number(form.fromStoreId)
    return {
      docDate: form.transferDate,
      fromLocationId: fromId,
      toLocationId: form.toStoreId ? Number(form.toStoreId) : undefined,
      locationId: fromId,
      docSubtype: form.transferType,
      purpose: encodePurpose(form),
      remarks: form.remarks || undefined,
      ...attachmentPayload(form.attachmentUrl, form.attachmentName),
      docSubmitAction: 'SUBMIT',
      lines: lines
        .filter((l) => l.itemId !== '')
        .map((l, i) => {
          const qty = Number(l.transferQty || 0)
          return {
            srNo: i + 1,
            itemId: Number(l.itemId),
            uomId: l.uomId ? Number(l.uomId) : undefined,
            qty,
            availableStock: l.availableStock === '' ? undefined : Number(l.availableStock),
            locationId: fromId,
            remark: l.remark || undefined,
          }
        }),
    }
  }

  const save = async () => {
    setSubmitted(true)
    setMessage(null)
    if (Object.keys(errors).length > 0) {
      setError(errors.lines ?? errors.toStoreId ?? errors.toOuId ?? 'Please correct the highlighted fields before saving.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const doc = await createTxn(RESOURCE, buildBody())
      const needsGp = needsGatepassOutward(
        form.transferType,
        form.fromStoreId,
        form.toStoreId,
        locations.rows,
      )
      if (needsGp && canCreateGatepass) {
        const prefill = buildGatepassPrefillFromTxnDoc(doc, locations.rows)
        if (prefill) {
          setMessage('Transfer saved — complete outward gatepass at the gate.')
          navigate(GATEPASS_BASE, { state: { [GATEPASS_OUTWARD_PREFILL_KEY]: prefill } })
          return
        }
      }
      if (needsGp) {
        setMessage('Transfer saved — Pending for Outward. Complete gatepass from the transfer list.')
      } else {
        setMessage('Transfer saved — stock moved.')
      }
      navigate(BASE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const clear = () => {
    setForm(blankForm())
    setLines([emptyTransferLine()])
    setSubmitted(false)
    setTouched({})
    setError(null)
    setMessage(null)
  }

  if (id !== 'new' && !/^\d+$/.test(id)) return <Navigate to={BASE} replace />

  if (loading) {
    return (
      <FadeContent>
        <div className="text-sm text-[var(--text3)]">Loading transfer…</div>
      </FadeContent>
    )
  }

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeader
            title={isNew ? 'Material Transfer — Add / Edit' : `Transfer ${form.transferNo}`}
            description="Store-to-store stock movement. Independent transaction — no approval required."
          />
          {form.status && (
            <div className="mt-1">
              <StatusPill status={form.status} />
            </div>
          )}
          {!isNew && (
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              Existing transfers are view-only. Create a new transfer to move further stock.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(BASE)}>
          ← Back to List
        </Button>
      </div>

      <Card>
        <CardHeader title="Transfer Details" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Transfer Type" required error={err('transferType')}>
              <Select
                value={form.transferType}
                onChange={(e) => onTransferTypeChange(e.target.value)}
                onBlur={() => touch('transferType')}
                disabled={readOnly}
                invalid={Boolean(err('transferType'))}
              >
                <option value="INTERNAL">Internal Transfer</option>
                <option value="OU">OU Transfer</option>
              </Select>
            </Field>

            {isInternal && (
              <LookupSelect
                label="Operating Unit"
                required
                value={form.operatingUnitId}
                onChange={onInternalOuChange}
                onBlur={() => touch('operatingUnitId')}
                options={ouOptions}
                placeholder="— Select Operating Unit —"
                error={err('operatingUnitId')}
                disabled={readOnly}
              />
            )}

            {isOu && (
              <>
                <LookupSelect
                  label="From Operating Unit"
                  required
                  value={form.fromOuId}
                  onChange={onFromOuChange}
                  onBlur={() => touch('fromOuId')}
                  options={ouOptions}
                  placeholder="— Select From OU —"
                  error={err('fromOuId')}
                  disabled={readOnly}
                />
                <LookupSelect
                  label="To Operating Unit"
                  required
                  value={form.toOuId}
                  onChange={onToOuChange}
                  onBlur={() => touch('toOuId')}
                  options={ouOptions}
                  placeholder="— Select To OU —"
                  error={err('toOuId')}
                  disabled={readOnly}
                />
              </>
            )}

            <Field
              label="Transfer No."
              required
              hint={isNew ? 'Auto-generated on save (TRF-2026-0001)' : undefined}
            >
              <Input value={form.transferNo} readOnly />
            </Field>

            <Field label="Date" required error={err('transferDate')}>
              <Input
                type="date"
                value={form.transferDate}
                onChange={(e) => set('transferDate', e.target.value)}
                onBlur={() => touch('transferDate')}
                disabled={readOnly}
                invalid={Boolean(err('transferDate'))}
              />
            </Field>

            <LookupSelect
              label="From Store"
              required
              value={form.fromStoreId}
              onChange={onFromStoreChange}
              onBlur={() => touch('fromStoreId')}
              options={fromStoreOptions}
              placeholder={
                isInternal
                  ? form.operatingUnitId
                    ? '— Select Store —'
                    : '— Select Operating Unit first —'
                  : form.fromOuId
                    ? '— Select Store —'
                    : '— Select From OU first —'
              }
              error={err('fromStoreId')}
              disabled={readOnly || (isInternal ? !form.operatingUnitId : !form.fromOuId)}
            />

            <LookupSelect
              label="To Store"
              required
              value={form.toStoreId}
              onChange={(v) => set('toStoreId', v)}
              onBlur={() => touch('toStoreId')}
              options={toStoreOptions}
              placeholder={
                isInternal
                  ? form.operatingUnitId
                    ? '— Select Store —'
                    : '— Select Operating Unit first —'
                  : form.toOuId
                    ? '— Select Store —'
                    : '— Select To OU first —'
              }
              error={err('toStoreId')}
              disabled={readOnly || (isInternal ? !form.operatingUnitId : !form.toOuId)}
            />

            <Field label="Remarks" className="md:col-span-2 xl:col-span-4">
              <Input
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
                disabled={readOnly}
                maxLength={500}
                placeholder="Reason for transfer…"
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
        <TransferItemLines
          lines={lines}
          onChange={setLines}
          items={items.rows}
          units={units.rows}
          fromStoreId={form.fromStoreId}
          readOnly={readOnly}
          headerReady={headerReady}
          error={submitted ? errors.lines : undefined}
        />
      </div>

      {error && <div className="mt-2 text-[12.5px] font-medium text-[var(--danger)]">{error}</div>}
      {message && <div className="mt-2 text-[12.5px] font-medium text-[var(--accent)]">{message}</div>}

      {!readOnly && gatepassNeeded && isNew && (
        <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2.5">
          <div className="text-[12px] font-semibold text-[var(--text)]">Outward gatepass</div>
          <p className="mt-0.5 text-[11.5px] text-[var(--text2)]">{gatepassHint}</p>
          <p className="mt-1 text-[11px] text-[var(--text3)]">
            Save the transfer first — you will be taken to the outward gatepass form automatically.
          </p>
        </div>
      )}

      {isPendingOutward && gatepassNeeded && (
        <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <div className="text-[12px] font-semibold text-[var(--text)]">Pending for Outward</div>
          <p className="mt-0.5 text-[11.5px] text-[var(--text2)]">
            Stock has moved but outward gatepass is still required at the source store gate.
          </p>
          {canCreateGatepass && (
            <div className="mt-2">
              <Button variant="ghost" onClick={() => openGatepassOutward(id)} disabled={!canOpenGatepass}>
                Prepare Outward Gatepass
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex-1" />
        {!readOnly && (
          <Button variant="danger" onClick={clear} disabled={saving}>
            ✕ Clear
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate(BASE)}>
          ← Back to List
        </Button>
        {!readOnly && (
          <Button onClick={() => void save()} disabled={saving}>
            ✓ Save Transfer
          </Button>
        )}
      </div>
    </FadeContent>
  )
}
