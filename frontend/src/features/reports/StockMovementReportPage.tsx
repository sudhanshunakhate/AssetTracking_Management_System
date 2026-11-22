import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockMovement } from '@/api/transactions'
import { mapLocation, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import {
  MasterEmployeeSearchLookup,
  MasterItemSearchLookup,
} from '@/features/transactions/MasterSearchLookup'
import { txnDetailPath } from '@/features/transactions/txnDetailPath'
import { downloadCsv } from '@/lib/csvExport'
import { ReportTableScroll, reportThClass } from './ReportTableScroll'

type MovementRow = {
  id: string
  docId: string
  docType: string
  date: string
  serialNo: string
  assetName: string
  fromLocation: string
  toLocation: string
  fromDept: string
  toDept: string
  custodian: string
  movementType: string
  reason: string
  document: string
}

const emptyFilters = {
  search: '',
  serialNo: '',
  itemId: '',
  employeeId: '',
  loc: '',
  from: '',
  to: '',
}

const dash = (v: string) => (v.trim() ? v : '—')

function mapMovementRow(r: Record<string, unknown>): MovementRow {
  const serialNo = String(r.assetId ?? r.serialNo ?? r.itemCode ?? '').trim()
  const assetName = String(r.assetName ?? r.itemName ?? '').trim()
  const fromLocation = String(r.fromLocation ?? r.fromStore ?? '').trim()
  const toLocation = String(r.toLocation ?? r.toStore ?? '').trim()
  const custodian = String(r.custodian ?? r.employee ?? '').trim()
  const movementType = String(r.movementType ?? r.docType ?? '').trim()
  const document = String(r.document ?? r.docNo ?? '').trim()
  return {
    id: String(r.id ?? `${document}-${serialNo}`),
    docId: String(r.docId ?? ''),
    docType: String(r.docType ?? '').trim(),
    date: String(r.date ?? ''),
    serialNo: serialNo || '—',
    assetName: assetName || '—',
    fromLocation: dash(fromLocation),
    toLocation: dash(toLocation),
    fromDept: dash(String(r.fromDept ?? '')),
    toDept: dash(String(r.toDept ?? '')),
    custodian: dash(custodian),
    movementType: movementType || '—',
    reason: dash(String(r.reason ?? '')),
    document: document || '—',
  }
}

const headers = [
  'Date',
  'Serial No.',
  'Asset Name',
  'From Location',
  'To Location',
  'From Dept.',
  'To Dept.',
  'Custodian',
  'Movement Type',
  'Reason',
  'Document',
]

function MovementCells({
  r,
  onSerialClick,
  serialExpanded,
}: {
  r: MovementRow
  onSerialClick?: (serialNo: string) => void
  serialExpanded?: boolean
}) {
  const navigate = useNavigate()
  const detailPath = txnDetailPath(r.docType, r.docId)

  return (
    <>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5 whitespace-nowrap">{r.date}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
        {onSerialClick && r.serialNo !== '—' ? (
          <button
            type="button"
            className={`font-medium text-[var(--accent-deep)] hover:underline ${
              serialExpanded ? 'underline' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onSerialClick(r.serialNo)
            }}
          >
            {r.serialNo}
          </button>
        ) : (
          r.serialNo
        )}
      </td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.assetName}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.fromLocation}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.toLocation}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.fromDept}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.toDept}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.custodian}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.movementType}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.reason}</td>
      <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
        {detailPath ? (
          <button
            type="button"
            className="font-mono text-[var(--accent-deep)] hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              navigate(detailPath)
            }}
          >
            {r.document}
          </button>
        ) : (
          r.document
        )}
      </td>
    </>
  )
}

export function StockMovementReportPage() {
  const { seesAllLocations } = useAuth()
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setDraft((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<MovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSerial, setExpandedSerial] = useState<string | null>(null)
  const [serialRows, setSerialRows] = useState<MovementRow[]>([])
  const [serialLoading, setSerialLoading] = useState(false)

  const mapLoc = useCallback(mapLocation, [])

  useEffect(() => {
    void import('@/api/pageData/reportFiltersBundle').then((m) => m.ensureReportFiltersBundle())
  }, [])

  const { rows: stores } = useMasterList('locations', mapLoc)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchStockMovement({
        page: 1,
        pageSize: 200,
        search: applied.search || undefined,
        serialNo: applied.serialNo || undefined,
        itemId: applied.itemId || undefined,
        employeeId: applied.employeeId || undefined,
        locationId: applied.loc || undefined,
        fromDate: applied.from || undefined,
        toDate: applied.to || undefined,
      })
      setRows((page.data ?? []).map((r) => mapMovementRow(r as Record<string, unknown>)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load asset movement register')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!expandedSerial) {
      setSerialRows([])
      return
    }
    let cancelled = false
    ;(async () => {
      setSerialLoading(true)
      try {
        const page = await fetchStockMovement({
          page: 1,
          pageSize: 200,
          serialNo: expandedSerial,
          fromDate: applied.from || undefined,
          toDate: applied.to || undefined,
          locationId: applied.loc || undefined,
        })
        if (!cancelled) {
          setSerialRows((page.data ?? []).map((r) => mapMovementRow(r as Record<string, unknown>)))
        }
      } catch {
        if (!cancelled) setSerialRows([])
      } finally {
        if (!cancelled) setSerialLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [expandedSerial, applied.from, applied.to, applied.loc])

  const applyFilters = () => {
    setExpandedSerial(null)
    setApplied({ ...draft })
  }

  const clearFilters = () => {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
    setExpandedSerial(null)
  }

  const toggleSerial = (serialNo: string) => {
    setExpandedSerial((prev) => (prev === serialNo ? null : serialNo))
  }

  /** When a serial is expanded, show only that serial’s rows in the main grid. */
  const visibleRows = useMemo(() => {
    if (!expandedSerial) return rows
    return rows.filter((r) => r.serialNo === expandedSerial)
  }, [rows, expandedSerial])

  /** Expand under the first visible row for that serial. */
  const expandUnderId = useMemo(() => {
    if (!expandedSerial) return null
    return visibleRows.find((r) => r.serialNo === expandedSerial)?.id ?? null
  }, [visibleRows, expandedSerial])

  const historyRows = useMemo(() => {
    if (!expandedSerial) return []
    const list = serialRows.length > 0 ? serialRows : visibleRows
    return list
  }, [expandedSerial, serialRows, visibleRows])

  return (
    <FadeContent>
      <PageHeader
        title="Asset Movement Register"
        description="Track asset movements across locations and custodians. Click a Serial No. to filter and expand that asset’s related transactions."
        actions={
          <Button
            variant="ghost"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv(
                `asset-movement-register-${new Date().toISOString().slice(0, 10)}.csv`,
                headers,
                (expandedSerial ? historyRows : rows).map((r) => [
                  r.date,
                  r.serialNo,
                  r.assetName,
                  r.fromLocation,
                  r.toLocation,
                  r.fromDept,
                  r.toDept,
                  r.custodian,
                  r.movementType,
                  r.reason,
                  r.document,
                ]),
              )
            }
          >
            Export
          </Button>
        }
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading asset movements…</div>}

      <Card className="mb-3 overflow-visible">
        <CardHeader title="Filters" subtitle="Narrow by date range, serial no., asset, owner, or location" />
        <CardBody className="overflow-visible">
          <div className="grid grid-cols-1 items-end gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Field label="From Date" className="min-w-0">
              <Input type="date" value={draft.from} onChange={(e) => set('from', e.target.value)} />
            </Field>
            <Field label="To Date" className="min-w-0">
              <Input type="date" value={draft.to} onChange={(e) => set('to', e.target.value)} />
            </Field>
            <Field label="Serial No." className="min-w-0">
              <Input
                value={draft.serialNo}
                onChange={(e) => set('serialNo', e.target.value)}
                placeholder="Track serial…"
              />
            </Field>
            <Field label="Item" className="relative z-30 min-w-0">
              <MasterItemSearchLookup
                value={draft.itemId}
                onChange={(v) => set('itemId', v)}
                placeholder="All Assets"
                allowClear
                className="w-full"
                pageSize={50}
                maxVisible={50}
              />
            </Field>
            <Field label="Owner" className="relative z-20 min-w-0">
              <MasterEmployeeSearchLookup
                value={draft.employeeId}
                onChange={(v) => set('employeeId', v)}
                placeholder="All Owners"
                allowClear
                className="w-full"
              />
            </Field>
            <Field label="Location" className="relative z-10 min-w-0">
              <Select value={draft.loc} onChange={(e) => set('loc', e.target.value)} className="w-full">
                <option value="">{seesAllLocations ? 'All Locations' : 'My Locations'}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} – {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Search" className="min-w-0 sm:col-span-2 lg:col-span-1 xl:col-span-1">
              <Input
                value={draft.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Asset / document…"
              />
            </Field>
            <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
              <Button onClick={applyFilters}>Apply</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-visible">
        <CardBody className="p-0">
          {expandedSerial && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[#f0f5ff] px-3.5 py-2 text-[12.5px] text-[var(--text2)]">
              <div>
                Filtered to serial <strong className="font-mono text-[var(--text)]">{expandedSerial}</strong>
                {serialLoading ? ' — loading history…' : ` — ${historyRows.length} movement(s)`}
              </div>
              <Button variant="ghost" className="text-xs" onClick={() => setExpandedSerial(null)}>
                Clear serial filter
              </Button>
            </div>
          )}

          <ReportTableScroll>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} className={reportThClass}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const showExpand = expandUnderId === r.id
                  return (
                    <Fragment key={r.id}>
                      <tr className={showExpand ? 'bg-[#f0f5ff]' : 'hover:bg-[#f0f5ff]'}>
                        <MovementCells
                          r={r}
                          onSerialClick={toggleSerial}
                          serialExpanded={expandedSerial === r.serialNo}
                        />
                      </tr>
                      {showExpand && (
                        <tr className="bg-[#f7f9fc]">
                          <td colSpan={11} className="border-b border-[var(--border)] px-3 py-2.5">
                            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--text3)]">
                              Related movements for {expandedSerial}
                            </div>
                            {serialLoading && historyRows.length === 0 ? (
                              <div className="py-3 text-sm text-[var(--text3)]">Loading…</div>
                            ) : historyRows.length === 0 ? (
                              <div className="py-3 text-sm text-[var(--text3)]">
                                No related transactions for this serial.
                              </div>
                            ) : (
                              <table className="w-full border-collapse text-[11px]">
                                <thead>
                                  <tr>
                                    {headers.map((h) => (
                                      <th
                                        key={h}
                                        className="border-b border-[var(--border)] px-2 py-1 text-left text-[9px] font-bold uppercase tracking-[0.4px] text-[var(--text3)]"
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {historyRows.map((h) => (
                                    <tr key={`hist-${h.id}`} className="hover:bg-[#eef2f7]">
                                      <MovementCells r={h} />
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {!loading && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-[11px] py-8 text-center text-[var(--text3)]">
                      No asset movements for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ReportTableScroll>

          <div className="flex flex-wrap gap-7 border-t border-[var(--border)] px-3.5 py-3 text-[12.5px] text-[var(--text2)]">
            <div>
              Movements: <strong>{visibleRows.length}</strong>
              {expandedSerial && rows.length !== visibleRows.length ? (
                <span className="text-[var(--text3)]"> of {rows.length}</span>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
