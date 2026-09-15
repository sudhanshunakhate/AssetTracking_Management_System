import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatedContent, CountUp, FadeContent, SpotlightCard } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  fetchDashboardHome,
  invalidateDashboardSummary,
  type DashboardHome,
  type DashboardWidget,
} from '@/api/transactions'
import { formatStockQty } from '@/features/transactions/lineGrid'

type KpiTone = 'sky' | 'blue' | 'warm' | 'danger' | 'success'

const TONE: Record<KpiTone, { color: string; soft: string; ring: string; glow: string }> = {
  sky: { color: 'var(--accent)', soft: 'var(--accent-lt)', ring: 'rgba(14,165,233,0.35)', glow: 'rgba(14,165,233,0.28)' },
  blue: { color: 'var(--accent-deep)', soft: '#eef2ff', ring: 'rgba(3,105,161,0.3)', glow: 'rgba(37,99,235,0.22)' },
  warm: { color: 'var(--warm)', soft: 'var(--warm-lt)', ring: 'rgba(234,88,12,0.35)', glow: 'rgba(249,115,22,0.3)' },
  danger: { color: 'var(--danger)', soft: 'var(--danger-lt)', ring: 'rgba(220,38,38,0.4)', glow: 'rgba(220,38,38,0.28)' },
  success: { color: 'var(--success)', soft: 'var(--success-lt)', ring: 'rgba(5,150,105,0.35)', glow: 'rgba(5,150,105,0.22)' },
}

const CHART_COLORS = ['var(--accent)', 'var(--warm)', 'var(--accent-deep)', 'var(--success)', '#8b5cf6', '#14b8a6', '#f59e0b', '#64748b']

const DOC_LABEL: Record<string, string> = {
  OPENING_STOCK: 'Opening Stock',
  MATERIAL_REQUISITION: 'Store Requisition',
  GRN: 'GRN',
  GATEPASS_INWARD: 'GP Inward',
  GATEPASS_OUTWARD: 'GP Outward',
  MATERIAL_ISSUE: 'Store Issue',
  MATERIAL_TRANSFER: 'Transfer',
  MATERIAL_RETURN: 'Return',
  INSPECTION_APPROVAL: 'Inspection',
}

function asTone(v?: string): KpiTone {
  if (v === 'blue' || v === 'warm' || v === 'danger' || v === 'success' || v === 'sky') return v
  return 'sky'
}

function asIcon(v?: string): IconName {
  return (v as IconName) || 'dashboard'
}

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function colClass(span: number) {
  if (span >= 12) return 'col-span-12'
  if (span >= 7) return 'col-span-12 xl:col-span-7'
  if (span >= 6) return 'col-span-12 lg:col-span-6'
  if (span >= 5) return 'col-span-12 xl:col-span-5'
  if (span >= 4) return 'col-span-12 lg:col-span-4'
  return 'col-span-12 sm:col-span-6 lg:col-span-3 xl:col-span-2'
}

function KpiIcon({ name, tone }: { name: IconName; tone: KpiTone }) {
  const t = TONE[tone]
  return (
    <div
      className="kpi-icon kpi-icon--float"
      style={{ '--kpi-color': t.color, '--kpi-soft': t.soft, '--kpi-ring': t.ring, '--kpi-glow': t.glow } as CSSProperties}
    >
      <span className="kpi-icon__ring" aria-hidden />
      <span className="kpi-icon__core">
        <Icon name={name} size={22} />
      </span>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-[88px] items-center justify-center rounded-xl border border-dashed border-[var(--border2)] bg-[var(--surface2)] px-4 text-center text-[12.5px] text-[var(--text3)]">
      {message}
    </div>
  )
}

