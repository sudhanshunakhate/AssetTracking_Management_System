import { useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Pill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  employees,
  fullReport,
  items,
  operatingUnits,
  organizations,
  stores,
  users,
} from '@/data/mock'

const emptyFilters = {
  search: '',
  txnType: '',
  status: '',
  item: '',
  loc: '',
  org: '',
  ou: '',
  employee: '',
  user: '',
  from: '',
  to: '',
}

export function FullReportPage() {
  const [f, setF] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setF((prev) => ({ ...prev, [k]: v }))

  const rows = useMemo(() => {
    return fullReport.filter((r) => {
      const term = f.search.trim().toLowerCase()
      if (term && !`${r.txnNo} ${r.item} ${r.status}`.toLowerCase().includes(term)) return false
      if (f.txnType && r.txnType !== f.txnType) return false
      if (f.status && r.status !== f.status) return false
      if (f.item && !r.item.startsWith(f.item)) return false
      if (f.loc && r.toLocation !== f.loc && r.fromLocation !== f.loc) return false
      if (f.org && r.organization !== f.org) return false
      if (f.ou && r.operatingUnit !== f.ou) return false
      if (f.employee && !r.employee.toLowerCase().includes(f.employee.toLowerCase())) return false
      if (f.user && r.user !== f.user) return false
      if (f.from && r.date < f.from) return false
      if (f.to && r.date > f.to) return false
      return true
    })
  }, [f])

  const summary = useMemo(() => {
    const itemSet = new Set(rows.map((r) => r.item))
    const locSet = new Set(rows.flatMap((r) => [r.fromLocation, r.toLocation]).filter((x) => x !== '—'))
    return {
      txns: rows.length,
      items: itemSet.size,
      locs: locSet.size,
      value: rows.reduce((s, r) => s + r.value, 0),
    }
  }, [rows])

  return (
    <FadeContent>
      <PageHeader
        title="Full Report"
        description="Every transaction across items, locations, organizations, operating units, employees, users and assets — one consolidated trail for management to track."
        actions={<Button variant="ghost">Export</Button>}
      />

      <Card>
        <CardHeader title="Filters" subtitle="Narrow the report down to exactly what you need to see" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Search" className="md:col-span-2">
              <Input
                value={f.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Txn no., item, remarks…"
              />
            </Field>
            <Field label="Transaction Type">
              <Select value={f.txnType} onChange={(e) => set('txnType', e.target.value)}>
                <option value="">All Types</option>
                <option>Store Requisition</option>
                <option>Store Issue</option>
                <option>Goods Receipt Note (GRN)</option>
                <option>Material Transfer</option>
                <option>Material Return</option>
                <option>Opening Stock</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
                <option value="">All Status</option>
                <option>Draft</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Done</option>
                <option>Issued</option>
                <option>Completed</option>
              </Select>
            </Field>
            <Field label="Item / Asset">
              <Select value={f.item} onChange={(e) => set('item', e.target.value)}>
                <option value="">All Items</option>
                {items.map((i) => (
                  <option key={i.code} value={i.code}>
                    {i.code} – {i.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location / Store">
              <Select value={f.loc} onChange={(e) => set('loc', e.target.value)}>
                <option value="">All Locations</option>
                {stores.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Organization (Entity)">
              <Select value={f.org} onChange={(e) => set('org', e.target.value)}>
                <option value="">All Organizations</option>
                {organizations.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Operating Unit">
              <Select value={f.ou} onChange={(e) => set('ou', e.target.value)}>
                <option value="">All Operating Units</option>
                {operatingUnits.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Employee">
              <Select value={f.employee} onChange={(e) => set('employee', e.target.value)}>
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.code} value={`${e.firstName} ${e.lastName}`}>
                    {e.code} – {e.firstName} {e.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="User">
              <Select value={f.user} onChange={(e) => set('user', e.target.value)}>
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.loginId}>
                    {u.loginId}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From Date">
              <Input type="date" value={f.from} onChange={(e) => set('from', e.target.value)} />
            </Field>
            <Field label="To Date">
              <Input type="date" value={f.to} onChange={(e) => set('to', e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button variant="danger" onClick={() => setF(emptyFilters)}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap gap-7 px-5 py-3.5 text-[12.5px] text-[var(--text2)]">
          <div>
            Transactions: <strong>{summary.txns}</strong>
          </div>
          <div>
            Items Involved: <strong>{summary.items}</strong>
          </div>
          <div>
            Locations Involved: <strong>{summary.locs}</strong>
          </div>
          <div className="font-bold text-[var(--text)]">
            Total Value:{' '}
            <span className="text-[var(--accent)]">
              ₹ {summary.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--surface2)]">
                {[
                  'Date',
                  'Txn Type',
                  'Txn No.',
                  'Item / Asset',
                  'Category',
                  'Qty',
                  'UOM',
                  'From Location',
                  'To Location',
                  'Organization',
                  'Operating Unit',
                  'Employee',
                  'User',
                  'Status',
                  'Value (₹)',
                ].map((h) => (
                  <th
                    key={h}
                    className="border-b-2 border-[var(--border)] px-[11px] py-[7px] text-left text-[9.5px] font-bold tracking-[0.6px] whitespace-nowrap text-[var(--text3)] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-3 py-8 text-center text-[12.5px] text-[var(--text3)]">
                    No transactions match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f0f5ff]">
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 whitespace-nowrap">{r.date}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.txnType}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono font-semibold">{r.txnNo}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.item}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.category}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.qty}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.uom}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.fromLocation}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.toLocation}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.organization}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.operatingUnit}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.employee}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.user}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      <Pill>{r.status}</Pill>
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
                      {r.value.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
