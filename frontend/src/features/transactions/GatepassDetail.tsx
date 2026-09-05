import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchTxn, type TxnDocument } from '@/api/transactions'
import { mapEmployee, mapLocation, mapUnit, useMasterList } from '@/api/masters'
import { AttachmentLink } from './AttachmentSection'
import { GATEPASS_BASE } from './gatepassNavigation'
import { transferTypeLabel } from './transferTypes'
import { locLabel } from './txnLookups'
import { formatStockQty, wholeQtyStr } from './lineGrid'

type Direction = 'inward' | 'outward'

function empLabel(
  empId: number | string | null | undefined,
  employees: { id: string; code?: unknown; firstName?: unknown; lastName?: unknown }[],
) {
  if (empId == null || empId === '') return '—'
  const emp = employees.find((e) => e.id === String(empId))
  if (!emp) return String(empId)
  return `${emp.code} – ${String(emp.firstName ?? '')} ${String(emp.lastName ?? '')}`.trim()
}

function storeLabel(
  locId: number | string | null | undefined,
  stores: { id: string; code?: unknown; name?: unknown }[],
) {
  if (locId == null || locId === '') return '—'
  const loc = stores.find((l) => l.id === String(locId))
  return loc ? locLabel(loc) : String(locId)
}

function returnableLabel(flag: string | null | undefined) {
  const f = String(flag ?? '').trim().toUpperCase()
  if (f === 'Y' || f === 'RETURNABLE') return 'Returnable'
  if (f === 'N' || f === 'NON RETURNABLE' || f === 'NON_RETURNABLE') return 'Non Returnable'
  return flag ? String(flag) : '—'
}

export function GatepassDetail({ direction }: { direction: Direction }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const resource = direction === 'inward' ? 'gatepass/inward' : 'gatepass/outward'
  const title = direction === 'inward' ? 'Inward Gatepass' : 'Outward Gatepass'

  const mapEmp = useCallback(mapEmployee, [])
  const mapLoc = useCallback(mapLocation, [])
  const mapUnt = useCallback(mapUnit, [])
  const { rows: employees } = useMasterList('employees', mapEmp)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: units } = useMasterList('units', mapUnt)

  const [doc, setDoc] = useState<TxnDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const loaded = await fetchTxn(resource, id)
        if (!cancelled) setDoc(loaded)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load document')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, resource])

  const unitCode = useMemo(() => {
    const map: Record<string, string> = {}
    for (const u of units) map[u.id] = String(u.code ?? u.id)
    return map
  }, [units])

  const lines = doc?.lines ?? []

  return (
    <FadeContent>
      <PageHeader
        title={title}
        description="Read-only document details."
        actions={
          <Button variant="ghost" onClick={() => navigate(GATEPASS_BASE)}>
            Back to List
          </Button>
        }
      />

      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading document…</div>}
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}

      {doc && (
        <>
          <Card>
            <CardHeader
              title={doc.docNo || 'Document'}
              subtitle={doc.docDate || undefined}
              actions={<StatusPill status={doc.status || '—'} />}
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Doc No.">
                  <Input value={doc.docNo || '—'} readOnly disabled />
                </Field>
                <Field label="Date">
                  <Input value={doc.docDate || '—'} readOnly disabled />
                </Field>
                <Field label="Type">
                  <Input value={direction === 'inward' ? 'Inward' : 'Outward'} readOnly disabled />
                </Field>
                <Field label="Status">
                  <div className="flex h-[34px] items-center">
                    <StatusPill status={doc.status || '—'} />
                  </div>
                </Field>

                {direction === 'outward' && (
                  <>
                    <Field label="Transfer Type">
                      <Input
                        value={transferTypeLabel(String(doc.docSubtype ?? ''))}
                        readOnly
                        disabled
                      />
                    </Field>
                    <Field label="Returnable">
                      <Input value={returnableLabel(doc.returnFlag)} readOnly disabled />
                    </Field>
                  </>
                )}

                <Field label="Store / From">
                  <Input
                    value={storeLabel(doc.fromLocationId ?? doc.locationId, stores)}
                    readOnly
                    disabled
                  />
                </Field>
                {direction === 'outward' && doc.toLocationId != null && (
                  <Field label="To Location">
                    <Input value={storeLabel(doc.toLocationId, stores)} readOnly disabled />
                  </Field>
                )}
                <Field label="Prepared / Initiated By">
                  <Input
                    value={empLabel(doc.initiatedByEmpId ?? doc.preparedByEmpId, employees)}
                    readOnly
                    disabled
                  />
                </Field>
                {doc.refTxnHeaderId != null && (
                  <Field label="Linked Document Id">
                    <Input value={String(doc.refTxnHeaderId)} readOnly disabled />
                  </Field>
                )}
                <Field label="Remarks" className="md:col-span-2 xl:col-span-4">
                  <Input value={doc.remarks || '—'} readOnly disabled />
                </Field>
                <Field label="Attachment" className="md:col-span-2">
                  <div className="flex h-[34px] items-center text-sm">
                    <AttachmentLink
                      url={String(doc.attachmentUrl ?? '')}
                      name={String(doc.attachmentName ?? '')}
                    />
                  </div>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Item Lines" subtitle={`${lines.length} line(s)`} />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--surface2)]">
                      {['#', 'Item', 'Qty', 'Unit', 'Serial / Batch', 'Location', 'Remark'].map(
                        (h) => (
                          <th
                            key={h}
                            className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold uppercase text-[var(--text3)]"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-3 text-[var(--text3)]">
                          No lines on this document
                        </td>
                      </tr>
                    ) : (
                      lines.map((l, idx) => {
                        const itemLabel =
                          [l.itemCode, l.itemName].filter(Boolean).join(' – ') ||
                          (l.itemId != null ? String(l.itemId) : '—')
                        const qty = wholeQtyStr(l.qty ?? l.acceptedQty ?? l.receivedQty)
                        const uom =
                          l.uomCode ||
                          (l.uomId != null ? unitCode[String(l.uomId)] : '') ||
                          '—'
                        const serial = String(l.serialNo ?? l.batchLotNo ?? '').trim() || '—'
                        return (
                          <tr key={l.detailId ?? `${l.srNo}-${idx}`}>
                            <td className="border-b border-[var(--border)] px-3 py-2 tabular-nums">
                              {l.srNo ?? idx + 1}
                            </td>
                            <td className="border-b border-[var(--border)] px-3 py-2">{itemLabel}</td>
                            <td className="border-b border-[var(--border)] px-3 py-2 tabular-nums">
                              {qty ? formatStockQty(Number(qty)) : '—'}
                            </td>
                            <td className="border-b border-[var(--border)] px-3 py-2">{uom}</td>
                            <td className="border-b border-[var(--border)] px-3 py-2 font-mono">
                              {serial}
                            </td>
                            <td className="border-b border-[var(--border)] px-3 py-2">
                              {storeLabel(l.locationId, stores)}
                            </td>
                            <td className="border-b border-[var(--border)] px-3 py-2">
                              {l.remark || '—'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <div className="mt-3 flex justify-end">
            <Button variant="ghost" onClick={() => navigate(GATEPASS_BASE)}>
              Back to List
            </Button>
          </div>
        </>
      )}
    </FadeContent>
  )
}
