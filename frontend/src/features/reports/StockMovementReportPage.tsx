import { useCallback, useEffect, useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { DocTypeBadge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockMovement } from '@/api/transactions'
import { mapCategory, mapLocation, mapUnit, GEN_TYPE, useGenValues, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'

type MovementRow = {
  id: string
  date: string
  docType: string
  docNo: string
  direction: string
  itemCode: string
  itemName: string
  category: string
  qty: number
  uom: string
  fromStore: string
  toStore: string
  employee: string
  status: string
  value: number
  serialNo: string
}

const emptyFilters = {
  search: '',
  docType: '',
  direction: '',
  loc: '',
  cat: '',
  from: '',
  to: '',
}

const DIR_STYLE: Record<string, string> = {
  IN: 'bg-[var(--success-lt)] text-[var(--success)]',
  OUT: 'bg-[var(--danger-lt)] text-[var(--danger)]',
  TRANSFER: 'bg-[var(--warm-lt)] text-[var(--warm-deep)]',
}

export function StockMovementReportPage() {
  const { seesAllLocations } = useAuth()
  const [f, setF] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setF((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<MovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapCat = useCallback(mapCategory, [])
  const mapLoc = useCallback(mapLocation, [])
  const mapUnt = useCallback(mapUnit, [])
  const { rows: categories } = useMasterList('categories', mapCat)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: units } = useMasterList('units', mapUnt)
  const { options: docTypeOpts } = useGenValues(GEN_TYPE.DOC_TYPE, 'code')

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const uomById = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units])

  const movementDocTypes = useMemo(
    () =>
      docTypeOpts.filter((o) =>
        [
          'OPENING_STOCK',
          'GRN',
          'GATEPASS_INWARD',
          'GATEPASS_OUTWARD',
          'MATERIAL_ISSUE',
          'MATERIAL_TRANSFER',
          'MATERIAL_RETURN',
        ].includes(o.code),
      ),
    [docTypeOpts],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchStockMovement({
        page: 1,
        pageSize: 200,
        search: f.search || undefined,
        docType: f.docType || undefined,
        direction: f.direction || undefined,
        locationId: f.loc || undefined,
        categoryId: f.cat || undefined,
        fromDate: f.from || undefined,
        toDate: f.to || undefined,
      })
      setRows(
        (page.data ?? []).map((r) => {
          const categoryId = String(r.categoryId ?? '')
          const uomId = String(r.uomId ?? '')
          return {
            id: String(r.id ?? `${r.docNo}-${r.itemId}`),
            date: String(r.date ?? ''),
            docType: String(r.docType ?? ''),
            docNo: String(r.docNo ?? ''),
            direction: String(r.direction ?? ''),
            itemCode: String(r.itemCode ?? ''),
            itemName: String(r.itemName ?? r.itemId ?? ''),
            category: catById[categoryId]?.name ?? (categoryId || '—'),
            qty: Number(r.qty ?? 0),
            uom: uomById[uomId]?.code ?? (uomId || '—'),
            fromStore: String(r.fromStore ?? '—'),
            toStore: String(r.toStore ?? '—'),
            employee: String(r.employee ?? '—'),
            status: String(r.status ?? ''),
            value: Number(r.value ?? 0),
            serialNo: String(r.serialNo ?? '—'),
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock movement report')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [f, catById, uomById])

  useEffect(() => {
    void reload()
  }, [reload])

  const totals = useMemo(() => {
    const inQty = rows.filter((r) => r.direction === 'IN').reduce((s, r) => s + r.qty, 0)
    const outQty = rows.filter((r) => r.direction === 'OUT').reduce((s, r) => s + r.qty, 0)
    const trfQty = rows.filter((r) => r.direction === 'TRANSFER').reduce((s, r) => s + r.qty, 0)
    return {
      lines: rows.length,
      inQty,
      outQty,
      trfQty,
      value: rows.reduce((s, r) => s + r.value, 0),
    }
  }, [rows])

  return (
    <FadeContent>
      <PageHeader
        title="Stock Movement Report"
        description="Detailed in / out / transfer movements from stock-affecting documents over a period."
        actions={
          <>
            <Button variant="ghost" onClick={() => setF(emptyFilters)}>
              Clear
            </Button>
            <Button variant="ghost">Export</Button>
            <Button onClick={() => void reload()}>Apply</Button>
          </>
        }
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading stock movement…</div>}

      <Card className="mb-3">
        <CardBody>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
            <Field label="Search">
              <Input
                value={f.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Item / doc no…"
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
                    {s.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Direction">
              <Select value={f.direction} onChange={(e) => set('direction', e.target.value)}>
                <option value="">All</option>
                <option value="IN">In</option>
                <option value="OUT">Out</option>
                <option value="TRANSFER">Transfer</option>
              </Select>
            </Field>
            <Field label="Doc Type">
              <Select value={f.docType} onChange={(e) => set('docType', e.target.value)}>
                <option value="">All Movement Types</option>
                {movementDocTypes.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={f.cat} onChange={(e) => set('cat', e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                  {[
                    'Date',
                    'Direction',
                    'Doc Type',
                    'Doc No',
                    'Item Code',
                    'Item Name',
                    'Qty',
                    'UOM',
                    'From',
                    'To',
                    'Employee',
                    'Serial',
                    'Status',
                    'Value (₹)',
                  ].map((h) => (
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
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.date}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${DIR_STYLE[r.direction] ?? ''}`}
                      >
                        {r.direction}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      <DocTypeBadge type={r.docType} />
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.docNo}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.itemCode}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemName}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold">{r.qty}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.fromStore}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.toStore}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.employee}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.serialNo}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
                      {r.value.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-[11px] py-8 text-center text-[var(--text3)]">
                      No stock movements for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-7 border-t border-[var(--border)] pt-3 text-[12.5px] text-[var(--text2)]">
            <div>
              Lines: <strong>{totals.lines}</strong>
            </div>
            <div>
              In Qty: <strong className="text-[var(--success)]">{totals.inQty}</strong>
            </div>
            <div>
              Out Qty: <strong className="text-[var(--danger)]">{totals.outQty}</strong>
            </div>
            <div>
              Transfer Qty: <strong className="text-[var(--warm-deep)]">{totals.trfQty}</strong>
            </div>
            <div className="font-bold text-[var(--text)]">
              Value:{' '}
              <span className="text-[var(--accent)]">
                ₹ {totals.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
