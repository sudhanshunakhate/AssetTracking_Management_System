import { AnimatedContent, CountUp, FadeContent, SpotlightCard } from '@/components/react-bits'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill, StatusBadge } from '@/components/ui/Badge'
import { dashboardData } from '@/data/mock'

export function DashboardPage() {
  const maxCat = Math.max(...dashboardData.categoryValues.map((c) => c.value))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live snapshot of assets, inventory, stores and system activity."
      />

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        {dashboardData.kpis.map((kpi, i) => (
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

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <FadeContent delay={0.1}>
          <Card>
            <CardHeader
              title="Stock Value by Category"
              subtitle="Closing stock value across inventory categories"
            />
            <CardBody>
              <div className="space-y-3">
                {dashboardData.categoryValues.map((c) => (
                  <div key={c.name}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="font-medium text-[var(--text)]">{c.name}</span>
                      <span className="font-mono text-[var(--text2)]">₹{c.value}L</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface2)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${(c.value / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </FadeContent>

        <FadeContent delay={0.15}>
          <Card>
            <CardHeader title="Low Stock Alerts" subtitle="Items at or below reorder level" />
            <CardBody className="p-0">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--surface2)]">
                    {['Code', 'Item', 'Store', 'Qty', 'Reorder'].map((h) => (
                      <th
                        key={h}
                        className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.lowStock.map((row) => (
                    <tr key={row.code} className="hover:bg-[#f0f5ff]">
                      <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{row.code}</td>
                      <td className="border-b border-[var(--border)] px-3 py-2">{row.name}</td>
                      <td className="border-b border-[var(--border)] px-3 py-2">{row.store}</td>
                      <td className="border-b border-[var(--border)] px-3 py-2">
                        <Pill>{String(row.qty)}</Pill>
                      </td>
                      <td className="border-b border-[var(--border)] px-3 py-2">{row.reorder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </FadeContent>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest transactions across the system" />
          <CardBody className="p-0">
            <ul>
              {dashboardData.activity.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-3.5 py-3 last:border-0"
                >
                  <div>
                    <div className="text-[12.5px] font-medium text-[var(--text)]">{a.text}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--text3)]">{a.by}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-[var(--text3)]">{a.when}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Store-wise Stock" subtitle="Item count and value by store" />
          <CardBody className="p-0">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  {['Store', 'Items', 'Value (₹L)', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="border-b border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboardData.storeStock.map((s) => (
                  <tr key={s.code} className="hover:bg-[#f0f5ff]">
                    <td className="border-b border-[var(--border)] px-3 py-2">
                      <div className="font-medium">{s.name}</div>
                      <div className="font-mono text-[10px] text-[var(--text3)]">{s.code}</div>
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-2">{s.items}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{s.value}</td>
                    <td className="border-b border-[var(--border)] px-3 py-2">
                      <StatusBadge status="Active" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
