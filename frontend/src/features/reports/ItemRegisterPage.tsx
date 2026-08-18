import { useCallback, useEffect, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchItemLedger } from '@/api/transactions'
import { mapItem, mapLocation, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { downloadCsv } from '@/lib/csvExport'

type LedgerRow = {
  id: string
  date: string
  itemCode: string
  itemName: string
  docType: string
  docNo: string
  batch: string
  uom: string
  location: string
  receipt: string
  issue: string
  balance: number
}

const emptyFilters = {
  itemId: '',
  loc: '',
  from: '',
  to: '',
}

const qtyCell = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? String(n) : '—'
}

export function ItemRegisterPage() {
  const { seesAllLocations } = useAuth()
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setDraft((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapItm = useCallback(mapItem, [])
  const mapLoc = useCallback(mapLocation, [])
  const { rows: items } = useMasterList('items', mapItm)
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
        locationId: applied.loc || undefined,
        fromDate: applied.from || undefined,
        toDate: applied.to || undefined,
      })
      setRows(
        (page.data ?? []).map((r, idx) => ({
          id: String(r.id ?? `${r.docNo}-${r.itemId}-${idx}`),
          date: String(r.date ?? ''),
          itemCode: String(r.itemCode ?? ''),
          itemName: String(r.itemName ?? ''),
          docType: String(r.docType ?? ''),
          docNo: String(r.docNo ?? ''),
          batch: String(r.batch ?? '').trim() || '—',
          uom: String(r.uomCode ?? '—'),
          location: String(r.locationCode ?? '—'),
          receipt: qtyCell(r.receipt as string | number | null),
          issue: qtyCell(r.issue as string | number | null),
          balance: Number(r.balance ?? 0),
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

  const headers = showItemCols
    ? [
        'Date',
        'Item Code',
        'Item Name',
        'Doc. Type',
        'Doc. No.',
        'Batch',
        'UOM',
        'Location',
        'Receipt',
        'Issue',
        'Balance',
      ]
    : ['Date', 'Doc. Type', 'Doc. No.', 'Batch', 'UOM', 'Location', 'Receipt', 'Issue', 'Balance']

  return (
    <FadeContent>
      <PageHeader
        title="Item Ledger"
        description="Running stock balance by document. Pick filters below and click Apply — changes are not loaded until you apply them."
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
                        r.batch,
                        r.uom,
                        r.location,
                        r.receipt,
                        r.issue,
                        r.balance,
                      ]
                    : [
                        r.date,
                        r.docType,
                        r.docNo,
                        r.batch,
                        r.uom,
                        r.location,
                        r.receipt,
                        r.issue,
                        r.balance,
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

      <Card className="mb-3">
        <CardHeader title="Filters" subtitle="Narrow by item, date range, or store" />
        <CardBody>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
            <Field label="Item">
              <Select value={draft.itemId} onChange={(e) => set('itemId', e.target.value)}>
                <option value="">All Items</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} – {i.name}
                  </option>
                ))}
              </Select>
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
                      key={h}
                      className="border-b-2 border-[var(--border)] px-[11px] py-[7px] text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f0f5ff]">
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 whitespace-nowrap">{r.date}</td>
                    {showItemCols && (
                      <>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.itemCode}</td>
                        <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemName}</td>
                      </>
                    )}
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.docType}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.docNo}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.batch}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.location}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.receipt}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.issue}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold">{r.balance}</td>
                  </tr>
                ))}
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
          </div>

          {rows.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-7 border-t border-[var(--border)] pt-3 text-[12.5px] text-[var(--text2)]">
              <div>
                Lines: <strong>{rows.length}</strong>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </FadeContent>
  )
}
