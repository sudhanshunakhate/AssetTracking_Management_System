import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { DocTypeBadge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchFullReport, fetchSerialOptionsForItem } from '@/api/transactions'
import { mapEmployee, mapEntity, mapLocation, mapDepartment, GEN_TYPE, useGenValues, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import type { FullReportRow } from '@/types/transactions'
import { txnDetailPath } from '@/features/transactions/txnDetailPath'
import { downloadCsv } from '@/lib/csvExport'
import { formatStockQty } from '@/features/transactions/lineGrid'
import { MasterItemSearchLookup } from '@/features/transactions/MasterSearchLookup'
import { ReportTableScroll, reportThClass } from './ReportTableScroll'
import { ItemJourneyStrip, type JourneyStep } from './ItemJourneyStrip'

const emptyFilters = {
  search: '',
  itemId: '',
  serialNo: '',
  status: '',
  loc: '',
  from: '',
  to: '',
}

/** Lifecycle phase for same-day tie-break: entry → inspection → later movements. */
function journeyPhase(txnType: string): number {
  switch ((txnType || '').trim().toUpperCase()) {
    case 'OPENING_STOCK':
      return 0
    case 'GRN':
      return 1
    case 'INSPECTION_APPROVAL':
      return 2
    case 'GATEPASS_INWARD':
      return 3
    case 'MATERIAL_TRANSFER':
      return 4
    case 'GATEPASS_OUTWARD':
      return 5
    case 'MATERIAL_REQUISITION':
      return 6
    case 'MATERIAL_ISSUE':
      return 7
    case 'MATERIAL_RETURN':
      return 8
    default:
      return 50
  }
}

export function FullReportPage() {
  const navigate = useNavigate()
  const { seesAllLocations } = useAuth()
  const [f, setF] = useState(emptyFilters)
  const set = (k: keyof typeof emptyFilters, v: string) => setF((prev) => ({ ...prev, [k]: v }))
  const [rows, setRows] = useState<FullReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [serialOptions, setSerialOptions] = useState<string[]>([])
  const [serialsLoading, setSerialsLoading] = useState(false)

  const mapLoc = useCallback(mapLocation, [])
  const mapEnt = useCallback(mapEntity, [])
  const mapEmp = useCallback(mapEmployee, [])
  const mapDept = useCallback(mapDepartment, [])

  useEffect(() => {
    void import('@/api/pageData/reportFiltersBundle').then((m) => m.ensureReportFiltersBundle())
  }, [])

  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: orgs } = useMasterList('entities', mapEnt)
  const { rows: employees } = useMasterList('employees', mapEmp)
  const { rows: departments } = useMasterList('departments', mapDept)
  const { options: docStatusOpts } = useGenValues(GEN_TYPE.DOC_STATUS)

  const storeById = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s])), [stores])
  const orgById = useMemo(() => Object.fromEntries(orgs.map((o) => [o.id, o])), [orgs])
  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees])
  const deptById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments])

  useEffect(() => {
    const itemId = Number(f.itemId)
    if (!Number.isFinite(itemId) || itemId <= 0) {
      setSerialOptions([])
      setSerialsLoading(false)
      return
    }
    let cancelled = false
    setSerialsLoading(true)
    const locId = f.loc ? Number(f.loc) : undefined
    void fetchSerialOptionsForItem(itemId, locId)
      .then((opts) => {
        if (!cancelled) setSerialOptions(opts)
      })
      .catch(() => {
        if (!cancelled) setSerialOptions([])
      })
      .finally(() => {
        if (!cancelled) setSerialsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [f.itemId, f.loc])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchFullReport({
        page: 1,
        pageSize: 200,
        fromDate: f.from || undefined,
        toDate: f.to || undefined,
        locationId: f.loc || undefined,
        itemId: f.itemId || undefined,
        serialNo: f.serialNo || undefined,
      })
      setRows(
        (page.data ?? []).map((r) => {
          const fromId = String(r.fromLocationId ?? '')
          const toId = String(r.toLocationId ?? '')
          const entityId = String(r.entityId ?? '')
          const employeeId = String(r.employeeId ?? '')
          const deptId = String(r.departmentId ?? '')
          const emp = empById[employeeId]
          const dept = deptById[deptId]
          return {
            id: String(r.id ?? `${r.txnNo}-${r.itemId}`),
            docId: String(r.docId ?? ''),
            date: String(r.date ?? ''),
            createdOn: String(r.createdOn ?? ''),
            txnType: String(r.txnType ?? ''),
            txnNo: String(r.txnNo ?? ''),
            itemId: r.itemId != null ? String(r.itemId) : '',
            item: String(r.item ?? r.itemId ?? ''),
            category: String(r.categoryId ?? '—'),
            qty: Number(r.qty ?? 0),
            uom: String(r.uomId ?? '—'),
            fromLocation: String(r.fromLocation ?? '').trim()
              || storeById[fromId]?.name
              || storeById[fromId]?.code
              || (fromId || '—'),
            toLocation: String(r.toLocation ?? '').trim()
              || storeById[toId]?.name
              || storeById[toId]?.code
              || (toId || '—'),
            organization: orgById[entityId]?.name ?? orgById[entityId]?.code ?? (entityId || '—'),
            operatingUnit: '—',
            department: dept ? String(dept.name ?? dept.code ?? '—') : '—',
            employee: emp ? `${emp.firstName} ${emp.lastName}` : employeeId || '—',
            user: '—',
            status: String(r.status ?? ''),
            value: Number(r.value ?? 0),
            serialNo: String(r.serialNo ?? '').trim(),
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load log report')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [f.from, f.to, f.loc, f.itemId, f.serialNo, storeById, orgById, empById, deptById])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const term = f.search.trim().toLowerCase()
      if (
        term &&
        !`${r.txnNo} ${r.item} ${r.status} ${r.department} ${r.fromLocation} ${r.toLocation} ${r.serialNo}`
          .toLowerCase()
          .includes(term)
      ) {
        return false
      }
      if (f.status && r.status !== f.status) return false
      return true
    })
  }, [rows, f.search, f.status])

  const journeyItemLabel = useMemo(() => {
    if (!f.itemId) return ''
    const hit = rows.find((r) => r.itemId === f.itemId && r.item)
    return hit?.item || f.itemId
  }, [rows, f.itemId])

  const journeySteps = useMemo((): JourneyStep[] => {
    if (!f.itemId) return []
    const serial = f.serialNo.trim().toLowerCase()
    const matched = rows
      .filter((r) => {
        if (r.itemId !== f.itemId) return false
        if (serial && r.serialNo.trim().toLowerCase() !== serial) return false
        return true
      })
      .slice()
      .sort((a, b) => {
        // Log fill order: when created → doc date → doc id → lifecycle phase (GRN → Inspection → …)
        const byCreated = String(a.createdOn || '').localeCompare(String(b.createdOn || ''))
        if (byCreated !== 0) return byCreated
        const byDate = String(a.date).localeCompare(String(b.date))
        if (byDate !== 0) return byDate
        const aDoc = Number(a.docId) || 0
        const bDoc = Number(b.docId) || 0
        if (aDoc !== bDoc) return aDoc - bDoc
        const byPhase = journeyPhase(a.txnType) - journeyPhase(b.txnType)
        if (byPhase !== 0) return byPhase
        return String(a.id).localeCompare(String(b.id))
      })

    // One step per document (same txn can appear as multiple line variants).
    const seen = new Set<string>()
    const steps: JourneyStep[] = []
    for (const r of matched) {
      const key = `${r.txnType}|${r.docId}|${r.txnNo}`
      if (seen.has(key)) continue
      seen.add(key)
      steps.push({
        id: r.id,
        docId: r.docId,
        date: r.date,
        txnType: r.txnType,
        txnNo: r.txnNo,
        status: r.status,
        fromLocation: r.fromLocation,
        toLocation: r.toLocation,
      })
    }
    return steps
  }, [rows, f.itemId, f.serialNo])

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

  const clearFilters = () => {
    setF(emptyFilters)
    setSerialOptions([])
  }

  return (
    <FadeContent>
      <PageHeader
        title="Log Report"
        description="Transaction log across items, locations, organizations, employees and assets — including gatepass from/to store and vendor / party."
        actions={
          <Button
            variant="ghost"
            disabled={filtered.length === 0}
            onClick={() =>
              downloadCsv(
                `log-report-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  'Date',
                  'Txn Type',
                  'Txn No',
                  'Item',
                  'Serial No.',
                  'Category',
                  'Qty',
                  'UOM',
                  'From',
                  'To',
                  'Organization',
                  'Department',
                  'Employee',
                  'Status',
                  'Amount',
                ],
                filtered.map((r) => [
                  r.date,
                  r.txnType,
                  r.txnNo,
                  r.item,
                  r.serialNo,
                  r.category,
                  formatStockQty(r.qty),
                  r.uom,
                  r.fromLocation,
                  r.toLocation,
                  r.organization,
                  r.department,
                  r.employee,
                  r.status,
                  r.value,
                ]),
              )
            }
          >
            Export
          </Button>
        }
      />

      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading log report…</div>}

      <Card className="overflow-visible">
        <CardHeader title="Filters" subtitle="Narrow the report down to exactly what you need to see" />
        <CardBody className="overflow-visible">
          <div className="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Search">
              <Input
                value={f.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder="Txn no., remarks…"
              />
            </Field>
            <Field label="Item" className="relative z-40">
              <MasterItemSearchLookup
                value={f.itemId}
                onChange={(v) => {
                  setF((prev) => ({ ...prev, itemId: v, serialNo: '' }))
                }}
                placeholder="All Items"
                allowClear
              />
            </Field>
            <Field label="Serial No." className="relative z-10">
              <Select
                value={f.serialNo}
                disabled={!f.itemId || serialsLoading}
                onChange={(e) => set('serialNo', e.target.value)}
              >
                <option value="">
                  {!f.itemId
                    ? 'Select an item first'
                    : serialsLoading
                      ? 'Loading serials…'
                      : serialOptions.length === 0
                        ? 'No serials found'
                        : 'All Serials'}
                </option>
                {serialOptions.map((sn) => (
                  <option key={sn} value={sn}>
                    {sn}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" className="relative z-10">
              <Select value={f.status} onChange={(e) => set('status', e.target.value)}>
                <option value="">All Status</option>
                {docStatusOpts.map((s) => (
                  <option key={s.code} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location" className="relative z-10">
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
            <Button variant="ghost" onClick={clearFilters}>
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
          Amount:{' '}
          <strong className="text-[var(--accent)]">
            ₹ {summary.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      {f.itemId && (
        <ItemJourneyStrip
          itemLabel={journeyItemLabel}
          serialNo={f.serialNo || undefined}
          steps={journeySteps}
          onOpenDoc={(docId, txnType) => {
            const path = txnDetailPath(txnType, docId)
            if (path) navigate(path)
          }}
        />
      )}

      <Card className="overflow-visible">
        <CardBody className="p-0">
          <ReportTableScroll className="px-0">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {['Date', 'Type', 'Txn No', 'Item', 'Serial No.', 'Qty', 'From', 'To', 'Org', 'Dept', 'Employee', 'Status', 'Amount'].map((h) => (
                    <th key={h} className={`${reportThClass} px-3 py-2`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            <tbody>
              {filtered.map((r) => {
                const detailPath = txnDetailPath(r.txnType, r.docId)
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
                    <td className="border-b border-[var(--border)] px-3 py-2">{r.date}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">
                      <DocTypeBadge type={r.txnType} />
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{r.txnNo}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">{r.item}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{r.serialNo || '—'}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">{formatStockQty(r.qty)}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">{r.fromLocation}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">{r.toLocation}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">{r.organization}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2" title={r.department}>
                      {r.department}
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2">{r.employee}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2 font-mono">
                      {r.value.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </ReportTableScroll>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
