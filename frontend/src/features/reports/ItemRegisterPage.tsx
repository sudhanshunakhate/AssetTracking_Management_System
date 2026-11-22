import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchItemLedger } from '@/api/transactions'
import { mapLocation, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { formatStockQty } from '@/features/transactions/lineGrid'
import { MasterItemSearchLookup } from '@/features/transactions/MasterSearchLookup'
import { txnDetailPath } from '@/features/transactions/txnDetailPath'
import { downloadCsv } from '@/lib/csvExport'
import { ReportTableScroll, reportThAlign } from './ReportTableScroll'

type LedgerRow = {
  id: string
  docId: string
  date: string
  itemCode: string
  itemName: string
  docType: string
  txnType: string
  docNo: string
  serialNo: string
  location: string
  ipAddress: string
  uom: string
  openingBalance: number
  receipt: string
  issue: string
  closingBalance: number
  periodReceipt: number
  periodIssue: number
  periodClosing: number
  issuedTo: string
}

const emptyFilters = {
  itemId: '',
  serialNo: '',
  loc: '',
  from: '',
  to: '',
}

const formatLedgerDate = (iso: string) => {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return iso
}

const qtyCell = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? formatStockQty(n) : '—'
}

const textCell = (v: unknown) => {
  const s = String(v ?? '').trim()
  return s || '—'
}

