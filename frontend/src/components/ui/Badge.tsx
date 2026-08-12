export function StatusBadge({ status }: { status: string }) {
  return <StatusPill status={status} />
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

const TONE_CYCLE: PillTone[] = ['sky', 'blue', 'green', 'teal', 'violet', 'rose', 'amber', 'warm']

const KNOWN_LABEL_TONE: Record<string, PillTone> = {
  asset: 'sky',
  consumable: 'amber',
  inventory: 'amber',
  vendor: 'teal',
  customer: 'violet',
  supplier: 'teal',
  active: 'green',
  inactive: 'slate',
  yes: 'green',
  no: 'slate',
  y: 'green',
  n: 'slate',
  returnable: 'teal',
  'non returnable': 'rose',
  department: 'violet',
  employee: 'sky',
}

/** Stable multicolor tone from a free-text label (roles, types, flags, etc.). */
export function toneForLabel(label: string): PillTone {
  const key = (label || '').trim().toLowerCase()
  if (!key) return 'slate'
  if (KNOWN_LABEL_TONE[key]) return KNOWN_LABEL_TONE[key]
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return TONE_CYCLE[h % TONE_CYCLE.length]
}

/** Soft colored chip. Picks a stable tone from the label when tone is omitted. */
export function Pill({ children, tone }: { children: string; tone?: PillTone }) {
  const resolved = tone ?? toneForLabel(children)
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${TONE_CLASS[resolved]}`}
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

const DOC_TYPE_LABEL: Record<string, string> = {
  OPENING_STOCK: 'Opening Stock',
  GRN: 'GRN',
  MATERIAL_REQUISITION: 'Store Requisition',
  MATERIAL_ISSUE: 'Store Issue',
  MATERIAL_TRANSFER: 'Material Transfer',
  MATERIAL_RETURN: 'Material Return',
  GATEPASS_INWARD: 'Gatepass Inward',
  GATEPASS_OUTWARD: 'Gatepass Outward',
  GATEPASS: 'Gatepass',
}

/** Multicolor badge for transaction / document type codes. */
export function DocTypeBadge({ type }: { type: string }) {
  const key = (type || '').trim().toUpperCase()
  const label = DOC_TYPE_LABEL[key] ?? (type || '—')
  return <Pill tone={DOC_TYPE_TONE[key] ?? 'slate'}>{label}</Pill>
}

const STATUS_TONE: Record<string, PillTone> = {
  draft: 'slate',
  pending: 'amber',
  'in pending': 'amber',
  'pending for outward': 'amber',
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
  y: 'teal',
  n: 'rose',
  returnable: 'teal',
  'non-returnable': 'rose',
  'non returnable': 'rose',
}

/** Multicolor badge for workflow / stock statuses. */
export function StatusPill({ status }: { status: string }) {
  const key = (status || '').trim().toLowerCase()
  return <Pill tone={STATUS_TONE[key] ?? toneForLabel(status)}>{status || '—'}</Pill>
}