function RankedBars({ series }: { series: { label: string; value: number }[] }) {
  if (!series.length) return <EmptyChart message="No stock positions yet." />
  const max = Math.max(...series.map((s) => s.value), 1)
  const total = series.reduce((a, b) => a + b.value, 0)
  return (
    <ul className="m-0 list-none space-y-2.5 p-0">
      {series.map((d, i) => {
        const color = CHART_COLORS[i % CHART_COLORS.length]
        const pct = Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)
        const share = total ? Math.round((d.value / total) * 100) : 0
        return (
          <li key={d.label} className="rounded-xl px-2.5 py-2 hover:bg-[var(--surface2)]">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                  {i + 1}
                </span>
                <span className="truncate text-[12.5px] font-semibold text-[var(--text)]">{d.label}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-mono text-[13px] font-bold text-[var(--text)]">{d.value}</span>
                <span className="ml-1.5 text-[10.5px] text-[var(--text3)]">{share}%</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)] ring-1 ring-[var(--border)]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function DocMix({ series }: { series: { label: string; value: number }[] }) {
  const total = series.reduce((a, b) => a + b.value, 0)
  if (!total) return <EmptyChart message="No transactions yet." />
  const rows = series.map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length], pct: Math.round((d.value / total) * 100) }))
  return (
    <div className="space-y-3">
      <div className="text-[22px] font-bold text-[var(--text)]">{total}</div>
      <div className="text-[11px] text-[var(--text3)]">unique documents</div>
      <div className="flex h-3.5 overflow-hidden rounded-full ring-1 ring-[var(--border)]">
        {rows.map((r) => (
          <div key={r.label} title={`${r.label}: ${r.value}`} style={{ width: `${(r.value / total) * 100}%`, background: r.color }} />
        ))}
      </div>
      <ul className="m-0 max-h-[220px] list-none space-y-1 overflow-y-auto p-0">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-[var(--surface2)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[var(--text)]">{r.label}</span>
            <span className="font-mono text-[12px] font-bold">{r.value}</span>
            <span className="w-10 text-right text-[11px] text-[var(--text3)]">{r.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HealthBar({ inStock, low, out }: { inStock: number; low: number; out: number }) {
  const total = inStock + low + out
  if (!total) return <EmptyChart message="No stock rows to score health." />
  const parts = [
    { label: 'OK', value: inStock, color: 'var(--success)' },
    { label: 'Low', value: low, color: 'var(--warning)' },
    { label: 'Out', value: out, color: 'var(--danger)' },
  ]
  return (
    <div className="space-y-3.5">
      <div className="text-[28px] font-bold text-[var(--text)]">{total}</div>
      <div className="text-[11.5px] text-[var(--text2)]">positions tracked</div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[var(--bg)] ring-1 ring-[var(--border)]">
        {parts.map((p) =>
          p.value > 0 ? (
            <div key={p.label} className="h-full" style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
          ) : null,
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.label} className="rounded-xl border border-[var(--border)] px-2 py-2.5 text-center">
            <div className="text-[20px] font-bold">{p.value}</div>
            <div className="text-[10px] font-semibold uppercase text-[var(--text3)]">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StockList({ rows }: { rows: { id: string | number; itemCode?: string; itemName: string; store: string; closing: number; status: string }[] }) {
  if (!rows.length) return <div className="py-6 text-center text-[12.5px] text-[var(--text3)]">No stock rows yet.</div>
  const max = Math.max(...rows.map((r) => r.closing), 0)
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {rows.map((r, i) => {
        const pct = max > 0 ? Math.max((r.closing / max) * 100, r.closing > 0 ? 4 : 0) : 0
        const isOut = r.closing <= 0 || /out/i.test(r.status)
        return (
          <li key={r.id} className="rounded-xl border border-[var(--border)] px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-lt)] text-[10px] font-bold text-[var(--accent)]">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold">
                      {r.itemCode ? `${r.itemCode} - ${r.itemName}` : r.itemName}
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-[var(--text3)]">{r.store}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-[14px] font-bold ${isOut ? 'text-[var(--danger)]' : ''}`}>{r.closing}</div>
                    <div className="text-[9.5px] font-semibold uppercase text-[var(--text3)]">{r.status}</div>
                  </div>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className={`h-full rounded-full ${isOut ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ActivityList({ rows }: { rows: { id: string | number; txnType: string; txnNo: string; item: string; date: string; qty: number; status: string }[] }) {
  if (!rows.length) {
    return <div className="px-1 py-6 text-center text-[12.5px] text-[var(--text3)]">No recent transactions.</div>
  }
  return (
    <ul className="m-0 list-none divide-y divide-[var(--border)] p-0">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 px-3.5 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-x-2">
              <span className="text-[12px] font-semibold">{DOC_LABEL[r.txnType] ?? r.txnType}</span>
              <span className="font-mono text-[11px] text-[var(--accent-deep)]">{r.txnNo}</span>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-[var(--text3)]">
              {r.item}
              {r.date ? ` · ${r.date}` : ''}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[12.5px] font-bold">{formatStockQty(r.qty)}</div>
            <div className="text-[10px] text-[var(--text3)]">{r.status}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function WidgetCard({ widget, index }: { widget: DashboardWidget; index: number }) {
  const navigate = useNavigate()
  const data = widget.data ?? {}

  if (widget.type === 'ALERT') {
    return (
      <FadeContent className={colClass(widget.colSpan)}>
        <button
          type="button"
          onClick={() => widget.linkPath && navigate(widget.linkPath)}
          className="mb-0 flex w-full items-center gap-3 rounded-xl border border-[var(--warm-mid)] bg-[var(--warm-lt)] px-3.5 py-2.5 text-left"
        >
          <Icon name={asIcon(widget.icon)} size={18} className="text-[var(--warm)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-bold text-[var(--warm-deep)]">{String(data.message ?? widget.title)}</div>
            <div className="text-[11px] text-[var(--text2)]">{widget.subtitle}</div>
          </div>
          <span className="text-[11px] font-semibold text-[var(--warm)]">View →</span>
        </button>
      </FadeContent>
    )
  }

  if (widget.type === 'KPI') {
    return (
      <AnimatedContent delay={index * 0.04} className={colClass(widget.colSpan)}>
        <button type="button" className="w-full text-left" onClick={() => widget.linkPath && navigate(widget.linkPath)}>
          <SpotlightCard>
            <div className="p-4 transition hover:bg-[var(--surface2)]/60">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] font-semibold tracking-[0.3px] text-[var(--text3)] uppercase">{widget.title}</div>
                <KpiIcon name={asIcon(widget.icon)} tone={asTone(widget.tone)} />
              </div>
              <div className="mt-1 text-[26px] font-bold tracking-tight text-[var(--text)]">
                <CountUp to={num(data.value)} duration={1.1} />
              </div>
              <div className="mt-1 text-[11px] text-[var(--accent)]">{widget.subtitle ?? 'Open'} →</div>
            </div>
          </SpotlightCard>
        </button>
      </AnimatedContent>
    )
  }

  if (widget.type === 'SHORTCUTS') {
    const items = (data.items as { menuCode: string; label: string; path: string }[]) ?? []
    return (
      <FadeContent className={colClass(widget.colSpan)}>
        <Card className="mb-0">
          <CardHeader title={widget.title} subtitle={widget.subtitle} />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => (
                <Link
                  key={s.menuCode}
                  to={s.path}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </FadeContent>
    )
  }

  if (widget.code === 'CHART_STOCK_BY_STORE') {
    const series = ((data.series as { label: string; value: number }[]) ?? []).map((s) => ({
      label: String(s.label),
      value: num(s.value),
    }))
    return (
      <FadeContent className={colClass(widget.colSpan)}>
        <Card className="mb-0 h-full">
          <CardHeader title={widget.title} subtitle={widget.subtitle} />
          <CardBody>
            <RankedBars series={series} />
            {widget.linkPath && (
              <div className="mt-3 text-right">
                <Link to={widget.linkPath} className="text-[11.5px] font-semibold text-[var(--accent)] hover:underline">
                  Open →
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </FadeContent>
    )
  }

  if (widget.code === 'CHART_DOC_BY_TYPE') {
    const series = ((data.series as { label: string; value: number }[]) ?? []).map((s) => ({
      label: String(s.label),
      value: num(s.value),
    }))
    return (
      <FadeContent className={colClass(widget.colSpan)}>
        <Card className="mb-0 h-full">
          <CardHeader title={widget.title} subtitle={widget.subtitle} />
          <CardBody>
            <DocMix series={series} />
            {widget.linkPath && (
              <div className="mt-3 text-right">
                <Link to={widget.linkPath} className="text-[11.5px] font-semibold text-[var(--accent)] hover:underline">
                  Open →
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </FadeContent>
    )
  }

  if (widget.code === 'PANEL_STOCK_HEALTH') {
    return (
      <FadeContent className={colClass(widget.colSpan)}>
        <Card className="mb-0 h-full">
          <CardHeader title={widget.title} subtitle={widget.subtitle} />
          <CardBody>
            <HealthBar inStock={num(data.inStock)} low={num(data.low)} out={num(data.out)} />
          </CardBody>
        </Card>
      </FadeContent>
    )
  }

  if (widget.code === 'LIST_STOCK_FOCUS') {
    const rows = ((data.rows as Record<string, unknown>[]) ?? []).map((r) => ({
      id: (r.id as string | number) ?? Math.random(),
      itemCode: String(r.itemCode ?? ''),
      itemName: String(r.itemName ?? ''),
      store: String(r.store ?? ''),
      closing: num(r.closing),
      status: String(r.status ?? ''),
    }))
    return (
      <FadeContent className={colClass(widget.colSpan)}>
        <Card className="mb-0 h-full">
          <CardHeader title={String(data.title ?? widget.title)} subtitle={String(data.subtitle ?? widget.subtitle ?? '')} />
          <CardBody>
            <StockList rows={rows} />
            {widget.linkPath && (
              <div className="mt-2 text-right">
                <Link to={widget.linkPath} className="text-[11.5px] font-semibold text-[var(--accent)] hover:underline">
                  See all →
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </FadeContent>
    )
  }

  if (widget.code === 'LIST_RECENT_ACTIVITY') {
    const rows = ((data.rows as Record<string, unknown>[]) ?? []).map((r) => ({
      id: (r.id as string | number) ?? Math.random(),
      txnType: String(r.txnType ?? ''),
      txnNo: String(r.txnNo ?? ''),
      item: String(r.item ?? ''),
      date: String(r.date ?? ''),
      qty: num(r.qty),
      status: String(r.status ?? ''),
    }))
    return (
      <FadeContent className={colClass(widget.colSpan)}>
        <Card className="mb-0 h-full">
          <CardHeader title={widget.title} subtitle={widget.subtitle} />
          <CardBody className="!px-0 !pb-0 !pt-1">
            <ActivityList rows={rows} />
            {widget.linkPath && (
              <div className="border-t border-[var(--border)] px-3.5 py-2.5 text-right">
                <Link to={widget.linkPath} className="text-[11px] font-semibold text-[var(--accent)] hover:underline">
                  Trail →
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </FadeContent>
    )
  }

  return null
}

export function DashboardPage() {
  const [home, setHome] = useState<DashboardHome | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const reload = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      if (force) invalidateDashboardSummary()
      const next = await fetchDashboardHome()
      setHome(next)
      setUpdatedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      setHome(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const widgets = useMemo(() => home?.widgets ?? [], [home])
  const kpiWidgets = widgets.filter((w) => w.type === 'KPI')
  const otherWidgets = widgets.filter((w) => w.type !== 'KPI')

  return (
    <div>
      <PageHeader
        title={home?.title ?? 'Dashboard'}
        description={
          home
            ? `${home.description} · Role ${home.roleName}`
            : 'Loading your role-based dashboard…'
        }
        actions={
          <div className="flex items-center gap-2">
            {updatedAt && (
              <span className="text-[11px] text-[var(--text3)]">
                Updated {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button variant="ghost" onClick={() => void reload(true)} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-3 rounded-xl border border-[#fecaca] bg-[var(--danger-lt)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--danger)]">
          {error}
        </div>
      )}

      {!loading && widgets.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-[var(--border2)] bg-[var(--surface2)] px-4 py-10 text-center text-[13px] text-[var(--text3)]">
          No dashboard widgets to show for your role and menus yet.
          Sign out and sign in again after widgets are mapped, or click Refresh.
          Admins can assign widgets in <code>dash_role_widget_dtl</code>.
        </div>
      )}

      {kpiWidgets.length > 0 && (
        <div className="mb-4 grid grid-cols-12 gap-3">
          {kpiWidgets.map((w, i) => (
            <WidgetCard key={w.code} widget={w} index={i} />
          ))}
        </div>
      )}

      {otherWidgets.length > 0 && (
        <div className="grid grid-cols-12 gap-3">
          {otherWidgets.map((w, i) => (
            <WidgetCard key={w.code} widget={w} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
