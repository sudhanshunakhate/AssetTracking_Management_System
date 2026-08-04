import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatedContent, CountUp, FadeContent, SpotlightCard } from '@/components/react-bits'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchDashboardSummary, type DashboardSummary } from '@/api/transactions'

const emptySummary: DashboardSummary = {
  totalItems: 0,
  totalVendors: 0,
  totalTransactions: 0,
  lowStockCount: 0,
  stockRows: 0,
}

type KpiTone = 'sky' | 'blue' | 'warm' | 'danger'

const TONE: Record<
  KpiTone,
  { color: string; soft: string; ring: string; glow: string }
> = {
  sky: {
    color: 'var(--accent)',
    soft: 'var(--accent-lt)',
    ring: 'rgba(14, 165, 233, 0.35)',
    glow: 'rgba(14, 165, 233, 0.28)',
  },
  blue: {
    color: 'var(--accent-deep)',
    soft: '#eef2ff',
    ring: 'rgba(3, 105, 161, 0.3)',
    glow: 'rgba(37, 99, 235, 0.22)',
  },
  warm: {
    color: 'var(--warm)',
    soft: 'var(--warm-lt)',
    ring: 'rgba(234, 88, 12, 0.35)',
    glow: 'rgba(249, 115, 22, 0.3)',
  },
  danger: {
    color: 'var(--danger)',
    soft: 'var(--danger-lt)',
    ring: 'rgba(220, 38, 38, 0.4)',
    glow: 'rgba(220, 38, 38, 0.28)',
  },
}

function KpiIcon({
  name,
  tone,
  motion,
}: {
  name: IconName
  tone: KpiTone
  motion: 'float' | 'pulse' | 'spin-soft' | 'bounce' | 'blink'
}) {
  const t = TONE[tone]
  return (
    <div
      className={`kpi-icon kpi-icon--${motion}`}
      style={
        {
          '--kpi-color': t.color,
          '--kpi-soft': t.soft,
          '--kpi-ring': t.ring,
          '--kpi-glow': t.glow,
        } as CSSProperties
      }
    >
      <span className="kpi-icon__ring" aria-hidden />
      <span className="kpi-icon__core">
        <Icon name={name} size={22} />
      </span>
    </div>
  )
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

  const kpis: {
    id: string
    label: string
    value: number
    hint: string
    icon: IconName
    tone: KpiTone
    motion: 'float' | 'pulse' | 'spin-soft' | 'bounce' | 'blink'
  }[] = [
    {
      id: 'items',
      label: 'Total Items',
      value: summary.totalItems,
      hint: 'Active item master rows',
      icon: 'itemMaster',
      tone: 'sky',
      motion: 'float',
    },
    {
      id: 'vendors',
      label: 'Vendors',
      value: summary.totalVendors,
      hint: 'Registered parties',
      icon: 'vendorParty',
      tone: 'blue',
      motion: 'pulse',
    },
    {
      id: 'txns',
      label: 'Transactions',
      value: summary.totalTransactions,
      hint: 'All document headers',
      icon: 'materialTransfer',
      tone: 'warm',
      motion: 'spin-soft',
    },
    {
      id: 'low',
      label: 'Low Stock',
      value: summary.lowStockCount,
      hint: 'At or below reorder',
      icon: 'lowStockAlert',
      tone: 'danger',
      motion: 'blink',
    },
    {
      id: 'stock',
      label: 'Stock Rows',
      value: summary.stockRows,
      hint: 'inv_stock_mst rows',
      icon: 'storeWiseStock',
      tone: 'sky',
      motion: 'bounce',
    },
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
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] font-semibold tracking-[0.3px] text-[var(--text3)] uppercase">
                    {kpi.label}
                  </div>
                  <KpiIcon name={kpi.icon} tone={kpi.tone} motion={kpi.motion} />
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
