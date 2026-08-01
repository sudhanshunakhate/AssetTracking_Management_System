import { useCallback, useEffect, useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockRegister } from '@/api/transactions'
import { mapCategory, mapLocation, mapUnit, GEN_TYPE, useGenValues, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import type { StockRegisterRow } from '@/types/transactions'

export function StockRegisterPage() {
  const { seesAllLocations } = useAuth()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [store, setStore] = useState('')
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState<StockRegisterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapCat = useCallback(mapCategory, [])
  const mapLoc = useCallback(mapLocation, [])
  const mapUnt = useCallback(mapUnit, [])
  const { rows: categories } = useMasterList('categories', mapCat)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: units } = useMasterList('units', mapUnt)
  const { options: stockStatusOpts } = useGenValues(GEN_TYPE.STOCK_STATUS)

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const storeById = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s])), [stores])
  const uomById = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchStockRegister({
        page: 1,
        pageSize: 200,
        search: q || undefined,
        categoryId: cat || undefined,
        locationId: store || undefined,
      })
      setRows(
        (page.data ?? []).map((r) => {
          const locationId = String(r.locationId ?? '')
          const categoryId = String(r.categoryId ?? '')
          const uomId = String(r.uomId ?? '')
          const closing = Number(r.closing ?? 0)
          const reorder = Number(r.reorderLevel ?? 0)
          const apiStatus = String(r.status ?? '')
          return {
            id: String(r.id ?? `${r.itemId}-${r.locationId}`),
            itemCode: String(r.itemCode ?? ''),
            itemName: String(r.itemName ?? ''),
            category: catById[categoryId]?.name ?? categoryId,
            uom: uomById[uomId]?.code ?? uomId,
            store: storeById[locationId]?.code ?? locationId,
            opening: Number(r.opening ?? 0),
            inward: Number(r.inward ?? 0),
            outward: Number(r.outward ?? 0),
            closing,
            reorderLevel: reorder,
            value: Number(r.value ?? 0),
            status: (apiStatus as StockRegisterRow['status']) || 'In Stock',
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock register')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [q, cat, store, catById, storeById, uomById])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(() => {
    if (!status) return rows
    return rows.filter((r) => r.status === status)
  }, [rows, status])

  const totals = useMemo(() => {
    return {
      items: filtered.length,
      qty: filtered.reduce((s, r) => s + r.closing, 0),
      value: filtered.reduce((s, r) => s + r.value, 0),
    }
  }, [filtered])

  return (
    <FadeContent>
      <PageHeader
        title="Stock Register"
        description="Opening, inward, outward and closing stock position for every item, item-wise and location-wise."
        actions={<Button variant="ghost">Export</Button>}
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading stock register…</div>}
      <Card>
        <CardBody>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search item code / name…"
              className="min-w-[180px] flex-1 rounded-[7px] border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--accent)]"
            />
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">{seesAllLocations ? 'All Stores' : 'My Stores'}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">All Status</option>
              {stockStatusOpts.map((s) => (
                <option key={s.code} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  {[
                    'Item Code',
                    'Item Name',
                    'Category',
                    'UOM',
                    'Store',
                    'Opening',
                    'Inward',
                    'Outward',
                    'Closing',
                    'Reorder Lvl',
                    'Value (₹)',
                    'Status',
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
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f0f5ff]">
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.itemCode}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemName}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.category}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.store}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.opening}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.inward}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.outward}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold">{r.closing}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.reorderLevel}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
                      {r.value.toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      {r.status === 'In Stock' ? (
                        <StatusBadge status="Active" />
                      ) : (
                        <Pill>{r.status}</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-7 border-t border-[var(--border)] pt-3 text-[12.5px] text-[var(--text2)]">
            <div>
              Total Items: <strong>{totals.items}</strong>
            </div>
            <div>
              Total Closing Qty: <strong>{totals.qty}</strong>
            </div>
            <div className="font-bold text-[var(--text)]">
              Total Stock Value:{' '}
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
