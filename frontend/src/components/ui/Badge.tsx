export function StatusBadge({ status }: { status: string }) {
  const active = status === 'Active'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
        active
          ? 'bg-[var(--success-lt)] text-[var(--success)]'
          : 'bg-[var(--border)] text-[var(--text3)]'
      }`}
    >
      <span
        className={`h-[5px] w-[5px] shrink-0 rounded-full ${
          active ? 'bg-[var(--success)]' : 'bg-[var(--text3)]'
        }`}
      />
      {status}
    </span>
  )
}

export type PillTone =
  | 'warm'
  | 'sky'
  | 'blue'
  | 'green'
  | 'teal'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'slate'
  | 'red'

const TONE_CLASS: Record<PillTone, string> = {
  warm: 'border-[var(--warm-mid)]/50 bg-[var(--warm-lt)] text-[var(--warm-deep)]',
  sky: 'border-sky-300/70 bg-sky-50 text-sky-700',
  blue: 'border-blue-300/70 bg-blue-50 text-blue-700',
  green: 'border-emerald-300/70 bg-emerald-50 text-emerald-700',
  teal: 'border-teal-300/70 bg-teal-50 text-teal-800',
  violet: 'border-violet-300/70 bg-violet-50 text-violet-700',
  rose: 'border-rose-300/70 bg-rose-50 text-rose-700',
  amber: 'border-amber-300/70 bg-amber-50 text-amber-800',
  slate: 'border-slate-300/70 bg-slate-100 text-slate-600',
  red: 'border-red-300/70 bg-red-50 text-red-700',
}

/** Soft colored chip. Defaults to warm (brand) when tone is omitted. */
export function Pill({ children, tone = 'warm' }: { children: string; tone?: PillTone }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  )
}

const DOC_TYPE_TONE: Record<string, PillTone> = {
  OPENING_STOCK: 'sky',
  GRN: 'green',
  MATERIAL_REQUISITION: 'violet',
  MATERIAL_ISSUE: 'amber',
  MATERIAL_TRANSFER: 'blue',
  MATERIAL_RETURN: 'rose',
  GATEPASS_INWARD: 'teal',
  GATEPASS_OUTWARD: 'red',
  GATEPASS: 'teal',
}

/** Multicolor badge for transaction / document type codes. */
export function DocTypeBadge({ type }: { type: string }) {
  const key = (type || '').trim().toUpperCase()
  return <Pill tone={DOC_TYPE_TONE[key] ?? 'slate'}>{type || '—'}</Pill>
}

const STATUS_TONE: Record<string, PillTone> = {
  draft: 'slate',
  pending: 'amber',
  'in pending': 'amber',
  requested: 'sky',
  submitted: 'sky',
  'pending approval': 'amber',
  approved: 'green',
  posted: 'teal',
  completed: 'green',
  issued: 'violet',
  transferred: 'teal',
  returned: 'sky',
  rejected: 'red',
  cancelled: 'rose',
  canceled: 'rose',
  active: 'green',
  inactive: 'slate',
  'in stock': 'green',
  'low stock': 'amber',
  'out of stock': 'red',
  in_store: 'sky',
  assigned: 'violet',
  issued_to: 'amber',
}

/** Multicolor badge for workflow / stock statuses. */
export function StatusPill({ status }: { status: string }) {
  const key = (status || '').trim().toLowerCase()
  return <Pill tone={STATUS_TONE[key] ?? 'warm'}>{status || '—'}</Pill>
}
