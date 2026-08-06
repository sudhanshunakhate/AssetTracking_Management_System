import { useCallback, useEffect, useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Pill, StatusBadge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchItemRegister } from '@/api/transactions'
import { mapCategory, mapSubcategory, mapUnit, useMasterList } from '@/api/masters'
import { downloadCsv } from '@/lib/csvExport'

type ItemRegRow = {
  id: string
  itemCode: string
  itemName: string
  itemType: string
  category: string
  subcategory: string
  uom: string
  makeBrand: string
  model: string
  flags: string
  standardCost: number
  totalStockQty: number
  totalStockValue: number
  storeCount: number
  currentStore: string
  active: boolean
}

export function ItemRegisterPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [subcat, setSubcat] = useState('')
  const [itemType, setItemType] = useState('')
  const [active, setActive] = useState('true')
  const [rows, setRows] = useState<ItemRegRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapCat = useCallback(mapCategory, [])
  const mapSub = useCallback(mapSubcategory, [])
  const mapUnt = useCallback(mapUnit, [])
  const { rows: categories } = useMasterList('categories', mapCat)
  const { rows: subcategories } = useMasterList('subcategories', mapSub)
  const { rows: units } = useMasterList('units', mapUnt)

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const subById = useMemo(() => Object.fromEntries(subcategories.map((s) => [s.id, s])), [subcategories])
  const uomById = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units])

  const filteredSubs = useMemo(
    () => (cat ? subcategories.filter((s) => s.parentCode === cat) : subcategories),
    [subcategories, cat],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchItemRegister({
        page: 1,
        pageSize: 200,
        search: q || undefined,
        categoryId: cat || undefined,
        subcategoryId: subcat || undefined,
        itemType: itemType || undefined,
        active: active === '' ? undefined : active === 'true',
      })
      setRows(
        (page.data ?? []).map((r) => {
          const categoryId = String(r.categoryId ?? '')
          const subcategoryId = String(r.subcategoryId ?? '')
          const uomId = String(r.uomId ?? '')
          const flags = [
            r.isSerialized ? 'Serial' : null,
            r.trackBatchLot ? 'Batch' : null,
            r.trackExpiry ? 'Expiry' : null,
            r.isConsumable ? 'Consumable' : null,
          ]
            .filter(Boolean)
            .join(', ')
          return {
            id: String(r.id ?? r.itemCode),
            itemCode: String(r.itemCode ?? ''),
            itemName: String(r.itemName ?? ''),
            itemType: String(r.itemType ?? '—'),
            category: catById[categoryId]?.name ?? (categoryId || '—'),
            subcategory: subById[subcategoryId]?.name ?? (subcategoryId || '—'),
            uom: uomById[uomId]?.code ?? (uomId || '—'),
            makeBrand: String(r.makeBrand ?? '—'),
            model: String(r.model ?? '—'),
            flags: flags || '—',
            standardCost: Number(r.standardCost ?? 0),
            totalStockQty: Number(r.totalStockQty ?? 0),
            totalStockValue: Number(r.totalStockValue ?? 0),
            storeCount: Number(r.storeCount ?? 0),
            currentStore: String(r.currentStore ?? '—'),
            active: Boolean(r.active),
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item register')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [q, cat, subcat, itemType, active, catById, subById, uomById])

  useEffect(() => {
    void reload()
  }, [reload])

  const totals = useMemo(
    () => ({
      items: rows.length,
      active: rows.filter((r) => r.active).length,
      qty: rows.reduce((s, r) => s + r.totalStockQty, 0),
      value: rows.reduce((s, r) => s + r.totalStockValue, 0),
    }),
    [rows],
  )

  return (
    <FadeContent>
      <PageHeader
        title="Item Register"
        description="Master catalog of items with tracking flags and across-store stock totals."
        actions={
          <Button
            variant="ghost"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv(
                `item-register-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  'Item Code',
                  'Item Name',
                  'Type',
                  'Category',
                  'Subcategory',
                  'UOM',
                  'Make',
                  'Model',
                  'Flags',
                  'Standard Cost',
                  'Stock Qty',
                  'Stock Value',
                  'Stores',
                  'Current Store',
                  'Active',
                ],
                rows.map((r) => [
                  r.itemCode,
                  r.itemName,
                  r.itemType,
                  r.category,
                  r.subcategory,
                  r.uom,
                  r.makeBrand,
                  r.model,
                  r.flags,
                  r.standardCost,
                  r.totalStockQty,
                  r.totalStockValue,
                  r.storeCount,
                  r.currentStore,
                  r.active ? 'Yes' : 'No',
                ]),
              )
            }
          >
            Export
          </Button>
        }
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading item register…</div>}
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
              onChange={(e) => {
                setCat(e.target.value)
                setSubcat('')
              }}
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
              value={subcat}
              onChange={(e) => setSubcat(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">All Sub-Categories</option>
              {filteredSubs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">All Types</option>
              <option value="asset">Asset</option>
              <option value="consumable">Consumable</option>
            </select>
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
              <option value="">All</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  {[
                    'Item Code',
                    'Item Name',
                    'Type',
                    'Category',
                    'Sub-Category',
                    'UOM',
                    'Brand',
                    'Model',
                    'Tracking',
                    'Std Cost',
                    'Stock Qty',
                    'Stock Value',
                    'Stores',
                    'Current Store',
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
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f0f5ff]">
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.itemCode}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemName}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemType}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.category}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.subcategory}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.makeBrand}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.model}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      {r.flags === '—' ? '—' : <Pill>{r.flags}</Pill>}
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
                      {r.standardCost.toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold">{r.totalStockQty}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
                      {r.totalStockValue.toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.storeCount}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.currentStore}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      {r.active ? <StatusBadge status="Active" /> : <StatusPill status="Inactive" />}
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-[11px] py-8 text-center text-[var(--text3)]">
                      No items for the selected filters.
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
              Active: <strong>{totals.active}</strong>
            </div>
            <div>
              Total Stock Qty: <strong>{totals.qty}</strong>
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
