import { useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Pill, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useTxnList, type TxnRow } from '@/api/transactions'
import { useAuth } from '@/features/auth/AuthContext'
import { filterRowsByStatus, txnStatusFilterOptions } from '@/lib/listOrder'
import { AttachmentLink } from './AttachmentSection'
import {
  GATEPASS_BASE,
  GATEPASS_INWARD_PATH,
  GATEPASS_OUTWARD_PATH,
} from './gatepassNavigation'
import { GatepassInwardForm } from './GatepassInwardForm'
import { GatepassOutwardForm } from './GatepassOutwardForm'
import { GatepassDetail } from './GatepassDetail'
import { transferTypeLabel } from './transferTypes'

type GatepassDirection = 'Inward' | 'Outward'

type GatepassListRow = TxnRow & {
  direction: GatepassDirection
  listKey: string
  docId: string
}

export function GatepassPages() {
  return (
    <Routes>
      <Route index element={<GatepassList />} />
      <Route path="inward/:id" element={<GatepassDetail direction="inward" />} />
      <Route path="outward/:id" element={<GatepassDetail direction="outward" />} />
      <Route path="inward" element={<GatepassInwardForm />} />
      <Route path="outward" element={<GatepassOutwardForm />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}

/** @deprecated Prefer GatepassPages - kept so older imports keep working. */
export const GatepassPage = GatepassPages

/* -------------------------------------------------------------- list ---- */

function GatepassList() {
  const navigate = useNavigate()
  const { canCreateMenu, canEditMenu } = useAuth()
  const canOpenForm = canCreateMenu('GP') || canEditMenu('GP')
  const inward = useTxnList('gatepass/inward')
  const outward = useTxnList('gatepass/outward')
  const [statusFilter, setStatusFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')

  const combinedRows = useMemo<GatepassListRow[]>(() => {
    const inwardRows: GatepassListRow[] = inward.rows.map((r) => ({
      ...r,
      direction: 'Inward',
      docId: r.id,
      listKey: `in-${r.id}`,
      id: `in-${r.id}`,
    }))
    const outwardRows: GatepassListRow[] = outward.rows.map((r) => ({
      ...r,
      direction: 'Outward',
      docId: r.id,
      listKey: `out-${r.id}`,
      id: `out-${r.id}`,
    }))
    return [...inwardRows, ...outwardRows].sort((a, b) => {
      const d = String(b.docDate ?? '').localeCompare(String(a.docDate ?? ''))
      if (d !== 0) return d
      return String(b.docNo ?? '').localeCompare(String(a.docNo ?? ''))
    })
  }, [inward.rows, outward.rows])

  const statusOptions = useMemo(() => txnStatusFilterOptions(combinedRows), [combinedRows])
  const filteredByStatus = useMemo(
    () => filterRowsByStatus(combinedRows, statusFilter),
    [combinedRows, statusFilter],
  )
  const filteredRows = useMemo(() => {
    if (!directionFilter) return filteredByStatus
    return filteredByStatus.filter((r) => r.direction === directionFilter)
  }, [filteredByStatus, directionFilter])

  const columns: Column<GatepassListRow>[] = [
    {
      key: 'direction',
      header: 'Type',
      searchText: (r) => r.direction,
      render: (r) => (
        <Pill tone={r.direction === 'Outward' ? 'red' : 'blue'}>{r.direction}</Pill>
      ),
    },
    {
      key: 'no',
      header: 'Doc No.',
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
      key: 'transfer',
      header: 'Transfer Type',
      searchText: (r) => (r.direction === 'Outward' ? transferTypeLabel(String(r.docSubtype ?? '')) : ''),
      render: (r) =>
        r.direction === 'Outward' ? transferTypeLabel(String(r.docSubtype ?? '')) : '-',
    },
    {
      key: 'returnable',
      header: 'Returnable',
      searchText: (r) => String(r.returnFlag ?? ''),
      render: (r) =>
        r.direction === 'Outward' && r.returnFlag ? <Pill>{String(r.returnFlag)}</Pill> : '-',
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
      render: (r) => <StatusPill status={r.status || '-'} />,
    },
    {
      key: 'attachment',
      header: 'Attachment',
      searchText: (r) => String(r.attachmentName ?? r.attachmentUrl ?? ''),
      render: (r) => (
        <AttachmentLink url={String(r.attachmentUrl ?? '')} name={String(r.attachmentName ?? '')} />
      ),
    },
  ]

  const loading = inward.loading || outward.loading
  const error = inward.error || outward.error

  return (
    <FadeContent>
      <PageHeader
        title="Gatepass"
        description="Inward and outward gate movements. Submit completes stock posting immediately (no approval step)."
      />
      <div className="mb-4 flex flex-wrap gap-2.5">
        {canOpenForm && (
          <>
            <Button onClick={() => navigate(GATEPASS_INWARD_PATH)}>Inward Form</Button>
            <Button variant="danger" onClick={() => navigate(GATEPASS_OUTWARD_PATH)}>
              Outward Form
            </Button>
          </>
        )}
      </div>
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && (
        <div className="mb-2 text-sm text-[var(--text3)]">Loading gatepass documents...</div>
      )}
      <DataTable
        columns={columns}
        rows={filteredRows}
        searchPlaceholder="Search gatepass documents..."
        filters={[
          {
            label: 'Type',
            value: directionFilter,
            options: [
              { value: '', label: 'All Types' },
              { value: 'Inward', label: 'Inward' },
              { value: 'Outward', label: 'Outward' },
            ],
            onChange: setDirectionFilter,
          },
          {
            label: 'Status',
            value: statusFilter,
            options: statusOptions,
            onChange: setStatusFilter,
          },
        ]}
        emptyMessage="No gatepass documents yet. Use Inward Form or Outward Form to create one."
        onRowClick={(r) =>
          navigate(
            r.direction === 'Inward'
              ? `${GATEPASS_BASE}/inward/${r.docId}`
              : `${GATEPASS_BASE}/outward/${r.docId}`,
          )
        }
      />
    </FadeContent>
  )
}
