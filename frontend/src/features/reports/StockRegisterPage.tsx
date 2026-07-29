import { useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { inventoryCategories, stockRegister, stores } from '@/data/mock'

export function StockRegisterPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [store, setStore] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(() => {
    return stockRegister.filter((r) => {
      const term = q.trim().toLowerCase()
      if (term && !`${r.itemCode} ${r.itemName}`.toLowerCase().includes(term)) return false
      if (cat && r.category !== cat) return false
      if (store && r.store !== store) return false
      if (status && r.status !== status) return false
      return true
    })
  }, [q, cat, store, status])

  const totals = useMemo(() => {
    return {
      items: rows.length,
      qty: rows.reduce((s, r) => s + r.closing, 0),
      value: rows.reduce((s, r) => s + r.value, 0),
    }
  }, [rows])

  return (
    <FadeContent>
      <PageHeader
        title="Stock Register"
        description="Opening, inward, outward and closing stock position for every item, item-wise and location-wise."
        actions={<Button variant="ghost">Export</Button>}
      />
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
              {inventoryCategories.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.code} value={s.code}>
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
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
            <span className="text-[11px] text-[var(--text3)]">{rows.length} records</span>
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
                {rows.map((r) => (
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
