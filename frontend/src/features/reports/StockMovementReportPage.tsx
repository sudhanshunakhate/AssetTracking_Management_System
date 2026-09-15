import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockMovement } from '@/api/transactions'
import { mapLocation, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import {
  MasterEmployeeSearchLookup,
  MasterItemSearchLookup,
} from '@/features/transactions/MasterSearchLookup'
import { txnDetailPath } from '@/features/transactions/txnDetailPath'
import { downloadCsv } from '@/lib/csvExport'

type MovementRow = {
  id: string
  docId: string
  docType: string
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
  serialNo: '',
  itemId: '',
  employeeId: '',
  loc: '',
  from: '',
  to: '',
}

const dash = (v: string) => (v.trim() ? v : '—')

export function StockMovementReportPage() {
  const navigate = useNavigate()
  const { seesAllLocations } = useAuth()
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setDraft((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<MovementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapLoc = useCallback(mapLocation, [])

  useEffect(() => {
    void import('@/api/pageData/reportFiltersBundle').then((m) => m.ensureReportFiltersBundle())
  }, [])

  const { rows: stores } = useMasterList('locations', mapLoc)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchStockMovement({
        page: 1,
        pageSize: 200,
        search: applied.search || undefined,
        serialNo: applied.serialNo || undefined,
        itemId: applied.itemId || undefined,
        employeeId: applied.employeeId || undefined,
        locationId: applied.loc || undefined,
        fromDate: applied.from || undefined,
        toDate: applied.to || undefined,
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
            docId: String(r.docId ?? ''),
            docType: String(r.docType ?? '').trim(),
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
  }, [applied])

  useEffect(() => {
    void reload()
  }, [reload])

  const applyFilters = () => setApplied({ ...draft })

  const clearFilters = () => {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
  }

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
        description="Track asset movements across locations and custodians. Pick filters below and click Apply — changes are not loaded until you apply them."
        actions={
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
        }
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading asset movements…</div>}

      <Card className="mb-3">
        <CardHeader title="Filters" subtitle="Narrow by date range, serial no., asset, owner, or location" />
        <CardBody>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
            <Field label="From Date">
              <Input type="date" value={draft.from} onChange={(e) => set('from', e.target.value)} />
            </Field>
            <Field label="To Date">
              <Input type="date" value={draft.to} onChange={(e) => set('to', e.target.value)} />
            </Field>
            <Field label="Serial No.">
              <Input
                value={draft.serialNo}
                onChange={(e) => set('serialNo', e.target.value)}
                placeholder="Track serial…"
              />
            </Field>
            <Field label="Item">
              <MasterItemSearchLookup
                value={draft.itemId}
                onChange={(v) => set('itemId', v)}
                placeholder="All Assets"
              />
            </Field>
            <Field label="Owner">
              <MasterEmployeeSearchLookup
                value={draft.employeeId}
                onChange={(v) => set('employeeId', v)}
                placeholder="All Owners"
              />
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
            <Field label="Search">
              <Input
                value={draft.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Asset / document…"
              />
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
                {rows.map((r) => {
                  const detailPath = txnDetailPath(r.docType, r.docId)
                  const rowClass = detailPath
                    ? 'cursor-pointer hover:bg-[#f0f5ff]'
                    : 'hover:bg-[#f0f5ff]'
                  return (
                    <tr
                      key={r.id}
                      className={rowClass}
                      onClick={() => {
                        if (detailPath) navigate(detailPath)
                      }}
                    >
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
                  )
                })}
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
