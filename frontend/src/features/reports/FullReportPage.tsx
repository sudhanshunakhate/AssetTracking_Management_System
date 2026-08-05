import { useCallback, useEffect, useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { DocTypeBadge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchFullReport } from '@/api/transactions'
import { mapEmployee, mapEntity, mapLocation, GEN_TYPE, useGenValues, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import type { FullReportRow } from '@/types/transactions'

const emptyFilters = {
  search: '',
  txnType: '',
  status: '',
  loc: '',
  from: '',
  to: '',
}

export function FullReportPage() {
  const { seesAllLocations } = useAuth()
  const [f, setF] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setF((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<FullReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapLoc = useCallback(mapLocation, [])
  const mapEnt = useCallback(mapEntity, [])
  const mapEmp = useCallback(mapEmployee, [])
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: orgs } = useMasterList('entities', mapEnt)
  const { rows: employees } = useMasterList('employees', mapEmp)
  const { options: docTypeOpts } = useGenValues(GEN_TYPE.DOC_TYPE, 'code')
  const { options: docStatusOpts } = useGenValues(GEN_TYPE.DOC_STATUS)

  const storeById = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s])), [stores])
  const orgById = useMemo(() => Object.fromEntries(orgs.map((o) => [o.id, o])), [orgs])
  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchFullReport({
        page: 1,
        pageSize: 200,
        docType: f.txnType || undefined,
        fromDate: f.from || undefined,
        toDate: f.to || undefined,
        locationId: f.loc || undefined,
      })
      setRows(
        (page.data ?? []).map((r) => {
          const fromId = String(r.fromLocationId ?? '')
          const toId = String(r.toLocationId ?? '')
          const entityId = String(r.entityId ?? '')
          const employeeId = String(r.employeeId ?? '')
          const emp = empById[employeeId]
          return {
            id: String(r.id ?? `${r.txnNo}-${r.itemId}`),
            date: String(r.date ?? ''),
            txnType: String(r.txnType ?? ''),
            txnNo: String(r.txnNo ?? ''),
            item: String(r.item ?? r.itemId ?? ''),
            category: String(r.categoryId ?? '—'),
            qty: Number(r.qty ?? 0),
            uom: String(r.uomId ?? '—'),
            fromLocation: storeById[fromId]?.code ?? (fromId || '—'),
            toLocation: storeById[toId]?.code ?? (toId || '—'),
            organization: orgById[entityId]?.code ?? (entityId || '—'),
            operatingUnit: '—',
            employee: emp ? `${emp.firstName} ${emp.lastName}` : employeeId || '—',
            user: '—',
            status: String(r.status ?? ''),
            value: Number(r.value ?? 0),
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load full report')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [f.txnType, f.from, f.to, f.loc, storeById, orgById, empById])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const term = f.search.trim().toLowerCase()
      if (term && !`${r.txnNo} ${r.item} ${r.status}`.toLowerCase().includes(term)) return false
      if (f.status && r.status !== f.status) return false
      return true
    })
  }, [rows, f.search, f.status])

  const summary = useMemo(() => {
    const itemSet = new Set(filtered.map((r) => r.item))
    const locSet = new Set(filtered.flatMap((r) => [r.fromLocation, r.toLocation]).filter((x) => x !== '—'))
    return {
      txns: filtered.length,
      items: itemSet.size,
      locs: locSet.size,
      value: filtered.reduce((s, r) => s + r.value, 0),
    }
  }, [filtered])

  return (
    <FadeContent>
      <PageHeader
        title="Full Report"
        description="Every transaction across items, locations, organizations, operating units, employees, users and assets — one consolidated trail for management to track."
        actions={<Button variant="ghost">Export</Button>}
      />

      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading full report…</div>}

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
                {docTypeOpts.map((t) => (
                  <option key={t.code} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
                <option value="">All Status</option>
                {docStatusOpts.map((s) => (
                  <option key={s.code} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location">
              <Select value={f.loc} onChange={(e) => set('loc', e.target.value)}>
                <option value="">{seesAllLocations ? 'All Locations' : 'My Locations'}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} – {s.name}
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
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setF(emptyFilters)}>
              Clear
            </Button>
            <Button onClick={() => void reload()}>Apply</Button>
          </div>
        </CardBody>
      </Card>

      <div className="my-3 flex flex-wrap gap-6 text-[12.5px] text-[var(--text2)]">
        <div>
          Lines: <strong>{summary.txns}</strong>
        </div>
        <div>
          Items: <strong>{summary.items}</strong>
        </div>
        <div>
          Locations: <strong>{summary.locs}</strong>
        </div>
        <div>
          Value:{' '}
          <strong className="text-[var(--accent)]">
            ₹ {summary.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--surface2)]">
                {['Date', 'Type', 'Txn No', 'Item', 'Qty', 'From', 'To', 'Org', 'Employee', 'Status', 'Value'].map((h) => (
                  <th
                    key={h}
                    className="border-b-2 border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#f0f5ff]">
                  <td className="border-b border-[var(--border)] px-3 py-2">{r.date}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">
                    <DocTypeBadge type={r.txnType} />
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{r.txnNo}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">{r.item}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">{r.qty}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">{r.fromLocation}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">{r.toLocation}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">{r.organization}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">{r.employee}</td>
                  <td className="border-b border-[var(--border)] px-3 py-2">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-2 font-mono">
                    {r.value.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
