import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Pill, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import {
  createTxn,
  fetchAvailableSerials,
  fetchTxn,
  numOrUndef,
  todayIso,
  useTxnList,
  type AvailableSerialUnit,
} from '@/api/transactions'
import { mapEmployee, mapItem, mapLocation, mapUnit, itemsForLocation, GEN_TYPE, useGenValues, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { filterRowsByStatus, txnStatusFilterOptions } from '@/lib/listOrder'
import { SearchableItemSelect, useLocationStock, wholeQtyStr } from './lineGrid'
import { AttachmentFields, AttachmentLink, attachmentPayload } from './AttachmentSection'
import { GATEPASS_OUTWARD_PREFILL_KEY, type GatepassOutwardNavState } from './gatepassNavigation'
import type { GatepassOutwardPrefill } from './transferGatepassBridge'
import { locLabel, systemLocations } from './txnLookups'

export function GatepassPage() {
  const location = useLocation()
  const { user, canCreateMenu, canEditMenu } = useAuth()
  const canSaveGp = canCreateMenu('GP') || canEditMenu('GP')
  const [tab, setTab] = useState<'inward' | 'outward'>('inward')
  const [inwardType, setInwardType] = useState<'returnable' | 'new'>('returnable')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const mapEmp = useCallback(mapEmployee, [])
  const mapLoc = useCallback(mapLocation, [])
  const mapItm = useCallback(mapItem, [])
  const mapUnt = useCallback(mapUnit, [])
  const { rows: employees } = useMasterList('employees', mapEmp)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const systemStores = useMemo(() => systemLocations(stores), [stores])
  const { rows: items } = useMasterList('items', mapItm)
  const { rows: units } = useMasterList('units', mapUnt)
  const { options: gpInOpts } = useGenValues(GEN_TYPE.GATEPASS_INWARD, 'code')
  const { options: retFlagOpts } = useGenValues(GEN_TYPE.RETURNABLE_FLAG, 'code')
  const outward = useTxnList('gatepass/outward')
  const inward = useTxnList('gatepass/inward')
  const [inwardStatusFilter, setInwardStatusFilter] = useState('')
  const [outwardStatusFilter, setOutwardStatusFilter] = useState('')
  const inwardStatusOptions = useMemo(() => txnStatusFilterOptions(inward.rows), [inward.rows])
  const outwardStatusOptions = useMemo(() => txnStatusFilterOptions(outward.rows), [outward.rows])
  const filteredInward = useMemo(
    () => filterRowsByStatus(inward.rows, inwardStatusFilter),
    [inward.rows, inwardStatusFilter],
  )
  const filteredOutward = useMemo(
    () => filterRowsByStatus(outward.rows, outwardStatusFilter),
    [outward.rows, outwardStatusFilter],
  )

  const sessionEmpId = user?.employeeId != null ? String(user.employeeId) : ''

  const returnableOutwards = useMemo(() => {
    const inwardLinkedOutwardIds = new Set(
      inward.rows.map((r) => r.refTxnHeaderId).filter((id) => Boolean(id)),
    )
    return outward.rows.filter((r) => {
      const isReturnable =
        String(r.returnFlag).toUpperCase() === 'Y' || String(r.returnFlag).toLowerCase() === 'returnable'
      return isReturnable && !inwardLinkedOutwardIds.has(r.id)
    })
  }, [outward.rows, inward.rows])

  const [inwardForm, setInwardForm] = useState({
    date: todayIso(),
    store: '',
    preparedBy: sessionEmpId,
    item: '',
    qty: '1',
    uom: '',
    remarks: '',
    serialNo: '',
    returnableOutwardId: '',
    attachmentUrl: '',
    attachmentName: '',
  })
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
  const [transferOutwardLink, setTransferOutwardLink] = useState<GatepassOutwardPrefill | null>(null)
  const [outwardSerials, setOutwardSerials] = useState<AvailableSerialUnit[]>([])

  /* When /auth/me fills employeeId after mount */
  useEffect(() => {
    if (!sessionEmpId) return
    setInwardForm((p) => (p.preparedBy ? p : { ...p, preparedBy: sessionEmpId, date: p.date || todayIso() }))
    setOutwardForm((p) => (p.preparedBy ? p : { ...p, preparedBy: sessionEmpId, date: p.date || todayIso() }))
  }, [sessionEmpId])

  /* Outward from Material Transfer — only transfer type + returnable are editable; lines come from the transfer on submit. */
  useEffect(() => {
    const state = location.state as GatepassOutwardNavState | null
    const prefill = state?.[GATEPASS_OUTWARD_PREFILL_KEY]
    if (!prefill) return
    setTab('outward')
    setTransferOutwardLink(prefill)
    setLinkedTransferId(prefill.transferDocId || '')
    setOutwardForm({
      date: '',
      store: '',
      preparedBy: sessionEmpId,
      transferType: prefill.transferType || 'INTERNAL',
      returnFlag: prefill.returnFlag || 'N',
      party: '',
      item: '',
      qty: '',
      uom: '',
      batch: '',
      serialNo: '',
      remarks: '',
      attachmentUrl: '',
      attachmentName: '',
    })
    setMessage('Material transfer linked — set Transfer Type and Returnable / Non Returnable, then submit.')
    window.history.replaceState({}, document.title)
  }, [location.state, sessionEmpId])

  const resetInwardForm = useCallback(() => {
    setInwardForm({
      date: todayIso(),
      store: '',
      preparedBy: sessionEmpId,
      item: '',
      qty: '1',
      uom: '',
      remarks: '',
      serialNo: '',
      returnableOutwardId: '',
      attachmentUrl: '',
      attachmentName: '',
    })
  }, [sessionEmpId])

  const refreshInward = useCallback(async () => {
    await inward.reload()
    await outward.reload()
  }, [inward, outward])

  const transferTypeLabel = (value: string) => {
    const t = value.toUpperCase()
    if (t === 'OU' || t === 'OPR') return 'OU Transfer'
    if (t === 'INTERNAL') return 'Internal Transfer'
    return value || '—'
  }

  const preparedByLabel = useMemo(() => {
    const emp = employees.find((e) => e.id === sessionEmpId)
    if (emp) return `${emp.code} – ${String(emp.firstName ?? '')} ${String(emp.lastName ?? '')}`.trim()
    return user?.displayName || sessionEmpId || '—'
  }, [employees, sessionEmpId, user?.displayName])

  const inwardItems = useMemo(() => itemsForLocation(items, inwardForm.store), [items, inwardForm.store])
  const outwardItems = useMemo(() => itemsForLocation(items, outwardForm.store), [items, outwardForm.store])
  const { stockByItemId: inwardStock } = useLocationStock(inwardForm.store)
  const { stockByItemId: outwardStock } = useLocationStock(outwardForm.store)
  const locationByItemId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const i of items) {
      const loc = stores.find((l) => l.id === String(i.store ?? ''))
      if (loc) map[i.id] = locLabel(loc)
    }
    return map
  }, [items, stores])

  const inwardHeaderReady = Boolean(inwardForm.store) && (inwardType === 'new' || Boolean(inwardForm.returnableOutwardId))
  const returnableInwardLocked = inwardType === 'returnable' && Boolean(inwardForm.returnableOutwardId)
  const inwardSelectedItem = useMemo(
    () => items.find((i) => i.id === inwardForm.item),
    [items, inwardForm.item],
  )
  const inwardNeedsSerial = Boolean(
    inwardSelectedItem?.isSerialized || inwardSelectedItem?.itemType === 'asset',
  )
  const fromTransferOutward = Boolean(transferOutwardLink)
  const outwardSelectedItem = useMemo(
    () => items.find((i) => i.id === outwardForm.item),
    [items, outwardForm.item],
  )
  const outwardNeedsSerial = Boolean(
    !fromTransferOutward &&
      (outwardSelectedItem?.isSerialized || outwardSelectedItem?.itemType === 'asset'),
  )
  const outwardHeaderReady = fromTransferOutward
    ? Boolean(outwardForm.returnFlag && outwardForm.transferType)
    : Boolean(outwardForm.store && outwardForm.returnFlag && outwardForm.transferType)

  const setIn = (k: keyof typeof inwardForm, v: string) => {
    setInwardForm((p) => {
      const next = { ...p, [k]: v }
      if (k === 'store') {
        next.item = ''
        next.uom = ''
      }
      if (k === 'item') {
        const item = items.find((i) => i.id === v)
        next.uom = item ? String(item.uom ?? '') : ''
      }
      return next
    })
  }
  const setOut = (k: keyof typeof outwardForm, v: string) => {
    setOutwardForm((p) => {
      const next = { ...p, [k]: v }
      if (k === 'store') {
        next.item = ''
        next.uom = ''
        next.serialNo = ''
        next.batch = ''
      }
      if (k === 'item') {
        const item = items.find((i) => i.id === v)
        next.uom = item ? String(item.uom ?? '') : ''
        next.serialNo = ''
        next.batch = ''
      }
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    if (!outwardNeedsSerial || !outwardForm.item || !outwardForm.store) {
      setOutwardSerials([])
      return
    }
    void fetchAvailableSerials(Number(outwardForm.item), Number(outwardForm.store))
      .then((units) => {
        if (!cancelled) setOutwardSerials(units)
      })
      .catch(() => {
        if (!cancelled) setOutwardSerials([])
      })
    return () => {
      cancelled = true
    }
  }, [outwardNeedsSerial, outwardForm.item, outwardForm.store])

  const selectReturnableOutward = async (docId: string) => {
    setIn('returnableOutwardId', docId)
    if (!docId) {
      setInwardForm((p) => ({
        ...p,
        returnableOutwardId: '',
        store: '',
        item: '',
        qty: '1',
        uom: '',
        serialNo: '',
        remarks: '',
      }))
      return
    }
    try {
      const doc = await fetchTxn('gatepass/outward', docId)
      const line = doc.lines?.[0]
      setInwardForm((p) => ({
        ...p,
        returnableOutwardId: docId,
        store: doc.locationId != null ? String(doc.locationId) : p.store,
        item: line?.itemId != null ? String(line.itemId) : p.item,
        uom: line?.uomId != null ? String(line.uomId) : p.uom,
        qty: line?.qty != null ? wholeQtyStr(line.qty) : p.qty,
        remarks: doc.remarks ?? p.remarks,
        serialNo: String(line?.serialNo ?? line?.batchLotNo ?? '').trim().toUpperCase(),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load outward document')
    }
  }

  const resolveUom = (itemId: string | undefined, uom: string) => {
    const fromForm = numOrUndef(uom)
    if (fromForm != null) return fromForm
    const item = items.find((i) => i.id === String(itemId ?? ''))
    return numOrUndef(item?.uom)
  }

  const saveInward = async (action: 'SAVE_DRAFT' | 'SUBMIT') => {
    if (!canSaveGp) {
      setError('You do not have Create/Edit permission for Gatepass')
      return
    }
    if (returnableInwardLocked && !inwardForm.preparedBy) {
      setError('Received By is required')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const itemId = numOrUndef(inwardForm.item)
      if (itemId == null) throw new Error('Item is required')
      const qty = numOrUndef(inwardForm.qty) ?? 1
      const uomId = resolveUom(inwardForm.item, inwardForm.uom)
      const serialNo = inwardForm.serialNo.trim().toUpperCase()
      if (inwardNeedsSerial && !serialNo) {
        throw new Error('Serial No. is required for this item')
      }
      await createTxn('gatepass/inward', {
        docDate: inwardForm.date || todayIso(),
        locationId: numOrUndef(inwardForm.store),
        initiatedByEmpId: numOrUndef(inwardForm.preparedBy),
        refTxnHeaderId: numOrUndef(inwardForm.returnableOutwardId),
        remarks: inwardForm.remarks,
        ...attachmentPayload(inwardForm.attachmentUrl, inwardForm.attachmentName),
        docSubmitAction: action,
        lines: [
          {
            srNo: 1,
            itemId,
            uomId,
            qty,
            receivedQty: qty,
            acceptedQty: qty,
            serialNo: serialNo || undefined,
            batchLotNo: serialNo || undefined,
            locationId: numOrUndef(inwardForm.store),
          },
        ],
      })
      setMessage(action === 'SAVE_DRAFT' ? 'Inward gatepass saved as draft' : 'Inward gatepass completed')
      await refreshInward()
      resetInwardForm()
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
    if (!outwardForm.transferType || !outwardForm.returnFlag) {
      setError('Transfer Type and Returnable / Non Returnable are required')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const link = transferOutwardLink
      const storeId = link?.storeId || outwardForm.store
      const docDate = link?.date || outwardForm.date || todayIso()

      let lines: Array<{
        srNo: number
        itemId?: number
        uomId?: number
        qty?: number
        batchLotNo?: string
        serialNo?: string
        locationId?: number
      }>

      if (link && link.lines.length > 0) {
        lines = link.lines.map((l, i) => ({
          srNo: i + 1,
          itemId: numOrUndef(l.itemId),
          uomId: numOrUndef(l.uomId) ?? resolveUom(l.itemId, ''),
          qty: numOrUndef(l.qty) ?? 1,
          batchLotNo: l.batch || undefined,
          locationId: numOrUndef(storeId),
        }))
      } else {
        const itemId = numOrUndef(outwardForm.item)
        if (itemId == null) throw new Error('Item is required')
        const qty = numOrUndef(outwardForm.qty) ?? 1
        const uomId = resolveUom(outwardForm.item, outwardForm.uom)
        const serialNo = outwardForm.serialNo.trim().toUpperCase()
        if (outwardNeedsSerial && !serialNo) {
          throw new Error('Serial No. is required for asset outward')
        }
        lines = [
          {
            srNo: 1,
            itemId,
            uomId,
            qty,
            batchLotNo: serialNo || outwardForm.batch || undefined,
            serialNo: serialNo || undefined,
            locationId: numOrUndef(storeId),
          },
        ]
      }

      await createTxn('gatepass/outward', {
        docDate,
        locationId: numOrUndef(storeId),
        fromLocationId: numOrUndef(storeId),
        initiatedByEmpId: numOrUndef(outwardForm.preparedBy),
        returnFlag: outwardForm.returnFlag,
        docSubtype: outwardForm.transferType,
        refTxnHeaderId: numOrUndef(linkedTransferId),
        remarks: fromTransferOutward ? undefined : outwardForm.remarks || outwardForm.party || undefined,
        ...attachmentPayload(outwardForm.attachmentUrl, outwardForm.attachmentName),
        docSubmitAction: action,
        lines,
      })
      setMessage(action === 'SAVE_DRAFT' ? 'Outward gatepass saved as draft' : 'Outward gatepass completed')
      if (action === 'SUBMIT' && linkedTransferId) {
        setLinkedTransferId('')
        setTransferOutwardLink(null)
      }
      await outward.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FadeContent>
      <PageHeader
        title="Gatepass"
        description="Single window for store-gate movement — create Inward or Outward forms. Submit completes stock posting immediately (no approval step). Recent documents below are read-only."
      />

      {(inward.error || outward.error) && (
        <div className="mb-2 text-sm text-[var(--danger)]">{inward.error || outward.error}</div>
      )}
      {(inward.loading || outward.loading) && (
        <div className="mb-2 text-sm text-[var(--text3)]">Loading gatepass lists…</div>
      )}
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {message && <div className="mb-2 text-sm text-[var(--accent)]">{message}</div>}

      <div className="mb-4 flex gap-2.5 border-b border-[var(--border)] pb-3.5">
        <Button variant={tab === 'inward' ? 'primary' : 'ghost'} onClick={() => setTab('inward')}>
          Material Inward ({inward.rows.length})
        </Button>
        <Button variant={tab === 'outward' ? 'primary' : 'danger'} onClick={() => setTab('outward')}>
          Outward Form ({outward.rows.length})
        </Button>
      </div>

      {tab === 'inward' ? (
        <div>
          <div className="mb-3">
            <div className="text-lg font-bold text-[var(--text)]">Material Inward</div>
            <div className="text-[12.5px] text-[var(--text2)]">
              Record material received into stores — against a returnable Outward Form, or as a fresh inward entry.
            </div>
          </div>

          <Card>
            <CardBody>
              <div className="max-w-sm">
                <Field label="Inward Type" required>
                  <Select
                    value={inwardType}
                    onChange={(e) => setInwardType(e.target.value as 'returnable' | 'new')}
                  >
                    {(gpInOpts.length
                      ? gpInOpts
                      : [
                          { value: 'returnable', label: 'Against Returnable Outward', code: 'returnable' },
                          { value: 'new', label: 'New Inward Entry', code: 'new' },
                        ]
                    ).map((o) => (
                      <option key={o.code ?? o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recent Inward Documents"
              subtitle="Loaded from /gatepass/inward"
              actions={
                <Select
                  value={inwardStatusFilter}
                  onChange={(e) => setInwardStatusFilter(e.target.value)}
                  className="min-w-[140px] text-xs"
                >
                  {inwardStatusOptions.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              }
            />
            <CardBody className="p-0">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)]">
                    {['Doc No', 'Date', 'Status', 'Attachment'].map((h) => (
                      <th key={h} className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold uppercase text-[var(--text3)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInward.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-[var(--text3)]">
                        No inward documents yet
                      </td>
                    </tr>
                  ) : (
                    filteredInward.map((r) => (
                      <tr key={r.id}>
                        <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{r.docNo}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{r.docDate}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">
                          <StatusPill status={r.status || '—'} />
                        </td>
                        <td className="border-b border-[var(--border)] px-3 py-2">
                          <AttachmentLink url={String(r.attachmentUrl ?? '')} name={String(r.attachmentName ?? '')} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {inwardType === 'returnable' ? (
            <Card>
              <CardHeader
                title="Select Returnable Outward"
                subtitle={
                  returnableInwardLocked
                    ? 'Details are taken from the outward document. You can change Received By and Serial No.'
                    : 'Choose an Outward Form marked Returnable — then confirm who received it.'
                }
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Returnable Outward No." required className="md:col-span-2">
                    <Select
                      value={inwardForm.returnableOutwardId}
                      onChange={(e) => void selectReturnableOutward(e.target.value)}
                      disabled={returnableInwardLocked}
                    >
                      <option value="">— Select Outward No. —</option>
                      {returnableOutwards.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.docNo} – {r.docDate}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Store" required>
                    <Select
                      value={inwardForm.store}
                      onChange={(e) => setIn('store', e.target.value)}
                      disabled={returnableInwardLocked}
                    >
                      <option value="">— Select Store —</option>
                      {systemStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} – {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Received By" required hint="Who received the material at the gate">
                    <Select
                      value={inwardForm.preparedBy}
                      onChange={(e) => setIn('preparedBy', e.target.value)}
                      disabled={!returnableInwardLocked}
                    >
                      <option value="">— Select Employee —</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.code} – {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Item" required className="md:col-span-2">
                    <SearchableItemSelect
                      value={inwardForm.item}
                      onChange={(id) => setIn('item', id)}
                      items={inwardItems}
                      stockByItemId={inwardStock}
                      locationByItemId={locationByItemId}
                      disabled={returnableInwardLocked || !inwardHeaderReady}
                      placeholder={
                        !inwardHeaderReady ? '— Complete header fields first —' : '— Select Item —'
                      }
                    />
                  </Field>
                  <Field label="Qty" required>
                    <Input
                      value={inwardForm.qty}
                      onChange={(e) => setIn('qty', e.target.value)}
                      type="number"
                      step="1"
                      disabled={returnableInwardLocked || !inwardHeaderReady}
                    />
                  </Field>
                  <Field label="Unit">
                    <Select
                      value={inwardForm.uom}
                      onChange={(e) => setIn('uom', e.target.value)}
                      disabled={returnableInwardLocked || !inwardHeaderReady}
                    >
                      <option value="">—</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {inwardNeedsSerial && (
                    <Field
                      label="Serial No."
                      required
                      hint="Enter the asset serial being returned at the gate"
                      className="md:col-span-2"
                    >
                      <Input
                        value={inwardForm.serialNo}
                        onChange={(e) => setIn('serialNo', e.target.value.toUpperCase())}
                        disabled={!returnableInwardLocked}
                        placeholder="Serial number"
                      />
                    </Field>
                  )}
                </div>
                <div className="mt-3">
                  <AttachmentFields
                    url={inwardForm.attachmentUrl}
                    name={inwardForm.attachmentName}
                    onChange={({ url, name }) =>
                      setInwardForm((p) => ({ ...p, attachmentUrl: url, attachmentName: name }))
                    }
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {returnableInwardLocked && (
                    <Button
                      variant="ghost"
                      onClick={() => void selectReturnableOutward('')}
                      disabled={saving}
                    >
                      Change Outward
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => void saveInward('SAVE_DRAFT')} disabled={saving || !canSaveGp}>
                    {saving ? 'Saving…' : 'Save Draft'}
                  </Button>
                  <Button onClick={() => void saveInward('SUBMIT')} disabled={saving || !canSaveGp}>
                    {saving ? 'Saving…' : 'Submit Inward'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader title="Inward Details" />
                <CardBody>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Inward No." required>
                      <Input value={AUTO_DOC_NO_LABEL} disabled />
                    </Field>
                    <Field label="Inward Date" required hint="Today">
                      <Input type="date" value={inwardForm.date} readOnly disabled />
                    </Field>
                    <Field label="Prepared By" hint="Logged-in user">
                      <Input value={preparedByLabel} readOnly disabled />
                    </Field>
                    <Field label="Store" required>
                      <Select value={inwardForm.store} onChange={(e) => setIn('store', e.target.value)}>
                        <option value="">— Select Store —</option>
                        {systemStores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} – {s.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Item" required className="md:col-span-2">
                      <SearchableItemSelect
                        value={inwardForm.item}
                        onChange={(id) => setIn('item', id)}
                        items={inwardItems}
                        stockByItemId={inwardStock}
                        locationByItemId={locationByItemId}
                        disabled={!inwardHeaderReady}
                        placeholder={
                          !inwardHeaderReady ? '— Complete header fields first —' : '— Select Item —'
                        }
                      />
                    </Field>
                    <Field label="Qty" required>
                      <Input
                        type="number"
                        step="1"
                        value={inwardForm.qty}
                        onChange={(e) => setIn('qty', e.target.value)}
                        disabled={!inwardHeaderReady}
                      />
                    </Field>
                    <Field label="Unit">
                      <Select
                        value={inwardForm.uom}
                        onChange={(e) => setIn('uom', e.target.value)}
                        disabled={!inwardHeaderReady}
                      >
                        <option value="">—</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Remarks" className="md:col-span-2">
                      <Input
                        placeholder="Remarks…"
                        value={inwardForm.remarks}
                        onChange={(e) => setIn('remarks', e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <AttachmentFields
                      url={inwardForm.attachmentUrl}
                      name={inwardForm.attachmentName}
                      onChange={({ url, name }) =>
                        setInwardForm((p) => ({ ...p, attachmentUrl: url, attachmentName: name }))
                      }
                    />
                  </div>
                </CardBody>
              </Card>
              <FormActions
                onClear={() => resetInwardForm()}
                onBack={() => setInwardType('returnable')}
                onSaveDraft={canSaveGp ? () => void saveInward('SAVE_DRAFT') : undefined}
                draftLabel={saving ? 'Saving…' : 'Save Draft'}
                onSave={canSaveGp ? () => void saveInward('SUBMIT') : undefined}
                saveLabel={saving ? 'Saving…' : 'Submit Inward'}
              />
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <div className="text-lg font-bold text-[var(--text)]">Outward Form</div>
            <div className="text-[12.5px] text-[var(--text2)]">
              Issue material out of the store gate — returnable or non-returnable.
            </div>
          </div>

          <Card>
            <CardHeader
              title="Recent Outward Documents"
              subtitle="Loaded from /gatepass/outward"
              actions={
                <Select
                  value={outwardStatusFilter}
                  onChange={(e) => setOutwardStatusFilter(e.target.value)}
                  className="min-w-[140px] text-xs"
                >
                  {outwardStatusOptions.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              }
            />
            <CardBody className="p-0">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)]">
                    {['Doc No', 'Date', 'Transfer Type', 'Returnable', 'Status', 'Attachment'].map((h) => (
                      <th key={h} className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold uppercase text-[var(--text3)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOutward.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-[var(--text3)]">
                        No outward documents yet
                      </td>
                    </tr>
                  ) : (
                    filteredOutward.map((r) => (
                      <tr key={r.id}>
                        <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{r.docNo}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{r.docDate}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">
                          {transferTypeLabel(String(r.docSubtype ?? ''))}
                        </td>
                        <td className="border-b border-[var(--border)] px-3 py-2">
                          {r.returnFlag ? <Pill>{String(r.returnFlag)}</Pill> : '—'}
                        </td>
                        <td className="border-b border-[var(--border)] px-3 py-2">
                          <StatusPill status={r.status || '—'} />
                        </td>
                        <td className="border-b border-[var(--border)] px-3 py-2">
                          <AttachmentLink url={String(r.attachmentUrl ?? '')} name={String(r.attachmentName ?? '')} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Outward Details"
              subtitle={
                fromTransferOutward
                  ? 'Linked to a material transfer — item, store and party come from the transfer. Only Transfer Type and Returnable / Non Returnable can be changed.'
                  : undefined
              }
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
                    disabled={fromTransferOutward}
                  />
                </Field>
                <Field label="Transfer Type" required>
                  <Select
                    value={outwardForm.transferType}
                    onChange={(e) => setOut('transferType', e.target.value)}
                  >
                    <option value="INTERNAL">Internal Transfer</option>
                    <option value="OU">OU Transfer</option>
                  </Select>
                </Field>
                <Field label="Returnable / Non Returnable" required>
                  <Select value={outwardForm.returnFlag} onChange={(e) => setOut('returnFlag', e.target.value)}>
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
                <Field label="Store" required>
                  <Select
                    value={outwardForm.store}
                    onChange={(e) => setOut('store', e.target.value)}
                    disabled={fromTransferOutward}
                  >
                    <option value="">— Select Store —</option>
                    {systemStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} – {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Customer / Party" className="md:col-span-2">
                  <Input
                    placeholder="Customer or receiving party"
                    value={outwardForm.party}
                    onChange={(e) => setOut('party', e.target.value)}
                    disabled={fromTransferOutward}
                  />
                </Field>
                <Field label="Item" required className="md:col-span-2">
                  <SearchableItemSelect
                    value={outwardForm.item}
                    onChange={(id) => setOut('item', id)}
                    items={outwardItems}
                    stockByItemId={outwardStock}
                    locationByItemId={locationByItemId}
                    disabled={fromTransferOutward || !outwardHeaderReady}
                    placeholder={
                      fromTransferOutward
                        ? '— From linked transfer —'
                        : !outwardHeaderReady
                          ? '— Complete header fields first —'
                          : '— Select Item —'
                    }
                  />
                </Field>
                <Field label="Qty" required>
                  <Input
                    type="number"
                    step="1"
                    value={outwardForm.qty}
                    onChange={(e) => setOut('qty', e.target.value)}
                    disabled={fromTransferOutward || !outwardHeaderReady || outwardNeedsSerial}
                  />
                </Field>
                <Field label="Unit">
                  <Select
                    value={outwardForm.uom}
                    onChange={(e) => setOut('uom', e.target.value)}
                    disabled={fromTransferOutward || !outwardHeaderReady}
                  >
                    <option value="">—</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code}
                      </option>
                    ))}
                  </Select>
                </Field>
                {outwardNeedsSerial ? (
                  <Field label="Serial No." required className="md:col-span-2" hint="Non-issued units at this store">
                    <Select
                      value={outwardForm.serialNo}
                      onChange={(e) => setOut('serialNo', e.target.value.toUpperCase())}
                      disabled={fromTransferOutward || !outwardHeaderReady}
                    >
                      <option value="">— Select serial —</option>
                      {outwardSerials.map((u) => (
                        <option key={u.blsId} value={String(u.serialNo ?? '')}>
                          {u.serialNo}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field label="Batch / Lot" hint="Optional — blank depletes FIFO">
                    <Input
                      value={outwardForm.batch}
                      onChange={(e) => setOut('batch', e.target.value)}
                      placeholder="Batch / lot"
                      disabled={fromTransferOutward || !outwardHeaderReady}
                    />
                  </Field>
                )}
                <Field label="Remarks" className="md:col-span-2">
                  <Input
                    placeholder="Remarks…"
                    value={outwardForm.remarks}
                    onChange={(e) => setOut('remarks', e.target.value)}
                    disabled={fromTransferOutward}
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
          <FormActions
            onClear={() => {
              setLinkedTransferId('')
              setTransferOutwardLink(null)
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
            }}
            onBack={() => setTab('inward')}
            onSaveDraft={canSaveGp ? () => void saveOutward('SAVE_DRAFT') : undefined}
            draftLabel={saving ? 'Saving…' : 'Save Draft'}
            onSave={canSaveGp ? () => void saveOutward('SUBMIT') : undefined}
            saveLabel={saving ? 'Saving…' : 'Submit Outward'}
          />
        </div>
      )}
    </FadeContent>
  )
}
