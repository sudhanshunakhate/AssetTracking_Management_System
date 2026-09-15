import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { fetchTxn, type TxnDocument, type TxnRow } from '@/api/transactions'
import type { ApiMasterRow } from '@/api/masters'
import { formatStockQty, wholeQtyStr } from './lineGrid'
import { locLabel } from './txnLookups'
import { transferTypeLabel } from './transferTypes'

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
        {label}
      </div>
      <div className="mt-0.5 break-words text-[12.5px] leading-snug text-[var(--text)]">
        {children}
      </div>
    </div>
  )
}

function returnableLabel(flag: string | null | undefined) {
  const f = String(flag ?? '').trim().toUpperCase()
  if (f === 'Y' || f === 'RETURNABLE') return 'Returnable'
  if (f === 'N' || f === 'NON RETURNABLE' || f === 'NON_RETURNABLE') return 'Non Returnable'
  return flag ? String(flag) : '-'
}

/**
 * Popup to pick a returnable outward gatepass — list + header details + item lines.
 */
export function ReturnableOutwardPickerModal({
  open,
  onClose,
  onSelect,
  rows,
  locations,
  units,
  loading = false,
}: {
  open: boolean
  onClose: () => void
  onSelect: (docId: string) => void
  rows: TxnRow[]
  locations: ApiMasterRow[]
  units: ApiMasterRow[]
  loading?: boolean
}) {
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<TxnDocument | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedId('')
    setDetail(null)
    setDetailError('')
  }, [open])

  useEffect(() => {
    if (!open || !selectedId) {
      setDetail(null)
      setDetailError('')
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError('')
    ;(async () => {
      try {
        const doc = await fetchTxn('gatepass/outward', selectedId)
        if (!cancelled) setDetail(doc)
      } catch (err) {
        if (!cancelled) {
          setDetail(null)
          setDetailError(err instanceof Error ? err.message : 'Failed to load outward details')
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, selectedId])

  const locById = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations])
  const unitCode = useMemo(() => {
    const map: Record<string, string> = {}
    for (const u of units) map[u.id] = String(u.code ?? u.id)
    return map
  }, [units])

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Outward No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    {
      key: 'date',
      header: 'Date',
      searchText: (r) => r.docDate,
      render: (r) => r.docDate || '-',
    },
    {
      key: 'type',
      header: 'Transfer Type',
      searchText: (r) => transferTypeLabel(String(r.docSubtype ?? '')),
      render: (r) => transferTypeLabel(String(r.docSubtype ?? '')),
    },
    {
      key: 'store',
      header: 'Store',
      searchText: (r) => {
        const loc = locById.get(String(r.locationId ?? r.fromLocationId ?? ''))
        return loc ? locLabel(loc) : ''
      },
      render: (r) => {
        const loc = locById.get(String(r.locationId ?? r.fromLocationId ?? ''))
        return loc ? locLabel(loc) : '-'
      },
    },
    {
      key: 'items',
      header: 'Items',
      searchText: (r) => String(r.totalItems ?? 0),
      render: (r) => <span className="tabular-nums">{Number(r.totalItems ?? 0)}</span>,
    },
    {
      key: 'return',
      header: 'Returnable',
      searchText: (r) => String(r.returnFlag ?? ''),
      render: (r) => returnableLabel(String(r.returnFlag ?? '')),
    },
    {
      key: 'status',
      header: 'Status',
      searchText: (r) => r.status,
      render: (r) => <StatusPill status={r.status || '-'} />,
    },
  ]

  const selectedRow = rows.find((r) => r.id === selectedId)
  const storeId =
    detail?.locationId ?? detail?.fromLocationId ?? selectedRow?.locationId ?? selectedRow?.fromLocationId
  const storeText = (() => {
    if (storeId == null || storeId === '') return '-'
    const loc = locById.get(String(storeId))
    return loc ? locLabel(loc) : String(storeId)
  })()

  const detailLines = detail?.lines ?? []
  const docNo = detail?.docNo ?? selectedRow?.docNo ?? '-'
  const docDate = detail?.docDate ?? selectedRow?.docDate ?? '-'
  const status = detail?.status ?? selectedRow?.status ?? '-'
  const remarks = (detail?.remarks ?? '').trim()

  return (
    <Modal
      open={open}
      title="Select Returnable Outward"
      subtitle="Choose a returnable outward gatepass. Review header and item lines, then continue."
      onClose={onClose}
      width="max-w-5xl"
      offsetSidebar
      bodyClassName="space-y-3"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedId || detailLoading || Boolean(detailError)}
            onClick={() => selectedId && onSelect(selectedId)}
          >
            Use This Outward
          </Button>
        </>
      }
    >
      {loading && (
        <div className="py-6 text-center text-[12.5px] text-[var(--text3)]">
          Loading returnable outwards...
        </div>
      )}
      {!loading && rows.length === 0 && (
        <div className="py-8 text-center text-[13px] text-[var(--text3)]">
          No returnable outward documents available for inward.
        </div>
      )}
      {!loading && rows.length > 0 && (
        <DataTable
          columns={columns}
          rows={rows}
          searchPlaceholder="Search outward no., store, status..."
          selectedRowId={selectedId}
          onRowClick={(r) => setSelectedId(r.id)}
          emptyMessage="No matching outwards."
        />
      )}

      {selectedId && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
          <div className="border-b border-[var(--border)] px-3 py-2">
            <div className="text-[12px] font-semibold text-[var(--text)]">
              Outward details — {docNo}
            </div>
            <div className="text-[11px] text-[var(--text3)]">
              Review header and item lines before continuing.
            </div>
          </div>

          {detailLoading && (
            <div className="px-3 py-4 text-[12px] text-[var(--text3)]">Loading details...</div>
          )}
          {detailError && (
            <div className="px-3 py-3 text-[12px] text-[var(--danger)]">{detailError}</div>
          )}

          {!detailLoading && !detailError && (
            <div className="space-y-3 px-3 py-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                <DetailField label="Outward No.">
                  <span className="font-mono font-semibold">{docNo}</span>
                </DetailField>
                <DetailField label="Date">{docDate}</DetailField>
                <DetailField label="Status">
                  <StatusPill status={String(status)} />
                </DetailField>
                <DetailField label="Returnable">
                  {returnableLabel(String(detail?.returnFlag ?? selectedRow?.returnFlag ?? ''))}
                </DetailField>
                <DetailField label="Transfer Type">
                  {transferTypeLabel(
                    String(detail?.docSubtype ?? selectedRow?.docSubtype ?? ''),
                  )}
                </DetailField>
                <DetailField label="System Store">{storeText}</DetailField>
                <DetailField label="Item Lines">
                  {detailLines.length || Number(selectedRow?.totalItems ?? 0)}
                </DetailField>
              </div>

              {remarks ? (
                <DetailField label="Remarks">
                  <span className="text-[var(--text2)]">{remarks}</span>
                </DetailField>
              ) : null}

              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                  Outward items ({detailLines.length})
                </div>
                <div className="max-h-[220px] overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface)]">
                  <table className="w-full min-w-[560px] border-collapse text-[12px]">
                    <thead className="sticky top-0 bg-[var(--surface2)]">
                      <tr className="border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wide text-[var(--text3)]">
                        <th className="w-10 px-3 py-2">#</th>
                        <th className="px-3 py-2">Item Code</th>
                        <th className="px-3 py-2">Item Name</th>
                        <th className="w-24 px-3 py-2 text-right">Qty</th>
                        <th className="w-16 px-3 py-2">Unit</th>
                        <th className="px-3 py-2">Serial / Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailLines.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-4 text-center text-[var(--text3)]"
                          >
                            No item lines on this outward.
                          </td>
                        </tr>
                      ) : (
                        detailLines.map((l, i) => {
                          const qty = wholeQtyStr(l.qty ?? l.acceptedQty ?? l.receivedQty)
                          const uom =
                            l.uomCode ||
                            (l.uomId != null ? unitCode[String(l.uomId)] : '') ||
                            '-'
                          const serial =
                            String(l.serialNo ?? l.batchLotNo ?? '').trim() || '-'
                          return (
                            <tr
                              key={l.detailId ?? i}
                              className="border-b border-[var(--border)]/70 last:border-0"
                            >
                              <td className="px-3 py-1.5 tabular-nums text-[var(--text3)]">
                                {l.srNo ?? i + 1}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-[11.5px]">
                                {l.itemCode ?? '-'}
                              </td>
                              <td className="px-3 py-1.5">{l.itemName ?? '-'}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                                {qty ? formatStockQty(Number(qty)) : '-'}
                              </td>
                              <td className="px-3 py-1.5">{uom}</td>
                              <td className="px-3 py-1.5 font-mono text-[11.5px]">{serial}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
