import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import { LookupSelect } from '@/components/form/LookupSelect'
import { createTxn, fetchTxn, numOrUndef, todayIso, useTxnList } from '@/api/transactions'
import {
  mapEmployee,
  mapItem,
  mapLocation,
  mapUnit,
  mapVendor,
  GEN_TYPE,
  useGenValues,
  useMasterList,
} from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { wholeQtyStr } from './lineGrid'
import { AttachmentFields, attachmentPayload } from './AttachmentSection'
import { GATEPASS_BASE } from './gatepassNavigation'
import { quickAddVendor, systemLocations, vendorOptions as toVendorOptions } from './txnLookups'
import { AUTO_DOC_NO_LABEL } from './txnConstants'
import {
  GatepassInwardItemLines,
  emptyGatepassInwardLine,
  resolveInwardReceiveLocation,
  type GatepassInwardLine,
} from './GatepassInwardItemLines'
import { ReturnableOutwardPickerModal } from './ReturnableOutwardPickerModal'
import { GatepassInwardItemPickerModal } from './GatepassInwardItemPickerModal'
import { navGroups } from '@/config/navigation'

const INSPECTION_APPROVAL_PATH =
  navGroups
    .flatMap((g) => g.items)
    .find((i) => i.menuCode === 'IAPR')?.path ?? '/transactions/inspection-approvals'

