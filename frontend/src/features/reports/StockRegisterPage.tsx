import { useCallback, useEffect, useMemo, useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockRegister, invalidateReportCache } from '@/api/transactions'
import { mapLocation, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { downloadCsv } from '@/lib/csvExport'
import { formatStockQty } from '@/features/transactions/lineGrid'

type UnitRow = {
  blsId: string
  serialNo: string
  batchLotNo: string
  ipAddress: string
  macAddress: string
  hostname: string
  itemCondition: string
  locationCode: string
  locationName: string
  custodian: string
  custodyMode: string
}

type LedgerRow = {
  id: string
  itemId: string
  itemType: string
  srNo: number
  itemName: string
  uom: string
  openingBalance: number
  receiptDuringPeriod: number
  issueDuringPeriod: number
  closingBalance: number
  ownerName: string
  units: UnitRow[]
}

const emptyFilters = {
  search: '',
  loc: '',
  from: '',
  to: '',
}

const dash = (v: string) => (v.trim() ? v : '—')

function mapUnit(u: Record<string, unknown>): UnitRow {
  return {
    blsId: String(u.blsId ?? ''),
    serialNo: String(u.serialNo ?? '').trim(),
    batchLotNo: String(u.batchLotNo ?? '').trim(),
    ipAddress: String(u.ipAddress ?? '').trim(),
    macAddress: String(u.macAddress ?? '').trim(),
    hostname: String(u.hostname ?? '').trim(),
    itemCondition: String(u.itemCondition ?? '').trim(),
    locationCode: String(u.locationCode ?? '').trim(),
    locationName: String(u.locationName ?? '').trim(),
    custodian: String(u.custodian ?? '').trim(),
    custodyMode: String(u.custodyMode ?? 'IN_STORE'),
  }
}

export function StockRegisterPage() {
  const navigate = useNavigate()
  const { seesAllLocations } = useAuth()
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setDraft((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [unitsHistoricalNote, setUnitsHistoricalNote] = useState(false)
  /** Debounced free-text filter over every visible column + unit sub-row. */
  const [columnSearch, setColumnSearch] = useState('')
  const [columnSearchDebounced, setColumnSearchDebounced] = useState('')

  const mapLoc = useCallback(mapLocation, [])
  const { rows: stores } = useMasterList('locations', mapLoc)

  useEffect(() => {
    const t = window.setTimeout(() => setColumnSearchDebounced(columnSearch.trim().toLowerCase()), 250)
    return () => window.clearTimeout(t)
  }, [columnSearch])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      invalidateReportCache()
      const page = await fetchStockRegister({
        page: 1,
        pageSize: 200,
        search: applied.search || undefined,
        locationId: applied.loc || undefined,
        fromDate: applied.from || undefined,
        toDate: applied.to || undefined,
      })
      setRows(
        (page.data ?? []).map((r, idx) => ({
          id: String(r.id ?? r.itemId ?? idx),
          itemId: String(r.itemId ?? ''),
          itemType: String(r.itemType ?? ''),
          srNo: Number(r.srNo ?? idx + 1),
          itemName: String(r.itemName ?? ''),
          uom: String(r.uomCode ?? '—'),
          openingBalance: Number(r.openingBalance ?? 0),
          receiptDuringPeriod: Number(r.receiptDuringPeriod ?? 0),
          issueDuringPeriod: Number(r.issueDuringPeriod ?? 0),
          closingBalance: Number(r.closingBalance ?? 0),
          ownerName: String(r.ownerName ?? '').trim() || '—',
          units: Array.isArray(r.units)
            ? (r.units as Record<string, unknown>[]).map(mapUnit)
            : [],
        })),
      )
      setUnitsHistoricalNote(
        (page.data ?? []).some((r) => String(r.unitsAsOf ?? '') === 'OMITTED_HISTORICAL'),
      )
      setExpanded({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock ledger')
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
    setColumnSearch('')
    setColumnSearchDebounced('')
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const visibleRows = useMemo(() => {
    if (!columnSearchDebounced) return rows
    const q = columnSearchDebounced
    return rows.filter((r) => {
      const mainHit = [
        r.srNo,
        r.itemName,
        r.itemType,
        r.uom,
        r.openingBalance,
        r.receiptDuringPeriod,
        r.issueDuringPeriod,
        r.closingBalance,
        r.ownerName,
      ]
        .map((v) => String(v).toLowerCase())
        .some((s) => s.includes(q))
      if (mainHit) return true
      return r.units.some((u) =>
        [
          u.serialNo,
          u.batchLotNo,
          u.ipAddress,
          u.macAddress,
          u.hostname,
          u.itemCondition,
          u.locationCode,
          u.locationName,
          u.custodian,
          u.custodyMode,
        ]
          .map((v) => String(v).toLowerCase())
          .some((s) => s.includes(q)),
      )
    })
  }, [rows, columnSearchDebounced])

  const totals = useMemo(
    () => ({
      items: visibleRows.length,
      opening: visibleRows.reduce((s, r) => s + r.openingBalance, 0),
      receipt: visibleRows.reduce((s, r) => s + r.receiptDuringPeriod, 0),
      issue: visibleRows.reduce((s, r) => s + r.issueDuringPeriod, 0),
      closing: visibleRows.reduce((s, r) => s + r.closingBalance, 0),
    }),
    [visibleRows],
  )

  const headers = [
    '',
    'Sr No',
    'Item Name',
    'UOM',
    'Opening Balance',
    'Receipt During the Period',
    'Issue During the Period',
    'Closing Balance for the Period',
    'Owner Name for Individual Asset',
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Stock Ledger"
        description="Opening / Receipt / Issue / Closing follow the date filter. Unit serials expand only when Closing is live stock (clear To Date, or set it to today). Issue is period stock movement — not current allotment."
        actions={
          <Button
            variant="ghost"
            disabled={visibleRows.length === 0}
            onClick={() =>
              downloadCsv(
                `stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  'Sr No',
                  'Item Name',
                  'UOM',
                  'Opening Balance',
                  'Receipt During the Period',
                  'Issue During the Period',
                  'Closing Balance for the Period',
                  'Owner Name for Individual Asset',
                ],
                visibleRows.map((r) => [
                  r.srNo,
                  r.itemName,
                  r.uom,
                  formatStockQty(r.openingBalance),
                  formatStockQty(r.receiptDuringPeriod),
                  formatStockQty(r.issueDuringPeriod),
                  formatStockQty(r.closingBalance),
                  r.ownerName,
                ]),
              )
            }
          >
            Export
          </Button>
        }
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading stock ledger…</div>}
      {unitsHistoricalNote && !loading && (
        <div className="mb-2 rounded border border-[var(--border)] bg-[#f7f9fc] px-3 py-2 text-sm text-[var(--text2)]">
          To Date is in the past — Closing is as of that date. Unit serial details are hidden here so they
          are not confused with Closing. Clear To Date (or set it to today) to expand live on-hand units.
        </div>
      )}

      <Card className="mb-3">
        <CardHeader title="Filters" subtitle="Narrow by item, date range, or location" />
        <CardBody>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
            <Field label="Search (server)">
              <Input
                value={draft.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Item name / code…"
              />
            </Field>
            <Field label="Search all columns">
              <Input
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Serial, location, custodian, batch…"
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

      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  {headers.map((h) => (
                    <th
                      key={h || 'expand'}
                      className="border-b-2 border-[var(--border)] px-[11px] py-[7px] text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const isOpen = Boolean(expanded[r.id])
                  const canExpand = r.units.length > 0
                  const issuedUnits = r.units.filter((u) => u.custodyMode === 'ISSUED_TO').length
                  const isConsumable = r.itemType.toLowerCase() === 'consumable'
                  const unitHeaders = [
                    'Serial No.',
                    'Location',
                    'Custodian',
                    'Condition',
                    'IP Address',
                    'MAC Address',
                    'Hostname',
                    ...(isConsumable ? (['Batch / Lot'] as const) : []),
                  ]
                  return (
                    <Fragment key={r.id}>
                      <tr className="hover:bg-[#f0f5ff]">
                        <td className="border-b border-[var(--border)] px-[6px] py-1.5 w-8">
                          {canExpand ? (
                            <button
                              type="button"
                              aria-label={isOpen ? `Collapse ${r.itemName}` : `Expand ${r.itemName}`}
                              aria-expanded={isOpen}
                              onClick={() => toggleExpand(r.id)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-[var(--accent-deep)] hover:bg-[#e8effc]"
                            >
                              {isOpen ? '▾' : '▸'}
                            </button>
                          ) : (
                            <span className="inline-block w-6 text-center text-[var(--text3)]">·</span>
                          )}
                        </td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5 text-[var(--text3)]">{r.srNo}</td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                          {r.itemId ? (
                            <button
                              type="button"
                              className="text-left font-medium text-[var(--accent-deep)] hover:underline"
                              onClick={() =>
                                navigate(`/reports/item-register?itemId=${encodeURIComponent(r.itemId)}`)
                              }
                            >
                              {r.itemName}
                            </button>
                          ) : (
                            r.itemName
                          )}
                          {canExpand && (
                            <span className="ml-1.5 text-[10px] text-[var(--text3)]">
                              ({r.units.length} on hand
                              {issuedUnits > 0 ? ` · ${issuedUnits} issued` : ''})
                            </span>
                          )}
                        </td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5">{formatStockQty(r.openingBalance)}</td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5">{formatStockQty(r.receiptDuringPeriod)}</td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5">{formatStockQty(r.issueDuringPeriod)}</td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold">{formatStockQty(r.closingBalance)}</td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.ownerName}</td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#f7f9fc]">
                          <td colSpan={9} className="border-b border-[var(--border)] px-3 py-2.5">
                            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--text3)]">
                              Units on hand — serial, custody and network details
                              {issuedUnits > 0 ? ` (${issuedUnits} issued to staff)` : ''}
                            </div>
                            <table className="w-full border-collapse text-[11px]">
                              <thead>
                                <tr>
                                  {unitHeaders.map((h) => (
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
                                {r.units.map((u) => (
                                  <tr key={u.blsId || `${u.serialNo}-${u.locationCode}`}>
                                    <td className="border-b border-[var(--border)] px-2 py-1 font-mono">
                                      {dash(u.serialNo)}
                                    </td>
                                    <td className="border-b border-[var(--border)] px-2 py-1">
                                      {dash(u.locationName || u.locationCode)}
                                    </td>
                                    <td className="border-b border-[var(--border)] px-2 py-1">
                                      {u.custodyMode === 'ISSUED_TO' ? (
                                        <span>
                                          <span className="font-medium text-amber-800">Issued</span>
                                          <span className="text-[var(--text3)]"> · {dash(u.custodian)}</span>
                                        </span>
                                      ) : (
                                        <span className="text-[var(--text3)]">In store</span>
                                      )}
                                    </td>
                                    <td className="border-b border-[var(--border)] px-2 py-1">
                                      {u.custodyMode === 'ISSUED_TO'
                                        ? (u.itemCondition &&
                                          u.itemCondition.toLowerCase() !== 'in stock'
                                            ? u.itemCondition
                                            : 'Issued')
                                        : dash(u.itemCondition)}
                                    </td>
                                    <td className="border-b border-[var(--border)] px-2 py-1 font-mono">
                                      {dash(u.ipAddress)}
                                    </td>
                                    <td className="border-b border-[var(--border)] px-2 py-1 font-mono">
                                      {dash(u.macAddress)}
                                    </td>
                                    <td className="border-b border-[var(--border)] px-2 py-1 font-mono">
                                      {dash(u.hostname)}
                                    </td>
                                    {isConsumable && (
                                      <td className="border-b border-[var(--border)] px-2 py-1 font-mono">
                                        {dash(u.batchLotNo)}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {!loading && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-[11px] py-8 text-center text-[var(--text3)]">
                      No stock ledger rows for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-7 border-t border-[var(--border)] pt-3 text-[12.5px] text-[var(--text2)]">
            <div>
              Items: <strong>{totals.items}</strong>
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
        </CardBody>
      </Card>
    </FadeContent>
  )
}
