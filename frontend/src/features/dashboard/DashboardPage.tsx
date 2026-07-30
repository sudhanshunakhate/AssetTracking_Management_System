import { useEffect, useState } from 'react'
import { AnimatedContent, CountUp, FadeContent, SpotlightCard } from '@/components/react-bits'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchDashboardSummary, type DashboardSummary } from '@/api/transactions'

const emptySummary: DashboardSummary = {
  totalItems: 0,
  totalVendors: 0,
  totalTransactions: 0,
  lowStockCount: 0,
  stockRows: 0,
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchDashboardSummary()
        if (!cancelled) setSummary(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
          setSummary(emptySummary)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const kpis = [
    { id: 'items', label: 'Total Items', value: summary.totalItems, hint: 'Active item master rows' },
    { id: 'vendors', label: 'Vendors', value: summary.totalVendors, hint: 'Registered parties' },
    { id: 'txns', label: 'Transactions', value: summary.totalTransactions, hint: 'All document headers' },
    { id: 'low', label: 'Low Stock', value: summary.lowStockCount, hint: 'At or below reorder' },
    { id: 'stock', label: 'Stock Rows', value: summary.stockRows, hint: 'inv_stock_mst rows' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live snapshot of assets, inventory, stores and system activity."
      />
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading dashboard…</div>}

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        {kpis.map((kpi, i) => (
          <AnimatedContent key={kpi.id} delay={i * 0.06}>
            <SpotlightCard>
              <div className="p-4">
                <div className="text-[11px] font-semibold tracking-[0.3px] text-[var(--text3)] uppercase">
                  {kpi.label}
                </div>
                <div className="mt-1 text-[26px] font-bold tracking-tight text-[var(--text)]">
                  <CountUp to={kpi.value} duration={1.4} />
                </div>
                <div className="mt-1 text-[11px] text-[var(--text2)]">{kpi.hint}</div>
              </div>
            </SpotlightCard>
          </AnimatedContent>
        ))}
      </div>

      <FadeContent delay={0.1}>
        <Card>
          <CardHeader
            title="System snapshot"
            subtitle="Detailed category / activity panels will fill as masters and transactions are posted"
          />
          <CardBody>
            <p className="text-[13px] text-[var(--text2)]">
              KPI cards above are live from <code className="font-mono text-[12px]">GET /dashboard/summary</code>.
              Add items, vendors, locations and post opening stock / GRN / issues to grow these counts.
            </p>
          </CardBody>
        </Card>
      </FadeContent>
    </div>
  )
}
