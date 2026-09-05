import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import {
  createTxn,
  fetchTxn,
  numOrUndef,
  todayIso,
  useTxnList,
  type TxnRow,
} from '@/api/transactions'
import {
  mapBusinessUnit,
  mapEmployee,
  mapItem,
  mapLocation,
  mapUnit,
  GEN_TYPE,
  useGenValues,
  useMasterList,
} from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { AttachmentFields, attachmentPayload } from './AttachmentSection'
import {
  GATEPASS_BASE,
  GATEPASS_OUTWARD_PREFILL_KEY,
  type GatepassOutwardNavState,
} from './gatepassNavigation'
import {
  buildGatepassPrefillFromTxnDoc,
  PENDING_FOR_OUTWARD_STATUS,
  type GatepassOutwardPrefill,
} from './transferGatepassBridge'
import {
  GatepassOutwardItemLines,
  emptyGatepassOutwardLine,
  linesFromOutwardPicker,
  type GatepassOutwardLine,
} from './GatepassOutwardItemLines'
import {
  GatepassNormalOutwardPickerModal,
  type OutwardPickerBatch,
} from './GatepassNormalOutwardPickerModal'
import { normalizeTransferType, transferTypeLabel } from './transferTypes'
import { locLabel, systemLocations } from './txnLookups'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import { toNum } from './lineGrid'

type OutwardMode = 'against-transfer' | 'normal'

function ouLabel(ouId: string, ous: { id: string; code?: unknown; name?: unknown }[]) {
  if (!ouId) return '—'
  const ou = ous.find((o) => o.id === ouId)
  if (!ou) return ouId
  return `${String(ou.code ?? '')} – ${String(ou.name ?? '')}`.replace(/^ – | – $/g, '').trim() || ouId
}

function ouIdFromLocation(
  locationId: string,
  locations: { id: string; ouCode?: unknown }[],
): string {
  if (!locationId) return ''
  return String(locations.find((l) => l.id === locationId)?.ouCode ?? '')
}