export function GatepassInwardForm() {
  const navigate = useNavigate()
  const { user, canCreateMenu, canEditMenu } = useAuth()
  const canSaveGp = canCreateMenu('GP') || canEditMenu('GP')
  const [inwardType, setInwardType] = useState<'returnable' | 'new'>('returnable')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [outwardPickerOpen, setOutwardPickerOpen] = useState(false)
  const [itemPickerOpen, setItemPickerOpen] = useState(false)

  const mapEmp = useCallback(mapEmployee, [])
  const mapLoc = useCallback(mapLocation, [])
  const mapItm = useCallback(mapItem, [])
  const mapUnt = useCallback(mapUnit, [])
  const mapVend = useCallback(mapVendor, [])
  const { rows: employees } = useMasterList('employees', mapEmp)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const systemStores = useMemo(
    () => systemLocations(stores).filter((l) => l.status !== 'Inactive'),
    [stores],
  )
  const { rows: items } = useMasterList('items', mapItm)
  const { rows: units } = useMasterList('units', mapUnt)
  const vendors = useMasterList('vendors', mapVend)
  const { options: gpInOpts } = useGenValues(GEN_TYPE.GATEPASS_INWARD, 'code')
  const outward = useTxnList('gatepass/outward')
  const inward = useTxnList('gatepass/inward')

  const vendorOptions = useMemo(() => toVendorOptions(vendors.rows), [vendors.rows])
  const addVendor = useMemo(() => quickAddVendor(vendors.reload), [vendors.reload])

  const sessionEmpId = user?.employeeId != null ? String(user.employeeId) : ''

  /** Inspectors must have a role assigned in Employee Master. */
  const inspectors = useMemo(
    () =>
      employees.filter(
        (e) => e.status !== 'Inactive' && String(e.role ?? '').trim() !== '',
      ),
    [employees],
  )
  const defaultInspectorId = useMemo(() => {
    if (sessionEmpId && inspectors.some((e) => e.id === sessionEmpId)) return sessionEmpId
    return inspectors[0]?.id ?? ''
  }, [inspectors, sessionEmpId])

  const returnableOutwards = useMemo(() => {
    const inwardLinkedOutwardIds = new Set(
      inward.rows.map((r) => r.refTxnHeaderId).filter((id) => Boolean(id)),
    )
    return outward.rows.filter((r) => {
      const isReturnable =
        String(r.returnFlag).toUpperCase() === 'Y' ||
        String(r.returnFlag).toLowerCase() === 'returnable'
      return isReturnable && !inwardLinkedOutwardIds.has(r.id)
    })
  }, [outward.rows, inward.rows])

  const [inwardForm, setInwardForm] = useState({
    date: todayIso(),
    store: '',
    preparedBy: sessionEmpId,
    inspectedBy: '',
    party: '',
    partyId: '',
    remarks: '',
    returnableOutwardId: '',
    attachmentUrl: '',
    attachmentName: '',
  })
  const [lines, setLines] = useState<GatepassInwardLine[]>([emptyGatepassInwardLine()])

  useEffect(() => {
    if (!sessionEmpId && !defaultInspectorId) return
    setInwardForm((p) => ({
      ...p,
      preparedBy: p.preparedBy || sessionEmpId,
      inspectedBy: p.inspectedBy || defaultInspectorId,
      date: p.date || todayIso(),
    }))
  }, [sessionEmpId, defaultInspectorId])

  useEffect(() => {
    setInwardForm((p) => {
      if (!p.inspectedBy) return p
      if (inspectors.some((e) => e.id === p.inspectedBy)) return p
      return { ...p, inspectedBy: defaultInspectorId }
    })
  }, [inspectors, defaultInspectorId])

  const resetInwardForm = useCallback(() => {
    setInwardForm({
      date: todayIso(),
      store: '',
      preparedBy: sessionEmpId,
      inspectedBy: defaultInspectorId,
      party: '',
      partyId: '',
      remarks: '',
      returnableOutwardId: '',
      attachmentUrl: '',
      attachmentName: '',
    })
    setLines([emptyGatepassInwardLine()])
    setError('')
    setMessage('')
  }, [sessionEmpId, defaultInspectorId])

  const switchInwardType = (next: 'returnable' | 'new') => {
    setInwardType(next)
    resetInwardForm()
  }

  const preparedByLabel = useMemo(() => {
    const emp = employees.find((e) => e.id === sessionEmpId)
    if (emp) {
      return `${emp.code} - ${String(emp.firstName ?? '')} ${String(emp.lastName ?? '')}`.trim()
    }
    return user?.displayName || sessionEmpId || '-'
  }, [employees, sessionEmpId, user?.displayName])

  const returnableInwardLocked =
    inwardType === 'returnable' && Boolean(inwardForm.returnableOutwardId)

  const selectedOutwardLabel = useMemo(() => {
    if (!inwardForm.returnableOutwardId) return ''
    const r = outward.rows.find((row) => row.id === inwardForm.returnableOutwardId)
    return r ? `${r.docNo} - ${r.docDate}` : inwardForm.returnableOutwardId
  }, [inwardForm.returnableOutwardId, outward.rows])

  const setIn = (k: keyof typeof inwardForm, v: string) => {
    setInwardForm((p) => ({ ...p, [k]: v }))
  }

  const selectReturnableOutward = async (docId: string) => {
    if (!docId) {
      setInwardForm((p) => ({
        ...p,
        returnableOutwardId: '',
        store: '',
        party: '',
        partyId: '',
        remarks: '',
      }))
      setLines([emptyGatepassInwardLine()])
      return
    }
    try {
      setError('')
      const doc = await fetchTxn('gatepass/outward', docId)
      const mapped: GatepassInwardLine[] = (doc.lines ?? [])
        .filter((l) => l.itemId != null)
        .map((l, idx) => {
          const itemId = String(l.itemId)
          const item = items.find((i) => i.id === itemId)
          const outwardLoc =
            doc.locationId != null
              ? String(doc.locationId)
              : l.locationId != null
                ? String(l.locationId)
                : ''
          const resolved = item
            ? resolveInwardReceiveLocation(item, stores)
            : {
                locationId: outwardLoc,
                homeStoreId: '',
                inspectionNeeded: false,
              }
          const inspectionNeeded = Boolean(item?.inspectionNeeded || resolved.inspectionNeeded)
          return {
            key: `ret-${docId}-${l.detailId ?? idx}`,
            itemId,
            itemCode: String(l.itemCode ?? item?.code ?? ''),
            itemName: String(l.itemName ?? item?.name ?? ''),
            qty: l.qty != null ? wholeQtyStr(l.qty) : '1',
            uomId: l.uomId != null ? String(l.uomId) : String(item?.uom ?? ''),
            serialNo: String(l.serialNo ?? l.batchLotNo ?? '')
              .trim()
              .toUpperCase(),
            remark: String(l.remark ?? ''),
            itemType: String(item?.itemType ?? ''),
            locationId: inspectionNeeded
              ? resolved.locationId || outwardLoc
              : outwardLoc,
            homeStoreId: resolved.homeStoreId || String(item?.store ?? ''),
            inspectionNeeded,
          }
        })
      setInwardForm((p) => ({
        ...p,
        returnableOutwardId: docId,
        store: doc.locationId != null ? String(doc.locationId) : p.store,
        party: (doc.partyAdd ?? doc.remarks ?? p.party).trim(),
        partyId: doc.partyId != null ? String(doc.partyId) : '',
        remarks: doc.remarks ?? p.remarks,
        preparedBy: p.preparedBy || sessionEmpId,
        inspectedBy: p.inspectedBy || defaultInspectorId,
      }))
      setLines(mapped.length ? mapped : [emptyGatepassInwardLine()])
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

  const needsInspection = useMemo(
    () =>
      lines.some(
        (l) =>
          l.itemId &&
          (l.inspectionNeeded || Boolean(items.find((i) => i.id === l.itemId)?.inspectionNeeded)),
      ),
    [lines, items],
  )

  const saveInward = async (action: 'SAVE_DRAFT' | 'SUBMIT') => {
    if (!canSaveGp) {
      setError('You do not have Create/Edit permission for Gatepass')
      return
    }
    if (inwardType === 'new') {
      if (!inwardForm.partyId) {
        setError('Vendor / Party / Customer is required')
        return
      }
    } else if (!inwardForm.party.trim()) {
      setError('Vendor / Party / Customer is required')
      return
    }
    if (inwardType === 'returnable') {
      if (!inwardForm.store) {
        setError('System store is required')
        return
      }
      const storeMeta = stores.find((s) => s.id === inwardForm.store)
      if (!storeMeta?.isSystemLocation) {
        setError('Inward must receive into a system-derived location')
        return
      }
      if (!inwardForm.returnableOutwardId) {
        setError('Select a returnable outward document')
        return
      }
      if (!inwardForm.preparedBy) {
        setError('Received By is required')
        return
      }
    }
    const filled = lines.filter((l) => l.itemId)
    if (filled.length === 0) {
      setError('Add at least one item line')
      return
    }
    for (let i = 0; i < filled.length; i++) {
      const l = filled[i]
      const item = items.find((it) => it.id === l.itemId)
      if (!item) {
        setError(`Line ${i + 1}: Item not found in Item Master`)
        return
      }
      const inspectionNeeded = l.inspectionNeeded || Boolean(item.inspectionNeeded)
      if (inwardType === 'new' || inspectionNeeded) {
        const resolved = resolveInwardReceiveLocation(item, stores)
        if (resolved.error) {
          setError(`Line ${i + 1}: ${resolved.error}`)
          return
        }
      }
    }
    if (needsInspection && !inwardForm.inspectedBy) {
      setError('To Be Inspected By is required when any item needs inspection')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      let entityId: number | undefined
      const payloadLines = filled.map((l, i) => {
        const itemId = numOrUndef(l.itemId)
        if (itemId == null) throw new Error(`Line ${i + 1}: Item is required`)
        const qty = numOrUndef(l.qty) ?? 0
        if (qty <= 0) throw new Error(`Line ${i + 1}: Qty must be greater than 0`)
        const item = items.find((it) => it.id === l.itemId)
        const needsSerial = Boolean(item?.isSerialized || item?.itemType === 'asset')
        const serialNo = l.serialNo.trim().toUpperCase()
        if (needsSerial && !serialNo) {
          throw new Error(`Line ${i + 1}: Serial No. is required for this item`)
        }
        // Preview/resolve from masters; backend re-resolves from DB on save/post.
        let lineLoc = numOrUndef(inwardForm.store) ?? numOrUndef(l.locationId)
        if (item && (inwardType === 'new' || item.inspectionNeeded || l.inspectionNeeded)) {
          const resolved = resolveInwardReceiveLocation(item, stores)
          if (resolved.error) throw new Error(`Line ${i + 1}: ${resolved.error}`)
          if (inwardType === 'new' || resolved.inspectionNeeded) {
            lineLoc = numOrUndef(resolved.locationId)
          }
          if (entityId == null) {
            entityId =
              numOrUndef(String(item.orgCode ?? '')) ??
              numOrUndef(
                String(stores.find((s) => s.id === resolved.homeStoreId)?.orgCode ?? ''),
              )
          }
        }
        return {
          srNo: i + 1,
          itemId,
          uomId: resolveUom(l.itemId, l.uomId),
          qty,
          receivedQty: qty,
          acceptedQty: qty,
          serialNo: serialNo || undefined,
          batchLotNo: serialNo || undefined,
          locationId: lineLoc,
          remark: l.remark || undefined,
        }
      })

      const headerLoc = needsInspection
        ? payloadLines.find((l) => {
            const item = items.find((it) => it.id === String(l.itemId))
            return Boolean(item?.inspectionNeeded)
          })?.locationId ?? payloadLines[0]?.locationId
        : numOrUndef(inwardForm.store) ?? payloadLines[0]?.locationId

      const selectedVendor = vendors.rows.find((v) => v.id === inwardForm.partyId)
      const partyAdd =
        inwardType === 'new'
          ? selectedVendor
            ? `${String(selectedVendor.code ?? '')} - ${String(selectedVendor.name ?? '')}`.trim()
            : inwardForm.party.trim()
          : inwardForm.party.trim()

      await createTxn('gatepass/inward', {
        docDate: inwardForm.date || todayIso(),
        entityId,
        locationId: headerLoc ?? undefined,
        partyId: inwardType === 'new' ? numOrUndef(inwardForm.partyId) : undefined,
        partyAdd: partyAdd || undefined,
        initiatedByEmpId: numOrUndef(inwardForm.preparedBy),
        inspectedByEmpId: needsInspection ? numOrUndef(inwardForm.inspectedBy) : undefined,
        refTxnHeaderId:
          inwardType === 'returnable' ? numOrUndef(inwardForm.returnableOutwardId) : undefined,
        remarks: inwardForm.remarks,
        ...attachmentPayload(inwardForm.attachmentUrl, inwardForm.attachmentName),
        docSubmitAction: action,
        lines: payloadLines,
      })
      setMessage(
        action === 'SAVE_DRAFT'
          ? 'Inward gatepass saved as draft'
          : needsInspection
            ? 'Inward submitted — inspection-needed items are in Quarantine. Complete Inspection Approval next.'
            : 'Inward gatepass completed',
      )
      if (action === 'SUBMIT') {
        navigate(needsInspection ? INSPECTION_APPROVAL_PATH : GATEPASS_BASE)
        return
      }
      resetInwardForm()
      await inward.reload()
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
        title="Material Inward"
        description="Record material received into stores - against a returnable Outward Form, or as a fresh inward entry."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {message && <div className="mb-2 text-sm text-[var(--accent)]">{message}</div>}

      <Card>
        <CardBody>
          <div className="max-w-sm">
            <Field label="Inward Type" required>
              <Select
                value={inwardType}
                onChange={(e) => switchInwardType(e.target.value as 'returnable' | 'new')}
              >
                {(gpInOpts.length
                  ? gpInOpts
                  : [
                      {
                        value: 'returnable',
                        label: 'Against Returnable Outward',
                        code: 'returnable',
                      },
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
          title={inwardType === 'returnable' ? 'Returnable Inward' : 'Inward Details'}
          subtitle={
            inwardType === 'returnable'
              ? returnableInwardLocked
                ? 'Lines come from the outward document. Confirm vendor, Received By, and inspector when inspection is needed.'
                : 'Choose an Outward Form marked Returnable, then confirm vendor and who received it.'
              : 'Header details — use Select Items… to add lines from Item Master.'
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Inward No." required>
              <Input value={AUTO_DOC_NO_LABEL} disabled />
            </Field>
            <Field label="Inward Date" required hint="Today">
              <Input type="date" value={inwardForm.date} readOnly disabled />
            </Field>
            {inwardType === 'returnable' ? (
              <>
                <Field
                  label="Returnable Outward No."
                  required
                  className="md:col-span-2"
                  hint={
                    returnableInwardLocked
                      ? 'Change via Item Details if needed'
                      : 'Opens a list with outward details and item lines'
                  }
                >
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={selectedOutwardLabel}
                      placeholder="- Select Outward No. -"
                      disabled={returnableInwardLocked}
                      className={
                        returnableInwardLocked ? undefined : 'cursor-pointer'
                      }
                      onClick={() => {
                        if (!returnableInwardLocked) setOutwardPickerOpen(true)
                      }}
                    />
                    {!returnableInwardLocked && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOutwardPickerOpen(true)}
                      >
                        Browse
                      </Button>
                    )}
                  </div>
                </Field>
                <Field label="Received By" required hint="Who received the material at the gate">
                  <Select
                    value={inwardForm.preparedBy}
                    onChange={(e) => setIn('preparedBy', e.target.value)}
                    disabled={!returnableInwardLocked}
                  >
                    <option value="">- Select Employee -</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.code} - {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                      </option>
                    ))}
                  </Select>
                </Field>
                {needsInspection && (
                  <Field
                    label="To Be Inspected By"
                    required
                    hint="Assigned on the pending Inspection Approval"
                  >
                    <Select
                      value={inwardForm.inspectedBy}
                      onChange={(e) => setIn('inspectedBy', e.target.value)}
                    >
                      <option value="">- Select Inspector -</option>
                      {inspectors.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.code} - {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </>
            ) : (
              <>
                <Field label="Prepared By" hint="Logged-in user">
                  <Input value={preparedByLabel} readOnly disabled />
                </Field>
                {needsInspection && (
                  <Field
                    label="To Be Inspected By"
                    required
                    hint="Assigned on the pending Inspection Approval"
                  >
                    <Select
                      value={inwardForm.inspectedBy}
                      onChange={(e) => setIn('inspectedBy', e.target.value)}
                    >
                      <option value="">- Select Inspector -</option>
                      {inspectors.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.code} - {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </>
            )}
            {inwardType === 'new' ? (
              <LookupSelect
                label="Vendor / Party / Customer"
                required
                className="md:col-span-2"
                value={inwardForm.partyId}
                onChange={(v) => setIn('partyId', v)}
                options={vendorOptions}
                placeholder="— Select Vendor —"
                quickAdd={addVendor}
              />
            ) : (
              <Field label="Vendor / Party / Customer" required className="md:col-span-2">
                <Input
                  placeholder="Vendor, party or customer name"
                  value={inwardForm.party}
                  onChange={(e) => setIn('party', e.target.value)}
                />
              </Field>
            )}
            <Field label="Remarks" className="md:col-span-2 xl:col-span-4">
              <Input
                placeholder="Remarks..."
                value={inwardForm.remarks}
                onChange={(e) => setIn('remarks', e.target.value)}
                disabled={returnableInwardLocked}
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

      <GatepassInwardItemLines
        lines={lines}
        onChange={setLines}
        items={items}
        units={units}
        locations={stores}
        storeLocationId={inwardForm.store}
        systemStores={systemStores}
        onStoreChange={undefined}
        itemFirst={inwardType === 'new'}
        allowAddItems={inwardType === 'new'}
        onOpenPicker={inwardType === 'new' ? () => setItemPickerOpen(true) : undefined}
        locked={returnableInwardLocked}
        onChangeOutward={
          returnableInwardLocked ? () => void selectReturnableOutward('') : undefined
        }
      />

      <FormActions
        onClear={resetInwardForm}
        onBack={() => navigate(GATEPASS_BASE)}
        onSaveDraft={canSaveGp ? () => void saveInward('SAVE_DRAFT') : undefined}
        draftLabel={saving ? 'Saving...' : 'Save Draft'}
        onSave={canSaveGp ? () => void saveInward('SUBMIT') : undefined}
        saveLabel={saving ? 'Saving...' : 'Submit Inward'}
      />

      <ReturnableOutwardPickerModal
        open={outwardPickerOpen}
        onClose={() => setOutwardPickerOpen(false)}
        rows={returnableOutwards}
        locations={stores}
        units={units}
        loading={outward.loading || inward.loading}
        onSelect={(docId) => {
          setOutwardPickerOpen(false)
          void selectReturnableOutward(docId)
        }}
      />

      <GatepassInwardItemPickerModal
        open={itemPickerOpen}
        onClose={() => setItemPickerOpen(false)}
        items={items}
        units={units}
        locations={stores}
        onComplete={(added) => {
          setLines((prev) => [...prev.filter((l) => l.itemId), ...added])
        }}
      />
    </FadeContent>
  )
}
