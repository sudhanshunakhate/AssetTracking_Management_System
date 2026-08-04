import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatedContent, CountUp, FadeContent, SpotlightCard } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { mapLocation, useMasterList } from '@/api/masters'
import {
  fetchDashboardSummary,
  fetchFullReport,
  fetchStockRegister,
  invalidateDashboardSummary,
  type DashboardSummary,
} from '@/api/transactions'

const emptySummary: DashboardSummary = {
  totalItems: 0,
  totalVendors: 0,
  totalTransactions: 0,
  lowStockCount: 0,
  stockRows: 0,
}

type KpiTone = 'sky' | 'blue' | 'warm' | 'danger' | 'success'

const TONE: Record<KpiTone, { color: string; soft: string; ring: string; glow: string }> = {
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
  success: {
    color: 'var(--success)',
    soft: 'var(--success-lt)',
    ring: 'rgba(5, 150, 105, 0.35)',
    glow: 'rgba(5, 150, 105, 0.22)',
  },
}

const DOC_LABEL: Record<string, string> = {
  OPENING_STOCK: 'Opening Stock',
  MATERIAL_REQUISITION: 'Requisition',
  GRN: 'GRN',
  GATEPASS_INWARD: 'GP Inward',
  GATEPASS_OUTWARD: 'GP Outward',
  MATERIAL_ISSUE: 'Issue',
  MATERIAL_TRANSFER: 'Transfer',
  MATERIAL_RETURN: 'Return',
}

const CHART_COLORS = [
  'var(--accent)',
  'var(--warm)',
  'var(--accent-deep)',
  'var(--success)',
  '#8b5cf6',
  '#14b8a6',
  '#f59e0b',
  '#64748b',
]

type StockRow = {
  id: string
  itemCode: string
  itemName: string
  store: string
  closing: number
  status: string
}

type ActivityRow = {
  id: string
  date: string
  txnType: string
  txnNo: string
  item: string
  qty: number
  status: string
}

type ChartSlice = { label: string; value: number; color: string }

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

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-[88px] items-center justify-center rounded-xl border border-dashed border-[var(--border2)] bg-[var(--surface2)] px-4 text-center text-[12.5px] text-[var(--text3)]">
      {message}
    </div>
  )
}

/** Nice round axis ceiling (10 / 20 / 25 / 50 …). */
function niceMax(raw: number) {
  if (raw <= 0) return 1
  const exp = Math.floor(Math.log10(raw))
  const base = 10 ** exp
  const n = raw / base
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * base
}

type NamedValue = { label: string; value: number; color?: string }

function ChartViewSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex shrink-0 items-center gap-1.5 text-[10.5px] text-[var(--text3)]">
      <span className="hidden sm:inline">View</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border2)] bg-[var(--surface)] px-2 py-1 text-[11.5px] font-semibold text-[var(--text)] outline-none focus:border-[var(--accent)]"
        aria-label="Chart view"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function MetricHeader({
  value,
  label,
  right,
}: {
  value: string | number
  label: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <div>
        <div className="text-[22px] font-bold leading-none tracking-tight text-[var(--text)]">{value}</div>
        <div className="mt-1 text-[11px] text-[var(--text3)]">{label}</div>
      </div>
      {right}
    </div>
  )
}