export function GatepassOutwardForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, canCreateMenu, canEditMenu } = useAuth()
  const canSaveGp = canCreateMenu('GP') || canEditMenu('GP')

  const navPrefill = (location.state as GatepassOutwardNavState | null)?.[GATEPASS_OUTWARD_PREFILL_KEY]
  const [mode, setMode] = useState<OutwardMode>('against-transfer')
  const [saving, setSaving] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const mapEmp = useCallback(mapEmployee, [])
  const mapLoc = useCallback(mapLocation, [])
  const mapItm = useCallback(mapItem, [])
  const mapUnt = useCallback(mapUnit, [])
  const mapBu = useCallback(mapBusinessUnit, [])
  const { rows: employees } = useMasterList('employees', mapEmp)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: items } = useMasterList('items', mapItm)
  const { rows: units } = useMasterList('units', mapUnt)
  const { rows: ous } = useMasterList('business-units', mapBu)
  const { options: retFlagOpts } = useGenValues(GEN_TYPE.RETURNABLE_FLAG, 'code')
  const outward = useTxnList('gatepass/outward')
  const pendingTransfers = useTxnList('transfers', {
    enabled: mode === 'against-transfer',
    status: PENDING_FOR_OUTWARD_STATUS,
  })

  const sessionEmpId = user?.employeeId != null ? String(user.employeeId) : ''

  const [outwardForm, setOutwardForm] = useState({
    date: todayIso(),
    store: '',
    preparedBy: sessionEmpId,
    transferType: 'INTERNAL',
    returnFlag: 'N',
    party: '',
    item: '',
    qty: '1',
    uom: '',
    batch: '',
    serialNo: '',
    remarks: '',
    attachmentUrl: '',
    attachmentName: '',
  })
  const [linkedTransferId, setLinkedTransferId] = useState('')
  const [transferOutwardLink, setTransferOutwardLink] = useState<GatepassOutwardPrefill | null>(
    navPrefill ?? null,
  )
  const [normalLines, setNormalLines] = useState<GatepassOutwardLine[]>([emptyGatepassOutwardLine()])
  const [pickerOpen, setPickerOpen] = useState(false)

  const systemStores = useMemo(
    () => systemLocations(stores).filter((l) => l.status !== 'Inactive'),
    [stores],
  )

  const applyPrefill = useCallback(
    (prefill: GatepassOutwardPrefill) => {
      const first = prefill.lines[0]
      setMode('against-transfer')
      setTransferOutwardLink(prefill)
      setLinkedTransferId(prefill.transferDocId || '')
      setOutwardForm({
        date: prefill.date || todayIso(),
        store: prefill.storeId || '',
        preparedBy: sessionEmpId,
        transferType: normalizeTransferType(prefill.transferType || 'INTERNAL'),
        returnFlag: prefill.returnFlag || 'N',
        party: prefill.party || '',
        item: first?.itemId || '',
        qty: first?.qty || '1',
        uom: first?.uomId || '',
        batch: first?.batch || '',
        serialNo: first?.serialNo || '',
        remarks: prefill.transferNo ? `Linked transfer ${prefill.transferNo}` : '',
        attachmentUrl: '',
        attachmentName: '',
      })
      setMessage(
        prefill.lines.length > 1
          ? `Transfer ${prefill.transferNo || prefill.transferDocId} linked (${prefill.lines.length} lines) — confirm Returnable flag, then submit.`
          : `Transfer ${prefill.transferNo || prefill.transferDocId} linked — confirm Returnable flag, then submit.`,
      )
      setError('')
    },
    [sessionEmpId],
  )

  useEffect(() => {
    if (!sessionEmpId) return
    setOutwardForm((p) =>
      p.preparedBy ? p : { ...p, preparedBy: sessionEmpId, date: p.date || todayIso() },
    )
  }, [sessionEmpId])

  useEffect(() => {
    const state = location.state as GatepassOutwardNavState | null
    const prefill = state?.[GATEPASS_OUTWARD_PREFILL_KEY]
    if (!prefill) return
    applyPrefill(prefill)
    window.history.replaceState({}, document.title)
  }, [location.state, applyPrefill])

  const preparedByLabel = useMemo(() => {
    const emp = employees.find((e) => e.id === sessionEmpId)
    if (emp) return `${emp.code} – ${String(emp.firstName ?? '')} ${String(emp.lastName ?? '')}`.trim()
    return user?.displayName || sessionEmpId || '—'
  }, [employees, sessionEmpId, user?.displayName])

  const fromTransferOutward = Boolean(transferOutwardLink)
  const linkedTransferLines = transferOutwardLink?.lines ?? []
  const linkedStoreLabel = useMemo(() => {
    const storeId = outwardForm.store || transferOutwardLink?.storeId || ''
    const loc = stores.find((s) => s.id === storeId)
    return loc ? locLabel(loc) : storeId || '—'
  }, [outwardForm.store, transferOutwardLink?.storeId, stores])
  const unitCodeById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const u of units) map[u.id] = String(u.code ?? u.id)
    return map
  }, [units])
  const itemLabelById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const i of items) {
      const code = String(i.code ?? '').trim()
      const name = String(i.name ?? '').trim()
      map[i.id] = code && name ? `${code} – ${name}` : code || name || i.id
    }
    return map
  }, [items])

  const locById = useMemo(() => new Map(stores.map((l) => [l.id, l])), [stores])

  const normalHeaderReady = Boolean(outwardForm.returnFlag)

  const applyNormalPicker = (batch: OutwardPickerBatch) => {
    const mapped = linesFromOutwardPicker(batch, items)
    setOutwardForm((p) => ({ ...p, store: batch.locationId }))
    setNormalLines(mapped.length ? mapped : [emptyGatepassOutwardLine()])
    setPickerOpen(false)
    setError('')
    setMessage(
      mapped.length
        ? `Selected ${mapped.length} line(s) from system location — confirm Returnable flag, then submit.`
        : '',
    )
  }

  const resetNormalForm = useCallback(() => {
    setOutwardForm({
      date: todayIso(),
      store: '',
      preparedBy: sessionEmpId,
      transferType: 'INTERNAL',
      returnFlag: 'N',
      party: '',
      item: '',
      qty: '1',
      uom: '',
      batch: '',
      serialNo: '',
      remarks: '',
      attachmentUrl: '',
      attachmentName: '',
    })
    setNormalLines([emptyGatepassOutwardLine()])
    setMessage('')
    setError('')
  }, [sessionEmpId])

  const clearLinkedTransfer = () => {
    setLinkedTransferId('')
    setTransferOutwardLink(null)
    resetNormalForm()
  }

  const selectPendingTransfer = async (row: TxnRow) => {
    setSelecting(true)
    setError('')
    try {
      const doc = await fetchTxn('transfers', row.id)
      const prefill = buildGatepassPrefillFromTxnDoc(doc, stores)
      if (!prefill) {
        setError('This transfer does not require an outward gatepass (or has no lines).')
        return
      }
      applyPrefill(prefill)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load transfer')
    } finally {
      setSelecting(false)
    }
  }

  const resolveUom = (itemId: string | undefined, uom: string) => {
    const fromForm = numOrUndef(uom)
    if (fromForm != null) return fromForm
    const item = items.find((i) => i.id === String(itemId ?? ''))
    return numOrUndef(item?.uom)
  }

  const setOut = (k: keyof typeof outwardForm, v: string) => {
    setOutwardForm((p) => ({ ...p, [k]: v }))
  }

  const saveNormalOutward = async (action: 'SAVE_DRAFT' | 'SUBMIT') => {
    if (!canSaveGp) {
      setError('You do not have Create/Edit permission for Gatepass')
      return
    }
    if (!outwardForm.returnFlag) {
      setError('Returnable / Non Returnable is required')
      return
    }
    if (!outwardForm.store) {
      setError('Select items from a system location first')
      return
    }
    const storeMeta = stores.find((s) => s.id === outwardForm.store)
    if (!storeMeta?.isSystemLocation) {
      setError('Normal outward can only issue from system-derived locations')
      return
    }
    const filled = normalLines.filter((l) => l.itemId)
    if (filled.length === 0) {
      setError('Add at least one item line from a system location')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const lines = filled.map((l, i) => {
        const itemId = numOrUndef(l.itemId)
        if (itemId == null) throw new Error(`Line ${i + 1}: Item is required`)
        const qty = numOrUndef(l.qty) ?? 0
        if (qty <= 0) throw new Error(`Line ${i + 1}: Qty must be greater than 0`)
        const avail = toNum(l.availableStock)
        if (avail > 0 && qty > avail) {
          throw new Error(`Line ${i + 1}: Qty ${qty} exceeds available free stock ${avail}`)
        }
        const item = items.find((it) => it.id === l.itemId)
        const needsSerial = Boolean(item?.isSerialized || item?.itemType === 'asset')
        const serialNo = l.serialNo.trim().toUpperCase()
        if (needsSerial && !serialNo) {
          throw new Error(`Line ${i + 1}: Serial No. is required for asset outward`)
        }
        return {
          srNo: i + 1,
          itemId,
          uomId: resolveUom(l.itemId, l.uomId),
          qty,
          batchLotNo: serialNo || l.batchLotNo || undefined,
          serialNo: serialNo || undefined,
          locationId: numOrUndef(outwardForm.store),
          remark: l.remark || undefined,
        }
      })

      await createTxn('gatepass/outward', {
        docDate: outwardForm.date || todayIso(),
        locationId: numOrUndef(outwardForm.store),
        fromLocationId: numOrUndef(outwardForm.store),
        initiatedByEmpId: numOrUndef(outwardForm.preparedBy),
        returnFlag: outwardForm.returnFlag,
        // Normal outward has no transfer subtype — leave blank (linked transfer still sends subtype).
        remarks: outwardForm.remarks || outwardForm.party || undefined,
        ...attachmentPayload(outwardForm.attachmentUrl, outwardForm.attachmentName),
        docSubmitAction: action,
        lines,
      })
      setMessage(action === 'SAVE_DRAFT' ? 'Outward gatepass saved as draft' : 'Outward gatepass completed')
      if (action === 'SUBMIT') {
        navigate(GATEPASS_BASE)
        return
      }
      await outward.reload()
      resetNormalForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const saveOutward = async (action: 'SAVE_DRAFT' | 'SUBMIT') => {
    if (!canSaveGp) {
      setError('You do not have Create/Edit permission for Gatepass')
      return
    }
    if (!transferOutwardLink || !linkedTransferId) {
      setError('Select a pending material transfer first')
      return
    }
    if (!outwardForm.returnFlag) {
      setError('Returnable / Non Returnable is required')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const link = transferOutwardLink
      const storeId = link.storeId || outwardForm.store
      const docDate = link.date || outwardForm.date || todayIso()
      const lines = link.lines.map((l, i) => ({
        srNo: i + 1,
        itemId: numOrUndef(l.itemId),
        uomId: numOrUndef(l.uomId) ?? resolveUom(l.itemId, ''),
        qty: numOrUndef(l.qty) ?? 1,
        batchLotNo: l.serialNo || l.batch || undefined,
        serialNo: l.serialNo || undefined,
        locationId: numOrUndef(storeId),
      }))

      await createTxn('gatepass/outward', {
        docDate,
        locationId: numOrUndef(storeId),
        fromLocationId: numOrUndef(storeId),
        initiatedByEmpId: numOrUndef(outwardForm.preparedBy),
        returnFlag: outwardForm.returnFlag,
        docSubtype: normalizeTransferType(outwardForm.transferType),
        refTxnHeaderId: numOrUndef(linkedTransferId),
        ...attachmentPayload(outwardForm.attachmentUrl, outwardForm.attachmentName),
        docSubmitAction: action,
        lines,
      })
      setMessage(action === 'SAVE_DRAFT' ? 'Outward gatepass saved as draft' : 'Outward gatepass completed')
      if (action === 'SUBMIT') {
        navigate(GATEPASS_BASE)
        return
      }
      await outward.reload()
      await pendingTransfers.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const pendingColumns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Transfer No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    {
      key: 'date',
      header: 'Date',
      searchText: (r) => r.docDate,
      render: (r) => r.docDate || '—',
    },
    {
      key: 'type',
      header: 'Transfer Type',
      searchText: (r) => transferTypeLabel(String(r.docSubtype ?? '')),
      render: (r) => transferTypeLabel(String(r.docSubtype ?? '')),
    },
    {
      key: 'fromOu',
      header: 'From OU',
      searchText: (r) =>
        ouLabel(ouIdFromLocation(String(r.fromLocationId ?? ''), stores), ous),
      render: (r) => ouLabel(ouIdFromLocation(String(r.fromLocationId ?? ''), stores), ous),
    },
    {
      key: 'from',
      header: 'From Location',
      searchText: (r) => {
        const l = locById.get(String(r.fromLocationId ?? ''))
        return l ? locLabel(l) : ''
      },
      render: (r) => {
        const l = locById.get(String(r.fromLocationId ?? ''))
        return l ? locLabel(l) : '—'
      },
    },
    {
      key: 'toOu',
      header: 'To OU',
      searchText: (r) => ouLabel(ouIdFromLocation(String(r.toLocationId ?? ''), stores), ous),
      render: (r) => ouLabel(ouIdFromLocation(String(r.toLocationId ?? ''), stores), ous),
    },
    {
      key: 'to',
      header: 'To Location',
      searchText: (r) => {
        const l = locById.get(String(r.toLocationId ?? ''))
        return l ? locLabel(l) : ''
      },
      render: (r) => {
        const l = locById.get(String(r.toLocationId ?? ''))
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
      key: 'action',
      header: '',
      render: (r) => (
        <Button
          variant="ghost"
          className="text-xs"
          disabled={selecting}
          onClick={(e) => {
            e.stopPropagation()
            void selectPendingTransfer(r)
          }}
        >
          {selecting ? 'Loading…' : 'Prepare Outward'}
        </Button>
      ),
    },
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Outward Form"
        description="Issue material out of the store gate — against a pending material transfer, or as a normal outward."
      />

      <div className="mb-4 flex flex-wrap gap-2.5 border-b border-[var(--border)] pb-3.5">
        <Button
          variant={mode === 'against-transfer' ? 'primary' : 'ghost'}
          onClick={() => {
            setMode('against-transfer')
            setError('')
            setMessage('')
          }}
        >
          Outward against Material Transfer
        </Button>
        <Button
          variant={mode === 'normal' ? 'danger' : 'ghost'}
          onClick={() => {
            setMode('normal')
            clearLinkedTransfer()
            setMessage('')
            setError('')
          }}
        >
          Normal Outward Form
        </Button>
      </div>

      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {message && <div className="mb-2 text-sm text-[var(--accent)]">{message}</div>}

      {mode === 'normal' ? (
        <>
          <Card>
            <CardHeader
              title="Outward Details"
              subtitle="Manual outward without a linked transfer — system location and items are selected together below."
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Outward No." required>
                  <Input value={AUTO_DOC_NO_LABEL} disabled />
                </Field>
                <Field label="Outward Date" required>
                  <Input
                    type="date"
                    value={outwardForm.date}
                    onChange={(e) => setOut('date', e.target.value)}
                  />
                </Field>
                <Field label="Returnable / Non Returnable" required>
                  <Select
                    value={outwardForm.returnFlag}
                    onChange={(e) => setOut('returnFlag', e.target.value)}
                  >
                    {(retFlagOpts.length
                      ? retFlagOpts
                      : [
                          { value: 'N', label: 'Non Returnable', code: 'N' },
                          { value: 'Y', label: 'Returnable', code: 'Y' },
                        ]
                    ).map((o) => (
                      <option key={o.code ?? o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Prepared By" required hint="Logged-in user">
                  <Input value={preparedByLabel} readOnly disabled />
                </Field>
                <Field label="Customer / Party" className="md:col-span-2">
                  <Input
                    placeholder="Customer or receiving party"
                    value={outwardForm.party}
                    onChange={(e) => setOut('party', e.target.value)}
                  />
                </Field>
                <Field label="Remarks" className="md:col-span-2 xl:col-span-4">
                  <Input
                    placeholder="Remarks…"
                    value={outwardForm.remarks}
                    onChange={(e) => setOut('remarks', e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <AttachmentFields
                  url={outwardForm.attachmentUrl}
                  name={outwardForm.attachmentName}
                  onChange={({ url, name }) =>
                    setOutwardForm((p) => ({ ...p, attachmentUrl: url, attachmentName: name }))
                  }
                />
              </div>
            </CardBody>
          </Card>

          <GatepassOutwardItemLines
            lines={normalLines}
            onChange={setNormalLines}
            items={items}
            units={units}
            locations={stores}
            storeLocationId={outwardForm.store}
            onOpenPicker={() => {
              if (!normalHeaderReady) {
                setError('Set Returnable / Non Returnable before selecting items')
                return
              }
              setPickerOpen(true)
            }}
          />

          <GatepassNormalOutwardPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onComplete={applyNormalPicker}
            systemLocations={systemStores}
            items={items}
            units={units}
            initialLocationId={outwardForm.store}
          />

          <FormActions
            onClear={resetNormalForm}
            onBack={() => navigate(GATEPASS_BASE)}
            onSaveDraft={canSaveGp ? () => void saveNormalOutward('SAVE_DRAFT') : undefined}
            draftLabel={saving ? 'Saving…' : 'Save Draft'}
            onSave={canSaveGp ? () => void saveNormalOutward('SUBMIT') : undefined}
            saveLabel={saving ? 'Saving…' : 'Submit Outward'}
          />
        </>
      ) : !fromTransferOutward ? (
        <>
          <div className="mb-3">
            <div className="text-lg font-bold text-[var(--text)]">Pending Material Transfers</div>
            <div className="text-[12.5px] text-[var(--text2)]">
              Transfers waiting for outward gatepass — OU and locations are shown from the transfer
              document. Select one to prepare outward.
            </div>
          </div>
          {pendingTransfers.error && (
            <div className="mb-2 text-sm text-[var(--danger)]">{pendingTransfers.error}</div>
          )}
          {pendingTransfers.loading && (
            <div className="mb-2 text-sm text-[var(--text3)]">Loading pending transfers…</div>
          )}
          <DataTable
            columns={pendingColumns}
            rows={pendingTransfers.rows}
            searchPlaceholder="Search pending transfers…"
            onRowClick={(r) => void selectPendingTransfer(r)}
            emptyMessage="No transfers pending for outward gatepass."
          />
          <div className="mt-4">
            <Button variant="ghost" onClick={() => navigate(GATEPASS_BASE)}>
              Back to List
            </Button>
          </div>
        </>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Outward Details"
              subtitle="Linked to a material transfer — store, party, items and transfer type come from the transfer. Only Returnable / Non Returnable can be changed."
              actions={
                <Button variant="ghost" className="text-xs" onClick={clearLinkedTransfer} disabled={saving}>
                  Change Transfer
                </Button>
              }
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Outward No." required>
                  <Input value={AUTO_DOC_NO_LABEL} disabled />
                </Field>
                <Field label="Outward Date" required>
                  <Input type="date" value={outwardForm.date} disabled />
                </Field>
                <Field label="Transfer Type" required hint="From linked material transfer">
                  <Input value={transferTypeLabel(outwardForm.transferType)} readOnly disabled />
                </Field>
                <Field label="Returnable / Non Returnable" required>
                  <Select
                    value={outwardForm.returnFlag}
                    onChange={(e) => setOut('returnFlag', e.target.value)}
                  >
                    {(retFlagOpts.length
                      ? retFlagOpts
                      : [
                          { value: 'N', label: 'Non Returnable', code: 'N' },
                          { value: 'Y', label: 'Returnable', code: 'Y' },
                        ]
                    ).map((o) => (
                      <option key={o.code ?? o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Prepared By" required hint="Logged-in user">
                  <Input value={preparedByLabel} readOnly disabled />
                </Field>
                <Field label="Store (From)" required>
                  <Input value={linkedStoreLabel} readOnly disabled />
                </Field>
                <Field label="Customer / Party (To)" className="md:col-span-2">
                  <Input value={outwardForm.party} readOnly disabled />
                </Field>
                <div className="md:col-span-4 overflow-x-auto rounded-md border border-[var(--border)]">
                  <div className="border-b border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[11px] font-semibold text-[var(--text2)]">
                    Linked transfer lines
                    {transferOutwardLink?.transferNo ? ` — ${transferOutwardLink.transferNo}` : ''}
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--surface2)]">
                        {['#', 'Item', 'Qty', 'Unit', 'Serial'].map((h) => (
                          <th
                            key={h}
                            className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold uppercase text-[var(--text3)]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {linkedTransferLines.map((l, idx) => {
                        const label =
                          [l.itemCode, l.itemName].filter(Boolean).join(' – ') ||
                          itemLabelById[l.itemId] ||
                          l.itemId
                        return (
                          <tr key={`${l.itemId}-${idx}`}>
                            <td className="border-b border-[var(--border)] px-3 py-2 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="border-b border-[var(--border)] px-3 py-2">{label}</td>
                            <td className="border-b border-[var(--border)] px-3 py-2 tabular-nums">
                              {l.qty}
                            </td>
                            <td className="border-b border-[var(--border)] px-3 py-2">
                              {unitCodeById[l.uomId] || '—'}
                            </td>
                            <td className="border-b border-[var(--border)] px-3 py-2 font-mono">
                              {l.serialNo || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <Field label="Remarks" className="md:col-span-2">
                  <Input value={outwardForm.remarks} readOnly disabled />
                </Field>
              </div>
              <div className="mt-3">
                <AttachmentFields
                  url={outwardForm.attachmentUrl}
                  name={outwardForm.attachmentName}
                  onChange={({ url, name }) =>
                    setOutwardForm((p) => ({ ...p, attachmentUrl: url, attachmentName: name }))
                  }
                />
              </div>
            </CardBody>
          </Card>
          <FormActions
            onClear={clearLinkedTransfer}
            onBack={() => navigate(GATEPASS_BASE)}
            onSaveDraft={canSaveGp ? () => void saveOutward('SAVE_DRAFT') : undefined}
            draftLabel={saving ? 'Saving…' : 'Save Draft'}
            onSave={canSaveGp ? () => void saveOutward('SUBMIT') : undefined}
            saveLabel={saving ? 'Saving…' : 'Submit Outward'}
          />
        </>
      )}
    </FadeContent>
  )
}
