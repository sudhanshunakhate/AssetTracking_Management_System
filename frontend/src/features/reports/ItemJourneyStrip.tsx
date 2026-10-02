import { DocTypeBadge, StatusPill } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export type JourneyStep = {
  id: string
  docId: string
  date: string
  txnType: string
  txnNo: string
  status: string
  fromLocation: string
  toLocation: string
}

function formatShortDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function ItemJourneyStrip({
  itemLabel,
  serialNo,
  steps,
  onOpenDoc,
}: {
  itemLabel: string
  serialNo?: string
  steps: JourneyStep[]
  onOpenDoc: (docId: string, txnType: string) => void
}) {
  return (
    <Card className="mb-3 overflow-visible">
      <CardHeader
        title="Item journey"
        subtitle={
          serialNo
            ? `Horizontal flow for ${itemLabel} · serial ${serialNo}`
            : `Horizontal flow for ${itemLabel}`
        }
      />
      <CardBody className="p-0">
        <div className="flex min-h-[112px]">
          <div className="sticky left-0 z-[2] flex w-[140px] shrink-0 flex-col justify-center border-r border-[var(--border)] bg-[var(--surface2)] px-3 py-3">
            <div className="text-[10px] font-bold tracking-[0.5px] text-[var(--text3)] uppercase">
              Focus
            </div>
            <div className="mt-1 truncate text-[12px] font-semibold text-[var(--text)]" title={itemLabel}>
              {itemLabel || 'Item'}
            </div>
            {serialNo ? (
              <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--text2)]" title={serialNo}>
                {serialNo}
              </div>
            ) : (
              <div className="mt-0.5 text-[10.5px] text-[var(--text3)]">All serials</div>
            )}
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto overscroll-contain px-3 py-3">
            {steps.length === 0 ? (
              <div className="flex h-full min-h-[80px] items-center text-[12.5px] text-[var(--text3)]">
                No movements for this item/serial in the selected filters.
              </div>
            ) : (
              <ol className="flex min-w-min items-stretch gap-0">
                {steps.map((step, index) => {
                  const canOpen = Boolean(step.docId)
                  return (
                    <li key={step.id} className="flex items-center">
                      <button
                        type="button"
                        disabled={!canOpen}
                        onClick={() => {
                          if (canOpen) onOpenDoc(step.docId, step.txnType)
                        }}
                        className={`w-[200px] shrink-0 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left shadow-[var(--sh)] transition ${
                          canOpen
                            ? 'cursor-pointer hover:border-[var(--accent)] hover:bg-[#f0f5ff]'
                            : 'cursor-default opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <DocTypeBadge type={step.txnType} />
                          <span className="text-[10.5px] text-[var(--text3)]">
                            {formatShortDate(step.date)}
                          </span>
                        </div>
                        <div className="mt-1.5 truncate font-mono text-[11.5px] font-semibold text-[var(--text)]">
                          {step.txnNo || '—'}
                        </div>
                        <div className="mt-1 truncate text-[10.5px] text-[var(--text2)]" title={`${step.fromLocation} → ${step.toLocation}`}>
                          {step.fromLocation || '—'} → {step.toLocation || '—'}
                        </div>
                        <div className="mt-1.5">
                          <StatusPill status={step.status || '—'} />
                        </div>
                      </button>
                      {index < steps.length - 1 && (
                        <div
                          className="mx-1.5 flex h-[2px] w-6 shrink-0 items-center bg-[var(--border2)]"
                          aria-hidden
                        >
                          <span className="ml-auto block h-0 w-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-[var(--border2)]" />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