const qtyNum = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function ItemRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetItem = searchParams.get('itemId') ?? ''
  const { seesAllLocations } = useAuth()
  const [draft, setDraft] = useState({ ...emptyFilters, itemId: presetItem })
  const [applied, setApplied] = useState({ ...emptyFilters, itemId: presetItem })
  const set = (k: keyof typeof emptyFilters, v: string) => setDraft((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapLoc = useCallback(mapLocation, [])

  useEffect(() => {
    void import('@/api/pageData/reportFiltersBundle').then((m) => m.ensureReportFiltersBundle())
  }, [])

  const { rows: stores } = useMasterList('locations', mapLoc)

  const showItemCols = !applied.itemId

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchItemLedger({
        page: 1,
        pageSize: 200,
        itemId: applied.itemId || undefined,
        serialNo: applied.serialNo || undefined,
        locationId: applied.loc || undefined,
        fromDate: applied.from || undefined,
        toDate: applied.to || undefined,
      })
      setRows(
        (page.data ?? []).map((r, idx) => ({
          id: String(r.id ?? `${r.docNo}-${r.itemId}-${idx}`),
          docId: String(r.docId ?? ''),
          date: formatLedgerDate(String(r.date ?? '')),
          itemCode: String(r.itemCode ?? ''),
          itemName: String(r.itemName ?? ''),
          docType: String(r.docType ?? ''),
          txnType: String(r.txnType ?? r.docType ?? ''),
          docNo: String(r.docNo ?? ''),
          serialNo: textCell(r.serialNo ?? r.batch),
          location: textCell(r.location ?? r.locationName ?? r.locationCode),
          ipAddress: textCell(r.ipAddress),
          uom: textCell(r.uomCode ?? r.uomName),
          openingBalance: Number(r.openingBalance ?? 0),
          receipt: qtyCell((r.receiptDuringPeriod ?? r.receipt) as string | number | null),
          issue: qtyCell((r.issueDuringPeriod ?? r.issue) as string | number | null),
          closingBalance: Number(r.closingBalance ?? r.balance ?? 0),
          periodReceipt: Number(r.periodReceipt ?? 0),
          periodIssue: Number(r.periodIssue ?? 0),
          periodClosing: Number(r.periodClosing ?? 0),
          issuedTo: textCell(r.issuedTo),
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item ledger')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    void reload()
  }, [reload])

  const applyFilters = () => setApplied({ ...draft })

  const clearFilters = () => {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
  }

  const qtyCols = [
    'Opening Balance',
    'Receipt During the Period',
    'Issue During the Period',
    'Closing Balance for the Period',
  ]
  const qtyLabelSet = new Set(qtyCols)

  const headers = showItemCols
    ? [
        'Date',
        'Item Code',
        'Item Name',
        'Doc. Type',
        'Doc. No.',
        'Serial No.',
        'Location',
        'IP Address',
        'UOM',
        ...qtyCols,
        'Issued To',
      ]
    : [
        'Date',
        'Doc. Type',
        'Doc. No.',
        'Serial No.',
        'Location',
        'IP Address',
        'UOM',
        ...qtyCols,
        'Issued To',
      ]

  const totals = useMemo(() => {
    // Footer uses Stock Ledger period totals (Receipt − Issue), not sum of line closings.
    if (rows.length === 0) return { opening: 0, receipt: 0, issue: 0, closing: 0 }
    const byItem = new Map<string, LedgerRow>()
    for (const r of rows) {
      const key = r.itemCode || r.itemName || r.id
      if (!byItem.has(key)) byItem.set(key, r)
    }
    let opening = 0
    let closing = 0
    let receipt = 0
    let issue = 0
    for (const r of byItem.values()) {
      opening += r.openingBalance
      receipt += r.periodReceipt
      issue += r.periodIssue
      closing += r.periodClosing > 0 ? r.periodClosing : Math.max(0, r.periodReceipt - r.periodIssue)
    }
    if (receipt === 0 && issue === 0) {
      receipt = rows.reduce((s, r) => s + qtyNum(r.receipt), 0)
      issue = rows.reduce((s, r) => s + qtyNum(r.issue), 0)
      closing = Math.max(0, receipt - issue)
    }
    return { opening, receipt, issue, closing }
  }, [rows])

  const qtyTd =
    'border-b border-[var(--border)] px-1.5 py-1.5 text-right tabular-nums w-16 min-w-[3.5rem] max-w-[4.5rem]'

  return (
    <>
      <FadeContent>
        <PageHeader
          title="Item Ledger"
          description="Each line: Closing = Receipt − Issue. Footer Closing is the period total (same as Stock Ledger)."
          actions={
            <Button
              variant="ghost"
              disabled={rows.length === 0}
              onClick={() =>
                downloadCsv(
                  `item-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
                  headers,
                  rows.map((r) =>
                    showItemCols
                      ? [
                          r.date,
                          r.itemCode,
                          r.itemName,
                          r.docType,
                          r.docNo,
                          r.serialNo,
                          r.location,
                          r.ipAddress,
                          r.uom,
                          formatStockQty(r.openingBalance),
                          r.receipt,
                          r.issue,
                          formatStockQty(r.closingBalance),
                          r.issuedTo,
                        ]
                      : [
                          r.date,
                          r.docType,
                          r.docNo,
                          r.serialNo,
                          r.location,
                          r.ipAddress,
                          r.uom,
                          formatStockQty(r.openingBalance),
                          r.receipt,
                          r.issue,
                          formatStockQty(r.closingBalance),
                          r.issuedTo,
                        ],
                  ),
                )
              }
            >
              Export
            </Button>
          }
        />
        {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
        {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading item ledger…</div>}

        <Card className="mb-3 overflow-visible">
          <CardHeader title="Filters" subtitle="Narrow by item, serial no., date range, or store" />
          <CardBody className="overflow-visible">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5 overflow-visible">
              <Field label="Item" className="relative z-40">
                <MasterItemSearchLookup
                  value={draft.itemId}
                  onChange={(v) => set('itemId', v)}
                  placeholder="All Items"
                  allowClear
                  pageSize={50}
                  maxVisible={50}
                />
              </Field>
              <Field label="Serial No.">
                <Input
                  value={draft.serialNo}
                  onChange={(e) => set('serialNo', e.target.value)}
                  placeholder="Track serial…"
                />
              </Field>
              <Field label="From Date">
                <Input type="date" value={draft.from} onChange={(e) => set('from', e.target.value)} />
              </Field>
              <Field label="To Date">
                <Input type="date" value={draft.to} onChange={(e) => set('to', e.target.value)} />
              </Field>
              <Field label="Location">
                <Select value={draft.loc} onChange={(e) => set('loc', e.target.value)}>
                  <option value="">{seesAllLocations ? 'All Locations' : 'My Locations'}</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} – {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={clearFilters}>Clear</Button>
              <Button onClick={applyFilters}>Apply</Button>
            </div>
          </CardBody>
        </Card>
      </FadeContent>

      {/* Outside FadeContent — motion transform breaks position:sticky */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          <ReportTableScroll>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className={reportThAlign(qtyLabelSet.has(h) ? 'right' : 'left', qtyLabelSet.has(h))}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const detailPath = txnDetailPath(r.txnType || r.docType, r.docId)
                  const rowClass = detailPath
                    ? 'cursor-pointer hover:bg-[#f0f5ff]'
                    : 'hover:bg-[#f0f5ff]'
                  return (
                    <tr
                      key={r.id}
                      className={rowClass}
                      onClick={() => {
                        if (detailPath) navigate(detailPath)
                      }}
                    >
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5 whitespace-nowrap">{r.date}</td>
                      {showItemCols && (
                        <>
                          <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.itemCode}</td>
                          <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemName}</td>
                        </>
                      )}
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.docType}</td>
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
                        {detailPath ? (
                          <button
                            type="button"
                            className="text-[var(--primary)] underline decoration-[var(--primary)]/40 underline-offset-2 hover:decoration-[var(--primary)]"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(detailPath)
                            }}
                          >
                            {r.docNo || '—'}
                          </button>
                        ) : (
                          r.docNo || '—'
                        )}
                      </td>
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.serialNo}</td>
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.location}</td>
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.ipAddress}</td>
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                      <td className={qtyTd}>{formatStockQty(r.openingBalance)}</td>
                      <td className={qtyTd}>{r.receipt}</td>
                      <td className={qtyTd}>{r.issue}</td>
                      <td className={`${qtyTd} font-semibold`}>{formatStockQty(r.closingBalance)}</td>
                      <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.issuedTo}</td>
                    </tr>
                  )
                })}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={headers.length}
                      className="px-[11px] py-8 text-center text-[var(--text3)]"
                    >
                      No ledger movements for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ReportTableScroll>

          {rows.length > 0 && (
            <div className="flex flex-wrap gap-7 border-t border-[var(--border)] px-3.5 py-3 text-[12.5px] text-[var(--text2)]">
              <div>
                Lines: <strong>{rows.length}</strong>
              </div>
              <div>
                Opening: <strong>{formatStockQty(totals.opening)}</strong>
              </div>
              <div>
                Receipt: <strong className="text-[var(--success)]">{formatStockQty(totals.receipt)}</strong>
              </div>
              <div>
                Issue: <strong className="text-[var(--danger)]">{formatStockQty(totals.issue)}</strong>
              </div>
              <div>
                Closing: <strong>{formatStockQty(totals.closing)}</strong>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
