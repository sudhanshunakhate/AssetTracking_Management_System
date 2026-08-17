import { useCallback, useEffect, useMemo, useState } from 'react'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockMovement } from '@/api/transactions'
import { mapEmployee, mapItem, mapLocation, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { downloadCsv } from '@/lib/csvExport'

type MovementRow = {
  id: string
  date: string
  assetId: string
  assetName: string
  fromLocation: string
  toLocation: string
  fromDept: string
  toDept: string
  custodian: string
  movementType: string
  reason: string
  document: string
}

const emptyFilters = {
  search: '',
  itemId: '',
  employeeId: '',
  loc: '',
  from: '',
  to: '',
}

const dash = (v: string) => (v.trim() ? v : '—')

export function StockMovementReportPage() {
  const { seesAllLocations } = useAuth()
  const [f, setF] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setF((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<MovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapLoc = useCallback(mapLocation, [])
  const mapItm = useCallback(mapItem, [])
  const mapEmp = useCallback(mapEmployee, [])
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: items } = useMasterList('items', mapItm)
  const { rows: employees } = useMasterList('employees', mapEmp)

  const assetItems = useMemo(
    () => items.filter((i) => (i.itemType === 'consumable' ? false : true)),
    [items],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchStockMovement({
        page: 1,
        pageSize: 200,
        search: f.search || undefined,
        itemId: f.itemId || undefined,
        employeeId: f.employeeId || undefined,
        locationId: f.loc || undefined,
        fromDate: f.from || undefined,
        toDate: f.to || undefined,
      })
      setRows(
        (page.data ?? []).map((r) => {
          const assetId = String(r.assetId ?? r.serialNo ?? r.itemCode ?? '').trim()
          const assetName = String(r.assetName ?? r.itemName ?? '').trim()
          const fromLocation = String(r.fromLocation ?? r.fromStore ?? '').trim()
          const toLocation = String(r.toLocation ?? r.toStore ?? '').trim()
          const custodian = String(r.custodian ?? r.employee ?? '').trim()
          const movementType = String(r.movementType ?? r.docType ?? '').trim()
          const document = String(r.document ?? r.docNo ?? '').trim()
          return {
            id: String(r.id ?? `${document}-${assetId}`),
            date: String(r.date ?? ''),
            assetId: assetId || '—',
            assetName: assetName || '—',
            fromLocation: dash(fromLocation),
            toLocation: dash(toLocation),
            fromDept: dash(String(r.fromDept ?? '')),
            toDept: dash(String(r.toDept ?? '')),
            custodian: dash(custodian),
            movementType: movementType || '—',
            reason: dash(String(r.reason ?? '')),
            document: document || '—',
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load asset movement register')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [f])

  useEffect(() => {
    void reload()
  }, [reload])

  const headers = [
    'Date',
    'Asset ID',
    'Asset Name',
    'From Location',
    'To Location',
    'From Dept.',
    'To Dept.',
    'Custodian',
    'Movement Type',
    'Reason',
    'Document',
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Asset Movement Register"
        description="Track asset movements across locations and custodians. Filter by date range, item and owner."
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
                  `asset-movement-register-${new Date().toISOString().slice(0, 10)}.csv`,
                  headers,
                  rows.map((r) => [
                    r.date,
                    r.assetId,
                    r.assetName,
                    r.fromLocation,
                    r.toLocation,
                    r.fromDept,
                    r.toDept,
                    r.custodian,
                    r.movementType,
                    r.reason,
                    r.document,
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
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading asset movements…</div>}

      <Card className="mb-3">
        <CardBody>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
            <Field label="From Date">
              <Input type="date" value={f.from} onChange={(e) => set('from', e.target.value)} />
            </Field>
            <Field label="To Date">
              <Input type="date" value={f.to} onChange={(e) => set('to', e.target.value)} />
            </Field>
            <Field label="Item">
              <Select value={f.itemId} onChange={(e) => set('itemId', e.target.value)}>
                <option value="">All Assets</option>
                {assetItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} – {i.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owner">
              <Select value={f.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
                <option value="">All Owners</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} – {e.firstName} {e.lastName}
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
            <Field label="Search">
              <Input
                value={f.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Asset / document…"
              />
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
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.assetId}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.assetName}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.fromLocation}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.toLocation}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.fromDept}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.toDept}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.custodian}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.movementType}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.reason}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.document}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-[11px] py-8 text-center text-[var(--text3)]">
                      No asset movements for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-7 border-t border-[var(--border)] pt-3 text-[12.5px] text-[var(--text2)]">
            <div>
              Movements: <strong>{rows.length}</strong>
            </div>
          </div>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