function VerticalColumnChart({ data, valueLabel = 'Qty' }: { data: NamedValue[]; valueLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const ceiling = niceMax(Math.max(...data.map((d) => d.value), 1))
  const w = 420
  const h = 200
  const padL = 28
  const padB = 44
  const padT = 20
  const padR = 8
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const gap = 12
  const barW = data.length ? (chartW - gap * (data.length - 1)) / data.length : chartW

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img">
        {[0, 0.5, 1].map((t) => {
          const y = padT + chartH * (1 - t)
          return (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize={9} fill="var(--text3)">
                {Math.round(ceiling * t)}
              </text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const bh = (d.value / ceiling) * chartH
          const x = padL + i * (barW + gap)
          const y = padT + chartH - bh
          const color = d.color ?? CHART_COLORS[i % CHART_COLORS.length]
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(bh, 2)}
                rx={7}
                fill={color}
                opacity={hover == null || hover === i ? 1 : 0.35}
              />
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill="var(--text)"
              >
                {d.value}
              </text>
              <text
                x={x + barW / 2}
                y={h - 14}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fill="var(--text2)"
              >
                {d.label.length > 9 ? `${d.label.slice(0, 8)}…` : d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover != null && data[hover] && (
        <div className="pointer-events-none absolute top-1 right-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] shadow-[var(--sh)]">
          <span className="font-semibold text-[var(--text)]">{data[hover].label}</span>
          <span className="ml-2 text-[var(--text2)]">
            {valueLabel}: {data[hover].value}
          </span>
        </div>
      )}
    </div>
  )
}

function DonutShareChart({ data }: { data: NamedValue[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const size = 168
  const cx = size / 2
  const cy = size / 2
  const r = 58
  const stroke = 20

  let angle = -Math.PI / 2
  const arcs = data.map((d, i) => {
    const raw = (d.value / total) * Math.PI * 2
    const sweep = Math.min(raw, Math.PI * 2 - 0.001)
    const start = angle
    const end = angle + sweep
    angle = end
    const large = sweep > Math.PI ? 1 : 0
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    return {
      ...d,
      i,
      color: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
      pct: Math.round((d.value / total) * 100),
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
    }
  })
  const focus = hover != null ? arcs[hover] : null

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[168px] w-[168px] shrink-0" role="img">
        {arcs.map((a) => (
          <path
            key={a.label}
            d={a.path}
            fill="none"
            stroke={a.color}
            strokeWidth={hover === a.i ? stroke + 3 : stroke}
            opacity={hover == null || hover === a.i ? 1 : 0.35}
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="var(--surface)" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text)">
          {focus ? focus.value : total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="var(--text3)">
          {focus ? `${focus.pct}%` : 'total'}
        </text>
      </svg>
      <ul className="m-0 max-h-[180px] w-full flex-1 list-none space-y-1 overflow-y-auto p-0">
        {arcs.map((a) => (
          <li key={a.label}>
            <button
              type="button"
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] ${
                hover === a.i ? 'bg-[var(--accent-lt)]' : 'hover:bg-[var(--surface2)]'
              }`}
              onMouseEnter={() => setHover(a.i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
              <span className="min-w-0 flex-1 truncate font-semibold text-[var(--text)]">{a.label}</span>
              <span className="font-mono text-[11px] text-[var(--text2)]">
                {a.value} · {a.pct}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

type StoreView = 'ranked' | 'columns' | 'donut'
type DocView = 'mix' | 'donut' | 'columns'

const STORE_VIEW_OPTIONS = [
  { value: 'ranked', label: 'Ranked bars' },
  { value: 'columns', label: 'Column chart' },
  { value: 'donut', label: 'Share donut' },
]

const DOC_VIEW_OPTIONS = [
  { value: 'mix', label: 'Mix + list' },
  { value: 'donut', label: 'Donut' },
  { value: 'columns', label: 'Column chart' },
]

function StoreStockChart({ data, view }: { data: NamedValue[]; view: StoreView }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const ceiling = niceMax(Math.max(...data.map((d) => d.value), 1))
  const colored = data.map((d, i) => ({
    ...d,
    color: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
  }))

  if (!data.length) {
    return <EmptyChart message="No stock positions yet — post Opening Stock or GRN to see bars." />
  }

  if (view === 'columns') {
    return (
      <div className="space-y-3">
        <MetricHeader
          value={Math.round(total * 100) / 100}
          label="total qty across stores"
          right={<span className="text-[10.5px] text-[var(--text3)]">0 – {ceiling}</span>}
        />
        <VerticalColumnChart data={colored} valueLabel="On hand" />
      </div>
    )
  }

  if (view === 'donut') {
    return (
      <div className="space-y-3">
        <MetricHeader value={Math.round(total * 100) / 100} label="total qty across stores" />
        <DonutShareChart data={colored} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <MetricHeader
        value={Math.round(total * 100) / 100}
        label="total qty across stores"
        right={<span className="text-[10.5px] text-[var(--text3)]">Scale 0 – {ceiling}</span>}
      />
      <ul className="m-0 list-none space-y-2.5 p-0">
        {colored.map((d, i) => {
          const pctOfMax = Math.max((d.value / ceiling) * 100, d.value > 0 ? 2 : 0)
          const share = total ? Math.round((d.value / total) * 100) : 0
          const active = hover === i
          return (
            <li key={d.label}>
              <button
                type="button"
                className={`w-full rounded-xl px-2.5 py-2 text-left transition ${
                  active ? 'bg-[var(--accent-lt)]' : 'hover:bg-[var(--surface2)]'
                }`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white"
                      style={{ background: d.color }}
                    >
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
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${pctOfMax}%`,
                      background: `linear-gradient(90deg, ${d.color} 0%, color-mix(in srgb, ${d.color} 70%, white) 100%)`,
                    }}
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DocTypeChart({ data, view }: { data: ChartSlice[]; view: DocView }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  if (!total) {
    return <EmptyChart message="No transactions yet — create a document to populate this chart." />
  }

  const rows = data.map((d, i) => ({
    ...d,
    i,
    pct: Math.round((d.value / total) * 100),
  }))
  const focus = hover != null ? rows[hover] : null

  if (view === 'donut') {
    return (
      <div className="space-y-3">
        <MetricHeader value={total} label="unique documents" />
        <DonutShareChart data={rows} />
      </div>
    )
  }

  if (view === 'columns') {
    return (
      <div className="space-y-3">
        <MetricHeader value={total} label="unique documents" />
        <VerticalColumnChart data={rows} valueLabel="Docs" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[22px] font-bold leading-none tracking-tight text-[var(--text)]">
            {focus ? focus.value : total}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text3)]">
            {focus ? focus.label : 'unique documents'}
          </div>
        </div>
        {focus && (
          <div className="rounded-full bg-[var(--surface2)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--text2)]">
            {focus.pct}% of trail
          </div>
        )}
      </div>

      <div
        className="flex h-3.5 overflow-hidden rounded-full ring-1 ring-[var(--border)]"
        role="img"
        aria-label="Document type mix"
      >
        {rows.map((r) => (
          <button
            key={r.label}
            type="button"
            title={`${r.label}: ${r.value} (${r.pct}%)`}
            className="h-full border-0 p-0 transition-[filter,opacity] duration-150"
            style={{
              width: `${(r.value / total) * 100}%`,
              background: r.color,
              opacity: hover == null || hover === r.i ? 1 : 0.35,
              filter: hover === r.i ? 'brightness(1.08)' : undefined,
            }}
            onMouseEnter={() => setHover(r.i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </div>

      <ul className="m-0 max-h-[220px] list-none space-y-1 overflow-y-auto p-0">
        {rows.map((r) => (
          <li key={r.label}>
            <button
              type="button"
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                hover === r.i ? 'bg-[var(--accent-lt)]' : 'hover:bg-[var(--surface2)]'
              }`}
              onMouseEnter={() => setHover(r.i)}
              onMouseLeave={() => setHover(null)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
                style={{ background: r.color, boxShadow: `0 0 0 1px ${r.color}` }}
              />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[var(--text)]">
                {r.label}
              </span>
              <span className="shrink-0 font-mono text-[12px] font-bold text-[var(--text)]">{r.value}</span>
              <span className="w-10 shrink-0 text-right text-[11px] text-[var(--text3)]">{r.pct}%</span>
            </button>
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
    { key: 'in', label: 'In stock', short: 'OK', value: inStock, color: 'var(--success)', soft: 'var(--success-lt)' },
    { key: 'low', label: 'Low', short: 'Low', value: low, color: 'var(--warning)', soft: 'var(--warning-lt)' },
    { key: 'out', label: 'Out', short: 'Out', value: out, color: 'var(--danger)', soft: 'var(--danger-lt)' },
  ] as const

  const healthyPct = Math.round((inStock / total) * 100)
  const attention = low + out

  return (
    <div className="space-y-3.5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[28px] font-bold leading-none tracking-tight text-[var(--text)]">{total}</div>
          <div className="mt-1 text-[11.5px] text-[var(--text2)]">positions tracked</div>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            attention === 0
              ? 'bg-[var(--success-lt)] text-[var(--success)]'
              : 'bg-[var(--warning-lt)] text-[var(--warning)]'
          }`}
        >
          {attention === 0 ? `${healthyPct}% healthy` : `${attention} need attention`}
        </div>
      </div>

      <div
        className="flex h-3 overflow-hidden rounded-full bg-[var(--bg)] ring-1 ring-[var(--border)]"
        role="img"
        aria-label={`In stock ${inStock}, low ${low}, out ${out}`}
      >
        {parts.map((p) =>
          p.value > 0 ? (
            <div
              key={p.key}
              title={`${p.label}: ${p.value} (${Math.round((p.value / total) * 100)}%)`}
              className="h-full transition-[width] duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            />
          ) : null,
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {parts.map((p) => {
          const pct = Math.round((p.value / total) * 100)
          return (
            <div
              key={p.key}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2.5 text-center"
            >
              <div
                className="mx-auto mb-1.5 h-1.5 w-8 rounded-full"
                style={{ background: p.color }}
                aria-hidden
              />
              <div className="text-[20px] font-bold leading-none text-[var(--text)]">{p.value}</div>
              <div className="mt-1 text-[10px] font-semibold tracking-wide text-[var(--text3)] uppercase">
                {p.short}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-[var(--text3)]">{pct}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopStockList({ rows }: { rows: StockRow[] }) {
  if (!rows.length) {
    return (
      <div className="px-1 py-6 text-center text-[12.5px] text-[var(--text3)]">No stock rows yet.</div>
    )
  }
  const max = Math.max(...rows.map((r) => r.closing), 1)
  return (
    <ul className="m-0 space-y-2 p-0 list-none">
      {rows.map((r, i) => (
        <li
          key={r.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--accent-lt)] text-[10px] font-bold text-[var(--accent)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold text-[var(--text)]" title={r.itemName}>
                    {r.itemName || r.itemCode}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-[var(--text3)]">
                    <span className="font-mono">{r.itemCode}</span>
                    <span>·</span>
                    <span className="rounded bg-[var(--surface2)] px-1.5 py-0.5 font-medium text-[var(--text2)]">
                      {r.store}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[14px] font-bold text-[var(--text)]">{r.closing}</div>
                  <div
                    className={`text-[9.5px] font-semibold uppercase ${
                      r.status === 'Low Stock'
                        ? 'text-[var(--warning)]'
                        : r.status === 'Out of Stock'
                          ? 'text-[var(--danger)]'
                          : 'text-[var(--success)]'
                    }`}
                  >
                    {r.status === 'In Stock' ? 'OK' : r.status}
                  </div>
                </div>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--bg)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.max((r.closing / max) * 100, 3)}%` }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function ActivityList({ rows }: { rows: ActivityRow[] }) {
  if (!rows.length) {
    return (
      <div className="px-1 py-6 text-center text-[12.5px] text-[var(--text3)]">
        No recent transactions. Try Opening Stock or GRN to start the trail.
      </div>
    )
  }
  return (
    <ul className="m-0 divide-y divide-[var(--border)] p-0 list-none">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 px-3.5 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[12px] font-semibold text-[var(--text)]">
                {DOC_LABEL[r.txnType] ?? r.txnType}
              </span>
              <span className="font-mono text-[11px] text-[var(--accent-deep)]">{r.txnNo}</span>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-[var(--text3)]">
              {r.item}
              {r.date ? ` · ${r.date}` : ''}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[12.5px] font-bold text-[var(--text)]">{r.qty}</div>
            <div className="text-[10px] text-[var(--text3)]">{r.status}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [stockRows, setStockRows] = useState<StockRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [txnTypeChart, setTxnTypeChart] = useState<ChartSlice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [storeView, setStoreView] = useState<StoreView>('ranked')
  const [docView, setDocView] = useState<DocView>('mix')

  const mapLoc = useCallback(mapLocation, [])
  const { rows: locations } = useMasterList('locations', mapLoc)
  const locById = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l])),
    [locations],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      invalidateDashboardSummary()
      const [sum, stockPage, txnPage] = await Promise.all([
        fetchDashboardSummary(),
        fetchStockRegister({ page: 1, pageSize: 200 }),
        fetchFullReport({ page: 1, pageSize: 200 }),
      ])
      setSummary(sum)

      const mappedStock: StockRow[] = (stockPage.data ?? []).map((r) => {
        const locationId = String(r.locationId ?? '')
        const loc = locById[locationId]
        return {
          id: String(r.id ?? `${r.itemId}-${r.locationId}`),
          itemCode: String(r.itemCode ?? ''),
          itemName: String(r.itemName ?? ''),
          store: loc?.code || loc?.name || locationId || '—',
          closing: Number(r.closing ?? 0),
          status: String(r.status ?? 'In Stock'),
        }
      })
      setStockRows(mappedStock)

      const allLines = txnPage.data ?? []
      const typeMap = new Map<string, number>()
      const seenDocs = new Set<string>()
      for (const r of allLines) {
        const no = String(r.txnNo ?? '')
        const type = String(r.txnType ?? 'OTHER')
        const key = `${type}|${no}`
        if (seenDocs.has(key)) continue
        seenDocs.add(key)
        typeMap.set(type, (typeMap.get(type) ?? 0) + 1)
      }
      setTxnTypeChart(
        [...typeMap.entries()]
          .map(([type, value], i) => ({
            label: DOC_LABEL[type] ?? type,
            value,
            color: CHART_COLORS[i % CHART_COLORS.length],
          }))
          .sort((a, b) => b.value - a.value),
      )

      setActivity(
        allLines
          .map((r) => ({
            id: String(r.id ?? `${r.txnNo}-${r.itemId}`),
            date: String(r.date ?? ''),
            txnType: String(r.txnType ?? ''),
            txnNo: String(r.txnNo ?? ''),
            item: String(r.item ?? '—'),
            qty: Number(r.qty ?? 0),
            status: String(r.status ?? ''),
          }))
          .sort((a, b) => String(b.date).localeCompare(String(a.date)))
          .slice(0, 8),
      )
      setUpdatedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      setSummary(emptySummary)
      setStockRows([])
      setActivity([])
      setTxnTypeChart([])
    } finally {
      setLoading(false)
    }
  }, [locById])

  useEffect(() => {
    void reload()
  }, [reload])

  const stockByStore = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of stockRows) {
      map.set(r.store, (map.get(r.store) ?? 0) + r.closing)
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [stockRows])

  const health = useMemo(() => {
    let inStock = 0
    let low = 0
    let out = 0
    for (const r of stockRows) {
      if (r.status === 'Out of Stock' || r.closing <= 0) out++
      else if (r.status === 'Low Stock') low++
      else inStock++
    }
    return { inStock, low, out }
  }, [stockRows])

  const topPositions = useMemo(
    () => [...stockRows].sort((a, b) => b.closing - a.closing).slice(0, 6),
    [stockRows],
  )

  const attentionRows = useMemo(
    () =>
      stockRows
        .filter((r) => r.status === 'Low Stock' || r.status === 'Out of Stock')
        .sort((a, b) => a.closing - b.closing)
        .slice(0, 6),
    [stockRows],
  )

  const kpis: {
    id: string
    label: string
    value: number
    hint: string
    icon: IconName
    tone: KpiTone
    motion: 'float' | 'pulse' | 'spin-soft' | 'bounce' | 'blink'
    to: string
  }[] = [
    {
      id: 'items',
      label: 'Total Items',
      value: summary.totalItems,
      hint: 'Open item master',
      icon: 'itemMaster',
      tone: 'sky',
      motion: 'float',
      to: '/masters/items',
    },
    {
      id: 'vendors',
      label: 'Vendors',
      value: summary.totalVendors,
      hint: 'Open vendor master',
      icon: 'vendorParty',
      tone: 'blue',
      motion: 'pulse',
      to: '/masters/vendors',
    },
    {
      id: 'txns',
      label: 'Transactions',
      value: summary.totalTransactions,
      hint: 'Full document trail',
      icon: 'materialTransfer',
      tone: 'warm',
      motion: 'spin-soft',
      to: '/reports/full-report',
    },
    {
      id: 'low',
      label: 'Low Stock',
      value: summary.lowStockCount,
      hint: 'Needs reorder attention',
      icon: 'lowStockAlert',
      tone: 'danger',
      motion: 'blink',
      to: '/reports/stock-register',
    },
    {
      id: 'stock',
      label: 'Stock Rows',
      value: summary.stockRows,
      hint: 'Stock register positions',
      icon: 'storeWiseStock',
      tone: 'success',
      motion: 'bounce',
      to: '/reports/stock-register',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live inventory pulse — click a KPI or use charts to explore stock and documents."
        actions={
          <div className="flex items-center gap-2">
            {updatedAt && (
              <span className="text-[11px] text-[var(--text3)]">
                Updated {updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button variant="ghost" onClick={() => void reload()} disabled={loading}>
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

      {summary.lowStockCount > 0 && (
        <FadeContent>
          <button
            type="button"
            onClick={() => navigate('/reports/stock-register')}
            className="mb-3 flex w-full items-center gap-3 rounded-xl border border-[var(--warm-mid)] bg-[var(--warm-lt)] px-3.5 py-2.5 text-left transition hover:brightness-[0.98]"
          >
            <Icon name="lowStockAlert" size={18} className="text-[var(--warm)]" />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold text-[var(--warm-deep)]">
                {summary.lowStockCount} item{summary.lowStockCount === 1 ? '' : 's'} at or below reorder
              </div>
              <div className="text-[11px] text-[var(--text2)]">
                Open Stock Register to review and plan replenishment.
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[var(--warm)]">View →</span>
          </button>
        </FadeContent>
      )}

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {kpis.map((kpi, i) => (
          <AnimatedContent key={kpi.id} delay={i * 0.05}>
            <button
              type="button"
              onClick={() => navigate(kpi.to)}
              className="w-full text-left"
              title={kpi.hint}
            >
              <SpotlightCard>
                <div className="p-4 transition hover:bg-[var(--surface2)]/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[11px] font-semibold tracking-[0.3px] text-[var(--text3)] uppercase">
                      {kpi.label}
                    </div>
                    <KpiIcon name={kpi.icon} tone={kpi.tone} motion={kpi.motion} />
                  </div>
                  <div className="mt-1 text-[26px] font-bold tracking-tight text-[var(--text)]">
                    {loading ? '—' : <CountUp to={kpi.value} duration={1.2} />}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--accent)]">{kpi.hint} →</div>
                </div>
              </SpotlightCard>
            </button>
          </AnimatedContent>
        ))}
      </div>

      {/* Charts row */}
      <div className="mb-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <FadeContent delay={0.05} className="xl:col-span-7">
          <Card className="mb-0 h-full">
            <CardHeader
              title="Stock by store"
              subtitle="Who holds the most on-hand quantity"
              actions={
                <ChartViewSelect
                  value={storeView}
                  onChange={(v) => setStoreView(v as StoreView)}
                  options={STORE_VIEW_OPTIONS}
                />
              }
            />
            <CardBody>
              <StoreStockChart data={stockByStore} view={storeView} />
              <div className="mt-3 text-right">
                <Link
                  to="/reports/stock-register"
                  className="text-[11.5px] font-semibold text-[var(--accent)] hover:underline"
                >
                  Stock Register →
                </Link>
              </div>
            </CardBody>
          </Card>
        </FadeContent>

        <FadeContent delay={0.08} className="xl:col-span-5">
          <Card className="mb-0 h-full">
            <CardHeader
              title="Documents by type"
              subtitle="Switch view to compare formats"
              actions={
                <ChartViewSelect
                  value={docView}
                  onChange={(v) => setDocView(v as DocView)}
                  options={DOC_VIEW_OPTIONS}
                />
              }
            />
            <CardBody>
              <DocTypeChart data={txnTypeChart} view={docView} />
              <div className="mt-3 text-right">
                <Link
                  to="/reports/full-report"
                  className="text-[11.5px] font-semibold text-[var(--accent)] hover:underline"
                >
                  Full Report →
                </Link>
              </div>
            </CardBody>
          </Card>
        </FadeContent>
      </div>

      {/* Health + top stock + activity */}
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <FadeContent delay={0.1} className="lg:col-span-4">
          <Card className="mb-0 h-full">
            <CardHeader title="Stock health" subtitle="How positions split across status" />
            <CardBody>
              <HealthBar inStock={health.inStock} low={health.low} out={health.out} />
            </CardBody>
          </Card>
        </FadeContent>

        <FadeContent delay={0.12} className="lg:col-span-4">
          <Card className="mb-0 h-full">
            <CardHeader
              title={attentionRows.length ? 'Low stock alerts' : 'Top stock'}
              subtitle={
                attentionRows.length
                  ? 'At or below reorder — replenish via GRN'
                  : 'Highest on-hand quantities'
              }
            />
            <CardBody>
              <TopStockList rows={attentionRows.length ? attentionRows : topPositions} />
              <div className="mt-2 flex items-center justify-between gap-2">
                {attentionRows.length > 0 && (
                  <Link
                    to="/transactions/grn"
                    className="text-[11.5px] font-semibold text-[var(--warm)] hover:underline"
                  >
                    + Create GRN
                  </Link>
                )}
                <Link
                  to="/reports/stock-register"
                  className="ml-auto text-[11.5px] font-semibold text-[var(--accent)] hover:underline"
                >
                  See all →
                </Link>
              </div>
            </CardBody>
          </Card>
        </FadeContent>

        <FadeContent delay={0.14} className="lg:col-span-4">
          <Card className="mb-0 h-full">
            <CardHeader title="Recent activity" subtitle="Latest document lines" />
            <CardBody className="!px-0 !pb-0 !pt-1">
              <ActivityList rows={activity} />
              <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] px-3.5 py-2.5">
                <Link
                  to="/transactions/opening-stock"
                  className="rounded-md bg-[var(--accent-lt)] px-2 py-1 text-[10.5px] font-semibold text-[var(--accent)]"
                >
                  + Opening
                </Link>
                <Link
                  to="/transactions/grn"
                  className="rounded-md bg-[var(--accent-lt)] px-2 py-1 text-[10.5px] font-semibold text-[var(--accent)]"
                >
                  + GRN
                </Link>
                <Link
                  to="/transactions/requisitions"
                  className="rounded-md bg-[var(--surface2)] px-2 py-1 text-[10.5px] font-semibold text-[var(--text2)]"
                >
                  + Requisition
                </Link>
                <Link
                  to="/reports/full-report"
                  className="ml-auto self-center text-[11px] font-semibold text-[var(--accent)] hover:underline"
                >
                  Trail →
                </Link>
              </div>
            </CardBody>
          </Card>
        </FadeContent>
      </div>
    </div>
  )
}
