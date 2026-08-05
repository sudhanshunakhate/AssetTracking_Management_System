import { useCallback, useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import { createTxn, fetchTxn, numOrUndef, todayIso, useTxnList } from '@/api/transactions'
import { mapEmployee, mapItem, mapLocation, mapUnit, itemsForLocation, GEN_TYPE, useGenValues, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'

type Tab = 'inward' | 'outward'

export function GatepassPage() {
  const { canCreateMenu, canEditMenu } = useAuth()
  const canSaveGp = canCreateMenu('GP') || canEditMenu('GP')
  const [tab, setTab] = useState<Tab>('inward')
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
  const { rows: items } = useMasterList('items', mapItm)
  const { rows: units } = useMasterList('units', mapUnt)
  const { options: gpInOpts } = useGenValues(GEN_TYPE.GATEPASS_INWARD, 'code')
  const { options: retFlagOpts } = useGenValues(GEN_TYPE.RETURNABLE_FLAG, 'code')
  const outward = useTxnList('gatepass/outward')
  const inward = useTxnList('gatepass/inward')

  const returnableOutwards = useMemo(
    () => outward.rows.filter((r) => String(r.returnFlag).toUpperCase() === 'Y' || String(r.returnFlag).toLowerCase() === 'returnable'),
    [outward.rows],
  )

  const [inwardForm, setInwardForm] = useState({
    date: todayIso(),
    store: '',
    preparedBy: '',
    item: '',
    qty: '1',
    uom: '',
    remarks: '',
    returnableOutwardId: '',
  })
  const [outwardForm, setOutwardForm] = useState({
    date: todayIso(),
    store: '',
    preparedBy: '',
    returnFlag: 'N',
    party: '',
    item: '',
    qty: '1',
    uom: '',
    batch: '',
    remarks: '',
  })

  const inwardItems = useMemo(() => itemsForLocation(items, inwardForm.store), [items, inwardForm.store])
  const outwardItems = useMemo(() => itemsForLocation(items, outwardForm.store), [items, outwardForm.store])

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
      }
      if (k === 'item') {
        const item = items.find((i) => i.id === v)
        next.uom = item ? String(item.uom ?? '') : ''
      }
      return next
    })
  }

  const selectReturnableOutward = async (docId: string) => {
    setIn('returnableOutwardId', docId)
    if (!docId) return
    try {
      const doc = await fetchTxn('gatepass/outward', docId)
      const line = doc.lines?.[0]
      setInwardForm((p) => ({
        ...p,
        returnableOutwardId: docId,
        store: doc.locationId != null ? String(doc.locationId) : p.store,
        item: line?.itemId != null ? String(line.itemId) : p.item,
        uom: line?.uomId != null ? String(line.uomId) : p.uom,
        qty: line?.qty != null ? String(line.qty) : p.qty,
        remarks: doc.remarks ?? p.remarks,
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
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const itemId = numOrUndef(inwardForm.item)
      if (itemId == null) throw new Error('Item is required')
      const qty = numOrUndef(inwardForm.qty) ?? 1
      const uomId = resolveUom(inwardForm.item, inwardForm.uom)
      await createTxn('gatepass/inward', {
        docDate: inwardForm.date || todayIso(),
        locationId: numOrUndef(inwardForm.store),
        initiatedByEmpId: numOrUndef(inwardForm.preparedBy),
        refTxnHeaderId: numOrUndef(inwardForm.returnableOutwardId),
        remarks: inwardForm.remarks,
        docSubmitAction: action,
        lines: [
          {
            srNo: 1,
            itemId,
            uomId,
            qty,
            receivedQty: qty,
            acceptedQty: qty,
            locationId: numOrUndef(inwardForm.store),
          },
        ],
      })
      setMessage(action === 'SAVE_DRAFT' ? 'Inward gatepass saved as draft' : 'Inward gatepass submitted for approval')
      await inward.reload()
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
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const itemId = numOrUndef(outwardForm.item)
      if (itemId == null) throw new Error('Item is required')
      const qty = numOrUndef(outwardForm.qty) ?? 1
      const uomId = resolveUom(outwardForm.item, outwardForm.uom)
      await createTxn('gatepass/outward', {
        docDate: outwardForm.date || todayIso(),
        locationId: numOrUndef(outwardForm.store),
        fromLocationId: numOrUndef(outwardForm.store),
        initiatedByEmpId: numOrUndef(outwardForm.preparedBy),
        returnFlag: outwardForm.returnFlag,
        remarks: outwardForm.remarks || outwardForm.party,
        docSubmitAction: action,
        lines: [
          {
            srNo: 1,
            itemId,
            uomId,
            qty,
            batchLotNo: outwardForm.batch || undefined,
            locationId: numOrUndef(outwardForm.store),
          },
        ],
      })
      setMessage(action === 'SAVE_DRAFT' ? 'Outward gatepass saved as draft' : 'Outward gatepass completed')
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
        description="Single window for all store-gate movement — record material received (Inward) and issue Outward Forms from one place."
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
            <CardHeader title="Recent Inward Documents" subtitle="Loaded from /gatepass/inward" />
            <CardBody className="p-0">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)]">
                    {['Doc No', 'Date', 'Status'].map((h) => (
                      <th key={h} className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold uppercase text-[var(--text3)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inward.rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-[var(--text3)]">
                        No inward documents yet
                      </td>
                    </tr>
                  ) : (
                    inward.rows.map((r) => (
                      <tr key={r.id}>
                        <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{r.docNo}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{r.docDate}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{r.status}</td>
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
                subtitle="Choose an Outward Form marked Returnable — then save inward draft"
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Returnable Outward No." required className="md:col-span-2">
                    <Select
                      value={inwardForm.returnableOutwardId}
                      onChange={(e) => void selectReturnableOutward(e.target.value)}
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
                    <Select value={inwardForm.store} onChange={(e) => setIn('store', e.target.value)}>
                      <option value="">— Select Store —</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} – {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Received By">
                    <Select value={inwardForm.preparedBy} onChange={(e) => setIn('preparedBy', e.target.value)}>
                      <option value="">— Select Employee —</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.code} – {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Item" required className="md:col-span-2">
                    <Select value={inwardForm.item} onChange={(e) => setIn('item', e.target.value)}>
                      <option value="">{inwardForm.store ? '— Select Item —' : '— Select Store first —'}</option>
                      {inwardItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.code} – {i.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Qty" required>
                    <Input value={inwardForm.qty} onChange={(e) => setIn('qty', e.target.value)} type="number" />
                  </Field>
                  <Field label="Unit">
                    <Select value={inwardForm.uom} onChange={(e) => setIn('uom', e.target.value)}>
                      <option value="">—</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => void saveInward('SAVE_DRAFT')} disabled={saving || !canSaveGp}>
                    {saving ? 'Saving…' : 'Save Draft'}
                  </Button>
                  <Button onClick={() => void saveInward('SUBMIT')} disabled={saving || !canSaveGp}>
                    {saving ? 'Saving…' : 'Submit for Approval'}
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
                      <Input value="Auto-generated" disabled />
                    </Field>
                    <Field label="Inward Date" required>
                      <Input type="date" value={inwardForm.date} onChange={(e) => setIn('date', e.target.value)} />
                    </Field>
                    <Field label="Prepared By">
                      <Select value={inwardForm.preparedBy} onChange={(e) => setIn('preparedBy', e.target.value)}>
                        <option value="">— Select Employee —</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.code} – {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Store" required>
                      <Select value={inwardForm.store} onChange={(e) => setIn('store', e.target.value)}>
                        <option value="">— Select Store —</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} – {s.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Item" required className="md:col-span-2">
                      <Select value={inwardForm.item} onChange={(e) => setIn('item', e.target.value)}>
                        <option value="">{inwardForm.store ? '— Select Item —' : '— Select Store first —'}</option>
                        {inwardItems.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.code} – {i.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Qty" required>
                      <Input type="number" value={inwardForm.qty} onChange={(e) => setIn('qty', e.target.value)} />
                    </Field>
                    <Field label="Unit">
                      <Select value={inwardForm.uom} onChange={(e) => setIn('uom', e.target.value)}>
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
                </CardBody>
              </Card>
              <FormActions
                onClear={() =>
                  setInwardForm({
                    date: todayIso(),
                    store: '',
                    preparedBy: '',
                    item: '',
                    qty: '1',
                    uom: '',
                    remarks: '',
                    returnableOutwardId: '',
                  })
                }
                onBack={() => setInwardType('returnable')}
                onSaveDraft={canSaveGp ? () => void saveInward('SAVE_DRAFT') : undefined}
                draftLabel={saving ? 'Saving…' : 'Save Draft'}
                onSave={canSaveGp ? () => void saveInward('SUBMIT') : undefined}
                saveLabel={saving ? 'Saving…' : 'Submit for Approval'}
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
            <CardHeader title="Recent Outward Documents" subtitle="Loaded from /gatepass/outward" />
            <CardBody className="p-0">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)]">
                    {['Doc No', 'Date', 'Returnable', 'Status'].map((h) => (
                      <th key={h} className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold uppercase text-[var(--text3)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outward.rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-[var(--text3)]">
                        No outward documents yet
                      </td>
                    </tr>
                  ) : (
                    outward.rows.map((r) => (
                      <tr key={r.id}>
                        <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{r.docNo}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{r.docDate}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{r.returnFlag || '—'}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{r.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Outward Details" />
            <CardBody>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Outward No." required>
                  <Input value="Auto-generated" disabled />
                </Field>
                <Field label="Outward Date" required>
                  <Input type="date" value={outwardForm.date} onChange={(e) => setOut('date', e.target.value)} />
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
                <Field label="Prepared By" required>
                  <Select value={outwardForm.preparedBy} onChange={(e) => setOut('preparedBy', e.target.value)}>
                    <option value="">— Select Employee —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.code} – {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Store" required>
                  <Select value={outwardForm.store} onChange={(e) => setOut('store', e.target.value)}>
                    <option value="">— Select Store —</option>
                    {stores.map((s) => (
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
                  />
                </Field>
                <Field label="Item" required className="md:col-span-2">
                  <Select value={outwardForm.item} onChange={(e) => setOut('item', e.target.value)}>
                    <option value="">{outwardForm.store ? '— Select Item —' : '— Select Store first —'}</option>
                    {outwardItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.code} – {i.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Qty" required>
                  <Input type="number" value={outwardForm.qty} onChange={(e) => setOut('qty', e.target.value)} />
                </Field>
                <Field label="Unit">
                  <Select value={outwardForm.uom} onChange={(e) => setOut('uom', e.target.value)}>
                    <option value="">—</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Batch / Lot" hint="Optional — blank depletes FIFO">
                  <Input
                    value={outwardForm.batch}
                    onChange={(e) => setOut('batch', e.target.value)}
                    placeholder="Batch / lot"
                  />
                </Field>
                <Field label="Remarks" className="md:col-span-2">
                  <Input
                    placeholder="Remarks…"
                    value={outwardForm.remarks}
                    onChange={(e) => setOut('remarks', e.target.value)}
                  />
                </Field>
              </div>
            </CardBody>
          </Card>
          <FormActions
            onClear={() =>
              setOutwardForm({
                date: todayIso(),
                store: '',
                preparedBy: '',
                returnFlag: 'N',
                party: '',
                item: '',
                qty: '1',
                uom: '',
                batch: '',
                remarks: '',
              })
            }
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
