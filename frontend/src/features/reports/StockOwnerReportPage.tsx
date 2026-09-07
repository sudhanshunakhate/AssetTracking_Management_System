import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Pill, StatusBadge, StatusPill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchStockOwner } from '@/api/transactions'
import { mapCategory, mapEmployee, mapLocation, mapUnit, useMasterList } from '@/api/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { txnDetailPath } from '@/features/transactions/txnDetailPath'
import { downloadCsv } from '@/lib/csvExport'
import { formatStockQty } from '@/features/transactions/lineGrid'

type OwnerRow = {
  id: string
  store: string
  storeName: string
  storeManager: string
  itemCode: string
  itemName: string
  category: string
  uom: string
  currentQty: number
  availableQty: number
  reservedQty: number
  value: number
  custodyMode: string
  custodian: string
  custodianDept: string
  lastIssueDocNo: string
  lastIssueDocId: string
  lastIssueDate: string
  status: string
  serialNo: string
}

const CUSTODY_LABEL: Record<string, string> = {
  IN_STORE: 'In Store',
  ASSIGNED: 'Assigned',
  ISSUED_TO: 'Issued To',
}

export function StockOwnerReportPage() {
  const navigate = useNavigate()
  const { seesAllLocations } = useAuth()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [store, setStore] = useState('')
  const [employee, setEmployee] = useState('')
  const [custody, setCustody] = useState('')
  const [serialNo, setSerialNo] = useState('')
  const [rows, setRows] = useState<OwnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapCat = useCallback(mapCategory, [])
  const mapLoc = useCallback(mapLocation, [])
  const mapUnt = useCallback(mapUnit, [])
  const mapEmp = useCallback(mapEmployee, [])
  const { rows: categories } = useMasterList('categories', mapCat)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { rows: units } = useMasterList('units', mapUnt)
  const { rows: employees } = useMasterList('employees', mapEmp)

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const uomById = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await fetchStockOwner({
        page: 1,
        pageSize: 200,
        search: q || undefined,
        categoryId: cat || undefined,
        locationId: store || undefined,
        employeeId: employee || undefined,
        custody: custody || undefined,
        serialNo: serialNo || undefined,
      })
      setRows(
        (page.data ?? []).map((r) => {
          const categoryId = String(r.categoryId ?? '')
          const uomId = String(r.uomId ?? '')
          return {
            id: String(r.id ?? `${r.itemId}-${r.locationId}`),
            store: String(r.storeName ?? r.storeCode ?? r.locationId ?? '—'),
            storeName: String(r.storeName ?? r.storeCode ?? '—'),
            storeManager: String(r.storeManager ?? '—'),
            itemCode: String(r.itemCode ?? ''),
            itemName: String(r.itemName ?? ''),
            category: catById[categoryId]?.name ?? (categoryId || '—'),
            uom: uomById[uomId]?.code ?? (uomId || '—'),
            currentQty: Number(r.currentQty ?? 0),
            availableQty: Number(r.availableQty ?? 0),
            reservedQty: Number(r.reservedQty ?? 0),
            value: Number(r.value ?? 0),
            custodyMode: String(r.custodyMode ?? 'IN_STORE'),
            custodian: String(r.custodian ?? '—'),
            custodianDept: String(r.custodianDept ?? '—'),
            lastIssueDocNo: String(r.lastIssueDocNo ?? '—'),
            lastIssueDocId: String(r.lastIssueDocId ?? ''),
            lastIssueDate: String(r.lastIssueDate ?? '—'),
            status: String(r.status ?? ''),
            serialNo: String(r.batchLotNo ?? r.serialNo ?? '').trim(),
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock owner report')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [q, cat, store, employee, custody, serialNo, catById, uomById])

  useEffect(() => {
    void reload()
  }, [reload])

  const totals = useMemo(
    () => ({
      rows: rows.length,
      stores: new Set(rows.map((r) => r.store)).size,
      qty: rows.reduce((s, r) => s + r.currentQty, 0),
      value: rows.reduce((s, r) => s + r.value, 0),
    }),
    [rows],
  )

  return (
    <FadeContent>
      <PageHeader
        title="Stock Owner Report"
        description="Store-wise ownership of current stock, with employee custody (assigned / last issued-to) detail."
        actions={
          <Button
            variant="ghost"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv(
                `stock-owner-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  'Store',
                  'Store Name',
                  'Manager',
                  'Item Code',
                  'Item Name',
                  'Serial No.',
                  'Category',
                  'Qty',
                  'Available',
                  'Value',
                  'Custody',
                  'Custodian',
                  'Dept',
                  'Last Issue',
                  'Last Issue Date',
                  'Status',
                ],
                rows.map((r) => [
                  r.store,
                  r.storeName,
                  r.storeManager,
                  r.itemCode,
                  r.itemName,
                  r.serialNo,
                  r.category,
                  formatStockQty(r.currentQty),
                  formatStockQty(r.availableQty),
                  r.value,
                  CUSTODY_LABEL[r.custodyMode] ?? r.custodyMode,
                  r.custodian,
                  r.custodianDept,
                  r.lastIssueDocNo,
                  r.lastIssueDate,
                  r.status,
                ]),
              )
            }
          >
            Export
          </Button>
        }
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading stock owner report…</div>}
      <Card>
        <CardBody>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search item code / name…"
              className="min-w-[180px] flex-1 rounded-[7px] border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--accent)]"
            />
            <input
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="Serial no…"
              className="min-w-[140px] rounded-[7px] border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--accent)]"
            />
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">{seesAllLocations ? 'All Stores' : 'My Stores'}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
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
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {String(e.firstName ?? '')} {String(e.lastName ?? '')}
                </option>
              ))}
            </select>
            <select
              value={custody}
              onChange={(e) => setCustody(e.target.value)}
              className="rounded-[7px] border border-[var(--border2)] px-2.5 py-1.5 text-xs text-[var(--text2)]"
            >
              <option value="">All Custody</option>
              <option value="IN_STORE">In Store</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ISSUED_TO">Issued To</option>
            </select>
            <Button
              variant="ghost"
              onClick={() => {
                setQ('')
                setCat('')
                setStore('')
                setEmployee('')
                setCustody('')
                setSerialNo('')
              }}
            >
              Clear
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  {[
                    'Store',
                    'Store Name',
                    'Manager',
                    'Item Code',
                    'Item Name',
                    'Serial No.',
                    'Category',
                    'Qty',
                    'Available',
                    'Value (₹)',
                    'Custody',
                    'Custodian',
                    'Dept',
                    'Last Issue',
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
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold text-[var(--accent-deep)]">
                      {r.store}
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.storeName}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.storeManager}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.itemCode}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.itemName}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">{r.serialNo || '—'}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.category}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-semibold">{formatStockQty(r.currentQty)}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{formatStockQty(r.availableQty)}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5 font-mono">
                      {r.value.toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      <Pill
                        tone={
                          r.custodyMode === 'ISSUED_TO'
                            ? 'amber'
                            : r.custodyMode === 'ASSIGNED'
                              ? 'violet'
                              : 'sky'
                        }
                      >
                        {CUSTODY_LABEL[r.custodyMode] ?? r.custodyMode}
                      </Pill>
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.custodian}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">{r.custodianDept}</td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      {r.lastIssueDocNo !== '—' ? (
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => {
                            const path = txnDetailPath('MATERIAL_ISSUE', r.lastIssueDocId)
                            if (path) navigate(path)
                          }}
                        >
                          <span className="font-mono">{r.lastIssueDocNo}</span>
                          <span className="text-[var(--text3)]"> · {r.lastIssueDate}</span>
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="border-b border-[var(--border)] px-[11px] py-1.5">
                      {r.status === 'In Stock' ? (
                        <StatusBadge status="Active" />
                      ) : (
                        <StatusPill status={r.status} />
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-[11px] py-8 text-center text-[var(--text3)]">
                      No stock ownership rows for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-7 border-t border-[var(--border)] pt-3 text-[12.5px] text-[var(--text2)]">
            <div>
              Rows: <strong>{totals.rows}</strong>
            </div>
            <div>
              Stores: <strong>{totals.stores}</strong>
            </div>
            <div>
              Total Qty: <strong>{formatStockQty(totals.qty)}</strong>
            </div>
            <div className="font-bold text-[var(--text)]">
              Stock Value:{' '}
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
