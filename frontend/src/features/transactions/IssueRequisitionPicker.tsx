import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react'
import { api, type PageResponse } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/ui/DataTable'
import {
  fetchTxn,
  mapTxnListItem,
  type TxnDocument,
  type TxnListItem,
  type TxnRow,
} from '@/api/transactions'
import { mapDepartment, useMasterList } from '@/api/masters'
import { empLabel, locLabel, useTxnFormLookups } from './txnLookups'

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">{label}</div>
      <div className="mt-0.5 text-[12.5px] leading-snug text-[var(--text)] break-words">{children}</div>
    </div>
  )
}

export function RequisitionPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (requisitionId: string) => void
}) {
  const [rows, setRows] = useState<TxnRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<TxnDocument | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const { locations, employees } = useTxnFormLookups()
  const mapDeptStable = useCallback(mapDepartment, [])
  const { rows: deptRows } = useMasterList('departments', mapDeptStable)

  const locById = useMemo(() => new Map(locations.rows.map((l) => [l.id, l])), [locations.rows])
  const empById = useMemo(() => new Map(employees.rows.map((e) => [e.id, e])), [employees.rows])
  const deptById = useMemo(() => new Map(deptRows.map((d) => [d.id, d.name])), [deptRows])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const page = await api<PageResponse<TxnListItem>>('/material-issues/pending-requisitions')
        if (!cancelled) {
          setRows((page.data ?? []).map(mapTxnListItem))
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load requisitions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    ;(async () => {
      try {
        const doc = await fetchTxn('requisitions', selectedId)
        if (!cancelled) setDetail(doc)
      } catch {
        if (!cancelled) setDetail(null)
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const columns: Column<TxnRow>[] = [
    {
      key: 'no',
      header: 'Requisition No.',
      searchText: (r) => r.docNo,
      render: (r) => <b className="font-mono">{r.docNo}</b>,
    },
    { key: 'date', header: 'Date', searchText: (r) => r.docDate, render: (r) => r.docDate || '—' },
    {
      key: 'required',
      header: 'Required Date',
      searchText: (r) => String(r.requiredByDate ?? ''),
      render: (r) => String(r.requiredByDate ?? '') || '—',
    },
    {
      key: 'status',
      header: 'Status',
      searchText: (r) => r.status,
      render: (r) => <StatusPill status={r.status || '—'} />,
    },
    {
      key: 'items',
      header: 'Items',
      searchText: (r) => String(r.totalItems ?? 0),
      render: (r) => <span className="tabular-nums">{Number(r.totalItems ?? 0)}</span>,
    },
  ]

  const selectedRow = rows.find((r) => r.id === selectedId)
  const locationLabel = (() => {
    const locId = detail?.locationId ?? selectedRow?.locationId
    if (!locId) return '—'
    const l = locById.get(String(locId))
    return l ? locLabel(l) : '—'
  })()
  const requestedBy = (() => {
    const empId = detail?.initiatedByEmpId ?? selectedRow?.initiatedByEmpId
    if (!empId) return '—'
    const e = empById.get(String(empId))
    return e ? empLabel(e) : '—'
  })()
  const department =
    detail?.departmentId != null
      ? deptById.get(String(detail.departmentId)) ?? '—'
      : selectedRow?.departmentId
        ? deptById.get(String(selectedRow.departmentId)) ?? '—'
        : '—'

  const reqSubtype = String(detail?.docSubtype ?? selectedRow?.docSubtype ?? '').toUpperCase()
  const isEmployeeReq = reqSubtype === 'EMPLOYEE'
  const reqTypeLabel = isEmployeeReq ? 'Employee' : reqSubtype === 'DEPARTMENT' ? 'Department' : '—'
  const docNo = detail?.docNo ?? selectedRow?.docNo ?? '—'
  const docDate = detail?.docDate ?? selectedRow?.docDate ?? '—'
  const requiredBy = detail?.requiredByDate ?? selectedRow?.requiredByDate ?? '—'
  const status = detail?.status ?? selectedRow?.status ?? '—'
  const remarks = detail?.remarks?.trim() ?? ''

  return (
    <Modal
      open={open}
      title="Select Store Requisition"
      subtitle="Choose a requested requisition to issue material against. Requisition selection is mandatory."
      onClose={onClose}
      width="max-w-5xl"
      offsetSidebar
      bodyClassName="space-y-3"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!selectedId}
            onClick={() => selectedId && onSelect(selectedId)}
          >
            Continue to Issue
          </Button>
        </>
      }
    >
      {error && <div className="text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="text-sm text-[var(--text3)]">Loading requisitions…</div>}
      {!loading && rows.length === 0 && (
        <div className="py-8 text-center text-[13px] text-[var(--text3)]">
          No requested requisitions available for issue.
        </div>
      )}
      {!loading && rows.length > 0 && (
        <DataTable
          columns={columns}
          rows={rows}
          searchPlaceholder="Search requisitions…"
          selectedRowId={selectedId}
          onRowClick={(r) => setSelectedId(r.id)}
          emptyMessage="No matching requisitions."
        />
      )}

      {selectedId && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
          <div className="border-b border-[var(--border)] px-3 py-2">
            <div className="text-[12px] font-semibold text-[var(--text)]">Selected requisition</div>
            <div className="text-[11px] text-[var(--text3)]">Review header details and requested items before continuing.</div>
          </div>

          {detailLoading && (
            <div className="px-3 py-4 text-[12px] text-[var(--text3)]">Loading details…</div>
          )}

          {!detailLoading && (
            <div className="px-3 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                <DetailField label="Requisition No.">
                  <span className="font-mono font-semibold">{docNo}</span>
                </DetailField>
                <DetailField label="Status">
                  <StatusPill status={status} />
                </DetailField>
                <DetailField label="Requisition Date">{docDate}</DetailField>
                <DetailField label="Required By">{String(requiredBy ?? '') || '—'}</DetailField>
                <DetailField label="Requisition Type">{reqTypeLabel}</DetailField>
                {!isEmployeeReq && (
                  <DetailField label="Request from Department">{department}</DetailField>
                )}
                <DetailField label="Request from Location">{locationLabel}</DetailField>
                {isEmployeeReq && (
                  <DetailField label="Requested By">{requestedBy}</DetailField>
                )}
              </div>

              {remarks && (
                <DetailField label="Remarks">
                  <span className="text-[var(--text2)]">{remarks}</span>
                </DetailField>
              )}

              {detail?.lines && detail.lines.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                    Items requested ({detail.lines.length})
                  </div>
                  <div className="max-h-[180px] overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface)]">
                    <table className="w-full min-w-[480px] border-collapse text-[12px]">
                      <thead className="sticky top-0 bg-[var(--surface2)]">
                        <tr className="border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wide text-[var(--text3)]">
                          <th className="px-3 py-2 w-12">#</th>
                          <th className="px-3 py-2">Item Code</th>
                          <th className="px-3 py-2">Item Name</th>
                          <th className="px-3 py-2 text-right w-28">Requested Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.lines.map((l, i) => (
                          <tr key={l.detailId ?? i} className="border-b border-[var(--border)]/70 last:border-0">
                            <td className="px-3 py-1.5 tabular-nums text-[var(--text3)]">{i + 1}</td>
                            <td className="px-3 py-1.5 font-mono text-[11.5px]">{l.itemCode ?? '—'}</td>
                            <td className="px-3 py-1.5">{l.itemName ?? '—'}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                              {l.requestedQty ?? l.qty ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
