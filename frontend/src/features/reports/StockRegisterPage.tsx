import { useCallback, useEffect, useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockRegister } from '@/api/transactions'
import { mapLocation, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { downloadCsv } from '@/lib/csvExport'

type LedgerRow = {
  id: string
  srNo: number
  itemName: string
  uom: string
  openingBalance: number
  receiptDuringPeriod: number
  issueDuringPeriod: number
  closingBalance: number
  ownerName: string
}

const emptyFilters = {
  search: '',
  loc: '',
  from: '',
  to: '',
}

export function StockRegisterPage() {
  const { seesAllLocations } = useAuth()
  const [f, setF] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setF((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapLoc = useCallback(mapLocation, [])
  const { rows: stores } = useMasterList('locations', mapLoc)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchStockRegister({
        page: 1,
        pageSize: 200,
        search: f.search || undefined,
        locationId: f.loc || undefined,
        fromDate: f.from || undefined,
        toDate: f.to || undefined,
      })
      setRows(
        (page.data ?? []).map((r, idx) => ({
          id: String(r.id ?? r.itemId ?? idx),
          srNo: Number(r.srNo ?? idx + 1),
          itemName: String(r.itemName ?? ''),
          uom: String(r.uomCode ?? '—'),
          openingBalance: Number(r.openingBalance ?? 0),
          receiptDuringPeriod: Number(r.receiptDuringPeriod ?? 0),
          issueDuringPeriod: Number(r.issueDuringPeriod ?? 0),
          closingBalance: Number(r.closingBalance ?? 0),
          ownerName: String(r.ownerName ?? '').trim() || '—',
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock ledger')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [f])

  useEffect(() => {
    void reload()
  }, [reload])

  const totals = useMemo(
    () => ({
      items: rows.length,
      opening: rows.reduce((s, r) => s + r.openingBalance, 0),
      receipt: rows.reduce((s, r) => s + r.receiptDuringPeriod, 0),
      issue: rows.reduce((s, r) => s + r.issueDuringPeriod, 0),
      closing: rows.reduce((s, r) => s + r.closingBalance, 0),
    }),
    [rows],
  )

  const headers = [
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
        description="Opening, receipt, issue and closing balances by item for the selected period, with owner for individual assets."
        actions={
          <>
            <Button variant="ghost" onClick={() => setF(emptyFilters)}>
              Clear
            </Button>
            <Button
              variant="ghost"
              disabled={rows.length === 0}
              onClick={() =>
                downloadCsv(
                  `stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
                  headers,
                  rows.map((r) => [
                    r.srNo,
                    r.itemName,
                    r.uom,
                    r.openingBalance,
                    r.receiptDuringPeriod,
                    r.issueDuringPeriod,
                    r.closingBalance,
                    r.ownerName,
                  ]),
                )
              }
            >
              Export
            </Button>
            <Button onClick={() => void reload()}>Apply</Button>
          </>
        }
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading stock ledger…</div>}

      <Card className="mb-3">
        <CardBody>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
            <Field label="Search">
              <Input
                value={f.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Item name / code…"
              />
            </Field>
            <Field label="From Date">
              <Input type="date" value={f.from} onChange={(e) => set('from', e.target.value)} />
            </Field>
            <Field label="To Date">
              <Input type="date" value={f.to} onChange={(e) => set('to', e.target.value)} />
            </Field>
            <Field label="Store">
              <Select value={f.loc} onChange={(e) => set('loc', e.target.value)}>
                <option value="">{seesAllLocations ? 'All Stores' : 'My Stores'}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} – {s.name}
                  </option>
                ))}
              </Select>
            </Field>
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
                      key={h}
                      className="border-b-2 border-[var(--border)] px-[11px] py-[7px] text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f0f5ff]">
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 text-[var(--text3)]">{r.srNo}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemName}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.openingBalance}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.receiptDuringPeriod}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.issueDuringPeriod}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold">{r.closingBalance}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.ownerName}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-[11px] py-8 text-center text-[var(--text3)]">
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
              Opening: <strong>{totals.opening}</strong>
            </div>
            <div>
              Receipt: <strong className="text-[var(--success)]">{totals.receipt}</strong>
            </div>
            <div>
              Issue: <strong className="text-[var(--danger)]">{totals.issue}</strong>
            </div>
            <div>
              Closing: <strong>{totals.closing}</strong>
            </div>
          </div>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
